// University of Ruhuna - Faculty of Agriculture
// Shared Bilingual Subtext Components (English Primary + Optional Sinhala Subtext)

import React from 'react';
import { useGradeStore } from '../../store/useGradeStore';

interface SiSubtextProps {
  text?: string;
  className?: string;
}

/**
 * Renders smaller, readable Sinhala subtext beneath an English label.
 * Automatically respects the user's "Show Sinhala subtext" preference.
 */
export const SiSubtext: React.FC<SiSubtextProps> = ({ text, className = '' }) => {
  const showSinhalaSubtext = useGradeStore((s) => s.showSinhalaSubtext);
  if (!showSinhalaSubtext || !text) return null;

  return (
    <span
      className={`font-sinhala block text-[11px] leading-[1.45] font-normal tracking-normal normal-case ${className}`}
    >
      {text}
    </span>
  );
};

interface BilingualLabelProps {
  en: string;
  si?: string;
  className?: string;
  enClassName?: string;
  siClassName?: string;
}

export const BilingualLabel: React.FC<BilingualLabelProps> = ({
  en,
  si,
  className = '',
  enClassName = '',
  siClassName = 'text-[#626962]',
}) => {
  return (
    <span className={`inline-flex flex-col ${className}`}>
      <span className={enClassName}>{en}</span>
      <SiSubtext text={si} className={siClassName} />
    </span>
  );
};
