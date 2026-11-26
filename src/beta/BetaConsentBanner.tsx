// University of Ruhuna - Faculty of Agriculture
// Non-Intrusive Bilingual Beta Testing Consent Banner

import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, ChevronDown, ChevronUp } from 'lucide-react';
import { isBetaActive, getBetaEndDateDisplay } from './betaConfig';
import { getBetaConsent, subscribeBetaConsent } from './betaConsent';
import { updateBetaConsentPreferences } from './betaClient';
import { BETA_TEXT } from './betaTranslations';
import { SiSubtext } from '../components/common/BilingualText';

export const BetaConsentBanner: React.FC = () => {
  const betaActive = isBetaActive();
  const [consent, setConsent] = useState(() => getBetaConsent());
  const [analyticsChecked, setAnalyticsChecked] = useState(true);
  const [academicChecked, setAcademicChecked] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return subscribeBetaConsent(next => setConsent(next));
  }, []);

  if (!betaActive || consent.decided) return null;

  const handleSave = async (analytics: boolean, academic: boolean, action: 'granted' | 'withdrawn') => {
    setSubmitting(true);
    await updateBetaConsentPreferences(analytics, academic, action);
    setSubmitting(false);
  };

  return (
    <div
      className="fixed bottom-20 md:bottom-5 right-3 left-3 md:left-auto md:max-w-lg z-40 rounded-2xl bg-white border border-emerald-200 shadow-2xl p-4 sm:p-5 text-left animate-in fade-in duration-200"
      role="dialog"
      aria-label="Beta testing consent"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                {BETA_TEXT.notice.badge} • Until {getBetaEndDateDisplay()}
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-neutral-900 mt-1">
              {BETA_TEXT.banner.title}
            </h3>
            <SiSubtext text={BETA_TEXT.banner.titleSi} className="text-[#176B45] text-[11px]" />
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleSave(false, false, 'withdrawn')}
          disabled={submitting}
          className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          aria-label="Decline beta data collection"
          title="Decline"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
        {BETA_TEXT.banner.subtitle}
      </p>
      <SiSubtext text={BETA_TEXT.banner.subtitleSi} className="text-neutral-500 text-[11px] mt-0.5" />

      {/* Separate Opt-in Toggles */}
      <div className="mt-3 space-y-2">
        <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 cursor-pointer hover:bg-neutral-50">
          <input
            type="checkbox"
            checked={analyticsChecked}
            onChange={e => setAnalyticsChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-emerald-700 focus:ring-emerald-600"
          />
          <div className="text-xs">
            <div className="font-bold text-neutral-900">{BETA_TEXT.banner.analyticsLabel}</div>
            <div className="text-[11px] text-neutral-600">{BETA_TEXT.banner.analyticsDesc}</div>
            <SiSubtext text={BETA_TEXT.banner.analyticsSi} className="text-[10.5px] text-emerald-800 mt-0.5" />
          </div>
        </label>

        <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 cursor-pointer hover:bg-neutral-50">
          <input
            type="checkbox"
            checked={academicChecked}
            onChange={e => setAcademicChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-emerald-700 focus:ring-emerald-600"
          />
          <div className="text-xs">
            <div className="font-bold text-neutral-900">{BETA_TEXT.banner.academicLabel}</div>
            <div className="text-[11px] text-neutral-600">{BETA_TEXT.banner.academicDesc}</div>
            <SiSubtext text={BETA_TEXT.banner.academicSi} className="text-[10.5px] text-emerald-800 mt-0.5" />
          </div>
        </label>
      </div>

      {/* Expandable Details */}
      <button
        type="button"
        onClick={() => setShowDetails(prev => !prev)}
        className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:underline"
      >
        {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        <span>{showDetails ? BETA_TEXT.banner.hideDetails : BETA_TEXT.banner.showDetails}</span>
      </button>

      {showDetails && (
        <div className="mt-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-950 space-y-1.5 leading-relaxed">
          <p><strong>Excluded:</strong> {BETA_TEXT.notice.excludedNote}</p>
          <p><strong>Why &amp; Retention:</strong> {BETA_TEXT.notice.whyBody}</p>
          <p><strong>Access:</strong> {BETA_TEXT.notice.accessBody}</p>
          <p><strong>Control:</strong> {BETA_TEXT.notice.controlBody}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-3.5 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          disabled={submitting}
          onClick={() => void handleSave(false, false, 'withdrawn')}
          className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition disabled:opacity-50"
        >
          {BETA_TEXT.banner.decline}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() =>
            void handleSave(
              analyticsChecked,
              academicChecked,
              analyticsChecked || academicChecked ? 'granted' : 'withdrawn'
            )
          }
          className="px-3.5 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-black transition disabled:opacity-50"
        >
          {BETA_TEXT.banner.acceptSelected}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => void handleSave(true, true, 'granted')}
          className="px-3.5 py-1.5 rounded-xl bg-[#176B45] text-white text-xs font-bold hover:bg-[#103B2D] transition disabled:opacity-50"
        >
          {BETA_TEXT.banner.acceptAll}
        </button>
      </div>
    </div>
  );
};
