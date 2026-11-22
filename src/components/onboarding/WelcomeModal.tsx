// University of Ruhuna - Faculty of Agriculture
// GradePath Welcoming Onboarding & First-Time Experience Modal
// Dynamic Previous Semesters Subject & SGPA Setup Wizard

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  ChevronRight,
  X,
  Layers,
  GraduationCap,
  Calendar,
  Zap,
  RotateCcw,
  Check,
  AlertCircle
} from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { DegreeCode, SemesterKey, Grade, Course } from '../../types';
import { DEGREE_INFO, GRADING_SCALE, getDepartmentStyle } from '../../database';
import { initDefaultCoursesForDegree, calculateSemesterStats } from '../../utils/calculations';

const SEM_KEYS: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
const GRADE_CHOICES: Grade[] = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E'];

export const WelcomeModal: React.FC = () => {
  const {
    showOnboarding,
    completeOnboarding,
    createProfile,
    setActiveTab,
    setSelectedSemesterForCalculator
  } = useGradeStore();

  const [step, setStep] = useState<'welcome' | 'step1' | 'step2' | 'step3'>('welcome');
  const [selectedDegree, setSelectedDegree] = useState<DegreeCode>('ARMT');
  const [name, setName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [currentSem, setCurrentSem] = useState<SemesterKey>('1-1');
  const [activePrevSem, setActivePrevSem] = useState<SemesterKey>('1-1');

  const [workingSemesters, setWorkingSemesters] = useState<Record<SemesterKey, Course[]>>(() =>
    initDefaultCoursesForDegree('ARMT', 'CS')
  );

  if (!showOnboarding) return null;

  const currentYear = currentSem.startsWith('1-')
    ? 1
    : currentSem.startsWith('2-')
    ? 2
    : currentSem.startsWith('3-')
    ? 3
    : 4;

  const currentIndex = SEM_KEYS.indexOf(currentSem);
  const previousSemesters = SEM_KEYS.slice(0, currentIndex);

  const handleDegreeChange = (deg: DegreeCode) => {
    setSelectedDegree(deg);
    const specDept = deg === 'ABM' ? 'EC' : deg === 'GT' ? 'EN' : 'CS';
    setWorkingSemesters(initDefaultCoursesForDegree(deg, specDept));
  };

  const handleGradeChange = (semKey: SemesterKey, courseCode: string, grade: Grade) => {
    setWorkingSemesters(prev => {
      const list = prev[semKey] || [];
      const nextList = list.map(c => {
        if (c.code === courseCode) {
          return { ...c, grade };
        }
        return c;
      });
      return {
        ...prev,
        [semKey]: nextList
      };
    });
  };

  const handleQuickFillSemester = (semKey: SemesterKey, grade: Grade) => {
    setWorkingSemesters(prev => {
      const list = prev[semKey] || [];
      const nextList = list.map(c => ({
        ...c,
        grade
      }));
      return {
        ...prev,
        [semKey]: nextList
      };
    });
  };

  const handleClearSemester = (semKey: SemesterKey) => {
    setWorkingSemesters(prev => {
      const list = prev[semKey] || [];
      const nextList = list.map(c => ({
        ...c,
        grade: '' as Grade
      }));
      return {
        ...prev,
        [semKey]: nextList
      };
    });
  };

  const handleExploreDirectly = () => {
    completeOnboarding();
    setActiveTab('calculator');
    setSelectedSemesterForCalculator('1-1');
  };

  const handleFinishOnboarding = () => {
    createProfile({
      name: name.trim() || 'My Academic Profile',
      registrationNumber: regNo.trim(),
      degree: selectedDegree,
      currentAcademicYear: currentYear,
      currentSemester: currentSem,
      batch: `${currentYear === 1 ? '46th' : currentYear === 2 ? '45th' : currentYear === 3 ? '44th' : '43rd'} Batch`,
      semesters: workingSemesters
    });
    completeOnboarding();
    setActiveTab('dashboard');
  };

  // Compute live cumulative stats across all previous semesters
  let cumulativePoints = 0;
  let cumulativeAttemptedCredits = 0;
  previousSemesters.forEach(s => {
    const list = workingSemesters[s] || [];
    const stat = calculateSemesterStats(s, list);
    cumulativePoints += stat.weightedPoints;
    cumulativeAttemptedCredits += stat.gpaCreditsAttempted;
  });
  const liveCumulativeCgpa = cumulativeAttemptedCredits > 0 ? cumulativePoints / cumulativeAttemptedCredits : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className={`relative w-full ${step === 'step3' ? 'max-w-2xl sm:max-w-3xl' : 'max-w-xl'} bg-white border border-neutral-200 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-7 transition-all my-auto max-h-[95vh] flex flex-col justify-between`}>
        {/* Close Button */}
        <button
          onClick={handleExploreDirectly}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1.5 rounded-xl text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition z-10"
          title="Skip setup and open calculator"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto pr-1">
          {/* STEP 0: Welcome Screen */}
          {step === 'welcome' && (
            <div className="space-y-5 text-center py-2 sm:py-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-emerald-600 to-green-700 text-white flex items-center justify-center text-3xl shadow-lg shadow-emerald-700/20">
                🌿
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] uppercase font-black tracking-widest text-emerald-800 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300">
                  Faculty of Agriculture • University of Ruhuna
                </span>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-neutral-900 tracking-tight pt-1">
                  Your Academic Journey, Clearly Measured.
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
                  Track your SGPA, calculate your cumulative CGPA, check Dean's Honors, and plan graduation standing using 2023/24 handbook regulations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-left">
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
                  <span className="text-xl">🌾</span>
                  <h4 className="text-xs font-bold text-neutral-900 mt-1">All 3 Degrees</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">ARMT (126 Cr), ABM (125 Cr), and Green Tech (125 Cr).</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
                  <span className="text-xl">⚖️</span>
                  <h4 className="text-xs font-bold text-neutral-900 mt-1">Official Regulations</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Repeat grade caps, Non-GPA separation, & Dean's Honor check.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
                  <span className="text-xl">🔒</span>
                  <h4 className="text-xs font-bold text-neutral-900 mt-1">Clean & Private</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">100% offline on your device with zero mock clutter.</p>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  onClick={() => setStep('step1')}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleExploreDirectly}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 font-bold text-xs sm:text-sm transition"
                >
                  Explore Clean Calculator
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: Degree Selection */}
          {step === 'step1' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Step 1 of 3</span>
                <h3 className="text-lg sm:text-xl font-black text-neutral-900">Choose your Degree Programme</h3>
                <p className="text-xs text-neutral-500">
                  Select your undergraduate programme from the Faculty of Agriculture:
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    code: 'ARMT' as DegreeCode,
                    name: 'Agricultural Resource Management & Technology',
                    short: 'BSc Hons (ARMT)',
                    credits: '126 Credits',
                    desc: 'Comprehensive multi-departmental training across 7 academic disciplines with Year 4 specialization.'
                  },
                  {
                    code: 'ABM' as DegreeCode,
                    name: 'Agribusiness Management',
                    short: 'BSc Hons (ABM)',
                    credits: '125 Credits',
                    desc: 'Specialized in business management, farm economics, agricultural marketing, and entrepreneurship.'
                  },
                  {
                    code: 'GT' as DegreeCode,
                    name: 'Green Technology',
                    short: 'BSc Hons (GT)',
                    credits: '125 Credits',
                    desc: 'Advanced training in renewable energy, environmental engineering, waste management, and green solutions.'
                  }
                ].map(deg => (
                  <div
                    key={deg.code}
                    onClick={() => handleDegreeChange(deg.code)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                      selectedDegree === deg.code
                        ? 'border-emerald-700 bg-emerald-50/70 ring-2 ring-emerald-600/20 shadow-xs'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center border shrink-0 ${
                      selectedDegree === deg.code ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-neutral-300 bg-white'
                    }`}>
                      {selectedDegree === deg.code && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-neutral-900 truncate">{deg.short}</span>
                        <span className="text-[11px] font-bold text-emerald-800 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 shrink-0">
                          {deg.credits}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                        {deg.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => setStep('welcome')}
                  className="text-xs font-semibold text-neutral-500 hover:text-neutral-900"
                >
                  ← Back
                </button>

                <button
                  onClick={() => setStep('step2')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Current Semester & Details */}
          {step === 'step2' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Step 2 of {previousSemesters.length > 0 ? '3' : '2'}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-neutral-900">Your Current Academic Standing</h3>
                <p className="text-xs text-neutral-500">
                  Select your current semester. This enables automatic previous-semester SGPA and CGPA tracking:
                </p>
              </div>

              <div className="space-y-3.5">
                {/* 8-Semester Selection Grid */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-2">
                    What is your Current Semester?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SEM_KEYS.map(key => {
                      const isSel = currentSem === key;
                      const y = key.startsWith('1-') ? 1 : key.startsWith('2-') ? 2 : key.startsWith('3-') ? 3 : 4;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setCurrentSem(key);
                            if (key > '1-1') {
                              setActivePrevSem('1-1');
                            }
                          }}
                          className={`p-3 rounded-2xl border text-center transition flex flex-col justify-between ${
                            isSel
                              ? 'bg-neutral-900 text-white border-neutral-900 shadow-md ring-2 ring-emerald-500/30'
                              : 'bg-neutral-50 hover:bg-white border-neutral-200 text-neutral-800'
                          }`}
                        >
                          <span className={`text-[10px] font-bold block ${isSel ? 'text-emerald-300' : 'text-neutral-400'}`}>
                            Year {y}
                          </span>
                          <span className="text-base sm:text-lg font-black font-mono block mt-0.5">
                            Sem {key}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation Banner Based on Selection */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">
                      {currentSem === '1-1'
                        ? 'Freshman Start (Semester 1-1)'
                        : `Currently Enrolled in Year ${currentYear} Semester ${currentSem}`}
                    </span>
                    <p className="text-[11px] text-emerald-900/80 mt-0.5 leading-relaxed">
                      {currentSem === '1-1'
                        ? 'You are beginning your degree. No previous semester subjects needed — you will start directly in Semester 1-1.'
                        : `To accurately calculate your Cumulative GPA (CGPA) and Dean's Honor status, we will help you add subjects for your completed semesters (${previousSemesters.join(', ')}).`}
                    </p>
                  </div>
                </div>

                {/* Name & Reg Number Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Student Name <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kasun Perera"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:border-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Registration Number <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AG/2022/xxxx"
                      value={regNo}
                      onChange={(e) => setRegNo(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:border-emerald-700"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => setStep('step1')}
                  className="text-xs font-semibold text-neutral-500 hover:text-neutral-900"
                >
                  ← Back
                </button>

                {previousSemesters.length > 0 ? (
                  <button
                    onClick={() => {
                      setActivePrevSem(previousSemesters[0]);
                      setStep('step3');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition"
                  >
                    <span>Add Previous Semesters ({previousSemesters.length})</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleFinishOnboarding}
                    className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Finish Setup & Open Calculator</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Add Previous Semesters Subjects to Check SGPA & CGPA */}
          {step === 'step3' && previousSemesters.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Step 3 of 3</span>
                  <h3 className="text-base sm:text-lg font-black text-neutral-900">
                    Add Previous Semesters' Subjects & Check SGPA
                  </h3>
                  <p className="text-[11px] sm:text-xs text-neutral-500">
                    Enter the grades you earned in completed semesters to calculate your exact SGPA history & CGPA:
                  </p>
                </div>

                {/* Cumulative Tracker */}
                <div className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-right shrink-0">
                  <span className="text-[10px] text-neutral-500 font-medium block">Previous Cumulative CGPA</span>
                  <span className="text-base sm:text-lg font-black font-mono text-emerald-900 block leading-tight">
                    {liveCumulativeCgpa > 0 ? liveCumulativeCgpa.toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>

              {/* Semester Tabs */}
              <div className="flex flex-wrap gap-1.5 border-b border-neutral-200 pb-2">
                {previousSemesters.map(semKey => {
                  const isActive = activePrevSem === semKey;
                  const stat = calculateSemesterStats(semKey, workingSemesters[semKey] || []);
                  const hasEntered = stat.gpaCreditsAttempted > 0;

                  return (
                    <button
                      key={semKey}
                      type="button"
                      onClick={() => setActivePrevSem(semKey)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-neutral-900 text-white shadow-xs'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      <span>Sem {semKey}</span>
                      {hasEntered ? (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isActive ? 'bg-emerald-500 text-neutral-950 font-black' : 'bg-emerald-100 text-emerald-800 font-bold'}`}>
                          {stat.sgpa.toFixed(2)}
                        </span>
                      ) : (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded ${isActive ? 'bg-white/20 text-neutral-300' : 'bg-neutral-200 text-neutral-500'}`}>
                          Empty
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Previous Semester Section */}
              {activePrevSem && (
                <div className="space-y-3">
                  {/* Semester Control Bar */}
                  <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-neutral-900">Semester {activePrevSem} Courses</span>
                      {(() => {
                        const stat = calculateSemesterStats(activePrevSem, workingSemesters[activePrevSem] || []);
                        return (
                          <span className="text-neutral-500 ml-2 font-medium">
                            {stat.gpaCreditsEarned} Cr Earned • SGPA: <strong className="text-emerald-800 font-mono font-black">{stat.sgpa.toFixed(2)}</strong>
                          </span>
                        );
                      })()}
                    </div>

                    {/* Quick-Fill Buttons */}
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-neutral-400 font-medium hidden sm:inline mr-1">Quick Fill:</span>
                      {(['A', 'A-', 'B+', 'B'] as Grade[]).map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => handleQuickFillSemester(activePrevSem, g)}
                          className="px-2 py-0.5 rounded-lg bg-white hover:bg-emerald-100 border border-neutral-200 text-neutral-800 hover:text-emerald-900 font-mono font-bold transition"
                        >
                          {g}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleClearSemester(activePrevSem)}
                        className="px-2 py-0.5 rounded-lg bg-white hover:bg-rose-50 border border-neutral-200 text-rose-700 font-medium transition"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Course List */}
                  <div className="divide-y divide-neutral-100 max-h-56 sm:max-h-64 overflow-y-auto pr-1">
                    {(workingSemesters[activePrevSem] || []).map(c => {
                      const deptStyle = getDepartmentStyle(c.dept);
                      return (
                        <div
                          key={c.code}
                          className="py-2 px-1 flex items-center justify-between gap-2 hover:bg-neutral-50/80 rounded-xl transition text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${deptStyle.bg} ${deptStyle.text} ${deptStyle.border}`}>
                              {c.dept || 'CC'}
                            </span>
                            <span className="font-mono font-bold text-neutral-900 shrink-0">{c.code}</span>
                            <span className="text-neutral-600 truncate">{c.name}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-medium text-neutral-400">
                              {c.isNgpa ? 'NGPA' : `${c.credits} Cr`}
                            </span>

                            <select
                              value={c.grade || ''}
                              onChange={(e) => handleGradeChange(activePrevSem, c.code, e.target.value as Grade)}
                              className={`px-2 py-1 rounded-lg border text-xs font-mono font-bold focus:outline-none ${
                                c.grade
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                  : 'bg-white text-neutral-500 border-neutral-200'
                              }`}
                            >
                              <option value="">— Grade —</option>
                              {GRADE_CHOICES.map(g => (
                                <option key={g} value={g}>
                                  {g} ({GRADING_SCALE[g]?.gpv.toFixed(1)})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation Footer */}
              <div className="pt-3 border-t border-neutral-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStep('step2')}
                  className="text-xs font-semibold text-neutral-500 hover:text-neutral-900"
                >
                  ← Back
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFinishOnboarding}
                    className="px-3.5 py-2 rounded-xl text-neutral-500 hover:text-neutral-900 text-xs font-semibold hover:bg-neutral-100 transition"
                  >
                    Skip & Finish
                  </button>

                  <button
                    type="button"
                    onClick={handleFinishOnboarding}
                    className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save & Open Dashboard</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

