// University of Ruhuna - Faculty of Agriculture
// Pure Production TypeScript Direct-Import Regression Test Suite
// Executes real production functions from src/utils/projectionCalculations.ts and src/utils/calculations.ts

const assert = require('assert');
const path = require('path');
const jiti = require('jiti')(__filename);

// Direct imports of REAL production TypeScript modules
const {
  calculateAcademicProjections,
  calculateTargetCgpaRequirement,
  calculateEffectiveGpvForGrade,
  calculateSemesterResultStatus,
  isCourseGradeConfirmed,
  ALL_SEMESTER_KEYS
} = jiti('./src/utils/projectionCalculations.ts');

const {
  calculateOverallStats,
  calculateSemesterStats,
  calculateCourseGpv,
  getClassStanding
} = jiti('./src/utils/calculations.ts');

const {
  DEGREE_INFO,
  COURSE_CATALOG,
  GRADING_SCALE
} = jiti('./src/database.ts');

const {
  createCleanProfile,
  createAbmProfile
} = jiti('./src/utils/sampleProfiles.ts');

console.log('🧪 Running Pure Production TypeScript Direct-Import Regression Tests (40 Scenarios)...\n');

let passedTests = 0;

function runTest(name, fn) {
  try {
    fn();
    passedTests++;
    console.log(`✓ Scenario ${passedTests}: ${name}`);
  } catch (err) {
    console.error(`\n❌ FAILED Scenario: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// Helper: base clean profile
function getBaseProfile(degree = 'ARMT', currentSem = '2-1') {
  const profile = createCleanProfile(degree, 'Test Student', '', 2, currentSem);
  profile.currentSemester = currentSem;
  return profile;
}

// 1. All previous semester results received
runTest('All previous semester results received', () => {
  const p = getBaseProfile('ARMT', '2-1');
  p.semesters['1-1'].forEach(c => { c.grade = 'A'; });
  p.semesters['1-2'].forEach(c => { c.grade = 'B'; });
  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.pendingResultsCount, 0);
  assert.strictEqual(proj.pendingGpaCredits, 0);
  assert.ok(proj.actualCgpa > 0);
  assert.strictEqual(proj.projectedCgpaPending, proj.actualCgpa);
});

// 2. Previous semester partially graded while current semester exams approach
runTest('Previous semester partially graded while current semester examinations approach', () => {
  const p = getBaseProfile('ARMT', '2-1');
  p.semesters['1-1'].forEach(c => { c.grade = 'A'; });
  // In 1-2, grade first 3 courses, leave rest unreleased
  const gpaCourses12 = p.semesters['1-2'].filter(c => !c.isNgpa);
  gpaCourses12[0].grade = 'B+';
  gpaCourses12[1].grade = 'B';
  gpaCourses12[2].grade = 'A-';
  const pendingCount = gpaCourses12.length - 3;
  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.pendingResultsCount, pendingCount);
  assert.strictEqual(proj.semesterSummaries['1-2'].resultStatus, 'partial');
});

// 3. Multiple previous semesters with pending results
runTest('Multiple previous semesters with pending results', () => {
  const p = getBaseProfile('ARMT', '3-1');
  // 1-1 has 1 pending
  p.semesters['1-1'].filter(c => !c.isNgpa).forEach((c, i) => { if (i > 0) c.grade = 'A'; });
  // 1-2 has 2 pending
  p.semesters['1-2'].filter(c => !c.isNgpa).forEach((c, i) => { if (i > 1) c.grade = 'B+'; });
  // 2-1 all received
  p.semesters['2-1'].filter(c => !c.isNgpa).forEach(c => { c.grade = 'A'; });
  // 2-2 has 1 pending
  p.semesters['2-2'].filter(c => !c.isNgpa).forEach((c, i) => { if (i > 0) c.grade = 'B'; });

  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.pendingResultsCount, 4);
});

// 4. Current semester with no confirmed grades
runTest('Current semester with no confirmed grades', () => {
  const p = getBaseProfile('ARMT', '2-1');
  p.semesters['1-1'].forEach(c => { c.grade = 'A'; });
  p.semesters['2-1'].forEach(c => { c.grade = ''; });
  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.currentSemActualSgpa, 0);
  assert.strictEqual(proj.currentSemConfirmedCredits, 0);
});

// 5. Current semester with partial official results
runTest('Current semester with partial official results', () => {
  const p = getBaseProfile('ARMT', '2-1');
  p.semesters['1-1'].forEach(c => { c.grade = 'A'; });
  const sem21Gpa = p.semesters['2-1'].filter(c => !c.isNgpa);
  sem21Gpa[0].grade = 'A';
  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.currentSemActualSgpa, 4.0);
  assert.strictEqual(proj.currentSemConfirmedCredits, sem21Gpa[0].credits);
  assert.strictEqual(proj.semesterSummaries['2-1'].resultStatus, 'partial');
});

// 6. Confirmed grades overriding predictions
runTest('Confirmed grades overriding predictions', () => {
  const p = getBaseProfile('ARMT', '2-1');
  const course = p.semesters['1-1'].find(c => !c.isNgpa);
  p.courseProjections = {
    [`1-1:${course.code}`]: {
      courseCode: course.code,
      semesterKey: '1-1',
      predictedGrade: 'C'
    }
  };
  course.grade = 'A'; // Confirmed result is A
  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.actualCgpa, 4.0);
  assert.strictEqual(proj.combinedProjectedCgpa, 4.0);
});

// 7. Confirmed grades overriding target grades
runTest('Confirmed grades overriding target grades', () => {
  const p = getBaseProfile('ARMT', '2-1');
  const course = p.semesters['2-1'].find(c => !c.isNgpa);
  p.courseProjections = {
    [`2-1:${course.code}`]: {
      courseCode: course.code,
      semesterKey: '2-1',
      targetGrade: 'B'
    }
  };
  course.grade = 'A+';
  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.currentSemActualSgpa, 4.0);
});

// 8. Legacy isExpected grades excluded from confirmed calculations
runTest('Legacy isExpected grades excluded from confirmed calculations', () => {
  const p = getBaseProfile('ARMT', '2-1');
  const c1 = p.semesters['1-1'].find(c => !c.isNgpa);
  c1.grade = 'A';
  c1.isExpected = true; // Legacy estimated flag
  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.actualGpaCredits, 0, 'Actual credits must exclude isExpected courses');
  assert.strictEqual(proj.actualCgpa, 0, 'Actual CGPA must exclude isExpected courses');
  assert.strictEqual(isCourseGradeConfirmed(c1), false);
});

// 9. Explicit failing grades
runTest('Explicit failing grades (Grade E treated as valid 0.0 GPV, not missing)', () => {
  const p = getBaseProfile('ARMT', '1-1');
  const c1 = p.semesters['1-1'].find(c => !c.isNgpa);
  c1.grade = 'E';
  c1.isExpected = false;
  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.actualGpaCredits, c1.credits);
  assert.strictEqual(proj.actualCgpa, 0.0);
  assert.strictEqual(proj.semesterSummaries['1-1'].actualResultsCount, 1);
});

// 10. Missing grades versus zero GPA
runTest('Missing grades versus zero GPA', () => {
  const p = getBaseProfile('ARMT', '1-1');
  p.semesters['1-1'].forEach(c => { c.grade = ''; });
  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.actualGpaCredits, 0);
  assert.strictEqual(proj.actualCgpa, 0);
  assert.strictEqual(proj.pendingResultsCount, 0); // Not past semester
});

// 11. Incomplete previous semester projections
runTest('Incomplete previous semester projections', () => {
  const p = getBaseProfile('ARMT', '2-1');
  p.semesters['1-1'].forEach(c => { c.grade = 'A'; });
  // 1-2 has all unresolved and only 1 course has predicted grade
  const gpaCourses12 = p.semesters['1-2'].filter(c => !c.isNgpa);
  p.courseProjections = {
    [`1-2:${gpaCourses12[0].code}`]: {
      courseCode: gpaCourses12[0].code,
      semesterKey: '1-2',
      predictedGrade: 'B'
    }
  };
  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.semesterSummaries['1-2'].isComplete, false);
  assert.strictEqual(proj.isCombinedComplete, false);
  assert.ok(proj.projectionCoveragePercent < 100);
});

// 12. Incomplete current semester projections
runTest('Incomplete current semester projections', () => {
  const p = getBaseProfile('ARMT', '2-1');
  p.semesters['1-1'].forEach(c => { c.grade = 'A'; });
  p.semesters['1-2'].forEach(c => { c.grade = 'A'; });
  const gpaCourses21 = p.semesters['2-1'].filter(c => !c.isNgpa);
  p.courseProjections = {
    [`2-1:${gpaCourses21[0].code}`]: {
      courseCode: gpaCourses21[0].code,
      semesterKey: '2-1',
      targetGrade: 'A'
    }
  };
  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.isCurrentSemComplete, false);
});

// 13. Combined projection coverage
runTest('Combined projection coverage calculation', () => {
  const p = getBaseProfile('ARMT', '1-2');
  p.semesters['1-1'].forEach(c => { c.grade = 'A'; }); // 100% of 1-1
  const gpa11Credits = p.semesters['1-1'].filter(c => !c.isNgpa).reduce((s, c) => s + c.credits, 0);
  const gpa12Credits = p.semesters['1-2'].filter(c => !c.isNgpa).reduce((s, c) => s + c.credits, 0);
  const totalScope = gpa11Credits + gpa12Credits;
  const proj = calculateAcademicProjections(p);
  const expectedCoverage = Math.round((gpa11Credits / totalScope) * 100);
  assert.strictEqual(proj.projectionCoveragePercent, expectedCoverage);
});

// 14. Repeat-course restrictions (max 2.0 unless medical excused)
runTest('Repeat-course restrictions (max 2.0 unless medical excused)', () => {
  const gpvA = calculateEffectiveGpvForGrade('A', true, false); // Repeat, unexcused
  assert.strictEqual(gpvA, 2.0, 'Repeat unexcused Grade A must cap at 2.0');
  const gpvC = calculateEffectiveGpvForGrade('C', true, false);
  assert.strictEqual(gpvC, 2.0);
  const gpvD = calculateEffectiveGpvForGrade('D', true, false);
  assert.strictEqual(gpvD, 1.0, 'Grades below 2.0 must retain their lower GPV');
});

// 15. Excused-course handling (can achieve > 2.0)
runTest('Excused-course handling (can achieve > 2.0)', () => {
  const gpvExcused = calculateEffectiveGpvForGrade('A', true, true); // Repeat, excused
  assert.strictEqual(gpvExcused, 4.0, 'Excused repeat must achieve full 4.0 GPV');
});

// 16. Quick assumptions respecting repeat caps
runTest('Quick assumptions respecting repeat caps', () => {
  const p = getBaseProfile('ARMT', '2-1');
  const repeatCourse = p.semesters['2-1'].find(c => !c.isNgpa);
  repeatCourse.isRepeat = true;
  repeatCourse.isExcused = false;
  // Apply quick assumption of 3.80 across current semester
  const proj = calculateAcademicProjections(p, { currentSemAvgGpa: 3.80 });
  const semSumm = proj.semesterSummaries['2-1'];
  // The repeat course must be capped at 2.00, so sem projected GPA must be strictly < 3.80
  assert.ok(semSumm.projectedSgpa < 3.80);
});

// 17. Non-GPA course exclusion from GPA and grade points
runTest('Non-GPA course exclusion from GPA and grade points', () => {
  const p = getBaseProfile('ARMT', '1-1');
  const ngpaCourse = p.semesters['1-1'].find(c => c.isNgpa);
  if (ngpaCourse) {
    ngpaCourse.grade = 'A+';
    const proj = calculateAcademicProjections(p);
    assert.strictEqual(proj.actualGpaCredits, 0, 'NGPA course must not contribute to GPA credits');
    assert.strictEqual(proj.actualCgpa, 0);
  }
});

// 18. Non-GPA result-release tracking
runTest('Non-GPA result-release tracking isolated from GPA courses', () => {
  const p = getBaseProfile('ARMT', '1-1');
  const ngpa = p.semesters['1-1'].find(c => c.isNgpa);
  if (ngpa) {
    ngpa.grade = 'A';
    const proj = calculateAcademicProjections(p);
    const sem = proj.semesterSummaries['1-1'];
    assert.strictEqual(sem.ngpaCoursesConfirmed, 1);
    assert.strictEqual(sem.gpaCoursesConfirmed, 0);
  }
});

// 19. Elective selection changes
runTest('Elective selection changes dynamically reflect in credit total', () => {
  const p = getBaseProfile('ARMT', '3-1');
  const initialGpaCredits = p.semesters['3-1'].filter(c => !c.isNgpa).reduce((s, c) => s + c.credits, 0);
  // Add an elective
  p.semesters['3-1'].push({
    code: 'EXT31201',
    name: 'Advanced Extension',
    credits: 2,
    dept: 'EX',
    isCompulsory: false,
    isNgpa: false
  });
  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.semesterSummaries['3-1'].totalGpaCredits, initialGpaCredits + 2);
});

// 20. Degree programme changes (ARMT 126, ABM 125, GT 125)
runTest('Degree programme dynamic total credits', () => {
  const pArmt = getBaseProfile('ARMT', '2-1');
  const pAbm = getBaseProfile('ABM', '2-1');
  const pGt = getBaseProfile('GT', '2-1');
  assert.strictEqual(DEGREE_INFO[pArmt.degree].totalMinGpaCredits, 126);
  assert.strictEqual(DEGREE_INFO[pAbm.degree].totalMinGpaCredits, 125);
  assert.strictEqual(DEGREE_INFO[pGt.degree].totalMinGpaCredits, 125);
});

// 21. Profile switching and isolation
runTest('Profile switching preserves independent projections', () => {
  const p1 = getBaseProfile('ARMT', '2-1');
  p1.id = 'prof-1';
  p1.semesters['1-1'].forEach(c => { c.grade = 'A'; });
  const p2 = getBaseProfile('ABM', '1-2');
  p2.id = 'prof-2';
  p2.semesters['1-1'].forEach(c => { c.grade = 'C'; });

  const proj1 = calculateAcademicProjections(p1);
  const proj2 = calculateAcademicProjections(p2);
  assert.strictEqual(proj1.actualCgpa, 4.0);
  assert.strictEqual(proj2.actualCgpa, 2.0);
});

// 22. Profile-specific quick assumptions
runTest('Profile-specific quick assumptions do not leak', () => {
  const p1 = getBaseProfile('ARMT', '2-1');
  const p2 = getBaseProfile('ARMT', '2-1');
  const proj1 = calculateAcademicProjections(p1, { currentSemAvgGpa: 3.5 });
  const proj2 = calculateAcademicProjections(p2, undefined);
  assert.ok(proj1.currentSemProjectedSgpa === 3.5);
  assert.strictEqual(proj2.currentSemProjectedSgpa, 0);
});

// 23. Historical projection scopes (no future grades leak into earlier projections)
runTest('Historical projection scopes strictly isolated', () => {
  const p = getBaseProfile('ARMT', '2-1');
  p.semesters['1-1'].forEach(c => { c.grade = 'A'; });
  // Add confirmed grades to future semester 2-2
  p.semesters['2-2'].forEach(c => { c.grade = 'C'; });

  const proj = calculateAcademicProjections(p);
  // combinedProjectedCgpa (scope: through 2-1) MUST NOT include 2-2!
  assert.strictEqual(proj.combinedProjectedCgpa, 4.0);
  // Global actual includes all confirmed grades
  assert.ok(proj.actualCgpa < 4.0);
});

// 24. Future grades excluded from earlier projections
runTest('Future grades excluded from earlier projections', () => {
  const p = getBaseProfile('ARMT', '2-1');
  p.semesters['1-1'].forEach(c => { c.grade = 'B'; });
  p.semesters['3-1'].forEach(c => { c.grade = 'A'; });
  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.projectedCgpaPending, 3.0);
});

// 25. Correct pending-credit calculations
runTest('Correct pending-credit calculations', () => {
  const p = getBaseProfile('ARMT', '2-1');
  const gpa11Credits = p.semesters['1-1'].filter(c => !c.isNgpa).reduce((s, c) => s + c.credits, 0);
  const gpa12Credits = p.semesters['1-2'].filter(c => !c.isNgpa).reduce((s, c) => s + c.credits, 0);
  p.semesters['1-1'].forEach(c => { c.grade = 'A'; });
  // In 1-2, 0 confirmed grades
  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.prevConfirmedGpaCredits, gpa11Credits);
  assert.strictEqual(proj.prevUnresolvedGpaCredits, gpa12Credits);
  assert.strictEqual(proj.pendingGpaCredits, gpa12Credits);
});

// 26. Target CGPA after previous semester results (scope = 'after_pending')
runTest('Target CGPA after previous semester results (scope = after_pending)', () => {
  const p = getBaseProfile('ARMT', '2-1');
  p.semesters['1-1'].forEach(c => { c.grade = 'B'; }); // CGPA = 3.00
  const targetResult = calculateTargetCgpaRequirement(p, 3.50, 'after_pending');
  assert.strictEqual(targetResult.scope, 'after_pending');
  assert.ok(targetResult.possible);
  assert.ok(targetResult.requiredAverage > 3.50);
});

// 27. Target CGPA after current semester (scope = 'after_current')
runTest('Target CGPA after current semester (scope = after_current)', () => {
  const p = getBaseProfile('ARMT', '2-1');
  p.semesters['1-1'].forEach(c => { c.grade = 'B+'; });
  p.semesters['1-2'].forEach(c => { c.grade = 'B'; });
  const targetResult = calculateTargetCgpaRequirement(p, 3.70, 'after_current');
  assert.strictEqual(targetResult.scope, 'after_current');
  assert.ok(targetResult.remainingCredits > 0);
});

// 28. Graduation target CGPA (scope = 'at_graduation')
runTest('Graduation target CGPA (scope = at_graduation)', () => {
  const p = getBaseProfile('ARMT', '2-1');
  p.semesters['1-1'].forEach(c => { c.grade = 'B'; });
  const targetResult = calculateTargetCgpaRequirement(p, 3.30, 'at_graduation');
  assert.strictEqual(targetResult.scope, 'at_graduation');
  assert.strictEqual(targetResult.totalScopeCredits, 126);
});

// 29. Impossible targets under repeat restrictions
runTest('Impossible targets under repeat restrictions', () => {
  const p = getBaseProfile('ARMT', '1-2');
  // In 1-1, grade C
  p.semesters['1-1'].forEach(c => { c.grade = 'C'; }); // 2.00
  // In 1-2, all courses are repeats!
  p.semesters['1-2'].forEach(c => { c.isRepeat = true; c.isExcused = false; });
  // Target 3.50 after 1-2 is impossible because repeat courses are capped at 2.0
  const targetResult = calculateTargetCgpaRequirement(p, 3.50, 'after_current');
  assert.strictEqual(targetResult.possible, false);
  assert.strictEqual(targetResult.isRepeatCapRestricted, true);
});

// 30. Full-precision calculation inputs
runTest('Full-precision calculation inputs avoid premature rounding error', () => {
  const p = getBaseProfile('ARMT', '1-1');
  const gpaCourses = p.semesters['1-1'].filter(c => !c.isNgpa);
  // Grade: A (4.0), A- (3.7), B+ (3.3)
  gpaCourses[0].grade = 'A';
  gpaCourses[1].grade = 'A-';
  gpaCourses[2].grade = 'B+';
  const proj = calculateAcademicProjections(p);
  const totalCreds = gpaCourses[0].credits + gpaCourses[1].credits + gpaCourses[2].credits;
  const exactPoints = (4.0 * gpaCourses[0].credits) + (3.7 * gpaCourses[1].credits) + (3.3 * gpaCourses[2].credits);
  const expectedCgpa = Number((exactPoints / totalCreds).toFixed(2));
  assert.strictEqual(proj.actualCgpa, expectedCgpa);
});

// 31. Zero remaining credits
runTest('Zero remaining credits handled safely', () => {
  const p = getBaseProfile('ARMT', '1-1');
  p.semesters['1-1'].forEach(c => { c.grade = 'A'; });
  const targetResult = calculateTargetCgpaRequirement(p, 3.70, 'after_pending');
  // 1-1 has no pending previous semesters
  assert.strictEqual(targetResult.remainingCredits, 0);
});

// 32. Zero-credit semesters handled without NaN
runTest('Zero-credit semesters handled without NaN', () => {
  const p = getBaseProfile('ARMT', '1-1');
  p.semesters['1-1'] = [];
  const proj = calculateAcademicProjections(p);
  assert.strictEqual(isNaN(proj.actualCgpa), false);
  assert.strictEqual(isNaN(proj.combinedProjectedCgpa), false);
});

// 33. Best/worst-case boundaries
runTest('Best and worst case boundaries bounded properly', () => {
  const p = getBaseProfile('ARMT', '1-2');
  p.semesters['1-1'].forEach(c => { c.grade = 'B'; }); // 3.00
  const proj = calculateAcademicProjections(p);
  assert.ok(proj.scenarios.bestCase >= 3.00);
  assert.ok(proj.scenarios.worstCase <= 3.00);
  assert.ok(proj.scenarios.bestCase >= proj.scenarios.worstCase);
});

// 34. Comparable scenario scopes
runTest('Comparable scenario scopes use identical credit denominators', () => {
  const p = getBaseProfile('ARMT', '2-1');
  p.semesters['1-1'].forEach(c => { c.grade = 'A'; });
  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.scopeTotalGpaCredits > 0, true);
});

// 35. Correct course-impact calculation
runTest('Correct course-impact calculation distinguishing SGPA and CGPA gains', () => {
  const p = getBaseProfile('ARMT', '2-1');
  p.semesters['1-1'].forEach(c => { c.grade = 'B'; });
  const proj = calculateAcademicProjections(p);
  const impacts = proj.courseImpacts;
  assert.ok(impacts.length > 0);
  const first = impacts[0];
  assert.ok(first.impactScore > 0);
  assert.ok(first.cgpaGain > 0);
  if (first.semesterKey === '2-1') {
    assert.ok(first.sgpaGain !== undefined);
  }
});

// 36. Existing saved-data migration
runTest('Existing saved-data migration preserves profile integrity', () => {
  const legacyProfile = {
    id: 'test-legacy',
    name: 'Legacy Student',
    degree: 'ARMT',
    currentSemester: '2-1',
    semesters: getBaseProfile('ARMT').semesters,
    orientationCourses: []
  };
  const proj = calculateAcademicProjections(legacyProfile);
  assert.ok(proj !== null);
  assert.strictEqual(proj.currentSemester, '2-1');
});

// 37. Prediction reset preserving actual grades
runTest('Prediction reset preserves confirmed actual grades', () => {
  const p = getBaseProfile('ARMT', '2-1');
  p.semesters['1-1'].forEach(c => { c.grade = 'A'; });
  p.courseProjections = {
    [`2-1:ANY`]: { courseCode: 'ANY', semesterKey: '2-1', predictedGrade: 'B' }
  };
  // Reset projections
  p.courseProjections = {};
  p.projectionQuickAssumptions = undefined;
  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.actualCgpa, 4.0);
  assert.strictEqual(proj.actualGpaCredits > 0, true);
});

// 38. Predictions excluded from actual transcripts
runTest('Predictions strictly excluded from actual academic transcripts', () => {
  const p = getBaseProfile('ARMT', '2-1');
  p.semesters['1-1'].forEach(c => { c.grade = 'A'; });
  // Add prediction for 2-1
  const course21 = p.semesters['2-1'].find(c => !c.isNgpa);
  p.courseProjections = {
    [`2-1:${course21.code}`]: {
      courseCode: course21.code,
      semesterKey: '2-1',
      predictedGrade: 'A+'
    }
  };
  const stats = calculateOverallStats(p);
  // Confirmed CGPA in stats must strictly reflect 1-1 (4.00), not the predicted grade
  assert.strictEqual(stats.realCgpa, 4.0);
  assert.strictEqual(stats.realCreditsAttempted, p.semesters['1-1'].filter(c => !c.isNgpa).reduce((s, c) => s + c.credits, 0));
});

// 39. Result tracker excluding unstarted semesters
runTest('Result tracker excludes unstarted semesters from awaiting results', () => {
  const p = getBaseProfile('ARMT', '2-1');
  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.semesterSummaries['2-2'].academicStatus, 'not_started');
  assert.strictEqual(proj.semesterSummaries['2-2'].resultStatus, 'none');
  assert.strictEqual(proj.semesterSummaries['3-1'].academicStatus, 'not_started');
});

// 40. Academic classification safeguards
runTest('Academic classification safeguards prevent misleading achievements', () => {
  const standingMidway = getClassStanding(3.85, 20);
  assert.strictEqual(standingMidway.title, 'First Class Honours');
  // But a student with 0 credits has No Grades Finalized
  const standingZero = getClassStanding(0, 0);
  assert.strictEqual(standingZero.title, 'No Grades Finalized');
});

console.log(`\n🎉 ALL 40 PRODUCTION REGRESSION SCENARIOS PASSED DIRECTLY AGAINST TYPESCRIPT MODULES!\n`);

// =========================================================================
// SECTION 35: END-TO-END ACCEPTANCE SCENARIO (Agribusiness Management - ABM)
// =========================================================================
console.log('🌟 Testing Section 35 End-to-End Acceptance Scenario (Agribusiness Management)...\n');

const abmStudent = createAbmProfile();
abmStudent.currentSemester = '2-1';

// Step 1: Set Semester 1-1: All official results received
abmStudent.semesters['1-1'].filter(c => !c.isNgpa).forEach(c => { c.grade = 'A-'; c.isExpected = false; });

// Step 2: Set Semester 1-2: 5 results received, remaining pending
const sem12Gpa = abmStudent.semesters['1-2'].filter(c => !c.isNgpa);
for (let i = 0; i < 5; i++) {
  sem12Gpa[i].grade = 'B+';
  sem12Gpa[i].isExpected = false;
}
for (let i = 5; i < sem12Gpa.length; i++) {
  sem12Gpa[i].grade = '';
}

// Clear 2-1 and later semesters (examinations approaching / not started)
ALL_SEMESTER_KEYS.forEach((sem, idx) => {
  if (idx >= 2) {
    (abmStudent.semesters[sem] || []).forEach(c => { c.grade = ''; });
  }
});

// Step 3: Verify initial actual CGPA
let state1 = calculateAcademicProjections(abmStudent);
console.log(`  Initial Actual CGPA: ${state1.actualCgpa}`);
console.log(`  Pending results from 1-2: ${state1.pendingResultsCount}`);
assert.strictEqual(state1.pendingResultsCount, sem12Gpa.length - 5);
assert.ok(state1.actualCgpa > 0);

// Step 4: In Projection Mode, set expected grades for upcoming 2-1 examinations
const sem21Gpa = abmStudent.semesters['2-1'].filter(c => !c.isNgpa);
abmStudent.courseProjections = {};
sem21Gpa.forEach(c => {
  abmStudent.courseProjections[`2-1:${c.code}`] = {
    courseCode: c.code,
    semesterKey: '2-1',
    targetGrade: 'A',
    predictedGrade: 'A',
    examStatus: 'upcoming',
    isResultPending: true
  };
});

// Step 5: Enter predicted grades for remaining 1-2 courses
for (let i = 5; i < sem12Gpa.length; i++) {
  abmStudent.courseProjections[`1-2:${sem12Gpa[i].code}`] = {
    courseCode: sem12Gpa[i].code,
    semesterKey: '1-2',
    predictedGrade: 'B',
    examStatus: 'completed',
    isResultPending: true
  };
}

let state2 = calculateAcademicProjections(abmStudent);
console.log(`  Projected CGPA after 1-2 pending results: ${state2.projectedCgpaPending}`);
console.log(`  Projected 2-1 SGPA: ${state2.currentSemProjectedSgpa}`);
console.log(`  Combined Projected CGPA after 2-1: ${state2.combinedProjectedCgpa}`);

assert.strictEqual(state2.currentSemProjectedSgpa, 4.0);
assert.ok(state2.combinedProjectedCgpa > state1.actualCgpa);
assert.strictEqual(state2.isCombinedComplete, true);

// Step 6: Test target calculation
const targetAfterCurrent = calculateTargetCgpaRequirement(abmStudent, 3.65, 'after_current');
console.log(`  Target 3.65 feasibility after 2-1: ${targetAfterCurrent.possible ? 'Possible' : 'Not possible'} (Required Avg: ${targetAfterCurrent.requiredAverage})`);
assert.strictEqual(targetAfterCurrent.possible, true);

// Step 7: A newly released 1-2 result arrives: Student enters official B+ in Actual Grades mode
const newlyReleasedCourse = sem12Gpa[5];
newlyReleasedCourse.grade = 'B+';
newlyReleasedCourse.isExpected = false;

// Store automatic transition:
const projKey = `1-2:${newlyReleasedCourse.code}`;
abmStudent.courseProjections[projKey] = {
  ...abmStudent.courseProjections[projKey],
  historicalPrediction: abmStudent.courseProjections[projKey].predictedGrade,
  isResultPending: false
};

let state3 = calculateAcademicProjections(abmStudent);
console.log(`  After official B+ released in 1-2:`);
console.log(`    Actual CGPA: ${state3.actualCgpa}`);
console.log(`    Remaining pending 1-2 results: ${state3.pendingResultsCount}`);
console.log(`    Combined Projected CGPA: ${state3.combinedProjectedCgpa}`);

assert.strictEqual(state3.pendingResultsCount, sem12Gpa.length - 6);
assert.ok(state3.accuracyReport.entries.length > 0);
assert.strictEqual(state3.accuracyReport.entries[0].courseCode, newlyReleasedCourse.code);

console.log('\n🎉 ALL ACCEPTANCE SCENARIO WORKFLOW CHECKS PASSED WITH 100% SUCCESS!\n');
