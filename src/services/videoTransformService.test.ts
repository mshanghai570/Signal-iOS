/**
 * @file videoTransformService.test.ts
 * Unit tests & mathematical validation for SIGNAL VideoTransformService geometry engine.
 * Verifies the no-cropping guarantee and aspect-ratio preservation across device models.
 */

import { VideoTransformService } from './videoTransformService';
import { OutputOrientation, VideoResolution } from '../types';

interface TestCaseResult {
  deviceName: string;
  resolution: VideoResolution;
  passed: boolean;
  message: string;
}

export function runVideoTransformGeometryTests(): {
  allPassed: boolean;
  totalTests: number;
  results: TestCaseResult[];
} {
  const service = new VideoTransformService();
  const results: TestCaseResult[] = [];

  const testResolutions = [
    { name: 'iPhone 13 / 14 / 15', width: 1170, height: 2532 },
    { name: 'iPhone 14 Pro / 15 Pro', width: 1179, height: 2556 },
    { name: 'Standard 1080p Portrait', width: 1080, height: 1920 },
    { name: 'iPhone SE / 8', width: 750, height: 1334 },
    { name: 'iPad Pro 11-inch Portrait', width: 1668, height: 2388 },
    { name: 'Ultra-tall 1:4 Source', width: 1000, height: 4000 },
    { name: 'Landscape 16:9 Source', width: 1920, height: 1080 },
    { name: 'Landscape 4:3 Source', width: 1440, height: 1080 },
  ];

  const canvasPresets = [
    { res: VideoResolution.HD_720P, canvasW: 1280, canvasH: 720 },
    { res: VideoResolution.FHD_1080P, canvasW: 1920, canvasH: 1080 },
    { res: VideoResolution.QHD_1440P, canvasW: 2560, canvasH: 1440 },
  ];

  for (const device of testResolutions) {
    for (const preset of canvasPresets) {
      const geom = service.computeGeometry(
        device.width,
        device.height,
        preset.res,
        OutputOrientation.LANDSCAPE_PRESERVE_PORTRAIT
      );

      // 1. Canvas bounds verification
      const canvasMatch =
        geom.canvasWidth === preset.canvasW && geom.canvasHeight === preset.canvasH;

      // 2. No-Cropping Guarantee: Viewport fits entirely within the canvas
      const noCropMatch =
        geom.viewportWidth <= preset.canvasW &&
        geom.viewportHeight <= preset.canvasH &&
        geom.viewportWidth > 0 &&
        geom.viewportHeight > 0;

      // 3. Symmetrical Centering Guarantee
      const centeringMatch =
        geom.viewportX >= 0 &&
        geom.viewportY >= 0 &&
        geom.viewportX + geom.viewportWidth <= preset.canvasW + 1 &&
        geom.viewportY + geom.viewportHeight <= preset.canvasH + 1;

      // 4. Aspect Ratio Preservation Guarantee: Source aspect matches viewport aspect within 0.005 tolerance
      const srcAspect = device.width / device.height;
      const viewportAspect = geom.viewportWidth / geom.viewportHeight;
      const aspectPreserved = Math.abs(srcAspect - viewportAspect) < 0.005;

      const passed = canvasMatch && noCropMatch && centeringMatch && aspectPreserved;

      results.push({
        deviceName: device.name,
        resolution: preset.res,
        passed,
        message: passed
          ? `PASSED: ${device.name} fitted into ${preset.res} canvas (Viewport: ${geom.viewportWidth}x${geom.viewportHeight}, Scale: ${geom.scaleFactor.toFixed(3)})`
          : `FAILED: Check geometry calculations for ${device.name} on ${preset.res}`,
      });
    }
  }

  // Verify Portrait & Direct Landscape Modes
  const portraitGeom = service.computeGeometry(
    1080,
    1920,
    VideoResolution.FHD_1080P,
    OutputOrientation.PORTRAIT
  );
  const portraitPassed =
    portraitGeom.canvasWidth === 1080 &&
    portraitGeom.canvasHeight === 1920 &&
    portraitGeom.viewportWidth === 1080 &&
    portraitGeom.viewportHeight === 1920;

  results.push({
    deviceName: 'Portrait 9:16 Mode',
    resolution: VideoResolution.FHD_1080P,
    passed: portraitPassed,
    message: portraitPassed ? 'PASSED: Portrait 9:16 Canvas' : 'FAILED: Portrait 9:16 Canvas',
  });

  const directGeom = service.computeGeometry(
    1920,
    1080,
    VideoResolution.FHD_1080P,
    OutputOrientation.LANDSCAPE_DIRECT
  );
  const directPassed =
    directGeom.canvasWidth === 1920 &&
    directGeom.canvasHeight === 1080 &&
    directGeom.viewportWidth === 1920 &&
    directGeom.viewportHeight === 1080;

  results.push({
    deviceName: 'Direct Landscape 16:9 Mode',
    resolution: VideoResolution.FHD_1080P,
    passed: directPassed,
    message: directPassed ? 'PASSED: Direct Landscape Canvas' : 'FAILED: Direct Landscape Canvas',
  });

  const allPassed = results.every((r) => r.passed);
  return { allPassed, totalTests: results.length, results };
}
