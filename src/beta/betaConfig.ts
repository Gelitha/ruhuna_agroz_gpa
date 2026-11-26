/// <reference types="vite/client" />
// University of Ruhuna - Faculty of Agriculture
// Beta Testing Configuration & Termination Guard

export const BETA_RETENTION_DAYS = 30;
export const BETA_CONSENT_VERSION = '1.0';
export const BETA_API_ENDPOINT = '/api/beta';

export function getBetaEndDateRaw(): string {
  return String(import.meta.env.VITE_BETA_END_DATE || '').trim();
}

export function isBetaExpired(): boolean {
  const raw = getBetaEndDateRaw();
  if (!raw) return false;

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T23:59:59.999Z` : raw;
  const endMs = Date.parse(normalized);
  if (Number.isNaN(endMs)) return false;

  return Date.now() > endMs;
}

export function isBetaActive(): boolean {
  const modeEnabled = String(import.meta.env.VITE_BETA_MODE || '').toLowerCase() === 'true';
  if (!modeEnabled) return false;
  return !isBetaExpired();
}

export function getBetaEndDateDisplay(): string {
  const raw = getBetaEndDateRaw();
  if (!raw) return 'End of Beta Testing Period';
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T23:59:59.999Z` : raw;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
