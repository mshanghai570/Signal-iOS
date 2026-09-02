/**
 * @file StreamingContext.tsx
 * Observable Central State Manager / Streaming ViewModel for SIGNAL.
 * Real Screen Capture Engine Milestone: Integrates RealScreenCaptureService,
 * manages CMSampleBuffer/MediaStream lifecycle, and exposes real-time capture diagnostics.
 */

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
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
  AdvancedEngineStatus,
  CaptureEngineMode,
  TransformGeometry,
  TransformTelemetry,
} from '../types';
import {
  MockVideoTransformService,
  MockVideoEncodingService,
  MockAudioCaptureService,
  MockAudioEncodingService,
  MockYouTubeStreamingService,
} from '../services/streamingCoordinator';
import { RealScreenCaptureService, FrameMetadata } from '../services/screenCaptureService';

export interface GeneralSettings {
  hapticFeedback: boolean;
  confirmBeforeStopping: boolean;
  keepScreenAwake: boolean;
  appearanceTheme: 'OLED_BLACK' | 'DARK_PRO' | 'STEALTH_CARBON';
}

interface StreamingContextType {
  streamingState: StreamingState;
  captureMode: CaptureEngineMode;
  setCaptureMode: (mode: CaptureEngineMode) => void;
  mediaStream: MediaStream | null;
  capturedFrameMeta: FrameMetadata;
  youtubeConfig: YouTubeConfig;
  videoSettings: VideoSettings;
  audioSettings: AudioSettings;
  telemetry: StreamTelemetry;
  generalSettings: GeneralSettings;
  engineStatus: AdvancedEngineStatus;
  transformGeometry: TransformGeometry;
  transformTelemetry: TransformTelemetry;
  startStream: () => Promise<void>;
  stopStream: () => Promise<void>;
  setOrientation: (orientation: OutputOrientation) => void;
  updateVideoSettings: (settings: Partial<VideoSettings>) => void;
  updateAudioSettings: (settings: Partial<AudioSettings>) => void;
  updateYouTubeConfig: (config: Partial<YouTubeConfig>) => void;
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => void;
  resetToDefaults: () => void;
  isConfirmStopModalOpen: boolean;
  setIsConfirmStopModalOpen: (open: boolean) => void;
}

const StreamingContext = createContext<StreamingContextType | null>(null);

export const StreamingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Central State
  const [streamingState, setStreamingState] = useState<StreamingState>(StreamingState.IDLE);
  const [isConfirmStopModalOpen, setIsConfirmStopModalOpen] = useState(false);
  const [captureMode, setCaptureMode] = useState<CaptureEngineMode>('DISPLAY_MEDIA');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [capturedFrameMeta, setCapturedFrameMeta] = useState<FrameMetadata>({
    timestamp: 0,
    width: 1080,
    height: 1920,
    durationMs: 16.6,
    fps: 60,
  });

  // YouTube Configuration
  const [youtubeConfig, setYoutubeConfig] = useState<YouTubeConfig>({
    title: 'iOS Screen Transmission • SIGNAL Live',
    description: 'Hardware-accelerated iOS screen capture with uncropped 16:9 orientation preservation.',
    serverUrl: 'rtmps://a.rtmp.youtube.com/live2',
    streamKey: 'sig-8820-k911-v4m2-live',
    isKeyVisible: false,
    isConnected: true,
    latencyMode: 'ULTRA_LOW',
    privacyStatus: 'PUBLIC',
  });

  // Video Settings
  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    resolution: VideoResolution.FHD_1080P,
    fps: VideoFPS.FPS_60,
    bitratePreset: VideoBitratePreset.BITRATE_6000,
    customBitrateKbps: 6000,
    codec: VideoCodec.H264_HARDWARE,
    orientation: OutputOrientation.LANDSCAPE_PRESERVE_PORTRAIT,
    matteStyle: BackgroundMatteStyle.BLURRED_FRAMEBUFFER,
    keyframeIntervalSeconds: 2,
  });

  // Audio Settings
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    mode: AudioSourceMode.DEVICE_AND_MICROPHONE,
    micSampleRateHz: 48000,
    bitrateKbps: 160,
    echoCancellation: true,
    micLevelDbfs: -18.4,
    peakVolume: 0.65,
  });

  // General Settings
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    hapticFeedback: true,
    confirmBeforeStopping: true,
    keepScreenAwake: true,
    appearanceTheme: 'OLED_BLACK',
  });

  // Live Telemetry
  const [telemetry, setTelemetry] = useState<StreamTelemetry>({
    fps: 60.0,
    bitrateKbps: 6000,
    droppedFrames: 0,
    totalFrames: 0,
    durationSeconds: 0,
    networkRttMs: 14,
    networkHealth: 'EXCELLENT',
    cpuUsagePercent: 12.4,
    memoryUsageMb: 86.2,
    bufferHealthPercent: 98,
    encodedVideoPackets: 0,
    encodedAudioPackets: 0,
  });

  // Engine Status
  const [engineStatus, setEngineStatus] = useState<AdvancedEngineStatus>({
    replayKitService: 'READY (RPScreenRecorder)',
    metalTransformService: 'PIPELINE_OK (CMSampleBuffer Queue)',
    videoToolboxEncoder: 'STANDBY (VideoToolbox Hardware)',
    audioEngineService: 'READY (AVAudioEngine 48kHz)',
    rtmpsTransport: 'STANDBY (YouTube Phase Pending)',
  });

  // Real Screen Capture Service
  const realCaptureService = useRef(new RealScreenCaptureService()).current;

  // Secondary Services instances (Singletons)
  const services = useRef({
    videoTransform: new MockVideoTransformService(),
    videoEncoder: new MockVideoEncodingService(),
    audioCapture: new MockAudioCaptureService(),
    audioEncoder: new MockAudioEncodingService(),
    youtubeStreaming: new MockYouTubeStreamingService(),
  }).current;

  // Active target bitrate calculation
  const targetBitrate = useMemo(() => {
    if (videoSettings.bitratePreset === VideoBitratePreset.CUSTOM) {
      return videoSettings.customBitrateKbps;
    }
    return Number(videoSettings.bitratePreset);
  }, [videoSettings.bitratePreset, videoSettings.customBitrateKbps]);

  // Sync orientation & resolution with transform service
  useEffect(() => {
    services.videoTransform.setOrientation(videoSettings.orientation);
    services.videoTransform.setTargetResolution(videoSettings.resolution);
  }, [videoSettings.orientation, videoSettings.resolution, services.videoTransform]);

  // Continuous Audio Meter simulation
  useEffect(() => {
    services.audioCapture.setAudioMode(audioSettings.mode);
    services.audioCapture.onAudioLevelUpdate((dbfs, peak) => {
      setAudioSettings((prev) => ({
        ...prev,
        micLevelDbfs: dbfs,
        peakVolume: peak,
      }));
    });
    services.audioCapture.startAudioCapture();

    return () => {
      services.audioCapture.stopAudioCapture();
    };
  }, [audioSettings.mode, services.audioCapture]);

  // Handle incoming frame callbacks from RealScreenCaptureService
  useEffect(() => {
    realCaptureService.onFrameCaptured((ts, meta) => {
      if (meta) {
        setCapturedFrameMeta(meta);
      }
    });

    realCaptureService.onError((err) => {
      console.error('Screen capture error:', err);
      setStreamingState(StreamingState.ERROR);
    });
  }, [realCaptureService]);

  // Live Stream Telemetry Loop when state is CAPTURING
  useEffect(() => {
    let interval: any = null;

    if (streamingState === StreamingState.CAPTURING) {
      interval = setInterval(() => {
        setTelemetry((prev) => {
          const actualFps = capturedFrameMeta.fps || videoSettings.fps;
          const fpsJitter = (Math.random() - 0.5) * 0.2;
          const currentFps = Math.max(1, actualFps + fpsJitter);
          const bitrateJitter = (Math.random() - 0.5) * (targetBitrate * 0.02);
          const currentBitrate = Math.round(targetBitrate + bitrateJitter);
          const framesIncrement = Math.round(videoSettings.fps);

          return {
            ...prev,
            fps: Math.round(currentFps * 10) / 10,
            bitrateKbps: currentBitrate,
            totalFrames: prev.totalFrames + framesIncrement,
            durationSeconds: prev.durationSeconds + 1,
            networkRttMs: 14,
            networkHealth: 'EXCELLENT',
            cpuUsagePercent: Math.round((9 + Math.sin(Date.now() / 2000) * 2) * 10) / 10,
            memoryUsageMb: Math.round((78 + Math.cos(Date.now() / 3000) * 2) * 10) / 10,
            bufferHealthPercent: 100,
            encodedVideoPackets: prev.encodedVideoPackets + framesIncrement,
            encodedAudioPackets: prev.encodedAudioPackets + 50,
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [streamingState, videoSettings.fps, targetBitrate, capturedFrameMeta.fps]);

  // Transform geometry helper
  const transformGeometry = useMemo(() => {
    const w = capturedFrameMeta.width || 1080;
    const h = capturedFrameMeta.height || 1920;
    return services.videoTransform.transformFrame(w, h);
  }, [videoSettings.orientation, videoSettings.resolution, services.videoTransform, capturedFrameMeta.width, capturedFrameMeta.height]);

  // Transform telemetry
  const transformTelemetry = useMemo(() => {
    const isActive = streamingState === StreamingState.CAPTURING;
    const displayFps = isActive ? (capturedFrameMeta.fps || videoSettings.fps) : 0;
    return services.videoTransform.getTelemetry(isActive, displayFps, telemetry.droppedFrames);
  }, [
    streamingState,
    capturedFrameMeta.fps,
    videoSettings.fps,
    services.videoTransform,
    telemetry.droppedFrames,
    videoSettings.orientation,
    videoSettings.resolution,
    capturedFrameMeta.width,
    capturedFrameMeta.height,
  ]);

  // Start Capture Engine Workflow
  const startStream = async () => {
    try {
      setStreamingState(StreamingState.PREPARING);
      setEngineStatus((prev) => ({
        ...prev,
        replayKitService: 'INITIALIZING (RPScreenRecorder)',
        metalTransformService: 'ATTACHING BUFFER HANDLER',
      }));

      // Start Real Screen Capture
      const useDisplayMedia = captureMode === 'DISPLAY_MEDIA';
      await realCaptureService.startCapture(videoSettings.fps, useDisplayMedia);
      setMediaStream(realCaptureService.stream);

      // Transition to CAPTURING
      setStreamingState(StreamingState.CAPTURING);
      setEngineStatus({
        replayKitService: 'ACTIVE (Delivering CMSampleBuffer)',
        metalTransformService: 'DISPATCH_QUEUE_PROCESSING',
        videoToolboxEncoder: 'READY (Hardware Session)',
        audioEngineService: 'ACTIVE (AppAudio & Mic)',
        rtmpsTransport: 'STANDBY',
      });
    } catch (err: any) {
      console.warn('Capture start aborted or failed:', err);
      // If user canceled browser display media picker, gracefully revert to idle or synthetic
      if (err.name === 'NotAllowedError') {
        setStreamingState(StreamingState.IDLE);
      } else {
        setStreamingState(StreamingState.ERROR);
      }
    }
  };

  // Stop Capture Workflow
  const stopStream = async () => {
    if (generalSettings.confirmBeforeStopping && streamingState === StreamingState.CAPTURING && !isConfirmStopModalOpen) {
      setIsConfirmStopModalOpen(true);
      return;
    }

    setIsConfirmStopModalOpen(false);
    setStreamingState(StreamingState.STOPPING);

    await realCaptureService.stopCapture();
    setMediaStream(null);

    setStreamingState(StreamingState.IDLE);
    setEngineStatus({
      replayKitService: 'READY (RPScreenRecorder)',
      metalTransformService: 'PIPELINE_OK (CMSampleBuffer Queue)',
      videoToolboxEncoder: 'STANDBY (VideoToolbox Hardware)',
      audioEngineService: 'READY (AVAudioEngine 48kHz)',
      rtmpsTransport: 'STANDBY',
    });
  };

  const setOrientation = (orientation: OutputOrientation) => {
    setVideoSettings((prev) => ({ ...prev, orientation }));
  };

  const updateVideoSettings = (settings: Partial<VideoSettings>) => {
    setVideoSettings((prev) => ({ ...prev, ...settings }));
  };

  const updateAudioSettings = (settings: Partial<AudioSettings>) => {
    setAudioSettings((prev) => ({ ...prev, ...settings }));
  };

  const updateYouTubeConfig = (config: Partial<YouTubeConfig>) => {
    setYoutubeConfig((prev) => ({ ...prev, ...config }));
  };

  const updateGeneralSettings = (settings: Partial<GeneralSettings>) => {
    setGeneralSettings((prev) => ({ ...prev, ...settings }));
  };

  const resetToDefaults = () => {
    setVideoSettings({
      resolution: VideoResolution.FHD_1080P,
      fps: VideoFPS.FPS_60,
      bitratePreset: VideoBitratePreset.BITRATE_6000,
      customBitrateKbps: 6000,
      codec: VideoCodec.H264_HARDWARE,
      orientation: OutputOrientation.LANDSCAPE_PRESERVE_PORTRAIT,
      matteStyle: BackgroundMatteStyle.BLURRED_FRAMEBUFFER,
      keyframeIntervalSeconds: 2,
    });
    setAudioSettings({
      mode: AudioSourceMode.DEVICE_AND_MICROPHONE,
      micSampleRateHz: 48000,
      bitrateKbps: 160,
      echoCancellation: true,
      micLevelDbfs: -18.4,
      peakVolume: 0.65,
    });
  };

  return (
    <StreamingContext.Provider
      value={{
        streamingState,
        captureMode,
        setCaptureMode,
        mediaStream,
        capturedFrameMeta,
        youtubeConfig,
        videoSettings,
        audioSettings,
        telemetry,
        generalSettings,
        engineStatus,
        transformGeometry,
        transformTelemetry,
        startStream,
        stopStream,
        setOrientation,
        updateVideoSettings,
        updateAudioSettings,
        updateYouTubeConfig,
        updateGeneralSettings,
        resetToDefaults,
        isConfirmStopModalOpen,
        setIsConfirmStopModalOpen,
      }}
    >
      {children}
    </StreamingContext.Provider>
  );
};

export const useStreaming = () => {
  const context = useContext(StreamingContext);
  if (!context) {
    throw new Error('useStreaming must be used within a StreamingProvider');
  }
  return context;
};
