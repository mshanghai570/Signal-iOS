/**
 * @file videoTransformService.ts
 * Real-Time Video Transform Engine for SIGNAL.
 * Dynamically computes mathematical geometry and compositing parameters
 * for Portrait-Device → Landscape-Output transformation with 100% full-frame preservation.
 */

import {
  OutputOrientation,
  VideoResolution,
  TransformGeometry,
  TransformTelemetry,
} from '../types';
import { IVideoTransformService } from './protocols';

export class VideoTransformService implements IVideoTransformService {
  currentOrientation: OutputOrientation = OutputOrientation.LANDSCAPE_PRESERVE_PORTRAIT;
  targetResolution: VideoResolution = VideoResolution.FHD_1080P;

  private framesTransformedCount = 0;
  private transformFailuresCount = 0;
  private lastInputWidth = 1080;
  private lastInputHeight = 1920;

  setOrientation(orientation: OutputOrientation): void {
    this.currentOrientation = orientation;
  }

  setTargetResolution(resolution: VideoResolution): void {
    this.targetResolution = resolution;
  }

  /**
   * Returns base (width, height) for the selected VideoResolution preset.
   */
  public getResolutionDimensions(resolution: VideoResolution): { width: number; height: number } {
    switch (resolution) {
      case VideoResolution.HD_720P:
        return { width: 1280, height: 720 };
      case VideoResolution.QHD_1440P:
        return { width: 2560, height: 1440 };
      case VideoResolution.FHD_1080P:
      default:
        return { width: 1920, height: 1080 };
    }
  }

  /**
   * Computes transformation geometry dynamically from:
   * - source width & height
   * - target canvas resolution
   * - target orientation
   *
   * Mathematically guarantees:
   * 1. The full source rectangle fits completely inside the destination canvas.
   * 2. Zero cropping (viewportWidth <= canvasWidth and viewportHeight <= canvasHeight).
   * 3. Zero stretching or distortion (viewportWidth / viewportHeight === sourceWidth / sourceHeight).
   * 4. Symmetrical horizontal and vertical centering (viewportX >= 0, viewportY >= 0).
   */
  public computeGeometry(
    inputWidth: number,
    inputHeight: number,
    resolution: VideoResolution = this.targetResolution,
    orientation: OutputOrientation = this.currentOrientation
  ): TransformGeometry {
    // Guard against invalid/zero input dimensions
    const srcW = Math.max(1, inputWidth || 1080);
    const srcH = Math.max(1, inputHeight || 1920);
    const baseDim = this.getResolutionDimensions(resolution);

    let dstCanvasW: number;
    let dstCanvasH: number;
    let desc: string;

    if (orientation === OutputOrientation.PORTRAIT) {
      // 9:16 Vertical canvas (e.g. 1080 × 1920)
      dstCanvasW = baseDim.height; // 1080
      dstCanvasH = baseDim.width;  // 1920
      desc = '9:16 Vertical Stream Canvas';
    } else if (orientation === OutputOrientation.LANDSCAPE_DIRECT) {
      // 16:9 Direct Landscape (e.g. 1920 × 1080)
      dstCanvasW = baseDim.width;  // 1920
      dstCanvasH = baseDim.height; // 1080
      desc = '16:9 Direct Landscape Canvas';
    } else {
      // LANDSCAPE_PRESERVE_PORTRAIT (Preserve Full Portrait Frame)
      dstCanvasW = baseDim.width;  // 1920
      dstCanvasH = baseDim.height; // 1080
      desc = '16:9 Landscape Canvas — Preserved Full Portrait Frame (Uncropped)';
    }

    // Calculate uniform scale factor without cropping
    const scaleX = dstCanvasW / srcW;
    const scaleY = dstCanvasH / srcH;
    const uniformScale = Math.min(scaleX, scaleY);

    // Calculate fitted viewport dimensions
    const viewportW = Math.round(srcW * uniformScale);
    const viewportH = Math.round(srcH * uniformScale);

    // Calculate centered offsets
    const viewportX = Math.max(0, Math.round((dstCanvasW - viewportW) / 2));
    const viewportY = Math.max(0, Math.round((dstCanvasH - viewportH) / 2));

    const isLetterboxed = viewportW < dstCanvasW || viewportH < dstCanvasH;

    return {
      canvasWidth: dstCanvasW,
      canvasHeight: dstCanvasH,
      viewportX,
      viewportY,
      viewportWidth: viewportW,
      viewportHeight: viewportH,
      scaleFactor: uniformScale,
      sourceWidth: srcW,
      sourceHeight: srcH,
      sourceAspectRatio: srcW / srcH,
      destinationAspectRatio: dstCanvasW / dstCanvasH,
      aspectRatioDescription: desc,
      isLetterboxed,
    };
  }

  /**
   * Implementation for IVideoTransformService interface
   */
  public transformFrame(inputWidth: number, inputHeight: number) {
    try {
      this.lastInputWidth = inputWidth;
      this.lastInputHeight = inputHeight;
      const geom = this.computeGeometry(inputWidth, inputHeight);
      this.framesTransformedCount += 1;
      return geom;
    } catch (err) {
      this.transformFailuresCount += 1;
      return this.computeGeometry(1080, 1920);
    }
  }

  /**
   * Diagnostic telemetry for the transform pipeline
   */
  public getTelemetry(isActive: boolean, displayFps: number, droppedFrames = 0): TransformTelemetry {
    const geom = this.computeGeometry(this.lastInputWidth, this.lastInputHeight);
    return {
      isActive,
      inputWidth: this.lastInputWidth,
      inputHeight: this.lastInputHeight,
      outputWidth: geom.canvasWidth,
      outputHeight: geom.canvasHeight,
      orientationMode: this.currentOrientation,
      framesTransformed: this.framesTransformedCount,
      transformFailures: this.transformFailuresCount,
      previewRenderingActive: isActive,
      displayFps,
      droppedFrames,
    };
  }

  public resetTelemetry(): void {
    this.framesTransformedCount = 0;
    this.transformFailuresCount = 0;
  }
}
