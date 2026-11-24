// University of Ruhuna - Faculty of Agriculture
// GradePath Official Academic Transcript View

import React from 'react';
import { Printer, Download, Share2, Award, ShieldCheck, CheckCircle, FileText } from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { DEGREE_INFO, DEPARTMENTS } from '../../database';
import { calculateCourseGpv, isCourseGradeConfirmed } from '../../utils/calculations';
import { SemesterKey } from '../../types';
import { HelpTooltip } from '../common/HelpTooltip';

export const AcademicTranscriptView: React.FC = () => {
  const { getActiveProfile, getOverallStats } = useGradeStore();
  const profile = getActiveProfile();
  const stats = getOverallStats();
  const degInfo = DEGREE_INFO[profile.degree] || DEGREE_INFO.ARMT;

  const semKeys: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Action Bar (hidden on print) */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border shadow-subtle no-print">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-main">Undergraduate Academic Performance Statement</h2>
            <HelpTooltip id="T33" size="xs" />
          </div>
          <p className="text-xs text-secondary">
            Formatted according to University of Ruhuna Faculty of Agriculture regulations (2023/24 Handbook)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Official Transcript Sheet */}
      <div className="bg-white border border-border rounded-2xl p-8 sm:p-12 shadow-card print-area text-black space-y-8">
        {/* University Official Header */}
        <div className="text-center pb-6 border-b-2 border-primary space-y-1.5">
          <div className="text-3xl mb-1">🏛️</div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight uppercase text-main">
            Faculty of Agriculture — University of Ruhuna
          </h2>
          <h3 className="text-xs sm:text-sm font-semibold text-secondary uppercase tracking-wider">
            Undergraduate Academic Performance Transcript
          </h3>
          <p className="text-[11px] text-secondary">
            Kamburupitiya, Matara, Sri Lanka • Degree Accreditation Framework
          </p>
        </div>

        {/* Student Metadata Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#FBFBF9] border border-border text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-secondary">Student Name</span>
            <div className="font-bold text-main text-sm truncate">{profile.name}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-secondary">Registration / Index No</span>
            <div className="font-bold text-main text-sm truncate">{profile.registrationNumber || 'AG/Undergraduate'}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-secondary">Degree Programme</span>
            <div className="font-bold text-main text-sm">{profile.degree} (Hons)</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-secondary">Academic Standing</span>
            <div className="font-bold text-primary text-sm">{stats.realClassStanding}</div>
          </div>
        </div>

        {/* Semester-by-Semester Tables */}
        <div className="space-y-6">
          {semKeys.map(semKey => {
            const courses = profile.semesters[semKey] || [];
            const semStat = stats.semStats[semKey];
            if (courses.length === 0 && semStat.realCreditsAttempted === 0) return null;

            return (
              <div key={semKey} className="space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-border">
                  <h4 className="text-xs font-bold text-main uppercase tracking-wider">
                    Semester {semKey}
                  </h4>
                  <div className="text-xs font-semibold text-main">
                    SGPA: <span className="font-bold text-primary">{semStat.realCreditsAttempted > 0 ? semStat.realSgpa.toFixed(2) : '—'}</span>
                    <span className="text-secondary ml-3">Credits: {semStat.realCreditsEarned} / {semStat.realCreditsAttempted}</span>
                  </div>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle text-[10px] uppercase text-secondary font-semibold">
                      <th className="py-1 px-2 w-28">Course Code</th>
                      <th className="py-1 px-2">Course Name</th>
                      <th className="py-1 px-2 w-16 text-center">Credits</th>
                      <th className="py-1 px-2 w-16 text-center">Grade</th>
                      <th className="py-1 px-2 w-16 text-center">GPV</th>
                      <th className="py-1 px-2 w-20 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {courses.map(c => {
                      const isConfirmed = isCourseGradeConfirmed(c);
                      const gpv = isConfirmed ? calculateCourseGpv(c) : null;
                      const creds = Number(c.credits) || 0;
                      const points = isConfirmed && gpv !== null && !c.isNgpa ? creds * gpv : null;

                      return (
                        <tr key={c.code} className="hover:bg-surface-subtle">
                          <td className="py-1.5 px-2 font-mono font-bold text-main">{c.code}</td>
                          <td className="py-1.5 px-2 text-main truncate max-w-md">{c.name}</td>
                          <td className="py-1.5 px-2 text-center text-secondary">
                            {c.isNgpa ? '0 (NGPA)' : creds}
                          </td>
                          <td className="py-1.5 px-2 text-center font-bold">
                            {isConfirmed ? c.grade : <span className="text-secondary font-normal">—</span>}
                          </td>
                          <td className="py-1.5 px-2 text-center text-main">
                            {c.isNgpa ? '—' : gpv !== null ? gpv.toFixed(1) : '—'}
                          </td>
                          <td className="py-1.5 px-2 text-right font-medium text-main">
                            {points !== null ? points.toFixed(1) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {/* Non-GPA Courses Status */}
        <div className="pt-4 border-t border-border space-y-2">
          <h4 className="text-xs font-bold text-main uppercase tracking-wider">
            Compulsory Non-GPA Orientation Modules
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {profile.orientationCourses.map(c => (
              <div key={c.code} className="p-2 rounded-lg bg-[#FBFBF9] border border-border">
                <div className="font-mono font-bold text-main text-[11px]">{c.code}</div>
                <div className="text-[10px] text-secondary truncate">{c.name}</div>
                <div className="text-[11px] font-bold mt-1 text-primary">
                  Grade: {c.grade || 'Pending'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final Classification & Official Degree Summary Box */}
        <div className="pt-6 border-t-2 border-primary">
          <div className="p-6 rounded-xl bg-primary-light/40 border border-primary-border flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                Cumulative Performance Summary
              </span>
              <div className="text-3xl font-extrabold text-main tracking-tight">
                CGPA: {stats.realCreditsAttempted > 0 ? stats.realCgpa.toFixed(2) : '0.00'}
                <span className="text-sm font-normal text-secondary ml-2">
                  (Exact: {stats.realCreditsAttempted > 0 ? stats.realCgpaExact.toFixed(4) : '0.0000'})
                </span>
              </div>
              <div className="text-xs font-semibold text-secondary">
                Total GPA Credits Earned: <span className="text-main font-bold">{stats.realCreditsEarned}</span> / {stats.totalRequiredCredits}
              </div>
            </div>

            <div className="text-center sm:text-right space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                Conferred Honours Standing
              </span>
              <div className="text-xl font-extrabold text-primary">
                {stats.realClassStanding}
              </div>
              <div className="text-[11px] text-secondary">
                {stats.ngpaAllPassed ? '✓ All Non-GPA Modules Satisfied' : '⚠️ Non-GPA Modules Incomplete'}
              </div>
            </div>
          </div>
        </div>

        {/* Footnote / Disclaimer */}
        <div className="text-[10px] text-secondary pt-4 text-center leading-relaxed">
          This document is generated by GradePath according to the University of Ruhuna Faculty of Agriculture Undergraduate Curriculum (2023/24 Handbook).
          Official degree conferment requires Senate approval and satisfactory completion of all institutional criteria.
        </div>
      </div>
    </div>
  );
};

