// University of Ruhuna - Faculty of Agriculture
// Anonymous Browser ID & Granular Consent Storage (Local-First)

import { BETA_CONSENT_VERSION } from './betaConfig';
import { BetaConsentState } from './betaTypes';

const STORAGE_KEY_BETA_ANON_ID = 'gradepath_beta_anon_id_v1';
const STORAGE_KEY_BETA_ANON_SECRET = 'gradepath_beta_anon_secret_v1';
const STORAGE_KEY_BETA_CONSENT = 'gradepath_beta_consent_v1';

const DEFAULT_CONSENT: BetaConsentState = {
  analyticsConsent: false,
  academicConsent: false,
  decided: false,
  decidedAt: null,
  consentVersion: BETA_CONSENT_VERSION
};

type ConsentListener = (state: BetaConsentState) => void;
const listeners = new Set<ConsentListener>();

function generateAnonId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `anon_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
    }
  } catch {
    // Fallback below
  }
  const rand = Math.random().toString(36).slice(2, 12);
  const time = Date.now().toString(36);
  return `anon_${time}_${rand}`;
}

export function getOrCreateAnonId(): string {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return 'anon_ssr_fallback';
    }
    const existing = localStorage.getItem(STORAGE_KEY_BETA_ANON_ID);
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) {
      return existing;
    }
    const created = generateAnonId();
    localStorage.setItem(STORAGE_KEY_BETA_ANON_ID, created);
    return created;
  } catch {
    return generateAnonId();
  }
}

function generateAnonSecret(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(24);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Fallback below
  }
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
}

export function getOrCreateAnonSecret(): string {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return 'ssr_secret_fallback_0000';
    }
    const existing = localStorage.getItem(STORAGE_KEY_BETA_ANON_SECRET);
    if (existing && /^[a-zA-Z0-9_-]{16,128}$/.test(existing)) {
      return existing;
    }
    const created = generateAnonSecret();
    localStorage.setItem(STORAGE_KEY_BETA_ANON_SECRET, created);
    return created;
  } catch {
    return generateAnonSecret();
  }
}

export function getBetaConsent(): BetaConsentState {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return { ...DEFAULT_CONSENT };
    }
    const raw = localStorage.getItem(STORAGE_KEY_BETA_CONSENT);
    if (!raw) return { ...DEFAULT_CONSENT };
    const parsed = JSON.parse(raw) as Partial<BetaConsentState>;
    return {
      analyticsConsent: Boolean(parsed.analyticsConsent),
      academicConsent: Boolean(parsed.academicConsent),
      decided: Boolean(parsed.decided),
      decidedAt: typeof parsed.decidedAt === 'string' ? parsed.decidedAt : null,
      consentVersion: typeof parsed.consentVersion === 'string' ? parsed.consentVersion : BETA_CONSENT_VERSION
    };
  } catch {
    return { ...DEFAULT_CONSENT };
  }
}

export function saveBetaConsent(analyticsConsent: boolean, academicConsent: boolean): BetaConsentState {
  const next: BetaConsentState = {
    analyticsConsent: Boolean(analyticsConsent),
    academicConsent: Boolean(academicConsent),
    decided: true,
    decidedAt: new Date().toISOString(),
    consentVersion: BETA_CONSENT_VERSION
  };

  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_BETA_CONSENT, JSON.stringify(next));
    }
  } catch {
    // Ignore storage quota errors
  }

  listeners.forEach(fn => {
    try {
      fn(next);
    } catch {
      // Ignore listener errors
    }
  });

  return next;
}

export function withdrawBetaConsent(): BetaConsentState {
  return saveBetaConsent(false, false);
}

export function subscribeBetaConsent(listener: ConsentListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
