// University of Ruhuna - Faculty of Agriculture
// Planning Tools — Expandable Advanced Academic Strategy & Scenario Suite

import React, { useState } from 'react';
import {
  Sliders,
  Target,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Award
} from 'lucide-react';
import { TargetScope } from '../../types';
import { useGradeStore } from '../../store/useGradeStore';
import {
  calculateTargetCgpaRequirement,
  calculateAcademicProjections
} from '../../utils/projectionCalculations';
import { GpaJourneyBar } from '../projection/GpaJourneyBar';

export const PlanningTools: React.FC = () => {
  const {
    getActiveProfile,
    setProjectionQuickAssumptions,
    resetQuickAssumptions,
    setProjectionTargetCgpa,
    getAcademicProjections
  } = useGradeStore();

  const profile = getActiveProfile();
  const proj = getAcademicProjections();

  // Collapsed by default
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'assumptions' | 'target' | 'scenarios' | 'impact' | 'journey'>('target');

  // Quick Assumptions State
  const quickAssumptions = profile.projectionQuickAssumptions;
  const isAssumptionsActive = !!quickAssumptions;
  const [prevAssumption, setPrevAssumption] = useState<number>(quickAssumptions?.remainingPrevAvgGpa ?? 3.30);
  const [currAssumption, setCurrAssumption] = useState<number>(quickAssumptions?.currentSemAvgGpa ?? 3.50);

  // Target CGPA Calculator State
  const [targetScope, setTargetScope] = useState<TargetScope>('after_current');
  const [targetCgpa, setTargetCgpa] = useState<number>(profile.projectionTargetCgpa ?? 3.50);

  const targetResult = calculateTargetCgpaRequirement(profile, targetCgpa, targetScope);

  const handleApplyAssumptions = () => {
    setProjectionQuickAssumptions({
      remainingPrevAvgGpa: prevAssumption,
      currentSemAvgGpa: currAssumption
    });
  };

  const handleResetAssumptions = () => {
    resetQuickAssumptions();
  };

  const handleTargetChange = (val: number) => {
    setTargetCgpa(val);
    setProjectionTargetCgpa(val);
  };

  return (
    <div className="bg-white border border-[#DCDDD7] rounded-2xl shadow-subtle overflow-hidden transition-all">
      {/* Header Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[#F8F8F4] transition-colors text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EAF2ED] text-[#176B45] flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[#242824]">
                Planning tools
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 text-[#626962]">
                Optional
              </span>
            </div>
            <p className="text-xs text-[#626962] font-medium mt-0.5">
              Target CGPA, quick assumptions, best/worst-case scenarios & course impact
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-[#176B45]">
          <span>{isOpen ? 'Close' : 'Open'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Tools Body */}
      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-[#EDF1EC] space-y-5 animate-in fade-in">
          {/* Sub-Tabs Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-[#EDF1EC]">
            <button
              type="button"
              onClick={() => setActiveSubTab('target')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg whitespace-nowrap transition-all ${
                activeSubTab === 'target'
                  ? 'bg-[#176B45] text-white shadow-sm'
                  : 'text-[#626962] hover:bg-neutral-100'
              }`}
            >
              Target CGPA
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('assumptions')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeSubTab === 'assumptions'
                  ? 'bg-[#176B45] text-white shadow-sm'
                  : 'text-[#626962] hover:bg-neutral-100'
              }`}
            >
              <span>Quick assumptions</span>
              {isAssumptionsActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('scenarios')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg whitespace-nowrap transition-all ${
                activeSubTab === 'scenarios'
                  ? 'bg-[#176B45] text-white shadow-sm'
                  : 'text-[#626962] hover:bg-neutral-100'
              }`}
            >
              Best & Worst Cases
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('impact')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg whitespace-nowrap transition-all ${
                activeSubTab === 'impact'
                  ? 'bg-[#176B45] text-white shadow-sm'
                  : 'text-[#626962] hover:bg-neutral-100'
              }`}
            >
              Course GPA impact
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('journey')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg whitespace-nowrap transition-all ${
                activeSubTab === 'journey'
                  ? 'bg-[#176B45] text-white shadow-sm'
                  : 'text-[#626962] hover:bg-neutral-100'
              }`}
            >
              GPA Journey
            </button>
          </div>

          {/* 1. Target CGPA Tool */}
          {activeSubTab === 'target' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Target Scope Selection */}
                <div className="p-4 rounded-xl bg-[#F8F8F4] border border-[#DCDDD7] space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#626962]">
                    Target Scope
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetScope('after_current')}
                      className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all ${
                        targetScope === 'after_current'
                          ? 'bg-[#176B45] text-white border-[#176B45] shadow-sm'
                          : 'bg-white text-[#242824] border-[#DCDDD7] hover:border-neutral-400'
                      }`}
                    >
                      <div>After the current semester (Sem {proj.currentSemester})</div>
                      <div className={`text-[11px] font-normal mt-0.5 ${targetScope === 'after_current' ? 'text-emerald-100' : 'text-[#626962]'}`}>
                        Pending results + upcoming Sem {proj.currentSemester} exams (Default)
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetScope('after_pending')}
                      className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all ${
                        targetScope === 'after_pending'
                          ? 'bg-[#176B45] text-white border-[#176B45] shadow-sm'
                          : 'bg-white text-[#242824] border-[#DCDDD7] hover:border-neutral-400'
                      }`}
                    >
                      <div>After pending previous semester results</div>
                      <div className={`text-[11px] font-normal mt-0.5 ${targetScope === 'after_pending' ? 'text-emerald-100' : 'text-[#626962]'}`}>
                        Resolves only outstanding grades from earlier semesters
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetScope('at_graduation')}
                      className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all ${
                        targetScope === 'at_graduation'
                          ? 'bg-[#176B45] text-white border-[#176B45] shadow-sm'
                          : 'bg-white text-[#242824] border-[#DCDDD7] hover:border-neutral-400'
                      }`}
                    >
                      <div>At graduation ({targetResult.totalScopeCredits} Credits)</div>
                      <div className={`text-[11px] font-normal mt-0.5 ${targetScope === 'at_graduation' ? 'text-emerald-100' : 'text-[#626962]'}`}>
                        Final degree classification target across remaining degree requirements
                      </div>
                    </button>
                  </div>
                </div>

                {/* Target Slider & Value */}
                <div className="p-4 rounded-xl bg-[#F8F8F4] border border-[#DCDDD7] flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#626962]">
                        Desired CGPA
                      </label>
                      <span className="font-mono text-xl font-black text-[#176B45]">
                        {targetCgpa.toFixed(2)}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="2.00"
                      max="4.00"
                      step="0.01"
                      value={targetCgpa}
                      onChange={e => handleTargetChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-[#DCDDD7] rounded-lg appearance-none cursor-pointer accent-[#176B45] mt-3"
                    />

                    {/* Quick Preset Buttons */}
                    <div className="grid grid-cols-4 gap-1.5 mt-3">
                      {[
                        { label: 'First (3.70)', val: 3.70 },
                        { label: '2:1 (3.30)', val: 3.30 },
                        { label: '2:2 (3.00)', val: 3.00 },
                        { label: 'Pass (2.00)', val: 2.00 }
                      ].map(preset => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => handleTargetChange(preset.val)}
                          className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                            Math.abs(targetCgpa - preset.val) < 0.01
                              ? 'bg-[#176B45] text-white border-[#176B45]'
                              : 'bg-white text-[#242824] border-[#DCDDD7] hover:bg-neutral-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-[11px] text-[#626962] font-medium pt-2 border-t border-[#EDF1EC]">
                    Evaluates confirmed points against unresolved credits within this scope.
                  </div>
                </div>
              </div>

              {/* Target Calculation Feasibility Result */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  targetResult.possible
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50/70 border-rose-300 text-rose-950'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {targetResult.possible ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider">
                        {targetResult.possible ? 'Target Achievable' : 'Target Mathematically Unreachable'}
                      </span>
                      {targetResult.isRepeatCapRestricted && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          Repeat Capped
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium mt-1 leading-relaxed">
                      {targetResult.explanation}
                    </p>
                  </div>
                </div>

                {targetResult.possible && targetResult.remainingCredits > 0 && targetResult.requiredAverage > 0 && (
                  <div className="shrink-0 text-right bg-white p-2.5 rounded-xl border border-emerald-200">
                    <span className="text-[10px] uppercase font-bold text-[#626962] block">
                      Required Avg
                    </span>
                    <span className="font-mono text-xl font-black text-[#176B45]">
                      {targetResult.requiredAverage.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#626962] block">
                      over {targetResult.remainingCredits} Cr
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. Quick GPA Assumptions */}
          {activeSubTab === 'assumptions' && (
            <div className="space-y-4">
              <div className="text-xs text-[#626962] font-medium leading-relaxed bg-[#F8F8F4] p-3 rounded-xl border border-[#DCDDD7]">
                Quick assumptions apply a uniform average GPA across remaining courses without overriding your confirmed grades or individual course predictions. Repeat courses are strictly capped at 2.00 (Grade C) in accordance with Faculty regulations.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Previous Pending Credits Assumption */}
                <div className="p-4 rounded-xl bg-white border border-[#DCDDD7] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-[#242824] block">
                        Outstanding Previous Results
                      </span>
                      <span className="text-[11px] text-[#626962]">
                        {proj.pendingResultsCount} courses pending from earlier semesters
                      </span>
                    </div>
                    <span className="font-mono text-lg font-black text-[#176B45]">
                      {prevAssumption.toFixed(2)}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0.00"
                    max="4.00"
                    step="0.05"
                    value={prevAssumption}
                    onChange={e => setPrevAssumption(parseFloat(e.target.value))}
                    className="w-full h-2 bg-[#DCDDD7] rounded-lg appearance-none cursor-pointer accent-[#176B45]"
                  />
                </div>

                {/* Current Semester Credits Assumption */}
                <div className="p-4 rounded-xl bg-white border border-[#DCDDD7] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-[#242824] block">
                        Current Semester (Sem {proj.currentSemester})
                      </span>
                      <span className="text-[11px] text-[#626962]">
                        Upcoming examinations in current semester
                      </span>
                    </div>
                    <span className="font-mono text-lg font-black text-[#176B45]">
                      {currAssumption.toFixed(2)}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0.00"
                    max="4.00"
                    step="0.05"
                    value={currAssumption}
                    onChange={e => setCurrAssumption(parseFloat(e.target.value))}
                    className="w-full h-2 bg-[#DCDDD7] rounded-lg appearance-none cursor-pointer accent-[#176B45]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-[#626962]">
                  {isAssumptionsActive ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Quick assumptions currently active
                    </span>
                  ) : (
                    <span>Assumptions inactive (using course-by-course predictions)</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isAssumptionsActive && (
                    <button
                      type="button"
                      onClick={handleResetAssumptions}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#DCDDD7] text-neutral-600 hover:bg-neutral-100 transition-colors"
                    >
                      Reset / Disable
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleApplyAssumptions}
                    className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#176B45] text-white hover:bg-[#135537] shadow-sm transition-all"
                  >
                    Apply assumptions
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. Best-Case & Worst-Case Scenarios */}
          {activeSubTab === 'scenarios' && (
            <div className="space-y-4">
              <div className="text-xs text-[#626962] font-medium leading-relaxed bg-[#F8F8F4] p-3 rounded-xl border border-[#DCDDD7]">
                Scenarios compare your actual, expected, best possible and worst possible outcomes across the same scope (through Semester {proj.currentSemester}). Confirmed grades are preserved across all scenarios; unresolved courses vary according to academic regulations.
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3.5 rounded-xl bg-white border border-[#DCDDD7]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#626962] block">
                    Confirmed Only
                  </span>
                  <div className="font-mono text-xl font-black text-[#242824] font-tabular mt-1">
                    {proj.scenarios.actualOnly > 0 ? proj.scenarios.actualOnly.toFixed(2) : '—'}
                  </div>
                  <span className="text-[10px] text-[#626962] block mt-0.5">
                    Official grades only
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Expected Projection
                  </span>
                  <div className="font-mono text-xl font-black text-[#176B45] font-tabular mt-1">
                    {proj.scenarios.expected > 0 ? proj.scenarios.expected.toFixed(2) : '—'}
                  </div>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">
                    {proj.scenarios.isExpectedIncomplete ? 'Partial coverage' : 'Full projection'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#DCDDD7]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#626962] block">
                    Best Case
                  </span>
                  <div className="font-mono text-xl font-black text-emerald-700 font-tabular mt-1">
                    {proj.scenarios.bestCase.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-[#626962] block mt-0.5">
                    All remaining A (or C repeat)
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#DCDDD7]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#626962] block">
                    Worst Case
                  </span>
                  <div className="font-mono text-xl font-black text-rose-700 font-tabular mt-1">
                    {proj.scenarios.worstCase.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-[#626962] block mt-0.5">
                    All remaining E (0.00)
                  </span>
                </div>
              </div>

              {proj.scenarios.isExpectedIncomplete && (
                <div className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    Your expected projection includes {proj.combinedTotalCredits} of {proj.scopeTotalGpaCredits} credits. Add expected grades for remaining courses to complete your projection.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 4. Course GPA Impact Table */}
          {activeSubTab === 'impact' && (
            <div className="space-y-3">
              <div className="text-xs text-[#626962] font-medium leading-relaxed bg-[#F8F8F4] p-3 rounded-xl border border-[#DCDDD7]">
                Identifies which unresolved courses have the highest leverage on your GPA. Higher-credit courses contribute significantly more per grade increment. Repeat courses are capped at Grade C (2.00).
              </div>

              {proj.courseImpacts.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#626962] bg-[#F8F8F4] rounded-xl border border-[#EDF1EC]">
                  No unresolved courses in current projection scope.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#EDF1EC] text-[#626962] font-extrabold uppercase text-[10px]">
                        <th className="py-2 px-2">Course</th>
                        <th className="py-2 px-2">Credits</th>
                        <th className="py-2 px-2">Assumed → Target</th>
                        <th className="py-2 px-2 text-right">SGPA Gain</th>
                        <th className="py-2 px-2 text-right">Scope CGPA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDF1EC]">
                      {proj.courseImpacts.map(impact => (
                        <tr key={`${impact.semesterKey}:${impact.courseCode}`} className="hover:bg-[#F8F8F4]">
                          <td className="py-2.5 px-2">
                            <div className="font-mono font-black text-[#242824]">
                              {impact.courseCode}
                            </div>
                            <div className="text-[11px] text-[#626962] truncate max-w-[200px]">
                              {impact.courseName}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 font-bold text-[#242824]">
                            {impact.credits} Cr
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="font-bold text-[#626962]">{impact.currentGrade}</span>
                            <span className="mx-1 text-neutral-400">→</span>
                            <span className="font-bold text-[#176B45]">{impact.targetGrade}</span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-[#176B45]">
                            {impact.sgpaGain !== undefined ? `+${impact.sgpaGain.toFixed(2)}` : '—'}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-[#176B45]">
                            +{impact.cgpaGain.toFixed(3)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 5. GPA Journey Bar */}
          {activeSubTab === 'journey' && (
            <div className="space-y-3">
              <GpaJourneyBar
                actualCgpa={proj.actualCgpa}
                projectedPendingCgpa={proj.projectedCgpaPending}
                combinedProjectedCgpa={proj.combinedProjectedCgpa}
                targetCgpa={profile.projectionTargetCgpa}
                pendingCount={proj.pendingResultsCount}
                currentSemester={proj.currentSemester}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
