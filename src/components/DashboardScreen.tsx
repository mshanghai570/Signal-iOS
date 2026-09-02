/**
 * @file DashboardScreen.tsx
 * SIGNAL — Transmission Dashboard
 * Authentic iOS Human Interface Guidelines layout with OLED-black foundation,
 * subtle graphite grouping, restrained green accents, and equipment-grade monitor preview.
 */

import React from 'react';
import { useStreaming } from '../context/StreamingContext';
import { StreamingState, TabType, OutputOrientation } from '../types';
import {
  Play,
  Square,
  Video,
  Mic,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';

interface DashboardScreenProps {
  onNavigate: (tab: TabType) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const {
    streamingState,
    videoSettings,
    audioSettings,
    telemetry,
    startStream,
    stopStream,
    capturedFrameMeta,
    mediaStream,
  } = useStreaming();

  const isCapturing = streamingState === StreamingState.CAPTURING;
  const isPreparing = streamingState === StreamingState.PREPARING;
  const isStopping = streamingState === StreamingState.STOPPING;

  // Format Duration HH:MM:SS
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="space-y-5 pb-6 font-sans">
      {/* 1. iOS Large Navigation Title & Active Badge */}
      <div className="flex items-end justify-between pt-1">
        <div>
          <div className="text-[11px] font-medium tracking-wide uppercase text-[#8E93A0]">
            YouTube RTMPS Broadcast
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
            Dashboard
          </h1>
        </div>

        {/* Status Indicator Pill */}
        <div
          id="dashboard-status-pill"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-colors border ${
            isCapturing
              ? 'bg-[#121E16] text-[#00FF66] border-[#00FF66]/30'
              : isPreparing || isStopping
              ? 'bg-[#1C1A14] text-[#FFD60A] border-[#FFD60A]/30'
              : 'bg-[#16171B] text-[#8E93A0] border-[#24262E]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isCapturing
                ? 'bg-[#00FF66] animate-pulse'
                : isPreparing || isStopping
                ? 'bg-[#FFD60A] animate-pulse'
                : 'bg-[#636978]'
            }`}
          />
          <span>{isCapturing ? 'ON AIR' : isPreparing ? 'CONNECTING' : isStopping ? 'STOPPING' : 'STANDBY'}</span>
        </div>
      </div>

      {/* 2. BROADCAST MONITOR PREVIEW (Equipment Chassis) */}
      <div
        id="preview-monitor-card"
        onClick={() => onNavigate('PREVIEW')}
        className="rounded-2xl bg-[#121317] border border-[#20222B] hover:border-[#2E3340] transition-all cursor-pointer overflow-hidden group shadow-lg"
      >
        {/* Monitor Header */}
        <div className="px-4 py-3 border-b border-[#1C1E26] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-[#8E93A0]" />
            <span className="text-xs font-semibold text-white tracking-tight">
              16:9 Broadcast Canvas
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#8E93A0]">
              {videoSettings.orientation === OutputOrientation.LANDSCAPE_PRESERVE_PORTRAIT
                ? 'Preserve 9:16'
                : videoSettings.orientation === OutputOrientation.LANDSCAPE_DIRECT
                ? 'Direct 16:9'
                : 'Portrait 9:16'}
            </span>
            <ChevronRight className="w-4 h-4 text-[#636978] group-hover:text-white transition-colors" />
          </div>
        </div>

        {/* Precision 16:9 Viewport Display */}
        <div className="p-3 bg-[#0A0A0D]">
          <div className="w-full aspect-video bg-[#000000] rounded-xl border border-[#1A1C24] overflow-hidden relative flex items-center justify-center shadow-inner">
            {/* Fine reticle grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#14161E_1px,transparent_1px),linear-gradient(to_bottom,#14161E_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none" />

            {/* Content preview */}
            {videoSettings.orientation === OutputOrientation.LANDSCAPE_PRESERVE_PORTRAIT ? (
              <div className="h-[88%] aspect-[9/16] bg-[#0E1017] border border-[#2A3040] rounded-md shadow-2xl flex flex-col items-center justify-center p-2 text-center relative z-10">
                <div className="w-6 h-0.5 bg-[#2A3040] rounded-full mb-1" />
                <span className="text-[9px] font-mono font-bold text-white tracking-wider">
                  PORTRAIT FRAME
                </span>
                <span className="text-[8px] font-mono text-[#8E93A0] mt-0.5">
                  {capturedFrameMeta.width} × {capturedFrameMeta.height}
                </span>
                <span className="text-[7px] font-mono text-[#00FF66] mt-1 bg-[#00FF66]/10 px-1.5 py-0.5 rounded">
                  100% UNCROPPED
                </span>
              </div>
            ) : videoSettings.orientation === OutputOrientation.LANDSCAPE_DIRECT ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center relative z-10 p-4">
                <span className="text-xs font-mono font-bold text-white tracking-wider">
                  DIRECT LANDSCAPE 16:9
                </span>
                <span className="text-[10px] font-mono text-[#8E93A0] mt-0.5">
                  {videoSettings.resolution}
                </span>
              </div>
            ) : (
              <div className="h-[92%] aspect-[9/16] bg-[#0E1017] border border-[#2A3040] rounded-md flex flex-col items-center justify-center p-2 text-center relative z-10">
                <span className="text-[10px] font-mono font-bold text-white">PORTRAIT 9:16</span>
              </div>
            )}

            {/* Corner Live Status Badges */}
            <div className="absolute top-2 left-2.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-[#222530] text-[9px] font-mono text-[#8E93A0]">
              {videoSettings.resolution} @ {videoSettings.fps} FPS
            </div>

            <div className="absolute bottom-2 right-2.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-[#222530] text-[9px] font-mono text-white flex items-center gap-1.5">
              {isCapturing ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
                  <span>{telemetry.fps.toFixed(1)} FPS</span>
                </>
              ) : (
                <span className="text-[#636978]">PREVIEW STANDBY</span>
              )}
            </div>
          </div>
        </div>

        {/* Monitor Footer Bar */}
        <div className="px-4 py-2.5 bg-[#121317] border-t border-[#1C1E26] flex items-center justify-between text-xs text-[#8E93A0]">
          <span className="font-mono">
            {isCapturing
              ? `Elapsed: ${formatDuration(telemetry.durationSeconds)}`
              : 'Tap to open full broadcast monitor'}
          </span>
          <span className="font-semibold text-white group-hover:text-[#00FF66] transition-colors">
            Configure Monitor &rarr;
          </span>
        </div>
      </div>

      {/* 3. PRIMARY ACTION CONTROL BUTTON */}
      <div>
        <button
          id="main-stream-action-btn"
          disabled={isPreparing || isStopping}
          onClick={() => {
            if (isCapturing) {
              stopStream();
            } else {
              startStream();
            }
          }}
          className={`w-full h-13 rounded-xl font-medium text-sm tracking-wide flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            isCapturing
              ? 'bg-[#FF3B30] hover:bg-[#E03126] text-white shadow-md'
              : isPreparing || isStopping
              ? 'bg-[#222530] text-[#8E93A0]'
              : 'bg-[#00FF66] hover:bg-[#00E65C] text-[#000000] font-bold shadow-md'
          }`}
        >
          {isPreparing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Preparing Broadcast...</span>
            </>
          ) : isStopping ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Stopping Broadcast...</span>
            </>
          ) : isCapturing ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>End Stream</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Start Stream</span>
            </>
          )}
        </button>
      </div>

      {/* 4. ESSENTIAL TRANSMISSION SPECS (iOS Inset Grouped Table) */}
      <div className="space-y-2">
        <div className="text-[11px] font-medium tracking-wide uppercase text-[#8E93A0] px-1">
          Active Pipeline Specs
        </div>

        <div className="rounded-2xl bg-[#121317] border border-[#20222B] divide-y divide-[#1C1E26] overflow-hidden">
          {/* Row 1: Orientation */}
          <div
            onClick={() => onNavigate('STREAM')}
            className="p-3.5 flex items-center justify-between hover:bg-[#16181E] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#181A22] flex items-center justify-center text-[#8E93A0]">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-white">Orientation Mode</div>
                <div className="text-[11px] text-[#8E93A0]">
                  {videoSettings.orientation === OutputOrientation.LANDSCAPE_PRESERVE_PORTRAIT
                    ? 'Landscape (Preserve Full Portrait Frame)'
                    : videoSettings.orientation === OutputOrientation.LANDSCAPE_DIRECT
                    ? 'Landscape (Direct 16:9)'
                    : 'Portrait (9:16)'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#636978]" />
          </div>

          {/* Row 2: Video Encoder & Framerate */}
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#181A22] flex items-center justify-center text-[#8E93A0]">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-white">Video Quality</div>
                <div className="text-[11px] text-[#8E93A0]">
                  {videoSettings.resolution} • {videoSettings.fps} FPS • {videoSettings.bitratePreset} kbps
                </div>
              </div>
            </div>
            <span className="text-[11px] font-mono text-[#8E93A0] bg-[#181A22] px-2 py-0.5 rounded">
              VideoToolbox
            </span>
          </div>

          {/* Row 3: Audio Source & VU Bar */}
          <div className="p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#181A22] flex items-center justify-center text-[#8E93A0]">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-medium text-white">Audio Source</div>
                  <div className="text-[11px] text-[#8E93A0]">{audioSettings.mode}</div>
                </div>
              </div>
              <span className="text-xs font-mono font-medium text-white">
                {audioSettings.mode === 'Disabled' ? 'MUTED' : `${audioSettings.micLevelDbfs} dBFS`}
              </span>
            </div>

            {/* Subtle Audio VU Bar */}
            <div className="w-full bg-[#181A22] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00FF66] to-[#FFD60A] transition-all duration-75"
                style={{
                  width:
                    audioSettings.mode === 'Disabled'
                      ? '0%'
                      : `${Math.round(audioSettings.peakVolume * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
