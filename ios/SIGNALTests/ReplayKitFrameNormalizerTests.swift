import CoreMedia
import CoreVideo
import ImageIO
import ReplayKit
import XCTest

final class ReplayKitFrameNormalizerTests: XCTestCase {
    private let serverURL = URL(string: "rtmps://a.rtmp.youtube.com/live2")!

    func testEveryReplayKitOrientationProducesFixedLandscapeUprightOutput() throws {
        let orientations: [CGImagePropertyOrientation] = [
            .up, .upMirrored, .down, .downMirrored,
            .leftMirrored, .right, .rightMirrored, .left,
        ]

        for orientation in orientations {
            try autoreleasepool {
                let configuration = try makeConfiguration(lock: .landscapeLock)
                let normalizer = try ReplayKitFrameNormalizer(configuration: configuration)
                let input = try makeSampleBuffer(width: 720, height: 1280, orientation: orientation)
                let output = try normalizer.normalize(input)

                let imageBuffer = try XCTUnwrap(CMSampleBufferGetImageBuffer(output))
                XCTAssertEqual(CVPixelBufferGetWidth(imageBuffer), 1280, "Failed for \(orientation)")
                XCTAssertEqual(CVPixelBufferGetHeight(imageBuffer), 720, "Failed for \(orientation)")
                XCTAssertEqual(CVPixelBufferGetPixelFormatType(imageBuffer), kCVPixelFormatType_32BGRA)
                XCTAssertEqual(outputOrientation(output), .up, "Failed for \(orientation)")
            }
        }
    }

    func testEveryReplayKitOrientationProducesFixedPortraitUprightOutput() throws {
        let orientations: [CGImagePropertyOrientation] = [
            .up, .upMirrored, .down, .downMirrored,
            .leftMirrored, .right, .rightMirrored, .left,
        ]

        for orientation in orientations {
            try autoreleasepool {
                let configuration = try makeConfiguration(lock: .portraitLock)
                let normalizer = try ReplayKitFrameNormalizer(configuration: configuration)
                let input = try makeSampleBuffer(width: 1280, height: 720, orientation: orientation)
                let output = try normalizer.normalize(input)

                let imageBuffer = try XCTUnwrap(CMSampleBufferGetImageBuffer(output))
                XCTAssertEqual(CVPixelBufferGetWidth(imageBuffer), 720, "Failed for \(orientation)")
                XCTAssertEqual(CVPixelBufferGetHeight(imageBuffer), 1280, "Failed for \(orientation)")
                XCTAssertEqual(CVPixelBufferGetPixelFormatType(imageBuffer), kCVPixelFormatType_32BGRA)
                XCTAssertEqual(outputOrientation(output), .up, "Failed for \(orientation)")
            }
        }
    }

    func testFastPathReusesOriginalPixelBufferOnlyForExactUprightCanvas() throws {
        let configuration = try makeConfiguration(lock: .landscapeLock)
        let normalizer = try ReplayKitFrameNormalizer(configuration: configuration)
        let input = try makeSampleBuffer(width: 1280, height: 720, orientation: .up)
        let output = try normalizer.normalize(input)

        XCTAssertTrue(CFEqual(
            try XCTUnwrap(CMSampleBufferGetImageBuffer(input)),
            try XCTUnwrap(CMSampleBufferGetImageBuffer(output))
        ))
        XCTAssertEqual(outputOrientation(output), .up)
    }

    func testExactUprightCanvasWithWrongPixelFormatUsesConfiguredOutputFormat() throws {
        let configuration = try makeConfiguration(lock: .landscapeLock)
        let normalizer = try ReplayKitFrameNormalizer(configuration: configuration)
        let input = try makeSampleBuffer(
            width: 1280,
            height: 720,
            orientation: .up,
            pixelFormat: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange
        )
        let output = try normalizer.normalize(input)
        let imageBuffer = try XCTUnwrap(CMSampleBufferGetImageBuffer(output))

        XCTAssertEqual(CVPixelBufferGetPixelFormatType(imageBuffer), kCVPixelFormatType_32BGRA)
        XCTAssertEqual(outputOrientation(output), .up)
    }

    private func makeConfiguration(
        lock: OrientationLock
    ) throws -> BroadcastSessionConfiguration {
        try BroadcastSessionConfiguration(
            orientationLock: lock,
            resolution: .hd,
            bitrate: 4_000_000,
            frameRate: 30,
            serverURL: serverURL
        )
    }

    private func makeSampleBuffer(
        width: Int,
        height: Int,
        orientation: CGImagePropertyOrientation,
        pixelFormat: OSType = kCVPixelFormatType_32BGRA
    ) throws -> CMSampleBuffer {
        var pixelBuffer: CVPixelBuffer?
        let attributes: [CFString: Any] = [
            kCVPixelBufferIOSurfacePropertiesKey: [:] as CFDictionary,
            kCVPixelBufferMetalCompatibilityKey: true,
        ]
        XCTAssertEqual(
            CVPixelBufferCreate(
                kCFAllocatorDefault,
                width,
                height,
                pixelFormat,
                attributes as CFDictionary,
                &pixelBuffer
            ),
            kCVReturnSuccess
        )
        let imageBuffer = try XCTUnwrap(pixelBuffer)

        var formatDescription: CMVideoFormatDescription?
        XCTAssertEqual(
            CMVideoFormatDescriptionCreateForImageBuffer(
                allocator: kCFAllocatorDefault,
                imageBuffer: imageBuffer,
                formatDescriptionOut: &formatDescription
            ),
            noErr
        )

        var timing = CMSampleTimingInfo(
            duration: CMTime(value: 1, timescale: 30),
            presentationTimeStamp: .zero,
            decodeTimeStamp: .invalid
        )
        var sampleBuffer: CMSampleBuffer?
        XCTAssertEqual(
            CMSampleBufferCreateReadyWithImageBuffer(
                allocator: kCFAllocatorDefault,
                imageBuffer: imageBuffer,
                formatDescription: try XCTUnwrap(formatDescription),
                sampleTiming: &timing,
                sampleBufferOut: &sampleBuffer
            ),
            noErr
        )
        let sample = try XCTUnwrap(sampleBuffer)
        CMSetAttachment(
            sample,
            key: RPVideoSampleOrientationKey as CFString,
            value: NSNumber(value: orientation.rawValue),
            attachmentMode: kCMAttachmentMode_ShouldPropagate
        )
        return sample
    }

    private func outputOrientation(
        _ sampleBuffer: CMSampleBuffer
    ) -> CGImagePropertyOrientation? {
        guard let value = CMGetAttachment(
            sampleBuffer,
            key: RPVideoSampleOrientationKey as CFString,
            attachmentModeOut: nil
        ) as? NSNumber else {
            return nil
        }
        return CGImagePropertyOrientation(rawValue: value.uint32Value)
    }
}
