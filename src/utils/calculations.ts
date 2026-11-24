// University of Ruhuna - Faculty of Agriculture
// GradePath Pure Academic Regulations & Calculation Engine

import {
  Grade,
  DegreeCode,
  SemesterKey,
  Course,
  SemesterStats,
  OverallStats,
  DeansHonorYear,
  SpecializationEligibility,
  TargetGpaResult,
  ConcreteGradeCombination,
  UserPerformanceProfile,
  RemainingCourseTarget,
  ComprehensiveGradeStrategy,
  CreditTierSummary,
  SemesterRoadmapItem,
  RepeatImpactResult,
  WhatIfResult,
  DegreeAuditResult,
  RegulationRiskAlert,
  StudentProfile
} from '../types';

import {
  GRADING_SCALE,
  DEPARTMENTS,
  DEGREE_INFO,
  COURSE_CATALOG,
  DEGREE_COMPULSORY_COURSES,
  SPECIALIZATION_STREAMS,
  parseCourseCode
} from '../database';

// 1. Calculate Course GPV taking Repeat Capping into account
export function isCourseGradeConfirmed(course: Course): boolean {
  return Boolean(course.grade && !course.isExpected && GRADING_SCALE[course.grade]);
}

export function calculateCourseGpv(course: Course): number | null {
  if (!course.grade || !GRADING_SCALE[course.grade]) {
    return null;
  }
  let baseGpv = GRADING_SCALE[course.grade].gpv;

  // Faculty of Agriculture Repeat Cap: Max Grade C (2.0) unless officially excused (medical/Senate)
  if (course.isRepeat && !course.isExcused) {
    if (baseGpv > 2.0) {
      baseGpv = 2.0;
    }
  }
  return baseGpv;
}

// 2. Class Standing Cutoffs
export function getClassStanding(cgpa: number, creditsAttempted = 0): { title: string; color: string; level: number } {
  if (creditsAttempted === 0) {
    return { title: 'No Grades Finalized', color: '#78827A', level: 0 };
  }
  if (cgpa >= 3.70) {
    return { title: 'First Class Honours', color: '#27845B', level: 4 };
  }
  if (cgpa >= 3.30) {
    return { title: 'Second Class (Upper Division)', color: '#245C45', level: 3 };
  }
  if (cgpa >= 3.00) {
    return { title: 'Second Class (Lower Division)', color: '#2D6B82', level: 2 };
  }
  if (cgpa >= 2.00) {
    return { title: 'General Pass', color: '#C58A35', level: 1 };
  }
  return { title: 'Below Pass (Academic Warning)', color: '#C65A55', level: -1 };
}

// 3. Semester Statistics
export function calculateSemesterStats(semesterKey: SemesterKey, courseList: Course[]): SemesterStats {
  let gpaCreditsAttempted = 0;
  let gpaCreditsEarned = 0;
  let weightedPoints = 0;

  let realCreditsAttempted = 0;
  let realCreditsEarned = 0;
  let realWeightedPoints = 0;

  let ngpaPassedCount = 0;
  let ngpaTotalCount = 0;
  let hasIncomplete = false;
  let allAboveB = true;
  let hasRepeat = false;
  let expectedCoursesCount = 0;

  (courseList || []).forEach(course => {
    if (course.isNgpa) {
      ngpaTotalCount++;
      if (course.grade) {
        const gpv = GRADING_SCALE[course.grade]?.gpv ?? 0;
        if (gpv >= 1.7) { // C- or higher is Pass for Non-GPA
          ngpaPassedCount++;
        }
      }
      return;
    }

    if (course.isRepeat) {
      hasRepeat = true;
    }

    if (!course.grade) {
      hasIncomplete = true;
      allAboveB = false;
      return;
    }

    const gpv = calculateCourseGpv(course);
    if (gpv === null) {
      hasIncomplete = true;
      allAboveB = false;
      return;
    }

    const creds = Number(course.credits) || 0;

    if (course.isExpected) {
      expectedCoursesCount++;
    } else {
      realCreditsAttempted += creds;
      realWeightedPoints += creds * gpv;
      if (gpv >= 1.7) {
        realCreditsEarned += creds;
      }
      // Dean's Honor check: Grade B (3.0) or higher on confirmed courses
      if (gpv < 3.0) {
        allAboveB = false;
      }
    }
  });

  const realSgpa = realCreditsAttempted > 0 ? realWeightedPoints / realCreditsAttempted : 0;

  // Actual semester stats MUST strictly evaluate confirmed grades only
  gpaCreditsAttempted = realCreditsAttempted;
  gpaCreditsEarned = realCreditsEarned;
  weightedPoints = realWeightedPoints;
  const sgpa = realSgpa;

  return {
    semesterKey,
    gpaCreditsAttempted,
    gpaCreditsEarned,
    weightedPoints,
    sgpa: parseFloat(sgpa.toFixed(2)),
    sgpaExact: sgpa,

    realCreditsAttempted,
    realCreditsEarned,
    realWeightedPoints,
    realSgpa: parseFloat(realSgpa.toFixed(2)),
    realSgpaExact: realSgpa,

    expectedCoursesCount,
    hasExpected: expectedCoursesCount > 0,
    ngpaPassedCount,
    ngpaTotalCount,
    hasIncomplete,
    allAboveB: allAboveB && gpaCreditsAttempted > 0,
    hasRepeat
  };
}

// 4. Overall Degree Statistics & Compliance
export function calculateOverallStats(profile: StudentProfile): OverallStats {
  const semStats: Record<SemesterKey, SemesterStats> = {} as any;
  const semKeys: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

  let totalGpaCreditsAttempted = 0;
  let totalGpaCreditsEarned = 0;
  let totalWeightedPoints = 0;

  let realCreditsAttempted = 0;
  let realCreditsEarned = 0;
  let realWeightedPoints = 0;

  let totalProjectedCreditsAttempted = 0;
  let totalProjectedCreditsEarned = 0;
  let totalProjectedWeightedPoints = 0;

  let totalCompulsoryEarned = 0;
  let totalElectiveEarned = 0;
  let totalExpectedCoursesCount = 0;

  let ngpaAllPassed = true;
  let unredeemedFailCount = 0;

  // Check orientation courses
  (profile.orientationCourses || []).forEach(c => {
    if (!c.grade || (GRADING_SCALE[c.grade]?.gpv ?? 0) < 1.7) {
      ngpaAllPassed = false;
    }
  });

  semKeys.forEach(semKey => {
    const list = profile.semesters[semKey] || [];
    const stats = calculateSemesterStats(semKey, list);
    semStats[semKey] = stats;

    totalGpaCreditsAttempted += stats.gpaCreditsAttempted;
    totalGpaCreditsEarned += stats.gpaCreditsEarned;
    totalWeightedPoints += stats.weightedPoints;

    realCreditsAttempted += stats.realCreditsAttempted;
    realCreditsEarned += stats.realCreditsEarned;
    realWeightedPoints += stats.realWeightedPoints;
    totalExpectedCoursesCount += stats.expectedCoursesCount;

    list.forEach(c => {
      if (c.isNgpa) {
        if (!c.isExpected && (!c.grade || (GRADING_SCALE[c.grade]?.gpv ?? 0) < 1.7)) {
          ngpaAllPassed = false;
        }
      } else if (c.isExpected && c.grade && GRADING_SCALE[c.grade]) {
        const cred = Number(c.credits) || 0;
        const gpv = calculateCourseGpv(c);
        if (gpv !== null) {
          totalProjectedCreditsAttempted += cred;
          totalProjectedWeightedPoints += cred * gpv;
          if (gpv >= 1.7) {
            totalProjectedCreditsEarned += cred;
          }
        }
      } else {
        const gpv = calculateCourseGpv(c);
        if (gpv !== null && gpv >= 1.7 && !c.isExpected) {
          if (c.isCompulsory) {
            totalCompulsoryEarned += Number(c.credits) || 0;
          } else {
            totalElectiveEarned += Number(c.credits) || 0;
          }
        }
        if (c.grade === 'E' && !c.isExpected) {
          unredeemedFailCount++;
        }
      }
    });
  });

  const cgpa = totalGpaCreditsAttempted > 0 ? totalWeightedPoints / totalGpaCreditsAttempted : 0;
  const realCgpa = cgpa;
  const degInfo = DEGREE_INFO[profile.degree] || DEGREE_INFO.ARMT;

  const combinedCredits = totalGpaCreditsAttempted + totalProjectedCreditsAttempted;
  const combinedPoints = totalWeightedPoints + totalProjectedWeightedPoints;
  const projectedCgpa = combinedCredits > 0 ? combinedPoints / combinedCredits : 0;
  const deltaCgpa = projectedCgpa - cgpa;

  const standing = getClassStanding(cgpa, totalGpaCreditsAttempted);
  const realStanding = standing;

  // 5. Dean's Honor List per Academic Year
  const deansHonors: Record<number, DeansHonorYear> = {};
  const years = [
    { yr: 1, sems: ['1-1', '1-2'] as SemesterKey[], cutoff: 3.70, reqCredits: degInfo.semesters['1-1'].compulsoryCredits + degInfo.semesters['1-2'].compulsoryCredits },
    { yr: 2, sems: ['2-1', '2-2'] as SemesterKey[], cutoff: 3.70, reqCredits: degInfo.semesters['2-1'].compulsoryCredits + degInfo.semesters['2-2'].compulsoryCredits },
    { yr: 3, sems: ['3-1', '3-2'] as SemesterKey[], cutoff: 3.80, reqCredits: degInfo.semesters['3-1'].compulsoryCredits + degInfo.semesters['3-2'].compulsoryCredits },
    { yr: 4, sems: ['4-1', '4-2'] as SemesterKey[], cutoff: 3.80, reqCredits: degInfo.semesters['4-1'].compulsoryCredits + degInfo.semesters['4-2'].compulsoryCredits }
  ];

  years.forEach(y => {
    const s1 = semStats[y.sems[0]];
    const s2 = semStats[y.sems[1]];
    // Dean's Honors strictly evaluates officially confirmed grades (first attempt, >= B, min credits)
    const yrAttempted = s1.realCreditsAttempted + s2.realCreditsAttempted;
    const yrPoints = s1.realWeightedPoints + s2.realWeightedPoints;
    const yrGpa = yrAttempted > 0 ? yrPoints / yrAttempted : 0;
    const hasRepeats = s1.hasRepeat || s2.hasRepeat;
    const allB = s1.allAboveB && s2.allAboveB;
    const hasInc = s1.hasIncomplete || s2.hasIncomplete || s1.hasExpected || s2.hasExpected;
    const creditsMet = yrAttempted >= y.reqCredits;

    let status = 'Incomplete';
    let reason = '';

    if (hasInc || yrAttempted === 0) {
      status = 'In Progress';
      reason = 'Not all semester course grades are finalized.';
    } else if (hasRepeats) {
      status = 'Not Eligible';
      reason = 'Repeat courses disqualify Dean’s Honor List eligibility (first attempt only).';
    } else if (!allB) {
      status = 'Not Eligible';
      reason = 'All registered courses in this academic year must be Grade B (3.0) or higher.';
    } else if (!creditsMet) {
      status = 'Not Eligible';
      reason = `Earned credits (${yrAttempted}) do not meet the minimum requirement (${y.reqCredits}).`;
    } else if (yrGpa < y.cutoff) {
      status = 'Not Eligible';
      reason = `Annual GPA (${yrGpa.toFixed(2)}) is below the required threshold of ${y.cutoff.toFixed(2)}.`;
    } else {
      status = 'Eligible for Dean’s Honor List';
      reason = `Annual GPA: ${yrGpa.toFixed(2)} (≥ ${y.cutoff.toFixed(2)}) with all grades ≥ B. Distinction!`;
    }

    deansHonors[y.yr] = {
      year: y.yr,
      annualGpa: parseFloat(yrGpa.toFixed(2)),
      status,
      eligible: status.startsWith('Eligible'),
      reason
    };
  });

  // 6. Final-Year Specialization Eligibility (ARMT & ABM, evaluated at end of 3-1)
  const specEligibility: SpecializationEligibility = {
    evaluated: false,
    gpaMet: false,
    electiveRatioMet: false,
    gpa31: 0,
    electiveDeptCredits: 0,
    totalYear3ElectiveCredits: 0,
    ratio: 0,
    statusText: '',
    chosenDept: profile.specializationDept || 'CS'
  };

  if (profile.degree === 'ARMT' || profile.degree === 'ABM') {
    let pts31 = 0;
    let creds31 = 0;
    // Specialization eligibility strictly evaluates confirmed results
    (['1-1', '1-2', '2-1', '2-2', '3-1'] as SemesterKey[]).forEach(k => {
      pts31 += semStats[k].realWeightedPoints;
      creds31 += semStats[k].realCreditsAttempted;
    });
    const gpaEnd31 = creds31 > 0 ? pts31 / creds31 : 0;
    specEligibility.evaluated = creds31 >= 40;
    specEligibility.gpa31 = parseFloat(gpaEnd31.toFixed(2));
    specEligibility.gpaMet = gpaEnd31 >= 2.70;

    let yr3ElectiveTotal = 0;
    let yr3ElectiveDept = 0;
    (['3-1', '3-2'] as SemesterKey[]).forEach(k => {
      (profile.semesters[k] || []).forEach(c => {
        if (!c.isCompulsory && !c.isNgpa) {
          const cred = Number(c.credits) || 0;
          yr3ElectiveTotal += cred;
          if (c.dept === profile.specializationDept) {
            yr3ElectiveDept += cred;
          }
        }
      });
    });

    specEligibility.totalYear3ElectiveCredits = yr3ElectiveTotal;
    specEligibility.electiveDeptCredits = yr3ElectiveDept;
    specEligibility.ratio = yr3ElectiveTotal > 0 ? yr3ElectiveDept / yr3ElectiveTotal : 0;
    specEligibility.electiveRatioMet = yr3ElectiveTotal > 0 ? specEligibility.ratio >= 0.50 : false;

    if (!specEligibility.gpaMet) {
      specEligibility.statusText = `Cumulative GPA at end of 3-1 is ${specEligibility.gpa31.toFixed(2)} (< 2.70). Preference guarantee not assured; allocation subject to competition and department capacity.`;
    } else if (yr3ElectiveTotal > 0 && !specEligibility.electiveRatioMet) {
      specEligibility.statusText = `GPA threshold met (${specEligibility.gpa31.toFixed(2)} ≥ 2.70), but only ${(specEligibility.ratio * 100).toFixed(0)}% of 3rd year electives are from ${profile.specializationDept} (minimum 50% required).`;
    } else {
      const deptName = DEPARTMENTS[profile.specializationDept] || profile.specializationDept;
      specEligibility.statusText = `Guaranteed Preference Confirmed for ${deptName}! (GPA: ${specEligibility.gpa31.toFixed(2)} ≥ 2.70, Dept Electives: ${yr3ElectiveDept}/${yr3ElectiveTotal} credits).`;
    }
  }

  return {
    totalGpaCreditsAttempted,
    totalGpaCreditsEarned,
    totalWeightedPoints,
    totalCompulsoryEarned,
    totalElectiveEarned,
    totalRequiredCredits: degInfo.totalMinGpaCredits,
    minElectiveCredits: degInfo.minElectiveCredits,
    minCompulsoryCredits: degInfo.minCompulsoryCredits,
    cgpa: parseFloat(cgpa.toFixed(2)),
    cgpaExact: cgpa,
    classStanding: standing.title,
    classBadgeColor: standing.color,

    realCreditsAttempted,
    realCreditsEarned,
    realWeightedPoints,
    realCgpa: parseFloat(realCgpa.toFixed(2)),
    realCgpaExact: realCgpa,
    realClassStanding: realStanding.title,
    realClassBadgeColor: realStanding.color,

    projectedCgpa: parseFloat(projectedCgpa.toFixed(2)),
    projectedCgpaExact: projectedCgpa,
    projectedCreditsAttempted: totalProjectedCreditsAttempted,
    combinedGpaCreditsAttempted: combinedCredits,
    combinedGpaCreditsEarned: totalGpaCreditsEarned + totalProjectedCreditsEarned,

    hasExpectedCourses: totalExpectedCoursesCount > 0,
    totalExpectedCoursesCount,
    deltaCgpa: parseFloat(deltaCgpa.toFixed(2)),

    ngpaAllPassed,
    unredeemedFailCount,
    semStats,
    deansHonors,
    specEligibility
  };
}

// 7. Analyze User Historical Performance & Usual Entries
export function analyzeUserPerformanceProfile(
  profile: StudentProfile,
  requiredAvgGpa: number
): UserPerformanceProfile {
  const semKeys: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
  const gradeDistribution: Partial<Record<Grade, number>> = {};
  let totalGradedCourses = 0;
  let totalGradedCredits = 0;
  let totalWeightedPoints = 0;

  semKeys.forEach(semKey => {
    (profile.semesters[semKey] || []).forEach(c => {
      // Only count actual entered grades (not NGPA, and not expected)
      if (!c.isNgpa && c.grade && !c.isExpected && GRADING_SCALE[c.grade]) {
        const creds = Number(c.credits) || 0;
        const gpv = calculateCourseGpv(c);
        if (gpv !== null && creds > 0) {
          totalGradedCourses++;
          totalGradedCredits += creds;
          totalWeightedPoints += creds * gpv;
          gradeDistribution[c.grade] = (gradeDistribution[c.grade] || 0) + 1;
        }
      }
    });
  });

  const hasHistoricalData = totalGradedCredits > 0;
  const historicalGpa = hasHistoricalData
    ? parseFloat((totalWeightedPoints / totalGradedCredits).toFixed(2))
    : 3.30;

  // Grade breakdown sorted by count
  const topGrades: Array<{ grade: Grade; count: number; percentage: number }> = Object.entries(gradeDistribution)
    .map(([grade, count]) => ({
      grade: grade as Grade,
      count: count as number,
      percentage: totalGradedCourses > 0 ? Math.round(((count as number) / totalGradedCourses) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count || (GRADING_SCALE[b.grade]?.gpv ?? 0) - (GRADING_SCALE[a.grade]?.gpv ?? 0));

  const usualGrade: Grade = topGrades.length > 0 ? topGrades[0].grade : 'B+';
  const usualGpv = GRADING_SCALE[usualGrade]?.gpv ?? 3.3;

  let usualGradeBand = 'B+ (3.3 GPV)';
  if (historicalGpa >= 3.85) usualGradeBand = 'A+ / A (4.0 GPV)';
  else if (historicalGpa >= 3.65) usualGradeBand = 'A / A- (3.7–4.0 GPV)';
  else if (historicalGpa >= 3.25) usualGradeBand = 'A- / B+ (3.3–3.7 GPV)';
  else if (historicalGpa >= 2.95) usualGradeBand = 'B+ / B (3.0–3.3 GPV)';
  else if (historicalGpa >= 2.65) usualGradeBand = 'B / B- (2.7–3.0 GPV)';
  else usualGradeBand = 'C+ / C (2.0–2.3 GPV)';

  const deltaToTarget = parseFloat((requiredAvgGpa - historicalGpa).toFixed(2));

  let feasibilityRating: UserPerformanceProfile['feasibilityRating'] = 'On Track';
  let feasibilityDescription = '';

  if (requiredAvgGpa <= 0) {
    feasibilityRating = 'Secured';
    feasibilityDescription = 'Already secured by completed course points! Passing grades in remaining modules guarantee this target.';
  } else if (!hasHistoricalData) {
    feasibilityRating = 'Comfortable';
    feasibilityDescription = 'No past grades entered yet. Solvers are calibrated to standard University of Ruhuna Agriculture curriculum expectations.';
  } else if (deltaToTarget <= 0) {
    feasibilityRating = 'Comfortable';
    feasibilityDescription = `Your habitual pace of ${historicalGpa.toFixed(2)} GPV is already above the required ${requiredAvgGpa.toFixed(2)} GPV. Continuing your usual course entries easily delivers this honours standing!`;
  } else if (deltaToTarget <= 0.20) {
    feasibilityRating = 'On Track';
    feasibilityDescription = `Highly realistic. Requires only a minor uplift of +${deltaToTarget.toFixed(2)} GPV over your historical ${historicalGpa.toFixed(2)} GPV average, achievable by securing top marks in high-credit modules.`;
  } else if (deltaToTarget <= 0.45) {
    feasibilityRating = 'Moderate Stretch';
    feasibilityDescription = `Target requires a focused push (+${deltaToTarget.toFixed(2)} GPV above your usual ${historicalGpa.toFixed(2)} pace). Prioritizing Grade A in the 6-credit Research Project and 3-credit modules is critical.`;
  } else if (requiredAvgGpa <= 4.00) {
    feasibilityRating = 'High Intensity';
    feasibilityDescription = `Demanding challenge (+${deltaToTarget.toFixed(2)} GPV above your usual ${historicalGpa.toFixed(2)} pace). Requires near-flawless performance (consistent A/A+ grades across remaining semesters).`;
  } else {
    feasibilityRating = 'Extreme Challenge';
    feasibilityDescription = `Mathematically unattainable within regular remaining credits (requires ${requiredAvgGpa.toFixed(2)} GPV, max is 4.00). Retaking prior courses via repeat exams is necessary to lift prior weighted points.`;
  }

  return {
    historicalGpa,
    totalGradedCourses,
    totalGradedCredits,
    gradeDistribution,
    topGrades,
    usualGrade,
    usualGradeBand,
    deltaToTarget,
    feasibilityRating,
    feasibilityDescription,
    hasHistoricalData
  };
}

// 8. Comprehensive Grade Mix Strategies Solver (Calibrated to Real Courses & User History)
export function solveComprehensiveGradeStrategies(
  profile: StudentProfile,
  targetCgpa: number,
  requiredAvgGpa: number,
  remainingCredits: number,
  userProfile: UserPerformanceProfile,
  currentPoints: number,
  totalRequired: number
): { strategies: ComprehensiveGradeStrategy[]; remainingCoursesList: RemainingCourseTarget[] } {
  const semKeys: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
  const remainingCoursesList: RemainingCourseTarget[] = [];

  // 1. Gather all actual uncompleted courses in student profile
  semKeys.forEach(semKey => {
    const list = profile.semesters[semKey] || [];
    list.forEach(c => {
      if (!c.isNgpa && (!c.grade || c.isExpected)) {
        const creds = Number(c.credits) || 2;
        let tier: RemainingCourseTarget['tier'] = 'standard';
        if (creds >= 6) tier = 'capstone';
        else if (creds === 3) tier = 'core-major';
        else if (creds <= 1) tier = 'minor';

        remainingCoursesList.push({
          code: c.code,
          name: c.name,
          credits: creds,
          dept: c.dept || 'CC',
          semester: semKey,
          isCompulsory: c.isCompulsory ?? true,
          recommendedGrade: 'B+',
          recommendedGpv: 3.3,
          tier
        });
      }
    });
  });

  // If profile has no explicit uncompleted courses yet, generate representative curriculum courses
  if (remainingCoursesList.length === 0 && remainingCredits > 0) {
    let rem = remainingCredits;
    // Capstone 6 Cr
    if (rem >= 6) {
      remainingCoursesList.push({
        code: `${profile.specializationDept || 'CS'}42601`,
        name: `Research Project in ${DEPARTMENTS[profile.specializationDept || 'CS']?.replace('Department of ', '') || 'Agriculture'}`,
        credits: 6,
        dept: profile.specializationDept || 'CS',
        semester: '4-2',
        isCompulsory: true,
        recommendedGrade: 'A',
        recommendedGpv: 4.0,
        tier: 'capstone'
      });
      rem -= 6;
    }
    // Internship 3 Cr
    if (rem >= 3) {
      remainingCoursesList.push({
        code: 'CC42301',
        name: 'Industrial Internship (16 Weeks)',
        credits: 3,
        dept: 'CC',
        semester: '4-2',
        isCompulsory: true,
        recommendedGrade: 'A',
        recommendedGpv: 4.0,
        tier: 'core-major'
      });
      rem -= 3;
    }
    // Remainder in 2-credit and 1-credit courses
    let idx = 1;
    while (rem > 0) {
      const cr = rem === 1 ? 1 : 2;
      remainingCoursesList.push({
        code: `AG${idx}0${cr}01`,
        name: `Core Curriculum Module ${idx}`,
        credits: cr,
        dept: profile.specializationDept || 'CS',
        semester: idx % 2 === 0 ? '4-1' : '3-2',
        isCompulsory: true,
        recommendedGrade: 'B+',
        recommendedGpv: 3.3,
        tier: cr === 1 ? 'minor' : 'standard'
      });
      rem -= cr;
      idx++;
    }
  }

  const effectiveRemainingCredits = remainingCoursesList.reduce((sum, c) => sum + c.credits, 0) || remainingCredits || 1;
  const neededPoints = Math.max(0, targetCgpa * totalRequired - currentPoints);

  // Helper to build a strategy from allocated grades
  const createStrategy = (
    id: string,
    name: string,
    tagline: string,
    description: string,
    badge: string,
    allocator: (course: RemainingCourseTarget) => { grade: Grade; gpv: number }
  ): ComprehensiveGradeStrategy => {
    const allocations = remainingCoursesList.map(c => {
      const res = allocator(c);
      return {
        ...c,
        recommendedGrade: res.grade,
        recommendedGpv: res.gpv
      };
    });

    const strategyPoints = allocations.reduce((sum, c) => sum + c.credits * c.recommendedGpv, 0);
    const achievedAverageGpv = parseFloat((strategyPoints / effectiveRemainingCredits).toFixed(2));
    const achievedCgpa = parseFloat(((currentPoints + strategyPoints) / totalRequired).toFixed(2));

    let difficulty: ComprehensiveGradeStrategy['difficulty'] = 'Moderate';
    if (achievedAverageGpv >= 3.80) difficulty = 'Very High';
    else if (achievedAverageGpv >= 3.50) difficulty = 'Demanding';
    else if (achievedAverageGpv <= 3.10) difficulty = 'Achievable';

    // Tier summaries
    const tierMap: Record<string, { count: number; credits: number; gpvSum: number; grades: Record<string, number> }> = {};
    allocations.forEach(a => {
      const t = a.tier;
      if (!tierMap[t]) tierMap[t] = { count: 0, credits: 0, gpvSum: 0, grades: {} };
      tierMap[t].count++;
      tierMap[t].credits += a.credits;
      tierMap[t].gpvSum += a.credits * a.recommendedGpv;
      tierMap[t].grades[a.recommendedGrade] = (tierMap[t].grades[a.recommendedGrade] || 0) + 1;
    });

    const tierOrder: Array<RemainingCourseTarget['tier']> = ['capstone', 'core-major', 'standard', 'minor'];
    const tierNames: Record<RemainingCourseTarget['tier'], { name: string; weight: number; role: string }> = {
      capstone: { name: 'Final-Year Research Project', weight: 6, role: 'Highest impact anchor (6 Cr)' },
      'core-major': { name: 'Major Core & Internship', weight: 3, role: 'High-leverage practical modules (3 Cr)' },
      standard: { name: 'Standard Theory & Labs', weight: 2, role: 'Foundation departmental courses (2 Cr)' },
      minor: { name: 'Practical & Training Units', weight: 1, role: 'Focused single-credit modules (1 Cr)' }
    };

    const tiers: CreditTierSummary[] = [];
    tierOrder.forEach(t => {
      if (tierMap[t] && tierMap[t].credits > 0) {
        // find dominant grade
        let domGrade: Grade = 'B+';
        let maxCount = -1;
        Object.entries(tierMap[t].grades).forEach(([g, cnt]) => {
          if (cnt > maxCount) {
            maxCount = cnt;
            domGrade = g as Grade;
          }
        });
        const avgGpv = parseFloat((tierMap[t].gpvSum / tierMap[t].credits).toFixed(2));
        tiers.push({
          tierName: tierNames[t].name,
          creditWeight: tierNames[t].weight,
          courseCount: tierMap[t].count,
          totalCredits: tierMap[t].credits,
          recommendedGrade: domGrade,
          gpv: avgGpv,
          role: tierNames[t].role
        });
      }
    });

    // Semester roadmap
    const semMap: Record<SemesterKey, { credits: number; weightedGpv: number; count: number; courses: string[] }> = {} as any;
    allocations.forEach(a => {
      if (!semMap[a.semester]) {
        semMap[a.semester] = { credits: 0, weightedGpv: 0, count: 0, courses: [] };
      }
      semMap[a.semester].credits += a.credits;
      semMap[a.semester].weightedGpv += a.credits * a.recommendedGpv;
      semMap[a.semester].count++;
      if (semMap[a.semester].courses.length < 3) {
        semMap[a.semester].courses.push(a.code);
      }
    });

    const semesterRoadmap: SemesterRoadmapItem[] = Object.entries(semMap)
      .map(([sem, data]) => ({
        semester: sem as SemesterKey,
        credits: data.credits,
        targetSgpa: data.credits > 0 ? parseFloat((data.weightedGpv / data.credits).toFixed(2)) : 0,
        courseCount: data.count,
        keyCourses: data.courses
      }))
      .sort((a, b) => a.semester.localeCompare(b.semester));

    // Grades Breakdown
    const gradesBreakdown: Partial<Record<Grade, { count: number; credits: number }>> = {};
    allocations.forEach(a => {
      if (!gradesBreakdown[a.recommendedGrade]) {
        gradesBreakdown[a.recommendedGrade] = { count: 0, credits: 0 };
      }
      gradesBreakdown[a.recommendedGrade]!.count++;
      gradesBreakdown[a.recommendedGrade]!.credits += a.credits;
    });

    return {
      id,
      name,
      tagline,
      description,
      badge,
      difficulty,
      achievedCgpa,
      achievedAverageGpv,
      tiers,
      semesterRoadmap,
      gradesBreakdown,
      courseAllocations: allocations
    };
  };

  const strategies: ComprehensiveGradeStrategy[] = [];

  // STRATEGY 1: Aligned to User's Usual Entries & Strengths
  const usualGrade = userProfile.hasHistoricalData ? userProfile.usualGrade : 'B+';
  const usualGpv = GRADING_SCALE[usualGrade]?.gpv ?? 3.3;

  strategies.push(
    createStrategy(
      'usual-pace',
      'Usual Pace & Strengths Strategy',
      `Anchored on your historical ${userProfile.usualGradeBand} performance pattern`,
      `Leverages what you usually score in Faculty courses (${usualGrade}), elevating high-credit research and major courses to secure the target without disrupting your habitual study routine.`,
      'Personalized to You',
      (c) => {
        if (c.tier === 'capstone') {
          return requiredAvgGpa >= 3.6 ? { grade: 'A', gpv: 4.0 } : { grade: 'A-', gpv: 3.7 };
        }
        if (c.tier === 'core-major') {
          return requiredAvgGpa >= 3.7 ? { grade: 'A', gpv: 4.0 } : { grade: 'A-', gpv: 3.7 };
        }
        if (requiredAvgGpa >= 3.8) return { grade: 'A', gpv: 4.0 };
        if (requiredAvgGpa >= 3.5) return { grade: 'A-', gpv: 3.7 };
        if (requiredAvgGpa >= 3.2) return { grade: 'B+', gpv: 3.3 };
        return { grade: usualGrade, gpv: usualGpv };
      }
    )
  );

  // STRATEGY 2: High-Credit Capstone Anchor (Research & Internship Focus)
  strategies.push(
    createStrategy(
      'capstone-anchor',
      'Research & Core Anchor Strategy',
      'Ace the 6-Cr Research Project & 3-Cr Internship to ease regular courses',
      'Because the Final Year Research Project carries 6 credits and Internship carries 3 credits (together yielding up to 36 weighted points), securing Grade A in these two modules absorbs the bulk of required points, allowing comfortable B+ or B marks in standard 2-credit classes.',
      'High Leverage',
      (c) => {
        if (c.tier === 'capstone') return { grade: 'A', gpv: 4.0 };
        if (c.tier === 'core-major') return { grade: 'A', gpv: 4.0 };
        // With 6Cr + 3Cr anchored at 4.0, calculate remaining average needed
        const anchorPoints = 6 * 4.0 + 3 * 4.0;
        const nonAnchorCredits = Math.max(1, effectiveRemainingCredits - 9);
        const remAvg = (neededPoints - anchorPoints) / nonAnchorCredits;

        if (remAvg >= 3.7) return { grade: 'A-', gpv: 3.7 };
        if (remAvg >= 3.2) return { grade: 'B+', gpv: 3.3 };
        if (remAvg >= 2.9) return { grade: 'B', gpv: 3.0 };
        return { grade: 'B-', gpv: 2.7 };
      }
    )
  );

  // STRATEGY 3: Balanced Workload Strategy (Uniform Consistency)
  strategies.push(
    createStrategy(
      'balanced-mix',
      'Balanced Workload Distribution',
      'Consistent, steady grade targets across all semesters and units',
      'Spreads the required effort uniformly across all subjects so no single semester or course carries extreme pressure. Ideal for students who prefer a predictable study rhythm.',
      'Steady Rhythm',
      (c) => {
        if (requiredAvgGpa >= 3.85) return { grade: 'A', gpv: 4.0 };
        if (requiredAvgGpa >= 3.55) {
          return c.credits >= 3 ? { grade: 'A', gpv: 4.0 } : { grade: 'A-', gpv: 3.7 };
        }
        if (requiredAvgGpa >= 3.25) {
          return c.credits >= 3 ? { grade: 'A-', gpv: 3.7 } : { grade: 'B+', gpv: 3.3 };
        }
        if (requiredAvgGpa >= 2.95) {
          return c.credits >= 3 ? { grade: 'B+', gpv: 3.3 } : { grade: 'B', gpv: 3.0 };
        }
        return { grade: 'B-', gpv: 2.7 };
      }
    )
  );

  // STRATEGY 4: Honours Safety Buffer (+0.05) & Dean's Honor (≥ B)
  const bufferedTarget = Math.min(4.0, targetCgpa + 0.05);
  strategies.push(
    createStrategy(
      'honours-buffer',
      'Honours Safety Cushion (+0.05)',
      'Built-in safety buffer against exam slips + satisfies Dean’s Honor minimum (≥ B)',
      'Aiming for the exact cutoff leaves zero margin for error. This strategy targets a +0.05 CGPA cushion above the cutoff and strictly keeps every course at Grade B (3.0) or higher, safeguarding both your honours class and Dean’s Honor List standing.',
      'Dean’s Honor Safe',
      (c) => {
        if (bufferedTarget >= 3.7) {
          if (c.tier === 'capstone' || c.tier === 'core-major') return { grade: 'A', gpv: 4.0 };
          return { grade: 'A-', gpv: 3.7 };
        }
        if (bufferedTarget >= 3.3) {
          if (c.tier === 'capstone') return { grade: 'A', gpv: 4.0 };
          return { grade: 'B+', gpv: 3.3 };
        }
        return { grade: 'B', gpv: 3.0 };
      }
    )
  );

  return { strategies, remainingCoursesList };
}

// 9. Solve Concrete Grade Combinations for Target CGPA (Legacy Backward Compatibility)
export function solveConcreteGradeCombinations(
  requiredAvgGpa: number,
  remainingCredits: number
): ConcreteGradeCombination[] {
  if (requiredAvgGpa > 4.0 || requiredAvgGpa <= 0 || remainingCredits <= 0) {
    return [];
  }

  const numCourses = Math.max(1, Math.round(remainingCredits / 2));
  const combinations: ConcreteGradeCombination[] = [];

  const candidates = [
    { grade: 'A', gpv: 4.0 },
    { grade: 'A-', gpv: 3.7 },
    { grade: 'B+', gpv: 3.3 },
    { grade: 'B', gpv: 3.0 },
    { grade: 'B-', gpv: 2.7 },
    { grade: 'C+', gpv: 2.3 },
    { grade: 'C', gpv: 2.0 }
  ];

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const g1 = candidates[i];
      const g2 = candidates[j];

      if (g1.gpv > g2.gpv) {
        const targetSum = numCourses * requiredAvgGpa;
        const kFloat = (targetSum - numCourses * g2.gpv) / (g1.gpv - g2.gpv);
        const k = Math.ceil(kFloat);

        if (k > 0 && k < numCourses) {
          const count1 = k;
          const count2 = numCourses - k;
          const achievedGpa = parseFloat(((count1 * g1.gpv + count2 * g2.gpv) / numCourses).toFixed(2));

          if (achievedGpa >= requiredAvgGpa && achievedGpa - requiredAvgGpa <= 0.20) {
            let difficulty: 'Achievable' | 'Moderate' | 'Demanding' | 'Very High' = 'Moderate';
            if (achievedGpa >= 3.8) difficulty = 'Very High';
            else if (achievedGpa >= 3.5) difficulty = 'Demanding';
            else if (achievedGpa <= 3.0) difficulty = 'Achievable';

            const summary = `${count1} × ${g1.grade} (${g1.gpv.toFixed(1)}) + ${count2} × ${g2.grade} (${g2.gpv.toFixed(1)})`;
            combinations.push({
              summary,
              gradesBreakdown: { [g1.grade]: count1, [g2.grade]: count2 },
              achievedGpa,
              difficulty
            });
          }
        }
      }
    }
  }

  const uniqueCombos: ConcreteGradeCombination[] = [];
  const seen = new Set<string>();
  combinations.forEach(c => {
    if (!seen.has(c.summary) && uniqueCombos.length < 3) {
      seen.add(c.summary);
      uniqueCombos.push(c);
    }
  });

  return uniqueCombos;
}

// 10. Calculate Comprehensive Target GPA Plan
export function calculateTargetGpa(profile: StudentProfile, targetCgpa: number): TargetGpaResult {
  const stats = calculateOverallStats(profile);
  const totalRequired = stats.totalRequiredCredits;
  const attempted = stats.realCreditsAttempted;
  const currentPoints = stats.realWeightedPoints;

  const remainingCredits = Math.max(0, totalRequired - attempted);

  if (remainingCredits === 0) {
    return {
      possible: false,
      message: 'All minimum degree credits (126/125) have already been attempted.'
    };
  }

  const denominator = Math.max(totalRequired, attempted + remainingCredits);
  const neededPoints = targetCgpa * denominator - currentPoints;
  const requiredAverageGpa = neededPoints / remainingCredits;

  const userProfile = analyzeUserPerformanceProfile(profile, requiredAverageGpa);

  if (requiredAverageGpa > 4.0) {
    return {
      possible: false,
      requiredAverageGpa: parseFloat(requiredAverageGpa.toFixed(2)),
      remainingCredits,
      userProfile,
      message: `Mathematically unattainable. You would need an average GPA of ${requiredAverageGpa.toFixed(2)} across the remaining ${remainingCredits} credits (maximum possible is 4.00).`
    };
  }

  if (requiredAverageGpa <= 0) {
    return {
      possible: true,
      requiredAverageGpa: 0,
      remainingCredits,
      userProfile,
      message: `Target already secured! Your current credit points already guarantee a final CGPA of at least ${targetCgpa.toFixed(2)}, provided you earn passing grades in the remaining ${remainingCredits} credits.`
    };
  }

  let suggestion = '';
  if (requiredAverageGpa >= 3.85) {
    suggestion = 'Virtually all A / A+ grades required across remaining courses.';
  } else if (requiredAverageGpa >= 3.65) {
    suggestion = 'A strong majority of A grades with some A- grades required.';
  } else if (requiredAverageGpa >= 3.25) {
    suggestion = 'Consistent mix of A- and B+ grades required.';
  } else if (requiredAverageGpa >= 2.95) {
    suggestion = 'Solid B and B+ grades will achieve this milestone.';
  } else {
    suggestion = 'Maintaining C+ or B- grades will comfortably satisfy this goal.';
  }

  const combinations = solveConcreteGradeCombinations(requiredAverageGpa, remainingCredits);
  const { strategies, remainingCoursesList } = solveComprehensiveGradeStrategies(
    profile,
    targetCgpa,
    requiredAverageGpa,
    remainingCredits,
    userProfile,
    currentPoints,
    totalRequired
  );

  return {
    possible: true,
    requiredAverageGpa: parseFloat(requiredAverageGpa.toFixed(2)),
    remainingCredits,
    remainingCoursesCount: remainingCoursesList.length,
    suggestion,
    combinations,
    userProfile,
    strategies,
    remainingCoursesList,
    message: `You need to average a ${requiredAverageGpa.toFixed(2)} SGPA across your remaining ${remainingCredits} credits. ${suggestion}`
  };
}

// 9. Academic Risk and Regulations Alerts
export function calculateAcademicRiskAlerts(profile: StudentProfile): RegulationRiskAlert[] {
  const alerts: RegulationRiskAlert[] = [];
  const stats = calculateOverallStats(profile);
  const semKeys: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

  // 1. Fail grades (E)
  const failCourses: string[] = [];
  semKeys.forEach(semKey => {
    (profile.semesters[semKey] || []).forEach(c => {
      if (!c.isNgpa && c.grade === 'E' && !c.isExpected) {
        failCourses.push(`${c.code} (${semKey})`);
      }
    });
  });

  if (failCourses.length > 0) {
    alerts.push({
      level: 'danger',
      title: 'Active Fail (E) Grade(s) Detected',
      message: `You have ${failCourses.length} course(s) with an active E grade: ${failCourses.join(', ')}. Under University of Ruhuna regulations, all E grades must be repeated and cleared for degree conferment.`,
      affectedCourses: failCourses
    });
  }

  // 2. High volume of conditional passes (D / D+)
  const conditionalCourses: string[] = [];
  semKeys.forEach(semKey => {
    (profile.semesters[semKey] || []).forEach(c => {
      if (!c.isNgpa && (c.grade === 'D' || c.grade === 'D+') && !c.isExpected) {
        conditionalCourses.push(`${c.code} [${c.grade}]`);
      }
    });
  });

  if (conditionalCourses.length > 2) {
    alerts.push({
      level: 'warning',
      title: 'Multiple Conditional Passes (D / D+)',
      message: `You have ${conditionalCourses.length} conditional passes: ${conditionalCourses.join(', ')}. While considered passing, conditional grades pull down your CGPA. Consider re-sitting them if eligible.`,
      affectedCourses: conditionalCourses
    });
  }

  // 3. Academic Probation check (CGPA < 2.00)
  if (stats.totalGpaCreditsAttempted >= 15 && stats.cgpa < 2.00) {
    alerts.push({
      level: 'danger',
      title: 'Academic Probation Warning',
      message: `Your cumulative GPA (${stats.cgpa.toFixed(2)}) is below 2.00. Under Faculty regulations, maintaining a CGPA below 2.00 places a student on academic warning or probation.`
    });
  }

  // 4. Non-GPA completeness
  const pendingNgpa: string[] = [];
  (profile.orientationCourses || []).forEach(c => {
    if (!c.grade || (GRADING_SCALE[c.grade]?.gpv ?? 0) < 1.7) {
      pendingNgpa.push(c.code);
    }
  });

  if (pendingNgpa.length > 0) {
    alerts.push({
      level: 'info',
      title: 'Compulsory Non-GPA Courses Incomplete',
      message: `${pendingNgpa.length} orientation or English module(s) still require a passing grade (minimum C-): ${pendingNgpa.join(', ')}.`,
      affectedCourses: pendingNgpa
    });
  }

  // 5. Potential Future Risks (Projected expected fail grades)
  const projectedFailCourses: string[] = [];
  semKeys.forEach(semKey => {
    (profile.semesters[semKey] || []).forEach(c => {
      if (!c.isNgpa && c.grade === 'E' && c.isExpected) {
        projectedFailCourses.push(`${c.code} (${semKey})`);
      }
    });
  });

  if (projectedFailCourses.length > 0) {
    alerts.push({
      level: 'warning',
      title: 'Potential Future Risk: Expected Fail (E) Grade',
      message: `You have entered an expected E grade for ${projectedFailCourses.join(', ')}. If confirmed, this course must be repeated for graduation.`,
      affectedCourses: projectedFailCourses
    });
  }

  // 6. Potential Future Risk: Projected CGPA below 2.00
  if (
    stats.hasExpectedCourses &&
    stats.combinedGpaCreditsAttempted &&
    stats.combinedGpaCreditsAttempted >= 15 &&
    stats.projectedCgpa !== undefined &&
    stats.projectedCgpa < 2.00 &&
    stats.cgpa >= 2.00
  ) {
    alerts.push({
      level: 'warning',
      title: 'Potential Future Risk: Projected CGPA Below 2.00',
      message: `Your estimated CGPA (${stats.projectedCgpa.toFixed(2)}) based on projected grades falls below 2.00. Focus on upcoming assessments to safeguard your academic standing.`
    });
  }

  // 7. Positive clearance (Only when confirmed record has zero actual alerts)
  if (alerts.length === 0 && stats.totalGpaCreditsAttempted > 0) {
    alerts.push({
      level: 'success',
      title: 'Academic Record in Good Standing 🌿',
      message: 'Zero fail grades, no probation flags, and all core degree progression criteria are currently satisfied!'
    });
  }

  return alerts;
}

// 10. Repeat Grade Upgrade Impact Calculator
export function calculateRepeatImpact(
  profile: StudentProfile,
  courseCode: string,
  targetGrade: Grade,
  isExcused = false
): RepeatImpactResult | null {
  let foundCourse: Course | null = null;
  let semFound: SemesterKey = '1-1';

  const semKeys: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
  semKeys.forEach(semKey => {
    (profile.semesters[semKey] || []).forEach(c => {
      if (c.code === courseCode) {
        foundCourse = c;
        semFound = semKey;
      }
    });
  });

  if (!foundCourse) {
    return null;
  }
  const targetCourse: Course = foundCourse;
  if (!targetCourse.grade) {
    return null;
  }

  const credits = Number(targetCourse.credits) || 0;
  const oldGpv = calculateCourseGpv(targetCourse) ?? 0;

  let newGpv = GRADING_SCALE[targetGrade]?.gpv ?? 0;
  if (!isExcused && newGpv > 2.0) {
    newGpv = 2.0; // Repeat cap rule: Max Grade C (2.0)
  }

  const deltaGpv = newGpv - oldGpv;
  const deltaPoints = deltaGpv * credits;

  const currentStats = calculateOverallStats(profile);
  const currentPoints = currentStats.totalWeightedPoints;
  const attempted = currentStats.totalGpaCreditsAttempted;

  const projectedPoints = currentPoints + deltaPoints;
  const projectedCgpa = attempted > 0 ? projectedPoints / attempted : 0;
  const deltaCgpa = projectedCgpa - currentStats.cgpa;

  const oldStanding = getClassStanding(currentStats.cgpa, attempted);
  const newStanding = getClassStanding(projectedCgpa, attempted);

  return {
    courseCode,
    courseName: targetCourse.name,
    credits,
    semester: semFound,
    oldGrade: targetCourse.grade,
    oldGpv: parseFloat(oldGpv.toFixed(2)),
    targetGrade,
    newGpv: parseFloat(newGpv.toFixed(2)),
    deltaGpv: parseFloat(deltaGpv.toFixed(2)),
    deltaPoints: parseFloat(deltaPoints.toFixed(2)),
    currentCgpa: currentStats.cgpa,
    projectedCgpa: parseFloat(projectedCgpa.toFixed(2)),
    deltaCgpa: parseFloat(deltaCgpa.toFixed(2)),
    oldStanding: oldStanding.title,
    newStanding: newStanding.title,
    classChanged: oldStanding.title !== newStanding.title
  };
}

// 11. What-If Simulation Engine
export function calculateWhatIf(profile: StudentProfile, simulatedUpcomingSgpa: number): WhatIfResult {
  const currentStats = calculateOverallStats(profile);
  const baselineCredits = currentStats.realCreditsAttempted;
  const baselinePoints = currentStats.realWeightedPoints;
  const baselineCgpa = currentStats.realCgpa;
  const remainingCredits = Math.max(0, currentStats.totalRequiredCredits - baselineCredits);

  const additionalPoints = simulatedUpcomingSgpa * remainingCredits;
  const totalPoints = baselinePoints + additionalPoints;
  const totalCredits = Math.max(currentStats.totalRequiredCredits, baselineCredits + remainingCredits);
  const projectedCgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  const standing = getClassStanding(projectedCgpa, totalCredits);

  return {
    currentCgpa: baselineCgpa,
    remainingCredits,
    simulatedSgpa: simulatedUpcomingSgpa,
    projectedCgpa: parseFloat(projectedCgpa.toFixed(2)),
    projectedStanding: standing.title,
    standingColor: standing.color,
    deltaCgpa: parseFloat((projectedCgpa - baselineCgpa).toFixed(2))
  };
}

// 12. Degree Audit Checklist Generator
export function generateDegreeAudit(profile: StudentProfile): DegreeAuditResult {
  const stats = calculateOverallStats(profile);
  const degInfo = DEGREE_INFO[profile.degree] || DEGREE_INFO.ARMT;

  const items = [
    {
      title: 'Total Degree GPA Credits',
      requirement: `Minimum ${degInfo.totalMinGpaCredits} Credits`,
      current: `${stats.realCreditsEarned} / ${degInfo.totalMinGpaCredits} Credits`,
      passed: stats.realCreditsEarned >= degInfo.totalMinGpaCredits
    },
    {
      title: 'Compulsory Course Credits',
      requirement: `Minimum ${degInfo.minCompulsoryCredits} Credits`,
      current: `${stats.totalCompulsoryEarned} / ${degInfo.minCompulsoryCredits} Credits`,
      passed: stats.totalCompulsoryEarned >= degInfo.minCompulsoryCredits
    },
    {
      title: 'Elective Course Credits',
      requirement: `Minimum ${degInfo.minElectiveCredits} Credits`,
      current: `${stats.totalElectiveEarned} / ${degInfo.minElectiveCredits} Credits`,
      passed: stats.totalElectiveEarned >= degInfo.minElectiveCredits
    },
    {
      title: 'Compulsory Non-GPA Courses (Pass mark ≥ C-)',
      requirement: 'All 5 Orientation & English Modules (CC10001-5, CC11202, CC12101, CC12202)',
      current: stats.ngpaAllPassed ? 'All Passed (Grade ≥ C-)' : 'Pending / Not cleared',
      passed: stats.ngpaAllPassed
    },
    {
      title: 'No Active Unredeemed Fail Grades (E)',
      requirement: '0 active E grades remaining',
      current: `${stats.unredeemedFailCount} active fail grade(s)`,
      passed: stats.unredeemedFailCount === 0
    },
    {
      title: 'Minimum Cumulative GPA (CGPA) for Degree Award',
      requirement: 'CGPA ≥ 2.00 (General Pass)',
      current: `CGPA: ${stats.realCgpa.toFixed(2)} (${stats.realClassStanding})`,
      passed: stats.realCreditsAttempted > 0 && stats.realCgpa >= 2.00
    }
  ];

  return {
    allPassed: items.every(item => item.passed),
    items,
    degreeCode: profile.degree,
    degreeName: degInfo.name
  };
}

// 13. Create default semester courses for a given degree programme
export function initDefaultCoursesForDegree(
  degreeCode: DegreeCode,
  specializationDept = 'CS'
): Record<SemesterKey, Course[]> {
  const compCourses = DEGREE_COMPULSORY_COURSES[degreeCode] || {};
  const newSemesters: Record<SemesterKey, Course[]> = {} as any;
  const semKeys: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

  semKeys.forEach(semKey => {
    newSemesters[semKey] = [];
    const codes = compCourses[semKey] || [];
    codes.forEach(code => {
      const info: any = COURSE_CATALOG[code] || parseCourseCode(code) || {
        code,
        name: code,
        credits: 2,
        dept: 'CC',
        isNgpa: false
      };
      newSemesters[semKey].push({
        code: info.code,
        name: info.name || info.code,
        credits: info.credits,
        dept: info.dept || (parseCourseCode(info.code) ? parseCourseCode(info.code)?.dept : 'CC'),
        isNgpa: !!info.isNgpa,
        isCompulsory: true,
        grade: '',
        isRepeat: false,
        isExcused: false,
        isExpected: false
      });
    });

    // Specialization in 4-1 for ARMT and ABM
    if (semKey === '4-1' && (degreeCode === 'ARMT' || degreeCode === 'ABM')) {
      const spec = SPECIALIZATION_STREAMS[specializationDept || 'CS'];
      if (spec && spec.courses) {
        spec.courses.forEach(code => {
          const info = COURSE_CATALOG[code] || { code, name: code, credits: 2, dept: spec.dept };
          newSemesters[semKey].push({
            code: info.code,
            name: info.name,
            credits: info.credits,
            dept: spec.dept,
            isNgpa: false,
            isCompulsory: true,
            isSpecialization: true,
            grade: '',
            isRepeat: false,
            isExcused: false,
            isExpected: false
          });
        });
      }
    }

    // Research project in 4-2
    if (semKey === '4-2') {
      const specDept = specializationDept || 'CS';
      const resCode = degreeCode === 'GT' ? 'EN42601' : SPECIALIZATION_STREAMS[specDept]?.researchCode || 'CS42601';
      const resInfo = COURSE_CATALOG[resCode] || {
        code: resCode,
        name: 'Research Project',
        credits: 6,
        dept: degreeCode === 'GT' ? 'EN' : specDept
      };
      const exists = newSemesters[semKey].some(c => c.code === resCode);
      if (!exists) {
        newSemesters[semKey].unshift({
          code: resInfo.code,
          name: resInfo.name,
          credits: resInfo.credits,
          dept: resInfo.dept,
          isNgpa: false,
          isCompulsory: true,
          grade: '',
          isRepeat: false,
          isExcused: false,
          isExpected: false
        });
      }
    }
  });

  return newSemesters;
}

// 14. Initial Orientation Courses
export function initOrientationCourses(): Course[] {
  return [
    { code: 'CC10001', name: 'General English', credits: 0, dept: 'CC', grade: 'C-', isNgpa: true },
    { code: 'CC10002', name: 'Computer Awareness', credits: 0, dept: 'CC', grade: 'C-', isNgpa: true },
    { code: 'CC10003', name: 'Basic Mathematics', credits: 0, dept: 'CC', grade: 'C-', isNgpa: true },
    { code: 'CC10004', name: 'Basic Statistics', credits: 0, dept: 'CC', grade: 'C-', isNgpa: true },
    { code: 'CC10005', name: 'Career Development and Active Citizen', credits: 0, dept: 'CC', grade: 'C-', isNgpa: true }
  ];
}

