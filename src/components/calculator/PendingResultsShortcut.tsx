// University of Ruhuna - Faculty of Agriculture
// Pending Results Shortcut — Compact inline resolver for earlier semester results

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { Grade, SemesterKey, Course } from '../../types';
import { GRADING_SCALE } from '../../database';
import { useGradeStore } from '../../store/useGradeStore';
import { isCourseGradeConfirmed } from '../../utils/projectionCalculations';

interface PendingResultsShortcutProps {
  mode: 'actual' | 'projection';
  onNavigateSemester: (semKey: SemesterKey) => void;
  activeSemester: SemesterKey | 'ORIENTATION';
}

const ALL_SEMESTER_KEYS: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
const GRADE_OPTIONS: Grade[] = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E'];

export const PendingResultsShortcut: React.FC<PendingResultsShortcutProps> = ({
  mode,
  onNavigateSemester,
  activeSemester
}) => {
  const {
    getActiveProfile,
    setCourseGrade,
    setCourseExpectedGrade
  } = useGradeStore();

  const profile = getActiveProfile();
  const currentSem = profile.currentSemester || '1-1';
  const currentIndex = ALL_SEMESTER_KEYS.indexOf(currentSem);

  const [isExpanded, setIsExpanded] = useState(false);

  // Collect unresolved GPA courses from strictly previous semesters (idx < currentIndex)
  const pendingBySem: Array<{
    semKey: SemesterKey;
    courses: Course[];
  }> = [];

  let totalPendingCount = 0;

  for (let idx = 0; idx < currentIndex; idx++) {
    const semKey = ALL_SEMESTER_KEYS[idx];
    const gpaCourses = (profile.semesters[semKey] || []).filter(c => !c.isNgpa);
    const unresolved = gpaCourses.filter(c => !isCourseGradeConfirmed(c));

    if (unresolved.length > 0) {
      pendingBySem.push({
        semKey,
        courses: unresolved
      });
      totalPendingCount += unresolved.length;
    }
  }

  if (totalPendingCount === 0) {
    return null;
  }

  const courseProjections = profile.courseProjections || {};

  return (
    <div className="bg-[#FFFDF9] border border-[#E8DCC4] rounded-2xl p-3.5 sm:p-4 shadow-subtle transition-all">
      {/* Header Banner */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#F6EBD5] text-[#9A6214] flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#9A6214]">
                Results Pending
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F6EBD5] text-[#7A4B0A]">
                {totalPendingCount} course{totalPendingCount !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-[#5C5549] truncate mt-0.5">
              {pendingBySem
                .map(p => `${p.courses.length} from Sem ${p.semKey}`)
                .join(' • ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-[#E8DCC4] text-[#7A4B0A] hover:bg-[#FDF9F0] transition-colors"
            aria-expanded={isExpanded}
          >
            <span>{isExpanded ? 'Hide' : 'Review & Resolve'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Course List */}
      {isExpanded && (
        <div className="mt-3.5 pt-3.5 border-t border-[#E8DCC4]/60 space-y-3.5 animate-in fade-in">
          <div className="text-[12px] text-[#7A4B0A] font-medium bg-[#FDF9F0] p-2.5 rounded-xl border border-[#E8DCC4]/60 flex items-center justify-between gap-2">
            <span>
              {mode === 'actual'
                ? 'Enter official grades as results are released, or switch to Projection mode to estimate them.'
                : 'Enter expected grades to predict your GPA while awaiting official release.'}
            </span>
            {activeSemester !== currentSem && (
              <button
                type="button"
                onClick={() => onNavigateSemester(currentSem)}
                className="text-[11px] font-bold text-[#176B45] underline hover:opacity-80 shrink-0"
              >
                Return to Sem {currentSem}
              </button>
            )}
          </div>

          {pendingBySem.map(group => (
            <div key={group.semKey} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#242824]">
                  Semester {group.semKey}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateSemester(group.semKey)}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#176B45] hover:underline"
                >
                  <span>Open Sem {group.semKey}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {group.courses.map(course => {
                  const projKey = `${group.semKey}:${course.code}`;
                  const projData = courseProjections[projKey];
                  const predictedGrade = projData?.predictedGrade;

                  return (
                    <div
                      key={course.code}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-white border border-[#E8DCC4] shadow-sm"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-[#242824]">
                            {course.code}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                            {course.credits} Cr
                          </span>
                          {course.isRepeat && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              Repeat (Max 2.0)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#626962] font-medium truncate mt-0.5">
                          {course.name}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {mode === 'actual' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#626962] font-medium hidden sm:inline">
                              Official grade:
                            </span>
                            <select
                              aria-label={`Official grade for ${course.code}`}
                              value={course.grade || ''}
                              onChange={e =>
                                setCourseGrade(group.semKey, course.code, e.target.value as Grade)
                              }
                              className="h-9 px-2.5 text-xs font-bold rounded-lg border border-[#DCDDD7] bg-white text-[#242824] focus:outline-none focus:ring-2 focus:ring-[#176B45]"
                            >
                              <option value="">Awaiting result...</option>
                              {GRADE_OPTIONS.map(g => (
                                <option key={g} value={g}>
                                  {g} ({GRADING_SCALE[g]?.gpv.toFixed(1)})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#626962] font-medium hidden sm:inline">
                              Expected grade:
                            </span>
                            <select
                              aria-label={`Expected grade for ${course.code}`}
                              value={predictedGrade || ''}
                              onChange={e =>
                                setCourseExpectedGrade(
                                  group.semKey,
                                  course.code,
                                  e.target.value as Grade
                                )
                              }
                              className="h-9 px-2.5 text-xs font-bold rounded-lg border border-emerald-300 bg-emerald-50/50 text-[#176B45] focus:outline-none focus:ring-2 focus:ring-[#176B45]"
                            >
                              <option value="">Set expected...</option>
                              {GRADE_OPTIONS.map(g => (
                                <option key={g} value={g}>
                                  {g} ({GRADING_SCALE[g]?.gpv.toFixed(1)})
                                </option>
                              ))}
                            </select>
                            {predictedGrade && (
                              <button
                                type="button"
                                title="Clear expected grade"
                                onClick={() =>
                                  setCourseExpectedGrade(group.semKey, course.code, '' as Grade)
                                }
                                className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center text-xs font-bold"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
