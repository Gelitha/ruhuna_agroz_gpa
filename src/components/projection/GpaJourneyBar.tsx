// University of Ruhuna - Faculty of Agriculture
// GPA Journey Visualizer — Compact Multi-Stage Cumulative Progress

import React from 'react';
import { ArrowRight, CheckCircle2, Target, TrendingUp, Sparkles } from 'lucide-react';

interface GpaJourneyBarProps {
  actualCgpa: number;
  projectedPendingCgpa: number;
  combinedProjectedCgpa: number;
  targetCgpa?: number;
  pendingCount: number;
  currentSemester: string;
}

export const GpaJourneyBar: React.FC<GpaJourneyBarProps> = ({
  actualCgpa,
  projectedPendingCgpa,
  combinedProjectedCgpa,
  targetCgpa,
  pendingCount,
  currentSemester
}) => {
  const deltaFromActual = Number((combinedProjectedCgpa - actualCgpa).toFixed(2));
  const isPositive = deltaFromActual >= 0;

  return (
    <div className="bg-white border border-[#DCDDD7] rounded-2xl p-4 sm:p-5 shadow-subtle space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EDF1EC]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#EAF2ED] text-[#176B45] flex items-center justify-center font-bold">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#242824] leading-tight">
              Your GPA Journey
            </h3>
            <p className="text-[11px] text-[#626962] font-medium">
              From today's confirmed results to upcoming examinations
            </p>
          </div>
        </div>

        {deltaFromActual !== 0 && actualCgpa > 0 && (
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              isPositive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            {isPositive ? `+${deltaFromActual.toFixed(2)}` : deltaFromActual.toFixed(2)} Projected Change
          </span>
        )}
      </div>

      {/* Responsive Horizontal Journey Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-center">
        {/* Stage 1: Actual CGPA Today */}
        <div className="p-3 rounded-xl bg-[#F8F8F4] border border-[#DCDDD7] space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#626962]">
            <span>1. Confirmed Today</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#176B45]" />
          </div>
          <div className="font-mono font-black text-xl text-[#242824] font-tabular">
            {actualCgpa > 0 ? actualCgpa.toFixed(2) : '—'}
          </div>
          <p className="text-[10px] text-[#626962] font-medium leading-tight truncate">
            Official released results only
          </p>
        </div>

        {/* Stage 2: After Pending Previous Results */}
        <div className={`p-3 rounded-xl border space-y-1 transition ${
          pendingCount > 0 ? 'bg-amber-50/60 border-amber-300' : 'bg-[#F8F8F4] border-[#DCDDD7]'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-bold text-[#626962]">
            <span>2. After Pending Results</span>
            {pendingCount > 0 && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <div className="font-mono font-black text-xl text-[#242824] font-tabular">
            {projectedPendingCgpa > 0 ? projectedPendingCgpa.toFixed(2) : '—'}
          </div>
          <p className="text-[10px] text-[#626962] font-medium leading-tight truncate">
            {pendingCount > 0 ? `After ${pendingCount} pending grades` : 'All past results finalized'}
          </p>
        </div>

        {/* Stage 3: After Current Semester Exams */}
        <div className="p-3 rounded-xl bg-[#EAF2ED] border border-[#176B45]/40 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#103B2D]">
            <span>3. After Sem {currentSemester}</span>
            <Sparkles className="w-3.5 h-3.5 text-[#176B45]" />
          </div>
          <div className="font-mono font-black text-xl text-[#103B2D] font-tabular">
            {combinedProjectedCgpa > 0 ? combinedProjectedCgpa.toFixed(2) : '—'}
          </div>
          <p className="text-[10px] text-[#176B45] font-medium leading-tight truncate">
            Combined predicted &amp; target
          </p>
        </div>

        {/* Stage 4: Target CGPA */}
        {targetCgpa && targetCgpa > 0 ? (
          <div className="p-3 rounded-xl bg-neutral-900 text-white space-y-1 border border-neutral-800">
            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-300">
              <span>4. Target Goal</span>
              <Target className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="font-mono font-black text-xl text-amber-300 font-tabular">
              {targetCgpa.toFixed(2)}
            </div>
            <p className="text-[10px] text-neutral-300 font-medium leading-tight truncate">
              {combinedProjectedCgpa >= targetCgpa ? 'Target Met in Projection!' : `${(targetCgpa - combinedProjectedCgpa).toFixed(2)} points away`}
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-[#F8F8F4] border border-dashed border-[#DCDDD7] flex flex-col justify-center text-center">
            <span className="text-[11px] text-[#626962] font-bold">4. Target Goal</span>
            <span className="text-[10px] text-neutral-400 mt-1">Set in Target mode below</span>
          </div>
        )}
      </div>
    </div>
  );
};
