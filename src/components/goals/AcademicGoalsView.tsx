// University of Ruhuna - Faculty of Agriculture
// GradePath Academic Goals & Target GPA Planner (Comprehensive Real-Course Solvers)

import React, { useState } from 'react';
import {
  Target,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  BookOpen,
  BarChart2,
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { calculateTargetGpa } from '../../utils/calculations';
import { ComprehensiveGradeStrategy } from '../../types';
import { getDepartmentStyle } from '../../database';

export const AcademicGoalsView: React.FC = () => {
  const { getActiveProfile, getOverallStats, applyTargetMixPlan, clearAppliedTargetMix } = useGradeStore();
  const profile = getActiveProfile();
  const stats = getOverallStats();

  const [targetCgpa, setTargetCgpa] = useState<number>(3.70);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('usual-pace');
  const [showCourseRoster, setShowCourseRoster] = useState<boolean>(true);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  const result = calculateTargetGpa(profile, targetCgpa);
  const userProfile = result.userProfile;
  const strategies = result.strategies || [];
  const activeStrategy = strategies.find(s => s.id === selectedStrategyId) || strategies[0];

  const handleApplyStrategy = (strategy: ComprehensiveGradeStrategy) => {
    const allocations = strategy.courseAllocations.map(c => ({
      semKey: c.semester,
      courseCode: c.code,
      grade: c.recommendedGrade
    }));
    applyTargetMixPlan(allocations);
    setAppliedToast(`Applied "${strategy.name}" (${allocations.length} courses) as Expected Grades!`);
    setTimeout(() => setAppliedToast(null), 5000);
  };

  const handleClearApplied = () => {
    clearAppliedTargetMix();
    setAppliedToast('Cleared applied expected grades. Courses reset to unfinalized.');
    setTimeout(() => setAppliedToast(null), 4000);
  };

  const presets = [
    { label: 'First Class Honours', gpa: 3.70, desc: 'CGPA ≥ 3.70' },
    { label: 'Second Class (Upper)', gpa: 3.30, desc: '3.30 ≤ CGPA < 3.70' },
    { label: 'Second Class (Lower)', gpa: 3.00, desc: '3.00 ≤ CGPA < 3.30' },
    { label: 'General Pass', gpa: 2.00, desc: '2.00 ≤ CGPA < 3.00' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Intro Header */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Strategic Advisor</span>
          </div>
          <h2 className="text-xl font-bold text-main mt-1">Target GPA & Honours Class Planner</h2>
          <p className="text-xs text-secondary mt-0.5">
            Identify concrete course grade mixes across upcoming curriculum modules tailored to your historical entries.
          </p>
        </div>

        <div className="px-4 py-2 rounded-xl bg-surface-subtle border border-border text-xs">
          <span className="text-secondary">Current CGPA: </span>
          <span className="font-extrabold text-primary text-sm">
            {stats.totalGpaCreditsAttempted > 0 ? stats.cgpa.toFixed(2) : '—'}
          </span>
          <span className="text-secondary ml-1">({stats.totalGpaCreditsEarned}/{stats.totalRequiredCredits} Cr)</span>
        </div>
      </div>

      {/* Toast */}
      {appliedToast && (
        <div className="p-3.5 rounded-xl bg-primary text-white text-xs flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{appliedToast}</span>
          </div>
          <button onClick={() => setAppliedToast(null)} className="text-white/80 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Target Selector & Presets */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-4">
        <label className="block text-xs font-bold text-main">Choose Your Degree Standing Goal:</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map(p => {
            const isSelected = targetCgpa === p.gpa;
            return (
              <div
                key={p.label}
                onClick={() => setTargetCgpa(p.gpa)}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-primary bg-primary-light/60 ring-2 ring-primary ring-opacity-20'
                    : 'border-border bg-surface hover:bg-surface-subtle'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-main">{p.label}</div>
                  <div className="text-[11px] text-secondary mt-0.5">{p.desc}</div>
                </div>
                <div className="mt-3 text-lg font-bold text-primary">
                  {p.gpa.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Input */}
        <div className="pt-2 flex items-center gap-3">
          <span className="text-xs text-secondary font-medium">Or custom target CGPA:</span>
          <input
            type="number"
            min="2.00"
            max="4.00"
            step="0.01"
            value={targetCgpa}
            onChange={(e) => setTargetCgpa(parseFloat(e.target.value) || 2.0)}
            className="w-28 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-bold text-main focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* User Historical Performance Card */}
      {userProfile && (
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-main">
                User Historical Pace & Calibration
              </span>
            </div>
            <span className={`text-xs font-bold px-3 py-0.5 rounded-full ${
              userProfile.feasibilityRating === 'Secured' || userProfile.feasibilityRating === 'Comfortable'
                ? 'bg-accent-success-light text-accent-success'
                : userProfile.feasibilityRating === 'On Track'
                ? 'bg-teal-50 text-teal-800'
                : userProfile.feasibilityRating === 'Moderate Stretch'
                ? 'bg-accent-warning-light text-accent-warning'
                : 'bg-accent-danger-light text-accent-danger'
            }`}>
              ● {userProfile.feasibilityRating}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-surface-subtle border border-border">
              <span className="text-secondary text-[11px] block">Your Usual Pace</span>
              <span className="text-lg font-bold text-main mt-0.5 block">{userProfile.historicalGpa.toFixed(2)} GPV</span>
              <span className="text-primary text-[10px] font-bold block">{userProfile.usualGradeBand}</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-subtle border border-border">
              <span className="text-secondary text-[11px] block">Required Target Pace</span>
              <span className="text-lg font-bold text-primary mt-0.5 block">
                {result.requiredAverageGpa !== undefined ? result.requiredAverageGpa.toFixed(2) : '—'} GPV
              </span>
              <span className="text-secondary text-[10px] block">Remaining {result.remainingCredits ?? 0} Cr</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-subtle border border-border">
              <span className="text-secondary text-[11px] block">Required Pace Delta</span>
              <span className="text-lg font-bold text-main mt-0.5 block">
                {userProfile.deltaToTarget <= 0
                  ? `${userProfile.deltaToTarget.toFixed(2)} GPV`
                  : `+${userProfile.deltaToTarget.toFixed(2)} GPV`}
              </span>
              <span className="text-secondary text-[10px] block">
                {userProfile.deltaToTarget <= 0 ? 'Surplus pace' : 'Uplift needed'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface-subtle border border-border">
              <span className="text-secondary text-[11px] block">Graded Modules</span>
              <span className="text-lg font-bold text-main mt-0.5 block">{userProfile.totalGradedCourses}</span>
              <span className="text-secondary text-[10px] block">{userProfile.totalGradedCredits} Completed Cr</span>
            </div>
          </div>

          <p className="text-xs text-secondary leading-relaxed pt-1">
            {userProfile.feasibilityDescription}
          </p>
        </div>
      )}

      {/* Comprehensive Strategies Selector */}
      {strategies.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-main uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary" />
              <span>Comprehensive Real-Course Strategies:</span>
            </h4>
            <button
              onClick={() => setShowCourseRoster(!showCourseRoster)}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
            >
              <span>{showCourseRoster ? 'Hide Modules' : 'View Module List'}</span>
              {showCourseRoster ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {strategies.map(s => {
              const isActive = s.id === (activeStrategy?.id || 'usual-pace');
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedStrategyId(s.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    isActive
                      ? 'border-primary bg-primary-light/60 ring-2 ring-primary/20'
                      : 'border-border bg-surface hover:bg-surface-subtle'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-main text-white">
                        {s.badge}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.difficulty === 'Very High'
                          ? 'bg-accent-danger-light text-accent-danger'
                          : s.difficulty === 'Demanding'
                          ? 'bg-accent-warning-light text-accent-warning'
                          : 'bg-accent-success-light text-accent-success'
                      }`}>
                        {s.difficulty}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-main mt-2">{s.name}</div>
                    <p className="text-[11px] text-secondary mt-1 line-clamp-2 leading-relaxed">
                      {s.tagline}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-secondary">Achieved:</span>
                    <span className="font-bold text-primary">{s.achievedCgpa.toFixed(2)} CGPA</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Strategy Detail */}
          {activeStrategy && (
            <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                    Active Strategy Plan
                  </span>
                  <h3 className="text-base font-bold text-main mt-0.5">{activeStrategy.name}</h3>
                  <p className="text-xs text-secondary mt-1 max-w-2xl leading-relaxed">
                    {activeStrategy.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApplyStrategy(activeStrategy)}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold flex items-center gap-2 shadow-xs transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Apply to Forecast</span>
                  </button>
                  <button
                    onClick={handleClearApplied}
                    title="Clear applied target grades"
                    className="p-2 rounded-xl border border-border hover:bg-surface-subtle text-secondary text-xs transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tiers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {activeStrategy.tiers.map((t, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-surface-subtle border border-border space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-main">{t.tierName}</span>
                      <span className="font-bold text-primary font-mono">{t.recommendedGrade}</span>
                    </div>
                    <div className="text-xl font-bold text-primary font-mono">{t.gpv.toFixed(1)} GPV</div>
                    <div className="text-[10px] text-secondary flex justify-between pt-1 border-t border-border-subtle">
                      <span>{t.courseCount} Modules ({t.totalCredits} Cr)</span>
                      <span>{t.role}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Semester Roadmap */}
              {activeStrategy.semesterRoadmap.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                    Target SGPA Milestones by Semester:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs text-center">
                    {activeStrategy.semesterRoadmap.map(sem => (
                      <div key={sem.semester} className="p-2.5 rounded-xl bg-surface-subtle border border-border">
                        <span className="font-bold text-main block">Sem {sem.semester}</span>
                        <span className="font-bold text-primary font-mono text-base block mt-0.5">
                          {sem.targetSgpa.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-secondary block">{sem.credits} Cr</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Course Roster */}
              {showCourseRoster && activeStrategy.courseAllocations.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                    Allocated Target Grades for Remaining Curriculum Modules:
                  </span>
                  <div className="divide-y divide-border-subtle max-h-72 overflow-y-auto pr-1">
                    {activeStrategy.courseAllocations.map(c => {
                      const deptStyle = getDepartmentStyle(c.dept);
                      return (
                        <div
                          key={`${c.semester}:${c.code}`}
                          className="py-2 flex items-center justify-between text-xs hover:bg-surface-subtle px-1.5 rounded-lg"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-surface-subtle border border-border rounded">
                              Sem {c.semester}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${deptStyle.bg} ${deptStyle.text} ${deptStyle.border}`}>
                              {c.dept || 'CC'}
                            </span>
                            <span className="font-bold font-mono text-main">{c.code}</span>
                            <span className="text-secondary truncate">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-secondary">{c.credits} Cr</span>
                            <span className="font-bold font-mono px-2 py-0.5 rounded bg-primary-light text-primary">
                              Grade {c.recommendedGrade}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

