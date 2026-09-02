/**
 * @file ConfirmStopModal.tsx
 * SIGNAL — iOS 15/16 styled Alert Confirmation Modal for stopping active broadcast.
 */

import React from 'react';
import { useStreaming } from '../context/StreamingContext';
import { AlertCircle, Square } from 'lucide-react';

export const ConfirmStopModal: React.FC = () => {
  const { isConfirmStopModalOpen, setIsConfirmStopModalOpen, stopStream } = useStreaming();

  if (!isConfirmStopModalOpen) return null;

  return (
    <div
      id="confirm-stop-stream-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans"
    >
      <div className="w-full max-w-xs rounded-2xl bg-[#181920] border border-[#2A2E3C] shadow-2xl p-5 text-center space-y-4">
        {/* Warning Icon */}
        <div className="w-10 h-10 rounded-full bg-[#FF3B30]/15 flex items-center justify-center mx-auto text-[#FF3B30]">
          <AlertCircle className="w-5 h-5" />
        </div>

        {/* Text */}
        <div className="space-y-1">
          <h2 className="text-base font-bold text-white tracking-tight">Stop Broadcast?</h2>
          <p className="text-xs text-[#8E93A0] leading-relaxed">
            Your live stream to YouTube will be terminated immediately.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            id="confirm-end-stream-btn"
            onClick={stopStream}
            className="w-full py-2.5 rounded-xl bg-[#FF3B30] hover:bg-[#E03126] text-white text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>End Stream</span>
          </button>

          <button
            id="cancel-end-stream-btn"
            onClick={() => setIsConfirmStopModalOpen(false)}
            className="w-full py-2.5 rounded-xl bg-[#222530] hover:bg-[#2A2E3C] text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
