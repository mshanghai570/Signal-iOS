/**
 * @file protocols.ts
 * Clean architecture service protocols for the StreamForge streaming engine.
 * Directly mirrors the Swift protocols for iOS 15.0–16.6.
 */

import {
  StreamingState,
  OutputOrientation,
  VideoResolution,
  VideoFPS,
  VideoCodec,
  AudioSourceMode,
  StreamTelemetry,
  TransformGeometry,
} from '../types';

/**
 * Protocol for capturing screen framebuffer via ReplayKit (RPBroadcastSampleHandler / RPScreenRecorder)
 */
export interface IScreenCaptureService {
  isCapturing: boolean;
  startCapture(fps: number): Promise<void>;
  stopCapture(): Promise<void>;
  onFrameCaptured(callback: (frameTimestamp: number) => void): void;
}

/**
 * Protocol for converting physical portrait iPhone framebuffer into chosen output aspect/orientation
 */
export interface IVideoTransformService {
  currentOrientation: OutputOrientation;
  targetResolution: VideoResolution;
  setOrientation(orientation: OutputOrientation): void;
  setTargetResolution(resolution: VideoResolution): void;
  transformFrame(inputWidth: number, inputHeight: number): TransformGeometry;
}

/**
 * Protocol for hardware VideoToolbox H.264/HEVC compression session
 */
export interface IVideoEncodingService {
  isEncoding: boolean;
  currentBitrateKbps: number;
  codec: VideoCodec;
  configure(resolution: VideoResolution, fps: VideoFPS, bitrateKbps: number, codec: VideoCodec): Promise<void>;
  encodeVideoFrame(timestamp: number): Promise<number>; // returns encoded packet bytes
  stopEncoding(): Promise<void>;
}

/**
 * Protocol for capturing microphone and device audio via AVAudioEngine & ReplayKit Audio
 */
export interface IAudioCaptureService {
  isCapturing: boolean;
  mode: AudioSourceMode;
  currentMicDbfs: number;
  setAudioMode(mode: AudioSourceMode): void;
  startAudioCapture(): Promise<void>;
  stopAudioCapture(): Promise<void>;
  onAudioLevelUpdate(callback: (dbfs: number, peak: number) => void): void;
}

/**
 * Protocol for encoding PCM audio to AAC-LC 48kHz stereo
 */
export interface IAudioEncodingService {
  isEncoding: boolean;
  bitrateKbps: number;
  configureAudioEncoder(sampleRate: number, bitrateKbps: number): Promise<void>;
  encodeAudioBuffer(pcmBuffer: Float32Array): Promise<number>;
  stopAudioEncoder(): Promise<void>;
}

/**
 * Protocol for YouTube RTMPS connection and packet multiplexing over TLS 1.3
 */
export interface IYouTubeStreamingService {
  state: StreamingState;
  streamUrl: string;
  streamKey: string;
  connectRTMPS(url: string, key: string): Promise<void>;
  disconnectRTMPS(): Promise<void>;
  sendMuxedPacket(videoBytes: number, audioBytes: number): Promise<void>;
  onTelemetryUpdate(callback: (telemetry: StreamTelemetry) => void): void;
}
