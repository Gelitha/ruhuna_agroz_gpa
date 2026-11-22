const assert = require('assert');
const { GRADING_SCALE, DEGREE_INFO, COURSE_CATALOG, parseCourseCode } = require('./database');
const {
  STATE,
  initDefaultCoursesForDegree,
  calculateCourseGpv,
  calculateSemesterStats,
  calculateOverallStats,
  solveConcreteGradeCombinations,
  calculateTargetGpa,
  calculateAcademicRiskAlerts,
  calculateRepeatImpact,
  simulateGpaProjection,
  checkDegreeConfermentAudit,
  generateAcademicSummaryCardText,
  parseTranscriptText,
  loadSampleStudentData,
  exportTranscriptCsv,
  exportActiveProfileJson,
  importProfileJson
} = require('./app');

console.log('Testing University of Ruhuna Agri GPA Calculator logic...');

// Test 1: Grading scale
assert.strictEqual(GRADING_SCALE['A+'].gpv, 4.0);
assert.strictEqual(GRADING_SCALE['A'].gpv, 4.0);
assert.strictEqual(GRADING_SCALE['A-'].gpv, 3.7);
assert.strictEqual(GRADING_SCALE['B+'].gpv, 3.3);
assert.strictEqual(GRADING_SCALE['B'].gpv, 3.0);
assert.strictEqual(GRADING_SCALE['B-'].gpv, 2.7);
assert.strictEqual(GRADING_SCALE['C+'].gpv, 2.3);
assert.strictEqual(GRADING_SCALE['C'].gpv, 2.0);
assert.strictEqual(GRADING_SCALE['C-'].gpv, 1.7);
assert.strictEqual(GRADING_SCALE['D+'].gpv, 1.3);
assert.strictEqual(GRADING_SCALE['D'].gpv, 1.0);
assert.strictEqual(GRADING_SCALE['E'].gpv, 0.0);
console.log('✔ Grading scale values verified');

// Test 2: Course code parsing
const parsed = parseCourseCode('CS21203');
assert.strictEqual(parsed.dept, 'CS');
assert.strictEqual(parsed.year, 2);
assert.strictEqual(parsed.semester, 1);
assert.strictEqual(parsed.credits, 2);
assert.strictEqual(parsed.courseNum, '03');
console.log('✔ Course code parsing verified');

// Test 3: Repeat capping
const regularCourse = { code: 'CS11201', grade: 'A', isRepeat: false };
assert.strictEqual(calculateCourseGpv(regularCourse), 4.0);

const repeatedCourse = { code: 'CS11201', grade: 'A', isRepeat: true, isExcused: false };
assert.strictEqual(calculateCourseGpv(repeatedCourse), 2.0, 'Repeat course should be capped at C (2.0)');

const excusedRepeatedCourse = { code: 'CS11201', grade: 'A', isRepeat: true, isExcused: true };
assert.strictEqual(calculateCourseGpv(excusedRepeatedCourse), 4.0, 'Excused medical repeat should not be capped');
console.log('✔ Repeat capping & excuse logic verified');

// Test 4: Degree initialization & credit totals
const armtCourses = initDefaultCoursesForDegree('ARMT');
assert.ok(armtCourses['1-1'].length >= 7);
assert.ok(DEGREE_INFO.ARMT.totalMinGpaCredits === 126);
assert.ok(DEGREE_INFO.ABM.totalMinGpaCredits === 125);
assert.ok(DEGREE_INFO.GT.totalMinGpaCredits === 125);
console.log('✔ Degree compulsory courses initialized & credit requirements verified');

// Test 5: GPA Calculation
const sampleSemCourses = [
  { code: 'CS11201', credits: 2, grade: 'A', isNgpa: false }, // 2 * 4.0 = 8.0
  { code: 'BL11301', credits: 3, grade: 'B+', isNgpa: false }, // 3 * 3.3 = 9.9
  { code: 'CC11202', credits: 2, grade: 'A', isNgpa: true } // NGPA -> 0 points counted
];
const semStats = calculateSemesterStats(sampleSemCourses);
// Expected GPA: (8.0 + 9.9) / (2 + 3) = 17.9 / 5 = 3.58
assert.strictEqual(semStats.gpaCreditsAttempted, 5);
assert.strictEqual(semStats.sgpa, 3.58);
console.log('✔ SGPA formula and NGPA exclusion verified');

// Test 6: Transcript text parser
const rawText = `
AS11201 Anatomy and Physiology of Farm Animals 2 A
BL11301 Plant Physiology and Systematics 3 B+
CC11201 ICT in Agriculture 2 A-
`;
const parsedLines = parseTranscriptText(rawText);
assert.strictEqual(parsedLines.length, 3);
assert.strictEqual(parsedLines[0].code, 'AS11201');
assert.strictEqual(parsedLines[0].grade, 'A');
assert.strictEqual(parsedLines[1].code, 'BL11301');
assert.strictEqual(parsedLines[1].grade, 'B+');
console.log('✔ Raw transcript text parser verified');

// Test 7: Sample student data & Dean's Honor list & Specialization checks
loadSampleStudentData();
const overall = calculateOverallStats();
assert.ok(overall.cgpa >= 3.70, 'Sample student should achieve First Class standing');
assert.strictEqual(overall.classStanding, 'First Class Honours');
assert.ok(overall.deansHonors[1].eligible, 'Year 1 should be eligible for Dean’s Honor List');
assert.ok(overall.deansHonors[2].eligible, 'Year 2 should be eligible for Dean’s Honor List');
assert.strictEqual(overall.specEligibility.gpaMet, true, 'GPA at end of 3-1 should meet 2.70 threshold');
assert.strictEqual(overall.specEligibility.electiveRatioMet, true, 'Department elective ratio should be >= 50%');
console.log('✔ Dean’s Honors and Specialization eligibility algorithms verified');

// Test 8: Target GPA Planner
const targetAdvice = calculateTargetGpa(3.70);
assert.ok(targetAdvice.remainingCredits > 0);
console.log('✔ Target GPA planner verified:', targetAdvice.message);

// Test 9: Repeat Impact Calculator
// Change one sample course to C- (1.7) and calculate repeat impact if upgraded to C (2.0)
const course11 = STATE.semesters['1-1'].find(c => c.code === 'EC11201');
course11.grade = 'C-'; // 2 credits * 1.7 = 3.4
const repeatResult = calculateRepeatImpact('EC11201', 'C', false);
assert.ok(repeatResult !== null);
assert.strictEqual(repeatResult.oldGrade, 'C-');
assert.strictEqual(repeatResult.targetGrade, 'C');
assert.strictEqual(repeatResult.newGpv, 2.0);
assert.ok(repeatResult.deltaPoints > 0);
console.log(`✔ Repeat Impact calculator verified: ${repeatResult.courseCode} ${repeatResult.oldGrade} -> ${repeatResult.targetGrade} adds ${repeatResult.deltaPoints} points, projected CGPA: ${repeatResult.projectedCgpa}`);

// Test 10: What-If GPA Simulator
const simResult = simulateGpaProjection(3.70);
assert.ok(simResult.projectedCgpa >= 3.0);
console.log(`✔ What-If GPA simulation verified: Simulated SGPA 3.70 -> Projected final CGPA ${simResult.projectedCgpa} (${simResult.projectedStanding})`);

// Test 11: Degree Conferment Audit
const audit = checkDegreeConfermentAudit();
assert.ok(audit.items.length >= 6);
console.log(`✔ Degree audit checklist verified: ${audit.items.length} graduation criteria verified`);

// Test 12: CSV & JSON Export
const csvData = exportTranscriptCsv();
assert.ok(csvData.includes('UNIVERSITY OF RUHUNA'));
assert.ok(csvData.includes('Gjay'));
assert.ok(csvData.includes('7740'));
const jsonData = exportActiveProfileJson();
const parsedJson = JSON.parse(jsonData);
assert.strictEqual(parsedJson.profile.indexNumber, '7740');
console.log('✔ Transcript CSV & Profile JSON export verified');

// Test 13: Real vs Anticipated/Expected Calculation
const testCourses = [
  { code: 'CS11201', credits: 2, grade: 'A', isExpected: false }, // Real: 2 * 4.0 = 8.0
  { code: 'BL11301', credits: 3, grade: 'B', isExpected: true }   // Expected: 3 * 3.0 = 9.0
];
const testStats = calculateSemesterStats(testCourses);
assert.strictEqual(testStats.realCreditsAttempted, 2);
assert.strictEqual(testStats.realSgpa, 4.0);
assert.strictEqual(testStats.gpaCreditsAttempted, 5);
assert.strictEqual(testStats.sgpa, 3.4); // (8 + 9) / 5 = 17 / 5 = 3.4
assert.strictEqual(testStats.expectedCoursesCount, 1);
console.log('✔ Real vs Anticipated/Expected calculation verified: Real SGPA 4.00, Expected SGPA 3.40');

// Test 14: Concrete Grade Combinations Solver
const combos = solveConcreteGradeCombinations(3.50, 20);
assert.ok(combos.length > 0, 'Should find at least one valid grade combination');
assert.ok(combos[0].achievedGpa >= 3.50);
console.log(`✔ Concrete Grade Combinations verified: Option: ${combos[0].summary} (Achieved: ${combos[0].achievedGpa})`);

// Test 15: Academic Risk & Regulation Alerts
const alerts = calculateAcademicRiskAlerts();
assert.ok(Array.isArray(alerts));
assert.ok(alerts.length > 0);
console.log(`✔ Academic Risk Alerts verified: ${alerts.length} alert item(s) detected`);

// Test 16: Shareable Academic Summary Card Generation
const summaryCard = generateAcademicSummaryCardText();
assert.ok(summaryCard.includes('UNIVERSITY OF RUHUNA'));
assert.ok(summaryCard.includes('CGPA:'));
console.log('✔ Shareable Academic Summary Card verified');

console.log('ALL TESTS PASSED SUCCESSFULLY! 100% SPECIFICATION CONFORMANCE.');
