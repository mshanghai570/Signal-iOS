# SIGNAL iOS

`SIGNAL.xcodeproj` contains the host app, ReplayKit Broadcast Upload Extension, and unit tests for the fixed-orientation stream pipeline.

## Signing setup

Open `SIGNAL.xcodeproj` in Xcode 26 or newer (required by the pinned HaishinKit 2.2.5 package), then select an Apple development team for both `SIGNAL` and `SIGNALBroadcastExtension`. The provisioning profiles must enable these shared capabilities for both targets:

- App Group: `group.com.signal.broadcast`
- Keychain group: `$(AppIdentifierPrefix)com.signal.broadcast.shared`

If the bundle identifiers are changed, update all of these together:

- app and extension bundle identifiers in the project
- `BroadcastSessionConfiguration.preferredExtensionIdentifier`
- App Group identifier in the configuration type and both entitlements
- shared Keychain group in both entitlements

The app stores the non-secret immutable session configuration in the App Group and stores the YouTube stream key in the shared Keychain.

## Build and unit tests

Resolve the pinned HaishinKit dependency, then build and test from a macOS machine with Xcode:

```sh
xcodebuild -resolvePackageDependencies \
  -project ios/SIGNAL.xcodeproj \
  -scheme SIGNAL

xcodebuild build-for-testing \
  -project ios/SIGNAL.xcodeproj \
  -scheme SIGNAL \
  -destination 'platform=iOS Simulator,name=iPhone 16 Pro'

xcodebuild test-without-building \
  -project ios/SIGNAL.xcodeproj \
  -scheme SIGNAL \
  -destination 'platform=iOS Simulator,name=iPhone 16 Pro'
```

Use a simulator name installed with the selected Xcode version. ReplayKit cross-app broadcasting and live YouTube ingest must be tested on a signed physical device, not the simulator.

## Physical acceptance test

1. Install a signed build containing the host app and Broadcast Upload Extension on an iPhone.
2. In SIGNAL, select Landscape Lock, resolution, bitrate, and frame rate; enter the YouTube RTMPS destination and stream key; save.
3. Open the system broadcast picker from SIGNAL and start `SIGNAL Broadcast`.
4. Observe the live YouTube output while moving from a landscape app to the Home Screen, then to a portrait app, and physically rotating the device. The encoded dimensions and visible output must remain landscape throughout.
5. End the broadcast, select Portrait Lock, save, and start a new broadcast.
6. Repeat the app transitions and device rotations. The encoded dimensions and visible output must remain portrait throughout.
7. Confirm audio, lip sync/timestamps, keyframe recovery, and reconnect behavior in both sessions.

Test 4K separately on supported hardware while monitoring extension memory, frame drops, thermals, and sustained upload rate. A startup capability check may select the next lower safe resolution; this is expected rather than allocating beyond the ReplayKit extension budget.
