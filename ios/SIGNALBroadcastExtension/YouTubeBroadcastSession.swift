@preconcurrency import AVFoundation
@preconcurrency import HaishinKit
import Foundation
import RTMPHaishinKit
import VideoToolbox

actor YouTubeBroadcastSession {
    let configuration: BroadcastSessionConfiguration

    private let streamKey: String
    private let onUnrecoverableError: @Sendable (NSError) -> Void
    private let mixer = MediaMixer(captureSessionMode: .manual, multiTrackAudioMixingEnabled: true)
    private var connection: RTMPConnection?
    private var stream: RTMPStream?
    private var statusTask: Task<Void, Never>?
    private var reconnectTask: Task<Void, Never>?
    private var connectionGeneration = 0
    private var isStopping = false

    init(
        configuration: BroadcastSessionConfiguration,
        streamKey: String,
        onUnrecoverableError: @escaping @Sendable (NSError) -> Void
    ) {
        self.configuration = configuration
        self.streamKey = streamKey
        self.onUnrecoverableError = onUnrecoverableError
    }

    func start() async throws {
        isStopping = false
        try await connectAndPublish()
    }

    func appendVideo(_ sampleBuffer: CMSampleBuffer) async {
        guard let stream else { return }
        await stream.append(sampleBuffer)
    }

    func appendAudio(_ sampleBuffer: CMSampleBuffer) async {
        guard stream != nil, sampleBuffer.dataReadiness == .ready else { return }
        await mixer.append(sampleBuffer, track: 1)
    }

    func stop() async {
        isStopping = true
        reconnectTask?.cancel()
        statusTask?.cancel()
        reconnectTask = nil
        statusTask = nil
        if let stream {
            await mixer.removeOutput(stream)
        }
        await mixer.stopRunning()
        stream = nil
        if let connection {
            try? await connection.close()
        }
        self.connection = nil
    }

    private func connectAndPublish() async throws {
        connectionGeneration += 1
        let generation = connectionGeneration
        let connection = RTMPConnection(
            fourCcList: nil,
            videoFourCcInfoMap: nil,
            audioFourCcInfoMap: nil
        )
        let stream = RTMPStream(connection: connection)

        var videoSettings = await stream.videoSettings
        videoSettings.videoSize = configuration.canvasSize
        videoSettings.bitRate = configuration.bitrate
        videoSettings.profileLevel = kVTProfileLevel_H264_High_AutoLevel as String
        videoSettings.expectedFrameRate = Double(configuration.frameRate)
        videoSettings.frameInterval = max(0, (1 / Double(configuration.frameRate)) - 0.001)
        videoSettings.maxKeyFrameIntervalDuration = 2
        try await stream.setVideoSettings(videoSettings)
        await stream.setVideoInputBufferCounts(1)

        var audioSettings = await stream.audioSettings
        audioSettings.format = .aac
        audioSettings.bitRate = 128_000
        try await stream.setAudioSettings(audioSettings)

        var audioMixerSettings = await mixer.audioMixerSettings
        audioMixerSettings.mainTrack = 1
        audioMixerSettings.tracks[1] = .default
        await mixer.setAudioMixerSettings(audioMixerSettings)
        await mixer.startRunning()
        await mixer.addOutput(stream)

        do {
            try await connection.connect(configuration.serverURL.absoluteString)
            try await stream.publish(streamKey)
        } catch {
            await mixer.removeOutput(stream)
            try? await connection.close()
            throw error
        }

        self.connection = connection
        self.stream = stream
        observeStatus(of: connection, generation: generation)
    }

    private func observeStatus(of connection: RTMPConnection, generation: Int) {
        statusTask?.cancel()
        statusTask = Task { [weak self] in
            let statuses = await connection.status
            for await status in statuses {
                guard !Task.isCancelled else { return }
                if status.code == "NetConnection.Connect.Closed" ||
                    status.code == "NetConnection.Connect.Failed" ||
                    status.code == "NetConnection.Connect.Rejected" {
                    await self?.scheduleReconnect(for: generation)
                    return
                }
            }
        }
    }

    private func scheduleReconnect(for generation: Int) async {
        guard !isStopping, generation == connectionGeneration, reconnectTask == nil else { return }
        if let stream {
            await mixer.removeOutput(stream)
        }
        stream = nil
        connection = nil
        reconnectTask = Task { [weak self] in
            var lastError: NSError?
            for attempt in 1...3 {
                guard !Task.isCancelled else { return }
                try? await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
                do {
                    try await self?.connectAndPublish()
                    await self?.clearReconnectTask()
                    return
                } catch {
                    lastError = error as NSError
                }
            }
            if let lastError {
                await self?.reconnectFailed(with: lastError)
            }
        }
    }

    private func clearReconnectTask() {
        reconnectTask = nil
    }

    private func reconnectFailed(with error: NSError) {
        reconnectTask = nil
        onUnrecoverableError(error)
    }
}
