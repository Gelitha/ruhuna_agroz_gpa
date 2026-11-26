// University of Ruhuna - Faculty of Agriculture
// TypeScript Definitions for Temporary Beta Telemetry & Academic Diagnostics

import { DegreeCode, Grade, SemesterKey } from '../types';

export interface BetaConsentState {
  analyticsConsent: boolean;
  academicConsent: boolean;
  decided: boolean;
  decidedAt: string | null;
  consentVersion: string;
}

export interface BetaDeviceInfo {
  deviceCategory: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  screenDimensions: string;
  languagePreference: 'en-si' | 'en';
}

export interface BetaCourseDiagnostic {
  semester: SemesterKey;
  code: string;
  credits: number;
  confirmedGrade: Grade | null;
  projectedGrade: Grade | null;
  isRepeat: boolean;
  isExcused: boolean;
  isNgpa: boolean;
}

export interface BetaGpaSummary {
  actualCgpa: number;
  projectedCgpa: number;
  targetCgpa: number | null;
  actualCreditsAttempted: number;
  actualCreditsEarned: number;
  projectedCreditsAttempted: number;
  semesterSGPAs: Partial<
    Record<
      SemesterKey,
      {
        actualSgpa: number;
        projectedSgpa: number;
        creditsAttempted: number;
        expectedCount: number;
      }
    >
  >;
  calculationMs: number;
}

export interface BetaPlanningDiagnostics {
  targetCgpa?: number;
  targetScope?: string;
  possible?: boolean;
  achievedCgpa?: number;
  shortfall?: number;
  suggestedSummary?: Record<string, number>;
  manualGradeAllocations?: Record<string, Grade>;
  appliedCount?: number;
  updatedAt?: string;
}

export interface BetaAcademicSnapshot {
  snapshotHash: string;
  programme: DegreeCode;
  academicYear: number;
  currentSemester: SemesterKey;
  profileCount: number;
  courses: BetaCourseDiagnostic[];
  gpaSummary: BetaGpaSummary;
  planningDiagnostics: BetaPlanningDiagnostics;
  discrepancies: string[];
}

export type BetaFeedbackCategory = 'bug' | 'calculation' | 'suggestion' | 'general';

export interface BetaFeedbackPayload {
  category: BetaFeedbackCategory;
  rating: number | null;
  message: string;
  pageContext?: string;
}
