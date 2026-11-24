// University of Ruhuna - Faculty of Agriculture
// GradePath Central State Management (Zustand + Storage Versioning & Safe Migration)

import { create } from 'zustand';
import {
  Grade,
  DegreeCode,
  SemesterKey,
  NavView,
  Course,
  StudentProfile,
  OverallStats,
  SemesterStats,
  RegulationRiskAlert,
  AcademicSemesterStatus,
  SemesterResultStatus,
  AcademicProjectionResult
} from '../types';
import {
  calculateOverallStats,
  calculateSemesterStats,
  calculateAcademicRiskAlerts,
  initDefaultCoursesForDegree,
  initOrientationCourses
} from '../utils/calculations';
import { calculateAcademicProjections } from '../utils/projectionCalculations';
import {
  createCleanProfile,
  createDefaultProfile,
  createFirstClassProfile,
  createAbmProfile,
  createGtProfile
} from '../utils/sampleProfiles';

const STORAGE_KEY_PROFILES_V3 = 'gradepath_profiles_v3';
const STORAGE_KEY_ACTIVE_ID_V3 = 'gradepath_active_id_v3';
const STORAGE_KEY_ONBOARDING_DONE = 'gradepath_onboarded_v3';

// Safe Migration Helper — Clean, Authentic State Without Mock Data
function loadPersistedProfiles(): { profiles: StudentProfile[]; activeId: string; hasOnboarded: boolean } {
  try {
    const v3Data = localStorage.getItem(STORAGE_KEY_PROFILES_V3);
    const v3ActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID_V3);
    const hasOnboarded = localStorage.getItem(STORAGE_KEY_ONBOARDING_DONE) === 'true';

    if (v3Data) {
      const parsed = JSON.parse(v3Data) as StudentProfile[];
      // Filter out legacy mock profile 'Gjay' so real users get a clean experience
      const realProfiles = parsed.filter(p => p.id !== 'prof_gjay' && p.name !== 'Gjay');
      if (Array.isArray(realProfiles) && realProfiles.length > 0) {
        const validActive = realProfiles.find(p => p.id === v3ActiveId) ? (v3ActiveId as string) : realProfiles[0].id;
        // Migration: ensure projection fields exist safely
        const migrated = realProfiles.map(p => ({
          ...p,
          courseProjections: p.courseProjections || {},
          academicStatusBySem: p.academicStatusBySem || {},
          resultStatusBySem: p.resultStatusBySem || {}
        }));
        return { profiles: migrated, activeId: validActive, hasOnboarded };
      }
    }
  } catch (err) {
    console.error('Error during profile hydration:', err);
  }

  // Fresh initialization: clean slate with 0 mock grades!
  const cleanProfile = createCleanProfile('ARMT', 'My Academic Profile', '', 1, '1-1');
  return {
    profiles: [cleanProfile],
    activeId: cleanProfile.id,
    hasOnboarded: false
  };
}

interface GradeStoreState {
  profiles: StudentProfile[];
  activeProfileId: string;
  activeTab: NavView;
  isSidebarExpanded: boolean;
  isMobileDrawerOpen: boolean;
  showOnboarding: boolean;
  selectedSemesterForCalculator: SemesterKey | 'ALL';
  searchQuery: string;

  // Actions
  setActiveTab: (tab: NavView) => void;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setMobileDrawerOpen: (open: boolean) => void;
  setShowOnboarding: (show: boolean) => void;
  completeOnboarding: () => void;
  setSelectedSemesterForCalculator: (sem: SemesterKey | 'ALL') => void;
  setSearchQuery: (query: string) => void;

  // Profile Management
  switchProfile: (id: string) => void;
  setCurrentSemester: (sem: SemesterKey) => void;
  resetToCleanProfile: () => void;
  createProfile: (params: {
    name: string;
    registrationNumber?: string;
    degree: DegreeCode;
    batch?: string;
    currentAcademicYear?: number;
    currentSemester?: SemesterKey;
    specializationDept?: string;
    semesters?: Record<SemesterKey, Course[]>;
  }) => string;
  updateProfile: (id: string, partial: Partial<StudentProfile>) => void;
  duplicateProfile: (id: string) => void;
  deleteProfile: (id: string) => void;

  // Course Grade Operations (on Active Profile)
  setCourseGrade: (semKey: SemesterKey, courseCode: string, grade: Grade) => void;
  setCourseRepeat: (semKey: SemesterKey, courseCode: string, isRepeat: boolean) => void;
  setCourseExcused: (semKey: SemesterKey, courseCode: string, isExcused: boolean) => void;
  setCourseExpected: (semKey: SemesterKey, courseCode: string, isExpected: boolean) => void;
  addCourseToSemester: (semKey: SemesterKey, course: Course) => void;
  setCourseCredits: (semKey: SemesterKey, courseCode: string, credits: number) => void;
  removeCourseFromSemester: (semKey: SemesterKey, courseCode: string) => void;
  setOrientationGrade: (courseCode: string, grade: Grade) => void;
  setSpecializationDept: (dept: string) => void;
  bulkSetSemesterGrades: (semKey: SemesterKey, grade: Grade) => void;
  clearSemesterGrades: (semKey: SemesterKey) => void;
  applyTargetMixPlan: (allocations: Array<{ semKey: SemesterKey; courseCode: string; grade: Grade }>) => void;
  clearAppliedTargetMix: () => void;

  // Data Import / Export / Reset
  exportProfilesJson: () => string;
  importProfilesJson: (jsonStr: string) => boolean;
  resetToFactoryDefaults: () => void;

  // Smart Academic Projection Management
  setCoursePredictedGrade: (semKey: SemesterKey, courseCode: string, grade: Grade) => void;
  setCourseTargetGrade: (semKey: SemesterKey, courseCode: string, grade: Grade) => void;
  setCourseExamStatus: (semKey: SemesterKey, courseCode: string, status: 'upcoming' | 'in_progress' | 'completed') => void;
  setCourseResultPending: (semKey: SemesterKey, courseCode: string, isPending: boolean) => void;
  setAcademicSemesterStatus: (semKey: SemesterKey, status: AcademicSemesterStatus) => void;
  setSemesterResultStatus: (semKey: SemesterKey, status: SemesterResultStatus) => void;
  setProjectionQuickAssumptions: (assumptions: { remainingPrevAvgGpa: number; currentSemAvgGpa: number }) => void;
  setProjectionTargetCgpa: (target: number) => void;
  resetCourseProjection: (semKey: SemesterKey, courseCode: string) => void;
  resetSemesterProjections: (semKey: SemesterKey) => void;
  resetAllProjections: () => void;

  // Getters
  getActiveProfile: () => StudentProfile;
  getOverallStats: () => OverallStats;
  getSemesterStats: (semKey: SemesterKey) => SemesterStats;
  getRiskAlerts: () => RegulationRiskAlert[];
  getAcademicProjections: () => AcademicProjectionResult;
}

const initialHydration = loadPersistedProfiles();

export const useGradeStore = create<GradeStoreState>((set, get) => {
  // Helper to persist current state
  const persist = (profiles: StudentProfile[], activeId: string) => {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILES_V3, JSON.stringify(profiles));
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID_V3, activeId);
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  };

  return {
    profiles: initialHydration.profiles,
    activeProfileId: initialHydration.activeId,
    activeTab: 'calculator',
    isSidebarExpanded: true,
    isMobileDrawerOpen: false,
    showOnboarding: false,
    selectedSemesterForCalculator: '1-1',
    searchQuery: '',

    setActiveTab: (tab: NavView) => set({ activeTab: tab, isMobileDrawerOpen: false }),
    toggleSidebar: () => set(state => ({ isSidebarExpanded: !state.isSidebarExpanded })),
    setSidebarExpanded: (expanded: boolean) => set({ isSidebarExpanded: expanded }),
    setMobileDrawerOpen: (open: boolean) => set({ isMobileDrawerOpen: open }),
    setShowOnboarding: (show: boolean) => set({ showOnboarding: show }),

    completeOnboarding: () => {
      try {
        localStorage.setItem(STORAGE_KEY_ONBOARDING_DONE, 'true');
      } catch (e) { /* ignore */ }
      set({ showOnboarding: false });
    },

    setSelectedSemesterForCalculator: (sem) => set({ selectedSemesterForCalculator: sem }),
    setSearchQuery: (query) => set({ searchQuery: query }),

    switchProfile: (id: string) => {
      const found = get().profiles.find(p => p.id === id);
      if (found) {
        set({ activeProfileId: id });
        persist(get().profiles, id);
      }
    },

    setCurrentSemester: (sem: SemesterKey) => {
      const activeId = get().activeProfileId;
      const yearNum = sem.startsWith('1-') ? 1 : sem.startsWith('2-') ? 2 : sem.startsWith('3-') ? 3 : 4;
      const updated = get().profiles.map(p => {
        if (p.id !== activeId) return p;
        return {
          ...p,
          currentSemester: sem,
          currentAcademicYear: yearNum,
          updatedAt: new Date().toISOString()
        };
      });
      set({ profiles: updated });
      persist(updated, activeId);
    },

    resetToCleanProfile: () => {
      const clean = createCleanProfile('ARMT', 'My Academic Profile', '', 1, '1-1');
      set({
        profiles: [clean],
        activeProfileId: clean.id,
        showOnboarding: true
      });
      persist([clean], clean.id);
      try {
        localStorage.removeItem(STORAGE_KEY_ONBOARDING_DONE);
      } catch (e) {}
    },

    createProfile: (params) => {
      const newId = `prof_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const specializationDept = params.specializationDept || (params.degree === 'ABM' ? 'EC' : params.degree === 'GT' ? 'EN' : 'CS');
      const semKey = params.currentSemester || '1-1';
      const yearNum = params.currentAcademicYear || (semKey.startsWith('1-') ? 1 : semKey.startsWith('2-') ? 2 : semKey.startsWith('3-') ? 3 : 4);
      const newProf: StudentProfile = {
        id: newId,
        name: params.name.trim() || 'Student',
        registrationNumber: params.registrationNumber?.trim() || '',
        degree: params.degree,
        batch: params.batch || `${yearNum === 1 ? '46th' : yearNum === 2 ? '45th' : yearNum === 3 ? '44th' : '43rd'} Batch`,
        currentAcademicYear: yearNum,
        currentSemester: semKey,
        specializationDept,
        specializationResearch: params.degree === 'GT' ? 'EN42601' : `${specializationDept}42601`,
        semesters: params.semesters || initDefaultCoursesForDegree(params.degree, specializationDept),
        orientationCourses: initOrientationCourses(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updated = [...get().profiles, newProf];
      set({ profiles: updated, activeProfileId: newId });
      persist(updated, newId);
      return newId;
    },

    updateProfile: (id, partial) => {
      const updated = get().profiles.map(p => {
        if (p.id === id) {
          return {
            ...p,
            ...partial,
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });
      set({ profiles: updated });
      persist(updated, get().activeProfileId);
    },

    duplicateProfile: (id) => {
      const target = get().profiles.find(p => p.id === id);
      if (!target) return;
      const cloneId = `prof_${Date.now()}_clone`;
      const clone: StudentProfile = JSON.parse(JSON.stringify(target));
      clone.id = cloneId;
      clone.name = `${target.name} (Copy)`;
      clone.createdAt = new Date().toISOString();
      clone.updatedAt = new Date().toISOString();

      const updated = [...get().profiles, clone];
      set({ profiles: updated, activeProfileId: cloneId });
      persist(updated, cloneId);
    },

    deleteProfile: (id) => {
      const current = get().profiles;
      if (current.length <= 1) {
        alert('You must maintain at least one student profile.');
        return;
      }
      const updated = current.filter(p => p.id !== id);
      const newActiveId = get().activeProfileId === id ? updated[0].id : get().activeProfileId;
      set({ profiles: updated, activeProfileId: newActiveId });
      persist(updated, newActiveId);
    },

    setCourseGrade: (semKey, courseCode, grade) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;

        const semList = profile.semesters[semKey] || [];
        const nextList = semList.map(c => {
          if (c.code === courseCode) {
            return { ...c, grade };
          }
          return c;
        });

        // Smart Automatic Transition:
        // When an official grade arrives, preserve any existing predicted grade into historicalPrediction
        // and mark the course result as received without requiring manual cleanup.
        const projKey = `${semKey}:${courseCode}`;
        const existingProjections = { ...(profile.courseProjections || {}) };
        const currentProj = existingProjections[projKey];

        if (grade && currentProj && currentProj.predictedGrade) {
          existingProjections[projKey] = {
            ...currentProj,
            historicalPrediction: currentProj.historicalPrediction || currentProj.predictedGrade,
            isResultPending: false,
            lastUpdated: new Date().toISOString()
          };
        } else if (!grade && currentProj) {
          existingProjections[projKey] = {
            ...currentProj,
            isResultPending: true,
            lastUpdated: new Date().toISOString()
          };
        }

        // Update result status for this semester
        const gpaCourses = nextList.filter(c => !c.isNgpa);
        const gradedCount = gpaCourses.filter(c => !!c.grade).length;
        const newResStatus: SemesterResultStatus =
          gradedCount === 0 ? 'none' : gradedCount === gpaCourses.length ? 'all_received' : 'partial';

        const updatedResultStatuses = {
          ...(profile.resultStatusBySem || {}),
          [semKey]: newResStatus
        };

        return {
          ...profile,
          semesters: {
            ...profile.semesters,
            [semKey]: nextList
          },
          courseProjections: existingProjections,
          resultStatusBySem: updatedResultStatuses,
          updatedAt: new Date().toISOString()
        };
      });

      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    setCourseRepeat: (semKey, courseCode, isRepeat) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;

        const semList = profile.semesters[semKey] || [];
        const nextList = semList.map(c => {
          if (c.code === courseCode) {
            return { ...c, isRepeat };
          }
          return c;
        });

        return {
          ...profile,
          semesters: {
            ...profile.semesters,
            [semKey]: nextList
          },
          updatedAt: new Date().toISOString()
        };
      });

      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    setCourseExcused: (semKey, courseCode, isExcused) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;

        const semList = profile.semesters[semKey] || [];
        const nextList = semList.map(c => {
          if (c.code === courseCode) {
            return { ...c, isExcused };
          }
          return c;
        });

        return {
          ...profile,
          semesters: {
            ...profile.semesters,
            [semKey]: nextList
          },
          updatedAt: new Date().toISOString()
        };
      });

      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    setCourseExpected: (semKey, courseCode, isExpected) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;

        const semList = profile.semesters[semKey] || [];
        const nextList = semList.map(c => {
          if (c.code === courseCode) {
            return { ...c, isExpected };
          }
          return c;
        });

        return {
          ...profile,
          semesters: {
            ...profile.semesters,
            [semKey]: nextList
          },
          updatedAt: new Date().toISOString()
        };
      });

      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    addCourseToSemester: (semKey, course) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;

        const semList = profile.semesters[semKey] || [];
        // Avoid duplicate codes in same semester
        if (semList.some(c => c.code === course.code)) {
          return profile;
        }

        return {
          ...profile,
          semesters: {
            ...profile.semesters,
            [semKey]: [...semList, course]
          },
          updatedAt: new Date().toISOString()
        };
      });

      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    setCourseCredits: (semKey, courseCode, credits) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;

        const semList = profile.semesters[semKey] || [];
        const nextList = semList.map(c => {
          if (c.code === courseCode) {
            return { ...c, credits: Math.max(1, Math.min(12, Number(credits) || 1)) };
          }
          return c;
        });

        return {
          ...profile,
          semesters: {
            ...profile.semesters,
            [semKey]: nextList
          },
          updatedAt: new Date().toISOString()
        };
      });

      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    removeCourseFromSemester: (semKey, courseCode) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;

        const semList = profile.semesters[semKey] || [];
        return {
          ...profile,
          semesters: {
            ...profile.semesters,
            [semKey]: semList.filter(c => c.code !== courseCode)
          },
          updatedAt: new Date().toISOString()
        };
      });

      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    setOrientationGrade: (courseCode, grade) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;

        const nextOrientation = (profile.orientationCourses || []).map(c => {
          if (c.code === courseCode) {
            return { ...c, grade };
          }
          return c;
        });

        return {
          ...profile,
          orientationCourses: nextOrientation,
          updatedAt: new Date().toISOString()
        };
      });

      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    setSpecializationDept: (dept) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;

        return {
          ...profile,
          specializationDept: dept,
          specializationResearch: profile.degree === 'GT' ? 'EN42601' : `${dept}42601`,
          updatedAt: new Date().toISOString()
        };
      });

      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    bulkSetSemesterGrades: (semKey, grade) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;

        const nextList = (profile.semesters[semKey] || []).map(c => ({
          ...c,
          grade
        }));

        return {
          ...profile,
          semesters: {
            ...profile.semesters,
            [semKey]: nextList
          },
          updatedAt: new Date().toISOString()
        };
      });

      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    clearSemesterGrades: (semKey) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;

        const nextList = (profile.semesters[semKey] || []).map(c => ({
          ...c,
          grade: '' as Grade,
          isRepeat: false,
          isExcused: false,
          isExpected: false
        }));

        return {
          ...profile,
          semesters: {
            ...profile.semesters,
            [semKey]: nextList
          },
          updatedAt: new Date().toISOString()
        };
      });

      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    applyTargetMixPlan: (allocations) => {
      const activeId = get().activeProfileId;
      const allocMap = new Map<string, Grade>();
      allocations.forEach(a => {
        allocMap.set(`${a.semKey}:${a.courseCode}`, a.grade);
      });

      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;

        const semKeys: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
        const nextSemesters = { ...profile.semesters };

        semKeys.forEach(semKey => {
          const list = nextSemesters[semKey] || [];
          nextSemesters[semKey] = list.map(c => {
            const key = `${semKey}:${c.code}`;
            if (allocMap.has(key)) {
              return {
                ...c,
                grade: allocMap.get(key) as Grade,
                isExpected: true
              };
            }
            return c;
          });
        });

        return {
          ...profile,
          semesters: nextSemesters,
          updatedAt: new Date().toISOString()
        };
      });

      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    clearAppliedTargetMix: () => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;

        const semKeys: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
        const nextSemesters = { ...profile.semesters };

        semKeys.forEach(semKey => {
          const list = nextSemesters[semKey] || [];
          nextSemesters[semKey] = list.map(c => {
            if (c.isExpected) {
              return {
                ...c,
                grade: '' as Grade,
                isExpected: false
              };
            }
            return c;
          });
        });

        return {
          ...profile,
          semesters: nextSemesters,
          updatedAt: new Date().toISOString()
        };
      });

      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    exportProfilesJson: () => {
      const stateToExport = {
        version: '3.0.0',
        platform: 'GradePath - University of Ruhuna Faculty of Agriculture',
        exportedAt: new Date().toISOString(),
        activeProfileId: get().activeProfileId,
        profiles: get().profiles
      };
      return JSON.stringify(stateToExport, null, 2);
    },

    importProfilesJson: (jsonStr) => {
      try {
        const parsed = JSON.parse(jsonStr);
        const importedProfiles = parsed.profiles || (Array.isArray(parsed) ? parsed : null);
        if (Array.isArray(importedProfiles) && importedProfiles.length > 0) {
          const validActiveId = parsed.activeProfileId && importedProfiles.find((p: any) => p.id === parsed.activeProfileId)
            ? parsed.activeProfileId
            : importedProfiles[0].id;

          set({ profiles: importedProfiles, activeProfileId: validActiveId });
          persist(importedProfiles, validActiveId);
          return true;
        }
      } catch (err) {
        console.error('Failed to import JSON profile data:', err);
      }
      return false;
    },

    resetToFactoryDefaults: () => {
      localStorage.removeItem(STORAGE_KEY_PROFILES_V3);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_ID_V3);
      localStorage.removeItem(STORAGE_KEY_ONBOARDING_DONE);

      const def = createDefaultProfile();
      const firstClass = createFirstClassProfile();
      const abm = createAbmProfile();
      const gt = createGtProfile();
      const initial = [def, firstClass, abm, gt];

      set({
        profiles: initial,
        activeProfileId: def.id,
        activeTab: 'grades',
        showOnboarding: true
      });
      persist(initial, def.id);
    },

    // ========================================================
    // Smart Academic Projection Actions
    // ========================================================

    setCoursePredictedGrade: (semKey, courseCode, grade) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;
        const projKey = `${semKey}:${courseCode}`;
        const existing = profile.courseProjections || {};
        const current = existing[projKey] || { courseCode, semesterKey: semKey };
        const updatedProjections = {
          ...existing,
          [projKey]: {
            ...current,
            predictedGrade: grade,
            isResultPending: !profile.semesters[semKey]?.find(c => c.code === courseCode)?.grade,
            lastUpdated: new Date().toISOString()
          }
        };
        return {
          ...profile,
          courseProjections: updatedProjections,
          updatedAt: new Date().toISOString()
        };
      });
      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    setCourseTargetGrade: (semKey, courseCode, grade) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;
        const projKey = `${semKey}:${courseCode}`;
        const existing = profile.courseProjections || {};
        const current = existing[projKey] || { courseCode, semesterKey: semKey };
        const updatedProjections = {
          ...existing,
          [projKey]: {
            ...current,
            targetGrade: grade,
            lastUpdated: new Date().toISOString()
          }
        };
        return {
          ...profile,
          courseProjections: updatedProjections,
          updatedAt: new Date().toISOString()
        };
      });
      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    setCourseExamStatus: (semKey, courseCode, status) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;
        const projKey = `${semKey}:${courseCode}`;
        const existing = profile.courseProjections || {};
        const current = existing[projKey] || { courseCode, semesterKey: semKey };
        const updatedProjections = {
          ...existing,
          [projKey]: {
            ...current,
            examStatus: status,
            lastUpdated: new Date().toISOString()
          }
        };
        return {
          ...profile,
          courseProjections: updatedProjections,
          updatedAt: new Date().toISOString()
        };
      });
      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    setCourseResultPending: (semKey, courseCode, isPending) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;
        const projKey = `${semKey}:${courseCode}`;
        const existing = profile.courseProjections || {};
        const current = existing[projKey] || { courseCode, semesterKey: semKey };
        const updatedProjections = {
          ...existing,
          [projKey]: {
            ...current,
            isResultPending: isPending,
            lastUpdated: new Date().toISOString()
          }
        };
        return {
          ...profile,
          courseProjections: updatedProjections,
          updatedAt: new Date().toISOString()
        };
      });
      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    setAcademicSemesterStatus: (semKey, status) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;
        return {
          ...profile,
          academicStatusBySem: {
            ...(profile.academicStatusBySem || {}),
            [semKey]: status
          },
          updatedAt: new Date().toISOString()
        };
      });
      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    setSemesterResultStatus: (semKey, status) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;
        return {
          ...profile,
          resultStatusBySem: {
            ...(profile.resultStatusBySem || {}),
            [semKey]: status
          },
          updatedAt: new Date().toISOString()
        };
      });
      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    setProjectionQuickAssumptions: (assumptions) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;
        return {
          ...profile,
          projectionQuickAssumptions: assumptions,
          updatedAt: new Date().toISOString()
        };
      });
      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    setProjectionTargetCgpa: (target) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;
        return {
          ...profile,
          projectionTargetCgpa: target,
          updatedAt: new Date().toISOString()
        };
      });
      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    resetCourseProjection: (semKey, courseCode) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;
        const projKey = `${semKey}:${courseCode}`;
        const existing = { ...(profile.courseProjections || {}) };
        delete existing[projKey];
        return {
          ...profile,
          courseProjections: existing,
          updatedAt: new Date().toISOString()
        };
      });
      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    resetSemesterProjections: (semKey) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;
        const existing = { ...(profile.courseProjections || {}) };
        Object.keys(existing).forEach(k => {
          if (k.startsWith(`${semKey}:`)) {
            delete existing[k];
          }
        });
        return {
          ...profile,
          courseProjections: existing,
          updatedAt: new Date().toISOString()
        };
      });
      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    resetAllProjections: () => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;
        return {
          ...profile,
          courseProjections: {},
          projectionQuickAssumptions: undefined,
          updatedAt: new Date().toISOString()
        };
      });
      set({ profiles: updatedProfiles });
      persist(updatedProfiles, activeId);
    },

    getActiveProfile: () => {
      const found = get().profiles.find(p => p.id === get().activeProfileId);
      return found || get().profiles[0] || createDefaultProfile();
    },

    getOverallStats: () => {
      return calculateOverallStats(get().getActiveProfile());
    },

    getSemesterStats: (semKey) => {
      const profile = get().getActiveProfile();
      return calculateSemesterStats(semKey, profile.semesters[semKey] || []);
    },

    getRiskAlerts: () => {
      return calculateAcademicRiskAlerts(get().getActiveProfile());
    },

    getAcademicProjections: () => {
      const profile = get().getActiveProfile();
      return calculateAcademicProjections(profile, profile.projectionQuickAssumptions);
    }
  };
});

