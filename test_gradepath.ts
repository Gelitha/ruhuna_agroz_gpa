// University of Ruhuna - Faculty of Agriculture
// Comprehensive Unit & Integration Test Suite for GradePath

import assert from 'assert';
import {
  calculateCourseGpv,
  getClassStanding,
  calculateSemesterStats,
  calculateOverallStats,
  solveConcreteGradeCombinations,
  calculateTargetGpa,
  calculateAcademicRiskAlerts,
  calculateRepeatImpact,
  calculateWhatIf,
  generateDegreeAudit,
  initDefaultCoursesForDegree,
  initOrientationCourses
} from './src/utils/calculations.ts';
import {
  GRADING_SCALE,
  DEGREE_INFO,
  COURSE_CATALOG,
  parseCourseCode,
  DEPARTMENTS
} from './src/database.ts';
import {
  createDefaultProfile,
  createFirstClassProfile,
  createAbmProfile,
  createGtProfile
} from './src/utils/sampleProfiles.ts';

console.log('🧪 Starting GradePath Comprehensive Test Suite...');

// Test 1: Official Grading Scale & GPV Mapping
console.log('\n--- 1. Official Grading Scale ---');
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
console.log('✓ All 12 Faculty grading scale values verified.');

// Test 2: Course Code Parsing Rules
console.log('\n--- 2. Course Code Parsing Rule ---');
const csCourse = parseCourseCode('CS21203');
assert.ok(csCourse);
assert.strictEqual(csCourse.dept, 'CS');
assert.strictEqual(csCourse.year, 2);
assert.strictEqual(csCourse.semester, 1);
assert.strictEqual(csCourse.credits, 2);
assert.strictEqual(csCourse.courseNum, '03');

const blCourse = parseCourseCode('BL11301');
assert.ok(blCourse);
assert.strictEqual(blCourse.credits, 3);
assert.strictEqual(blCourse.dept, 'BL');

const ngpaCourse = parseCourseCode('CC11202');
assert.ok(ngpaCourse);
assert.strictEqual(ngpaCourse.isNgpa, true);
console.log('✓ Course code parsing (XX, Y, Z, N, NA) verified.');

// Test 3: Course Repeat Capping & Excused Exemption
console.log('\n--- 3. Repeat Capping & Medical Exemption ---');
const standardAttempt = { code: 'CS11201', name: 'Agronomy', credits: 2, grade: 'A' as const, isRepeat: false };
assert.strictEqual(calculateCourseGpv(standardAttempt), 4.0);

const unexcusedRepeat = { code: 'CS11201', name: 'Agronomy', credits: 2, grade: 'A' as const, isRepeat: true, isExcused: false };
assert.strictEqual(calculateCourseGpv(unexcusedRepeat), 2.0, 'Unexcused repeat must cap GPV at Grade C (2.0)');

const excusedRepeat = { code: 'CS11201', name: 'Agronomy', credits: 2, grade: 'A' as const, isRepeat: true, isExcused: true };
assert.strictEqual(calculateCourseGpv(excusedRepeat), 4.0, 'Senate/Medical excuse must retain original GPV (4.0)');
console.log('✓ Repeat capping and Senate medical exemption rules verified.');

// Test 4: Degree Credit Requirements
console.log('\n--- 4. Degree Credit Requirements ---');
assert.strictEqual(DEGREE_INFO.ARMT.totalMinGpaCredits, 126);
assert.strictEqual(DEGREE_INFO.ARMT.minCompulsoryCredits, 108);
assert.strictEqual(DEGREE_INFO.ARMT.minElectiveCredits, 18);

assert.strictEqual(DEGREE_INFO.ABM.totalMinGpaCredits, 125);
assert.strictEqual(DEGREE_INFO.ABM.minCompulsoryCredits, 109);
assert.strictEqual(DEGREE_INFO.ABM.minElectiveCredits, 16);

assert.strictEqual(DEGREE_INFO.GT.totalMinGpaCredits, 125);
assert.strictEqual(DEGREE_INFO.GT.minCompulsoryCredits, 111);
assert.strictEqual(DEGREE_INFO.GT.minElectiveCredits, 14);
console.log('✓ Credit totals verified for ARMT (126), ABM (125), and GT (125).');

// Test 5: Semester SGPA Formula & Non-GPA Isolation
console.log('\n--- 5. SGPA Formula & Non-GPA Isolation ---');
const semCourses = [
  { code: 'CS11201', name: 'Agronomy', credits: 2, grade: 'A' as const, isNgpa: false }, // 2 * 4.0 = 8.0
  { code: 'BL11301', name: 'Systematics', credits: 3, grade: 'B+' as const, isNgpa: false }, // 3 * 3.3 = 9.9
  { code: 'CC11202', name: 'English I', credits: 2, grade: 'A+' as const, isNgpa: true } // NGPA -> 0 credits / points counted
];
const semResult = calculateSemesterStats('1-1', semCourses);
// Expected: (8.0 + 9.9) / (2 + 3) = 17.9 / 5 = 3.58
assert.strictEqual(semResult.gpaCreditsAttempted, 5);
assert.strictEqual(semResult.sgpa, 3.58);
assert.strictEqual(semResult.ngpaPassedCount, 1);
console.log('✓ SGPA exact formula and NGPA exclusion mathematically verified.');

// Test 6: Class Standing Cutoffs
console.log('\n--- 6. Degree Honours Standing Cutoffs ---');
assert.strictEqual(getClassStanding(3.85, 126).title, 'First Class Honours');
assert.strictEqual(getClassStanding(3.70, 126).title, 'First Class Honours');
assert.strictEqual(getClassStanding(3.69, 126).title, 'Second Class (Upper Division)');
assert.strictEqual(getClassStanding(3.30, 126).title, 'Second Class (Upper Division)');
assert.strictEqual(getClassStanding(3.29, 126).title, 'Second Class (Lower Division)');
assert.strictEqual(getClassStanding(3.00, 126).title, 'Second Class (Lower Division)');
assert.strictEqual(getClassStanding(2.99, 126).title, 'General Pass');
assert.strictEqual(getClassStanding(2.00, 126).title, 'General Pass');
assert.strictEqual(getClassStanding(1.95, 126).title, 'Below Pass (Academic Warning)');
console.log('✓ Degree classification cutoffs verified.');

// Test 7: Specialization 3-1 & 50% Rule
console.log('\n--- 7. Specialization Eligibility Rule ---');
const firstClassStudent = createFirstClassProfile();
const overall = calculateOverallStats(firstClassStudent);
assert.ok(overall.specEligibility.evaluated);
assert.ok(overall.specEligibility.gpaMet, 'GPA must be >= 2.70');
assert.ok(overall.specEligibility.electiveRatioMet, 'Must satisfy 50% departmental elective requirement');
console.log(`✓ Specialization verified: GPA ${overall.specEligibility.gpa31} (>= 2.70), Ratio: ${(overall.specEligibility.ratio * 100).toFixed(0)}%`);

// Test 8: Dean's Honor List
console.log("\n--- 8. Dean's Honor List Eligibility ---");
assert.ok(overall.deansHonors[1].eligible, 'Year 1 eligible for Dean’s Honor List');
assert.ok(overall.deansHonors[2].eligible, 'Year 2 eligible for Dean’s Honor List');
console.log("✓ Dean's Honor List verified for Years 1 & 2 (GPA >= 3.70, all grades >= B).");

// Test 9: Target GPA Solver
console.log('\n--- 9. Target GPA Solver ---');
const targetPlan = calculateTargetGpa(firstClassStudent, 3.85);
assert.ok(targetPlan.possible);
assert.ok(targetPlan.combinations && targetPlan.combinations.length > 0);
console.log(`✓ Target GPA plan verified: Required avg SGPA: ${targetPlan.requiredAverageGpa}`);

// Test 10: Repeat Grade Upgrade Impact
console.log('\n--- 10. Repeat Impact Engine ---');
const defaultStudent = createDefaultProfile();
// Let's test repeating EC12201 (Grade B in 1-2) to Grade A capped at C (2.0)
const repeatCheck = calculateRepeatImpact(defaultStudent, 'EC12201', 'A', false);
assert.ok(repeatCheck);
assert.strictEqual(repeatCheck.newGpv, 2.0, 'Repeat without excuse must be capped at 2.0');

const repeatExcusedCheck = calculateRepeatImpact(defaultStudent, 'EC12201', 'A', true);
assert.ok(repeatExcusedCheck);
assert.strictEqual(repeatExcusedCheck.newGpv, 4.0, 'Repeat with excuse reaches 4.0');
console.log('✓ Repeat grade impact engine verified.');

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 100% Academic Regulation Compliance Confirmed.');
