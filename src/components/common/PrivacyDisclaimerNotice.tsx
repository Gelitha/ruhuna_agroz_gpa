// University of Ruhuna - Faculty of Agriculture
// Shared Browser-Local Privacy Notice & Unofficial Academic Disclaimer

import React from 'react';
import { ShieldCheck, AlertCircle, FlaskConical } from 'lucide-react';
import { SiSubtext } from './BilingualText';
import { SI } from '../../constants/translations';
import { isBetaActive, getBetaEndDateDisplay } from '../../beta/betaConfig';
import { BETA_TEXT } from '../../beta/betaTranslations';

interface PrivacyDisclaimerNoticeProps {
  compact?: boolean;
  showAcademicDisclaimer?: boolean;
}

export const PRIVACY_HEADING = 'Your academic data stays on your device.';
export const PRIVACY_BODY =
  'Your academic profile, grades and GPA records are stored locally in your browser. No account or login is required. Your academic records are not uploaded to a central database.';
export const PRIVACY_BACKUP_NOTE =
  'Clearing browser data, changing browsers or switching devices may result in the loss of saved records. Export a backup to keep your academic data safe.';
export const ACADEMIC_DISCLAIMER =
  'Ruhuna Agri GPA is an unofficial academic planning tool. Calculated GPA values, projections and eligibility estimates are for guidance only. Official university results and academic regulations take precedence.';

export const PrivacyDisclaimerNotice: React.FC<PrivacyDisclaimerNoticeProps> = ({
  compact = false,
  showAcademicDisclaimer = true
}) => {
  const betaActive = isBetaActive();

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {betaActive ? (
        /* Temporary Beta Testing Privacy Notice */
        <div
          className={`rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-950 ${
            compact ? 'p-3 text-[11px]' : 'p-4 text-xs'
          } space-y-2`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-1.5 font-extrabold text-[#103B2D]">
              <FlaskConical className="w-4 h-4 text-[#176B45] shrink-0 mt-0.5" />
              <div>
                <span>{BETA_TEXT.notice.heading}</span>
                <SiSubtext text={BETA_TEXT.notice.headingSi} className="text-[#176B45] mt-0.5" />
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 shrink-0">
              Beta • Until {getBetaEndDateDisplay()}
            </span>
          </div>

          <div className="space-y-1 text-emerald-900/90 leading-relaxed">
            <p className="font-bold text-[#103B2D]">{BETA_TEXT.notice.whatCollectedTitle}</p>
            <p>• {BETA_TEXT.notice.whatCollectedAnalytics}</p>
            <SiSubtext text={BETA_TEXT.notice.whatCollectedAnalyticsSi} className="text-emerald-900/80 pl-2" />
            <p>• {BETA_TEXT.notice.whatCollectedAcademic}</p>
            <SiSubtext text={BETA_TEXT.notice.whatCollectedAcademicSi} className="text-emerald-900/80 pl-2" />
            <p className="font-semibold text-emerald-950">{BETA_TEXT.notice.excludedNote}</p>
            <SiSubtext text={BETA_TEXT.notice.excludedNoteSi} className="text-emerald-900/80" />
          </div>

          <div className="space-y-1 text-emerald-900/90 leading-relaxed pt-1 border-t border-emerald-200/70">
            <p>
              <strong>{BETA_TEXT.notice.whyTitle}</strong> {BETA_TEXT.notice.whyBody}
            </p>
            <SiSubtext text={BETA_TEXT.notice.whyBodySi} className="text-emerald-900/80" />
            <p>
              <strong>{BETA_TEXT.notice.accessTitle}</strong> {BETA_TEXT.notice.accessBody}
            </p>
            <SiSubtext text={BETA_TEXT.notice.accessBodySi} className="text-emerald-900/80" />
            <p>
              <strong>{BETA_TEXT.notice.controlTitle}</strong> {BETA_TEXT.notice.controlBody}
            </p>
            <SiSubtext text={BETA_TEXT.notice.controlBodySi} className="text-emerald-900/80" />
          </div>
        </div>
      ) : (
        /* Local Privacy Notice */
        <div
          className={`rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-950 ${
            compact ? 'p-3 text-[11px]' : 'p-4 text-xs'
          } space-y-1.5`}
        >
          <div className="flex items-start gap-1.5 font-extrabold text-[#103B2D]">
            <ShieldCheck className="w-4 h-4 text-[#176B45] shrink-0 mt-0.5" />
            <div>
              <span>{PRIVACY_HEADING}</span>
              <SiSubtext text={SI.privacy.heading} className="text-[#176B45] mt-0.5" />
            </div>
          </div>
          <p className="text-emerald-900/90 leading-relaxed">{PRIVACY_BODY}</p>
          <SiSubtext text={SI.privacy.body} className="text-emerald-900/85" />
          <p className="text-emerald-800/80 leading-relaxed">
            {PRIVACY_BACKUP_NOTE}
          </p>
          <SiSubtext text={SI.privacy.backupNote} className="text-emerald-800/80" />
        </div>
      )}

      {/* Academic Disclaimer */}
      {showAcademicDisclaimer && (
        <div
          className={`rounded-xl border border-amber-200 bg-amber-50/70 text-amber-950 flex items-start gap-2 ${
            compact ? 'p-2.5 text-[11px]' : 'p-3.5 text-xs'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="leading-relaxed">{ACADEMIC_DISCLAIMER}</p>
            <SiSubtext text={SI.privacy.academicDisclaimer} className="text-amber-900/90" />
          </div>
        </div>
      )}
    </div>
  );
};
