// University of Ruhuna - Faculty of Agriculture
// Smart Academic Projection & Multi-Semester Forecasting Calculation Engine
// Unified, Full-Precision, Repeat-Cap Aware, and Scope-Isolated

import {
  Grade,
  SemesterKey,
  Course,
  StudentProfile,
  AcademicSemesterStatus,
  SemesterResultStatus,
  CourseProjectionData,
  SemesterProjectionSummary,
  AcademicProjectionResult,
  CourseImpactAnalysis,
  PredictionAccuracyEntry,
  PredictionAccuracyReport,
  TargetScope,
  TargetCgpaCalculationResult
} from '../types';

import { GRADING_SCALE, DEGREE_INFO } from '../database';

export const ALL_SEMESTER_KEYS: SemesterKey[] = [
  '1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'
];

/**
 * Checks whether a course has an officially confirmed academic result
 * (Must have a valid grade AND NOT have the legacy isExpected flag)
 */
export function isCourseGradeConfirmed(course: Course): boolean {
  return Boolean(course.grade && !course.isExpected && GRADING_SCALE[course.grade]);
}

/**
 * Calculates effective GPV taking Repeat Capping (Grade C 2.0) into account
 */
export function calculateEffectiveGpvForGrade(
  grade: Grade | undefined,
  isRepeat?: boolean,
  isExcused?: boolean
): number | null {
  if (!grade || !GRADING_SCALE[grade]) return null;
  let gpv = GRADING_SCALE[grade].gpv;
  if (isRepeat && !isExcused && gpv > 2.0) {
    gpv = 2.0;
  }
  return gpv;
}

/**
 * Determine default semester academic status based on current semester position
 */
export function getDefaultSemesterAcademicStatus(
  semKey: SemesterKey,
  currentSemester: SemesterKey
): AcademicSemesterStatus {
  const currentIndex = ALL_SEMESTER_KEYS.indexOf(currentSemester);
  const semIndex = ALL_SEMESTER_KEYS.indexOf(semKey);

  if (semIndex < currentIndex) {
    return 'exams_completed';
  } else if (semIndex === currentIndex) {
    return 'in_progress';
  } else {
    return 'not_started';
  }
}

/**
 * Determine default semester result status based on whether confirmed grades exist
 * Accurately isolates GPA courses from Non-GPA courses
 */
export function calculateSemesterResultStatus(
  courses: Course[],
  academicStatus?: AcademicSemesterStatus
): SemesterResultStatus {
  if (academicStatus === 'not_started') return 'none';

  const gpaCourses = (courses || []).filter(c => !c.isNgpa);
  if (gpaCourses.length === 0) return 'none';

  const confirmedCount = gpaCourses.filter(isCourseGradeConfirmed).length;
  if (confirmedCount === 0) return 'none';
  if (confirmedCount === gpaCourses.length) return 'all_received';
  return 'partial';
}

/**
 * Main Projection Calculation Engine
 * - Full internal precision (no premature rounding)
 * - Strict historical scope isolation (future semesters never leak into past projections)
 * - Repeat capping across quick assumptions, best-case, and target feasibility
 * - Distinct GPA and Non-GPA course tracking
 */
export function calculateAcademicProjections(
  profile: StudentProfile,
  customAssumptions?: {
    remainingPrevAvgGpa?: number;
    currentSemAvgGpa?: number;
  }
): AcademicProjectionResult {
  const currentSem = profile.currentSemester || '1-1';
  const currentIndex = ALL_SEMESTER_KEYS.indexOf(currentSem);

  const academicStatusMap = profile.academicStatusBySem || {};
  const resultStatusMap = profile.resultStatusBySem || {};
  const courseProjections = profile.courseProjections || {};
  const degInfo = DEGREE_INFO[profile.degree] || DEGREE_INFO.ARMT;
  const degreeTotalMinGpaCredits = degInfo.totalMinGpaCredits || 126;

  // Global Confirmed Trackers (across all semesters)
  let globalActualPoints = 0;
  let globalActualCredits = 0;

  // Scope Trackers (semesters up to and including current: idx <= currentIndex)
  let scopeActualPoints = 0;
  let scopeActualCredits = 0;
  let scopeTotalGpaCredits = 0;

  // Previous Semesters Trackers (strictly idx < currentIndex)
  let prevConfirmedPoints = 0;
  let prevConfirmedGpaCredits = 0;
  let prevUnresolvedGpaCredits = 0;
  let prevPredictedGpaCredits = 0;
  let pendingResultsCount = 0;
  let pendingProjPoints = 0;
  let pendingProjCredits = 0;

  // Current Semester Trackers (idx === currentIndex)
  let currentSemActualPoints = 0;
  let currentSemActualCredits = 0;
  let currentSemTotalGpaCredits = 0;
  let currentSemUnresolvedCredits = 0;
  let currentSemProjectedPoints = 0;
  let currentSemProjectedCredits = 0;

  // Combined Projection Trackers (through current semester: idx <= currentIndex)
  let combinedPoints = 0;
  let combinedCredits = 0;
  let unresolvedCoursesWithoutPredictionCount = 0;

  // Scenarios Trackers (bounded strictly to scope: idx <= currentIndex)
  let bestCasePoints = 0;
  let worstCasePoints = 0;

  const semesterSummaries: Record<SemesterKey, SemesterProjectionSummary> = {} as any;
  const accuracyEntries: PredictionAccuracyEntry[] = [];
  const courseImpacts: CourseImpactAnalysis[] = [];

  // Pass 1: Chronological Semester Analysis
  for (let idx = 0; idx < ALL_SEMESTER_KEYS.length; idx++) {
    const semKey = ALL_SEMESTER_KEYS[idx];
    const courses = profile.semesters[semKey] || [];
    const isPast = idx < currentIndex;
    const isCurrent = idx === currentIndex;
    const isFuture = idx > currentIndex;

    const academicStatus =
      academicStatusMap[semKey] || getDefaultSemesterAcademicStatus(semKey, currentSem);
    const computedResultStatus = calculateSemesterResultStatus(courses, academicStatus);
    const resultStatus = resultStatusMap[semKey] || computedResultStatus;

    // Course counts & credit partitions
    const gpaCourses = courses.filter(c => !c.isNgpa);
    const ngpaCourses = courses.filter(c => !!c.isNgpa);

    const semTotalGpaCredits = gpaCourses.reduce((sum, c) => sum + (c.credits || 0), 0);

    let semActualPoints = 0;
    let semActualCredits = 0;
    let semProjectedPoints = 0;
    let semProjectedCredits = 0;
    let semConfirmedGpaCoursesCount = 0;
    let semPendingGpaCoursesCount = 0;

    for (const course of gpaCourses) {
      const cr = course.credits || 0;
      const projKey = `${semKey}:${course.code}`;
      const projData: CourseProjectionData | undefined = courseProjections[projKey];
      const isConfirmed = isCourseGradeConfirmed(course);

      let actualGpv: number | null = null;
      if (isConfirmed) {
        actualGpv = calculateEffectiveGpvForGrade(course.grade, course.isRepeat, course.isExcused);
      }

      const predictedGpv = calculateEffectiveGpvForGrade(
        projData?.predictedGrade,
        course.isRepeat,
        course.isExcused
      );
      const targetGpv = calculateEffectiveGpvForGrade(
        projData?.targetGrade,
        course.isRepeat,
        course.isExcused
      );

      // Track prediction accuracy if confirmed grade and historical prediction exist
      const predToCompare = projData?.historicalPrediction || projData?.predictedGrade;
      if (isConfirmed && predToCompare && actualGpv !== null) {
        const predCompGpv =
          calculateEffectiveGpvForGrade(predToCompare, course.isRepeat, course.isExcused) ?? 0;
        accuracyEntries.push({
          courseCode: course.code,
          courseName: course.name,
          semesterKey: semKey,
          predictedGrade: predToCompare,
          predictedGpv: predCompGpv,
          actualGrade: course.grade || '',
          actualGpv: actualGpv,
          deltaGpv: Number((actualGpv - predCompGpv).toFixed(2)),
          isExactMatch: course.grade === predToCompare
        });
      }

      // 1. Process Confirmed Grades
      if (isConfirmed && actualGpv !== null) {
        semConfirmedGpaCoursesCount++;
        semActualPoints += actualGpv * cr;
        semActualCredits += cr;
        globalActualPoints += actualGpv * cr;
        globalActualCredits += cr;

        if (isPast || isCurrent) {
          scopeActualPoints += actualGpv * cr;
          scopeActualCredits += cr;
          bestCasePoints += actualGpv * cr;
          worstCasePoints += actualGpv * cr;
        }

        if (isPast) {
          prevConfirmedPoints += actualGpv * cr;
          prevConfirmedGpaCredits += cr;
        }
      } else {
        // 2. Process Unresolved Courses
        semPendingGpaCoursesCount++;

        if (isPast) {
          pendingResultsCount++;
          prevUnresolvedGpaCredits += cr;

          // Best Case for unresolved: 4.0 (or capped at 2.0 if repeat and unexcused)
          const bestGpv = course.isRepeat && !course.isExcused ? 2.0 : 4.0;
          bestCasePoints += bestGpv * cr;
          // Worst Case for unresolved: Grade E (0.0 GPV)
          worstCasePoints += 0.0 * cr;
        } else if (isCurrent) {
          currentSemUnresolvedCredits += cr;

          const bestGpv = course.isRepeat && !course.isExcused ? 2.0 : 4.0;
          bestCasePoints += bestGpv * cr;
          worstCasePoints += 0.0 * cr;
        }
      }

      // 3. Projected Grade Resolution following strict authoritative hierarchy:
      // 1. Confirmed actual grade (validated against grading scale, isExpected = false)
      // 2. Active expected grade on course (authoritative single source: course.isExpected && course.grade)
      // 3. Active quick assumption (with repeat capping enforced)
      // 4. Unspecified (missing, null) - active predictions never conflict, leak, or use historical archives
      let effectiveProjectionGpv: number | null = null;
      let effectiveGrade: Grade = '';

      if (isConfirmed && actualGpv !== null) {
        effectiveProjectionGpv = actualGpv;
        effectiveGrade = course.grade || '';
      } else if (course.isExpected && course.grade && GRADING_SCALE[course.grade]) {
        // Authoritative single source of truth for active projected grades
        effectiveProjectionGpv = calculateEffectiveGpvForGrade(
          course.grade,
          course.isRepeat,
          course.isExcused
        );
        effectiveGrade = course.grade;
      } else if (!course.grade && predictedGpv !== null) {
        // Backward-compatible fallback for unhydrated legacy profiles with active predictedGrade
        effectiveProjectionGpv = predictedGpv;
        effectiveGrade = projData?.predictedGrade || '';
      } else if (isPast && customAssumptions?.remainingPrevAvgGpa !== undefined) {
        let assumedGpv = customAssumptions.remainingPrevAvgGpa;
        // Strict repeat cap enforcement on quick assumptions!
        if (course.isRepeat && !course.isExcused && assumedGpv > 2.0) {
          assumedGpv = 2.0;
        }
        effectiveProjectionGpv = assumedGpv;
      } else if (isCurrent && customAssumptions?.currentSemAvgGpa !== undefined) {
        let assumedGpv = customAssumptions.currentSemAvgGpa;
        // Strict repeat cap enforcement on quick assumptions!
        if (course.isRepeat && !course.isExcused && assumedGpv > 2.0) {
          assumedGpv = 2.0;
        }
        effectiveProjectionGpv = assumedGpv;
      }

      if (effectiveProjectionGpv !== null) {
        semProjectedPoints += effectiveProjectionGpv * cr;
        semProjectedCredits += cr;
        if (isPast && !isConfirmed) {
          prevPredictedGpaCredits += cr;
        }
      } else {
        if (isPast || isCurrent) {
          unresolvedCoursesWithoutPredictionCount++;
        }
      }

      // 4. Course GPA Impact Analysis (for unresolved courses in scope)
      if ((isCurrent || (isPast && !isConfirmed)) && !isConfirmed) {
        const curGpv = effectiveProjectionGpv ?? 3.0; // Default benchmark Grade B (3.0) if unset
        const isRepeatCapped = !!course.isRepeat && !course.isExcused;
        const higherTargetGpv = isRepeatCapped ? 2.0 : 4.0;
        const higherTargetGrade: Grade = isRepeatCapped ? 'C' : 'A';
        const gpvDiff = Math.max(0, higherTargetGpv - curGpv);
        const impactScore = cr * gpvDiff;

        // Gain denominators:
        // SGPA gain: current semester GPA credits
        // Scope CGPA gain: total GPA credits through current semester
        // Graduation CGPA gain: degree minimum GPA credits
        const sgpaGain =
          isCurrent && semTotalGpaCredits > 0
            ? Number(((cr * gpvDiff) / semTotalGpaCredits).toFixed(2))
            : undefined;

        courseImpacts.push({
          courseCode: course.code,
          courseName: course.name,
          credits: cr,
          semesterKey: semKey,
          currentGrade: effectiveGrade || (curGpv >= 3.0 ? 'B' : 'C'),
          currentGpv: curGpv,
          targetGrade: higherTargetGrade,
          targetGpv: higherTargetGpv,
          gpvDifference: Number(gpvDiff.toFixed(2)),
          cgpaGain: 0, // Assigned after scopeTotalGpaCredits is finalized
          sgpaGain,
          impactScore: Number(impactScore.toFixed(2)),
          isCompulsory: !!course.isCompulsory,
          advice: isRepeatCapped
            ? `Repeat course: Academic regulations cap repeat grade points at 2.00 (Grade C). Maximum achievable gain is capped.`
            : cr >= 3
            ? `High Credit Weight (${cr} Cr): Raising this course yields the highest leverage on your cumulative GPA.`
            : `Standard Credit (${cr} Cr): Contributing to your cumulative progress.`
        });
      }
    }

    // Accumulate into Scope Buckets
    if (isPast) {
      pendingProjPoints += semProjectedPoints;
      pendingProjCredits += semProjectedCredits;
      combinedPoints += semProjectedPoints;
      combinedCredits += semProjectedCredits;
      scopeTotalGpaCredits += semTotalGpaCredits;
    } else if (isCurrent) {
      currentSemActualPoints = semActualPoints;
      currentSemActualCredits = semActualCredits;
      currentSemTotalGpaCredits = semTotalGpaCredits;
      currentSemProjectedPoints = semProjectedPoints;
      currentSemProjectedCredits = semProjectedCredits;

      combinedPoints += semProjectedPoints;
      combinedCredits += semProjectedCredits;
      scopeTotalGpaCredits += semTotalGpaCredits;
    }

    const actualSgpa = semActualCredits > 0 ? semActualPoints / semActualCredits : 0;
    const projectedSgpa = semProjectedCredits > 0 ? semProjectedPoints / semProjectedCredits : 0;

    // Non-GPA course tracking
    const ngpaConfirmedCount = ngpaCourses.filter(isCourseGradeConfirmed).length;
    const ngpaPendingCount = ngpaCourses.length - ngpaConfirmedCount;

    semesterSummaries[semKey] = {
      semesterKey: semKey,
      academicStatus,
      resultStatus,
      totalCourses: courses.length,
      gpaCoursesTotal: gpaCourses.length,
      gpaCoursesConfirmed: semConfirmedGpaCoursesCount,
      gpaCoursesPending: semPendingGpaCoursesCount,
      totalGpaCredits: semTotalGpaCredits,
      confirmedGpaCredits: semActualCredits,
      predictedGpaCredits: Math.max(0, semProjectedCredits - semActualCredits),
      ngpaCoursesTotal: ngpaCourses.length,
      ngpaCoursesConfirmed: ngpaConfirmedCount,
      ngpaCoursesPending: ngpaPendingCount,
      actualSgpa: Number(actualSgpa.toFixed(2)),
      projectedSgpa: Number(projectedSgpa.toFixed(2)),
      isComplete: semProjectedCredits >= semTotalGpaCredits && semTotalGpaCredits > 0,
      actualResultsCount: semConfirmedGpaCoursesCount,
      pendingResultsCount: semPendingGpaCoursesCount
    };
  }

  // Finalize Course Impact gains using exact scopeTotalGpaCredits and degree credits
  for (const impact of courseImpacts) {
    const gpvDiff = impact.gpvDifference;
    const cr = impact.credits;
    const scopeGain =
      scopeTotalGpaCredits > 0 ? Number(((cr * gpvDiff) / scopeTotalGpaCredits).toFixed(3)) : 0;
    const gradGain =
      degreeTotalMinGpaCredits > 0
        ? Number(((cr * gpvDiff) / degreeTotalMinGpaCredits).toFixed(3))
        : 0;

    impact.cgpaGain = scopeGain;
    impact.scopeCgpaGain = scopeGain;
    impact.gradCgpaGain = gradGain;
  }
  courseImpacts.sort((a, b) => b.impactScore - a.impactScore);

  // Final Calculations & Precision
  const actualCgpa = globalActualCredits > 0 ? globalActualPoints / globalActualCredits : 0;
  const scopeActualCgpa = scopeActualCredits > 0 ? scopeActualPoints / scopeActualCredits : 0;

  // Historical projection through completed previous semesters (strictly idx < currentIndex)
  let projectedCgpaPending: number;
  if (pendingProjCredits > 0) {
    projectedCgpaPending = pendingProjPoints / pendingProjCredits;
  } else if (prevConfirmedGpaCredits > 0) {
    projectedCgpaPending = prevConfirmedPoints / prevConfirmedGpaCredits;
  } else {
    // Strictly zero when no historical credits exist; never leak grades from current/future semesters!
    projectedCgpaPending = 0;
  }

  const currentSemActualSgpa =
    currentSemActualCredits > 0 ? currentSemActualPoints / currentSemActualCredits : 0;
  const currentSemProjectedSgpa =
    currentSemProjectedCredits > 0 ? currentSemProjectedPoints / currentSemProjectedCredits : 0;

  // Combined projection through current semester (idx <= currentIndex)
  let combinedProjectedCgpa: number;
  if (combinedCredits > 0) {
    combinedProjectedCgpa = combinedPoints / combinedCredits;
  } else if (scopeActualCredits > 0) {
    combinedProjectedCgpa = scopeActualPoints / scopeActualCredits;
  } else {
    // Strictly zero when no scope credits exist; never leak grades from future semesters!
    combinedProjectedCgpa = 0;
  }

  // Scenarios: strictly comparable within the same scope (scopeTotalGpaCredits)
  const bestCaseCgpa =
    scopeTotalGpaCredits > 0 ? bestCasePoints / scopeTotalGpaCredits : 0;
  const worstCaseCgpa =
    scopeTotalGpaCredits > 0 ? worstCasePoints / scopeTotalGpaCredits : 0;

  const deltaCombined = Number(((combinedCredits > 0 ? combinedProjectedCgpa : 0) - (globalActualCredits > 0 ? actualCgpa : 0)).toFixed(2));
  const projectionCoveragePercent =
    scopeTotalGpaCredits > 0
      ? Math.min(100, Math.round((combinedCredits / scopeTotalGpaCredits) * 100))
      : 100;

  const isCurrentSemComplete =
    currentSemProjectedCredits >= currentSemTotalGpaCredits && currentSemTotalGpaCredits > 0;
  const isCombinedComplete =
    combinedCredits >= scopeTotalGpaCredits && scopeTotalGpaCredits > 0;
  const isExpectedIncomplete = !isCombinedComplete;

  // Accuracy metrics
  const totalCompared = accuracyEntries.length;
  const exactMatchesCount = accuracyEntries.filter(e => e.isExactMatch).length;
  const accuracyPercentage =
    totalCompared > 0 ? Math.round((exactMatchesCount / totalCompared) * 100) : 0;
  const totalError = accuracyEntries.reduce((sum, e) => sum + Math.abs(e.deltaGpv), 0);
  const averageErrorGpv =
    totalCompared > 0 ? Number((totalError / totalCompared).toFixed(2)) : 0;
  const netGpvBias =
    totalCompared > 0
      ? Number((accuracyEntries.reduce((sum, e) => sum + e.deltaGpv, 0) / totalCompared).toFixed(2))
      : 0;

  return {
    actualCgpa: Number(actualCgpa.toFixed(2)),
    actualGpaCredits: globalActualCredits,
    scopeActualCgpa: Number(scopeActualCgpa.toFixed(2)),
    scopeActualCredits,
    scopeTotalGpaCredits,
    projectedCgpaPending: Number(projectedCgpaPending.toFixed(2)),
    pendingResultsCount,
    pendingGpaCredits: Math.max(0, prevUnresolvedGpaCredits),
    prevConfirmedGpaCredits,
    prevUnresolvedGpaCredits,
    prevPredictedGpaCredits,
    currentSemester: currentSem,
    currentSemActualSgpa: Number(currentSemActualSgpa.toFixed(2)),
    currentSemProjectedSgpa: Number(currentSemProjectedSgpa.toFixed(2)),
    currentSemTotalCredits: currentSemTotalGpaCredits,
    currentSemConfirmedCredits: currentSemActualCredits,
    currentSemUnresolvedCredits,
    currentSemGradedCredits: currentSemProjectedCredits,
    combinedProjectedCgpa: Number(combinedProjectedCgpa.toFixed(2)),
    combinedTotalCredits: combinedCredits,
    deltaCombined,
    projectionCoveragePercent,
    isCurrentSemComplete,
    isCombinedComplete,
    isExpectedIncomplete,
    unresolvedCoursesWithoutPredictionCount,
    scenarios: {
      actualOnly: Number((scopeActualCredits > 0 ? scopeActualCgpa : actualCgpa).toFixed(2)),
      expected: Number(combinedProjectedCgpa.toFixed(2)),
      bestCase: Number(bestCaseCgpa.toFixed(2)),
      worstCase: Number(worstCaseCgpa.toFixed(2)),
      isExpectedIncomplete
    },
    semesterSummaries,
    courseImpacts,
    accuracyReport: {
      entries: accuracyEntries,
      totalCompared,
      exactMatchesCount,
      accuracyPercentage,
      averageErrorGpv,
      netGpvBias
    }
  };
}

/**
 * Calculates Required Average GPA to hit a target CGPA
 * Supports 3 dynamic scopes:
 * - 'after_pending': previous completed semesters with outstanding results
 * - 'after_current': through the current academic semester (DEFAULT)
 * - 'at_graduation': across the entire degree programme requirement
 *
 * Full precision, repeat-cap aware, and dynamically supports any degree programme (ARMT, ABM, GT)
 */
export function calculateTargetCgpaRequirement(
  profile: StudentProfile,
  targetCgpa: number,
  scope: TargetScope = 'after_current'
): TargetCgpaCalculationResult {
  const currentSem = profile.currentSemester || '1-1';
  const currentIndex = ALL_SEMESTER_KEYS.indexOf(currentSem);
  const degInfo = DEGREE_INFO[profile.degree] || DEGREE_INFO.ARMT;
  const degreeTotalMinGpaCredits = degInfo.totalMinGpaCredits || 126;

  let totalScopeCredits = 0;
  let confirmedCreditsInScope = 0;
  let confirmedPointsInScope = 0;
  let unresolvedCreditsInScope = 0;
  let maxAchievablePointsInScope = 0;
  let isRepeatCapRestricted = false;

  if (scope === 'after_pending') {
    // Strictly previous semesters: idx < currentIndex
    if (currentIndex === 0) {
      return {
        possible: false,
        requiredAverage: 0,
        neededGradePoints: 0,
        remainingCredits: 0,
        totalScopeCredits: 0,
        confirmedCreditsInScope: 0,
        confirmedPointsInScope: 0,
        maxAchievableCgpa: 0,
        scope,
        isRepeatCapRestricted: false,
        explanation: `Semester 1-1 has no preceding semesters. Select "After the current semester" to calculate targets for your current examinations.`
      };
    }

    for (let idx = 0; idx < currentIndex; idx++) {
      const semKey = ALL_SEMESTER_KEYS[idx];
      const gpaCourses = (profile.semesters[semKey] || []).filter(c => !c.isNgpa);

      for (const course of gpaCourses) {
        const cr = course.credits || 0;
        totalScopeCredits += cr;

        if (isCourseGradeConfirmed(course)) {
          const gpv = calculateEffectiveGpvForGrade(course.grade, course.isRepeat, course.isExcused) ?? 0;
          confirmedPointsInScope += gpv * cr;
          confirmedCreditsInScope += cr;
          maxAchievablePointsInScope += gpv * cr;
        } else {
          unresolvedCreditsInScope += cr;
          const maxGpv = course.isRepeat && !course.isExcused ? 2.0 : 4.0;
          if (maxGpv < 4.0) isRepeatCapRestricted = true;
          maxAchievablePointsInScope += maxGpv * cr;
        }
      }
    }
  } else if (scope === 'after_current') {
    // Through current semester: idx <= currentIndex
    for (let idx = 0; idx <= currentIndex; idx++) {
      const semKey = ALL_SEMESTER_KEYS[idx];
      const gpaCourses = (profile.semesters[semKey] || []).filter(c => !c.isNgpa);

      for (const course of gpaCourses) {
        const cr = course.credits || 0;
        totalScopeCredits += cr;

        if (isCourseGradeConfirmed(course)) {
          const gpv = calculateEffectiveGpvForGrade(course.grade, course.isRepeat, course.isExcused) ?? 0;
          confirmedPointsInScope += gpv * cr;
          confirmedCreditsInScope += cr;
          maxAchievablePointsInScope += gpv * cr;
        } else {
          unresolvedCreditsInScope += cr;
          const maxGpv = course.isRepeat && !course.isExcused ? 2.0 : 4.0;
          if (maxGpv < 4.0) isRepeatCapRestricted = true;
          maxAchievablePointsInScope += maxGpv * cr;
        }
      }
    }
  } else {
    // 'at_graduation': degree-wide requirement
    // Accumulate all enrolled confirmed and unresolved courses
    let totalEnrolledCredits = 0;

    for (let idx = 0; idx < ALL_SEMESTER_KEYS.length; idx++) {
      const semKey = ALL_SEMESTER_KEYS[idx];
      const gpaCourses = (profile.semesters[semKey] || []).filter(c => !c.isNgpa);

      for (const course of gpaCourses) {
        const cr = course.credits || 0;
        totalEnrolledCredits += cr;

        if (isCourseGradeConfirmed(course)) {
          const gpv = calculateEffectiveGpvForGrade(course.grade, course.isRepeat, course.isExcused) ?? 0;
          confirmedPointsInScope += gpv * cr;
          confirmedCreditsInScope += cr;
          maxAchievablePointsInScope += gpv * cr;
        } else {
          unresolvedCreditsInScope += cr;
          const maxGpv = course.isRepeat && !course.isExcused ? 2.0 : 4.0;
          if (maxGpv < 4.0) isRepeatCapRestricted = true;
          maxAchievablePointsInScope += maxGpv * cr;
        }
      }
    }

    // According to Faculty of Agriculture regulations, if a student enrols in extra electives
    // such that total enrolled GPA credits exceed the degree minimum (e.g. 130 vs 126),
    // the target and CGPA denominator must reflect ALL enrolled GPA credits!
    totalScopeCredits = Math.max(degreeTotalMinGpaCredits, totalEnrolledCredits);

    // Remaining future un-enrolled credits needed to reach degree minimum (0 if already met/exceeded)
    const unenrolledDegreeCredits = Math.max(0, degreeTotalMinGpaCredits - totalEnrolledCredits);
    unresolvedCreditsInScope += unenrolledDegreeCredits;
    maxAchievablePointsInScope += 4.0 * unenrolledDegreeCredits;
  }

  const maxAchievableCgpa =
    totalScopeCredits > 0 ? Number((maxAchievablePointsInScope / totalScopeCredits).toFixed(2)) : 0;

  // Handle case with zero remaining unresolved credits
  if (unresolvedCreditsInScope === 0) {
    const finalCgpa =
      totalScopeCredits > 0 ? confirmedPointsInScope / totalScopeCredits : 0;
    const isMet = finalCgpa >= targetCgpa;
    return {
      possible: isMet,
      requiredAverage: 0,
      neededGradePoints: 0,
      remainingCredits: 0,
      totalScopeCredits,
      confirmedCreditsInScope,
      confirmedPointsInScope,
      maxAchievableCgpa,
      scope,
      isRepeatCapRestricted,
      explanation: isMet
        ? `Target of ${targetCgpa.toFixed(2)} CGPA is already achieved with completed credits (${finalCgpa.toFixed(2)} CGPA).`
        : `All credits within this scope are already finalized at ${finalCgpa.toFixed(2)} CGPA.`
    };
  }

  // Exact formula: Required GPV = Target CGPA * Total Credits - Confirmed GPV
  const targetTotalPoints = targetCgpa * totalScopeCredits;
  const neededGradePoints = Math.max(0, targetTotalPoints - confirmedPointsInScope);
  const neededAverage = neededGradePoints / unresolvedCreditsInScope;

  // Target already secured by completed points
  if (neededAverage <= 0) {
    const scopeDesc =
      scope === 'after_pending'
        ? 'after pending previous semester results'
        : scope === 'after_current'
        ? `after Semester ${currentSem}`
        : 'at graduation';

    return {
      possible: true,
      requiredAverage: 0,
      neededGradePoints: 0,
      remainingCredits: unresolvedCreditsInScope,
      totalScopeCredits,
      confirmedCreditsInScope,
      confirmedPointsInScope,
      maxAchievableCgpa,
      scope,
      isRepeatCapRestricted,
      explanation: `Your confirmed grades in this scope already satisfy the ${targetCgpa.toFixed(2)} target! Maintaining passing grades (≥ 2.00) across remaining ${unresolvedCreditsInScope} credits secures this standing ${scopeDesc}.`
    };
  }

  // Target impossible due to repeat capping or exceeding 4.00 ceiling
  if (targetTotalPoints > maxAchievablePointsInScope || neededAverage > 4.0) {
    let reason = '';
    if (isRepeatCapRestricted && neededAverage <= 4.0) {
      reason = `Repeat course grade capping (max 2.00 / Grade C) limits your maximum achievable GPA in this scope to ${maxAchievableCgpa.toFixed(2)}.`;
    } else {
      reason = `Requires an average GPA of ${neededAverage.toFixed(2)} across remaining ${unresolvedCreditsInScope} credits, which exceeds the university 4.00 maximum (highest achievable is ${maxAchievableCgpa.toFixed(2)}).`;
    }

    return {
      possible: false,
      requiredAverage: Number(neededAverage.toFixed(2)),
      neededGradePoints: Number(neededGradePoints.toFixed(2)),
      remainingCredits: unresolvedCreditsInScope,
      totalScopeCredits,
      confirmedCreditsInScope,
      confirmedPointsInScope,
      maxAchievableCgpa,
      scope,
      isRepeatCapRestricted,
      explanation: `Mathematically unreachable: ${reason}`
    };
  }

  const scopeDesc =
    scope === 'after_pending'
      ? 'after pending previous semester results are released'
      : scope === 'after_current'
      ? `after completing Semester ${currentSem}`
      : 'to graduate with this honours class';

  return {
    possible: true,
    requiredAverage: Number(neededAverage.toFixed(2)),
    neededGradePoints: Number(neededGradePoints.toFixed(2)),
    remainingCredits: unresolvedCreditsInScope,
    totalScopeCredits,
    confirmedCreditsInScope,
    confirmedPointsInScope,
    maxAchievableCgpa,
    scope,
    isRepeatCapRestricted,
    explanation: `To achieve a CGPA of ${targetCgpa.toFixed(2)} ${scopeDesc}, you need an average GPA of ${neededAverage.toFixed(2)} across your remaining ${unresolvedCreditsInScope} unresolved credits.`
  };
}

/**
 * Backward-compatible wrapper for legacy calls
 */
export function calculateRequiredGpaForTarget(
  currentCgpa: number,
  earnedCredits: number,
  totalTargetCredits: number,
  targetCgpa: number
): {
  possible: boolean;
  requiredAverage: number;
  remainingCredits: number;
  explanation: string;
} {
  const remainingCredits = Math.max(0, totalTargetCredits - earnedCredits);
  if (remainingCredits === 0) {
    const isMet = currentCgpa >= targetCgpa;
    return {
      possible: isMet,
      requiredAverage: 0,
      remainingCredits: 0,
      explanation: isMet
        ? `Target of ${targetCgpa.toFixed(2)} is already reached with completed credits.`
        : `All credits finalized at ${currentCgpa.toFixed(2)} CGPA.`
    };
  }

  const currentPoints = currentCgpa * earnedCredits;
  const targetTotalPoints = targetCgpa * totalTargetCredits;
  const neededPoints = targetTotalPoints - currentPoints;
  const neededAverage = neededPoints / remainingCredits;

  if (neededAverage <= 0) {
    return {
      possible: true,
      requiredAverage: 0,
      remainingCredits,
      explanation: `Your current CGPA already satisfies the ${targetCgpa.toFixed(2)} threshold! Maintaining passing grades across remaining ${remainingCredits} credits secures this standing.`
    };
  }

  if (neededAverage > 4.0) {
    return {
      possible: false,
      requiredAverage: Number(neededAverage.toFixed(2)),
      remainingCredits,
      explanation: `To reach a CGPA of ${targetCgpa.toFixed(2)}, you would need an average GPA of ${neededAverage.toFixed(2)} across remaining ${remainingCredits} credits, which exceeds the university 4.00 maximum.`
    };
  }

  return {
    possible: true,
    requiredAverage: Number(neededAverage.toFixed(2)),
    remainingCredits,
    explanation: `To reach a CGPA of ${targetCgpa.toFixed(2)} after completing ${totalTargetCredits} credits, you need an average GPA of ${neededAverage.toFixed(2)} across your remaining ${remainingCredits} credits.`
  };
}

export interface SuggestedCourseGrade {
  semesterKey: SemesterKey;
  courseCode: string;
  courseName: string;
  credits: number;
  suggestedGrade: Grade;
  suggestedGpv: number;
  isRepeat: boolean;
  isExcused: boolean;
}

export interface SuggestedCombinationResult {
  possible: boolean;
  courses: SuggestedCourseGrade[];
  achievedGpa: number;
  targetCgpa: number;
  explanation: string;
}

/**
 * Generates realistic grade combinations for unresolved courses within a target scope
 * respecting course credits, grading scales, and repeat grade caps (max 2.0 / Grade C).
 */
export function generateSuggestedGradeCombination(
  profile: StudentProfile,
  targetCgpa: number,
  scope: TargetScope
): SuggestedCombinationResult {
  const targetResult = calculateTargetCgpaRequirement(profile, targetCgpa, scope);

  if (!targetResult.possible) {
    return {
      possible: false,
      courses: [],
      achievedGpa: 0,
      targetCgpa,
      explanation: targetResult.explanation
    };
  }

  const currentSem = profile.currentSemester || '1-1';
  const currentIndex = ALL_SEMESTER_KEYS.indexOf(currentSem as SemesterKey);

  const unresolvedCourses: Array<{
    semKey: SemesterKey;
    course: Course;
    maxGpv: number;
  }> = [];

  let semKeysToInclude: SemesterKey[] = [];
  if (scope === 'after_pending') {
    semKeysToInclude = ALL_SEMESTER_KEYS.slice(0, Math.max(0, currentIndex));
  } else if (scope === 'after_current') {
    semKeysToInclude = ALL_SEMESTER_KEYS.slice(0, currentIndex + 1);
  } else {
    semKeysToInclude = [...ALL_SEMESTER_KEYS];
  }

  for (const semKey of semKeysToInclude) {
    const semCourses = profile.semesters[semKey] || [];
    for (const c of semCourses) {
      if (!c.isNgpa && !isCourseGradeConfirmed(c)) {
        const maxGpv = c.isRepeat && !c.isExcused ? 2.0 : 4.0;
        unresolvedCourses.push({
          semKey,
          course: c,
          maxGpv
        });
      }
    }
  }

  if (unresolvedCourses.length === 0) {
    return {
      possible: true,
      courses: [],
      achievedGpa: targetResult.maxAchievableCgpa,
      targetCgpa,
      explanation: 'No unresolved courses in the selected target scope.'
    };
  }

  // Supported grades ordered by descending GPV
  const GRADE_SCALE_STEPS: Array<{ grade: Grade; gpv: number }> = [
    { grade: 'A', gpv: 4.0 },
    { grade: 'A-', gpv: 3.7 },
    { grade: 'B+', gpv: 3.3 },
    { grade: 'B', gpv: 3.0 },
    { grade: 'B-', gpv: 2.7 },
    { grade: 'C+', gpv: 2.3 },
    { grade: 'C', gpv: 2.0 },
    { grade: 'C-', gpv: 1.7 },
    { grade: 'D+', gpv: 1.3 },
    { grade: 'D', gpv: 1.0 },
    { grade: 'E', gpv: 0.0 }
  ];

  const reqAvg = targetResult.requiredAverage <= 0 ? 2.0 : targetResult.requiredAverage;

  // Initial assignment: step matching reqAvg without exceeding maxGpv
  let baseStepIdx = GRADE_SCALE_STEPS.findIndex(s => s.gpv <= reqAvg);
  if (baseStepIdx === -1) baseStepIdx = GRADE_SCALE_STEPS.length - 1;

  const courseStepIndices = unresolvedCourses.map(({ maxGpv }) => {
    let idx = baseStepIdx;
    while (idx < GRADE_SCALE_STEPS.length && GRADE_SCALE_STEPS[idx].gpv > maxGpv) {
      idx++;
    }
    return idx;
  });

  const calcTotalPoints = () => {
    return unresolvedCourses.reduce((sum, item, i) => {
      const gpv = GRADE_SCALE_STEPS[courseStepIndices[i]].gpv;
      return sum + (item.course.credits || 0) * gpv;
    }, 0);
  };

  const totalUnresolvedCredits = unresolvedCourses.reduce(
    (sum, item) => sum + (item.course.credits || 0),
    0
  );

  const targetUnresolvedPoints =
    targetResult.requiredAverage <= 0
      ? totalUnresolvedCredits * 2.0
      : targetResult.neededGradePoints > 0
      ? Math.min(
          targetResult.neededGradePoints,
          targetResult.maxAchievableCgpa * targetResult.totalScopeCredits -
            targetResult.confirmedPointsInScope
        )
      : totalUnresolvedCredits * reqAvg;

  let currentPoints = calcTotalPoints();

  // If points are below target, greedily step up courses (higher credits first)
  if (currentPoints < targetUnresolvedPoints) {
    const sortedOrder = unresolvedCourses
      .map((item, idx) => ({ idx, credits: item.course.credits || 0 }))
      .sort((a, b) => b.credits - a.credits)
      .map(o => o.idx);

    let progress = true;
    while (currentPoints < targetUnresolvedPoints && progress) {
      progress = false;
      for (const courseIdx of sortedOrder) {
        const item = unresolvedCourses[courseIdx];
        const currentStep = courseStepIndices[courseIdx];
        if (currentStep > 0) {
          const nextStep = currentStep - 1;
          if (GRADE_SCALE_STEPS[nextStep].gpv <= item.maxGpv) {
            courseStepIndices[courseIdx] = nextStep;
            currentPoints = calcTotalPoints();
            progress = true;
            if (currentPoints >= targetUnresolvedPoints) break;
          }
        }
      }
    }
  }

  const resultCourses: SuggestedCourseGrade[] = unresolvedCourses.map((item, i) => {
    const step = GRADE_SCALE_STEPS[courseStepIndices[i]];
    return {
      semesterKey: item.semKey,
      courseCode: item.course.code,
      courseName: item.course.name,
      credits: item.course.credits || 0,
      suggestedGrade: step.grade,
      suggestedGpv: step.gpv,
      isRepeat: !!item.course.isRepeat,
      isExcused: !!item.course.isExcused
    };
  });

  const finalAvg =
    totalUnresolvedCredits > 0
      ? Number((calcTotalPoints() / totalUnresolvedCredits).toFixed(2))
      : 0;

  return {
    possible: true,
    courses: resultCourses,
    achievedGpa: finalAvg,
    targetCgpa,
    explanation: `Realistic grade combination achieving an average GPA of ${finalAvg.toFixed(2)} across ${totalUnresolvedCredits} unresolved credits.`
  };
}
