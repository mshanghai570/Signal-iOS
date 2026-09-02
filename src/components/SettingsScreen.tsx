/**
 * @file SettingsScreen.tsx
 * SIGNAL — Preferences & Structured Pipeline Diagnostics
 * Formatted with Apple iOS Inset Grouped layout: OUTPUT, YOUTUBE, VIDEO, AUDIO, DIAGNOSTICS, GENERAL.
 */

import React, { useState } from 'react';
import { useStreaming } from '../context/StreamingContext';
import {
  OutputOrientation,
  VideoResolution,
  VideoFPS,
  AudioSourceMode,
  StreamingState,
} from '../types';
import {
  Eye,
  EyeOff,
  RefreshCw,
  Check,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {
    streamingState,
    generalSettings,
    videoSettings,
    audioSettings,
    youtubeConfig,
    telemetry,
    capturedFrameMeta,
    transformGeometry,
    transformTelemetry,
    updateGeneralSettings,
    updateVideoSettings,
    updateAudioSettings,
    updateYouTubeConfig,
    setOrientation,
    resetToDefaults,
  } = useStreaming();

  const [showStreamKey, setShowStreamKey] = useState(false);

  const isCapturing = streamingState === StreamingState.CAPTURING;
  const sourceWidth = capturedFrameMeta.width || 1080;
  const sourceHeight = capturedFrameMeta.height || 1920;

  return (
    <div className="space-y-5 pb-8 font-sans">
      {/* Header & Large Title */}
      <div className="flex items-end justify-between pt-1">
        <div>
          <div className="text-[11px] font-medium tracking-wide uppercase text-[#8E93A0]">
            System & Engine
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
            Settings
          </h1>
        </div>

        <button
          id="reset-defaults-btn"
          onClick={resetToDefaults}
          className="flex items-center gap-1.5 text-xs text-[#8E93A0] hover:text-white px-3 py-1.5 rounded-lg bg-[#14161C] border border-[#20232C] transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* SECTION 1: OUTPUT */}
      <div className="space-y-2">
        <div className="text-[11px] font-medium tracking-wide uppercase text-[#8E93A0] px-1">
          Output
        </div>

        <div className="rounded-2xl bg-[#121317] border border-[#20222B] divide-y divide-[#1C1E26] overflow-hidden">
          {/* Orientation Picker Row */}
          <div className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Orientation</div>
              <div className="text-[11px] text-[#8E93A0]">Canvas framing strategy</div>
            </div>

            <select
              id="setting-orientation-select"
              value={videoSettings.orientation}
              onChange={(e) => setOrientation(e.target.value as OutputOrientation)}
              className="px-3 py-1.5 rounded-lg bg-[#181A22] border border-[#262A36] text-xs text-white focus:outline-none focus:border-[#00FF66] cursor-pointer"
            >
              <option value={OutputOrientation.LANDSCAPE_PRESERVE_PORTRAIT}>
                Landscape (Preserve Portrait)
              </option>
              <option value={OutputOrientation.LANDSCAPE_DIRECT}>
                Landscape Direct (16:9)
              </option>
              <option value={OutputOrientation.PORTRAIT}>
                Portrait (9:16)
              </option>
            </select>
          </div>

          {/* Resolution Row */}
          <div className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Resolution</div>
              <div className="text-[11px] text-[#8E93A0]">Target canvas height</div>
            </div>

            <select
              id="setting-resolution-select"
              value={videoSettings.resolution}
              onChange={(e) => updateVideoSettings({ resolution: e.target.value as VideoResolution })}
              className="px-3 py-1.5 rounded-lg bg-[#181A22] border border-[#262A36] text-xs text-white focus:outline-none focus:border-[#00FF66] cursor-pointer"
            >
              <option value={VideoResolution.FHD_1080P}>1920 × 1080 (1080p FHD)</option>
              <option value={VideoResolution.HD_720P}>1280 × 720 (720p HD)</option>
            </select>
          </div>

          {/* Framerate Row */}
          <div className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Framerate</div>
              <div className="text-[11px] text-[#8E93A0]">Hardware capture cadence</div>
            </div>

            <select
              id="setting-fps-select"
              value={videoSettings.fps}
              onChange={(e) => updateVideoSettings({ fps: Number(e.target.value) as VideoFPS })}
              className="px-3 py-1.5 rounded-lg bg-[#181A22] border border-[#262A36] text-xs text-white focus:outline-none focus:border-[#00FF66] cursor-pointer"
            >
              <option value={60}>60 FPS</option>
              <option value={30}>30 FPS</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: YOUTUBE */}
      <div className="space-y-2">
        <div className="text-[11px] font-medium tracking-wide uppercase text-[#8E93A0] px-1">
          YouTube
        </div>

        <div className="rounded-2xl bg-[#121317] border border-[#20222B] divide-y divide-[#1C1E26] overflow-hidden">
          {/* Stream Key Row */}
          <div className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white">Stream Key</label>
              <button
                type="button"
                onClick={() => setShowStreamKey(!showStreamKey)}
                className="text-[11px] text-[#8E93A0] hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {showStreamKey ? (
                  <>
                    <EyeOff className="w-3 h-3" /> Hide
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" /> Show
                  </>
                )}
              </button>
            </div>

            <input
              id="setting-youtube-stream-key"
              type={showStreamKey ? 'text' : 'password'}
              value={youtubeConfig.streamKey}
              onChange={(e) => updateYouTubeConfig({ streamKey: e.target.value })}
              placeholder="xxxx-xxxx-xxxx-xxxx-xxxx"
              className="w-full px-3 py-2 rounded-lg bg-[#181A22] border border-[#262A36] text-xs font-mono text-white focus:outline-none focus:border-[#00FF66] transition-colors"
            />
          </div>

          {/* Ingress Protocol Row */}
          <div className="p-3.5 flex items-center justify-between text-xs">
            <span className="text-white">Ingress Protocol</span>
            <span className="font-mono text-[11px] text-[#8E93A0]">RTMPS (TLS 1.3)</span>
          </div>

          {/* Server URL Row */}
          <div className="p-3.5 flex items-center justify-between text-xs">
            <span className="text-white">Server URL</span>
            <span className="font-mono text-[11px] text-[#8E93A0] truncate max-w-[200px]">
              {youtubeConfig.serverUrl}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 3: VIDEO */}
      <div className="space-y-2">
        <div className="text-[11px] font-medium tracking-wide uppercase text-[#8E93A0] px-1">
          Video
        </div>

        <div className="rounded-2xl bg-[#121317] border border-[#20222B] divide-y divide-[#1C1E26] overflow-hidden">
          <div className="p-3.5 flex items-center justify-between text-xs">
            <span className="text-white">Hardware Encoder</span>
            <span className="text-[#8E93A0]">VideoToolbox H.264</span>
          </div>

          <div className="p-3.5 flex items-center justify-between text-xs">
            <span className="text-white">Keyframe Interval</span>
            <span className="text-[#8E93A0]">2.0s GOP</span>
          </div>

          <div className="p-3.5 flex items-center justify-between text-xs">
            <span className="text-white">Buffer Management</span>
            <span className="text-[#8E93A0]">CVPixelBufferPool</span>
          </div>
        </div>
      </div>

      {/* SECTION 4: AUDIO */}
      <div className="space-y-2">
        <div className="text-[11px] font-medium tracking-wide uppercase text-[#8E93A0] px-1">
          Audio
        </div>

        <div className="rounded-2xl bg-[#121317] border border-[#20222B] divide-y divide-[#1C1E26] overflow-hidden">
          {/* Audio Mode */}
          <div className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Audio Source</div>
              <div className="text-[11px] text-[#8E93A0]">Hardware capture mix</div>
            </div>

            <select
              id="setting-audio-mode-select"
              value={audioSettings.mode}
              onChange={(e) => updateAudioSettings({ mode: e.target.value as AudioSourceMode })}
              className="px-3 py-1.5 rounded-lg bg-[#181A22] border border-[#262A36] text-xs text-white focus:outline-none focus:border-[#00FF66] cursor-pointer"
            >
              <option value={AudioSourceMode.DEVICE_AND_MICROPHONE}>App Audio + Mic</option>
              <option value={AudioSourceMode.DEVICE_AUDIO}>Device Only</option>
              <option value={AudioSourceMode.MICROPHONE}>Microphone Only</option>
              <option value={AudioSourceMode.DISABLED}>Muted</option>
            </select>
          </div>

          {/* Echo Cancellation Switch */}
          <div className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Echo Cancellation</div>
              <div className="text-[11px] text-[#8E93A0]">Hardware DSP filter</div>
            </div>

            <button
              onClick={() => updateAudioSettings({ echoCancellation: !audioSettings.echoCancellation })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                audioSettings.echoCancellation ? 'bg-[#00FF66]' : 'bg-[#262A36]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  audioSettings.echoCancellation ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Codec */}
          <div className="p-3.5 flex items-center justify-between text-xs">
            <span className="text-white">Codec & Sample Rate</span>
            <span className="text-[#8E93A0]">AAC-LC Stereo @ 48 kHz</span>
          </div>
        </div>
      </div>

      {/* SECTION 5: DIAGNOSTICS */}
      <div className="space-y-2">
        <div className="text-[11px] font-medium tracking-wide uppercase text-[#8E93A0] px-1">
          Diagnostics
        </div>

        <div className="rounded-2xl bg-[#121317] border border-[#20222B] divide-y divide-[#1C1E26] overflow-hidden">
          <div className="p-3.5 flex items-center justify-between text-xs">
            <span className="text-white">Capture Status</span>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className={`w-1.5 h-1.5 rounded-full ${isCapturing ? 'bg-[#00FF66] animate-pulse' : 'bg-[#636978]'}`} />
              <span className={isCapturing ? 'text-[#00FF66]' : 'text-[#8E93A0]'}>
                {isCapturing ? 'ACTIVE' : 'IDLE'}
              </span>
            </div>
          </div>

          <div className="p-3.5 flex items-center justify-between text-xs">
            <span className="text-white">Source Framebuffer</span>
            <span className="font-mono text-[11px] text-[#8E93A0]">{sourceWidth} × {sourceHeight}</span>
          </div>

          <div className="p-3.5 flex items-center justify-between text-xs">
            <span className="text-white">Canvas Output</span>
            <span className="font-mono text-[11px] text-[#8E93A0]">{transformGeometry.canvasWidth} × {transformGeometry.canvasHeight}</span>
          </div>

          <div className="p-3.5 flex items-center justify-between text-xs">
            <span className="text-white">Frames Transformed</span>
            <span className="font-mono text-[11px] text-[#8E93A0]">{telemetry.totalFrames}</span>
          </div>

          <div className="p-3.5 flex items-center justify-between text-xs">
            <span className="text-white">Transform Failures</span>
            <span className="font-mono text-[11px] text-[#8E93A0]">{transformTelemetry.transformFailures}</span>
          </div>
        </div>
      </div>

      {/* SECTION 6: GENERAL */}
      <div className="space-y-2">
        <div className="text-[11px] font-medium tracking-wide uppercase text-[#8E93A0] px-1">
          General
        </div>

        <div className="rounded-2xl bg-[#121317] border border-[#20222B] divide-y divide-[#1C1E26] overflow-hidden">
          {/* Haptic Feedback */}
          <div className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Haptic Feedback</div>
              <div className="text-[11px] text-[#8E93A0]">Tactile confirmation on stream start/stop</div>
            </div>

            <button
              onClick={() => updateGeneralSettings({ hapticFeedback: !generalSettings.hapticFeedback })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                generalSettings.hapticFeedback ? 'bg-[#00FF66]' : 'bg-[#262A36]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  generalSettings.hapticFeedback ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Confirm Before Stopping */}
          <div className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Confirm Before Stopping Stream</div>
              <div className="text-[11px] text-[#8E93A0]">Prompt before ending broadcast</div>
            </div>

            <button
              onClick={() => updateGeneralSettings({ confirmBeforeStopping: !generalSettings.confirmBeforeStopping })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                generalSettings.confirmBeforeStopping ? 'bg-[#00FF66]' : 'bg-[#262A36]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  generalSettings.confirmBeforeStopping ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
