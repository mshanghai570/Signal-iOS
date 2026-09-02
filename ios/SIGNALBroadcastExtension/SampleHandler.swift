@preconcurrency import CoreMedia
import Foundation
import ReplayKit

final class SampleHandler: RPBroadcastSampleHandler, @unchecked Sendable {
    private var pipeline: BroadcastPipeline?

    override func broadcastStarted(withSetupInfo setupInfo: [String: NSObject]?) {
        do {
            let requestedConfiguration = try AppGroupConfigurationStore().load()
            let resolvedConfiguration = try VideoCapabilityResolver.resolve(requestedConfiguration)
            let streamKey = try SharedStreamKeyStore().load()
            let pipeline = try BroadcastPipeline(
                configuration: resolvedConfiguration,
                streamKey: streamKey,
                onUnrecoverableError: { [weak self] error in
                    self?.finishBroadcastWithError(error)
                }
            )
            self.pipeline = pipeline

            Task { [weak self] in
                do {
                    try await pipeline.start()
                } catch {
                    self?.finishBroadcastWithError(error)
                }
            }
        } catch {
            finishBroadcastWithError(error)
        }
    }

    override func broadcastPaused() {}

    override func broadcastResumed() {}

    override func broadcastFinished() {
        let pipeline = self.pipeline
        self.pipeline = nil
        Task {
            await pipeline?.stop()
        }
    }

    override func processSampleBuffer(
        _ sampleBuffer: CMSampleBuffer,
        with sampleBufferType: RPSampleBufferType
    ) {
        switch sampleBufferType {
        case .video:
            pipeline?.processVideo(sampleBuffer)
        case .audioApp:
            pipeline?.processAudio(sampleBuffer)
        case .audioMic:
            break
        @unknown default:
            break
        }
    }
}

private final class BroadcastPipeline: @unchecked Sendable {
    let configuration: BroadcastSessionConfiguration

    private let normalizer: ReplayKitFrameNormalizer
    private let broadcastSession: YouTubeBroadcastSession
    private let videoGate = DispatchSemaphore(value: 1)
    private let audioGate = DispatchSemaphore(value: 1)

    init(
        configuration: BroadcastSessionConfiguration,
        streamKey: String,
        onUnrecoverableError: @escaping @Sendable (NSError) -> Void
    ) throws {
        self.configuration = configuration
        normalizer = try ReplayKitFrameNormalizer(configuration: configuration)
        broadcastSession = YouTubeBroadcastSession(
            configuration: configuration,
            streamKey: streamKey,
            onUnrecoverableError: onUnrecoverableError
        )
    }

    func start() async throws {
        try await broadcastSession.start()
    }

    func stop() async {
        await broadcastSession.stop()
    }

    func processVideo(_ source: CMSampleBuffer) {
        guard videoGate.wait(timeout: .now()) == .success else { return }

        let normalized: CMSampleBuffer
        do {
            normalized = try autoreleasepool {
                try normalizer.normalize(source)
            }
        } catch {
            videoGate.signal()
            return
        }

        Task { [broadcastSession, videoGate] in
            await broadcastSession.appendVideo(normalized)
            videoGate.signal()
        }
    }

    func processAudio(_ sampleBuffer: CMSampleBuffer) {
        guard audioGate.wait(timeout: .now()) == .success else { return }
        Task { [broadcastSession, audioGate] in
            await broadcastSession.appendAudio(sampleBuffer)
            audioGate.signal()
        }
    }
}
