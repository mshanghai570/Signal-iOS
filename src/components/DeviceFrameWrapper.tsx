/**
 * @file DeviceFrameWrapper.tsx
 * SIGNAL — iOS Device Frame & Studio Monitor Layout Controller.
 * Clean, restrained hardware presentation with true OLED black canvas and graphite finishes.
 */

import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Wifi, Battery, Radio } from 'lucide-react';
import { useStreaming } from '../context/StreamingContext';
import { StreamingState } from '../types';

interface DeviceFrameWrapperProps {
  children: React.ReactNode;
}

export const DeviceFrameWrapper: React.FC<DeviceFrameWrapperProps> = ({ children }) => {
  const [isDeviceFrame, setIsDeviceFrame] = useState(true);
  const [timeString, setTimeString] = useState('9:41');
  const { streamingState } = useStreaming();
  const isCapturing = streamingState === StreamingState.CAPTURING;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#000000] text-[#E6E8EC] flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 selection:bg-[#00FF66]/30 selection:text-white font-sans">
      {/* Top Header Bar */}
      <header className="w-full max-w-4xl flex items-center justify-between py-2 px-3.5 mb-3 bg-[#0C0D11]/90 backdrop-blur-md rounded-xl border border-[#1C1F28]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#14161C] border border-[#222632] flex items-center justify-center text-[#00FF66] font-mono font-bold text-xs">
            SIG
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white tracking-tight">SIGNAL</span>
              <span className="text-[10px] text-[#8E93A0] font-mono">
                iOS 15.0–16.6
              </span>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#12141A] p-0.5 rounded-lg border border-[#1E222B]">
          <button
            id="view-mode-iphone-btn"
            onClick={() => setIsDeviceFrame(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              isDeviceFrame
                ? 'bg-[#202430] text-white shadow-sm'
                : 'text-[#8E93A0] hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">iPhone View</span>
          </button>

          <button
            id="view-mode-expanded-btn"
            onClick={() => setIsDeviceFrame(false)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              !isDeviceFrame
                ? 'bg-[#202430] text-white shadow-sm'
                : 'text-[#8E93A0] hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Expanded</span>
          </button>
        </div>
      </header>

      {/* Main Container Viewport */}
      {isDeviceFrame ? (
        /* iPhone Hardware Mockup Frame */
        <div className="w-full max-w-[420px] my-auto">
          <div className="relative mx-auto rounded-[48px] p-3 bg-[#12141A] shadow-[0_0_60px_rgba(0,0,0,0.95)] border border-[#242834]">
            {/* Dynamic Island / Notch */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-50 flex items-center justify-end px-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0D0F14] border border-white/10" />
            </div>

            {/* Inner Phone Screen */}
            <div className="w-full h-[780px] bg-[#000000] rounded-[38px] overflow-hidden flex flex-col relative border border-[#161820]">
              {/* iOS Status Bar */}
              <div className="h-10 px-6 pt-3 flex items-center justify-between text-xs font-medium text-white z-40 select-none bg-black/80 backdrop-blur-md">
                <span className="font-semibold text-[13px]">{timeString}</span>

                <div className="flex items-center gap-2 text-[#E5E5EA]">
                  {isCapturing && (
                    <span className="flex items-center gap-1 text-[10px] text-[#00FF66] font-mono font-medium bg-[#00FF66]/10 px-1.5 py-0.2 rounded border border-[#00FF66]/20">
                      <Radio className="w-2.5 h-2.5" /> LIVE
                    </span>
                  )}
                  <Wifi className="w-3.5 h-3.5" />
                  <div className="flex items-center gap-1 text-[11px] font-mono">
                    <span>5G</span>
                    <Battery className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              {/* Scrollable Screen Content */}
              <div className="flex-1 overflow-y-auto px-4 pt-2 pb-20 custom-scrollbar">
                {children}
              </div>

              {/* Bottom Home Indicator */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full z-50 pointer-events-none" />
            </div>
          </div>
        </div>
      ) : (
        /* Fullscreen Studio Console Layout */
        <div className="w-full max-w-4xl bg-[#08090C] rounded-2xl border border-[#1A1D26] p-4 sm:p-6 shadow-2xl flex flex-col min-h-[750px] relative overflow-hidden">
          <div className="flex-1 overflow-y-auto pb-16">{children}</div>
        </div>
      )}
    </div>
  );
};
