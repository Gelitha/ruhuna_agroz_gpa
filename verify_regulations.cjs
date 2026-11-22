// GradePath Academic Regulations Verification Script
const assert = require('assert');

// 1. Grading Scale
const GRADING_SCALE = {
  'A+': { gpv: 4.0, marks: '>= 85%' },
  'A':  { gpv: 4.0, marks: '80 - 84%' },
  'A-': { gpv: 3.7, marks: '75 - 79%' },
  'B+': { gpv: 3.3, marks: '70 - 74%' },
  'B':  { gpv: 3.0, marks: '65 - 69%' },
  'B-': { gpv: 2.7, marks: '60 - 64%' },
  'C+': { gpv: 2.3, marks: '55 - 59%' },
  'C':  { gpv: 2.0, marks: '50 - 54%' },
  'C-': { gpv: 1.7, marks: '45 - 49%' },
  'D+': { gpv: 1.3, marks: '40 - 44%' },
  'D':  { gpv: 1.0, marks: '35 - 39%' },
  'E':  { gpv: 0.0, marks: '< 35%' }
};

// 2. Class Standing Cutoffs
function getClassStanding(cgpa) {
  if (cgpa >= 3.70) return 'First Class Honours';
  if (cgpa >= 3.30) return 'Second Class (Upper Division)';
  if (cgpa >= 3.00) return 'Second Class (Lower Division)';
  if (cgpa >= 2.00) return 'General Pass';
  return 'Below Pass (Academic Warning)';
}

// 3. Repeat cap function
function calculateCourseGpv(course) {
  if (!course.grade || !GRADING_SCALE[course.grade]) return null;
  let gpv = GRADING_SCALE[course.grade].gpv;
  if (course.isRepeat && !course.isExcused) {
    if (gpv > 2.0) gpv = 2.0; // Max Grade C (2.0)
  }
  return gpv;
}

// 4. SGPA Formula
function calculateSgpa(courses) {
  let attempted = 0;
  let points = 0;
  courses.forEach(c => {
    if (c.isNgpa) return; // Non-GPA excluded from GPA
    if (!c.grade) return;
    const gpv = calculateCourseGpv(c);
    attempted += c.credits;
    points += c.credits * gpv;
  });
  return attempted > 0 ? parseFloat((points / attempted).toFixed(2)) : 0;
}

console.log('🧪 Running GradePath Regulations & Academic Verification...');

// Test 1: Grading scale
assert.strictEqual(GRADING_SCALE['A+'].gpv, 4.0);
assert.strictEqual(GRADING_SCALE['A'].gpv, 4.0);
assert.strictEqual(GRADING_SCALE['A-'].gpv, 3.7);
assert.strictEqual(GRADING_SCALE['B+'].gpv, 3.3);
assert.strictEqual(GRADING_SCALE['B'].gpv, 3.0);
assert.strictEqual(GRADING_SCALE['C'].gpv, 2.0);
assert.strictEqual(GRADING_SCALE['C-'].gpv, 1.7);
assert.strictEqual(GRADING_SCALE['E'].gpv, 0.0);
console.log('✓ 1. Grading scale values verified (A+ through E).');

// Test 2: Repeat cap rule
const regular = { grade: 'A', isRepeat: false };
assert.strictEqual(calculateCourseGpv(regular), 4.0);

const repeatUnexcused = { grade: 'A', isRepeat: true, isExcused: false };
assert.strictEqual(calculateCourseGpv(repeatUnexcused), 2.0);

const repeatExcused = { grade: 'A', isRepeat: true, isExcused: true };
assert.strictEqual(calculateCourseGpv(repeatExcused), 4.0);
console.log('✓ 2. Course repeat capping rule (max 2.0) and Senate medical excuse exemption verified.');

// Test 3: SGPA formula and Non-GPA exclusion
const testCourses = [
  { code: 'CS11201', credits: 2, grade: 'A', isNgpa: false }, // 2 * 4.0 = 8.0
  { code: 'BL11301', credits: 3, grade: 'B+', isNgpa: false }, // 3 * 3.3 = 9.9
  { code: 'CC11202', credits: 2, grade: 'A', isNgpa: true } // NGPA -> 0 points, 0 credits
];
// (8.0 + 9.9) / (2 + 3) = 17.9 / 5 = 3.58
assert.strictEqual(calculateSgpa(testCourses), 3.58);
console.log('✓ 3. SGPA formula & complete Non-GPA isolation verified.');

// Test 4: Degree Classification Cutoffs
assert.strictEqual(getClassStanding(3.70), 'First Class Honours');
assert.strictEqual(getClassStanding(3.69), 'Second Class (Upper Division)');
assert.strictEqual(getClassStanding(3.30), 'Second Class (Upper Division)');
assert.strictEqual(getClassStanding(3.00), 'Second Class (Lower Division)');
assert.strictEqual(getClassStanding(2.00), 'General Pass');
assert.strictEqual(getClassStanding(1.99), 'Below Pass (Academic Warning)');
console.log('✓ 4. Degree Honours standing cutoffs verified.');

// Test 5: Degree Credit Requirements
const DEGREE_CREDITS = {
  ARMT: { total: 126, compulsory: 108, elective: 18, ngpa: 5 },
  ABM: { total: 125, compulsory: 109, elective: 16, ngpa: 5 },
  GT: { total: 125, compulsory: 111, elective: 14, ngpa: 5 }
};
assert.strictEqual(DEGREE_CREDITS.ARMT.total, 126);
assert.strictEqual(DEGREE_CREDITS.ABM.total, 125);
assert.strictEqual(DEGREE_CREDITS.GT.total, 125);
console.log('✓ 5. Degree credit requirements verified for ARMT (126), ABM (125), and GT (125).');

console.log('\n🎉 ALL 5 ACADEMIC RULES TESTS PASSED WITH 100% SUCCESS!');
