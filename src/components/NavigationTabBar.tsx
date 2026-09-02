/**
 * @file NavigationTabBar.tsx
 * SIGNAL — iOS 15/16 styled bottom navigation tab bar.
 * Authentic Apple human interface hierarchy with refined typography and understated active indicators.
 */

import React from 'react';
import { TabType, StreamingState } from '../types';
import { Radio, Sliders, PlaySquare, Settings, Code2 } from 'lucide-react';
import { useStreaming } from '../context/StreamingContext';

interface NavigationTabBarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const NavigationTabBar: React.FC<NavigationTabBarProps> = ({ activeTab, onSelectTab }) => {
  const { streamingState } = useStreaming();
  const isCapturing = streamingState === StreamingState.CAPTURING;

  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'DASHBOARD',
      label: 'Dashboard',
      icon: <Radio className="w-5 h-5" />,
      badge: isCapturing ? 'REC' : undefined,
    },
    {
      id: 'STREAM',
      label: 'Stream',
      icon: <Sliders className="w-5 h-5" />,
    },
    {
      id: 'PREVIEW',
      label: 'Preview',
      icon: <PlaySquare className="w-5 h-5" />,
    },
    {
      id: 'SETTINGS',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
    },
    {
      id: 'SWIFT_CODE',
      label: 'Swift Project',
      icon: <Code2 className="w-5 h-5" />,
    },
  ];

  return (
    <nav
      id="signal-bottom-tab-bar"
      aria-label="SIGNAL Navigation"
      className="shrink-0 bg-[#0C0D11]/90 backdrop-blur-2xl border-t border-[#1C1F28] px-2 py-1.5 z-40"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id.toLowerCase()}`}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors relative cursor-pointer ${
                isActive ? 'text-white' : 'text-[#8E93A0] hover:text-[#C5CAD6]'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge && (
                  <span className="absolute -top-1 -right-2.5 px-1 py-0.2 bg-[#FF3B30] text-white text-[8px] font-bold rounded-sm uppercase tracking-tight shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 font-medium tracking-tight whitespace-nowrap transition-colors ${
                  isActive ? 'font-semibold text-white' : 'text-[#8E93A0]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
