// University of Ruhuna - Faculty of Agriculture
// GradePath — Completely Redesigned Degree Progress & Compliance Hub

import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Compass,
  GraduationCap,
  ChevronDown
} from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { DEGREE_INFO, DEPARTMENTS } from '../../database';
import { generateDegreeAudit } from '../../utils/calculations';

export const CreditProgressView: React.FC = () => {
  const { getActiveProfile, getOverallStats, setSpecializationDept } = useGradeStore();
  const profile = getActiveProfile();
  const stats = getOverallStats();
  const degInfo = DEGREE_INFO[profile.degree] || DEGREE_INFO.ARMT;
  const audit = generateDegreeAudit(profile);
  const spec = stats.specEligibility;

  const [showRequirements, setShowRequirements] = useState(true);
  const [showSpecialization, setShowSpecialization] = useState((profile.currentAcademicYear || 1) >= 2);
  const [showDeansHonor, setShowDeansHonor] = useState(true);

  const totalPercent = Math.min(100, Math.round((stats.totalGpaCreditsEarned / stats.totalRequiredCredits) * 100));
  const compPercent = Math.min(100, Math.round((stats.totalCompulsoryEarned / stats.minCompulsoryCredits) * 100));
  const electPercent = Math.min(100, Math.round((stats.totalElectiveEarned / stats.minElectiveCredits) * 100));

  const isEligibleForSpecialization = Boolean(degInfo.hasSpecializationChoice);

  const departmentsList = [
    { code: 'AS', name: DEPARTMENTS.AS, icon: '🐄' },
    { code: 'BL', name: DEPARTMENTS.BL, icon: '🔬' },
    { code: 'CS', name: DEPARTMENTS.CS, icon: '🌱' },
    { code: 'EC', name: DEPARTMENTS.EC, icon: '📊' },
    { code: 'EN', name: DEPARTMENTS.EN, icon: '⚙️' },
    { code: 'FS', name: DEPARTMENTS.FS, icon: '🧪' },
    { code: 'SS', name: DEPARTMENTS.SS, icon: '🌍' }
  ];

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {/* 1. PROGRESS HERO CARD */}
      <div className="rounded-2xl bg-gradient-to-r from-[#17382D] to-[#122A21] text-white p-5 shadow-xs border border-emerald-900/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-white/10 text-emerald-200">
              {profile.degree} (Hons) Curriculum
            </span>
            <span className="text-xs text-emerald-300/70">Handbook 2023/24</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mt-1">
            Degree Progress & Compliance
          </h2>
        </div>

        <div className="flex items-baseline gap-3 bg-white/10 px-4 py-2 rounded-xl border border-white/10">
          <div className="text-3xl font-black font-mono text-white">{totalPercent}%</div>
          <span className="text-xs text-emerald-200">
            {stats.totalGpaCreditsEarned} / {stats.totalRequiredCredits} Credits
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. THREE-PILLAR CREDIT METERS */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Compulsory */}
        <div className="p-6 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-neutral-900">Compulsory Core</span>
            <span className="font-extrabold text-emerald-800 font-mono">{compPercent}%</span>
          </div>
          <div className="text-3xl font-black text-neutral-900 font-mono">
            {stats.totalCompulsoryEarned} <span className="text-sm font-normal text-neutral-400">/ {stats.minCompulsoryCredits} Cr</span>
          </div>
          <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-700 h-full rounded-full transition-all duration-500" style={{ width: `${compPercent}%` }} />
          </div>
          <span className="text-[11px] text-neutral-500 block">Faculty and departmental required courses</span>
        </div>

        {/* Pillar 2: Electives */}
        <div className="p-6 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-neutral-900">Elective Modules</span>
            <span className="font-extrabold text-emerald-800 font-mono">{electPercent}%</span>
          </div>
          <div className="text-3xl font-black text-neutral-900 font-mono">
            {stats.totalElectiveEarned} <span className="text-sm font-normal text-neutral-400">/ {stats.minElectiveCredits} Cr</span>
          </div>
          <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
            <div className="bg-teal-600 h-full rounded-full transition-all duration-500" style={{ width: `${electPercent}%` }} />
          </div>
          <span className="text-[11px] text-neutral-500 block">Accumulated across Semesters 2-2, 3-1, 3-2</span>
        </div>

        {/* Pillar 3: Research & Non-GPA */}
        <div className="p-6 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-neutral-900">Research & Non-GPA</span>
            <span className="font-mono text-neutral-500 font-bold">9 Cr (4-2)</span>
          </div>
          <div className="text-sm font-extrabold text-neutral-900">
            {stats.ngpaAllPassed ? '✓ All Non-GPA Modules Cleared' : '⚠️ Pending Non-GPA Grades'}
          </div>
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            Research Project (6 Cr) & Internship (3 Cr) in Sem 4-2. Pass mark of C- (1.7) required for English/Orientation.
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. INSTITUTIONAL GRADUATION COMPLIANCE CHECKLIST */}
      {/* ======================================================== */}
      <div className="rounded-3xl bg-white border border-neutral-200/80 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowRequirements(!showRequirements)}
          aria-expanded={showRequirements}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left hover:bg-neutral-50/70 transition cursor-pointer"
        >
          <div className="min-w-0">
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-800 shrink-0" />
              <span>Degree Conferment Criteria (Section 5.1)</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">Faculty of Agriculture official award regulations</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              audit.allPassed ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {audit.allPassed ? '✓ All Criteria Satisfied' : 'In Progress'}
            </span>
            <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showRequirements ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {showRequirements && (
          <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-neutral-100 space-y-2.5">
            {audit.items.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-neutral-200/70 bg-neutral-50/60 hover:bg-neutral-50 flex items-center justify-between gap-4 transition"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    item.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.passed ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">{item.title}</h4>
                    <p className="text-[11px] text-neutral-500">{item.requirement}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-xs font-bold ${item.passed ? 'text-emerald-800' : 'text-amber-800'}`}>
                    {item.current}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. FINAL-YEAR SPECIALIZATION ELIGIBILITY (ARMT ONLY) */}
      {/* ======================================================== */}
      {isEligibleForSpecialization && (
        <div className="rounded-3xl bg-white border border-neutral-200/80 shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSpecialization(!showSpecialization)}
            aria-expanded={showSpecialization}
            className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left hover:bg-neutral-50/70 transition cursor-pointer"
          >
            <div className="min-w-0">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-800 shrink-0" />
                <span>ARMT Specialization Stream Eligibility (Year 3 Sem 1)</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Guaranteed preference requirements: GPA ≥ 2.70 at end of 3-1 &amp; ≥ 50% Year 3 electives from target department
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                spec.gpaMet ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {spec.gpaMet ? '✓ GPA Qualified (≥ 2.70)' : 'GPA Below 2.70'}
              </span>
              <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showSpecialization ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showSpecialization && (
            <div className="px-5 sm:px-6 pb-6 pt-3 border-t border-neutral-100 space-y-5">

          {/* Department Selection Pills */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-neutral-800">Select Target Department:</span>
            <div className="flex flex-wrap gap-2">
              {departmentsList.map(dept => {
                const isSelected = profile.specializationDept === dept.code;
                return (
                  <button
                    key={dept.code}
                    onClick={() => setSpecializationDept(dept.code)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold border transition flex items-center gap-2 ${
                      isSelected
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <span>{dept.icon}</span>
                    <span>{dept.code}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dual Check Meters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
              <span className="text-[11px] font-bold text-neutral-500 uppercase">End of 3-1 Cumulative GPA</span>
              <div className="text-3xl font-black text-neutral-900 font-mono">
                {spec.gpa31.toFixed(2)} <span className="text-xs text-neutral-400 font-normal">/ 4.00</span>
              </div>
              <span className={`text-[11px] font-bold block ${spec.gpaMet ? 'text-emerald-800' : 'text-amber-800'}`}>
                {spec.gpaMet ? '✓ Meets minimum 2.70 cutoff' : 'Below 2.70 cutoff'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
              <span className="text-[11px] font-bold text-neutral-500 uppercase">{profile.specializationDept} Elective Ratio (Yr 3)</span>
              <div className="text-3xl font-black text-neutral-900 font-mono">
                {spec.electiveDeptCredits} <span className="text-xs text-neutral-400 font-normal">/ {spec.totalYear3ElectiveCredits} Cr</span>
              </div>
              <span className={`text-[11px] font-bold block ${spec.electiveRatioMet ? 'text-emerald-800' : 'text-amber-800'}`}>
                {spec.electiveRatioMet ? `✓ ${(spec.ratio * 100).toFixed(0)}% (meets ≥ 50% rule)` : `${(spec.ratio * 100).toFixed(0)}% (requires ≥ 50%)`}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-100/70 border border-neutral-200/80 text-xs text-neutral-800 leading-relaxed">
            <span className="font-bold">Evaluation Summary:</span> {spec.statusText}
          </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. DEAN'S HONOR LIST AUDIT PER YEAR */}
      {/* ======================================================== */}
      <div className="rounded-3xl bg-white border border-neutral-200/80 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDeansHonor(!showDeansHonor)}
          aria-expanded={showDeansHonor}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left hover:bg-neutral-50/70 transition cursor-pointer"
        >
          <div>
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-800 shrink-0" />
              <span>Dean's Honor List Standing (Section 5.3)</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">Assessed per academic year (Annual GPA ≥ 3.70 for Y1/Y2; ≥ 3.80 for Y3/Y4 with all grades ≥ B)</p>
          </div>
          <ChevronDown className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${showDeansHonor ? 'rotate-180' : ''}`} />
        </button>

        {showDeansHonor && (
          <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(yr => {
              const dh = stats.deansHonors[yr];
              return (
                <div key={yr} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-neutral-900">
                    <span>Year {yr}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      dh?.eligible ? 'bg-emerald-100 text-emerald-900' : 'bg-white border border-neutral-200 text-neutral-500'
                    }`}>
                      {dh?.eligible ? 'Awarded ★' : 'In Progress'}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-neutral-900 font-mono">
                    {dh?.annualGpa ? dh.annualGpa.toFixed(2) : '—'}
                  </div>
                  <p className="text-[10px] text-neutral-500 line-clamp-2">
                    {dh?.reason || 'Evaluation requires completing all courses with grade ≥ B.'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
