// University of Ruhuna - Faculty of Agriculture
// GradePath Multi-Student Profile Manager

import React, { useState } from 'react';
import { Users, Plus, Copy, Trash2, CheckCircle2, UserCircle2, ArrowRight } from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { DegreeCode, SemesterKey } from '../../types';
import { calculateOverallStats } from '../../utils/calculations';

export const StudentProfilesView: React.FC = () => {
  const {
    profiles,
    activeProfileId,
    switchProfile,
    createProfile,
    duplicateProfile,
    deleteProfile,
    setActiveTab
  } = useGradeStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [degree, setDegree] = useState<DegreeCode>('ARMT');
  const [year, setYear] = useState<number>(1);
  const [sem, setSem] = useState<SemesterKey>('1-1');

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Multi-Profile Hub</span>
          </div>
          <h2 className="text-xl font-bold text-main mt-1">Student Profiles on this Device</h2>
          <p className="text-xs text-secondary mt-0.5">
            Create and switch between multiple student records locally without logging in.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Profile</span>
        </button>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profiles.map(p => {
          const isActive = p.id === activeProfileId;
          const pStats = calculateOverallStats(p);

          return (
            <div
              key={p.id}
              className={`p-5 rounded-2xl bg-surface border shadow-subtle flex flex-col justify-between space-y-4 transition ${
                isActive ? 'border-primary ring-2 ring-primary ring-opacity-20' : 'border-border hover:border-border/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-light text-primary font-bold text-sm flex items-center justify-center border border-primary-border">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-main flex items-center gap-2">
                        <span>{p.name}</span>
                        {isActive && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-white font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-secondary mt-0.5">
                        {p.degree} (Hons) • {p.currentSemester} • {p.registrationNumber || 'No Index'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-surface-subtle border border-border">
                    <span className="text-[10px] uppercase font-bold text-secondary">Cumulative GPA</span>
                    <div className="text-lg font-bold text-main mt-0.5">{pStats.cgpa.toFixed(2)}</div>
                    <div className="text-[10px] text-secondary truncate">{pStats.classStanding}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-subtle border border-border">
                    <span className="text-[10px] uppercase font-bold text-secondary">Earned Credits</span>
                    <div className="text-lg font-bold text-main mt-0.5">
                      {pStats.totalGpaCreditsEarned} / {pStats.totalRequiredCredits}
                    </div>
                    <div className="text-[10px] text-secondary">
                      {Math.round((pStats.totalGpaCreditsEarned / pStats.totalRequiredCredits) * 100)}% Completed
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => duplicateProfile(p.id)}
                    className="p-1.5 rounded-lg text-secondary hover:text-main hover:bg-surface-subtle transition"
                    title="Duplicate this profile"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {profiles.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete profile "${p.name}"?`)) {
                          deleteProfile(p.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-secondary hover:text-accent-danger hover:bg-surface-subtle transition"
                      title="Delete profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {!isActive ? (
                  <button
                    onClick={() => switchProfile(p.id)}
                    className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-semibold text-main hover:bg-primary hover:text-white transition"
                  >
                    Switch to Profile
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <span>Open Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Profile Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-modal p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-main">Create New Student Profile</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded text-secondary hover:text-main"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-main mb-1">Student Name</label>
                <input
                  type="text"
                  placeholder="e.g. Kasun"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-main focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">Index / Reg Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. AG/2021/7740"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-main focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">Degree Programme</label>
                <select
                  value={degree}
                  onChange={(e) => setDegree(e.target.value as DegreeCode)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-main focus:outline-none focus:border-primary"
                >
                  <option value="ARMT">ARMT (126 Credits)</option>
                  <option value="ABM">ABM (125 Credits)</option>
                  <option value="GT">Green Technology (125 Credits)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-main mb-1">Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-main focus:outline-none focus:border-primary"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-main mb-1">Semester</label>
                  <select
                    value={sem}
                    onChange={(e) => setSem(e.target.value as SemesterKey)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-main focus:outline-none focus:border-primary"
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

            <div className="pt-3 flex justify-end gap-2 border-t border-border">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-border text-xs font-medium text-secondary hover:text-main"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover disabled:opacity-50 transition"
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

