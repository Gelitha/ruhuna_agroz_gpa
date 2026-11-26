// University of Ruhuna - Faculty of Agriculture
// Beta Participation Controls, Deletion Request & Voluntary Feedback (Settings View)

import React, { useState, useEffect } from 'react';
import { FlaskConical, Copy, Check, Trash2, Send } from 'lucide-react';
import { isBetaActive, getBetaEndDateDisplay } from './betaConfig';
import { getBetaConsent, getOrCreateAnonId, subscribeBetaConsent } from './betaConsent';
import {
  deleteMyBetaData,
  submitBetaFeedback,
  updateBetaConsentPreferences
} from './betaClient';
import { BETA_TEXT } from './betaTranslations';
import { BetaFeedbackCategory } from './betaTypes';
import { SiSubtext } from '../components/common/BilingualText';

export const BetaSettingsSection: React.FC = () => {
  if (!isBetaActive()) return null;

  const [consent, setConsent] = useState(() => getBetaConsent());
  const [anonId] = useState(() => getOrCreateAnonId());
  const [copied, setCopied] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [category, setCategory] = useState<BetaFeedbackCategory>('general');
  const [rating, setRating] = useState<number>(5);
  const [message, setMessage] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [sendingFeedback, setSendingFeedback] = useState(false);

  useEffect(() => {
    return subscribeBetaConsent(next => setConsent(next));
  }, []);

  const handleToggle = async (field: 'analytics' | 'academic') => {
    const nextAnalytics = field === 'analytics' ? !consent.analyticsConsent : consent.analyticsConsent;
    const nextAcademic = field === 'academic' ? !consent.academicConsent : consent.academicConsent;
    await updateBetaConsentPreferences(
      nextAnalytics,
      nextAcademic,
      nextAnalytics || nextAcademic ? 'updated' : 'withdrawn'
    );
  };

  const handleCopyAnonId = async () => {
    try {
      await navigator.clipboard.writeText(anonId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleDeleteData = async () => {
    if (!confirm(BETA_TEXT.settings.deleteConfirm)) return;
    setDeleting(true);
    setDeleteStatus(null);
    const ok = await deleteMyBetaData();
    setDeleting(false);
    setDeleteStatus(ok ? BETA_TEXT.settings.deleteSuccess : BETA_TEXT.settings.deleteError);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSendingFeedback(true);
    setFeedbackStatus(null);
    const ok = await submitBetaFeedback({
      category,
      rating,
      message: message.trim(),
      pageContext: 'settings'
    });
    setSendingFeedback(false);
    if (ok) {
      setMessage('');
      setFeedbackStatus(BETA_TEXT.settings.feedbackThanks);
    } else {
      setFeedbackStatus('Could not send feedback right now. Please try again later.');
    }
  };

  return (
    <div className="p-6 sm:p-7 rounded-3xl bg-white border border-emerald-200/90 shadow-xs space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-200">
        <div>
          <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-emerald-800" />
            <span>{BETA_TEXT.settings.sectionTitle}</span>
          </h3>
          <SiSubtext text={BETA_TEXT.settings.sectionTitleSi} className="text-[#176B45]" />
        </div>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
          Active until {getBetaEndDateDisplay()}
        </span>
      </div>

      {/* Consent Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-neutral-900">{BETA_TEXT.banner.analyticsLabel}</div>
            <p className="text-[11px] text-neutral-600 mt-0.5">{BETA_TEXT.banner.analyticsDesc}</p>
            <SiSubtext text={BETA_TEXT.banner.analyticsSi} className="text-[10.5px] text-emerald-800 mt-0.5" />
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={consent.analyticsConsent}
            onClick={() => void handleToggle('analytics')}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              consent.analyticsConsent ? 'bg-[#176B45]' : 'bg-neutral-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${
                consent.analyticsConsent ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-neutral-900">{BETA_TEXT.banner.academicLabel}</div>
            <p className="text-[11px] text-neutral-600 mt-0.5">{BETA_TEXT.banner.academicDesc}</p>
            <SiSubtext text={BETA_TEXT.banner.academicSi} className="text-[10.5px] text-emerald-800 mt-0.5" />
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={consent.academicConsent}
            onClick={() => void handleToggle('academic')}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              consent.academicConsent ? 'bg-[#176B45]' : 'bg-neutral-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${
                consent.academicConsent ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Anonymous ID & Data Deletion */}
      <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-[11px] font-bold text-neutral-700">{BETA_TEXT.settings.anonIdLabel}</div>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono font-bold text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200">
              {anonId}
            </code>
            <button
              type="button"
              onClick={() => void handleCopyAnonId()}
              className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60"
              title="Copy Anonymous ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[11px] text-neutral-500">{BETA_TEXT.settings.anonIdHelp}</p>
        </div>

        <button
          type="button"
          disabled={deleting}
          onClick={() => void handleDeleteData()}
          className="px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-50 transition disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="text-left leading-tight">
            <span className="block">{BETA_TEXT.settings.deleteMyData}</span>
            <SiSubtext text={BETA_TEXT.settings.deleteMyDataSi} className="text-[9.5px] text-rose-600" />
          </span>
        </button>
      </div>

      {deleteStatus && (
        <div className="text-xs font-semibold text-emerald-800">{deleteStatus}</div>
      )}

      {/* Voluntary Beta Feedback */}
      <form onSubmit={e => void handleFeedbackSubmit(e)} className="pt-3 border-t border-neutral-200 space-y-3">
        <div>
          <h4 className="text-xs font-bold text-neutral-900">{BETA_TEXT.settings.feedbackTitle}</h4>
          <SiSubtext text={BETA_TEXT.settings.feedbackTitleSi} className="text-[11px] text-neutral-600" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={e => setCategory(e.target.value as BetaFeedbackCategory)}
            className="px-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-semibold text-neutral-800"
          >
            <option value="general">General Feedback</option>
            <option value="calculation">Calculation Discrepancy</option>
            <option value="bug">UI / App Bug</option>
            <option value="suggestion">Feature Suggestion</option>
          </select>

          <select
            value={rating}
            onChange={e => setRating(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-semibold text-neutral-800"
          >
            <option value={5}>5 / 5 — Very Helpful</option>
            <option value={4}>4 / 5 — Good</option>
            <option value={3}>3 / 5 — Okay</option>
            <option value={2}>2 / 5 — Needs Work</option>
            <option value={1}>1 / 5 — Major Issues</option>
          </select>
        </div>

        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          maxLength={1500}
          placeholder={BETA_TEXT.settings.feedbackPlaceholder}
          className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:border-emerald-700"
        />

        <div className="flex items-center justify-between gap-2">
          {feedbackStatus ? (
            <span className="text-xs font-semibold text-emerald-800">{feedbackStatus}</span>
          ) : (
            <span className="text-[11px] text-neutral-400">Voluntary &amp; anonymous</span>
          )}
          <button
            type="submit"
            disabled={sendingFeedback || !message.trim()}
            className="px-4 py-2 rounded-xl bg-[#176B45] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#103B2D] transition disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{BETA_TEXT.settings.feedbackSubmit}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
