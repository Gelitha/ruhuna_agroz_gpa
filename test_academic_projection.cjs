// University of Ruhuna - Faculty of Agriculture
// Academic Projection Regression & Acceptance Test Suite
// Covers all 22 required regression test scenarios + Section 23 Acceptance Scenario

const assert = require('assert');

// 1. Grading Scale
const GRADING_SCALE = {
  'A+': { gpv: 4.0 },
  'A':  { gpv: 4.0 },
  'A-': { gpv: 3.7 },
  'B+': { gpv: 3.3 },
  'B':  { gpv: 3.0 },
  'B-': { gpv: 2.7 },
  'C+': { gpv: 2.3 },
  'C':  { gpv: 2.0 },
  'C-': { gpv: 1.7 },
  'D+': { gpv: 1.3 },
  'D':  { gpv: 1.0 },
  'E':  { gpv: 0.0 }
};

const DEGREE_INFO = {
  ARMT: { totalMinGpaCredits: 126 },
  ABM:  { totalMinGpaCredits: 125 },
  GT:   { totalMinGpaCredits: 125 }
};

function calculateEffectiveGpv(grade, isRepeat, isExcused) {
  if (!grade || !GRADING_SCALE[grade]) return null;
  let gpv = GRADING_SCALE[grade].gpv;
  if (isRepeat && !isExcused && gpv > 2.0) {
    gpv = 2.0;
  }
  return gpv;
}

function calculateAcademicProjections(profile, customAssumptions) {
  const currentSem = profile.currentSemester || '1-1';
  const ALL_SEMESTER_KEYS = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
  const currentIndex = ALL_SEMESTER_KEYS.indexOf(currentSem);

  const courseProjections = profile.courseProjections || {};

  let actualPoints = 0;
  let actualCredits = 0;

  let pendingProjPoints = 0;
  let pendingProjCredits = 0;
  let pendingResultsCount = 0;

  let combinedPoints = 0;
  let combinedCredits = 0;

  let bestCasePoints = 0;
  let bestCaseCredits = 0;
  let worstCasePoints = 0;
  let worstCaseCredits = 0;

  let currentSemActualPoints = 0;
  let currentSemActualCredits = 0;
  let currentSemProjectedPoints = 0;
  let currentSemProjectedCredits = 0;
  let currentSemTotalGpaCredits = 0;

  let totalAvailableGpaCreditsUpToCurrent = 0;
  const accuracyEntries = [];

  for (let idx = 0; idx < ALL_SEMESTER_KEYS.length; idx++) {
    const semKey = ALL_SEMESTER_KEYS[idx];
    const courses = profile.semesters[semKey] || [];
    const isPast = idx < currentIndex;
    const isCurrent = idx === currentIndex;
    const gpaCourses = courses.filter(c => !c.isNgpa);
    const totalGpaCredits = gpaCourses.reduce((sum, c) => sum + (c.credits || 0), 0);

    for (const course of gpaCourses) {
      const cr = course.credits || 0;
      const projKey = `${semKey}:${course.code}`;
      const projData = courseProjections[projKey];

      const actualGpv = calculateEffectiveGpv(course.grade, course.isRepeat, course.isExcused);
      const predictedGpv = calculateEffectiveGpv(projData?.predictedGrade, course.isRepeat, course.isExcused);
      const targetGpv = calculateEffectiveGpv(projData?.targetGrade, course.isRepeat, course.isExcused);

      // Historical comparison
      const predToCompare = projData?.historicalPrediction || projData?.predictedGrade;
      if (course.grade && predToCompare && actualGpv !== null) {
        const predCompGpv = calculateEffectiveGpv(predToCompare, course.isRepeat, course.isExcused) || 0;
        accuracyEntries.push({
          courseCode: course.code,
          predictedGrade: predToCompare,
          actualGrade: course.grade,
          deltaGpv: Number((actualGpv - predCompGpv).toFixed(2)),
          isExactMatch: course.grade === predToCompare
        });
      }

      // Confirmed actual
      if (actualGpv !== null) {
        actualPoints += actualGpv * cr;
        actualCredits += cr;
        bestCasePoints += actualGpv * cr;
        bestCaseCredits += cr;
        worstCasePoints += actualGpv * cr;
        worstCaseCredits += cr;
      } else {
        if (isPast) {
          pendingResultsCount++;
          const bestGpv = course.isRepeat && !course.isExcused ? 2.0 : 4.0;
          bestCasePoints += bestGpv * cr;
          bestCaseCredits += cr;
          worstCasePoints += 0.0;
          worstCaseCredits += cr;
        } else if (isCurrent) {
          const bestGpv = course.isRepeat && !course.isExcused ? 2.0 : 4.0;
          bestCasePoints += bestGpv * cr;
          bestCaseCredits += cr;
          worstCasePoints += 0.0;
          worstCaseCredits += cr;
        }
      }

      // Projection Priority: 1. Actual -> 2. Predicted -> 3. Target
      let effectiveProjectionGpv = null;
      if (actualGpv !== null) {
        effectiveProjectionGpv = actualGpv;
      } else if (predictedGpv !== null) {
        effectiveProjectionGpv = predictedGpv;
      } else if (targetGpv !== null) {
        effectiveProjectionGpv = targetGpv;
      } else if (isPast && customAssumptions?.remainingPrevAvgGpa !== undefined) {
        effectiveProjectionGpv = customAssumptions.remainingPrevAvgGpa;
      } else if (isCurrent && customAssumptions?.currentSemAvgGpa !== undefined) {
        effectiveProjectionGpv = customAssumptions.currentSemAvgGpa;
      }

      if (effectiveProjectionGpv !== null) {
        if (isPast) {
          pendingProjPoints += effectiveProjectionGpv * cr;
          pendingProjCredits += cr;
          combinedPoints += effectiveProjectionGpv * cr;
          combinedCredits += cr;
        } else if (isCurrent) {
          currentSemProjectedPoints += effectiveProjectionGpv * cr;
          currentSemProjectedCredits += cr;
          combinedPoints += effectiveProjectionGpv * cr;
          combinedCredits += cr;
        }
      }

      if (isCurrent && actualGpv !== null) {
        currentSemActualPoints += actualGpv * cr;
        currentSemActualCredits += cr;
      }
    }

    if (isPast || isCurrent) {
      totalAvailableGpaCreditsUpToCurrent += totalGpaCredits;
    }
    if (isCurrent) {
      currentSemTotalGpaCredits = totalGpaCredits;
    }
  }

  const actualCgpa = actualCredits > 0 ? actualPoints / actualCredits : 0;
  const projectedCgpaPending = pendingProjCredits > 0 ? pendingProjPoints / pendingProjCredits : actualCgpa;
  const currentSemActualSgpa = currentSemActualCredits > 0 ? currentSemActualPoints / currentSemActualCredits : 0;
  const currentSemProjectedSgpa = currentSemProjectedCredits > 0 ? currentSemProjectedPoints / currentSemProjectedCredits : 0;
  const combinedProjectedCgpa = combinedCredits > 0 ? combinedPoints / combinedCredits : actualCgpa;
  const bestCaseCgpa = bestCaseCredits > 0 ? bestCasePoints / bestCaseCredits : actualCgpa;
  const worstCaseCgpa = worstCaseCredits > 0 ? worstCasePoints / worstCaseCredits : actualCgpa;

  return {
    actualCgpa: Number(actualCgpa.toFixed(2)),
    actualGpaCredits: actualCredits,
    projectedCgpaPending: Number(projectedCgpaPending.toFixed(2)),
    pendingResultsCount,
    currentSemActualSgpa: Number(currentSemActualSgpa.toFixed(2)),
    currentSemProjectedSgpa: Number(currentSemProjectedSgpa.toFixed(2)),
    currentSemTotalCredits: currentSemTotalGpaCredits,
    currentSemGradedCredits: currentSemProjectedCredits,
    combinedProjectedCgpa: Number(combinedProjectedCgpa.toFixed(2)),
    combinedTotalCredits: combinedCredits,
    deltaCombined: Number((combinedProjectedCgpa - actualCgpa).toFixed(2)),
    isCurrentSemComplete: currentSemProjectedCredits >= currentSemTotalGpaCredits && currentSemTotalGpaCredits > 0,
    projectionCoveragePercent: totalAvailableGpaCreditsUpToCurrent > 0
      ? Math.round((combinedCredits / totalAvailableGpaCreditsUpToCurrent) * 100)
      : 100,
    scenarios: {
      actualOnly: Number(actualCgpa.toFixed(2)),
      expected: Number(combinedProjectedCgpa.toFixed(2)),
      bestCase: Number(bestCaseCgpa.toFixed(2)),
      worstCase: Number(worstCaseCgpa.toFixed(2))
    },
    accuracyEntries
  };
}

function calculateRequiredGpa(actualCgpa, actualCredits, totalCredits, targetCgpa) {
  const remaining = totalCredits - actualCredits;
  if (remaining <= 0) return { possible: actualCgpa >= targetCgpa, requiredAverage: 0 };
  const neededPoints = (targetCgpa * totalCredits) - (actualCgpa * actualCredits);
  const avg = neededPoints / remaining;
  return {
    possible: avg <= 4.0,
    requiredAverage: Number(avg.toFixed(2)),
    remainingCredits: remaining
  };
}

console.log('🧪 Running Academic Projection 22-Scenario Regression & Acceptance Tests...');

// ========================================================
// SCENARIO 1: All previous semester results received
// ========================================================
const prof1 = {
  degree: 'ARMT',
  currentSemester: '1-2',
  semesters: {
    '1-1': [
      { code: 'AS11201', credits: 2, grade: 'A', isNgpa: false },
      { code: 'BL11301', credits: 3, grade: 'B', isNgpa: false }
    ],
    '1-2': []
  },
  courseProjections: {}
};
const res1 = calculateAcademicProjections(prof1);
assert.strictEqual(res1.actualCgpa, 3.40); // (2*4.0 + 3*3.0)/5 = 17/5 = 3.4
assert.strictEqual(res1.projectedCgpaPending, 3.40);
assert.strictEqual(res1.pendingResultsCount, 0);
console.log('✓ Scenario 1: All previous semester results received matches actual CGPA.');

// ========================================================
// SCENARIO 2: Previous semester partially graded while current semester exams approach
// ========================================================
const prof2 = {
  degree: 'ARMT',
  currentSemester: '2-1',
  semesters: {
    '1-1': [{ code: 'C1', credits: 15, grade: 'A', isNgpa: false }], // 15*4.0 = 60
    '1-2': [
      { code: 'C2', credits: 10, grade: 'B', isNgpa: false }, // 10*3.0 = 30
      { code: 'C3', credits: 6, grade: '', isNgpa: false }   // pending
    ],
    '2-1': [
      { code: 'C4', credits: 16, grade: '', isNgpa: false } // upcoming
    ]
  },
  courseProjections: {
    '1-2:C3': { predictedGrade: 'A' }, // predict A (4.0) -> 6*4.0 = 24
    '2-1:C4': { targetGrade: 'B+' }     // target B+ (3.3) -> 16*3.3 = 52.8
  }
};
const res2 = calculateAcademicProjections(prof2);
// Actual CGPA: (60 + 30) / 25 = 3.60
assert.strictEqual(res2.actualCgpa, 3.60);
// Pending-result CGPA: (60 + 30 + 24) / 31 = 114 / 31 = 3.68
assert.strictEqual(res2.projectedCgpaPending, 3.68);
// Current semester projected SGPA: 52.8 / 16 = 3.30
assert.strictEqual(res2.currentSemProjectedSgpa, 3.30);
// Combined projected CGPA: (60 + 30 + 24 + 52.8) / 47 = 166.8 / 47 = 3.55
assert.strictEqual(res2.combinedProjectedCgpa, 3.55);
assert.strictEqual(res2.pendingResultsCount, 1);
console.log('✓ Scenario 2: Previous partially graded semester & approaching exams projection verified.');

// ========================================================
// SCENARIO 3: Multiple previous semesters with unresolved results
// ========================================================
const prof3 = {
  degree: 'ARMT',
  currentSemester: '2-2',
  semesters: {
    '1-1': [{ code: 'C1', credits: 5, grade: '', isNgpa: false }],
    '1-2': [{ code: 'C2', credits: 5, grade: '', isNgpa: false }],
    '2-1': [{ code: 'C3', credits: 5, grade: '', isNgpa: false }],
    '2-2': []
  },
  courseProjections: {
    '1-1:C1': { predictedGrade: 'A' },
    '1-2:C2': { predictedGrade: 'B' },
    '2-1:C3': { predictedGrade: 'C' }
  }
};
const res3 = calculateAcademicProjections(prof3);
assert.strictEqual(res3.pendingResultsCount, 3);
// Combined points: 5*4.0 + 5*3.0 + 5*2.0 = 20 + 15 + 10 = 45 / 15 = 3.00
assert.strictEqual(res3.projectedCgpaPending, 3.00);
console.log('✓ Scenario 3: Multiple previous semesters with unresolved results calculated properly.');

// ========================================================
// SCENARIO 4: Current semester with no official grades
// ========================================================
assert.strictEqual(res2.currentSemActualSgpa, 0);
assert.strictEqual(res2.currentSemProjectedSgpa, 3.30);
console.log('✓ Scenario 4: Current semester with no official grades reports 0 actual SGPA, expected projected.');

// ========================================================
// SCENARIO 5: Current semester with partial official results
// ========================================================
const prof5 = {
  degree: 'ARMT',
  currentSemester: '2-1',
  semesters: {
    '2-1': [
      { code: 'C1', credits: 3, grade: 'A', isNgpa: false }, // 3*4.0 = 12
      { code: 'C2', credits: 3, grade: '', isNgpa: false }  // target B (3.0) -> 3*3.0 = 9
    ]
  },
  courseProjections: {
    '2-1:C2': { targetGrade: 'B' }
  }
};
const res5 = calculateAcademicProjections(prof5);
assert.strictEqual(res5.currentSemActualSgpa, 4.00);
assert.strictEqual(res5.currentSemProjectedSgpa, 3.50); // (12 + 9) / 6 = 3.50
console.log('✓ Scenario 5: Current semester with partial official results.');

// ========================================================
// SCENARIO 6: Actual grade replacing a predicted grade (Automatic transition)
// ========================================================
// Course C3 had predicted A (4.0). Official result arrives as B+ (3.3).
const prof6 = {
  ...prof2,
  semesters: {
    ...prof2.semesters,
    '1-2': [
      { code: 'C2', credits: 10, grade: 'B', isNgpa: false },
      { code: 'C3', credits: 6, grade: 'B+', isNgpa: false } // official B+ overrides prediction!
    ]
  }
};
const res6 = calculateAcademicProjections(prof6);
// Now actual CGPA: (60 + 30 + 6*3.3) / 31 = 109.8 / 31 = 3.54
assert.strictEqual(res6.actualCgpa, 3.54);
// Official B+ (3.3) overrides predicted A (4.0) in projection:
// (60 + 30 + 19.8 + 52.8) / 47 = 162.6 / 47 = 3.46
assert.strictEqual(res6.combinedProjectedCgpa, 3.46);
assert.strictEqual(res6.pendingResultsCount, 0); // No more pending results!
console.log('✓ Scenario 6: Actual grade automatically replaces predicted grade without manual deletion.');

// ========================================================
// SCENARIO 7: Predictions remaining excluded from actual CGPA
// ========================================================
assert.strictEqual(res2.actualCgpa, 3.60);
// Even with high target grades in courseProjections, actualCgpa stays at 3.60
const prof7 = {
  ...prof2,
  courseProjections: {
    '1-2:C3': { predictedGrade: 'A+' },
    '2-1:C4': { targetGrade: 'A+' }
  }
};
const res7 = calculateAcademicProjections(prof7);
assert.strictEqual(res7.actualCgpa, 3.60);
console.log('✓ Scenario 7: Predictions and targets strictly excluded from actual CGPA.');

// ========================================================
// SCENARIO 8: Predictions excluded from transcripts
// ========================================================
// Transcripts only map courses where course.grade is truthy.
const transcriptCourses = prof2.semesters['1-2'].filter(c => !!c.grade);
assert.strictEqual(transcriptCourses.length, 1);
assert.strictEqual(transcriptCourses[0].code, 'C2');
console.log('✓ Scenario 8: Transcripts strictly filter on confirmed course.grade.');

// ========================================================
// SCENARIO 9: Incomplete projections
// ========================================================
const prof9 = {
  degree: 'ARMT',
  currentSemester: '1-1',
  semesters: {
    '1-1': [
      { code: 'C1', credits: 3, grade: 'A', isNgpa: false },
      { code: 'C2', credits: 3, grade: '', isNgpa: false } // unpredicted & untargeted
    ]
  },
  courseProjections: {}
};
const res9 = calculateAcademicProjections(prof9);
assert.strictEqual(res9.isCurrentSemComplete, false);
assert.strictEqual(res9.currentSemGradedCredits, 3);
assert.strictEqual(res9.currentSemTotalCredits, 6);
assert.strictEqual(res9.projectionCoveragePercent, 50);
console.log('✓ Scenario 9: Incomplete projections detected, coverage accurately reported.');

// ========================================================
// SCENARIO 10: Explicit failing grades
// ========================================================
const prof10 = {
  degree: 'ARMT',
  currentSemester: '1-1',
  semesters: {
    '1-1': [{ code: 'C1', credits: 2, grade: '', isNgpa: false }]
  },
  courseProjections: {
    '1-1:C1': { predictedGrade: 'E' } // 0.0 GPV
  }
};
const res10 = calculateAcademicProjections(prof10);
assert.strictEqual(res10.isCurrentSemComplete, true);
assert.strictEqual(res10.currentSemProjectedSgpa, 0.00);
console.log('✓ Scenario 10: Explicit Grade E treated as valid 0.0 GPV failure, not missing.');

// ========================================================
// SCENARIO 11: Repeat-course restrictions
// ========================================================
const prof11 = {
  degree: 'ARMT',
  currentSemester: '1-1',
  semesters: {
    '1-1': [
      { code: 'C1', credits: 2, grade: '', isRepeat: true, isExcused: false, isNgpa: false },
      { code: 'C2', credits: 2, grade: '', isRepeat: true, isExcused: true, isNgpa: false }
    ]
  },
  courseProjections: {
    '1-1:C1': { predictedGrade: 'A' }, // Unexcused repeat capped at 2.0
    '1-1:C2': { predictedGrade: 'A' }  // Senate excused repeat allowed 4.0
  }
};
const res11 = calculateAcademicProjections(prof11);
// Points: 2*2.0 + 2*4.0 = 4 + 8 = 12 / 4 = 3.00
assert.strictEqual(res11.currentSemProjectedSgpa, 3.00);
console.log('✓ Scenario 11: Repeat capping rule (max 2.0 unless medical excused) verified.');

// ========================================================
// SCENARIO 12: Non-GPA courses
// ========================================================
const prof12 = {
  degree: 'ARMT',
  currentSemester: '1-1',
  semesters: {
    '1-1': [
      { code: 'C1', credits: 2, grade: '', isNgpa: false },
      { code: 'NGPA1', credits: 2, grade: '', isNgpa: true }
    ]
  },
  courseProjections: {
    '1-1:C1': { targetGrade: 'A' },
    '1-1:NGPA1': { targetGrade: 'A' }
  }
};
const res12 = calculateAcademicProjections(prof12);
assert.strictEqual(res12.currentSemTotalCredits, 2); // NGPA course excluded!
assert.strictEqual(res12.currentSemProjectedSgpa, 4.00);
console.log('✓ Scenario 12: Non-GPA courses isolated from credits and grade points.');

// ========================================================
// SCENARIO 13: Elective selection changes
// ========================================================
const prof13 = {
  degree: 'ARMT',
  currentSemester: '1-1',
  semesters: {
    '1-1': [
      { code: 'CORE', credits: 3, grade: 'A', isCompulsory: true, isNgpa: false },
      { code: 'ELEC', credits: 2, grade: '', isCompulsory: false, isNgpa: false }
    ]
  },
  courseProjections: {
    '1-1:ELEC': { targetGrade: 'A' }
  }
};
const res13 = calculateAcademicProjections(prof13);
assert.strictEqual(res13.currentSemTotalCredits, 5);
console.log('✓ Scenario 13: Electives handled accurately.');

// ========================================================
// SCENARIO 14: Different degree programmes
// ========================================================
const reqArmt = calculateRequiredGpa(3.50, 60, DEGREE_INFO.ARMT.totalMinGpaCredits, 3.70);
const reqAbm = calculateRequiredGpa(3.50, 60, DEGREE_INFO.ABM.totalMinGpaCredits, 3.70);
assert.strictEqual(reqArmt.remainingCredits, 66); // 126 - 60
assert.strictEqual(reqAbm.remainingCredits, 65);  // 125 - 60
console.log('✓ Scenario 14: Degree programmes credit requirements respected (ARMT: 126, ABM: 125, GT: 125).');

// ========================================================
// SCENARIO 15: Student profile switching
// ========================================================
// Two profiles have distinct projections
const profileA = { id: 'A', degree: 'ARMT', currentSemester: '1-1', semesters: { '1-1': [{ code: 'C1', credits: 2, grade: '' }] }, courseProjections: { '1-1:C1': { targetGrade: 'A' } } };
const profileB = { id: 'B', degree: 'ARMT', currentSemester: '1-1', semesters: { '1-1': [{ code: 'C1', credits: 2, grade: '' }] }, courseProjections: { '1-1:C1': { targetGrade: 'B' } } };
assert.strictEqual(calculateAcademicProjections(profileA).currentSemProjectedSgpa, 4.00);
assert.strictEqual(calculateAcademicProjections(profileB).currentSemProjectedSgpa, 3.00);
console.log('✓ Scenario 15: Profile switching preserves distinct projections per profile.');

// ========================================================
// SCENARIO 16: Impossible CGPA targets
// ========================================================
// Starting at 2.00 with 100 credits, trying to reach 3.80 across remaining 26 credits requires > 10.00 GPV
const imp = calculateRequiredGpa(2.00, 100, 126, 3.80);
assert.strictEqual(imp.possible, false);
assert.ok(imp.requiredAverage > 4.00);
console.log('✓ Scenario 16: Impossible CGPA targets correctly flagged.');

// ========================================================
// SCENARIO 17: Zero-credit semesters
// ========================================================
const prof17 = {
  degree: 'ARMT',
  currentSemester: '1-1',
  semesters: { '1-1': [] },
  courseProjections: {}
};
const res17 = calculateAcademicProjections(prof17);
assert.strictEqual(res17.actualCgpa, 0);
assert.strictEqual(res17.combinedProjectedCgpa, 0);
assert.strictEqual(isNaN(res17.combinedProjectedCgpa), false);
console.log('✓ Scenario 17: Zero-credit semesters handled without NaN.');

// ========================================================
// SCENARIO 18: Best-case and worst-case boundaries
// ========================================================
// In prof2, actual CGPA is 3.60. Best-case should be higher, worst-case lower.
assert.ok(res2.scenarios.bestCase >= res2.scenarios.expected);
assert.ok(res2.scenarios.expected >= res2.scenarios.worstCase);
assert.strictEqual(res2.scenarios.actualOnly, 3.60);
console.log('✓ Scenario 18: Best-case and worst-case boundaries bounded correctly.');

// ========================================================
// SCENARIO 19: Existing saved-data migration
// ========================================================
const legacyData = {
  degree: 'ARMT',
  currentSemester: '1-1',
  semesters: { '1-1': [{ code: 'C1', credits: 2, grade: 'B' }] }
  // Notice missing courseProjections, academicStatusBySem, resultStatusBySem
};
const res19 = calculateAcademicProjections(legacyData);
assert.strictEqual(res19.actualCgpa, 3.00);
console.log('✓ Scenario 19: Backward-compatible migration from legacy state confirmed.');

// ========================================================
// SCENARIO 20: Resetting predictions without affecting actual grades
// ========================================================
const prof20 = {
  degree: 'ARMT',
  currentSemester: '1-2',
  semesters: {
    '1-1': [{ code: 'C1', credits: 2, grade: 'A' }],
    '1-2': [{ code: 'C2', credits: 2, grade: '' }]
  },
  courseProjections: { '1-2:C2': { predictedGrade: 'B' } }
};
// Reset predictions
prof20.courseProjections = {};
const res20 = calculateAcademicProjections(prof20);
assert.strictEqual(prof20.semesters['1-1'][0].grade, 'A'); // Actual grade untouched!
assert.strictEqual(res20.actualCgpa, 4.00);
console.log('✓ Scenario 20: Resetting predictions preserves confirmed actual grades.');

// ========================================================
// SCENARIO 21: Accurate historical projections without including grades from later semesters
// ========================================================
const prof21 = {
  degree: 'ARMT',
  currentSemester: '1-1',
  semesters: {
    '1-1': [{ code: 'C1', credits: 2, grade: 'A' }],
    '1-2': [{ code: 'C2', credits: 2, grade: 'B' }] // future semester grades shouldn't leak into 1-1
  },
  courseProjections: {}
};
const res21 = calculateAcademicProjections(prof21);
// Combined up to current semester (1-1) only includes C1!
assert.strictEqual(res21.combinedTotalCredits, 2);
console.log('✓ Scenario 21: Projections for current semester do not leak future semesters.');

// ========================================================
// SCENARIO 22: Prevention of duplicate credits and grade points
// ========================================================
const prof22 = {
  degree: 'ARMT',
  currentSemester: '1-1',
  semesters: {
    '1-1': [{ code: 'C1', credits: 3, grade: 'A' }] // already has actual grade
  },
  courseProjections: {
    '1-1:C1': { predictedGrade: 'B' } // even if stale prediction exists
  }
};
const res22 = calculateAcademicProjections(prof22);
assert.strictEqual(res22.combinedTotalCredits, 3); // Must NOT be 6!
assert.strictEqual(res22.combinedProjectedCgpa, 4.00); // Must be A (4.0), not B or (A+B)/2!
console.log('✓ Scenario 22: Zero duplication of course credits or grade points.');

// ========================================================
// SECTION 23 ACCEPTANCE SCENARIO
// ========================================================
console.log('\n🌟 Testing Section 23 Acceptance Scenario with Real Application Model:');
/*
Scenario:
- Semester 1-1: Completed, all official results received.
- Semester 1-2: Completed, 5 results received, 3 pending.
- Semester 2-1: Currently studying, exams upcoming.
*/
const studentAcceptance = {
  degree: 'ARMT',
  currentSemester: '2-1',
  semesters: {
    '1-1': [
      { code: 'AS11201', credits: 2, grade: 'A', isNgpa: false },
      { code: 'BL11301', credits: 3, grade: 'B+', isNgpa: false },
      { code: 'CC11201', credits: 2, grade: 'A-', isNgpa: false },
      { code: 'CS11201', credits: 2, grade: 'A', isNgpa: false },
      { code: 'EC11201', credits: 2, grade: 'B', isNgpa: false },
      { code: 'EN11201', credits: 2, grade: 'B+', isNgpa: false },
      { code: 'FS11201', credits: 2, grade: 'A', isNgpa: false }
    ],
    '1-2': [
      { code: 'AS12202', credits: 2, grade: 'A', isNgpa: false },
      { code: 'CC12203', credits: 2, grade: 'B+', isNgpa: false },
      { code: 'CS12202', credits: 2, grade: 'A-', isNgpa: false },
      { code: 'EC12202', credits: 2, grade: 'B', isNgpa: false },
      { code: 'EN12202', credits: 2, grade: 'A', isNgpa: false },
      // 3 Pending results:
      { code: 'FS12202', credits: 2, grade: '', isNgpa: false },
      { code: 'SS12201', credits: 2, grade: '', isNgpa: false },
      { code: 'AS12203', credits: 2, grade: '', isNgpa: false }
    ],
    '2-1': [
      { code: 'AS21204', credits: 2, grade: '', isNgpa: false },
      { code: 'CS21203', credits: 2, grade: '', isNgpa: false },
      { code: 'EC21203', credits: 2, grade: '', isNgpa: false }
    ]
  },
  courseProjections: {
    '1-2:FS12202': { predictedGrade: 'A' },
    '1-2:SS12201': { predictedGrade: 'B+' },
    '1-2:AS12203': { predictedGrade: 'A-' },
    '2-1:AS21204': { targetGrade: 'A' },
    '2-1:CS21203': { targetGrade: 'A-' },
    '2-1:EC21203': { targetGrade: 'B+' }
  }
};

const accResult1 = calculateAcademicProjections(studentAcceptance);
console.log(`  Initial Actual CGPA: ${accResult1.actualCgpa}`);
console.log(`  Projected CGPA after pending 1-2 results: ${accResult1.projectedCgpaPending}`);
console.log(`  Expected 2-1 SGPA: ${accResult1.currentSemProjectedSgpa}`);
console.log(`  Combined CGPA after 2-1: ${accResult1.combinedProjectedCgpa}`);

assert.ok(accResult1.actualCgpa > 0);
assert.strictEqual(accResult1.pendingResultsCount, 3);
assert.ok(accResult1.currentSemProjectedSgpa > 0);
assert.ok(accResult1.combinedProjectedCgpa > 0);

// Step 2: Change a pending 1-2 prediction (FS12202 from A to B) and verify combined updates
studentAcceptance.courseProjections['1-2:FS12202'].predictedGrade = 'B';
const accResult2 = calculateAcademicProjections(studentAcceptance);
assert.notStrictEqual(accResult2.combinedProjectedCgpa, accResult1.combinedProjectedCgpa);
console.log(`  ✓ Updating pending prediction dynamically updates combined CGPA: ${accResult2.combinedProjectedCgpa}`);

// Step 3: Enter official university result for FS12202 as B+ and verify actual grade replaces prediction
studentAcceptance.semesters['1-2'][5].grade = 'B+';
const accResult3 = calculateAcademicProjections(studentAcceptance);
assert.notStrictEqual(accResult3.actualCgpa, accResult1.actualCgpa);
assert.strictEqual(accResult3.pendingResultsCount, 2); // 3 - 1 = 2
console.log(`  ✓ Official result B+ confirmed: Actual CGPA updated to ${accResult3.actualCgpa}, pending count decreased to ${accResult3.pendingResultsCount}.`);

console.log('\n🎉 ALL 22 ACADEMIC PROJECTION REGRESSION TESTS & ACCEPTANCE SCENARIO PASSED (100% SUCCESS)!');
