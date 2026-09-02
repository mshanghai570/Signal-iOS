import CoreGraphics
import CoreVideo
import Foundation

enum OrientationLock: String, Codable, CaseIterable, Identifiable, Sendable {
    case landscapeLock
    case portraitLock

    var id: Self { self }
}

enum OutputResolution: String, Codable, CaseIterable, Identifiable, Sendable {
    case hd = "1280×720"
    case fullHD = "1920×1080"
    case quadHD = "2560×1440"
    case ultraHD = "3840×2160"

    var id: Self { self }

    var landscapeDimensions: (width: Int, height: Int) {
        switch self {
        case .hd: (1280, 720)
        case .fullHD: (1920, 1080)
        case .quadHD: (2560, 1440)
        case .ultraHD: (3840, 2160)
        }
    }
}

enum OutputPixelFormat: String, Codable, Sendable {
    case bgra

    var osType: OSType { kCVPixelFormatType_32BGRA }
}

/// The sole source of output format truth for one broadcast session.
///
/// The extension snapshots this value at broadcast start. Every property is immutable so an
/// incoming ReplayKit orientation change cannot alter the outgoing stream format.
struct BroadcastSessionConfiguration: Codable, Equatable, Sendable {
    static let appGroupIdentifier = "group.com.signal.broadcast"
    static let preferredExtensionIdentifier = "com.signal.app.broadcast"

    let orientationLock: OrientationLock
    let width: Int
    let height: Int
    let bitrate: Int
    let frameRate: Int
    let pixelFormat: OutputPixelFormat
    let serverURL: URL

    var canvasSize: CGSize { CGSize(width: CGFloat(width), height: CGFloat(height)) }

    init(
        orientationLock: OrientationLock,
        resolution: OutputResolution,
        bitrate: Int,
        frameRate: Int,
        pixelFormat: OutputPixelFormat = .bgra,
        serverURL: URL
    ) throws {
        let landscape = resolution.landscapeDimensions
        let dimensions = orientationLock == .landscapeLock
            ? landscape
            : (width: landscape.height, height: landscape.width)

        try self.init(
            orientationLock: orientationLock,
            width: dimensions.width,
            height: dimensions.height,
            bitrate: bitrate,
            frameRate: frameRate,
            pixelFormat: pixelFormat,
            serverURL: serverURL
        )
    }

    init(
        orientationLock: OrientationLock,
        width: Int,
        height: Int,
        bitrate: Int,
        frameRate: Int,
        pixelFormat: OutputPixelFormat,
        serverURL: URL
    ) throws {
        guard width > 0, height > 0, bitrate > 0, frameRate > 0 else {
            throw ConfigurationError.invalidVideoSettings
        }
        guard orientationLock == .landscapeLock ? width > height : height > width else {
            throw ConfigurationError.dimensionsDoNotMatchOrientation
        }
        guard serverURL.scheme?.lowercased() == "rtmps", serverURL.host != nil else {
            throw ConfigurationError.invalidServerURL
        }

        self.orientationLock = orientationLock
        self.width = width
        self.height = height
        self.bitrate = bitrate
        self.frameRate = frameRate
        self.pixelFormat = pixelFormat
        self.serverURL = serverURL
    }

    func replacingDimensions(width: Int, height: Int) throws -> Self {
        try Self(
            orientationLock: orientationLock,
            width: width,
            height: height,
            bitrate: bitrate,
            frameRate: frameRate,
            pixelFormat: pixelFormat,
            serverURL: serverURL
        )
    }

    private enum CodingKeys: String, CodingKey {
        case orientationLock, width, height, bitrate, frameRate, pixelFormat, serverURL
    }

    init(from decoder: Decoder) throws {
        let values = try decoder.container(keyedBy: CodingKeys.self)
        try self.init(
            orientationLock: values.decode(OrientationLock.self, forKey: .orientationLock),
            width: values.decode(Int.self, forKey: .width),
            height: values.decode(Int.self, forKey: .height),
            bitrate: values.decode(Int.self, forKey: .bitrate),
            frameRate: values.decode(Int.self, forKey: .frameRate),
            pixelFormat: values.decode(OutputPixelFormat.self, forKey: .pixelFormat),
            serverURL: values.decode(URL.self, forKey: .serverURL)
        )
    }

    func encode(to encoder: Encoder) throws {
        var values = encoder.container(keyedBy: CodingKeys.self)
        try values.encode(orientationLock, forKey: .orientationLock)
        try values.encode(width, forKey: .width)
        try values.encode(height, forKey: .height)
        try values.encode(bitrate, forKey: .bitrate)
        try values.encode(frameRate, forKey: .frameRate)
        try values.encode(pixelFormat, forKey: .pixelFormat)
        try values.encode(serverURL, forKey: .serverURL)
    }
}

enum ConfigurationError: LocalizedError {
    case invalidVideoSettings
    case dimensionsDoNotMatchOrientation
    case invalidServerURL
    case missingConfiguration
    case missingStreamKey

    var errorDescription: String? {
        switch self {
        case .invalidVideoSettings: "Video dimensions, bitrate, and frame rate must be positive."
        case .dimensionsDoNotMatchOrientation: "Output dimensions do not match the selected orientation lock."
        case .invalidServerURL: "A valid RTMPS server URL is required."
        case .missingConfiguration: "Save broadcast settings in SIGNAL before starting the broadcast."
        case .missingStreamKey: "A YouTube stream key is required."
        }
    }
}
