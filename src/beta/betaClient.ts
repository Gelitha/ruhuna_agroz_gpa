// University of Ruhuna - Faculty of Agriculture
// Fault-Tolerant, Debounced & Deduplicated Beta Telemetry & Academic Diagnostics Client

import { BETA_API_ENDPOINT, BETA_CONSENT_VERSION, isBetaActive } from './betaConfig';
import {
  getBetaConsent,
  getOrCreateAnonId,
  saveBetaConsent,
  subscribeBetaConsent,
  withdrawBetaConsent
} from './betaConsent';
import {
  BetaAcademicSnapshot,
  BetaCourseDiagnostic,
  BetaDeviceInfo,
  BetaFeedbackPayload,
  BetaGpaSummary,
  BetaPlanningDiagnostics
} from './betaTypes';
import { useGradeStore } from '../store/useGradeStore';
import { calculateOverallStats } from '../utils/calculations';
import { ALL_SEMESTER_KEYS } from '../utils/projectionCalculations';
import { SemesterKey, StudentProfile } from '../types';

const SNAPSHOT_DEBOUNCE_MS = 4000;
const SESSION_SYNC_INTERVAL_MS = 60_000;

let initialized = false;
let sessionId = '';
let sessionStartedAt = Date.now();
let viewsVisited: string[] = [];
let lastSnapshotHash = '';
let snapshotTimer: ReturnType<typeof setTimeout> | null = null;
let sessionTimer: ReturnType<typeof setInterval> | null = null;
let latestPlanningDiagnostics: BetaPlanningDiagnostics = {};
let lastTrackedTab = '';
let unsubscribeStore: (() => void) | null = null;
let unsubscribeConsent: (() => void) | null = null;

function createSessionId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `sess_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    }
  } catch {
    // Fallback
  }
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function getDeviceInfo(): BetaDeviceInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      deviceCategory: 'desktop',
      browser: 'unknown',
      os: 'unknown',
      screenDimensions: '0x0',
      languagePreference: 'en'
    };
  }

  const width = window.innerWidth || window.screen?.width || 1024;
  const deviceCategory: BetaDeviceInfo['deviceCategory'] =
    width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';

  const ua = navigator.userAgent || '';
  let browser = 'Other';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua)) browser = 'Safari';

  let os = 'Other';
  if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  const showSinhala = useGradeStore.getState().showSinhalaSubtext;

  return {
    deviceCategory,
    browser,
    os,
    screenDimensions: `${window.innerWidth}x${window.innerHeight}`,
    languagePreference: showSinhala ? 'en-si' : 'en'
  };
}

function getPerformanceMetrics(): Record<string, number> {
  try {
    if (typeof performance === 'undefined' || !performance.getEntriesByType) return {};
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (!navEntries || navEntries.length === 0) return {};
    const nav = navEntries[0];
    return {
      domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd || 0),
      loadEventMs: Math.round(nav.loadEventEnd || 0),
      ttfbMs: Math.round(nav.responseStart - nav.requestStart || 0)
    };
  } catch {
    return {};
  }
}

async function postBetaPayload(payload: Record<string, unknown>, useBeacon = false): Promise<boolean> {
  if (!isBetaActive()) return false;

  try {
    const json = JSON.stringify(payload);
    if (useBeacon && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([json], { type: 'application/json' });
      return navigator.sendBeacon(BETA_API_ENDPOINT, blob);
    }

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 5000) : null;

    const res = await fetch(BETA_API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json,
      keepalive: useBeacon,
      signal: controller?.signal
    });

    if (timeoutId) clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

function buildSanitizedSnapshot(profile: StudentProfile, profileCount: number): BetaAcademicSnapshot {
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
  const stats = calculateOverallStats(profile);
  const t1 = typeof performance !== 'undefined' ? performance.now() : 0;

  const courses: BetaCourseDiagnostic[] = [];
  const semesterSGPAs: BetaGpaSummary['semesterSGPAs'] = {};
  const discrepancies: string[] = [];

  for (const semKey of ALL_SEMESTER_KEYS) {
    const semCourses = profile.semesters?.[semKey] || [];
    for (const c of semCourses) {
      if (!c.grade && !c.isRepeat && !c.isExcused) continue;
      courses.push({
        semester: semKey,
        code: c.code,
        credits: c.credits,
        confirmedGrade: !c.isExpected && c.grade ? c.grade : null,
        projectedGrade: c.isExpected && c.grade ? c.grade : null,
        isRepeat: Boolean(c.isRepeat),
        isExcused: Boolean(c.isExcused),
        isNgpa: Boolean(c.isNgpa)
      });
    }

    const sStat = stats.semStats?.[semKey];
    if (sStat && (sStat.gpaCreditsAttempted > 0 || sStat.realCreditsAttempted > 0)) {
      semesterSGPAs[semKey] = {
        actualSgpa: Number(sStat.realSgpa.toFixed(4)),
        projectedSgpa: Number(sStat.sgpa.toFixed(4)),
        creditsAttempted: sStat.gpaCreditsAttempted,
        expectedCount: sStat.expectedCoursesCount
      };
      if (Number.isNaN(sStat.sgpa) || sStat.sgpa < 0 || sStat.sgpa > 4.0) {
        discrepancies.push(`invalid_sgpa_${semKey}`);
      }
    }
  }

  if (Number.isNaN(stats.cgpa) || stats.cgpa < 0 || stats.cgpa > 4.0) {
    discrepancies.push('invalid_projected_cgpa');
  }
  if (Number.isNaN(stats.realCgpa) || stats.realCgpa < 0 || stats.realCgpa > 4.0) {
    discrepancies.push('invalid_actual_cgpa');
  }
  if (!stats.hasExpectedCourses && Math.abs(stats.cgpa - stats.realCgpa) > 0.001) {
    discrepancies.push('actual_projected_mismatch_without_expected');
  }

  const gpaSummary: BetaGpaSummary = {
    actualCgpa: Number(stats.realCgpa.toFixed(4)),
    projectedCgpa: Number(stats.cgpa.toFixed(4)),
    targetCgpa: profile.projectionTargetCgpa ?? null,
    actualCreditsAttempted: stats.realCreditsAttempted,
    actualCreditsEarned: stats.realCreditsEarned,
    projectedCreditsAttempted: stats.totalGpaCreditsAttempted,
    semesterSGPAs,
    calculationMs: Math.round((t1 - t0) * 100) / 100
  };

  const bodyForHash = {
    programme: profile.degree,
    academicYear: profile.currentAcademicYear || 1,
    currentSemester: (profile.currentSemester || '1-1') as SemesterKey,
    profileCount,
    courses,
    gpaSummary: {
      ...gpaSummary,
      calculationMs: 0 // Exclude timing jitter from deduplication hash
    },
    planningDiagnostics: latestPlanningDiagnostics,
    discrepancies
  };

  const snapshotHash = fnv1aHash(JSON.stringify(bodyForHash));

  return {
    snapshotHash,
    ...bodyForHash,
    gpaSummary
  };
}

function scheduleAcademicSnapshotSync(): void {
  if (!isBetaActive()) return;
  const consent = getBetaConsent();
  if (!consent.decided || !consent.academicConsent) return;

  if (snapshotTimer) clearTimeout(snapshotTimer);
  snapshotTimer = setTimeout(() => {
    snapshotTimer = null;
    if (!isBetaActive()) return;
    const latestConsent = getBetaConsent();
    if (!latestConsent.decided || !latestConsent.academicConsent) return;

    try {
      const state = useGradeStore.getState();
      const activeProfile = state.getActiveProfile();
      if (!activeProfile) return;

      const snapshot = buildSanitizedSnapshot(activeProfile, state.profiles.length);
      if (snapshot.snapshotHash === lastSnapshotHash) return;

      lastSnapshotHash = snapshot.snapshotHash;
      void postBetaPayload({
        action: 'snapshot',
        anonId: getOrCreateAnonId(),
        sessionId,
        snapshot
      });
    } catch {
      // Never affect GPA calculation or local saving
    }
  }, SNAPSHOT_DEBOUNCE_MS);
}

function syncSession(useBeacon = false): void {
  if (!isBetaActive()) return;
  const consent = getBetaConsent();
  if (!consent.decided || !consent.analyticsConsent) return;

  const durationSeconds = Math.round((Date.now() - sessionStartedAt) / 1000);
  void postBetaPayload(
    {
      action: 'session',
      anonId: getOrCreateAnonId(),
      sessionId,
      durationSeconds,
      viewsVisited: viewsVisited.slice(-50),
      performanceMetrics: getPerformanceMetrics(),
      device: getDeviceInfo()
    },
    useBeacon
  );
}

export function trackBetaEvent(
  eventName: string,
  featureArea?: string,
  metadata?: Record<string, unknown>
): void {
  if (!isBetaActive()) return;
  const consent = getBetaConsent();
  if (!consent.decided || !consent.analyticsConsent) return;

  void postBetaPayload({
    action: 'event',
    anonId: getOrCreateAnonId(),
    sessionId,
    eventName,
    featureArea,
    metadata: metadata || {}
  });
}

export function recordPlanningDiagnostics(diagnostics: BetaPlanningDiagnostics): void {
  if (!isBetaActive()) return;
  latestPlanningDiagnostics = {
    ...diagnostics,
    updatedAt: new Date().toISOString()
  };

  const consent = getBetaConsent();
  if (consent.decided && consent.academicConsent) {
    scheduleAcademicSnapshotSync();
  }
  if (consent.decided && consent.analyticsConsent) {
    trackBetaEvent('planning_target_applied', 'planning_tools', {
      possible: diagnostics.possible,
      targetScope: diagnostics.targetScope,
      appliedCount: diagnostics.appliedCount
    });
  }
}

export async function updateBetaConsentPreferences(
  analyticsConsent: boolean,
  academicConsent: boolean,
  consentAction: 'granted' | 'updated' | 'withdrawn' = 'updated'
): Promise<void> {
  const prev = getBetaConsent();
  saveBetaConsent(analyticsConsent, academicConsent);

  if (!isBetaActive()) return;

  await postBetaPayload({
    action: 'consent',
    anonId: getOrCreateAnonId(),
    analyticsConsent,
    academicConsent,
    consentVersion: BETA_CONSENT_VERSION,
    consentAction,
    device: getDeviceInfo()
  });

  if (analyticsConsent && !prev.analyticsConsent) {
    syncSession(false);
  }
  if (academicConsent) {
    lastSnapshotHash = '';
    scheduleAcademicSnapshotSync();
  }
}

export async function submitBetaFeedback(payload: BetaFeedbackPayload): Promise<boolean> {
  if (!isBetaActive()) return false;
  return postBetaPayload({
    action: 'feedback',
    anonId: getOrCreateAnonId(),
    sessionId,
    category: payload.category,
    rating: payload.rating,
    message: payload.message,
    pageContext: payload.pageContext || useGradeStore.getState().activeTab,
    metadata: {
      device: getDeviceInfo()
    }
  });
}

export async function deleteMyBetaData(): Promise<boolean> {
  if (!isBetaActive()) return false;
  const ok = await postBetaPayload({
    action: 'delete_user_data',
    anonId: getOrCreateAnonId()
  });
  withdrawBetaConsent();
  lastSnapshotHash = '';
  return ok;
}

function sanitizeErrorString(input: string): string {
  return input
    .replace(/[A-Z]:\\[^\s:)]+/gi, '[path]')
    .replace(/\/Users\/[^\s:)]+/gi, '[path]')
    .slice(0, 500);
}

export function initBetaTelemetry(): () => void {
  if (!isBetaActive() || initialized || typeof window === 'undefined') {
    return () => {};
  }

  initialized = true;
  sessionId = createSessionId();
  sessionStartedAt = Date.now();
  const initialTab = useGradeStore.getState().activeTab;
  lastTrackedTab = initialTab;
  viewsVisited = [initialTab];

  const onError = (event: ErrorEvent) => {
    if (!isBetaActive()) return;
    const consent = getBetaConsent();
    if (!consent.decided || !consent.analyticsConsent) return;

    void postBetaPayload({
      action: 'error',
      anonId: getOrCreateAnonId(),
      sessionId,
      errorType: 'window_error',
      message: sanitizeErrorString(event.message || 'Unknown error'),
      source: sanitizeErrorString(event.filename || ''),
      stackPreview: event.error?.stack ? sanitizeErrorString(String(event.error.stack)) : undefined,
      context: {
        view: useGradeStore.getState().activeTab
      }
    });
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (!isBetaActive()) return;
    const consent = getBetaConsent();
    if (!consent.decided || !consent.analyticsConsent) return;

    const reason = event.reason instanceof Error ? event.reason.message : String(event.reason || 'Unhandled rejection');
    void postBetaPayload({
      action: 'error',
      anonId: getOrCreateAnonId(),
      sessionId,
      errorType: 'unhandled_rejection',
      message: sanitizeErrorString(reason),
      context: {
        view: useGradeStore.getState().activeTab
      }
    });
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      syncSession(true);
    }
  };

  const onPageHide = () => {
    syncSession(true);
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', onPageHide);

  sessionTimer = setInterval(() => syncSession(false), SESSION_SYNC_INTERVAL_MS);

  // Subscribe to meaningful store changes (never uploading raw localStorage)
  unsubscribeStore = useGradeStore.subscribe((state, prevState) => {
    if (!isBetaActive()) return;

    if (state.activeTab !== lastTrackedTab) {
      lastTrackedTab = state.activeTab;
      if (!viewsVisited.includes(state.activeTab)) {
        viewsVisited.push(state.activeTab);
      }
      trackBetaEvent('view_changed', state.activeTab);
    }

    if (
      state.profiles !== prevState.profiles ||
      state.activeProfileId !== prevState.activeProfileId
    ) {
      scheduleAcademicSnapshotSync();
    }
  });

  unsubscribeConsent = subscribeBetaConsent(next => {
    if (!next.academicConsent && snapshotTimer) {
      clearTimeout(snapshotTimer);
      snapshotTimer = null;
    }
  });

  // Initial session ping only if analytics consent was already granted in a prior visit
  if (getBetaConsent().analyticsConsent) {
    syncSession(false);
  }

  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('pagehide', onPageHide);
    if (sessionTimer) clearInterval(sessionTimer);
    if (snapshotTimer) clearTimeout(snapshotTimer);
    if (unsubscribeStore) unsubscribeStore();
    if (unsubscribeConsent) unsubscribeConsent();
    initialized = false;
  };
}
