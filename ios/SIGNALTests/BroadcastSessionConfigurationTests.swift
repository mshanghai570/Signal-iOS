import XCTest

final class BroadcastSessionConfigurationTests: XCTestCase {
    private let serverURL = URL(string: "rtmps://a.rtmp.youtube.com/live2")!

    func testLandscapeLockCreatesLandscapeDimensions() throws {
        let configuration = try BroadcastSessionConfiguration(
            orientationLock: .landscapeLock,
            resolution: .fullHD,
            bitrate: 8_000_000,
            frameRate: 30,
            serverURL: serverURL
        )

        XCTAssertEqual(configuration.orientationLock, .landscapeLock)
        XCTAssertEqual(configuration.width, 1920)
        XCTAssertEqual(configuration.height, 1080)
    }

    func testPortraitLockTransposesEncoderAndCanvasDimensions() throws {
        let configuration = try BroadcastSessionConfiguration(
            orientationLock: .portraitLock,
            resolution: .fullHD,
            bitrate: 8_000_000,
            frameRate: 30,
            serverURL: serverURL
        )

        XCTAssertEqual(configuration.orientationLock, .portraitLock)
        XCTAssertEqual(configuration.width, 1080)
        XCTAssertEqual(configuration.height, 1920)
    }

    func testConfigurationRoundTripPreservesEveryImmutableVideoProperty() throws {
        let original = try BroadcastSessionConfiguration(
            orientationLock: .portraitLock,
            resolution: .quadHD,
            bitrate: 16_000_000,
            frameRate: 60,
            pixelFormat: .bgra,
            serverURL: serverURL
        )

        let decoded = try JSONDecoder().decode(
            BroadcastSessionConfiguration.self,
            from: JSONEncoder().encode(original)
        )

        XCTAssertEqual(decoded, original)
    }

    func testDecodedConfigurationRejectsDimensionsThatContradictLock() throws {
        let invalid = try JSONSerialization.data(withJSONObject: [
            "orientationLock": "portraitLock",
            "width": 1920,
            "height": 1080,
            "bitrate": 8_000_000,
            "frameRate": 30,
            "pixelFormat": "bgra",
            "serverURL": "rtmps://a.rtmp.youtube.com/live2",
        ])

        XCTAssertThrowsError(
            try JSONDecoder().decode(
                BroadcastSessionConfiguration.self,
                from: invalid
            )
        )
    }
}
