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
  CourseProjectionData,
  AcademicProjectionResult
} from '../types';
import {
  calculateOverallStats,
  calculateSemesterStats,
  calculateAcademicRiskAlerts,
  initDefaultCoursesForDegree,
  initOrientationCourses
} from '../utils/calculations';
import {
  calculateAcademicProjections,
  isCourseGradeConfirmed
} from '../utils/projectionCalculations';
import { GRADING_SCALE } from '../database';
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
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      const defaultProf = createCleanProfile('ARMT', 'My Profile', '', 1, '1-1');
      return { profiles: [defaultProf], activeId: defaultProf.id, hasOnboarded: true };
    }
    const v3Data = localStorage.getItem(STORAGE_KEY_PROFILES_V3);
    const v3ActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID_V3);
    const hasOnboarded = localStorage.getItem(STORAGE_KEY_ONBOARDING_DONE) === 'true';

    if (v3Data) {
      const parsed = JSON.parse(v3Data) as StudentProfile[];
      // Filter out legacy mock profile 'Gjay' so real users get a clean experience
      const realProfiles = parsed.filter(p => p.id !== 'prof_gjay' && p.name !== 'Gjay');
      if (Array.isArray(realProfiles) && realProfiles.length > 0) {
        const validActive = realProfiles.find(p => p.id === v3ActiveId) ? (v3ActiveId as string) : realProfiles[0].id;
        // Migration: ensure projection fields exist safely and migrate existing predicted grades to course.grade with isExpected = true
        const semKeys: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
        const migrated = realProfiles.map(p => {
          const courseProjections = p.courseProjections || {};
          const semesters = { ...p.semesters };

          semKeys.forEach(sk => {
            if (Array.isArray(semesters[sk])) {
              semesters[sk] = semesters[sk].map(course => {
                const projKey = `${sk}:${course.code}`;
                const proj = courseProjections[projKey];
                // If course has no confirmed grade, but has a predicted or target grade, safely migrate it to isExpected
                if (!course.grade && proj && (proj.predictedGrade || proj.targetGrade)) {
                  return {
                    ...course,
                    grade: (proj.predictedGrade || proj.targetGrade) as Grade,
                    isExpected: true
                  };
                }
                const isConf = Boolean(course.grade && !course.isExpected && GRADING_SCALE[course.grade]);
                const confirmedGrade = isConf ? course.grade : course.confirmedGrade;
                return {
                  ...course,
                  confirmedGrade,
                  isExpected: !!course.isExpected
                };
              });
            }
          });

          return {
            ...p,
            semesters,
            courseProjections,
            academicStatusBySem: p.academicStatusBySem || {},
            resultStatusBySem: p.resultStatusBySem || {}
          };
        });
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

export interface ProfileModalState {
  isOpen: boolean;
  mode: 'onboarding' | 'create' | 'edit';
  profileId?: string;
}

interface GradeStoreState {
  profiles: StudentProfile[];
  activeProfileId: string;
  activeTab: NavView;
  isSidebarExpanded: boolean;
  isMobileDrawerOpen: boolean;
  showOnboarding: boolean;
  profileModalState: ProfileModalState;
  selectedSemesterForCalculator: SemesterKey | 'ALL';
  searchQuery: string;

  // Actions
  setActiveTab: (tab: NavView) => void;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setMobileDrawerOpen: (open: boolean) => void;
  setShowOnboarding: (show: boolean) => void;
  openProfileModal: (mode: 'onboarding' | 'create' | 'edit', profileId?: string) => void;
  closeProfileModal: () => void;
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
  setCourseGrade: (semKey: SemesterKey, courseCode: string, grade: Grade, isExpected?: boolean) => void;
  setCourseGradeAndStatus: (semKey: SemesterKey, courseCode: string, grade: Grade, isExpected: boolean) => void;
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
  markUnresolvedAsProjected: (semKey: SemesterKey) => void;
  clearSemesterProjections: (semKey: SemesterKey) => void;
  applyTargetMixPlan: (allocations: Array<{ semKey: SemesterKey; courseCode: string; grade: Grade }>) => void;
  clearAppliedTargetMix: () => void;

  // Data Import / Export / Reset
  exportProfilesJson: () => string;
  importProfilesJson: (jsonStr: string) => boolean;
  resetToFactoryDefaults: () => void;
  saveCurrentState: () => boolean;

  // Smart Academic Projection Management
  setCourseExpectedGrade: (semKey: SemesterKey, courseCode: string, grade: Grade) => void;
  setCoursePredictedGrade: (semKey: SemesterKey, courseCode: string, grade: Grade) => void;
  setCourseTargetGrade: (semKey: SemesterKey, courseCode: string, grade: Grade) => void;
  setCourseExamStatus: (semKey: SemesterKey, courseCode: string, status: 'upcoming' | 'in_progress' | 'completed') => void;
  setCourseResultPending: (semKey: SemesterKey, courseCode: string, isPending: boolean) => void;
  setAcademicSemesterStatus: (semKey: SemesterKey, status: AcademicSemesterStatus) => void;
  setSemesterResultStatus: (semKey: SemesterKey, status: SemesterResultStatus) => void;
  setProjectionQuickAssumptions: (assumptions: { remainingPrevAvgGpa: number; currentSemAvgGpa: number } | undefined) => void;
  setProjectionTargetCgpa: (target: number) => void;
  resetQuickAssumptions: () => void;
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
  // Helper to persist current state with strict failure detection
  const persist = (profiles: StudentProfile[], activeId: string): boolean => {
    try {
      if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
        return false;
      }
      localStorage.setItem(STORAGE_KEY_PROFILES_V3, JSON.stringify(profiles));
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID_V3, activeId);
      return true;
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
      return false;
    }
  };

  return {
    profiles: initialHydration.profiles,
    activeProfileId: initialHydration.activeId,
    activeTab: 'calculator',
    isSidebarExpanded: true,
    isMobileDrawerOpen: false,
    showOnboarding: !initialHydration.hasOnboarded,
    profileModalState: {
      isOpen: !initialHydration.hasOnboarded,
      mode: 'onboarding'
    },
    selectedSemesterForCalculator: '1-1',
    searchQuery: '',

    setActiveTab: (tab: NavView) => set({ activeTab: tab === 'projection' ? 'calculator' : tab, isMobileDrawerOpen: false }),
    toggleSidebar: () => set(state => ({ isSidebarExpanded: !state.isSidebarExpanded })),
    setSidebarExpanded: (expanded: boolean) => set({ isSidebarExpanded: expanded }),
    setMobileDrawerOpen: (open: boolean) => set({ isMobileDrawerOpen: open }),
    setShowOnboarding: (show: boolean) => set({ showOnboarding: show, profileModalState: { isOpen: show, mode: 'onboarding' } }),
    openProfileModal: (mode, profileId) => set({ profileModalState: { isOpen: true, mode, profileId } }),
    closeProfileModal: () => set(state => ({ profileModalState: { ...state.profileModalState, isOpen: false } })),

    completeOnboarding: () => {
      try {
        localStorage.setItem(STORAGE_KEY_ONBOARDING_DONE, 'true');
      } catch (e) { /* ignore */ }
      set({ showOnboarding: false, profileModalState: { isOpen: false, mode: 'onboarding' } });
    },

    setSelectedSemesterForCalculator: (sem) => set({ selectedSemesterForCalculator: sem }),
    setSearchQuery: (query) => set({ searchQuery: query }),

    switchProfile: (id: string) => {
      const found = get().profiles.find(p => p.id === id);
      if (found) {
        set({
          activeProfileId: id,
          selectedSemesterForCalculator: found.currentSemester || '1-1'
        });
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

      const existing = get().profiles;
      const isInitialUnconfigured = existing.length === 1 &&
        (existing[0].name === 'My Academic Profile' || existing[0].name === 'My Profile') &&
        !existing[0].registrationNumber &&
        Object.values(existing[0].semesters).every(sem => sem.every(c => !c.grade));

      const updated = isInitialUnconfigured ? [newProf] : [...existing, newProf];
      set({ profiles: updated, activeProfileId: newId, selectedSemesterForCalculator: semKey });
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

    setCourseGrade: (semKey, courseCode, grade, isExpectedParam) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;

        const semList = profile.semesters[semKey] || [];
        const targetCourse = semList.find(c => c.code === courseCode);
        const isProj = isExpectedParam !== undefined
          ? isExpectedParam
          : (targetCourse ? !!targetCourse.isExpected : false);

        const nextList = semList.map(c => {
          if (c.code === courseCode) {
            return {
              ...c,
              grade,
              isExpected: isProj
            };
          }
          return c;
        });

        // Smart Automatic Transition:
        // Update projection tracking and preserve historical predictions
        const projKey = `${semKey}:${courseCode}`;
        const existingProjections = { ...(profile.courseProjections || {}) };
        const currentProj = existingProjections[projKey];

        if (isProj) {
          if (grade && GRADING_SCALE[grade]) {
            const originalPrediction = currentProj?.historicalPrediction || currentProj?.predictedGrade || (targetCourse?.grade ? targetCourse.grade : undefined);
            existingProjections[projKey] = {
              ...(currentProj || {
                courseCode,
                semesterKey: semKey,
                examStatus: 'upcoming'
              }),
              historicalPrediction: originalPrediction || grade,
              predictedGrade: grade,
              targetGrade: grade,
              isResultPending: true,
              lastUpdated: new Date().toISOString()
            };
          } else if (currentProj) {
            // Active expected grade cleared -> remove all active projection values
            // Historical prediction remains intact for analytics
            existingProjections[projKey] = {
              ...currentProj,
              predictedGrade: undefined,
              targetGrade: undefined,
              isResultPending: true,
              lastUpdated: new Date().toISOString()
            };
          }
        } else {
          // Official confirmed grade entered: preserve original prediction in historicalPrediction
          if (grade && GRADING_SCALE[grade]) {
            const origPrediction = currentProj?.historicalPrediction || currentProj?.predictedGrade || currentProj?.targetGrade || (targetCourse?.isExpected ? targetCourse.grade : undefined);
            existingProjections[projKey] = {
              ...(currentProj || {
                courseCode,
                semesterKey: semKey,
                examStatus: 'completed'
              }),
              historicalPrediction: currentProj?.historicalPrediction || origPrediction,
              predictedGrade: undefined, // remove active projection so no conflict
              targetGrade: undefined,    // remove active projection so no conflict
              isResultPending: false,
              lastUpdated: new Date().toISOString()
            };
          } else if (!grade && currentProj) {
            existingProjections[projKey] = {
              ...currentProj,
              predictedGrade: undefined,
              targetGrade: undefined,
              isResultPending: true,
              lastUpdated: new Date().toISOString()
            };
          }
        }

        // Update result status for this semester (excluding legacy isExpected grades!)
        const gpaCourses = nextList.filter(c => !c.isNgpa);
        const confirmedCount = gpaCourses.filter(c => isCourseGradeConfirmed(c)).length;
        const newResStatus: SemesterResultStatus =
          confirmedCount === 0 ? 'none' : confirmedCount === gpaCourses.length ? 'all_received' : 'partial';

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

    setCourseGradeAndStatus: (semKey, courseCode, grade, isExpected) => {
      get().setCourseGrade(semKey, courseCode, grade, isExpected);
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
        const targetCourse = semList.find(c => c.code === courseCode);
        if (!targetCourse) return profile;

        const nextList = semList.map(c => {
          if (c.code === courseCode) {
            if (isExpected) {
              // Protecting confirmed academic grades: if already confirmed, store in confirmedGrade
              const confirmedGrade = c.confirmedGrade;
              return { ...c, isExpected: true, confirmedGrade };
            } else {
              // Unticking Proj -> convert to official confirmed grade
              const officialGrade = (c.grade && GRADING_SCALE[c.grade])
                ? c.grade
                : (c.confirmedGrade && GRADING_SCALE[c.confirmedGrade])
                ? c.confirmedGrade
                : '';
              return {
                ...c,
                grade: officialGrade as Grade,
                confirmedGrade: officialGrade ? (officialGrade as Grade) : undefined,
                isExpected: false
              };
            }
          }
          return c;
        });

        const projKey = `${semKey}:${courseCode}`;
        const existingProjections = { ...(profile.courseProjections || {}) };
        const currentProj = existingProjections[projKey];

        if (isExpected) {
          // Marked as projected
          if (targetCourse.grade && GRADING_SCALE[targetCourse.grade]) {
            existingProjections[projKey] = {
              ...(currentProj || {
                courseCode,
                semesterKey: semKey,
                examStatus: 'upcoming'
              }),
              predictedGrade: targetCourse.grade,
              targetGrade: targetCourse.grade,
              isResultPending: true,
              lastUpdated: new Date().toISOString()
            };
          }
        } else {
          // Unticked Proj -> converted to Official Confirmed!
          // Preserve original prediction in historicalPrediction before clearing active projection
          const origPrediction = currentProj?.historicalPrediction || currentProj?.predictedGrade || currentProj?.targetGrade || targetCourse.grade;
          existingProjections[projKey] = {
            ...(currentProj || {
              courseCode,
              semesterKey: semKey,
              examStatus: 'completed'
            }),
            historicalPrediction: currentProj?.historicalPrediction || origPrediction,
            predictedGrade: undefined, // remove active projection
            targetGrade: undefined,    // remove active projection
            isResultPending: false,
            lastUpdated: new Date().toISOString()
          };
        }

        // Update result status for this semester
        const gpaCourses = nextList.filter(c => !c.isNgpa);
        const confirmedCount = gpaCourses.filter(c => isCourseGradeConfirmed(c)).length;
        const newResStatus: SemesterResultStatus =
          confirmedCount === 0 ? 'none' : confirmedCount === gpaCourses.length ? 'all_received' : 'partial';

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

    markUnresolvedAsProjected: (semKey) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;

        const semList = profile.semesters[semKey] || [];
        const nextList = semList.map(c => {
          // Only mark unresolved courses as projected — NEVER overwrite confirmed grades!
          if (!isCourseGradeConfirmed(c)) {
            return { ...c, isExpected: true };
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

    clearSemesterProjections: (semKey) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;

        const semList = profile.semesters[semKey] || [];
        const existingProjections = { ...(profile.courseProjections || {}) };

        const nextList = semList.map(c => {
          // Clear only projected/hypothetical courses — preserve confirmed grades, repeats, credits!
          if (c.isExpected) {
            const projKey = `${semKey}:${c.code}`;
            if (existingProjections[projKey]) {
              existingProjections[projKey] = {
                ...existingProjections[projKey],
                predictedGrade: undefined,
                targetGrade: undefined,
                lastUpdated: new Date().toISOString()
              };
            }
            // If course had a confirmed grade, revert safely to it! Never delete confirmed grades!
            if (c.confirmedGrade && GRADING_SCALE[c.confirmedGrade]) {
              return { ...c, grade: c.confirmedGrade, isExpected: false };
            }
            return { ...c, grade: '' as Grade, isExpected: false };
          }
          return c;
        });

        const gpaCourses = nextList.filter(c => !c.isNgpa);
        const confirmedCount = gpaCourses.filter(c => isCourseGradeConfirmed(c)).length;
        const newResStatus: SemesterResultStatus =
          confirmedCount === 0 ? 'none' : confirmedCount === gpaCourses.length ? 'all_received' : 'partial';

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

    saveCurrentState: () => {
      return persist(get().profiles, get().activeProfileId);
    },

    importProfilesJson: (jsonStr) => {
      try {
        const parsed = JSON.parse(jsonStr);
        const importedProfiles = parsed.profiles || (Array.isArray(parsed) ? parsed : null);
        if (Array.isArray(importedProfiles) && importedProfiles.length > 0) {
          // Robust validation of imported profile data
          const validDegrees: Set<string> = new Set(['ARMT', 'ABM', 'GT']);
          const sanitizedProfiles: StudentProfile[] = [];

          for (const raw of importedProfiles) {
            if (!raw || typeof raw !== 'object' || !raw.id || !raw.name) continue;
            const degree: DegreeCode = validDegrees.has(raw.degree) ? raw.degree : 'ARMT';
            const semesters: Record<SemesterKey, Course[]> = {} as any;
            const semKeys: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

            semKeys.forEach(sk => {
              const courses = Array.isArray(raw.semesters?.[sk]) ? raw.semesters[sk] : [];
              semesters[sk] = courses.map((c: any) => {
                const credits = typeof c.credits === 'number' && c.credits >= 0 ? c.credits : 2;
                const rawGrade = c.grade && GRADING_SCALE[c.grade] ? c.grade : '';
                const fallbackProjGrade = raw.courseProjections?.[`${sk}:${c.code}`]?.predictedGrade || '';
                const finalGrade: Grade = rawGrade || fallbackProjGrade;
                const isExpected = c.isExpected !== undefined
                  ? !!c.isExpected
                  : Boolean(!rawGrade && fallbackProjGrade);
                const confirmedGrade = c.confirmedGrade && GRADING_SCALE[c.confirmedGrade]
                  ? c.confirmedGrade
                  : (!isExpected && rawGrade ? rawGrade : undefined);

                return {
                  code: String(c.code || 'UNKNOWN').toUpperCase(),
                  name: String(c.name || c.code || 'Course'),
                  credits,
                  dept: c.dept,
                  isNgpa: !!c.isNgpa,
                  isCompulsory: !!c.isCompulsory,
                  isSpecialization: !!c.isSpecialization,
                  grade: finalGrade,
                  isRepeat: !!c.isRepeat,
                  isExcused: !!c.isExcused,
                  isExpected,
                  confirmedGrade
                };
              });
            });

            // Validate and clamp quick assumptions
            let projectionQuickAssumptions: any = undefined;
            if (raw.projectionQuickAssumptions && typeof raw.projectionQuickAssumptions === 'object') {
              const prev = Number(raw.projectionQuickAssumptions.remainingPrevAvgGpa);
              const curr = Number(raw.projectionQuickAssumptions.currentSemAvgGpa);
              if (!isNaN(prev) && !isNaN(curr)) {
                projectionQuickAssumptions = {
                  remainingPrevAvgGpa: Math.min(4.0, Math.max(0.0, prev)),
                  currentSemAvgGpa: Math.min(4.0, Math.max(0.0, curr))
                };
              }
            }

            // Validate target CGPA
            let projectionTargetCgpa: number | undefined = undefined;
            if (typeof raw.projectionTargetCgpa === 'number' && !isNaN(raw.projectionTargetCgpa)) {
              projectionTargetCgpa = Math.min(4.0, Math.max(0.0, raw.projectionTargetCgpa));
            }

            sanitizedProfiles.push({
              ...raw,
              degree,
              semesters,
              projectionQuickAssumptions,
              projectionTargetCgpa,
              courseProjections: raw.courseProjections || {},
              academicStatusBySem: raw.academicStatusBySem || {},
              resultStatusBySem: raw.resultStatusBySem || {}
            });
          }

          if (sanitizedProfiles.length === 0) return false;

          const validActiveId = parsed.activeProfileId && sanitizedProfiles.find((p: any) => p.id === parsed.activeProfileId)
            ? parsed.activeProfileId
            : sanitizedProfiles[0].id;

          set({ profiles: sanitizedProfiles, activeProfileId: validActiveId });
          persist(sanitizedProfiles, validActiveId);
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

    setCourseExpectedGrade: (semKey, courseCode, grade) => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;
        const currentSem = profile.currentSemester || '1-1';
        const semKeys: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
        const currentIndex = semKeys.indexOf(currentSem);
        const semIndex = semKeys.indexOf(semKey);
        const isPast = semIndex < currentIndex;

        const projKey = `${semKey}:${courseCode}`;
        const existing = profile.courseProjections || {};
        const current = existing[projKey] || { courseCode, semesterKey: semKey };

        const examStatus = current.examStatus || (isPast ? 'completed' : 'upcoming');
        const isCompletedExam = isPast || examStatus === 'completed';

        let updatedEntry: CourseProjectionData;
        if (!grade) {
          updatedEntry = {
            ...current,
            predictedGrade: undefined,
            targetGrade: undefined,
            lastUpdated: new Date().toISOString()
          };
        } else if (isCompletedExam) {
          updatedEntry = {
            ...current,
            predictedGrade: grade,
            isResultPending: true,
            examStatus: 'completed',
            lastUpdated: new Date().toISOString()
          };
        } else {
          updatedEntry = {
            ...current,
            targetGrade: grade,
            predictedGrade: grade,
            isResultPending: true,
            lastUpdated: new Date().toISOString()
          };
        }

        const updatedProjections = {
          ...existing,
          [projKey]: updatedEntry
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
            predictedGrade: grade || undefined,
            targetGrade: grade ? current.targetGrade : undefined,
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
            targetGrade: grade || undefined,
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

    resetQuickAssumptions: () => {
      const activeId = get().activeProfileId;
      const updatedProfiles = get().profiles.map(profile => {
        if (profile.id !== activeId) return profile;
        return {
          ...profile,
          projectionQuickAssumptions: undefined,
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

