/**
 * @file PreviewScreen.tsx
 * SIGNAL — Broadcast Monitor & Output Preview
 * Equipment-grade broadcast monitor rendering real-time screen frames transformed into
 * the 16:9 canvas with full uncropped portrait preservation and iOS native segmented controls.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useStreaming } from '../context/StreamingContext';
import {
  OutputOrientation,
  StreamingState,
  BackgroundMatteStyle,
} from '../types';
import {
  Smartphone,
  Video,
  Layers,
  Sparkles,
  ShieldCheck,
  Tv,
} from 'lucide-react';

type SimulatedScene = 'GAME' | 'APP_DEMO' | 'SAFARI_STREAM' | 'CAMERA_HUD';

export const PreviewScreen: React.FC = () => {
  const {
    streamingState,
    videoSettings,
    telemetry,
    transformGeometry,
    setOrientation,
    updateVideoSettings,
    mediaStream,
    captureMode,
    setCaptureMode,
    capturedFrameMeta,
  } = useStreaming();

  const [activeScene, setActiveScene] = useState<SimulatedScene>('GAME');
  const [gameScore, setGameScore] = useState<number>(4820);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);

  const isCapturing = streamingState === StreamingState.CAPTURING;
  const isPreservePortrait =
    videoSettings.orientation === OutputOrientation.LANDSCAPE_PRESERVE_PORTRAIT;
  const isDirectLandscape =
    videoSettings.orientation === OutputOrientation.LANDSCAPE_DIRECT;
  const isVertical = videoSettings.orientation === OutputOrientation.PORTRAIT;

  // Bind live MediaStream to video element when capture starts
  useEffect(() => {
    if (liveVideoRef.current && mediaStream) {
      liveVideoRef.current.srcObject = mediaStream;
      liveVideoRef.current.play().catch(() => {});
    }
  }, [mediaStream]);

  // Realtime score tick for synthetic generator
  useEffect(() => {
    const interval = setInterval(() => {
      setGameScore((prev) => prev + Math.floor(Math.random() * 8));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const viewportWidthPercent =
    transformGeometry.canvasWidth > 0
      ? ((transformGeometry.viewportWidth / transformGeometry.canvasWidth) * 100).toFixed(2)
      : '31.64';

  const sourceWidth = capturedFrameMeta.width || 1080;
  const sourceHeight = capturedFrameMeta.height || 1920;

  return (
    <div className="space-y-4 pb-6 font-sans">
      {/* 1. Header & Large Title */}
      <div className="flex items-end justify-between pt-1">
        <div>
          <div className="text-[11px] font-medium tracking-wide uppercase text-[#8E93A0]">
            Hardware Canvas Output
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
            Monitor
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-[#16171B] text-[#8E93A0] border border-[#24262E]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isCapturing ? 'bg-[#00FF66] animate-pulse' : 'bg-[#636978]'
              }`}
            />
            <span>{isCapturing ? 'BROADCASTING' : 'IDLE'}</span>
          </div>
        </div>
      </div>

      {/* 2. iOS SEGMENTED CONTROL (Orientation Selector) */}
      <div className="p-1 rounded-xl bg-[#14161C] border border-[#20232C] flex items-center gap-1">
        <button
          id="preview-mode-preserve-portrait"
          onClick={() => setOrientation(OutputOrientation.LANDSCAPE_PRESERVE_PORTRAIT)}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            isPreservePortrait
              ? 'bg-[#222634] text-white shadow-sm font-semibold'
              : 'text-[#8E93A0] hover:text-white'
          }`}
        >
          <div className="w-2 h-3.5 border border-current rounded-[1px] shrink-0" />
          <span className="truncate">Preserve Portrait</span>
        </button>

        <button
          id="preview-mode-landscape-direct"
          onClick={() => setOrientation(OutputOrientation.LANDSCAPE_DIRECT)}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            isDirectLandscape
              ? 'bg-[#222634] text-white shadow-sm font-semibold'
              : 'text-[#8E93A0] hover:text-white'
          }`}
        >
          <div className="w-3.5 h-2 border border-current rounded-[1px] shrink-0" />
          <span className="truncate">Direct 16:9</span>
        </button>

        <button
          id="preview-mode-portrait"
          onClick={() => setOrientation(OutputOrientation.PORTRAIT)}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            isVertical
              ? 'bg-[#222634] text-white shadow-sm font-semibold'
              : 'text-[#8E93A0] hover:text-white'
          }`}
        >
          <Smartphone className="w-3 h-3.5 shrink-0" />
          <span className="truncate">Portrait 9:16</span>
        </button>
      </div>

      {/* 3. BROADCAST MONITOR HARDWARE EQUIPMENT CHASSIS */}
      <div
        id="preview-canvas-container"
        className="rounded-2xl bg-[#101216] border border-[#20242D] shadow-2xl overflow-hidden"
      >
        {/* Monitor Bezel Top Telemetry Bar */}
        <div className="px-3.5 py-2 bg-[#14161C] border-b border-[#1E222B] flex items-center justify-between text-[11px] font-mono text-[#8E93A0]">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">SRC: {sourceWidth}×{sourceHeight}</span>
            <span>&rarr;</span>
            <span className="text-white font-medium">OUT: {transformGeometry.canvasWidth}×{transformGeometry.canvasHeight}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#00FF66]">
              {isCapturing ? `${telemetry.fps.toFixed(1)} FPS` : `${videoSettings.fps} FPS`}
            </span>
            <span className="text-[#3A3F4E]">|</span>
            <span>DROPPED: {telemetry.droppedFrames}</span>
          </div>
        </div>

        {/* Precision Screen Viewport */}
        <div className="p-3 bg-[#08090C]">
          <div
            className={`w-full relative transition-all duration-300 flex items-center justify-center overflow-hidden bg-[#000000] rounded-xl border border-[#1A1D26] ${
              isVertical ? 'aspect-[9/16] max-h-[440px]' : 'aspect-video max-h-[440px]'
            }`}
          >
            {/* Studio Letterbox Matte for 16:9 Canvas */}
            {isPreservePortrait && (
              <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
                {videoSettings.matteStyle === BackgroundMatteStyle.BLURRED_FRAMEBUFFER ? (
                  <div className="w-full h-full scale-110 blur-3xl opacity-20 bg-[#1A2533]" />
                ) : videoSettings.matteStyle === BackgroundMatteStyle.TECHNICAL_GRID ? (
                  <div className="w-full h-full bg-[radial-gradient(#1A1D27_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />
                ) : (
                  <div className="w-full h-full bg-[#000000]" />
                )}

                {/* Corner Safe-Area Crosshairs */}
                <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-white/20" />
                <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-white/20" />
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-white/20" />
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-white/20" />
              </div>
            )}

            {/* REAL MEDIASTREAM VIDEO FEED OR SIMULATED FRAME */}
            {isPreservePortrait ? (
              <div
                id="preserved-portrait-screen"
                style={{
                  width: `${viewportWidthPercent}%`,
                  aspectRatio: `${sourceWidth}/${sourceHeight}`,
                }}
                className="relative z-10 h-full max-w-full bg-[#0E1015] border-x border-[#282C38] shadow-2xl flex flex-col overflow-hidden transition-all duration-300"
              >
                {/* Simulated iOS Status Bar */}
                <div className="h-5 px-2.5 flex items-center justify-between text-[8px] font-mono text-white/70 bg-black/80 backdrop-blur-sm z-20 shrink-0 border-b border-white/5">
                  <span className="font-bold">9:41</span>
                  <div className="w-8 h-2 bg-black rounded-full mx-auto" />
                  <div className="flex items-center gap-1">
                    <span>5G</span>
                  </div>
                </div>

                {/* Screen Content */}
                <div className="flex-1 relative overflow-hidden flex flex-col bg-black">
                  {mediaStream ? (
                    <video
                      ref={liveVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : activeScene === 'GAME' ? (
                    <div className="w-full h-full bg-[#0F1117] p-2.5 flex flex-col justify-between text-white relative">
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <span className="bg-[#1C1F2A] px-1.5 py-0.5 rounded text-[#8E93A0]">
                          SCORE: <strong className="text-white">{gameScore}</strong>
                        </span>
                        <span className="text-[#00FF66] font-medium">60 FPS</span>
                      </div>

                      <div className="flex-1 flex flex-col items-center justify-center my-auto">
                        <div className="w-10 h-10 rounded-xl bg-[#1A1D27] border border-[#282E3E] flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-[#00FF66]" />
                        </div>
                        <div className="text-[10px] font-mono font-bold text-white mt-1.5">
                          CMSampleBuffer
                        </div>
                        <div className="text-[8px] font-mono text-[#8E93A0]">
                          Zero-Crop Fit
                        </div>
                      </div>

                      <div className="flex justify-between items-center px-1.5 py-1 bg-[#14161F] rounded border border-[#222736]">
                        <div className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center text-[7px] text-[#8E93A0]">
                          D
                        </div>
                        <div className="flex gap-1">
                          <div className="w-4 h-4 rounded-full bg-[#242838] flex items-center justify-center text-[7px] font-bold">
                            A
                          </div>
                          <div className="w-4 h-4 rounded-full bg-[#242838] flex items-center justify-center text-[7px] font-bold">
                            B
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : activeScene === 'APP_DEMO' ? (
                    <div className="w-full h-full bg-[#0B0C0E] p-2.5 flex flex-col justify-between text-white">
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold">App Content Demonstration</div>
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="p-1.5 rounded bg-[#161820] border border-[#202430] text-[8px] text-[#8E93A0]">
                            Feed Card #{i} — 100% Uncropped Output
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : activeScene === 'SAFARI_STREAM' ? (
                    <div className="w-full h-full bg-[#0A0B0E] p-2 text-white flex flex-col justify-between">
                      <div className="p-1 bg-[#161820] rounded text-[8px] font-mono text-center text-[#8E93A0]">
                        https://signal.stream
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <Tv className="w-6 h-6 text-[#8E93A0] mb-1" />
                        <span className="text-[10px] font-bold">Web Safari Screen</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-[#08090C] p-2 text-white flex flex-col justify-between font-mono text-[8px]">
                      <div className="flex justify-between text-[#8E93A0]">
                        <span>CAP [●]</span>
                        <span>4K 60FPS</span>
                      </div>
                      <div className="w-14 h-14 border border-dashed border-white/20 rounded mx-auto flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-[#00FF66] rounded-full" />
                      </div>
                      <span className="text-center text-[#636978]">Reticle Center</span>
                    </div>
                  )}
                </div>

                {/* Home bar */}
                <div className="h-2 flex items-center justify-center bg-black/80 shrink-0">
                  <div className="w-8 h-0.5 bg-white/30 rounded-full" />
                </div>
              </div>
            ) : isDirectLandscape ? (
              <div className="w-full h-full bg-[#0A0B0E] flex flex-col items-center justify-center text-white p-4">
                {mediaStream ? (
                  <video
                    ref={liveVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <div className="text-center">
                    <Tv className="w-8 h-8 text-[#8E93A0] mx-auto mb-1.5" />
                    <div className="text-xs font-bold font-mono">DIRECT 16:9 LANDSCAPE</div>
                    <p className="text-[11px] text-[#8E93A0] mt-0.5">
                      Standard horizontal stream output for widescreen apps
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full bg-[#0A0B0E] flex flex-col justify-between p-3 text-white">
                {mediaStream ? (
                  <video
                    ref={liveVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <div className="text-center my-auto">
                    <Smartphone className="w-8 h-8 text-[#8E93A0] mx-auto mb-1.5" />
                    <div className="text-xs font-bold font-mono">PORTRAIT 9:16 VERTICAL</div>
                    <p className="text-[11px] text-[#8E93A0] mt-0.5">
                      YouTube Shorts vertical stream
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chassis Footer Specs */}
        <div className="px-4 py-2.5 bg-[#14161C] border-t border-[#1E222B] flex items-center justify-between text-xs text-[#8E93A0]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00FF66]" />
            <span>Zero-Crop Aspect Preservation Verified</span>
          </div>
          <span className="font-mono text-[11px] text-white">
            {isPreservePortrait ? '100% UNTOUCHED FRAME' : 'DIRECT PASS'}
          </span>
        </div>
      </div>

      {/* 4. CONTROLS & TEST GENERATOR (iOS Inset Grouped Table) */}
      <div className="space-y-2">
        <div className="text-[11px] font-medium tracking-wide uppercase text-[#8E93A0] px-1">
          Monitor Input & Matte Style
        </div>

        <div className="rounded-2xl bg-[#121317] border border-[#20222B] divide-y divide-[#1C1E26] overflow-hidden">
          {/* Source Selector */}
          <div className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Feed Source</div>
              <div className="text-[11px] text-[#8E93A0]">
                {captureMode === 'DISPLAY_MEDIA' ? 'Screen Recording API' : 'Synthetic Test Pattern'}
              </div>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => setCaptureMode('DISPLAY_MEDIA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  captureMode === 'DISPLAY_MEDIA'
                    ? 'bg-[#222634] text-white font-semibold'
                    : 'bg-[#181A22] text-[#8E93A0] hover:text-white'
                }`}
              >
                Screen Capture
              </button>
              <button
                onClick={() => setCaptureMode('SYNTHETIC_GENERATOR')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  captureMode === 'SYNTHETIC_GENERATOR'
                    ? 'bg-[#222634] text-white font-semibold'
                    : 'bg-[#181A22] text-[#8E93A0] hover:text-white'
                }`}
              >
                Test Generator
              </button>
            </div>
          </div>

          {/* Test Scene Picker (if active) */}
          {captureMode === 'SYNTHETIC_GENERATOR' && (
            <div className="p-3.5 flex items-center justify-between gap-2">
              <div className="text-xs font-medium text-white">Test Scene</div>
              <div className="flex gap-1">
                {[
                  { id: 'GAME' as SimulatedScene, label: 'Game' },
                  { id: 'APP_DEMO' as SimulatedScene, label: 'App' },
                  { id: 'SAFARI_STREAM' as SimulatedScene, label: 'Web' },
                  { id: 'CAMERA_HUD' as SimulatedScene, label: 'Camera' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveScene(s.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      activeScene === s.id
                        ? 'bg-[#242838] text-white font-semibold'
                        : 'text-[#8E93A0] hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Side Matte Style (When in Preserved Portrait mode) */}
          {isPreservePortrait && (
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-white">Side Matte Treatment</div>
                <div className="text-[11px] text-[#8E93A0]">Pillarbox fill background</div>
              </div>

              <div className="flex gap-1.5">
                {[
                  { style: BackgroundMatteStyle.OLED_BLACK, label: 'OLED Black' },
                  { style: BackgroundMatteStyle.BLURRED_FRAMEBUFFER, label: 'Blurred' },
                  { style: BackgroundMatteStyle.TECHNICAL_GRID, label: 'Grid' },
                ].map((item) => (
                  <button
                    key={item.style}
                    onClick={() => updateVideoSettings({ matteStyle: item.style })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      videoSettings.matteStyle === item.style
                        ? 'bg-[#222634] text-white font-semibold'
                        : 'bg-[#181A22] text-[#8E93A0] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
