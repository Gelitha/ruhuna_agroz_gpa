// University of Ruhuna - Faculty of Agriculture
// Unified Academic Profile Setup & Onboarding Modal
// Supports 1. First-time onboarding, 2. New profile creation, 3. Profile editing
// Requires explicit degree and semester selection; prevents silent default profile creation.

import React, { useState, useEffect } from 'react';
import {
  User,
  GraduationCap,
  Calendar,
  Compass,
  Check,
  X,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { DegreeCode, SemesterKey } from '../../types';
import { initDefaultCoursesForDegree, getOrdinalYear } from '../../utils/calculations';
import { AppLogo } from '../common/AppLogo';
import { PrivacyDisclaimerNotice } from '../common/PrivacyDisclaimerNotice';

const SEMESTERS_LIST: Array<{ key: SemesterKey; label: string; year: number; yearText: string }> = [
  { key: '1-1', label: 'Sem 1-1', year: 1, yearText: '1st Yr' },
  { key: '1-2', label: 'Sem 1-2', year: 1, yearText: '1st Yr' },
  { key: '2-1', label: 'Sem 2-1', year: 2, yearText: '2nd Yr' },
  { key: '2-2', label: 'Sem 2-2', year: 2, yearText: '2nd Yr' },
  { key: '3-1', label: 'Sem 3-1', year: 3, yearText: '3rd Yr' },
  { key: '3-2', label: 'Sem 3-2', year: 3, yearText: '3rd Yr' },
  { key: '4-1', label: 'Sem 4-1', year: 4, yearText: '4th Yr' },
  { key: '4-2', label: 'Sem 4-2', year: 4, yearText: '4th Yr' }
];

const ARMT_SPECIALIZATIONS = [
  { code: 'CS', name: 'Crop Science' },
  { code: 'AS', name: 'Animal Science' },
  { code: 'AB', name: 'Agricultural Biology' },
  { code: 'AE', name: 'Agricultural Engineering' },
  { code: 'EC', name: 'Agricultural Economics' },
  { code: 'FT', name: 'Food Science & Technology' },
  { code: 'SS', name: 'Soil Science' }
];

export const ProfileSetupModal: React.FC = () => {
  const {
    profileModalState,
    closeProfileModal,
    createProfile,
    updateProfile,
    completeOnboarding,
    switchProfile,
    setActiveTab,
    profiles,
    activeProfileId
  } = useGradeStore();

  const { isOpen, mode, profileId } = profileModalState;

  // Active target profile for edit mode
  const targetProfile = profiles.find(p => p.id === (profileId || activeProfileId)) || profiles[0];

  const [name, setName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [degree, setDegree] = useState<DegreeCode | ''>('');
  const [currentSem, setCurrentSem] = useState<SemesterKey | ''>('');
  const [batch, setBatch] = useState<string>('');
  const [specialization, setSpecialization] = useState<string>('CS');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDegreeConfirm, setShowDegreeConfirm] = useState<boolean>(false);

  // Initialize form state: strictly unselected for onboarding/new, preserved for edit
  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && targetProfile) {
      setName(targetProfile.name || '');
      setRegNo(targetProfile.registrationNumber || '');
      setDegree(targetProfile.degree || '');
      setCurrentSem(targetProfile.currentSemester || '');
      setBatch(targetProfile.batch || '');
      setSpecialization(targetProfile.specializationDept || 'CS');
    } else {
      // First-time onboarding & new profile creation start clean and unselected
      setName('');
      setRegNo('');
      setDegree('');
      setCurrentSem('');
      setBatch('');
      setSpecialization('CS');
    }
    setErrorMsg(null);
  }, [isOpen, mode, targetProfile]);

  if (!isOpen) return null;

  const isOnboarding = mode === 'onboarding';
  const isEdit = mode === 'edit';

  // Derived Year information
  const semMeta = currentSem ? SEMESTERS_LIST.find(s => s.key === currentSem) : null;
  const derivedYear = semMeta ? semMeta.year : null;

  // Academic applicability for specialization:
  // - In ARMT, specialization is formally assigned and applicable for Years 3 & 4
  // - In ABM, economics (EC) is the default home department
  // - In GT, agricultural engineering/tech (EN) is the default home department
  const isSpecializationApplicable = degree === 'ARMT' && derivedYear !== null && derivedYear >= 3;

  const handleDegreeSelect = (deg: DegreeCode) => {
    setDegree(deg);
    if (deg === 'ABM') {
      setSpecialization('EC');
    } else if (deg === 'GT') {
      setSpecialization('EN');
    } else if (specialization === 'EN') {
      setSpecialization('CS');
    }
    if (errorMsg) setErrorMsg(null);
  };

  const handleSemesterSelect = (semKey: SemesterKey) => {
    setCurrentSem(semKey);
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate required Student Name
    if (!name.trim()) {
      setErrorMsg('Please enter the student name.');
      return;
    }

    // 2. Validate explicit Degree Programme selection
    if (!degree) {
      setErrorMsg('Please select your degree programme.');
      return;
    }

    // 3. Validate explicit Academic Semester selection
    if (!currentSem) {
      setErrorMsg('Please select your current academic semester.');
      return;
    }

    const calculatedYear = derivedYear || 1;
    const finalBatch = isEdit ? (batch.trim() || targetProfile?.batch || '') : '';
    const specDept = degree === 'ABM' ? 'EC' : degree === 'GT' ? 'EN' : (specialization || 'CS');

    if (isEdit && targetProfile) {
      const isDegreeChanged = targetProfile.degree !== degree;
      const existingGradedCount = Object.values(targetProfile.semesters || {}).reduce(
        (acc, sem) => acc + sem.filter(c => c.grade).length,
        0
      );

      // Require explicit confirmation if degree changed and grades or archived records exist
      const hasExistingData = existingGradedCount > 0 || Boolean(targetProfile.archivedDegreeRecords?.[degree]);
      if (isDegreeChanged && hasExistingData && !showDegreeConfirm) {
        setShowDegreeConfirm(true);
        return;
      }

      // Safe recovery: archive previous degree results if degree changed, or restore if available
      const updatedSemesters = isDegreeChanged
        ? (targetProfile.archivedDegreeRecords?.[degree]?.semesters || initDefaultCoursesForDegree(degree, specDept))
        : targetProfile.semesters;

      const updatedArchived = isDegreeChanged
        ? {
            ...(targetProfile.archivedDegreeRecords || {}),
            [targetProfile.degree]: {
              degree: targetProfile.degree,
              semesters: targetProfile.semesters,
              archivedAt: new Date().toISOString()
            }
          }
        : targetProfile.archivedDegreeRecords;

      updateProfile(targetProfile.id, {
        name: name.trim(),
        registrationNumber: regNo.trim(),
        degree,
        currentSemester: currentSem,
        currentAcademicYear: calculatedYear,
        batch: finalBatch,
        specializationDept: specDept,
        semesters: updatedSemesters,
        archivedDegreeRecords: updatedArchived
      });
      setShowDegreeConfirm(false);
      closeProfileModal();
    } else if (isOnboarding) {
      // First-time onboarding setup
      const newId = createProfile({
        name: name.trim(),
        registrationNumber: regNo.trim(),
        degree,
        currentSemester: currentSem,
        currentAcademicYear: calculatedYear,
        batch: finalBatch,
        specializationDept: specDept,
        semesters: initDefaultCoursesForDegree(degree, specDept)
      });
      completeOnboarding();
      switchProfile(newId);
      closeProfileModal();
      setActiveTab('dashboard');
    } else {
      // New profile creation
      const newId = createProfile({
        name: name.trim(),
        registrationNumber: regNo.trim(),
        degree,
        currentSemester: currentSem,
        currentAcademicYear: calculatedYear,
        batch: finalBatch,
        specializationDept: specDept,
        semesters: initDefaultCoursesForDegree(degree, specDept)
      });
      switchProfile(newId);
      closeProfileModal();
      setActiveTab('dashboard');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div
        className="relative w-full max-w-lg bg-white border border-[#DCDDD7] rounded-3xl shadow-2xl p-5 sm:p-7 transition-all my-auto max-h-[92vh] overflow-y-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Area */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#EDF1EC]">
          <div className="flex items-center gap-3">
            <AppLogo size="md" />
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#176B45] block">
                Faculty of Agriculture • University of Ruhuna
              </span>
              <h2
                id="profile-modal-title"
                className="text-lg sm:text-xl font-extrabold text-[#242824] leading-tight mt-0.5"
              >
                {isOnboarding ? 'My Academic Profile' : isEdit ? 'Edit Academic Profile' : 'New Student Profile'}
              </h2>
            </div>
          </div>

          {!isOnboarding && (
            <button
              type="button"
              onClick={closeProfileModal}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
              aria-label="Cancel and close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Student Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#242824] flex items-center justify-between">
              <span>Student Name <strong className="text-rose-600">*</strong></span>
              <span className="text-[11px] text-neutral-400 font-normal">Full name or with initials</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="e.g. K.A. Janith Silva"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#DCDDD7] text-sm text-[#242824] placeholder-neutral-400 font-medium focus:outline-none focus:border-[#176B45] focus:ring-1 focus:ring-[#176B45]"
                autoFocus
              />
            </div>
          </div>

          {/* 2. Registration / Index Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#242824] flex items-center justify-between">
              <span>Registration / Index Number</span>
              <span className="text-[11px] text-neutral-400 font-normal">Optional</span>
            </label>
            <input
              type="text"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
              placeholder="e.g. AG/2021/1234 or Index 1234"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCDDD7] text-sm text-[#242824] placeholder-neutral-400 font-medium focus:outline-none focus:border-[#176B45] focus:ring-1 focus:ring-[#176B45]"
            />
          </div>

          {/* 3. Degree Programme (Explicit Choice Required) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#242824] flex items-center justify-between">
              <span>Degree Programme <strong className="text-rose-600">*</strong></span>
              {!degree && <span className="text-[11px] text-amber-700 font-bold">Please select</span>}
            </label>
            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  code: 'ARMT' as DegreeCode,
                  name: 'Agricultural Resource Management & Technology',
                  short: 'BSc Hons (ARMT)',
                  credits: '126 Credits'
                },
                {
                  code: 'ABM' as DegreeCode,
                  name: 'Agribusiness Management',
                  short: 'BSc Hons (ABM)',
                  credits: '125 Credits'
                },
                {
                  code: 'GT' as DegreeCode,
                  name: 'Green Technology',
                  short: 'BSc Hons (GT)',
                  credits: '125 Credits'
                }
              ].map((deg) => {
                const isSelected = degree === deg.code;
                return (
                  <button
                    key={deg.code}
                    type="button"
                    onClick={() => handleDegreeSelect(deg.code)}
                    className={`p-3 rounded-2xl text-left border transition-all flex items-center justify-between gap-3 min-h-[48px] cursor-pointer ${
                      isSelected
                        ? 'bg-[#EAF2ED] border-[#176B45] ring-1 ring-[#176B45]/40 text-[#103B2D]'
                        : 'bg-white border-[#DCDDD7] hover:bg-neutral-50 text-[#242824]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold flex items-center gap-2">
                        <span>{deg.short}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {deg.credits}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#626962] truncate mt-0.5">
                        {deg.name}
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#176B45] border-[#176B45] text-white' : 'border-neutral-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Current Academic Semester (Explicit Choice Required) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#242824]">
                Current Academic Semester <strong className="text-rose-600">*</strong>
              </label>
              {derivedYear ? (
                <span className="text-xs font-extrabold text-[#176B45] bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                  {getOrdinalYear(derivedYear)}
                </span>
              ) : (
                <span className="text-[11px] text-amber-700 font-bold">Please select</span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {SEMESTERS_LIST.map((s) => {
                const isSelected = currentSem === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => handleSemesterSelect(s.key)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition text-center min-h-[44px] cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-[#103B2D] text-white border-[#103B2D] shadow-xs font-extrabold'
                        : 'bg-white border-[#DCDDD7] text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span>{s.label}</span>
                    <span className={`text-[9px] font-medium leading-none mt-0.5 ${isSelected ? 'text-emerald-200' : 'text-neutral-400'}`}>
                      {s.yearText}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Specialization Department (Visible when academically applicable) */}
          {degree === 'ARMT' && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-[#242824] flex items-center justify-between">
                <span>Specialization Department</span>
                <span className="text-[11px] text-neutral-400 font-normal">
                  {isSpecializationApplicable ? 'Required for Years 3 & 4' : 'Core curriculum in Years 1 & 2'}
                </span>
              </label>
              {isSpecializationApplicable ? (
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCDDD7] text-xs font-bold text-[#242824] cursor-pointer focus:outline-none focus:border-[#176B45] min-h-[44px]"
                >
                  {ARMT_SPECIALIZATIONS.map((sp) => (
                    <option key={sp.code} value={sp.code}>
                      {sp.code} — {sp.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-600 font-medium">
                  ARMT Semesters 1-1 to 2-2 follow the universal core agricultural curriculum. Departmental specialization is chosen starting Semester 3-1.
                </div>
              )}
            </div>
          )}

          {/* Compact Privacy & Academic Disclaimer (Onboarding & New Profile) */}
          {!isEdit && (
            <PrivacyDisclaimerNotice compact showAcademicDisclaimer />
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#EDF1EC] flex items-center justify-end gap-2.5">
            {!isOnboarding && (
              <button
                type="button"
                onClick={closeProfileModal}
                className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs sm:text-sm transition min-h-[44px] cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#176B45] hover:bg-[#103B2D] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 min-h-[44px] cursor-pointer"
            >
              <span>{isOnboarding ? 'Complete Setup & Open Dashboard' : isEdit ? 'Save Changes' : 'Create Profile'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Degree Programme Change Confirmation & Safe Recovery Modal */}
        {showDegreeConfirm && targetProfile && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-amber-300">
              <div className="flex items-center gap-2 text-amber-800 font-black text-sm uppercase tracking-wider">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Confirm Degree Programme Change</span>
              </div>
              <h3 className="text-base font-black text-neutral-900 leading-tight">
                Change Curriculum from {targetProfile.degree} to {degree}
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                You are changing this student's degree programme from <strong className="text-neutral-900">{targetProfile.degree}</strong> to <strong className="text-[#176B45]">{degree}</strong>.
              </p>
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <p className="font-extrabold flex items-center gap-1.5 text-amber-950">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Academic Data Protection:</span>
                </p>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Your current {targetProfile.degree} course grades will be safely archived on this profile. The active course database will switch to {degree}. If you ever switch back, your previous results can be restored.
                </p>
              </div>
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDegreeConfirm(false);
                    setDegree(targetProfile.degree);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs transition min-h-[44px] cursor-pointer"
                >
                  Cancel (Keep {targetProfile.degree})
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-black text-xs transition shadow-sm min-h-[44px] cursor-pointer"
                >
                  Confirm & Replace
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
