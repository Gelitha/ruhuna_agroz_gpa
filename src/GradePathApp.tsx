// University of Ruhuna - Faculty of Agriculture
// GradePath Root Application (11 Core Dedicated Views as per Specification)

import React, { useEffect } from 'react';
import { useGradeStore } from './store/useGradeStore';
import { normalizeNavView } from './config/navigation';
import { initBetaTelemetry } from './beta/betaClient';
import { BetaConsentBanner } from './beta/BetaConsentBanner';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { ProfileSetupModal } from './components/profiles/ProfileSetupModal';

// 6 Consolidated Screen Views
import { DashboardView } from './components/dashboard/DashboardView';
import { GpaCalculatorView } from './components/calculator/GpaCalculatorView';
import { AcademicTranscriptView } from './components/transcript/AcademicTranscriptView';
import { GpaAnalyticsView } from './components/analytics/GpaAnalyticsView';
import { StudentProfilesView } from './components/profiles/StudentProfilesView';
import { SettingsView } from './components/settings/SettingsView';

export const GradePathApp: React.FC = () => {
  const { activeTab, activeProfileId, isSidebarExpanded } = useGradeStore();

  useEffect(() => {
    return initBetaTelemetry();
  }, []);

  const renderCurrentView = () => {
    const view = normalizeNavView(activeTab);
    switch (view) {
      case 'dashboard':
        return <DashboardView />;
      case 'calculator':
        return <GpaCalculatorView />;
      case 'analytics':
        return <GpaAnalyticsView />;
      case 'transcript':
        return <AcademicTranscriptView />;
      case 'profiles':
        return <StudentProfilesView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-main flex font-sans selection:bg-primary-light selection:text-primary">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area - dynamically offset by desktop sidebar */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 w-full min-w-0 ml-0 ${
          isSidebarExpanded ? 'md:ml-68' : 'md:ml-20'
        }`}
      >
        {/* Contextual Sticky Header */}
        <Header />

        {/* View Content (Comfortable, generous sizing, responsive padding with mobile bottom nav clearance) */}
        <main className="flex-1 p-4 sm:p-5 lg:p-7 max-w-[1600px] w-full mx-auto min-w-0 overflow-x-hidden pb-24 md:pb-8">
          <React.Fragment key={activeProfileId}>
            {renderCurrentView()}
          </React.Fragment>
        </main>

        {/* Global Platform Footer */}
        <Footer />
      </div>

      {/* Ergonomic Mobile-First Sticky Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* First-Time Experience & Unified Profile Setup Modal */}
      <ProfileSetupModal />

      {/* Temporary Beta Consent Banner (auto-hidden when beta is disabled/expired) */}
      <BetaConsentBanner />
    </div>
  );
};

export default GradePathApp;
