import Darwin
import Foundation
import VideoToolbox

struct VideoCapabilityResolver {
    private static let safeExtensionBudgetBytes = 46 * 1024 * 1024
    private static let pipelineHeadroomBytes = 8 * 1024 * 1024

    static func resolve(_ requested: BroadcastSessionConfiguration) throws -> BroadcastSessionConfiguration {
        let requestedLongEdge = max(requested.width, requested.height)
        let candidates = [(3840, 2160), (2560, 1440), (1920, 1080), (1280, 720)]
            .filter { $0.0 <= requestedLongEdge }

        for landscapeDimensions in candidates {
            let dimensions = requested.orientationLock == .landscapeLock
                ? (width: landscapeDimensions.0, height: landscapeDimensions.1)
                : (width: landscapeDimensions.1, height: landscapeDimensions.0)

            guard fitsMemoryBudget(width: dimensions.width, height: dimensions.height),
                  supportsHardwareH264(width: dimensions.width, height: dimensions.height) else {
                continue
            }

            return try requested.replacingDimensions(width: dimensions.width, height: dimensions.height)
        }

        throw CapabilityError.noSafeHardwareConfiguration
    }

    private static func fitsMemoryBudget(width: Int, height: Int) -> Bool {
        let outputBufferBytes = width * height * 4
        return residentMemoryBytes() + outputBufferBytes + pipelineHeadroomBytes <= safeExtensionBudgetBytes
    }

    private static func supportsHardwareH264(width: Int, height: Int) -> Bool {
        guard #available(iOS 17.4, *) else { return false }

        let encoderSpecification: [CFString: Any] = [
            kVTVideoEncoderSpecification_RequireHardwareAcceleratedVideoEncoder: true,
        ]
        var session: VTCompressionSession?
        let status = VTCompressionSessionCreate(
            allocator: kCFAllocatorDefault,
            width: Int32(width),
            height: Int32(height),
            codecType: kCMVideoCodecType_H264,
            encoderSpecification: encoderSpecification as CFDictionary,
            imageBufferAttributes: nil,
            compressedDataAllocator: nil,
            outputCallback: nil,
            refcon: nil,
            compressionSessionOut: &session
        )
        if let session {
            VTCompressionSessionInvalidate(session)
        }
        return status == noErr && session != nil
    }

    private static func residentMemoryBytes() -> Int {
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size) / 4
        let status = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
                task_info(mach_task_self_, task_flavor_t(MACH_TASK_BASIC_INFO), $0, &count)
            }
        }
        return status == KERN_SUCCESS ? Int(info.resident_size) : safeExtensionBudgetBytes
    }
}

enum CapabilityError: LocalizedError {
    case noSafeHardwareConfiguration

    var errorDescription: String? {
        "No hardware H.264 configuration fits safely within the broadcast extension memory budget."
    }
}
