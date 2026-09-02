import SwiftUI

struct BroadcastSetupView: View {
    @State private var orientationLock: OrientationLock = .landscapeLock
    @State private var resolution: OutputResolution = .fullHD
    @State private var bitrateMbps = 8
    @State private var frameRate = 30
    @State private var serverURL = "rtmps://a.rtmp.youtube.com/live2"
    @State private var streamKey = ""
    @State private var statusMessage = "Save settings before opening the system broadcast picker."
    @State private var hasSavedConfiguration = false

    var body: some View {
        NavigationView {
            Form {
                Section("Fixed outgoing orientation") {
                    Picker("Session mode", selection: $orientationLock) {
                        Text("Landscape Lock").tag(OrientationLock.landscapeLock)
                        Text("Portrait Lock").tag(OrientationLock.portraitLock)
                    }
                    .pickerStyle(.segmented)

                    Text("The extension snapshots this mode when broadcasting starts. Device and application rotation cannot change it during that session.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Section("Video") {
                    Picker("Resolution", selection: $resolution) {
                        ForEach(OutputResolution.allCases) { preset in
                            Text(preset.rawValue).tag(preset)
                        }
                    }
                    Stepper("Bitrate: \(bitrateMbps) Mbps", value: $bitrateMbps, in: 2...51)
                    Picker("Frame rate", selection: $frameRate) {
                        Text("30 fps").tag(30)
                        Text("60 fps").tag(60)
                    }
                }

                Section("YouTube Live") {
                    TextField("RTMPS server", text: $serverURL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    SecureField("Stream key", text: $streamKey)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                }

                Section {
                    Button("Save for Next Broadcast", action: saveConfiguration)

                    if hasSavedConfiguration {
                        HStack {
                            Text("Open Broadcast Picker")
                            Spacer()
                            BroadcastPickerView()
                                .frame(width: 44, height: 44)
                        }
                    }
                } footer: {
                    Text(statusMessage)
                }
            }
            .navigationTitle("SIGNAL")
            .onChange(of: orientationLock) { _ in configurationChanged() }
            .onChange(of: resolution) { _ in configurationChanged() }
            .onChange(of: bitrateMbps) { _ in configurationChanged() }
            .onChange(of: frameRate) { _ in configurationChanged() }
            .onChange(of: serverURL) { _ in configurationChanged() }
            .onChange(of: streamKey) { _ in configurationChanged() }
        }
    }

    private func configurationChanged() {
        guard hasSavedConfiguration else { return }
        hasSavedConfiguration = false
        statusMessage = "Settings changed. Save again before opening the broadcast picker."
    }

    private func saveConfiguration() {
        do {
            guard let destination = URL(string: serverURL) else {
                throw ConfigurationError.invalidServerURL
            }
            let configuration = try BroadcastSessionConfiguration(
                orientationLock: orientationLock,
                resolution: resolution,
                bitrate: bitrateMbps * 1_000_000,
                frameRate: frameRate,
                serverURL: destination
            )
            try SharedStreamKeyStore().save(streamKey)
            try AppGroupConfigurationStore().save(configuration)
            hasSavedConfiguration = true
            statusMessage = "Saved. These values will be immutable for the next broadcast session."
        } catch {
            hasSavedConfiguration = false
            statusMessage = error.localizedDescription
        }
    }
}
