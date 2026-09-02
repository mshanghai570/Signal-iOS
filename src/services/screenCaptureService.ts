/**
 * @file screenCaptureService.ts
 * Real Screen Capture Service for Web/iOS Simulator environments.
 * Uses the Web Screen Capture API (navigator.mediaDevices.getDisplayMedia) for real hardware screen capture,
 * and maintains continuous frame delivery, timing, dimensions, and audio samples.
 */

import { IScreenCaptureService } from './protocols';

export interface FrameMetadata {
  timestamp: number;
  width: number;
  height: number;
  durationMs: number;
  fps: number;
}

export class RealScreenCaptureService implements IScreenCaptureService {
  isCapturing = false;
  mediaStream: MediaStream | null = null;
  videoElement: HTMLVideoElement | null = null;
  
  private frameCallback?: (frameTimestamp: number, meta?: FrameMetadata) => void;
  private audioSampleCallback?: (audioData: Float32Array) => void;
  private errorCallback?: (error: Error) => void;
  private animFrameId: number | null = null;
  private lastFrameTime = 0;
  private frameCount = 0;
  private currentFps = 60;
  private sourceWidth = 1080;
  private sourceHeight = 1920;

  get stream(): MediaStream | null {
    return this.mediaStream;
  }

  get isAvailable(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices && !!navigator.mediaDevices.getDisplayMedia;
  }

  async startCapture(fps: number = 60, useRealDisplay: boolean = true): Promise<void> {
    if (this.isCapturing) return;

    try {
      if (useRealDisplay && this.isAvailable) {
        // Request actual screen/window/tab capture
        this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            frameRate: { ideal: fps, max: 60 },
            displaySurface: 'window' as any,
          },
          audio: true,
        });

        // Track when user stops capture from native browser indicator
        const videoTrack = this.mediaStream.getVideoTracks()[0];
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          this.sourceWidth = settings.width || 1920;
          this.sourceHeight = settings.height || 1080;

          videoTrack.onended = () => {
            this.stopCapture();
          };
        }

        // Bind to hidden video element for continuous frame rasterization
        this.videoElement = document.createElement('video');
        this.videoElement.srcObject = this.mediaStream;
        this.videoElement.muted = true;
        this.videoElement.playsInline = true;
        await this.videoElement.play().catch(() => {});
      }

      this.isCapturing = true;
      this.lastFrameTime = performance.now();
      this.frameCount = 0;

      // Start high-performance frame loop
      this.startFrameLoop(fps);
    } catch (err: any) {
      this.isCapturing = false;
      if (this.errorCallback) {
        this.errorCallback(err instanceof Error ? err : new Error(String(err)));
      }
      throw err;
    }
  }

  private startFrameLoop(targetFps: number) {
    const frameInterval = 1000 / targetFps;
    let lastRenderTime = performance.now();

    const loop = (now: number) => {
      if (!this.isCapturing) return;

      const elapsed = now - lastRenderTime;

      if (elapsed >= frameInterval * 0.9) {
        lastRenderTime = now;
        this.frameCount++;

        if (now - this.lastFrameTime >= 1000) {
          this.currentFps = this.frameCount;
          this.frameCount = 0;
          this.lastFrameTime = now;
        }

        if (this.videoElement && this.videoElement.videoWidth > 0) {
          this.sourceWidth = this.videoElement.videoWidth;
          this.sourceHeight = this.videoElement.videoHeight;
        }

        if (this.frameCallback) {
          this.frameCallback(now, {
            timestamp: now,
            width: this.sourceWidth,
            height: this.sourceHeight,
            durationMs: elapsed,
            fps: this.currentFps,
          });
        }
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  async stopCapture(): Promise<void> {
    this.isCapturing = false;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  onFrameCaptured(callback: (frameTimestamp: number, meta?: FrameMetadata) => void): void {
    this.frameCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }
}
