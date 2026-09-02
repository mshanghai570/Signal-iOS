/**
 * @file App.tsx
 * SIGNAL — Professional iOS Screen-Transmission & YouTube Streaming System
 * Main application component for iOS 15.0–16.6 architecture.
 */

import React, { useState } from 'react';
import { StreamingProvider, useStreaming } from './context/StreamingContext';
import { TabType } from './types';
import { NavigationTabBar } from './components/NavigationTabBar';
import { DashboardScreen } from './components/DashboardScreen';
import { StreamSetupScreen } from './components/StreamSetupScreen';
import { PreviewScreen } from './components/PreviewScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { SwiftProjectViewer } from './components/SwiftProjectViewer';
import { ConfirmStopModal } from './components/ConfirmStopModal';
import { DeviceFrameWrapper } from './components/DeviceFrameWrapper';

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('DASHBOARD');

  return (
    <DeviceFrameWrapper>
      {/* Screen Views */}
      <div className="relative">
        {activeTab === 'DASHBOARD' && <DashboardScreen onNavigate={setActiveTab} />}
        {activeTab === 'STREAM' && <StreamSetupScreen />}
        {activeTab === 'PREVIEW' && <PreviewScreen />}
        {activeTab === 'SETTINGS' && <SettingsScreen />}
        {activeTab === 'SWIFT_CODE' && <SwiftProjectViewer />}
      </div>

      {/* Persistent Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 max-w-full">
        <NavigationTabBar activeTab={activeTab} onSelectTab={setActiveTab} />
      </div>

      {/* Confirmation Modal */}
      <ConfirmStopModal />
    </DeviceFrameWrapper>
  );
};

export default function App() {
  return (
    <StreamingProvider>
      <MainContent />
    </StreamingProvider>
  );
}
