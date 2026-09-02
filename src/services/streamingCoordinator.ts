/**
 * @file streamingCoordinator.ts
 * StreamingCoordinator & Mock Services implementation for StreamForge.
 * Encapsulates the complete streaming pipeline state machine, realistic mock engine,
 * and service coordination.
 */

import {
  StreamingState,
  OutputOrientation,
  VideoResolution,
  VideoFPS,
  VideoBitratePreset,
  VideoCodec,
  AudioSourceMode,
  BackgroundMatteStyle,
  YouTubeConfig,
  VideoSettings,
  AudioSettings,
  StreamTelemetry,
  TransformGeometry,
} from '../types';
import {
  IScreenCaptureService,
  IVideoTransformService,
  IVideoEncodingService,
  IAudioCaptureService,
  IAudioEncodingService,
  IYouTubeStreamingService,
} from './protocols';
import { VideoTransformService } from './videoTransformService';

// ==========================================
// MOCK IMPLEMENTATIONS
// ==========================================

export class MockScreenCaptureService implements IScreenCaptureService {
  isCapturing = false;
  private timer: any = null;
  private frameCallback?: (frameTimestamp: number) => void;

  async startCapture(fps: number): Promise<void> {
    this.isCapturing = true;
    const intervalMs = Math.round(1000 / fps);
    this.timer = setInterval(() => {
      if (this.isCapturing && this.frameCallback) {
        this.frameCallback(Date.now());
      }
    }, intervalMs);
  }

  async stopCapture(): Promise<void> {
    this.isCapturing = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  onFrameCaptured(callback: (frameTimestamp: number) => void): void {
    this.frameCallback = callback;
  }
}

export class MockVideoTransformService extends VideoTransformService {}

export class MockVideoEncodingService implements IVideoEncodingService {
  isEncoding = false;
  currentBitrateKbps = 6000;
  codec: VideoCodec = VideoCodec.H264_HARDWARE;

  async configure(
    resolution: VideoResolution,
    fps: VideoFPS,
    bitrateKbps: number,
    codec: VideoCodec
  ): Promise<void> {
    this.currentBitrateKbps = bitrateKbps;
    this.codec = codec;
    this.isEncoding = true;
  }

  async encodeVideoFrame(timestamp: number): Promise<number> {
    if (!this.isEncoding) return 0;
    // Simulate frame size in bytes ~ (Bitrate / (8 * fps))
    const baseBytes = (this.currentBitrateKbps * 1000) / (8 * 60);
    const jitter = (Math.random() - 0.5) * 400;
    return Math.max(100, Math.round(baseBytes + jitter));
  }

  async stopEncoding(): Promise<void> {
    this.isEncoding = false;
  }
}

export class MockAudioCaptureService implements IAudioCaptureService {
  isCapturing = false;
  mode: AudioSourceMode = AudioSourceMode.DEVICE_AND_MICROPHONE;
  currentMicDbfs = -48;
  private timer: any = null;
  private levelCallback?: (dbfs: number, peak: number) => void;

  setAudioMode(mode: AudioSourceMode): void {
    this.mode = mode;
  }

  async startAudioCapture(): Promise<void> {
    this.isCapturing = true;
    this.timer = setInterval(() => {
      if (this.mode === AudioSourceMode.DISABLED) {
        this.currentMicDbfs = -90;
        if (this.levelCallback) this.levelCallback(-90, 0);
        return;
      }

      // Generate realistic voice / game audio levels with periodic peaks
      const base = -22;
      const noise = (Math.sin(Date.now() / 250) * 12) + (Math.random() * 8);
      const dbfs = Math.max(-60, Math.min(0, base + noise));
      this.currentMicDbfs = Math.round(dbfs * 10) / 10;
      const normalizedPeak = Math.max(0, Math.min(1, (dbfs + 60) / 60));

      if (this.levelCallback) {
        this.levelCallback(this.currentMicDbfs, normalizedPeak);
      }
    }, 100);
  }

  async stopAudioCapture(): Promise<void> {
    this.isCapturing = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  onAudioLevelUpdate(callback: (dbfs: number, peak: number) => void): void {
    this.levelCallback = callback;
  }
}

export class MockAudioEncodingService implements IAudioEncodingService {
  isEncoding = false;
  bitrateKbps = 160;

  async configureAudioEncoder(sampleRate: number, bitrateKbps: number): Promise<void> {
    this.bitrateKbps = bitrateKbps;
    this.isEncoding = true;
  }

  async encodeAudioBuffer(pcmBuffer: Float32Array): Promise<number> {
    return Math.round((this.bitrateKbps * 1000) / (8 * 50)); // ~400 bytes per audio frame
  }

  async stopAudioEncoder(): Promise<void> {
    this.isEncoding = false;
  }
}

export class MockYouTubeStreamingService implements IYouTubeStreamingService {
  state: StreamingState = StreamingState.IDLE;
  streamUrl = 'rtmps://a.rtmp.youtube.com/live2';
  streamKey = '••••-••••-••••-7k9x';
  private telemetryCallback?: (telemetry: StreamTelemetry) => void;

  async connectRTMPS(url: string, key: string): Promise<void> {
    this.streamUrl = url;
    this.streamKey = key;
    this.state = StreamingState.PREPARING;
    await new Promise((res) => setTimeout(res, 800)); // Simulate handshake
    this.state = StreamingState.CAPTURING;
  }

  async disconnectRTMPS(): Promise<void> {
    this.state = StreamingState.STOPPING;
    await new Promise((res) => setTimeout(res, 800)); // Simulate tear-down
    this.state = StreamingState.IDLE;
  }

  async sendMuxedPacket(videoBytes: number, audioBytes: number): Promise<void> {
    // Simulated RTMPS packet delivery
  }

  onTelemetryUpdate(callback: (telemetry: StreamTelemetry) => void): void {
    this.telemetryCallback = callback;
  }
}
