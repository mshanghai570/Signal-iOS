/**
 * @file SwiftProjectViewer.tsx
 * SIGNAL — Native iOS Swift / SwiftUI Source Explorer & 1-Click Xcode Project ZIP Exporter.
 * Clean, restrained developer interface with syntax highlight layout and direct file inspection.
 */

import React, { useState } from 'react';
import { SWIFT_PROJECT_FILES, SwiftProjectFile, generateXcodeProjectZip } from '../swift/swiftFiles';
import {
  Download,
  Copy,
  Check,
  ShieldCheck,
  Code2,
} from 'lucide-react';

export const SwiftProjectViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<SwiftProjectFile>(SWIFT_PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsExporting(true);
      const zipBlob = await generateXcodeProjectZip();
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'SIGNAL-iOS-Project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export Xcode project:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 pb-6 font-sans">
      {/* Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1">
        <div>
          <div className="text-[11px] font-medium tracking-wide uppercase text-[#8E93A0]">
            Native Xcode Workspace
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
            Swift Project
          </h1>
        </div>

        <button
          id="download-xcode-zip-btn"
          onClick={handleDownloadZip}
          disabled={isExporting}
          className="px-4 py-2 rounded-xl bg-[#00FF66] hover:bg-[#00E65C] text-black text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
        >
          {isExporting ? (
            <div className="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>{isExporting ? 'Packaging...' : 'Export Xcode Project (.zip)'}</span>
        </button>
      </div>

      {/* Target Spec Bar */}
      <div className="rounded-xl bg-[#121317] border border-[#20222B] p-3 flex items-center justify-between text-xs text-[#8E93A0]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#00FF66]" />
          <span className="text-white font-medium">iOS 15.0–16.6 Deployment Target Verified</span>
        </div>
        <span className="font-mono text-[11px]">Swift 5.7+</span>
      </div>

      {/* File Navigation & Code Viewer */}
      <div className="rounded-2xl bg-[#121317] border border-[#20222B] overflow-hidden">
        {/* Horizontal File Selector Tabs */}
        <div className="p-1.5 bg-[#14161C] border-b border-[#1E222B] flex items-center gap-1 overflow-x-auto custom-scrollbar">
          {SWIFT_PROJECT_FILES.map((file) => {
            const isSelected = selectedFile.path === file.path;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#222634] text-white font-semibold'
                    : 'text-[#8E93A0] hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{file.path.split('/').pop()}</span>
              </button>
            );
          })}
        </div>

        {/* File Meta & Copy Button */}
        <div className="px-4 py-2 bg-[#0E1015] border-b border-[#1A1D26] flex items-center justify-between text-xs text-[#8E93A0] font-mono">
          <span className="text-white truncate">{selectedFile.path}</span>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-[#8E93A0] hover:text-white px-2.5 py-1 rounded bg-[#181A22] border border-[#242834] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#00FF66]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="p-4 bg-[#08090C] overflow-x-auto max-h-[460px] custom-scrollbar">
          <pre className="text-xs font-mono text-[#D8DEE9] leading-relaxed select-all">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
