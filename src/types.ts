// University of Ruhuna - Faculty of Agriculture
// GradePath Academic Platform - Complete Type Definitions

export type Grade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'E' | '';

export type DegreeCode = 'ARMT' | 'ABM' | 'GT';

export type SemesterKey = '1-1' | '1-2' | '2-1' | '2-2' | '3-1' | '3-2' | '4-1' | '4-2';

export type NavView =
  | 'grades'
  | 'progress'
  | 'forecast'
  | 'settings'
  // Legacy aliases for backward compatibility
  | 'dashboard'
  | 'calculator'
  | 'transcript'
  | 'planner'
  | 'requirements'
  | 'specialization'
  | 'analytics'
  | 'simulator'
  | 'goals'
  | 'profiles'
  | 'projection';

export interface GradingScaleEntry {
  gpv: number;
  status: string;
  marks: string;
}

export interface Course {
  code: string;
  name: string;
  credits: number;
  dept?: string;
  isNgpa?: boolean;
  isCompulsory?: boolean;
  isSpecialization?: boolean;
  grade?: Grade;
  isExpected?: boolean;
  isRepeat?: boolean;
  isExcused?: boolean;
  notes?: string;
}

export interface SemesterStats {
  semesterKey: SemesterKey;
  gpaCreditsAttempted: number;
  gpaCreditsEarned: number;
  weightedPoints: number;
  sgpa: number;
  sgpaExact: number;
  realCreditsAttempted: number;
  realCreditsEarned: number;
  realWeightedPoints: number;
  realSgpa: number;
  realSgpaExact: number;
  expectedCoursesCount: number;
  hasExpected: boolean;
  ngpaPassedCount: number;
  ngpaTotalCount: number;
  hasIncomplete: boolean;
  allAboveB: boolean;
  hasRepeat: boolean;
}

export interface DeansHonorYear {
  year: number;
  annualGpa: number;
  status: string;
  eligible: boolean;
  reason: string;
}

export interface SpecializationEligibility {
  evaluated: boolean;
  gpaMet: boolean;
  electiveRatioMet: boolean;
  gpa31: number;
  electiveDeptCredits: number;
  totalYear3ElectiveCredits: number;
  ratio: number;
  statusText: string;
  chosenDept: string;
}

export interface OverallStats {
  totalGpaCreditsAttempted: number;
  totalGpaCreditsEarned: number;
  totalWeightedPoints: number;
  totalCompulsoryEarned: number;
  totalElectiveEarned: number;
  totalRequiredCredits: number;
  minElectiveCredits: number;
  minCompulsoryCredits: number;
  cgpa: number;
  cgpaExact: number;
  classStanding: string;
  classBadgeColor: string;
  realCreditsAttempted: number;
  realCreditsEarned: number;
  realWeightedPoints: number;
  realCgpa: number;
  realCgpaExact: number;
  realClassStanding: string;
  realClassBadgeColor: string;
  hasExpectedCourses: boolean;
  totalExpectedCoursesCount: number;
  deltaCgpa: number;
  ngpaAllPassed: boolean;
  unredeemedFailCount: number;
  semStats: Record<SemesterKey, SemesterStats>;
  deansHonors: Record<number, DeansHonorYear>;
  specEligibility: SpecializationEligibility;
}

export interface ConcreteGradeCombination {
  summary: string;
  gradesBreakdown: Record<string, number>;
  achievedGpa: number;
  difficulty: 'Achievable' | 'Moderate' | 'Demanding' | 'Very High';
}

export interface UserPerformanceProfile {
  historicalGpa: number;
  totalGradedCourses: number;
  totalGradedCredits: number;
  gradeDistribution: Partial<Record<Grade, number>>;
  topGrades: Array<{ grade: Grade; count: number; percentage: number }>;
  usualGrade: Grade;
  usualGradeBand: string;
  deltaToTarget: number;
  feasibilityRating: 'Secured' | 'Comfortable' | 'On Track' | 'Moderate Stretch' | 'High Intensity' | 'Extreme Challenge';
  feasibilityDescription: string;
  hasHistoricalData: boolean;
}

export interface RemainingCourseTarget {
  code: string;
  name: string;
  credits: number;
  dept: string;
  semester: SemesterKey;
  isCompulsory: boolean;
  recommendedGrade: Grade;
  recommendedGpv: number;
  tier: 'capstone' | 'core-major' | 'standard' | 'minor'; // 6cr, 3cr, 2cr, 1cr
}

export interface CreditTierSummary {
  tierName: string;
  creditWeight: number;
  courseCount: number;
  totalCredits: number;
  recommendedGrade: Grade;
  gpv: number;
  role: string;
}

export interface SemesterRoadmapItem {
  semester: SemesterKey;
  credits: number;
  targetSgpa: number;
  courseCount: number;
  keyCourses: string[];
}

export interface ComprehensiveGradeStrategy {
  id: string;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  difficulty: 'Achievable' | 'Moderate' | 'Demanding' | 'Very High';
  achievedCgpa: number;
  achievedAverageGpv: number;
  tiers: CreditTierSummary[];
  semesterRoadmap: SemesterRoadmapItem[];
  gradesBreakdown: Partial<Record<Grade, { count: number; credits: number }>>;
  courseAllocations: RemainingCourseTarget[];
}

export interface TargetGpaResult {
  possible: boolean;
  requiredAverageGpa?: number;
  remainingCredits?: number;
  remainingCoursesCount?: number;
  suggestion?: string;
  message: string;
  userProfile?: UserPerformanceProfile;
  strategies?: ComprehensiveGradeStrategy[];
  combinations?: ConcreteGradeCombination[];
  remainingCoursesList?: RemainingCourseTarget[];
}

export interface RepeatImpactResult {
  courseCode: string;
  courseName: string;
  credits: number;
  semester: SemesterKey;
  oldGrade: Grade;
  oldGpv: number;
  targetGrade: Grade;
  newGpv: number;
  deltaGpv: number;
  deltaPoints: number;
  currentCgpa: number;
  projectedCgpa: number;
  deltaCgpa: number;
  oldStanding: string;
  newStanding: string;
  classChanged: boolean;
}

export interface WhatIfResult {
  currentCgpa: number;
  remainingCredits: number;
  simulatedSgpa: number;
  projectedCgpa: number;
  projectedStanding: string;
  standingColor: string;
  deltaCgpa: number;
}

export interface DegreeAuditItem {
  title: string;
  requirement: string;
  current: string;
  passed: boolean;
}

export interface DegreeAuditResult {
  allPassed: boolean;
  items: DegreeAuditItem[];
  degreeCode: string;
  degreeName: string;
}

export interface RegulationRiskAlert {
  level: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  affectedCourses?: string[];
}

export interface StudentProfile {
  id: string;
  name: string;
  registrationNumber?: string;
  indexNumber?: string;
  degree: DegreeCode;
  batch?: string;
  currentAcademicYear?: number;
  currentSemester: SemesterKey;
  specializationDept: string;
  specializationResearch: string;
  semesters: Record<SemesterKey, Course[]>;
  orientationCourses: Course[];
  createdAt: string;
  updatedAt: string;
  // Academic Projection State
  academicStatusBySem?: Partial<Record<SemesterKey, AcademicSemesterStatus>>;
  resultStatusBySem?: Partial<Record<SemesterKey, SemesterResultStatus>>;
  courseProjections?: Record<string, CourseProjectionData>;
  projectionQuickAssumptions?: {
    remainingPrevAvgGpa: number;
    currentSemAvgGpa: number;
  };
  projectionTargetCgpa?: number;
}

// ========================================================
// Academic Projection Types (Smart Multi-Semester Forecasting)
// ========================================================

export type AcademicSemesterStatus =
  | 'not_started'
  | 'in_progress'
  | 'exams_approaching'
  | 'exams_in_progress'
  | 'exams_completed';

export type SemesterResultStatus =
  | 'none'
  | 'partial'
  | 'all_received';

export interface CourseProjectionData {
  courseCode: string;
  semesterKey: SemesterKey;
  predictedGrade?: Grade;
  targetGrade?: Grade;
  isResultPending?: boolean;
  examStatus?: 'upcoming' | 'in_progress' | 'completed';
  historicalPrediction?: Grade;
  lastUpdated?: string;
}

export interface SemesterProjectionSummary {
  semesterKey: SemesterKey;
  academicStatus: AcademicSemesterStatus;
  resultStatus: SemesterResultStatus;
  totalCourses: number;
  // GPA Course counts & credits
  gpaCoursesTotal: number;
  gpaCoursesConfirmed: number;
  gpaCoursesPending: number;
  totalGpaCredits: number;
  confirmedGpaCredits: number;
  predictedGpaCredits: number;
  // Non-GPA Course counts
  ngpaCoursesTotal: number;
  ngpaCoursesConfirmed: number;
  ngpaCoursesPending: number;
  // SGPAs
  actualSgpa: number;
  projectedSgpa: number;
  isComplete: boolean;
  // Backward compatibility aliases
  actualResultsCount: number;
  pendingResultsCount: number;
}

export interface CourseImpactAnalysis {
  courseCode: string;
  courseName: string;
  credits: number;
  semesterKey: SemesterKey;
  currentGrade: Grade;
  currentGpv: number;
  targetGrade: Grade;
  targetGpv: number;
  gpvDifference: number;
  cgpaGain: number; // Scope-specific CGPA gain (after current semester)
  sgpaGain?: number; // Current semester SGPA gain (if in current semester)
  scopeCgpaGain?: number; // Gain after current semester
  gradCgpaGain?: number; // Graduation CGPA gain
  impactScore: number; // credits * gpvDifference
  isCompulsory: boolean;
  advice: string;
}

export type TargetScope = 'after_pending' | 'after_current' | 'at_graduation';

export interface TargetCgpaCalculationResult {
  possible: boolean;
  requiredAverage: number;
  neededGradePoints: number;
  remainingCredits: number;
  totalScopeCredits: number;
  confirmedCreditsInScope: number;
  confirmedPointsInScope: number;
  maxAchievableCgpa: number;
  scope: TargetScope;
  isRepeatCapRestricted: boolean;
  explanation: string;
}

export interface PredictionAccuracyEntry {
  courseCode: string;
  courseName: string;
  semesterKey: SemesterKey;
  predictedGrade: Grade;
  predictedGpv: number;
  actualGrade: Grade;
  actualGpv: number;
  deltaGpv: number;
  isExactMatch: boolean;
}

export interface PredictionAccuracyReport {
  entries: PredictionAccuracyEntry[];
  totalCompared: number;
  exactMatchesCount: number;
  accuracyPercentage: number;
  averageErrorGpv: number;
  netGpvBias: number; // positive = overpredicted, negative = underpredicted
}

export interface AcademicProjectionResult {
  actualCgpa: number;
  actualGpaCredits: number;
  scopeActualCgpa?: number;
  scopeActualCredits?: number;
  scopeTotalGpaCredits?: number;
  projectedCgpaPending: number;
  pendingResultsCount: number;
  pendingGpaCredits: number;
  prevConfirmedGpaCredits?: number;
  prevUnresolvedGpaCredits?: number;
  prevPredictedGpaCredits?: number;
  currentSemester: SemesterKey;
  currentSemActualSgpa: number;
  currentSemProjectedSgpa: number;
  currentSemTotalCredits: number;
  currentSemConfirmedCredits?: number;
  currentSemUnresolvedCredits?: number;
  currentSemGradedCredits: number;
  combinedProjectedCgpa: number;
  combinedTotalCredits: number;
  deltaCombined: number;
  projectionCoveragePercent: number;
  isCurrentSemComplete: boolean;
  isCombinedComplete?: boolean;
  isExpectedIncomplete?: boolean;
  unresolvedCoursesWithoutPredictionCount?: number;
  scenarios: {
    actualOnly: number;
    expected: number;
    bestCase: number;
    worstCase: number;
    isExpectedIncomplete?: boolean;
  };
  semesterSummaries: Record<SemesterKey, SemesterProjectionSummary>;
  courseImpacts: CourseImpactAnalysis[];
  accuracyReport: PredictionAccuracyReport;
}
