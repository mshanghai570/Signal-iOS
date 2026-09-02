import CoreImage
import CoreMedia
import CoreVideo
import Foundation
import ImageIO
import Metal
import ReplayKit

final class ReplayKitFrameNormalizer {
    let configuration: BroadcastSessionConfiguration

    private let context: CIContext
    private let colorSpace = CGColorSpaceCreateDeviceRGB()
    private let allocationAttributes: CFDictionary
    private let outputFormatDescription: CMVideoFormatDescription
    private let pixelBufferPool: CVPixelBufferPool

    init(configuration: BroadcastSessionConfiguration) throws {
        self.configuration = configuration
        allocationAttributes = [
            kCVPixelBufferPoolAllocationThresholdKey: 1,
        ] as CFDictionary

        guard let device = MTLCreateSystemDefaultDevice() else {
            throw FrameNormalizationError.metalUnavailable
        }
        context = CIContext(
            mtlDevice: device,
            options: [
                .cacheIntermediates: false,
                .workingColorSpace: NSNull(),
            ]
        )
        pixelBufferPool = try Self.makePool(configuration: configuration)
        outputFormatDescription = try Self.makeOutputFormatDescription(pool: pixelBufferPool)
    }

    func normalize(_ sampleBuffer: CMSampleBuffer) throws -> CMSampleBuffer {
        guard CMSampleBufferIsValid(sampleBuffer),
              let sourceBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
            throw FrameNormalizationError.invalidSampleBuffer
        }

        let sourceOrientation = Self.orientation(of: sampleBuffer)
        let sourceWidth = CVPixelBufferGetWidth(sourceBuffer)
        let sourceHeight = CVPixelBufferGetHeight(sourceBuffer)
        let sourcePixelFormat = CVPixelBufferGetPixelFormatType(sourceBuffer)

        // This is the only zero-render path. It satisfies every fast-path condition: canonical
        // pixels and format, exact immutable output dimensions, no scaling, and no matte area.
        if sourceOrientation == .up,
           sourceWidth == configuration.width,
           sourceHeight == configuration.height,
           sourcePixelFormat == configuration.pixelFormat.osType {
            return try makeSampleBuffer(pixelBuffer: sourceBuffer, timingFrom: sampleBuffer)
        }

        guard let destinationBuffer = makeDestinationBuffer() else {
            throw FrameNormalizationError.outputPoolExhausted
        }

        var image = CIImage(cvPixelBuffer: sourceBuffer)
        if sourceOrientation != .up {
            image = image.oriented(sourceOrientation)
        }

        let orientedExtent = image.extent
        image = image.transformed(
            by: CGAffineTransform(
                translationX: -orientedExtent.origin.x,
                y: -orientedExtent.origin.y
            )
        )

        let scale = min(
            CGFloat(configuration.width) / orientedExtent.width,
            CGFloat(configuration.height) / orientedExtent.height
        )
        let scaledWidth = orientedExtent.width * scale
        let scaledHeight = orientedExtent.height * scale
        let x = (CGFloat(configuration.width) - scaledWidth) / 2
        let y = (CGFloat(configuration.height) - scaledHeight) / 2

        let fitted = image
            .transformed(by: CGAffineTransform(scaleX: scale, y: scale))
            .transformed(by: CGAffineTransform(translationX: x, y: y))
        let canvas = CGRect(
            x: 0,
            y: 0,
            width: CGFloat(configuration.width),
            height: CGFloat(configuration.height)
        )
        let matte = CIImage(color: .black).cropped(to: canvas)

        context.render(
            fitted.composited(over: matte),
            to: destinationBuffer,
            bounds: canvas,
            colorSpace: colorSpace
        )

        return try makeSampleBuffer(pixelBuffer: destinationBuffer, timingFrom: sampleBuffer)
    }

    private func makeDestinationBuffer() -> CVPixelBuffer? {
        var pixelBuffer: CVPixelBuffer?
        let status = CVPixelBufferPoolCreatePixelBufferWithAuxAttributes(
            kCFAllocatorDefault,
            pixelBufferPool,
            allocationAttributes,
            &pixelBuffer
        )
        return status == kCVReturnSuccess ? pixelBuffer : nil
    }

    private func makeSampleBuffer(
        pixelBuffer: CVPixelBuffer,
        timingFrom source: CMSampleBuffer
    ) throws -> CMSampleBuffer {
        var timing = CMSampleTimingInfo(
            duration: CMSampleBufferGetDuration(source),
            presentationTimeStamp: CMSampleBufferGetPresentationTimeStamp(source),
            decodeTimeStamp: CMSampleBufferGetDecodeTimeStamp(source)
        )
        var output: CMSampleBuffer?
        guard CMSampleBufferCreateReadyWithImageBuffer(
            allocator: kCFAllocatorDefault,
            imageBuffer: pixelBuffer,
            formatDescription: outputFormatDescription,
            sampleTiming: &timing,
            sampleBufferOut: &output
        ) == noErr, let output else {
            throw FrameNormalizationError.sampleBufferCreationFailed
        }

        CMSetAttachment(
            output,
            key: RPVideoSampleOrientationKey as CFString,
            value: NSNumber(value: CGImagePropertyOrientation.up.rawValue),
            attachmentMode: kCMAttachmentMode_ShouldPropagate
        )
        return output
    }

    private static func makeOutputFormatDescription(
        pool: CVPixelBufferPool
    ) throws -> CMVideoFormatDescription {
        var prototype: CVPixelBuffer?
        guard CVPixelBufferPoolCreatePixelBuffer(
            kCFAllocatorDefault,
            pool,
            &prototype
        ) == kCVReturnSuccess, let prototype else {
            throw FrameNormalizationError.outputPoolExhausted
        }

        var formatDescription: CMVideoFormatDescription?
        guard CMVideoFormatDescriptionCreateForImageBuffer(
            allocator: kCFAllocatorDefault,
            imageBuffer: prototype,
            formatDescriptionOut: &formatDescription
        ) == noErr, let formatDescription else {
            throw FrameNormalizationError.formatDescriptionCreationFailed
        }
        return formatDescription
    }

    private static func orientation(of sampleBuffer: CMSampleBuffer) -> CGImagePropertyOrientation {
        guard let value = CMGetAttachment(
            sampleBuffer,
            key: RPVideoSampleOrientationKey as CFString,
            attachmentModeOut: nil
        ) as? NSNumber else {
            return .up
        }
        return CGImagePropertyOrientation(rawValue: value.uint32Value) ?? .up
    }

    private static func makePool(
        configuration: BroadcastSessionConfiguration
    ) throws -> CVPixelBufferPool {
        let poolAttributes: [CFString: Any] = [
            kCVPixelBufferPoolMinimumBufferCountKey: 1,
        ]
        let pixelAttributes: [CFString: Any] = [
            kCVPixelBufferPixelFormatTypeKey: configuration.pixelFormat.osType,
            kCVPixelBufferWidthKey: configuration.width,
            kCVPixelBufferHeightKey: configuration.height,
            kCVPixelBufferIOSurfacePropertiesKey: [:] as CFDictionary,
            kCVPixelBufferMetalCompatibilityKey: true,
        ]
        var pool: CVPixelBufferPool?
        let status = CVPixelBufferPoolCreate(
            kCFAllocatorDefault,
            poolAttributes as CFDictionary,
            pixelAttributes as CFDictionary,
            &pool
        )
        guard status == kCVReturnSuccess, let pool else {
            throw FrameNormalizationError.poolCreationFailed(status)
        }
        return pool
    }
}

enum FrameNormalizationError: LocalizedError {
    case metalUnavailable
    case invalidSampleBuffer
    case outputPoolExhausted
    case poolCreationFailed(OSStatus)
    case formatDescriptionCreationFailed
    case sampleBufferCreationFailed

    var errorDescription: String? {
        switch self {
        case .metalUnavailable: "Metal is required for broadcast frame normalization."
        case .invalidSampleBuffer: "ReplayKit delivered an invalid video sample."
        case .outputPoolExhausted: "The bounded output pool is busy; the frame was dropped."
        case .poolCreationFailed(let status): "Could not create the output buffer pool (\(status))."
        case .formatDescriptionCreationFailed: "Could not describe the normalized video format."
        case .sampleBufferCreationFailed: "Could not create the normalized video sample."
        }
    }
}
