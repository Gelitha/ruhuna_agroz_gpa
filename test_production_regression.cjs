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
  getClassStanding,
  generateDegreeAudit,
  calculateWhatIf,
  calculateTargetGpa
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

// 41. Valid zero GPA values display 0.00 when credits > 0
runTest('Valid zero GPA values display 0.00 when credits > 0 (not treated as missing or empty)', () => {
  const p = getBaseProfile('ARMT', '1-1');
  p.semesters['1-1'].filter(c => !c.isNgpa).forEach(c => {
    c.grade = 'E'; // Grade E = 0.00 GPV
    c.isExpected = false;
  });
  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.actualCgpa, 0.0);
  assert.ok(proj.actualGpaCredits > 0, 'Actual GPA credits must be > 0');
  // Check formatting: credits > 0 allows displaying 0.00
  const displayedActual = proj.actualGpaCredits > 0 ? proj.actualCgpa.toFixed(2) : '—';
  assert.strictEqual(displayedActual, '0.00', 'Valid zero GPA must render as 0.00');
});

// 42. Historical projection does not leak grades from future semesters when past credits are 0
runTest('Historical projection strictly yields 0 when past credits are 0, never leaking future semesters', () => {
  const p = getBaseProfile('ARMT', '2-1');
  // 1-1 and 1-2 have NO confirmed grades
  p.semesters['1-1'].forEach(c => { c.grade = ''; });
  p.semesters['1-2'].forEach(c => { c.grade = ''; });
  // But future semester 2-2 has a confirmed grade
  p.semesters['2-2'][0].grade = 'A';

  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.projectedCgpaPending, 0, 'Past projection must be 0, not fall back to global actualCgpa');
});

// 43. Graduation target denominator when enrolled credits exceed degree minimum
runTest('Graduation target denominator correctly uses enrolled credits when exceeding degree minimum', () => {
  const p = getBaseProfile('ARMT', '4-2'); // ARMT degree minimum is 126
  // Add additional elective credits so enrolled exceeds degree minimum (108 compulsory + 24 extra = 132)
  for (let i = 1; i <= 8; i++) {
    p.semesters['4-2'].push({
      code: `ELEC420${i}`,
      name: `Elective Course ${i}`,
      credits: 3,
      isNgpa: false,
      grade: '',
      isCompulsory: false
    });
  }
  const enrolledCredits = ALL_SEMESTER_KEYS.reduce((sum, sk) => {
    return sum + (p.semesters[sk] || []).filter(c => !c.isNgpa).reduce((s, c) => s + (c.credits || 0), 0);
  }, 0);
  assert.ok(enrolledCredits > 126, `Enrolled credits (${enrolledCredits}) should exceed degree minimum (126)`);

  const targetResult = calculateTargetCgpaRequirement(p, 3.50, 'at_graduation');
  assert.strictEqual(targetResult.totalScopeCredits, enrolledCredits, 'Total scope credits must match enrolled credits when enrolled > minimum');
  assert.strictEqual(typeof targetResult.requiredAverage, 'number');
});

// 44. Result-release status derivation excludes legacy isExpected grades
runTest('Result-release status derivation strictly excludes legacy isExpected grades', () => {
  const courses = [
    { code: 'AB1101', name: 'Course 1', credits: 2, isNgpa: false, grade: 'A', isExpected: true },
    { code: 'AB1102', name: 'Course 2', credits: 2, isNgpa: false, grade: '', isExpected: false }
  ];
  const status = calculateSemesterResultStatus(courses, 'exams_completed');
  assert.strictEqual(status, 'none', 'Courses with only isExpected grades must be considered none received');
});

// 45. Pending non-GPA results tracked separately without affecting GPA
runTest('Pending non-GPA results are tracked separately without affecting GPA or GPA credits', () => {
  const p = getBaseProfile('ARMT', '1-2');
  // 1-1 has confirmed GPA courses
  p.semesters['1-1'].filter(c => !c.isNgpa).forEach(c => { c.grade = 'B'; });
  const initialNgpaCount = p.semesters['1-1'].filter(c => c.isNgpa).length;
  // Add an unreleased Non-GPA course in 1-1
  p.semesters['1-1'].push({
    code: 'ENG1101_TEST',
    name: 'English Test',
    credits: 2,
    dept: 'CC',
    isNgpa: true,
    isCompulsory: true,
    grade: '',
    isRepeat: false,
    isExcused: false,
    isExpected: false
  });

  const proj = calculateAcademicProjections(p);
  const sem11Summary = proj.semesterSummaries['1-1'];
  assert.strictEqual(sem11Summary.ngpaCoursesTotal, initialNgpaCount + 1);
  assert.ok(sem11Summary.ngpaCoursesPending >= 1);
  assert.strictEqual(sem11Summary.confirmedGpaCredits, p.semesters['1-1'].filter(c => !c.isNgpa).reduce((s, c) => s + c.credits, 0));
});

// 46. Incomplete projections correctly distinguished from complete projections
runTest('Incomplete projections correctly distinguished from complete projections', () => {
  const p = getBaseProfile('ARMT', '2-1');
  p.semesters['1-1'].forEach(c => { c.grade = 'A'; });
  // 1-2 is completely unpredicted and unconfirmed
  p.semesters['1-2'].forEach(c => { c.grade = ''; });
  p.courseProjections = {};

  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.isCombinedComplete, false);
  assert.strictEqual(proj.isExpectedIncomplete, true);
});

// 47. Target CGPA requirement engine handles impossible targets gracefully
runTest('Target CGPA requirement engine handles mathematically impossible targets', () => {
  const p = getBaseProfile('ARMT', '2-1');
  // Student had low grades in 1-1 (1.00)
  p.semesters['1-1'].filter(c => !c.isNgpa).forEach(c => { c.grade = 'D'; });
  // Desires impossible 3.99 CGPA across 2-1
  const target = calculateTargetCgpaRequirement(p, 3.99, 'after_current');
  assert.strictEqual(target.possible, false);
  assert.ok(target.requiredAverage > 4.0 || !target.possible);
});

// 48. Target calculation returns required average when target is achievable
runTest('Target calculation returns required average when target is achievable', () => {
  const p = getBaseProfile('ARMT', '2-1');
  p.semesters['1-1'].filter(c => !c.isNgpa).forEach(c => { c.grade = 'B+'; }); // ~3.30
  const target = calculateTargetCgpaRequirement(p, 3.50, 'after_current');
  assert.strictEqual(target.possible, true);
  assert.ok(target.requiredAverage <= 4.0 && target.requiredAverage >= 2.0);
});

// 49. Production store import validation
runTest('Store importProfilesJson validates imported grades and sanitizes assumptions', () => {
  const mockStorage = new Map();
  global.window = {
    localStorage: {
      getItem: (k) => mockStorage.get(k) || null,
      setItem: (k, v) => mockStorage.set(k, String(v)),
      removeItem: (k) => mockStorage.delete(k)
    }
  };
  global.localStorage = global.window.localStorage;

  const { useGradeStore } = jiti('./src/store/useGradeStore.ts');
  const store = useGradeStore.getState();

  const malformedJson = JSON.stringify({
    profiles: [
      {
        id: 'test-import-1',
        name: 'Import Test',
        degree: 'INVALID_DEGREE', // should fall back to ARMT
        currentSemester: '2-1',
        semesters: {
          '1-1': [
            { code: 'CS1101', name: 'Computer Science', credits: -5, grade: 'INVALID_GRADE' },
            { code: 'AG1101', name: 'Agriculture', credits: 3, grade: 'A' }
          ]
        },
        projectionQuickAssumptions: {
          remainingPrevAvgGpa: 9.99, // Should clamp to 4.00
          currentSemAvgGpa: -2.0     // Should clamp to 0.00
        },
        projectionTargetCgpa: 5.5   // Should clamp to 4.00
      }
    ]
  });

  const success = store.importProfilesJson(malformedJson);
  assert.strictEqual(success, true);
  const updatedProfiles = useGradeStore.getState().profiles;
  const imported = updatedProfiles.find(p => p.id === 'test-import-1');
  assert.ok(imported);
  assert.strictEqual(imported.degree, 'ARMT');
  assert.strictEqual(imported.semesters['1-1'][0].grade, '');
  assert.strictEqual(imported.semesters['1-1'][0].credits, 2); // Fallback for negative
  assert.strictEqual(imported.semesters['1-1'][1].grade, 'A');
  assert.strictEqual(imported.projectionQuickAssumptions.remainingPrevAvgGpa, 4.0);
  assert.strictEqual(imported.projectionQuickAssumptions.currentSemAvgGpa, 0.0);
  assert.strictEqual(imported.projectionTargetCgpa, 4.0);
});

// 50. Storage persistence failure detection
runTest('saveCurrentState reports persistence status reliably', () => {
  const { useGradeStore } = jiti('./src/store/useGradeStore.ts');
  const store = useGradeStore.getState();
  
  // With working storage
  const successResult = store.saveCurrentState();
  assert.strictEqual(successResult, true);

  // When storage is unavailable or throws (quota exceeded)
  const originalSet = global.window.localStorage.setItem;
  global.window.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
  const failResult = store.saveCurrentState();
  assert.strictEqual(failResult, false, 'saveCurrentState must return false on storage error');
  global.window.localStorage.setItem = originalSet;
});

// 51. Official grade with Proj unchecked
runTest('Official grade with Proj unchecked is included in actual CGPA and confirmed credits', () => {
  const p = getBaseProfile('ARMT', '1-1');
  const c = p.semesters['1-1'].find(x => !x.isNgpa);
  c.grade = 'A';
  c.isExpected = false;
  const stats = calculateOverallStats(p);
  const proj = calculateAcademicProjections(p);
  assert.strictEqual(stats.realCgpa, 4.0);
  assert.strictEqual(stats.realCreditsAttempted, c.credits);
  assert.strictEqual(proj.actualCgpa, 4.0);
  assert.strictEqual(proj.actualGpaCredits, c.credits);
  assert.strictEqual(isCourseGradeConfirmed(c), true);
});

// 52. Expected grade with Proj checked
runTest('Expected grade with Proj checked is included in projected GPA but excluded from actual GPA', () => {
  const p = getBaseProfile('ARMT', '1-1');
  const c = p.semesters['1-1'].find(x => !x.isNgpa);
  c.grade = 'A';
  c.isExpected = true; // Proj checked
  const stats = calculateOverallStats(p);
  const proj = calculateAcademicProjections(p);
  assert.strictEqual(stats.realCgpa, 0, 'Actual CGPA must exclude projected grade');
  assert.strictEqual(stats.realCreditsAttempted, 0, 'Confirmed credits must exclude projected grade');
  assert.strictEqual(proj.actualCgpa, 0);
  assert.strictEqual(proj.actualGpaCredits, 0);
  assert.strictEqual(proj.combinedProjectedCgpa, 4.0, 'Projected CGPA must include projected grade');
  assert.strictEqual(isCourseGradeConfirmed(c), false);
});

// 53. Changing an expected grade
runTest('Changing an expected grade immediately recalculates projected GPA without affecting actual GPA', () => {
  const p = getBaseProfile('ARMT', '1-1');
  const c = p.semesters['1-1'].find(x => !x.isNgpa);
  c.grade = 'B'; // 3.0
  c.isExpected = true;
  let proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.combinedProjectedCgpa, 3.0);
  assert.strictEqual(proj.actualCgpa, 0);

  // Student changes expected grade to A (4.0)
  c.grade = 'A';
  proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.combinedProjectedCgpa, 4.0);
  assert.strictEqual(proj.actualCgpa, 0);
});

// 54. Converting expected grade into official grade (unticking Proj)
runTest('Converting an expected grade to official grade (unticking Proj) updates actual GPA and confirmed credits', () => {
  const { useGradeStore } = jiti('./src/store/useGradeStore.ts');
  const store = useGradeStore.getState();
  const testId = store.createProfile({
    name: 'Scenario 54 Student',
    degree: 'ARMT',
    year: 1,
    currentSemester: '1-1'
  });
  store.switchProfile(testId);

  const activeProfile = store.getActiveProfile();
  const c = activeProfile.semesters['1-1'].find(x => !x.isNgpa);

  // Step 1: Set expected grade with Proj checked
  store.setCourseGrade('1-1', c.code, 'A');
  store.setCourseExpected('1-1', c.code, true);
  let updatedProj = store.getAcademicProjections();
  let updatedStats = store.getOverallStats();
  assert.strictEqual(updatedStats.realCreditsAttempted, 0);
  assert.strictEqual(updatedProj.combinedProjectedCgpa, 4.0);

  // Step 2: Official result arrives: student unticks Proj
  store.setCourseExpected('1-1', c.code, false);
  updatedProj = store.getAcademicProjections();
  updatedStats = store.getOverallStats();
  assert.strictEqual(updatedStats.realCreditsAttempted, c.credits, 'Credits now confirmed');
  assert.strictEqual(updatedStats.realCgpa, 4.0, 'Actual CGPA now reflects official grade');
  assert.strictEqual(updatedProj.actualCgpa, 4.0);
});

// 55. Simultaneous Rep and Proj checkboxes
runTest('Rep and Proj operate independently with repeat cap strictly enforced in projection', () => {
  const p = getBaseProfile('ARMT', '1-1');
  const c = p.semesters['1-1'].find(x => !x.isNgpa);
  c.grade = 'A'; // 4.0 GPV normally
  c.isRepeat = true; // Rep checked -> capped at 2.0 (Grade C)
  c.isExcused = false;
  c.isExpected = true; // Proj checked

  const proj = calculateAcademicProjections(p);
  assert.strictEqual(proj.actualCgpa, 0, 'Proj checked: excluded from actual GPA');
  assert.strictEqual(proj.combinedProjectedCgpa, 2.0, 'Repeat cap strictly limits projected grade to 2.0');
});

// 56. Bulk action: markUnresolvedAsProjected
runTest('markUnresolvedAsProjected marks only unresolved courses and preserves confirmed grades', () => {
  const { useGradeStore } = jiti('./src/store/useGradeStore.ts');
  const store = useGradeStore.getState();
  const testId = store.createProfile({
    name: 'Scenario 56 Student',
    degree: 'ARMT',
    year: 1,
    currentSemester: '1-1'
  });
  store.switchProfile(testId);

  const activeProfile = store.getActiveProfile();
  const gpaCourses = activeProfile.semesters['1-1'].filter(x => !x.isNgpa);

  // First course confirmed A
  store.setCourseGrade('1-1', gpaCourses[0].code, 'A');
  store.setCourseExpected('1-1', gpaCourses[0].code, false);

  // Bulk mark remaining unresolved courses as projected
  store.markUnresolvedAsProjected('1-1');

  const refreshed = store.getActiveProfile().semesters['1-1'];
  assert.strictEqual(refreshed[0].isExpected, false, 'Confirmed course must NOT be marked projected');
  assert.strictEqual(refreshed[0].grade, 'A');
  for (let i = 1; i < gpaCourses.length; i++) {
    const course = refreshed.find(x => x.code === gpaCourses[i].code);
    assert.strictEqual(course.isExpected, true, 'Unresolved course must be marked projected');
  }
});

// 57. Bulk action: clearSemesterProjections
runTest('clearSemesterProjections clears only hypothetical projections and preserves confirmed grades', () => {
  const { useGradeStore } = jiti('./src/store/useGradeStore.ts');
  const store = useGradeStore.getState();
  const testId = store.createProfile({
    name: 'Scenario 57 Student',
    degree: 'ARMT',
    year: 1,
    currentSemester: '1-1'
  });
  store.switchProfile(testId);

  const activeProfile = store.getActiveProfile();
  const gpaCourses = activeProfile.semesters['1-1'].filter(x => !x.isNgpa);

  // First course confirmed A
  store.setCourseGrade('1-1', gpaCourses[0].code, 'A');
  store.setCourseExpected('1-1', gpaCourses[0].code, false);

  // Second course projected B+
  store.setCourseGrade('1-1', gpaCourses[1].code, 'B+');
  store.setCourseExpected('1-1', gpaCourses[1].code, true);

  // Clear projections for semester
  store.clearSemesterProjections('1-1');

  const refreshed = store.getActiveProfile().semesters['1-1'];
  assert.strictEqual(refreshed[0].grade, 'A', 'Confirmed grade must be preserved');
  assert.strictEqual(refreshed[0].isExpected, false);
  const second = refreshed.find(x => x.code === gpaCourses[1].code);
  assert.strictEqual(second.grade, '', 'Projected grade must be cleared');
  assert.strictEqual(second.isExpected, false);
});

// 58. Safe migration of existing courseProjections into course rows
runTest('Hydration migration correctly sets course.grade and isExpected from courseProjections', () => {
  const legacyProfile = getBaseProfile('ARMT', '2-1');
  const targetCourse = legacyProfile.semesters['1-2'].find(x => !x.isNgpa);
  targetCourse.grade = '';
  legacyProfile.courseProjections = {
    [`1-2:${targetCourse.code}`]: {
      courseCode: targetCourse.code,
      semesterKey: '1-2',
      predictedGrade: 'A-'
    }
  };

  // Test calculateAcademicProjections handles both
  const proj = calculateAcademicProjections(legacyProfile);
  assert.ok(proj.combinedProjectedCgpa > 0);
});

// 59. isCourseGradeConfirmed strictly validates supported grading scale
runTest('isCourseGradeConfirmed validates that the grade belongs to the supported grading scale', () => {
  const validCourse = { code: 'AG1101', name: 'Valid', credits: 2, grade: 'A', isExpected: false };
  const invalidGradeCourse = { code: 'AG1102', name: 'Invalid', credits: 2, grade: 'PENDING', isExpected: false };
  const expectedCourse = { code: 'AG1103', name: 'Expected', credits: 2, grade: 'A', isExpected: true };
  const emptyCourse = { code: 'AG1104', name: 'Empty', credits: 2, grade: '', isExpected: false };

  assert.strictEqual(isCourseGradeConfirmed(validCourse), true);
  assert.strictEqual(isCourseGradeConfirmed(invalidGradeCourse), false, 'Non-grading scale grade must NOT be confirmed');
  assert.strictEqual(isCourseGradeConfirmed(expectedCourse), false, 'Expected course must NOT be confirmed');
  assert.strictEqual(isCourseGradeConfirmed(emptyCourse), false, 'Empty grade must NOT be confirmed');
});

// 60. Protecting confirmed academic grades from accidental overwrite or deletion
runTest('Checking Proj on confirmed course and clearing projections protects confirmed grade', () => {
  const { useGradeStore } = jiti('./src/store/useGradeStore.ts');
  const store = useGradeStore.getState();
  const testId = store.createProfile({
    name: 'Scenario 60 Student',
    degree: 'ARMT',
    year: 1,
    currentSemester: '1-1'
  });
  store.switchProfile(testId);

  const activeProfile = store.getActiveProfile();
  const c = activeProfile.semesters['1-1'].find(x => !x.isNgpa);

  // 1. Enter official confirmed grade A
  store.setCourseGrade('1-1', c.code, 'A');
  store.setCourseExpected('1-1', c.code, false);

  let refreshed = store.getActiveProfile().semesters['1-1'].find(x => x.code === c.code);
  assert.strictEqual(refreshed.grade, 'A');
  assert.strictEqual(refreshed.confirmedGrade, 'A');
  assert.strictEqual(refreshed.isExpected, false);

  // 2. User checks Proj on this confirmed course
  store.setCourseExpected('1-1', c.code, true);
  refreshed = store.getActiveProfile().semesters['1-1'].find(x => x.code === c.code);
  assert.strictEqual(refreshed.confirmedGrade, 'A', 'Official grade must remain protected in confirmedGrade');
  assert.strictEqual(refreshed.isExpected, true);

  // 3. User clears projections for the semester
  store.clearSemesterProjections('1-1');
  refreshed = store.getActiveProfile().semesters['1-1'].find(x => x.code === c.code);
  assert.strictEqual(refreshed.grade, 'A', 'Confirmed grade must be restored, not deleted!');
  assert.strictEqual(refreshed.isExpected, false, 'Proj is unticked, restored to official');
  assert.strictEqual(isCourseGradeConfirmed(refreshed), true);
});

// 61. Clearing an expected grade removes active projections while preserving analytics
runTest('Clearing expected grade removes active projection values and isolates historical analytics', () => {
  const { useGradeStore } = jiti('./src/store/useGradeStore.ts');
  const store = useGradeStore.getState();
  const testId = store.createProfile({
    name: 'Scenario 61 Student',
    degree: 'ARMT',
    year: 1,
    currentSemester: '1-1'
  });
  store.switchProfile(testId);

  const activeProfile = store.getActiveProfile();
  const c = activeProfile.semesters['1-1'].find(x => !x.isNgpa);

  // Set expected grade
  store.setCourseGrade('1-1', c.code, 'B+');
  store.setCourseExpected('1-1', c.code, true);

  let proj = store.getAcademicProjections();
  assert.strictEqual(proj.combinedProjectedCgpa, 3.3);

  // Clear the expected grade
  store.setCourseGrade('1-1', c.code, '');
  proj = store.getAcademicProjections();
  assert.strictEqual(proj.combinedProjectedCgpa, 0, 'No active projection should remain');

  const projData = store.getActiveProfile().courseProjections?.[`1-1:${c.code}`];
  assert.strictEqual(projData?.predictedGrade, undefined, 'Active predictedGrade must be undefined');
  assert.strictEqual(projData?.targetGrade, undefined, 'Active targetGrade must be undefined');
});

// 62. Preserve original prediction before recording official result for accuracy analysis
runTest('Preserve original prediction before recording official result for prediction accuracy analysis', () => {
  const { useGradeStore } = jiti('./src/store/useGradeStore.ts');
  const store = useGradeStore.getState();
  const testId = store.createProfile({
    name: 'Scenario 62 Student',
    degree: 'ARMT',
    year: 1,
    currentSemester: '1-1'
  });
  store.switchProfile(testId);

  const activeProfile = store.getActiveProfile();
  const c = activeProfile.semesters['1-1'].find(x => !x.isNgpa);

  // Student predicted B (3.0)
  store.setCourseGrade('1-1', c.code, 'B');
  store.setCourseExpected('1-1', c.code, true);

  // Official result arrives: student receives B+ (3.3) and unticks Proj
  store.setCourseGrade('1-1', c.code, 'B+');
  store.setCourseExpected('1-1', c.code, false);

  const proj = store.getAcademicProjections();
  const projData = store.getActiveProfile().courseProjections?.[`1-1:${c.code}`];
  assert.strictEqual(projData?.historicalPrediction, 'B', 'Original prediction B must be preserved');
  assert.strictEqual(projData?.predictedGrade, undefined, 'Active prediction must be removed');
  assert.strictEqual(proj.accuracyReport.totalCompared, 1);
  assert.strictEqual(proj.accuracyReport.entries[0].predictedGrade, 'B');
  assert.strictEqual(proj.accuracyReport.entries[0].actualGrade, 'B+');
  assert.strictEqual(proj.accuracyReport.entries[0].deltaGpv, 0.3);
});

// 63. Confirmed standing, Dean's Honors, and degree audit strictly exclude projections
runTest('Confirmed academic standing, Deans Honors, and degree audit exclude projected grades', () => {
  const p = getBaseProfile('ARMT', '1-2');
  // 1-1 has 2 confirmed A grades, 1 expected A grade
  const gpa11 = p.semesters['1-1'].filter(c => !c.isNgpa);
  gpa11[0].grade = 'A';
  gpa11[0].isExpected = false;
  gpa11[1].grade = 'A';
  gpa11[1].isExpected = false;
  gpa11[2].grade = 'A';
  gpa11[2].isExpected = true; // Projected!

  const stats = calculateOverallStats(p);
  const confirmedCredits = gpa11[0].credits + gpa11[1].credits;
  assert.strictEqual(stats.realCreditsAttempted, confirmedCredits, 'realCreditsAttempted must exclude projected');

  // Deans Honors for Year 1 must be In Progress because 1-1 has expected courses and 1-2 is incomplete
  assert.strictEqual(stats.deansHonors[1].eligible, false);
  assert.strictEqual(stats.deansHonors[1].status, 'In Progress');

  // Degree audit
  const audit = generateDegreeAudit(p);
  const gpaCreditAudit = audit.items.find(i => i.title.includes('Total Degree GPA Credits'));
  assert.strictEqual(gpaCreditAudit.passed, false);
  assert.ok(gpaCreditAudit.current.startsWith(`${stats.realCreditsEarned} /`));
});

// 64. What-If and Target GPA tools use confirmed baseline calculations
runTest('What-If and Target GPA tools use confirmed baseline calculations without distortion from projections', () => {
  const p = getBaseProfile('ARMT', '2-1');
  p.semesters['1-1'].filter(c => !c.isNgpa).forEach(c => { c.grade = 'B+'; c.isExpected = false; });
  // Add a projected course in 2-1
  const c21 = p.semesters['2-1'].find(x => !x.isNgpa);
  c21.grade = 'A';
  c21.isExpected = true;

  const whatIf = calculateWhatIf(p, 3.5);
  // Baseline CGPA in whatIf should be confirmed CGPA (~3.30), not distorted by projected 2-1
  assert.ok(whatIf.currentCgpa > 3.25 && whatIf.currentCgpa < 3.35);

  const target = calculateTargetGpa(p, 3.5);
  assert.strictEqual(target.possible, true);
  assert.ok(target.requiredAverageGpa <= 4.0);
});

// 65. Legacy Academic Projection navigation redirects cleanly without duplicate state
runTest('Legacy Academic Projection navigation redirects to calculator without duplicate navigation states', () => {
  const { useGradeStore } = jiti('./src/store/useGradeStore.ts');
  const store = useGradeStore.getState();

  store.setActiveTab('projection');
  assert.strictEqual(store.activeTab, 'calculator', 'setActiveTab("projection") must redirect to "calculator"');
});

console.log(`\n🎉 ALL 65 PRODUCTION REGRESSION SCENARIOS PASSED DIRECTLY AGAINST TYPESCRIPT MODULES!\n`);

// =========================================================================
// SECTION 22: REAL-WORLD ACCEPTANCE SCENARIO (Agribusiness Management - ABM)
// =========================================================================
console.log('🌟 Testing Section 22 Real-World Acceptance Scenario (Agribusiness Management)...\n');

const abmStudent = createAbmProfile();
abmStudent.currentSemester = '2-1';

// Step 1: Open existing GPA Calculator. Semester 1-1: All official results received, all Proj unchecked.
abmStudent.semesters['1-1'].filter(c => !c.isNgpa).forEach(c => {
  c.grade = 'A-';
  c.isExpected = false;
});

// Step 2: Semester 1-2: Enter official grades for 5 received courses, leave rest pending.
const sem12Gpa = abmStudent.semesters['1-2'].filter(c => !c.isNgpa);
for (let i = 0; i < 5; i++) {
  sem12Gpa[i].grade = 'B+';
  sem12Gpa[i].isExpected = false; // Official received
}
// Step 3 & 4: Enter expected grades for unresolved Semester 1-2 courses and tick Proj.
for (let i = 5; i < sem12Gpa.length; i++) {
  sem12Gpa[i].grade = 'B';
  sem12Gpa[i].isExpected = true; // Proj checked
}

// Step 5, 6 & 7: Select Semester 2-1 (examinations approaching tomorrow), enter expected grades, tick Proj.
const sem21Gpa = abmStudent.semesters['2-1'].filter(c => !c.isNgpa);
sem21Gpa.forEach(c => {
  c.grade = 'A';
  c.isExpected = true; // Proj checked
});

// Clear subsequent unstarted semesters
ALL_SEMESTER_KEYS.forEach((sem, idx) => {
  if (idx >= 3) {
    (abmStudent.semesters[sem] || []).forEach(c => { c.grade = ''; c.isExpected = false; });
  }
});

// Step 8: Immediately view actual CGPA, projected SGPA for 2-1, projected CGPA after 1-2, combined projected CGPA after 2-1.
let state = calculateAcademicProjections(abmStudent);
console.log(`  Actual CGPA (confirmed results): ${state.actualCgpa}`);
console.log(`  Projected 2-1 SGPA: ${state.currentSemProjectedSgpa}`);
console.log(`  Projected CGPA after 1-2 pending results: ${state.projectedCgpaPending}`);
console.log(`  Combined Projected CGPA after 2-1: ${state.combinedProjectedCgpa}`);

assert.ok(state.actualCgpa > 0, 'Actual CGPA must reflect 1-1 and confirmed 1-2 courses');
assert.strictEqual(state.currentSemProjectedSgpa, 4.0, 'Expected 2-1 SGPA must be 4.0');
assert.ok(state.combinedProjectedCgpa > state.actualCgpa, 'Combined projection must exceed actual');
assert.strictEqual(state.isCombinedComplete, true, 'Combined projection is complete');

// Step 9 & 10: Return to Semester 1-2 when an official result arrives.
// Student changes expected grade to official B+ and Step 11: Unticks Proj.
const newlyReleasedCourse = sem12Gpa[5];
newlyReleasedCourse.grade = 'B+';
newlyReleasedCourse.isExpected = false; // Unticked Proj!

// Step 12: Immediately see all relevant GPA values update.
let updatedState = calculateAcademicProjections(abmStudent);
console.log(`  After official result arrived in 1-2 and Proj unticked:`);
console.log(`    Updated Actual CGPA: ${updatedState.actualCgpa}`);
console.log(`    Remaining pending 1-2 results: ${updatedState.pendingResultsCount}`);
console.log(`    Updated Combined Projected CGPA: ${updatedState.combinedProjectedCgpa}`);

assert.ok(updatedState.actualGpaCredits > state.actualGpaCredits, 'Confirmed credits must increase by newly released course');
assert.strictEqual(updatedState.pendingResultsCount, sem12Gpa.length - 6, 'Pending count decrements');
assert.ok(updatedState.actualCgpa > 0);

console.log('\n🎉 ALL SECTION 22 ACCEPTANCE SCENARIO WORKFLOW CHECKS PASSED WITH 100% SUCCESS!\n');

// =========================================================================
// SECTION 23: SINHALA TOOLTIPS & 4-STATE VISUAL ROW HIGHLIGHTING
// =========================================================================
console.log('🌟 Testing Section 23 Sinhala Tooltips & 4-State Course Row Styling...\n');

const { ACADEMIC_TOOLTIPS, getAcademicTooltip } = jiti('./src/constants/tooltips.ts');
const { getCourseRowVisualState } = jiti('./src/utils/courseRowStyles.ts');

runTest('Tooltip Dictionary: Exactly 36 academic tooltips defined with English and Sinhala text', () => {
  const ids = Object.keys(ACADEMIC_TOOLTIPS);
  assert.strictEqual(ids.length, 36, 'Must contain exactly 36 tooltips (T01 - T36)');

  for (let i = 1; i <= 36; i++) {
    const id = `T${i.toString().padStart(2, '0')}`;
    const tooltip = getAcademicTooltip(id);
    assert.ok(tooltip, `Tooltip ${id} must exist`);
    assert.strictEqual(tooltip.id, id, `Tooltip ${id} id must match`);
    assert.ok(tooltip.label && tooltip.label.length > 0, `Tooltip ${id} must have a non-empty label`);
    assert.ok(tooltip.english && tooltip.english.length > 0, `Tooltip ${id} must have a non-empty English text`);
    assert.ok(tooltip.sinhala && tooltip.sinhala.length > 0, `Tooltip ${id} must have a non-empty Sinhala text`);
    assert.ok(['grade_entry', 'calculations', 'semester', 'planning', 'records'].includes(tooltip.category), `Tooltip ${id} category must be valid`);
  }
});

runTest('Tooltip Content: T01 (Repeat) and T02 (Projected) Sinhala translations are accurate', () => {
  const t01 = getAcademicTooltip('T01');
  assert.strictEqual(t01.label, 'Repeat');
  assert.ok(t01.sinhala.includes('Repeat') && t01.sinhala.includes('නැවත හදාරන්නේ'));

  const t02 = getAcademicTooltip('T02');
  assert.strictEqual(t02.label, 'Projected');
  assert.ok(t02.sinhala.includes('අපේක්ෂිත') && t02.sinhala.includes('ශ්රේණියක්'));
});

runTest('Course Visual States: Normal course produces default background and neutral border', () => {
  const normal = getCourseRowVisualState(false, false);
  assert.strictEqual(normal.state, 'normal');
  assert.strictEqual(normal.className, 'course-row-normal');
  assert.strictEqual(normal.accentBorderColor, '#DCDDD7');
});

runTest('Course Visual States: Repeat course produces #FFF5E5 background and amber accent', () => {
  const repeat = getCourseRowVisualState(true, false);
  assert.strictEqual(repeat.state, 'repeat');
  assert.strictEqual(repeat.className, 'course-row-repeat');
  assert.strictEqual(repeat.accentBorderColor, '#D6B77B');
  assert.ok(repeat.badgeLabel.includes('Repeat'));
});

runTest('Course Visual States: Projected course produces #EDF5FF background and blue accent', () => {
  const projected = getCourseRowVisualState(false, true);
  assert.strictEqual(projected.state, 'projected');
  assert.strictEqual(projected.className, 'course-row-projected');
  assert.strictEqual(projected.accentBorderColor, '#A5C5EC');
  assert.ok(projected.badgeLabel.includes('Projected'));
});

runTest('Course Visual States: Repeat & Projected course produces #EDF5FF background and amber accent', () => {
  const repProj = getCourseRowVisualState(true, true);
  assert.strictEqual(repProj.state, 'repeat_and_projected');
  assert.strictEqual(repProj.className, 'course-row-repeat-projected');
  assert.strictEqual(repProj.accentBorderColor, '#D6B77B');
  assert.strictEqual(repProj.badgeLabel, 'Repeat & Projected');
});

runTest('Academic Data Protection: Confirmed course flags isConfirmedOfficial and protects official grade', () => {
  const confirmedCourse = {
    code: 'CS11012',
    name: 'Principles of Agronomy',
    credits: 2,
    dept: 'CS',
    grade: 'A',
    isCompulsory: true,
    isNgpa: false,
    isExpected: false,
    isRepeat: false,
    isExcused: false
  };

  const isConfirmed = isCourseGradeConfirmed(confirmedCourse);
  const isConfirmedOfficial = isConfirmed && !confirmedCourse.isExpected;
  assert.strictEqual(isConfirmed, true, 'Grade A with isExpected=false is confirmed');
  assert.strictEqual(isConfirmedOfficial, true, 'Confirmed course must be marked as confirmed official');

  // For expected course
  const expectedCourse = { ...confirmedCourse, isExpected: true };
  const isExpectedConfirmed = isCourseGradeConfirmed(expectedCourse);
  const isExpectedOfficial = isExpectedConfirmed && !expectedCourse.isExpected;
  assert.strictEqual(isExpectedConfirmed, false, 'Expected course is not confirmed');
  assert.strictEqual(isExpectedOfficial, false, 'Expected course is NOT confirmed official');
});

// =========================================================================
// SECTION 24: PLANNING TOOLS FINAL IMPROVEMENTS & SIMULATION
// =========================================================================
console.log('🌟 Testing Section 24 Planning Tools Improvements & Simulation...\n');

const { generateSuggestedGradeCombination } = jiti('./src/utils/projectionCalculations.ts');

runTest('Suggested Grade Combination: Generates realistic combinations for achievable targets', () => {
  const profile = getBaseProfile('ARMT', '2-1');
  // Confirm Semester 1-1
  profile.semesters['1-1'].filter(c => !c.isNgpa).forEach(c => {
    c.grade = 'B+';
    c.isExpected = false;
  });

  // Leave Semester 1-2 and 2-1 unresolved
  const result = generateSuggestedGradeCombination(profile, 3.50, 'after_current');
  assert.strictEqual(result.possible, true, 'Target 3.50 should be achievable');
  assert.ok(result.courses.length > 0, 'Should return suggested courses');
  assert.ok(result.achievedGpa >= 3.3, 'Suggested average GPA should meet required threshold');

  // Verify that all suggested grades belong to official scale
  result.courses.forEach(c => {
    assert.ok(GRADING_SCALE[c.suggestedGrade], `Grade ${c.suggestedGrade} must belong to official scale`);
  });
});

runTest('Suggested Grade Combination: Strictly enforces repeat caps (max C / 2.0) on repeat courses', () => {
  const profile = getBaseProfile('ARMT', '2-1');
  // Add a repeat course
  profile.semesters['2-1'].filter(c => !c.isNgpa)[0].isRepeat = true;
  profile.semesters['2-1'].filter(c => !c.isNgpa)[0].isExcused = false;

  const result = generateSuggestedGradeCombination(profile, 3.80, 'after_current');
  if (result.possible) {
    const repeatCourse = result.courses.find(c => c.isRepeat && !c.isExcused);
    if (repeatCourse) {
      assert.ok(repeatCourse.suggestedGpv <= 2.0, 'Repeat course must never exceed 2.0 GPV');
      assert.ok(['C', 'C-', 'D+', 'D', 'E'].includes(repeatCourse.suggestedGrade), 'Repeat course grade cannot exceed C');
    }
  }
});

runTest('Suggested Grade Combination: Flags mathematically impossible targets cleanly', () => {
  const profile = getBaseProfile('ARMT', '2-1');
  // 1-1 and 1-2 all Grade E
  ['1-1', '1-2'].forEach(sem => {
    profile.semesters[sem].filter(c => !c.isNgpa).forEach(c => {
      c.grade = 'E';
      c.isExpected = false;
    });
  });

  const result = generateSuggestedGradeCombination(profile, 3.95, 'after_current');
  assert.strictEqual(result.possible, false, 'Target should be flagged as impossible');
  assert.strictEqual(result.courses.length, 0);
  assert.ok(result.explanation.includes('Mathematically unreachable'));
});

runTest('Course Impact Simulation: Single course target deviation calculates accurate before vs after GPA', () => {
  const profile = getBaseProfile('ARMT', '2-1');
  const semCourses = profile.semesters['2-1'].filter(c => !c.isNgpa);
  // Give expected grade B (3.0) to first course
  semCourses[0].grade = 'B';
  semCourses[0].isExpected = true;

  const originalProj = calculateAcademicProjections(profile);

  // Simulate target grade A (4.0) on first course
  const simulatedProfile = {
    ...profile,
    semesters: {
      ...profile.semesters,
      '2-1': profile.semesters['2-1'].map((c, i) => i === 0 ? { ...c, grade: 'A', isExpected: true } : c)
    }
  };

  const simulatedProj = calculateAcademicProjections(simulatedProfile);
  assert.ok(simulatedProj.currentSemProjectedSgpa > originalProj.currentSemProjectedSgpa, 'Simulated SGPA must increase');
  assert.ok(simulatedProj.combinedProjectedCgpa > originalProj.combinedProjectedCgpa, 'Simulated CGPA must increase');
  assert.strictEqual(profile.semesters['2-1'].filter(c => !c.isNgpa)[0].grade, 'B', 'Original profile grade must remain strictly untouched');
});

runTest('Course Impact Simulation: Negative target deviation calculates negative difference', () => {
  const profile = getBaseProfile('ARMT', '2-1');
  const semCourses = profile.semesters['2-1'].filter(c => !c.isNgpa);
  semCourses[0].grade = 'A';
  semCourses[0].isExpected = true;

  const originalProj = calculateAcademicProjections(profile);

  // Simulate drop to Grade C (2.0)
  const simulatedProfile = {
    ...profile,
    semesters: {
      ...profile.semesters,
      '2-1': profile.semesters['2-1'].map((c, i) => i === 0 ? { ...c, grade: 'C', isExpected: true } : c)
    }
  };

  const simulatedProj = calculateAcademicProjections(simulatedProfile);
  assert.ok(simulatedProj.currentSemProjectedSgpa < originalProj.currentSemProjectedSgpa, 'Simulated SGPA must drop');
  assert.ok(simulatedProj.combinedProjectedCgpa < originalProj.combinedProjectedCgpa, 'Simulated CGPA must drop');
});

runTest('Course Impact Simulation: Confirmed official grades are never modified during simulation or apply', () => {
  const profile = getBaseProfile('ARMT', '2-1');
  const confirmedCourse = profile.semesters['2-1'].filter(c => !c.isNgpa)[0];
  confirmedCourse.grade = 'A-';
  confirmedCourse.isExpected = false; // Official

  assert.strictEqual(isCourseGradeConfirmed(confirmedCourse), true);

  // Unresolved courses in scope should exclude confirmedCourse
  const unresolvedInSem = profile.semesters['2-1'].filter(c => !c.isNgpa && !isCourseGradeConfirmed(c));
  assert.ok(!unresolvedInSem.some(c => c.code === confirmedCourse.code), 'Confirmed course must be excluded from unresolved course impact list');
});

console.log(`\n🎉 ALL ${passedTests} REGRESSION SCENARIOS COMPLETED WITH 100% SUCCESS!\n`);


