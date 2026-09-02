/**
 * @file types.ts
 * Core types, models, and enums for the SIGNAL iOS Screen-Transmission & YouTube Streaming System.
 * Designed for iOS 15.0–16.6 architecture.
 */

export enum StreamingState {
  IDLE = 'IDLE',
  PREPARING = 'PREPARING',
  CAPTURING = 'CAPTURING',
  STOPPING = 'STOPPING',
  ERROR = 'ERROR',
}

export type CaptureEngineMode = 'DISPLAY_MEDIA' | 'SYNTHETIC_GENERATOR';

export enum OutputOrientation {
  PORTRAIT = 'PORTRAIT',                           // 1080x1920 (Vertical stream)
  LANDSCAPE_DIRECT = 'LANDSCAPE_DIRECT',           // 1920x1080 (Direct Landscape / Rotated)
  LANDSCAPE_PRESERVE_PORTRAIT = 'LANDSCAPE_PRESERVE_PORTRAIT', // 1920x1080 Output Canvas containing full 9:16 portrait screen
}

export enum VideoResolution {
  HD_720P = '1280 × 720',
  FHD_1080P = '1920 × 1080',
  QHD_1440P = '2560 × 1440',
}

export enum VideoFPS {
  FPS_30 = 30,
  FPS_60 = 60,
}

export enum VideoBitratePreset {
  BITRATE_2500 = 2500,
  BITRATE_4000 = 4000,
  BITRATE_6000 = 6000,
  CUSTOM = 'CUSTOM',
}

export enum VideoCodec {
  H264_HARDWARE = 'H.264 (VideoToolbox Hardware)',
  HEVC_HARDWARE = 'HEVC / H.265 (Hardware)',
}

export enum AudioSourceMode {
  DEVICE_AUDIO = 'Device audio',
  MICROPHONE = 'Microphone',
  DEVICE_AND_MICROPHONE = 'Device + Microphone',
  DISABLED = 'Disabled',
}

export enum BackgroundMatteStyle {
  BLURRED_FRAMEBUFFER = 'Dynamic Gaussian Blur',
  OLED_BLACK = 'OLED Studio Black',
  TECHNICAL_GRID = 'Cyber Studio Matte',
}

export interface YouTubeConfig {
  title: string;
  description: string;
  serverUrl: string;
  streamKey: string;
  isKeyVisible: boolean;
  isConnected: boolean;
  latencyMode: 'ULTRA_LOW' | 'LOW' | 'NORMAL';
  privacyStatus: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
}

export interface VideoSettings {
  resolution: VideoResolution;
  fps: VideoFPS;
  bitratePreset: VideoBitratePreset;
  customBitrateKbps: number;
  codec: VideoCodec;
  orientation: OutputOrientation;
  matteStyle: BackgroundMatteStyle;
  keyframeIntervalSeconds: number;
}

export interface AudioSettings {
  mode: AudioSourceMode;
  micSampleRateHz: number;
  bitrateKbps: number;
  echoCancellation: boolean;
  micLevelDbfs: number; // -60 to 0 dBFS
  peakVolume: number;    // 0.0 to 1.0
}

export interface TransformGeometry {
  canvasWidth: number;
  canvasHeight: number;
  viewportX: number;
  viewportY: number;
  viewportWidth: number;
  viewportHeight: number;
  scaleFactor: number;
  sourceWidth: number;
  sourceHeight: number;
  sourceAspectRatio: number;
  destinationAspectRatio: number;
  aspectRatioDescription: string;
  isLetterboxed: boolean;
}

export interface TransformTelemetry {
  isActive: boolean;
  inputWidth: number;
  inputHeight: number;
  outputWidth: number;
  outputHeight: number;
  orientationMode: OutputOrientation;
  framesTransformed: number;
  transformFailures: number;
  previewRenderingActive: boolean;
  displayFps: number;
  droppedFrames: number;
}

export interface StreamTelemetry {
  fps: number;
  bitrateKbps: number;
  droppedFrames: number;
  totalFrames: number;
  durationSeconds: number;
  networkRttMs: number;
  networkHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  cpuUsagePercent: number;
  memoryUsageMb: number;
  bufferHealthPercent: number;
  encodedVideoPackets: number;
  encodedAudioPackets: number;
}

export interface AdvancedEngineStatus {
  replayKitService: 'READY (RPBroadcastSampleHandler)' | 'ACTIVE' | 'ERROR';
  metalTransformService: 'PIPELINE_OK (Metal Kernel)' | 'RUNNING' | 'OFFLINE';
  videoToolboxEncoder: 'READY (VTCompressionSession)' | 'ENCODING' | 'OFFLINE';
  audioEngineService: 'READY (AVAudioEngine 48kHz)' | 'STREAMING' | 'MUTED';
  rtmpsTransport: 'SOCKET_READY (Network.framework)' | 'CONNECTED' | 'DISCONNECTED';
}

export type TabType = 'DASHBOARD' | 'STREAM' | 'PREVIEW' | 'SETTINGS' | 'SWIFT_CODE';
