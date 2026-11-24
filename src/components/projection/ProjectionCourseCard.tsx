// University of Ruhuna - Faculty of Agriculture
// Projection Course Card — Course-Level Grade Prediction & Examination Target Controller

import React from 'react';
import { Course, Grade, SemesterKey, CourseProjectionData } from '../../types';
import { GRADING_SCALE, getDepartmentStyle } from '../../database';
import { CheckCircle2, Clock, Sparkles, ChevronDown, Award } from 'lucide-react';

const GRADE_OPTIONS: Grade[] = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E'];

interface ProjectionCourseCardProps {
  course: Course;
  semesterKey: SemesterKey;
  projection?: CourseProjectionData;
  isCurrentSemester: boolean;
  onSetPredictedGrade: (grade: Grade) => void;
  onSetTargetGrade: (grade: Grade) => void;
  onSetExamStatus: (status: 'upcoming' | 'in_progress' | 'completed') => void;
  onResetProjection: () => void;
}

export const ProjectionCourseCard: React.FC<ProjectionCourseCardProps> = ({
  course,
  semesterKey,
  projection,
  isCurrentSemester,
  onSetPredictedGrade,
  onSetTargetGrade,
  onSetExamStatus,
  onResetProjection
}) => {
  const hasActualGrade = !!course.grade;
  const deptStyle = getDepartmentStyle(course.dept);
  const credits = course.credits || 0;

  // Grade point calculations
  const actualGpv = hasActualGrade ? GRADING_SCALE[course.grade || '']?.gpv : null;
  const predictedGrade = projection?.predictedGrade || '';
  const targetGrade = projection?.targetGrade || '';

  const effectivePredictedGpv = predictedGrade ? GRADING_SCALE[predictedGrade]?.gpv : null;
  const effectiveTargetGpv = targetGrade ? GRADING_SCALE[targetGrade]?.gpv : null;

  return (
    <div
      className={`p-4 rounded-2xl border transition-all bg-white shadow-subtle space-y-3 ${
        hasActualGrade
          ? 'border-emerald-300/80 bg-emerald-50/20'
          : predictedGrade
          ? 'border-[#176B45]/40 ring-1 ring-[#176B45]/15'
          : 'border-[#DCDDD7]'
      }`}
    >
      {/* Top Header: Code, Dept, Badges, Actual Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#EDF1EC]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono font-black text-sm text-[#242824]">
            {course.code}
          </span>
          {course.dept && (
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${deptStyle.bg} ${deptStyle.text} ${deptStyle.border}`}
            >
              {course.dept}
            </span>
          )}
          {course.isCompulsory ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              Core
            </span>
          ) : (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              Elective
            </span>
          )}
          {course.isRepeat && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
              Repeat (Max 2.0)
            </span>
          )}
          <span className="text-xs font-mono font-bold text-[#626962]">
            {credits} Cr
          </span>
        </div>

        {/* Official Status Badge */}
        {hasActualGrade ? (
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Official: {course.grade} ({actualGpv?.toFixed(1)} GPV)</span>
          </span>
        ) : (
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Result Pending</span>
          </span>
        )}
      </div>

      {/* Middle: Full Course Name (Wrapped, Never Truncated) */}
      <div className="text-sm font-semibold text-[#242824] leading-snug break-words">
        {course.name}
      </div>

      {/* Bottom: Grade Prediction & Target Selectors */}
      <div className="pt-2 border-t border-[#EDF1EC] grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
        {/* Control 1: Predicted Grade (for completed exam) */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-[#626962]">
            {hasActualGrade ? 'Historical Prediction:' : 'Predicted Grade (Completed Exam):'}
          </label>
          <div className="relative">
            {hasActualGrade ? (
              <div className="w-full rounded-xl px-3 py-2 bg-neutral-100 border border-neutral-300 text-xs font-semibold text-neutral-700 min-h-[44px] flex items-center justify-between">
                <span>
                  {projection?.historicalPrediction || projection?.predictedGrade
                    ? `Predicted: ${projection.historicalPrediction || projection.predictedGrade}`
                    : 'No previous prediction'}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold">
                  Official Grade Overrides ✓
                </span>
              </div>
            ) : (
              <select
                value={predictedGrade}
                onChange={(e) => onSetPredictedGrade(e.target.value as Grade)}
                aria-label={`Predict grade for ${course.code}`}
                className={`w-full appearance-none rounded-xl px-3 py-2 pr-8 text-xs font-bold min-h-[44px] cursor-pointer border transition focus:outline-none ${
                  predictedGrade
                    ? 'bg-[#EAF2ED] text-[#103B2D] border-[#176B45]'
                    : 'bg-white text-neutral-600 border-[#DCDDD7]'
                }`}
              >
                <option value="">[ Set predicted grade ▼ ]</option>
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g} ({GRADING_SCALE[g]?.gpv.toFixed(1)} GPV)
                  </option>
                ))}
              </select>
            )}
            {!hasActualGrade && (
              <ChevronDown className="w-4 h-4 absolute right-3 top-3.5 text-neutral-500 pointer-events-none" />
            )}
          </div>
        </div>

        {/* Control 2: Target Grade (for upcoming exams) */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-[#626962]">
            {isCurrentSemester ? 'Target Grade (Upcoming Exam):' : 'Aspirational Target:'}
          </label>
          <div className="relative">
            <select
              value={targetGrade}
              onChange={(e) => onSetTargetGrade(e.target.value as Grade)}
              disabled={hasActualGrade}
              aria-label={`Target grade for ${course.code}`}
              className={`w-full appearance-none rounded-xl px-3 py-2 pr-8 text-xs font-bold min-h-[44px] cursor-pointer border transition focus:outline-none ${
                hasActualGrade
                  ? 'bg-neutral-50 text-neutral-400 border-neutral-200 cursor-not-allowed'
                  : targetGrade
                  ? 'bg-amber-50 text-amber-900 border-amber-400'
                  : 'bg-white text-neutral-600 border-[#DCDDD7]'
              }`}
            >
              <option value="">[ Set target grade ▼ ]</option>
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g} ({GRADING_SCALE[g]?.gpv.toFixed(1)} GPV)
                </option>
              ))}
            </select>
            {!hasActualGrade && (
              <ChevronDown className="w-4 h-4 absolute right-3 top-3.5 text-neutral-500 pointer-events-none" />
            )}
          </div>
        </div>
      </div>

      {/* Explanatory Context / Status */}
      {hasActualGrade && projection?.historicalPrediction && (
        <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center justify-between">
          <span>
            Prediction comparison: Predicted {projection.historicalPrediction} vs Official {course.grade}
          </span>
          <span className="font-mono font-bold">
            {((actualGpv ?? 0) - (GRADING_SCALE[projection.historicalPrediction]?.gpv ?? 0)).toFixed(1)} delta
          </span>
        </div>
      )}
    </div>
  );
};
