// University of Ruhuna - Faculty of Agriculture
// GradePath Final-Year Departmental Specialization Eligibility Evaluator

import React from 'react';
import { Compass, CheckCircle2, AlertTriangle, BookOpen, Sparkles, Award } from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { DEPARTMENTS, SPECIALIZATION_STREAMS } from '../../database';
import { SemesterKey } from '../../types';
import { HelpTooltip } from '../common/HelpTooltip';

export const SpecializationEligibilityView: React.FC = () => {
  const { getActiveProfile, getOverallStats, setSpecializationDept } = useGradeStore();
  const profile = getActiveProfile();
  const stats = getOverallStats();
  const spec = stats.specEligibility;

  const isEligibleDegree = profile.degree === 'ARMT' || profile.degree === 'ABM';

  const departmentsList = [
    { code: 'AS', name: DEPARTMENTS.AS, icon: '🐄' },
    { code: 'BL', name: DEPARTMENTS.BL, icon: '🔬' },
    { code: 'CS', name: DEPARTMENTS.CS, icon: '🌱' },
    { code: 'EC', name: DEPARTMENTS.EC, icon: '📊' },
    { code: 'EN', name: DEPARTMENTS.EN, icon: '⚙️' },
    { code: 'FS', name: DEPARTMENTS.FS, icon: '🧪' },
    { code: 'SS', name: DEPARTMENTS.SS, icon: '🌍' }
  ];

  const currentStream = SPECIALIZATION_STREAMS[profile.specializationDept || 'CS'];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Intro Header */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-2">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Academic Regulations • Section 5.2
          </span>
        </div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-main">
            Departmental Specialization Stream Eligibility (ARMT & ABM)
          </h2>
          <HelpTooltip id="T32" size="xs" />
        </div>
        <p className="text-xs text-secondary leading-relaxed max-w-3xl">
          At the completion of Semester 3-1, undergraduate students select their Year 4 Specialization Department and 6-credit Research Project. Under Faculty of Agriculture regulations, direct preference allocation is governed by two strict conditions:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-surface-subtle border border-border">
            <span className="font-bold text-main">1. GPA Qualification Threshold:</span>
            <p className="text-secondary mt-0.5">
              Cumulative GPA at the completion of Year 3 Semester 1 (3-1) must be <strong className="text-primary">≥ 2.70</strong>.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-surface-subtle border border-border">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-main">2. Departmental Elective 50% Rule:</span>
              <HelpTooltip id="T31" size="xs" />
            </div>
            <p className="text-secondary mt-0.5">
              At least <strong className="text-primary">50% of all elective credits</strong> taken across Year 3 must belong to the intended Department of Specialization.
            </p>
          </div>
        </div>
      </div>

      {!isEligibleDegree ? (
        <div className="p-6 rounded-2xl bg-surface border border-border text-center space-y-2">
          <h3 className="text-sm font-bold text-main">Green Technology Programme Note</h3>
          <p className="text-xs text-secondary max-w-md mx-auto">
            Green Technology (GT) undergraduates follow a dedicated curriculum focused entirely within Agricultural Engineering & Green Technologies. All 12 credits in Semester 4-1 are compulsory departmental modules (`CC41202`, `CC41203`, `EN41205`–`EN41208`), followed by research project `EN42601`.
          </p>
        </div>
      ) : (
        <>
          {/* Department Selector */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-main">Select Target Specialization Department:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {departmentsList.map(dept => {
                const isSelected = profile.specializationDept === dept.code;
                return (
                  <div
                    key={dept.code}
                    onClick={() => setSpecializationDept(dept.code)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                      isSelected
                        ? 'border-primary bg-primary-light/60 ring-2 ring-primary ring-opacity-20'
                        : 'border-border bg-surface hover:bg-surface-subtle'
                    }`}
                  >
                    <span className="text-2xl">{dept.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-main">{dept.code}</span>
                        {isSelected && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary text-white font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-secondary font-medium truncate mt-0.5">
                        {dept.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Status Card */}
          <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
                  Target Specialization Department
                </span>
                <h3 className="text-lg font-bold text-main">
                  {DEPARTMENTS[profile.specializationDept || 'CS']} ({profile.specializationDept || 'CS'})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                    spec.gpaMet && (spec.totalYear3ElectiveCredits === 0 || spec.electiveRatioMet)
                      ? 'bg-accent-success-light border-accent-success/30 text-accent-success'
                      : 'bg-accent-warning-light border-accent-warning/30 text-accent-warning'
                  }`}
                >
                  {spec.gpaMet && (spec.totalYear3ElectiveCredits === 0 || spec.electiveRatioMet)
                    ? '✓ Preference Guaranteed'
                    : '⚠️ Allocation Pending Criteria'}
                </span>
              </div>
            </div>

            {/* Criteria Evaluation Meters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Check 1: 3-1 GPA */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-main">Criteria 1: Cumulative GPA at 3-1</span>
                  <span className={`text-xs font-bold ${spec.gpaMet ? 'text-accent-success' : 'text-accent-warning'}`}>
                    {spec.gpaMet ? 'Satisfied (≥ 2.70)' : 'Below 2.70'}
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-main">
                  {spec.gpa31.toFixed(2)}
                  <span className="text-xs text-secondary font-normal ml-1">/ 4.00</span>
                </div>
                <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-border">
                  <div
                    className={`h-full rounded-full transition-all ${
                      spec.gpaMet ? 'bg-primary' : 'bg-accent-warning'
                    }`}
                    style={{ width: `${Math.min(100, (spec.gpa31 / 4.0) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-secondary">
                  Threshold: Minimum 2.70 CGPA across Semesters 1-1 to 3-1.
                </p>
              </div>

              {/* Check 2: 50% Electives */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-main">Criteria 2: Year 3 Department Electives</span>
                  <span className={`text-xs font-bold ${spec.electiveRatioMet ? 'text-accent-success' : 'text-accent-warning'}`}>
                    {spec.electiveRatioMet ? 'Satisfied (≥ 50%)' : `${(spec.ratio * 100).toFixed(0)}% (Min 50%)`}
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-main">
                  {spec.electiveDeptCredits}
                  <span className="text-xs text-secondary font-normal ml-1">
                    / {spec.totalYear3ElectiveCredits} Year 3 elective credits
                  </span>
                </div>
                <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-border">
                  <div
                    className={`h-full rounded-full transition-all ${
                      spec.electiveRatioMet ? 'bg-primary' : 'bg-accent-warning'
                    }`}
                    style={{ width: `${Math.min(100, spec.ratio * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-secondary">
                  Rule: At least 50% of electives taken in Year 3 must be from {profile.specializationDept}.
                </p>
              </div>
            </div>

            {/* Verdict Explanation */}
            <div className="p-4 rounded-xl bg-[#F7F8F5] border border-border text-xs leading-relaxed text-main">
              <span className="font-bold">Advisory Assessment:</span> {spec.statusText}
            </div>

            {/* Year 4 Modules Preview */}
            {currentStream && (
              <div className="pt-4 border-t border-border space-y-3">
                <h4 className="text-xs font-bold text-main uppercase tracking-wider">
                  Modules in {currentStream.name} Stream:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                  {currentStream.courses.map(code => (
                    <div key={code} className="p-2.5 rounded-lg bg-surface border border-border">
                      <div className="font-bold text-main">{code}</div>
                      <div className="text-[11px] text-secondary mt-0.5">Year 4 Semester 1 Specialization</div>
                    </div>
                  ))}
                  <div className="p-2.5 rounded-lg bg-primary-light border border-primary-border">
                    <div className="font-bold text-primary">{currentStream.researchCode}</div>
                    <div className="text-[11px] text-primary/80 mt-0.5">6-Credit Research Project (4-2)</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

