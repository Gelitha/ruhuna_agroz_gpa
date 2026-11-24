// University of Ruhuna - Faculty of Agriculture
// Smart Academic Projection & Multi-Semester Forecasting Calculation Engine

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
  PredictionAccuracyReport
} from '../types';

import { GRADING_SCALE, DEGREE_INFO } from '../database';

const ALL_SEMESTER_KEYS: SemesterKey[] = [
  '1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'
];

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
 * Determine default semester result status based on whether grades exist in course list
 */
export function calculateSemesterResultStatus(courses: Course[]): SemesterResultStatus {
  const gpaCourses = (courses || []).filter(c => !c.isNgpa);
  if (gpaCourses.length === 0) return 'none';

  const gradedCount = gpaCourses.filter(c => !!c.grade).length;
  if (gradedCount === 0) return 'none';
  if (gradedCount === gpaCourses.length) return 'all_received';
  return 'partial';
}

/**
 * Main Projection Calculation Engine
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

  // Trackers
  let actualTotalPoints = 0;
  let actualTotalCredits = 0;

  let pendingProjPoints = 0;
  let pendingProjCredits = 0;
  let pendingResultsCount = 0;

  let combinedPoints = 0;
  let combinedCredits = 0;

  let bestCasePoints = 0;
  let bestCaseCredits = 0;

  let worstCasePoints = 0;
  let worstCaseCredits = 0;

  let totalAvailableGpaCreditsUpToCurrent = 0;

  let currentSemActualPoints = 0;
  let currentSemActualCredits = 0;
  let currentSemProjectedPoints = 0;
  let currentSemProjectedCredits = 0;
  let currentSemTotalGpaCredits = 0;

  const semesterSummaries: Record<SemesterKey, SemesterProjectionSummary> = {} as any;
  const accuracyEntries: PredictionAccuracyEntry[] = [];
  const courseImpacts: CourseImpactAnalysis[] = [];

  // Iterate chronologically through semesters
  for (let idx = 0; idx < ALL_SEMESTER_KEYS.length; idx++) {
    const semKey = ALL_SEMESTER_KEYS[idx];
    const courses = profile.semesters[semKey] || [];
    const isPast = idx < currentIndex;
    const isCurrent = idx === currentIndex;
    const isFuture = idx > currentIndex;

    const academicStatus =
      academicStatusMap[semKey] || getDefaultSemesterAcademicStatus(semKey, currentSem);
    const computedResultStatus = calculateSemesterResultStatus(courses);
    const resultStatus = resultStatusMap[semKey] || computedResultStatus;

    let semActualPoints = 0;
    let semActualCredits = 0;
    let semProjectedPoints = 0;
    let semProjectedCredits = 0;
    let semPendingCount = 0;

    const gpaCourses = courses.filter(c => !c.isNgpa);
    const totalGpaCredits = gpaCourses.reduce((sum, c) => sum + (c.credits || 0), 0);

    for (const course of gpaCourses) {
      const cr = course.credits || 0;
      const projKey = `${semKey}:${course.code}`;
      const projData: CourseProjectionData | undefined = courseProjections[projKey];

      const actualGpv = calculateEffectiveGpvForGrade(course.grade, course.isRepeat, course.isExcused);
      const predictedGpv = calculateEffectiveGpvForGrade(projData?.predictedGrade, course.isRepeat, course.isExcused);
      const targetGpv = calculateEffectiveGpvForGrade(projData?.targetGrade, course.isRepeat, course.isExcused);

      // Track prediction accuracy if course has both actual grade and historical/predicted grade
      const predToCompare = projData?.historicalPrediction || projData?.predictedGrade;
      if (course.grade && predToCompare && actualGpv !== null) {
        const predCompGpv = calculateEffectiveGpvForGrade(predToCompare, course.isRepeat, course.isExcused) ?? 0;
        accuracyEntries.push({
          courseCode: course.code,
          courseName: course.name,
          semesterKey: semKey,
          predictedGrade: predToCompare,
          predictedGpv: predCompGpv,
          actualGrade: course.grade,
          actualGpv: actualGpv,
          deltaGpv: Number((actualGpv - predCompGpv).toFixed(2)),
          isExactMatch: course.grade === predToCompare
        });
      }

      // 1. Confirmed actual grades
      if (actualGpv !== null) {
        semActualPoints += actualGpv * cr;
        semActualCredits += cr;
        actualTotalPoints += actualGpv * cr;
        actualTotalCredits += cr;

        // Best and worst case also inherit actual confirmed grades
        bestCasePoints += actualGpv * cr;
        bestCaseCredits += cr;
        worstCasePoints += actualGpv * cr;
        worstCaseCredits += cr;
      } else {
        // Unresolved course
        if (isPast) {
          semPendingCount++;
          pendingResultsCount++;

          // Best Case for unresolved: 4.0 (or 2.0 if repeat cap)
          const bestGpv = course.isRepeat && !course.isExcused ? 2.0 : 4.0;
          bestCasePoints += bestGpv * cr;
          bestCaseCredits += cr;

          // Worst Case for unresolved: 0.0 (Grade E)
          worstCasePoints += 0.0 * cr;
          worstCaseCredits += cr;
        } else if (isCurrent) {
          const bestGpv = course.isRepeat && !course.isExcused ? 2.0 : 4.0;
          bestCasePoints += bestGpv * cr;
          bestCaseCredits += cr;
          worstCasePoints += 0.0 * cr;
          worstCaseCredits += cr;
        }
      }

      // 2. Projected points for this semester using priority: Actual -> Predicted -> Target
      let effectiveProjectionGpv: number | null = null;
      let effectiveGrade: Grade = '';

      if (actualGpv !== null) {
        effectiveProjectionGpv = actualGpv;
        effectiveGrade = course.grade || '';
      } else if (predictedGpv !== null) {
        effectiveProjectionGpv = predictedGpv;
        effectiveGrade = projData?.predictedGrade || '';
      } else if (targetGpv !== null) {
        effectiveProjectionGpv = targetGpv;
        effectiveGrade = projData?.targetGrade || '';
      } else if (isPast && customAssumptions?.remainingPrevAvgGpa !== undefined) {
        effectiveProjectionGpv = customAssumptions.remainingPrevAvgGpa;
      } else if (isCurrent && customAssumptions?.currentSemAvgGpa !== undefined) {
        effectiveProjectionGpv = customAssumptions.currentSemAvgGpa;
      }

      if (effectiveProjectionGpv !== null) {
        semProjectedPoints += effectiveProjectionGpv * cr;
        semProjectedCredits += cr;
      }

      // Track Course Impact Analysis for active/upcoming examinations
      if (isCurrent || (isPast && actualGpv === null)) {
        const curGpv = effectiveProjectionGpv ?? 3.0; // default benchmark if unset
        const higherTargetGrade: Grade = curGpv < 3.7 ? 'A' : 'A+';
        const higherTargetGpv = 4.0;
        const gpvDiff = Math.max(0, higherTargetGpv - curGpv);
        const impactScore = cr * gpvDiff;
        const totalReq = DEGREE_INFO[profile.degree]?.totalMinGpaCredits || 126;
        const cgpaGain = Number((impactScore / totalReq).toFixed(3));

        courseImpacts.push({
          courseCode: course.code,
          courseName: course.name,
          credits: cr,
          semesterKey: semKey,
          currentGrade: effectiveGrade || 'B',
          currentGpv: curGpv,
          targetGrade: higherTargetGrade,
          targetGpv: higherTargetGpv,
          gpvDifference: Number(gpvDiff.toFixed(2)),
          cgpaGain,
          impactScore: Number(impactScore.toFixed(2)),
          isCompulsory: !!course.isCompulsory,
          advice:
            cr >= 3
              ? `High Credit Weight (${cr} Cr): Raising this course by 1 grade level contributes +${cgpaGain} directly to your graduation CGPA.`
              : `Standard Credit (${cr} Cr): Contributing +${cgpaGain} to your overall cumulative GPA.`
        });
      }
    }

    // Accumulate into overall projection buckets
    if (isPast) {
      pendingProjPoints += semProjectedPoints;
      pendingProjCredits += semProjectedCredits;
      combinedPoints += semProjectedPoints;
      combinedCredits += semProjectedCredits;
      totalAvailableGpaCreditsUpToCurrent += totalGpaCredits;
    } else if (isCurrent) {
      currentSemActualPoints = semActualPoints;
      currentSemActualCredits = semActualCredits;
      currentSemProjectedPoints = semProjectedPoints;
      currentSemProjectedCredits = semProjectedCredits;
      currentSemTotalGpaCredits = totalGpaCredits;

      combinedPoints += semProjectedPoints;
      combinedCredits += semProjectedCredits;
      totalAvailableGpaCreditsUpToCurrent += totalGpaCredits;
    }

    const actualSgpa = semActualCredits > 0 ? semActualPoints / semActualCredits : 0;
    const projectedSgpa = semProjectedCredits > 0 ? semProjectedPoints / semProjectedCredits : 0;

    semesterSummaries[semKey] = {
      semesterKey: semKey,
      academicStatus,
      resultStatus,
      totalCourses: courses.length,
      actualResultsCount: gpaCourses.filter(c => !!c.grade).length,
      pendingResultsCount: semPendingCount,
      totalGpaCredits,
      confirmedGpaCredits: semActualCredits,
      predictedGpaCredits: Math.max(0, semProjectedCredits - semActualCredits),
      actualSgpa: Number(actualSgpa.toFixed(2)),
      projectedSgpa: Number(projectedSgpa.toFixed(2)),
      isComplete: semProjectedCredits >= totalGpaCredits && totalGpaCredits > 0
    };
  }

  // Final Calculations
  const actualCgpa = actualTotalCredits > 0 ? actualTotalPoints / actualTotalCredits : 0;
  const projectedCgpaPending = pendingProjCredits > 0 ? pendingProjPoints / pendingProjCredits : actualCgpa;
  const currentSemActualSgpa = currentSemActualCredits > 0 ? currentSemActualPoints / currentSemActualCredits : 0;
  const currentSemProjectedSgpa = currentSemProjectedCredits > 0 ? currentSemProjectedPoints / currentSemProjectedCredits : 0;
  const combinedProjectedCgpa = combinedCredits > 0 ? combinedPoints / combinedCredits : actualCgpa;

  const bestCaseCgpa = bestCaseCredits > 0 ? bestCasePoints / bestCaseCredits : actualCgpa;
  const worstCaseCgpa = worstCaseCredits > 0 ? worstCasePoints / worstCaseCredits : actualCgpa;

  const deltaCombined = Number((combinedProjectedCgpa - actualCgpa).toFixed(2));
  const projectionCoveragePercent =
    totalAvailableGpaCreditsUpToCurrent > 0
      ? Math.min(100, Math.round((combinedCredits / totalAvailableGpaCreditsUpToCurrent) * 100))
      : 100;

  // Accuracy metrics
  const totalCompared = accuracyEntries.length;
  const exactMatchesCount = accuracyEntries.filter(e => e.isExactMatch).length;
  const accuracyPercentage = totalCompared > 0 ? Math.round((exactMatchesCount / totalCompared) * 100) : 0;
  const totalError = accuracyEntries.reduce((sum, e) => sum + Math.abs(e.deltaGpv), 0);
  const averageErrorGpv = totalCompared > 0 ? Number((totalError / totalCompared).toFixed(2)) : 0;
  const netGpvBias = totalCompared > 0
    ? Number((accuracyEntries.reduce((sum, e) => sum + e.deltaGpv, 0) / totalCompared).toFixed(2))
    : 0;

  // Sort course impacts by impactScore descending
  courseImpacts.sort((a, b) => b.impactScore - a.impactScore);

  return {
    actualCgpa: Number(actualCgpa.toFixed(2)),
    actualGpaCredits: actualTotalCredits,
    projectedCgpaPending: Number(projectedCgpaPending.toFixed(2)),
    pendingResultsCount,
    pendingGpaCredits: Math.max(0, pendingProjCredits - actualTotalCredits),
    currentSemester: currentSem,
    currentSemActualSgpa: Number(currentSemActualSgpa.toFixed(2)),
    currentSemProjectedSgpa: Number(currentSemProjectedSgpa.toFixed(2)),
    currentSemTotalCredits: currentSemTotalGpaCredits,
    currentSemGradedCredits: currentSemProjectedCredits,
    combinedProjectedCgpa: Number(combinedProjectedCgpa.toFixed(2)),
    combinedTotalCredits: combinedCredits,
    deltaCombined,
    projectionCoveragePercent,
    isCurrentSemComplete: currentSemProjectedCredits >= currentSemTotalGpaCredits && currentSemTotalGpaCredits > 0,
    scenarios: {
      actualOnly: Number(actualCgpa.toFixed(2)),
      expected: Number(combinedProjectedCgpa.toFixed(2)),
      bestCase: Number(bestCaseCgpa.toFixed(2)),
      worstCase: Number(worstCaseCgpa.toFixed(2))
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
      explanation: `Your current CGPA already satisfies the ${targetCgpa.toFixed(2)} threshold! Maintaining passing grades (≥ 2.00) across remaining ${remainingCredits} credits secures this standing.`
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
