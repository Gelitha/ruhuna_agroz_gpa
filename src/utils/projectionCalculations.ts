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

export interface GradeCreditQuota {
  grade: Grade;
  gpv: number;
  credits: number;
  courseCount: number;
}

export interface SuggestedCourseGrade {
  semesterKey: SemesterKey;
  courseCode: string;
  courseName: string;
  credits: number;
  suggestedGrade: Grade;
  suggestedGpv: number;
  effectiveGpv: number;
  isManual: boolean;
  existingProjectedGrade?: Grade;
  isRepeat: boolean;
  isExcused: boolean;
}

export interface SuggestedCombinationResult {
  possible: boolean;
  courses: SuggestedCourseGrade[];
  achievedGpa: number;
  estimatedAchievedCgpa: number;
  targetCgpa: number;
  actualCgpa: number;
  totalScopeCredits: number;
  totalEligibleCredits: number;
  manualCredits: number;
  autoCredits: number;
  unenrolledCredits: number;
  requiredRemainingAverage: number;
  maxAchievableCgpa: number;
  shortfall: number;
  isIncompleteEstimate: boolean;
  manualQuotas: GradeCreditQuota[];
  autoQuotas: GradeCreditQuota[];
  combinedQuotas: GradeCreditQuota[];
  explanation: string;
}

const FULL_GRADE_ORDER: Grade[] = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E'];

function buildGradeQuotas(items: Array<{ grade: Grade; gpv: number; credits: number }>): GradeCreditQuota[] {
  const map = new Map<Grade, GradeCreditQuota>();
  for (const item of items) {
    if (!item.grade || item.credits <= 0) continue;
    const existing = map.get(item.grade);
    if (existing) {
      existing.credits += item.credits;
      existing.courseCount += 1;
    } else {
      map.set(item.grade, {
        grade: item.grade,
        gpv: item.gpv,
        credits: item.credits,
        courseCount: 1
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => FULL_GRADE_ORDER.indexOf(a.grade) - FULL_GRADE_ORDER.indexOf(b.grade)
  );
}

/**
 * Generates realistic, credit-weighted grade combinations for unresolved courses within a target scope.
 * Supports fixed manual grade preferences alongside automatically balanced remaining subjects,
 * respecting course credits, grading scales, non-GPA exclusions, and repeat grade caps (max 2.0 / Grade C).
 */
export function generateSuggestedGradeCombination(
  profile: StudentProfile,
  targetCgpa: number,
  scope: TargetScope,
  manualAllocations: Record<string, Grade> = {}
): SuggestedCombinationResult {
  const currentSem = profile.currentSemester || '1-1';
  const currentIndex = ALL_SEMESTER_KEYS.indexOf(currentSem as SemesterKey);
  const degInfo = DEGREE_INFO[profile.degree] || DEGREE_INFO.ARMT;
  const degreeTotalMinGpaCredits = degInfo.totalMinGpaCredits || 126;

  let semKeysToInclude: SemesterKey[] = [];
  if (scope === 'after_pending') {
    semKeysToInclude = currentIndex > 0 ? ALL_SEMESTER_KEYS.slice(0, currentIndex) : [];
  } else if (scope === 'after_current') {
    semKeysToInclude = ALL_SEMESTER_KEYS.slice(0, currentIndex + 1);
  } else {
    semKeysToInclude = [...ALL_SEMESTER_KEYS];
  }

  let confirmedPointsInScope = 0;
  let confirmedCreditsInScope = 0;
  let totalEnrolledCreditsInScope = 0;

  let globalActualPoints = 0;
  let globalActualCredits = 0;
  for (const sk of ALL_SEMESTER_KEYS) {
    for (const c of profile.semesters[sk] || []) {
      if (!c.isNgpa && isCourseGradeConfirmed(c)) {
        const gpv = calculateEffectiveGpvForGrade(c.grade, c.isRepeat, c.isExcused) ?? 0;
        globalActualPoints += gpv * (c.credits || 0);
        globalActualCredits += c.credits || 0;
      }
    }
  }
  const actualCgpa = globalActualCredits > 0 ? Number((globalActualPoints / globalActualCredits).toFixed(2)) : 0;

  const eligibleCourses: Array<{
    key: string;
    semKey: SemesterKey;
    course: Course;
    maxGpv: number;
    manualGrade?: Grade;
  }> = [];

  for (const semKey of semKeysToInclude) {
    const semCourses = profile.semesters[semKey] || [];
    for (const c of semCourses) {
      if (c.isNgpa) continue;
      const cr = c.credits || 0;
      totalEnrolledCreditsInScope += cr;

      if (isCourseGradeConfirmed(c)) {
        const gpv = calculateEffectiveGpvForGrade(c.grade, c.isRepeat, c.isExcused) ?? 0;
        confirmedPointsInScope += gpv * cr;
        confirmedCreditsInScope += cr;
      } else {
        const key = `${semKey}:${c.code}`;
        const rawManual = manualAllocations[key];
        const manualGrade = rawManual && GRADING_SCALE[rawManual] ? rawManual : undefined;
        const maxGpv = c.isRepeat && !c.isExcused ? 2.0 : 4.0;
        eligibleCourses.push({ key, semKey, course: c, maxGpv, manualGrade });
      }
    }
  }

  const unenrolledCredits =
    scope === 'at_graduation' ? Math.max(0, degreeTotalMinGpaCredits - totalEnrolledCreditsInScope) : 0;
  const totalScopeCredits =
    scope === 'at_graduation'
      ? Math.max(degreeTotalMinGpaCredits, totalEnrolledCreditsInScope)
      : totalEnrolledCreditsInScope;
  const isIncompleteEstimate = scope === 'at_graduation' && unenrolledCredits > 0;

  if (scope === 'after_pending' && currentIndex === 0) {
    return {
      possible: false,
      courses: [],
      achievedGpa: 0,
      estimatedAchievedCgpa: actualCgpa,
      targetCgpa,
      actualCgpa,
      totalScopeCredits: 0,
      totalEligibleCredits: 0,
      manualCredits: 0,
      autoCredits: 0,
      unenrolledCredits: 0,
      requiredRemainingAverage: 0,
      maxAchievableCgpa: 0,
      shortfall: targetCgpa,
      isIncompleteEstimate: false,
      manualQuotas: [],
      autoQuotas: [],
      combinedQuotas: [],
      explanation:
        'Semester 1-1 has no preceding semesters. Select "After the current semester" to calculate targets for your current examinations.'
    };
  }

  let manualPoints = 0;
  let manualCredits = 0;
  const manualItems: typeof eligibleCourses = [];
  const autoItems: typeof eligibleCourses = [];

  for (const item of eligibleCourses) {
    if (item.manualGrade) {
      const effGpv =
        calculateEffectiveGpvForGrade(item.manualGrade, item.course.isRepeat, item.course.isExcused) ?? 0;
      manualPoints += effGpv * (item.course.credits || 0);
      manualCredits += item.course.credits || 0;
      manualItems.push(item);
    } else {
      autoItems.push(item);
    }
  }

  const autoCredits = autoItems.reduce((sum, item) => sum + (item.course.credits || 0), 0);
  const totalEligibleCredits = manualCredits + autoCredits;
  const remainingAutoPoolCredits = autoCredits + unenrolledCredits;

  const maxAutoPoints =
    autoItems.reduce((sum, item) => sum + item.maxGpv * (item.course.credits || 0), 0) +
    4.0 * unenrolledCredits;
  const maxAchievablePoints = confirmedPointsInScope + manualPoints + maxAutoPoints;
  const maxAchievableCgpa =
    totalScopeCredits > 0 ? Number((maxAchievablePoints / totalScopeCredits).toFixed(2)) : 0;

  const targetTotalPoints = targetCgpa * totalScopeCredits;
  const remainingNeededPoints = Math.max(0, targetTotalPoints - confirmedPointsInScope - manualPoints);
  const requiredRemainingAverage =
    remainingAutoPoolCredits > 0 ? remainingNeededPoints / remainingAutoPoolCredits : 0;

  // Handle zero remaining automatic credits
  if (remainingAutoPoolCredits === 0) {
    const finalTotalPoints = confirmedPointsInScope + manualPoints;
    const finalCgpa = totalScopeCredits > 0 ? finalTotalPoints / totalScopeCredits : 0;
    const possible = finalTotalPoints + 1e-9 >= targetTotalPoints;

    const resultCourses: SuggestedCourseGrade[] = eligibleCourses.map(item => {
      const grade = item.manualGrade || 'C';
      const rawGpv = GRADING_SCALE[grade]?.gpv ?? 2.0;
      const effGpv = calculateEffectiveGpvForGrade(grade, item.course.isRepeat, item.course.isExcused) ?? 0;
      return {
        semesterKey: item.semKey,
        courseCode: item.course.code,
        courseName: item.course.name,
        credits: item.course.credits || 0,
        suggestedGrade: grade,
        suggestedGpv: rawGpv,
        effectiveGpv: effGpv,
        isManual: !!item.manualGrade,
        existingProjectedGrade: item.course.isExpected ? item.course.grade : undefined,
        isRepeat: !!item.course.isRepeat,
        isExcused: !!item.course.isExcused
      };
    });

    const manualQuotas = buildGradeQuotas(
      resultCourses.filter(c => c.isManual).map(c => ({ grade: c.suggestedGrade, gpv: c.effectiveGpv, credits: c.credits }))
    );

    return {
      possible,
      courses: resultCourses,
      achievedGpa: totalEligibleCredits > 0 ? Number((manualPoints / totalEligibleCredits).toFixed(2)) : 0,
      estimatedAchievedCgpa: Number(finalCgpa.toFixed(2)),
      targetCgpa,
      actualCgpa,
      totalScopeCredits,
      totalEligibleCredits,
      manualCredits,
      autoCredits: 0,
      unenrolledCredits: 0,
      requiredRemainingAverage: 0,
      maxAchievableCgpa: Number(finalCgpa.toFixed(2)),
      shortfall: possible ? 0 : Number(Math.max(0, targetCgpa - finalCgpa).toFixed(2)),
      isIncompleteEstimate: false,
      manualQuotas,
      autoQuotas: [],
      combinedQuotas: manualQuotas,
      explanation: possible
        ? `Target of ${targetCgpa.toFixed(2)} CGPA is achieved (${finalCgpa.toFixed(2)} CGPA).`
        : 'Target currently unreachable with your selected grades.'
    };
  }

  // Automatic balancing grade steps (A down to E)
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

  const isTargetReachable =
    targetTotalPoints <= maxAchievablePoints + 1e-9 && requiredRemainingAverage <= 4.0 + 1e-9;

  // Portion of remaining points expected from enrolled auto courses
  const enrolledTargetAutoPoints =
    autoCredits > 0
      ? isTargetReachable
        ? Math.max(0, remainingNeededPoints - Math.min(4.0, Math.max(2.0, requiredRemainingAverage)) * unenrolledCredits)
        : maxAutoPoints - 4.0 * unenrolledCredits
      : 0;

  const enrolledReqAvg =
    autoCredits > 0
      ? remainingNeededPoints <= 0
        ? 2.0
        : Math.min(4.0, enrolledTargetAutoPoints / autoCredits)
      : 0;

  // Initialize automatic courses
  let baseStepIdx = GRADE_SCALE_STEPS.findIndex(s => s.gpv <= enrolledReqAvg + 1e-9);
  if (baseStepIdx === -1) baseStepIdx = GRADE_SCALE_STEPS.length - 1;

  const autoStepIndices = autoItems.map(({ maxGpv }) => {
    if (!isTargetReachable) {
      const bestIdx = GRADE_SCALE_STEPS.findIndex(s => s.gpv <= maxGpv + 1e-9);
      return bestIdx === -1 ? GRADE_SCALE_STEPS.length - 1 : bestIdx;
    }
    let idx = baseStepIdx;
    while (idx < GRADE_SCALE_STEPS.length - 1 && GRADE_SCALE_STEPS[idx].gpv > maxGpv + 1e-9) {
      idx++;
    }
    return idx;
  });

  const calcAutoPoints = () =>
    autoItems.reduce(
      (sum, item, i) => sum + (item.course.credits || 0) * GRADE_SCALE_STEPS[autoStepIndices[i]].gpv,
      0
    );

  let currentAutoPoints = calcAutoPoints();

  if (isTargetReachable && autoItems.length > 0 && remainingNeededPoints > 0) {
    // Phase 1: Step up lowest-GPV automatic courses until enrolledTargetAutoPoints is met
    let guard = 0;
    while (currentAutoPoints + 1e-9 < enrolledTargetAutoPoints && guard < 200) {
      guard++;
      let bestIdx = -1;
      let bestScore = Infinity;

      for (let i = 0; i < autoItems.length; i++) {
        const curStep = autoStepIndices[i];
        if (curStep <= 0) continue;
        const nextStep = curStep - 1;
        if (GRADE_SCALE_STEPS[nextStep].gpv > autoItems[i].maxGpv + 1e-9) continue;

        const cr = autoItems[i].course.credits || 0;
        const deltaPts = (GRADE_SCALE_STEPS[nextStep].gpv - GRADE_SCALE_STEPS[curStep].gpv) * cr;
        const newTotal = currentAutoPoints + deltaPts;
        const overshoot = Math.max(0, newTotal - enrolledTargetAutoPoints);
        // Prefer balanced distribution (raising lower grades first) and minimal overshoot
        const score = GRADE_SCALE_STEPS[curStep].gpv * 100 + overshoot * 10 - deltaPts;
        if (score < bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      if (bestIdx === -1) break;
      autoStepIndices[bestIdx]--;
      currentAutoPoints = calcAutoPoints();
    }

    // Phase 2: Downward-trim to eliminate unnecessary overshooting
    let trimmed = true;
    while (trimmed) {
      trimmed = false;
      let bestTrimIdx = -1;
      let smallestSurplus = currentAutoPoints - enrolledTargetAutoPoints;

      for (let i = 0; i < autoItems.length; i++) {
        const curStep = autoStepIndices[i];
        if (curStep >= GRADE_SCALE_STEPS.length - 1) continue;
        const downStep = curStep + 1;
        const cr = autoItems[i].course.credits || 0;
        const deltaPts = (GRADE_SCALE_STEPS[curStep].gpv - GRADE_SCALE_STEPS[downStep].gpv) * cr;
        const nextTotal = currentAutoPoints - deltaPts;
        if (nextTotal + 1e-9 >= enrolledTargetAutoPoints) {
          const surplus = nextTotal - enrolledTargetAutoPoints;
          if (surplus <= smallestSurplus) {
            smallestSurplus = surplus;
            bestTrimIdx = i;
          }
        }
      }

      if (bestTrimIdx !== -1) {
        autoStepIndices[bestTrimIdx]++;
        currentAutoPoints = calcAutoPoints();
        trimmed = true;
      }
    }

    // Phase 3: Smooth variance between high & low auto courses without dropping below target
    let smoothed = true;
    let smoothGuard = 0;
    while (smoothed && smoothGuard < 50) {
      smoothed = false;
      smoothGuard++;
      for (let i = 0; i < autoItems.length; i++) {
        for (let j = 0; j < autoItems.length; j++) {
          if (i === j) continue;
          const stepHigh = autoStepIndices[i];
          const stepLow = autoStepIndices[j];
          if (GRADE_SCALE_STEPS[stepHigh].gpv - GRADE_SCALE_STEPS[stepLow].gpv <= 0.41) continue;
          if (stepHigh >= GRADE_SCALE_STEPS.length - 1 || stepLow <= 0) continue;
          if (GRADE_SCALE_STEPS[stepLow - 1].gpv > autoItems[j].maxGpv + 1e-9) continue;

          const crHigh = autoItems[i].course.credits || 0;
          const crLow = autoItems[j].course.credits || 0;
          const deltaHigh = (GRADE_SCALE_STEPS[stepHigh + 1].gpv - GRADE_SCALE_STEPS[stepHigh].gpv) * crHigh;
          const deltaLow = (GRADE_SCALE_STEPS[stepLow - 1].gpv - GRADE_SCALE_STEPS[stepLow].gpv) * crLow;
          const nextPts = currentAutoPoints + deltaHigh + deltaLow;
          if (nextPts + 1e-9 >= enrolledTargetAutoPoints && nextPts <= currentAutoPoints + 1e-9) {
            autoStepIndices[i]++;
            autoStepIndices[j]--;
            currentAutoPoints = nextPts;
            smoothed = true;
            break;
          }
        }
        if (smoothed) break;
      }
    }
  }

  const autoMap = new Map<string, { grade: Grade; gpv: number }>();
  autoItems.forEach((item, idx) => {
    const st = GRADE_SCALE_STEPS[autoStepIndices[idx]];
    autoMap.set(item.key, { grade: st.grade, gpv: st.gpv });
  });

  const resultCourses: SuggestedCourseGrade[] = eligibleCourses.map(item => {
    const isManual = !!item.manualGrade;
    const assignedGrade = isManual ? (item.manualGrade as Grade) : (autoMap.get(item.key)?.grade || 'C');
    const rawGpv = GRADING_SCALE[assignedGrade]?.gpv ?? 0;
    const effGpv = calculateEffectiveGpvForGrade(assignedGrade, item.course.isRepeat, item.course.isExcused) ?? 0;
    return {
      semesterKey: item.semKey,
      courseCode: item.course.code,
      courseName: item.course.name,
      credits: item.course.credits || 0,
      suggestedGrade: assignedGrade,
      suggestedGpv: rawGpv,
      effectiveGpv: effGpv,
      isManual,
      existingProjectedGrade: item.course.isExpected ? item.course.grade : undefined,
      isRepeat: !!item.course.isRepeat,
      isExcused: !!item.course.isExcused
    };
  });

  const unenrolledAssumedPoints =
    unenrolledCredits > 0
      ? (isTargetReachable ? Math.min(4.0, Math.max(2.0, requiredRemainingAverage)) : 4.0) * unenrolledCredits
      : 0;

  const totalCombinedPoints = confirmedPointsInScope + manualPoints + currentAutoPoints + unenrolledAssumedPoints;
  const estimatedAchievedCgpa =
    totalScopeCredits > 0 ? Number((totalCombinedPoints / totalScopeCredits).toFixed(2)) : 0;
  const achievedGpa =
    totalEligibleCredits > 0
      ? Number(((manualPoints + currentAutoPoints) / totalEligibleCredits).toFixed(2))
      : 0;

  const manualQuotas = buildGradeQuotas(
    resultCourses.filter(c => c.isManual).map(c => ({ grade: c.suggestedGrade, gpv: c.effectiveGpv, credits: c.credits }))
  );
  const autoQuotas = buildGradeQuotas(
    resultCourses.filter(c => !c.isManual).map(c => ({ grade: c.suggestedGrade, gpv: c.effectiveGpv, credits: c.credits }))
  );
  const combinedQuotas = buildGradeQuotas(
    resultCourses.map(c => ({ grade: c.suggestedGrade, gpv: c.effectiveGpv, credits: c.credits }))
  );

  const shortfall = isTargetReachable
    ? 0
    : Number(Math.max(0, targetCgpa - maxAchievableCgpa).toFixed(2));

  return {
    possible: isTargetReachable,
    courses: resultCourses,
    achievedGpa,
    estimatedAchievedCgpa,
    targetCgpa,
    actualCgpa,
    totalScopeCredits,
    totalEligibleCredits,
    manualCredits,
    autoCredits,
    unenrolledCredits,
    requiredRemainingAverage: Number(requiredRemainingAverage.toFixed(2)),
    maxAchievableCgpa,
    shortfall,
    isIncompleteEstimate,
    manualQuotas,
    autoQuotas,
    combinedQuotas,
    explanation: isTargetReachable
      ? `Balanced combination achieving ${achievedGpa.toFixed(2)} average across ${totalEligibleCredits} eligible credits (Estimated CGPA: ${estimatedAchievedCgpa.toFixed(2)}).`
      : 'Target currently unreachable with your selected grades.'
  };
}
