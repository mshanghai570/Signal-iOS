/**
 * @file StreamSetupScreen.tsx
 * SIGNAL — Output & Stream Configuration Console
 * Organized into iOS Inset Grouped sections: OUTPUT ORIENTATION, YOUTUBE, VIDEO, and AUDIO.
 */

import React from 'react';
import { useStreaming } from '../context/StreamingContext';
import {
  VideoResolution,
  VideoFPS,
  VideoBitratePreset,
  AudioSourceMode,
  OutputOrientation,
} from '../types';
import {
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  Smartphone,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const StreamSetupScreen: React.FC = () => {
  const {
    youtubeConfig,
    videoSettings,
    audioSettings,
    updateYouTubeConfig,
    updateVideoSettings,
    updateAudioSettings,
    setOrientation,
    transformGeometry,
  } = useStreaming();

  return (
    <div className="space-y-5 pb-6 font-sans">
      {/* Large Navigation Title */}
      <div className="pt-1">
        <div className="text-[11px] font-medium tracking-wide uppercase text-[#8E93A0]">
          Pipeline & Ingress
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
          Stream Setup
        </h1>
      </div>

      {/* SECTION 1: OUTPUT ORIENTATION */}
      <div className="space-y-2">
        <div className="text-[11px] font-medium tracking-wide uppercase text-[#8E93A0] px-1">
          Output Orientation
        </div>

        <div className="rounded-2xl bg-[#121317] border border-[#20222B] divide-y divide-[#1C1E26] overflow-hidden">
          {/* Option 1: Preserve Portrait Frame */}
          <div
            id="orientation-opt-landscape-preserve"
            onClick={() => setOrientation(OutputOrientation.LANDSCAPE_PRESERVE_PORTRAIT)}
            className="p-3.5 flex items-start justify-between hover:bg-[#16181E] transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#181A22] flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-4 h-2.5 bg-[#2A3040] rounded-[1px] flex items-center justify-center">
                  <div className="w-1.5 h-full bg-white" />
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span>Landscape — Preserve Portrait Frame</span>
                  <span className="text-[9px] font-mono text-[#00FF66] bg-[#00FF66]/10 px-1.5 py-0.2 rounded font-normal">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-[#8E93A0] mt-0.5 leading-relaxed">
                  Preserves complete uncropped 9:16 portrait screen centered on 16:9 canvas.
                </p>
              </div>
            </div>
            {videoSettings.orientation === OutputOrientation.LANDSCAPE_PRESERVE_PORTRAIT && (
              <Check className="w-4 h-4 text-[#00FF66] shrink-0 mt-1" />
            )}
          </div>

          {/* Option 2: Landscape Direct */}
          <div
            id="orientation-opt-landscape-direct"
            onClick={() => setOrientation(OutputOrientation.LANDSCAPE_DIRECT)}
            className="p-3.5 flex items-start justify-between hover:bg-[#16181E] transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#181A22] flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-4.5 h-2.5 border border-white/60 rounded-[1px]" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">
                  Landscape Direct (16:9)
                </div>
                <p className="text-[11px] text-[#8E93A0] mt-0.5 leading-relaxed">
                  Direct full horizontal canvas for widescreen gaming and horizontal apps.
                </p>
              </div>
            </div>
            {videoSettings.orientation === OutputOrientation.LANDSCAPE_DIRECT && (
              <Check className="w-4 h-4 text-[#00FF66] shrink-0 mt-1" />
            )}
          </div>

          {/* Option 3: Portrait 9:16 */}
          <div
            id="orientation-opt-portrait"
            onClick={() => setOrientation(OutputOrientation.PORTRAIT)}
            className="p-3.5 flex items-start justify-between hover:bg-[#16181E] transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#181A22] flex items-center justify-center shrink-0 mt-0.5">
                <Smartphone className="w-3.5 h-3.5 text-white/70" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">
                  Portrait (9:16 Vertical)
                </div>
                <p className="text-[11px] text-[#8E93A0] mt-0.5 leading-relaxed">
                  Vertical stream output for mobile feeds and YouTube Shorts.
                </p>
              </div>
            </div>
            {videoSettings.orientation === OutputOrientation.PORTRAIT && (
              <Check className="w-4 h-4 text-[#00FF66] shrink-0 mt-1" />
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: YOUTUBE INGRESS */}
      <div className="space-y-2">
        <div className="text-[11px] font-medium tracking-wide uppercase text-[#8E93A0] px-1">
          YouTube Broadcast Target
        </div>

        <div className="rounded-2xl bg-[#121317] border border-[#20222B] divide-y divide-[#1C1E26] overflow-hidden">
          {/* Broadcast Title */}
          <div className="p-3.5 space-y-1.5">
            <label className="text-xs font-medium text-white">Broadcast Title</label>
            <input
              id="youtube-stream-title"
              type="text"
              value={youtubeConfig.title}
              onChange={(e) => updateYouTubeConfig({ title: e.target.value })}
              placeholder="e.g. iOS Screen Stream"
              className="w-full px-3 py-2 rounded-lg bg-[#181A22] border border-[#262A36] focus:border-[#00FF66] text-xs text-white focus:outline-none transition-colors"
            />
          </div>

          {/* Stream Key */}
          <div className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white">Stream Key</label>
              <button
                id="toggle-stream-key-visibility"
                onClick={() => updateYouTubeConfig({ isKeyVisible: !youtubeConfig.isKeyVisible })}
                className="text-[11px] text-[#8E93A0] hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {youtubeConfig.isKeyVisible ? (
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
              id="youtube-stream-key"
              type={youtubeConfig.isKeyVisible ? 'text' : 'password'}
              value={youtubeConfig.streamKey}
              onChange={(e) => updateYouTubeConfig({ streamKey: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#181A22] border border-[#262A36] text-xs font-mono text-white focus:outline-none focus:border-[#00FF66] transition-colors"
            />
          </div>

          {/* Ingress URL */}
          <div className="p-3.5 flex items-center justify-between text-xs">
            <span className="text-[#8E93A0]">Server Ingress</span>
            <span className="font-mono text-[11px] text-white truncate max-w-[220px]">
              {youtubeConfig.serverUrl}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 3: VIDEO ENCODER */}
      <div className="space-y-2">
        <div className="text-[11px] font-medium tracking-wide uppercase text-[#8E93A0] px-1">
          Video Encoder
        </div>

        <div className="rounded-2xl bg-[#121317] border border-[#20222B] divide-y divide-[#1C1E26] overflow-hidden">
          {/* Resolution */}
          <div className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Resolution</div>
              <div className="text-[11px] text-[#8E93A0]">Target canvas height</div>
            </div>

            <div className="flex gap-1">
              {[VideoResolution.HD_720P, VideoResolution.FHD_1080P].map((res) => (
                <button
                  key={res}
                  id={`res-btn-${res.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => updateVideoSettings({ resolution: res })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    videoSettings.resolution === res
                      ? 'bg-[#222634] text-white font-semibold'
                      : 'bg-[#181A22] text-[#8E93A0] hover:text-white'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          {/* Framerate */}
          <div className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Framerate</div>
              <div className="text-[11px] text-[#8E93A0]">Hardware capture cadence</div>
            </div>

            <div className="flex gap-1">
              {[VideoFPS.FPS_30, VideoFPS.FPS_60].map((fps) => (
                <button
                  key={fps}
                  id={`fps-btn-${fps}`}
                  onClick={() => updateVideoSettings({ fps })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    videoSettings.fps === fps
                      ? 'bg-[#222634] text-white font-semibold'
                      : 'bg-[#181A22] text-[#8E93A0] hover:text-white'
                  }`}
                >
                  {fps} FPS
                </button>
              ))}
            </div>
          </div>

          {/* Bitrate */}
          <div className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Target Bitrate</div>
              <div className="text-[11px] text-[#8E93A0]">CBR video payload</div>
            </div>

            <div className="flex gap-1">
              {[VideoBitratePreset.BITRATE_4000, VideoBitratePreset.BITRATE_6000].map((br) => (
                <button
                  key={br}
                  id={`bitrate-btn-${br}`}
                  onClick={() => updateVideoSettings({ bitratePreset: br })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    videoSettings.bitratePreset === br
                      ? 'bg-[#222634] text-white font-semibold'
                      : 'bg-[#181A22] text-[#8E93A0] hover:text-white'
                  }`}
                >
                  {br} kbps
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: AUDIO CONFIGURATION */}
      <div className="space-y-2">
        <div className="text-[11px] font-medium tracking-wide uppercase text-[#8E93A0] px-1">
          Audio Engine
        </div>

        <div className="rounded-2xl bg-[#121317] border border-[#20222B] divide-y divide-[#1C1E26] overflow-hidden">
          {/* Audio Source Picker */}
          <div className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Source Mode</div>
              <div className="text-[11px] text-[#8E93A0]">Device and mic mixing</div>
            </div>

            <select
              value={audioSettings.mode}
              onChange={(e) => updateAudioSettings({ mode: e.target.value as AudioSourceMode })}
              className="px-3 py-1.5 rounded-lg bg-[#181A22] border border-[#262A36] text-xs text-white focus:outline-none focus:border-[#00FF66] cursor-pointer"
            >
              <option value={AudioSourceMode.DEVICE_AND_MICROPHONE}>App Audio + Mic (Mixed)</option>
              <option value={AudioSourceMode.DEVICE_AUDIO}>Device Audio Only</option>
              <option value={AudioSourceMode.MICROPHONE}>Microphone Only</option>
              <option value={AudioSourceMode.DISABLED}>Muted</option>
            </select>
          </div>

          {/* Echo Filter DSP Toggle */}
          <div className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Hardware Echo DSP</div>
              <div className="text-[11px] text-[#8E93A0]">Acoustic echo cancellation</div>
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
        </div>
      </div>
    </div>
  );
};
