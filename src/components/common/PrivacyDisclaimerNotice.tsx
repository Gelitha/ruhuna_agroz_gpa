// University of Ruhuna - Faculty of Agriculture
// Shared Browser-Local Privacy Notice & Unofficial Academic Disclaimer

import React from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';

interface PrivacyDisclaimerNoticeProps {
  compact?: boolean;
  showAcademicDisclaimer?: boolean;
}

export const PRIVACY_HEADING = 'Your data stays on your device.';
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
  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {/* Local Privacy Notice */}
      <div
        className={`rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-950 ${
          compact ? 'p-3 text-[11px]' : 'p-4 text-xs'
        } space-y-1`}
      >
        <div className="flex items-center gap-1.5 font-extrabold text-[#103B2D]">
          <ShieldCheck className="w-4 h-4 text-[#176B45] shrink-0" />
          <span>{PRIVACY_HEADING}</span>
        </div>
        <p className="text-emerald-900/90 leading-relaxed">{PRIVACY_BODY}</p>
        <p className="text-emerald-800/80 leading-relaxed">
          {PRIVACY_BACKUP_NOTE}{' '}
          {!compact && (
            <span>
              Standard website hosting and font asset requests do not transmit your personal or academic records.
            </span>
          )}
        </p>
      </div>

      {/* Academic Disclaimer */}
      {showAcademicDisclaimer && (
        <div
          className={`rounded-xl border border-amber-200 bg-amber-50/70 text-amber-950 flex items-start gap-2 ${
            compact ? 'p-2.5 text-[11px]' : 'p-3.5 text-xs'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{ACADEMIC_DISCLAIMER}</p>
        </div>
      )}
    </div>
  );
};
