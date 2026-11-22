// University of Ruhuna - Faculty of Agriculture
// GradePath Degree Regulations Compliance Checklist

import React from 'react';
import { GraduationCap, CheckCircle2, AlertTriangle, ShieldCheck, BookOpen } from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { generateDegreeAudit } from '../../utils/calculations';

export const DegreeRequirementsView: React.FC = () => {
  const { getActiveProfile, getOverallStats } = useGradeStore();
  const profile = getActiveProfile();
  const stats = getOverallStats();
  const audit = generateDegreeAudit(profile);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Compliance Checklist</span>
          </div>
          <h2 className="text-xl font-bold text-main mt-1">Undergraduate Degree Conferment Criteria</h2>
          <p className="text-xs text-secondary mt-0.5">
            Requirements from Section 5.1 of the 2023/24 Undergraduate Handbook for {profile.degree}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
            audit.allPassed
              ? 'bg-accent-success-light border-accent-success/30 text-accent-success'
              : 'bg-accent-warning-light border-accent-warning/30 text-accent-warning'
          }`}>
            {audit.allPassed ? '✓ All Graduation Criteria Satisfied' : '⚠️ Degree Requirements In Progress'}
          </span>
        </div>
      </div>

      {/* Audit Items List */}
      <div className="space-y-3">
        {audit.items.map((item, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition ${
              item.passed
                ? 'bg-surface border-border'
                : 'bg-accent-warning-light/30 border-accent-warning/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                item.passed ? 'bg-primary-light text-primary' : 'bg-accent-warning-light text-accent-warning'
              }`}>
                {item.passed ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-main">{item.title}</h4>
                <p className="text-[11px] text-secondary mt-0.5">{item.requirement}</p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className={`text-xs font-bold ${item.passed ? 'text-accent-success' : 'text-accent-warning'}`}>
                {item.current}
              </div>
              <span className="text-[10px] text-secondary">
                {item.passed ? 'Satisfied' : 'Pending'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Dean's Honor Requirements Box */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-4">
        <h3 className="text-sm font-bold text-main">Dean's Honor List Criteria (Section 5.3)</h3>
        <p className="text-xs text-secondary leading-relaxed">
          The Dean's Honor List is assessed per academic year (first-attempt candidates only, no incomplete exams, no disciplinary actions):
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-1.5">
            <span className="font-bold text-main">Years 1 & 2 (Semesters 1 to 4):</span>
            <ul className="list-disc list-inside text-secondary space-y-1">
              <li>Annual GPA ≥ <strong>3.70</strong> across both semesters.</li>
              <li>Must obtain a grade of <strong>B (3.0) or higher</strong> in all registered courses.</li>
              <li>Must complete all compulsory & minimum elective credit requirements.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-1.5">
            <span className="font-bold text-main">Years 3 & 4 (Semesters 5 to 8):</span>
            <ul className="list-disc list-inside text-secondary space-y-1">
              <li>Annual GPA ≥ <strong>3.80</strong> across both semesters.</li>
              <li>Must obtain a grade of <strong>B (3.0) or higher</strong> in all registered courses.</li>
              <li>First attempt only (no repeated courses).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

