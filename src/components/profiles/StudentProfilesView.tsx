// University of Ruhuna - Faculty of Agriculture
// GradePath Multi-Student Profile Manager

import React from 'react';
import { Users, Plus, Copy, Trash2, CheckCircle2, UserCircle2, ArrowRight, Edit3 } from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { calculateOverallStats } from '../../utils/calculations';
import { HelpTooltip } from '../common/HelpTooltip';
import { SiSubtext } from '../common/BilingualText';
import { SI } from '../../constants/translations';

export const StudentProfilesView: React.FC = () => {
  const {
    profiles,
    activeProfileId,
    switchProfile,
    duplicateProfile,
    deleteProfile,
    openProfileModal,
    setActiveTab
  } = useGradeStore();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Multi-Profile Hub</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <h2 className="text-xl font-bold text-main">Student Profiles on this Device</h2>
            <HelpTooltip id="T34" size="xs" />
          </div>
          <SiSubtext text={SI.profiles.title} className="text-[#176B45] font-semibold" />
          <p className="text-xs text-secondary mt-0.5">
            Create and switch between multiple student records locally without logging in.
          </p>
        </div>

        <button
          onClick={() => openProfileModal('create')}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span className="text-left leading-tight">
            <span className="block">New Profile</span>
            <SiSubtext text={SI.nav.newProfile} className="text-[9.5px] text-emerald-100" />
          </span>
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
                    <div className="text-lg font-bold text-main mt-0.5">{pStats.totalGpaCreditsAttempted > 0 ? pStats.cgpa.toFixed(2) : '—'}</div>
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
                    onClick={() => openProfileModal('edit', p.id)}
                    className="p-1.5 rounded-lg text-secondary hover:text-main hover:bg-surface-subtle transition"
                    title="Edit profile details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
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
    </div>
  );
};

