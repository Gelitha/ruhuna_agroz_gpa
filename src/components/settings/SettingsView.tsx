// University of Ruhuna - Faculty of Agriculture
// GradePath — Completely Redesigned Profiles, Backup & Settings Hub

import React, { useState, useRef } from 'react';
import {
  Users,
  Settings,
  Download,
  Upload,
  Plus,
  Copy,
  Trash2,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { GRADING_SCALE, DEPARTMENTS } from '../../database';
import { DegreeCode, SemesterKey } from '../../types';
import { calculateOverallStats } from '../../utils/calculations';
import { HelpTooltip } from '../common/HelpTooltip';

export const SettingsView: React.FC = () => {
  const {
    profiles,
    activeProfileId,
    switchProfile,
    createProfile,
    duplicateProfile,
    deleteProfile,
    exportProfilesJson,
    importProfilesJson,
    resetToFactoryDefaults
  } = useGradeStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [degree, setDegree] = useState<DegreeCode>('ARMT');
  const [year, setYear] = useState<number>(1);
  const [sem, setSem] = useState<SemesterKey>('1-1');

  const [importStatus, setImportStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    if (!name.trim()) return;
    createProfile({
      name: name.trim(),
      registrationNumber: regNo.trim(),
      degree,
      currentAcademicYear: year,
      currentSemester: sem,
      batch: `${year === 1 ? '46th' : year === 2 ? '45th' : '44th'} Batch`
    });
    setName('');
    setRegNo('');
    setIsCreateModalOpen(false);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportProfilesJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gradepath_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importProfilesJson(content);
        if (success) {
          setImportStatus('✓ Data successfully restored!');
        } else {
          setImportStatus('✕ Invalid backup file format.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="rounded-2xl bg-gradient-to-r from-[#17382D] to-[#122A21] text-white p-5 shadow-xs border border-emerald-900/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-white/10 text-emerald-200">
              System Administration
            </span>
            <span className="text-xs text-emerald-300/70">Local Database</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mt-1">
            Student Profiles & Settings
          </h2>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-white text-emerald-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-emerald-50 transition shrink-0"
        >
          <Plus className="w-4 h-4 text-emerald-900" />
          <span>New Profile</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. STUDENT PROFILES MANAGER */}
      {/* ======================================================== */}
      <div className="p-7 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div>
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-800" />
              <span>Registered Student Profiles ({profiles.length})</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">Switch or duplicate student records on this device</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profiles.map(p => {
            const isActive = p.id === activeProfileId;
            const pStats = calculateOverallStats(p);

            return (
              <div
                key={p.id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                  isActive
                    ? 'border-emerald-700 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-600/30'
                    : 'border-neutral-200 bg-neutral-50/60 hover:bg-neutral-50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white font-mono font-bold text-sm flex items-center justify-center shadow-xs">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                          <span>{p.name}</span>
                          {isActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-800 text-white font-bold">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5">
                          {p.degree} (Hons) • Sem {p.currentSemester} • {p.registrationNumber || 'No Index'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-neutral-200/80">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase">Cumulative GPA</span>
                      <div className="text-xl font-black text-neutral-900 font-mono mt-0.5">{pStats.cgpa.toFixed(2)}</div>
                      <div className="text-[10px] text-emerald-800 font-bold truncate">{pStats.classStanding}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-neutral-200/80">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase">Earned Credits</span>
                      <div className="text-xl font-black text-neutral-900 font-mono mt-0.5">
                        {pStats.totalGpaCreditsEarned} <span className="text-xs font-normal text-neutral-400">/ {pStats.totalRequiredCredits}</span>
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {Math.round((pStats.totalGpaCreditsEarned / pStats.totalRequiredCredits) * 100)}% Completed
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => duplicateProfile(p.id)}
                      className="p-1.5 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                      title="Duplicate profile"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {profiles.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete profile "${p.name}"?`)) {
                            deleteProfile(p.id);
                          }
                        }}
                        className="p-1.5 rounded-xl text-neutral-500 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {!isActive ? (
                    <button
                      onClick={() => switchProfile(p.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs font-bold text-neutral-800 hover:bg-neutral-900 hover:text-white transition"
                    >
                      Switch Profile
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-800">Currently Active</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. LOCAL DATA BACKUP & RESTORE */}
      {/* ======================================================== */}
      <div className="p-7 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-800" />
          <span>Local Storage & JSON Backups</span>
        </h3>
        <p className="text-xs text-neutral-500 leading-relaxed max-w-2xl">
          GradePath saves all profiles locally on your device without transmitting data over the network. Export a periodic backup to safeguard your grades.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadBackup}
              className="px-4 py-2.5 rounded-2xl bg-neutral-900 text-white text-xs font-bold flex items-center gap-2 hover:bg-black transition shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Export Backup (.JSON)</span>
            </button>
            <HelpTooltip id="T35" size="xs" />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-2xl bg-white border border-neutral-200 text-neutral-800 text-xs font-bold flex items-center gap-2 hover:bg-neutral-100 transition shadow-xs"
            >
              <Upload className="w-4 h-4 text-neutral-500" />
              <span>Restore Backup</span>
            </button>
            <HelpTooltip id="T36" size="xs" />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => {
              if (confirm('Reset all student profiles to factory defaults?')) {
                resetToFactoryDefaults();
              }
            }}
            className="px-4 py-2.5 rounded-2xl bg-white border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 hover:bg-rose-50 transition ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Defaults</span>
          </button>
        </div>

        {importStatus && (
          <div className="text-xs font-bold text-emerald-800 pt-1">
            {importStatus}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. OFFICIAL 2023/24 GRADING TABLE REFERENCE */}
      {/* ======================================================== */}
      <div className="p-7 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-5">
        <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-800" />
          <span>Official Grading Scale (2023/24 Handbook Section 2.2)</span>
        </h3>

        <div className="rounded-2xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-[11px] font-bold text-neutral-600 uppercase border-b border-neutral-200">
                <th className="py-3 px-4">Marks Range</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4">GPV</th>
                <th className="py-3 px-4">Academic Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {Object.entries(GRADING_SCALE).map(([grade, info]) => (
                <tr key={grade} className="hover:bg-neutral-50/50">
                  <td className="py-2.5 px-4 text-neutral-500">{info.marks}</td>
                  <td className="py-2.5 px-4 font-bold text-neutral-900 font-mono">{grade}</td>
                  <td className="py-2.5 px-4 font-bold text-emerald-800 font-mono">{info.gpv.toFixed(1)}</td>
                  <td className="py-2.5 px-4 text-neutral-600">{info.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Profile Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-neutral-200 rounded-3xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <h3 className="text-base font-bold text-neutral-900">Create New Student Profile</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Student Name</label>
                <input
                  type="text"
                  placeholder="e.g. Kasun"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-semibold text-neutral-900 focus:outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Index / Reg Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. AG/2021/7740"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-semibold text-neutral-900 focus:outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Degree Programme</label>
                <select
                  value={degree}
                  onChange={(e) => setDegree(e.target.value as DegreeCode)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-900 focus:outline-none focus:border-emerald-700"
                >
                  <option value="ARMT">ARMT (126 Credits)</option>
                  <option value="ABM">ABM (125 Credits)</option>
                  <option value="GT">Green Technology (125 Credits)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-900 focus:outline-none focus:border-emerald-700"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Semester</label>
                  <select
                    value={sem}
                    onChange={(e) => setSem(e.target.value as SemesterKey)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-900 focus:outline-none focus:border-emerald-700"
                  >
                    <option value="1-1">Sem 1-1</option>
                    <option value="1-2">Sem 1-2</option>
                    <option value="2-1">Sem 2-1</option>
                    <option value="2-2">Sem 2-2</option>
                    <option value="3-1">Sem 3-1</option>
                    <option value="3-2">Sem 3-2</option>
                    <option value="4-1">Sem 4-1</option>
                    <option value="4-2">Sem 4-2</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-neutral-200">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 disabled:opacity-40 transition"
              >
                Create Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
