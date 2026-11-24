// University of Ruhuna - Faculty of Agriculture
// Result-Release Tracker — Chronological Official Release Progress

import React from 'react';
import { SemesterKey, SemesterProjectionSummary } from '../../types';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface ResultReleaseTrackerProps {
  summaries: Record<SemesterKey, SemesterProjectionSummary>;
  currentSemester: SemesterKey;
}

export const ResultReleaseTracker: React.FC<ResultReleaseTrackerProps> = ({
  summaries,
  currentSemester
}) => {
  const semesters = Object.values(summaries || {}).filter(
    s => s.totalCourses > 0
  );

  return (
    <div className="bg-white border border-[#DCDDD7] rounded-2xl p-4 sm:p-5 shadow-subtle space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-[#EDF1EC]">
        <div>
          <h3 className="text-sm font-extrabold text-[#242824]">
            Official Results Release Tracker
          </h3>
          <p className="text-[11px] text-[#626962] font-medium">
            Status of examinations and university grade release
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {semesters.map((s) => {
          const isCurrent = s.semesterKey === currentSemester;
          const isAllReceived = s.resultStatus === 'all_received' || s.actualResultsCount === s.totalCourses;
          const isPartial = s.actualResultsCount > 0 && s.actualResultsCount < s.totalCourses;
          const isNone = s.actualResultsCount === 0;

          return (
            <div
              key={s.semesterKey}
              className={`p-3 rounded-xl border space-y-1.5 transition ${
                isCurrent
                  ? 'bg-[#EAF2ED]/60 border-[#176B45]/40'
                  : isPartial
                  ? 'bg-amber-50/60 border-amber-300'
                  : isAllReceived
                  ? 'bg-white border-[#DCDDD7]'
                  : 'bg-neutral-50/70 border-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#242824] flex items-center gap-1.5">
                  <span>Semester {s.semesterKey}</span>
                  {isCurrent && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-[#176B45] text-white">
                      Current
                    </span>
                  )}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isAllReceived
                      ? 'bg-emerald-100 text-emerald-800'
                      : isPartial
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {isAllReceived
                    ? 'All Released ✓'
                    : isPartial
                    ? `${s.pendingResultsCount} Pending`
                    : isCurrent
                    ? 'In Progress'
                    : 'Awaiting Results'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isAllReceived ? 'bg-[#176B45]' : isPartial ? 'bg-amber-500' : 'bg-neutral-400'
                  }`}
                  style={{
                    width: `${s.totalCourses > 0 ? (s.actualResultsCount / s.totalCourses) * 100 : 0}%`
                  }}
                />
              </div>

              {/* Counts */}
              <div className="flex items-center justify-between text-[11px] text-[#626962] pt-0.5 font-medium">
                <span>
                  {s.actualResultsCount} of {s.totalCourses} courses released
                </span>
                <span className="font-mono font-bold text-[#242824]">
                  {s.confirmedGpaCredits} / {s.totalGpaCredits} Cr
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
