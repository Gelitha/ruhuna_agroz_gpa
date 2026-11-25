// University of Ruhuna - Faculty of Agriculture
// Unified Navigation Configuration (Single Source of Truth)
// 6 Consolidated Primary Destinations + 4 Mobile Bottom Nav Destinations + Legacy Alias Redirects

import React from 'react';
import {
  LayoutDashboard,
  Calculator,
  LineChart,
  FileText,
  Users,
  Settings
} from 'lucide-react';
import { NavView } from '../types';

export type ConsolidatedNavId =
  | 'dashboard'
  | 'calculator'
  | 'analytics'
  | 'transcript'
  | 'profiles'
  | 'settings';

export type PlanningToolSubTab = 'target' | 'forecast' | 'impact';

export interface NavItemConfig {
  id: ConsolidatedNavId;
  label: string;
  mobileLabel?: string;
  section: 'ACADEMIC' | 'PERSONAL';
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const CONSOLIDATED_NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', mobileLabel: 'Home', section: 'ACADEMIC', icon: LayoutDashboard },
  { id: 'calculator', label: 'GPA Calculator', mobileLabel: 'Calculator', section: 'ACADEMIC', icon: Calculator },
  { id: 'analytics', label: 'Analytics', mobileLabel: 'Analytics', section: 'ACADEMIC', icon: LineChart },
  { id: 'transcript', label: 'Academic Transcript', mobileLabel: 'Transcript', section: 'ACADEMIC', icon: FileText },
  { id: 'profiles', label: 'Student Profiles', section: 'PERSONAL', icon: Users },
  { id: 'settings', label: 'Settings & Backup', section: 'PERSONAL', icon: Settings }
];

export const NAV_SECTIONS: Array<{
  title: 'ACADEMIC' | 'PERSONAL';
  items: NavItemConfig[];
}> = [
  {
    title: 'ACADEMIC',
    items: CONSOLIDATED_NAV_ITEMS.filter(i => i.section === 'ACADEMIC')
  },
  {
    title: 'PERSONAL',
    items: CONSOLIDATED_NAV_ITEMS.filter(i => i.section === 'PERSONAL')
  }
];

export const MOBILE_BOTTOM_NAV_ITEMS: NavItemConfig[] = [
  CONSOLIDATED_NAV_ITEMS[0], // Home (dashboard)
  CONSOLIDATED_NAV_ITEMS[1], // Calculator (calculator)
  CONSOLIDATED_NAV_ITEMS[2], // Analytics (analytics)
  CONSOLIDATED_NAV_ITEMS[3]  // Transcript (transcript)
];

const LEGACY_REDIRECT_MAP: Record<string, ConsolidatedNavId> = {
  dashboard: 'dashboard',
  calculator: 'calculator',
  grades: 'calculator',
  projection: 'calculator',
  planner: 'calculator',
  simulator: 'calculator',
  forecast: 'calculator',
  goals: 'calculator',
  analytics: 'analytics',
  progress: 'dashboard',
  requirements: 'dashboard',
  specialization: 'dashboard',
  transcript: 'transcript',
  profiles: 'profiles',
  settings: 'settings'
};

const LEGACY_PLANNING_TAB_MAP: Record<string, PlanningToolSubTab> = {
  projection: 'target',
  goals: 'target',
  forecast: 'forecast',
  simulator: 'impact'
};

export function normalizeNavView(view: NavView | string): ConsolidatedNavId {
  return LEGACY_REDIRECT_MAP[view] || 'dashboard';
}

export function getPlanningSubTabForLegacyView(view: NavView | string): PlanningToolSubTab | null {
  return LEGACY_PLANNING_TAB_MAP[view] || null;
}

export function getRouteInfo(view: NavView | string): { section: string; title: string } {
  const normalized = normalizeNavView(view);
  const item = CONSOLIDATED_NAV_ITEMS.find(i => i.id === normalized);
  return item
    ? { section: item.section, title: item.label }
    : { section: 'ACADEMIC', title: 'Dashboard' };
}
