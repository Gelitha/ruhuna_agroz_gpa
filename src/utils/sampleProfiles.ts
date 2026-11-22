// University of Ruhuna - Faculty of Agriculture
// Pre-populated realistic sample profiles for demonstration and testing

import { StudentProfile, SemesterKey, DegreeCode } from '../types';
import { initDefaultCoursesForDegree, initOrientationCourses } from './calculations';

export function createCleanProfile(
  degree: DegreeCode = 'ARMT',
  name = 'Undergraduate Student',
  registrationNumber = '',
  currentAcademicYear = 1,
  currentSemester: SemesterKey = '1-1'
): StudentProfile {
  const specializationDept = degree === 'ABM' ? 'EC' : degree === 'GT' ? 'EN' : 'CS';
  return {
    id: `prof_user_${Date.now()}`,
    name,
    registrationNumber,
    degree,
    batch: `${currentAcademicYear === 1 ? '46th' : currentAcademicYear === 2 ? '45th' : currentAcademicYear === 3 ? '44th' : '43rd'} Batch`,
    currentAcademicYear,
    currentSemester,
    specializationDept,
    specializationResearch: degree === 'GT' ? 'EN42601' : `${specializationDept}42601`,
    semesters: initDefaultCoursesForDegree(degree, specializationDept),
    orientationCourses: initOrientationCourses(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function createDefaultProfile(): StudentProfile {
  const semesters = initDefaultCoursesForDegree('ARMT', 'CS');

  // Fill in some realistic Year 1 grades for ARMT
  const y11Grades: Record<string, string> = {
    'AS11201': 'A',
    'BL11301': 'A-',
    'CC11201': 'A+',
    'CS11201': 'A',
    'EC11201': 'B+',
    'EN11201': 'A-',
    'FS11201': 'A',
    'CC11202': 'A-' // NGPA
  };

  const y12Grades: Record<string, string> = {
    'AS12301': 'A-',
    'BL12201': 'B+',
    'CS12201': 'A',
    'EC12201': 'B',
    'EN12201': 'A-',
    'FS12201': 'B+',
    'SS12301': 'A',
    'CC12101': 'B+', // NGPA
    'CC12202': 'A-'  // NGPA
  };

  semesters['1-1'].forEach(c => {
    if (y11Grades[c.code]) c.grade = y11Grades[c.code] as any;
  });

  semesters['1-2'].forEach(c => {
    if (y12Grades[c.code]) c.grade = y12Grades[c.code] as any;
  });

  return {
    id: 'prof_gjay',
    name: 'Gjay',
    registrationNumber: 'AG/2021/7740',
    degree: 'ARMT',
    batch: '44th Batch (2021/2022)',
    currentAcademicYear: 2,
    currentSemester: '2-1',
    specializationDept: 'CS',
    specializationResearch: 'CS42601',
    semesters,
    orientationCourses: initOrientationCourses(),
    createdAt: '2026-01-15T08:30:00.000Z',
    updatedAt: new Date().toISOString()
  };
}

export function createFirstClassProfile(): StudentProfile {
  const semesters = initDefaultCoursesForDegree('ARMT', 'CS');

  const gradeMap: Record<string, string> = {
    // 1-1
    'AS11201': 'A+', 'BL11301': 'A', 'CC11201': 'A+', 'CS11201': 'A+', 'EC11201': 'A', 'EN11201': 'A-', 'FS11201': 'A', 'CC11202': 'A',
    // 1-2
    'AS12301': 'A', 'BL12201': 'A', 'CS12201': 'A+', 'EC12201': 'A-', 'EN12201': 'A', 'FS12201': 'A', 'SS12301': 'A+', 'CC12101': 'A', 'CC12202': 'A',
    // 2-1
    'AS21101': 'A', 'AS21102': 'A+', 'BL21201': 'A', 'BL21205': 'A-', 'CS21201': 'A+', 'EC21201': 'A', 'EN21201': 'A', 'FS21201': 'A', 'SS21201': 'A',
    // 2-2
    'AS22201': 'A', 'AS22102': 'A+', 'BL22201': 'A', 'CS22201': 'A+', 'CS22202': 'A+', 'EC22201': 'A-', 'EN22201': 'A',
    // 3-1
    'AS31201': 'A', 'CS31201': 'A+', 'EC31201': 'A', 'EN31201': 'A-', 'FS31201': 'A', 'SS31201': 'A+'
  };

  (Object.keys(semesters) as SemesterKey[]).forEach(key => {
    semesters[key].forEach((c: any) => {
      if (gradeMap[c.code]) c.grade = gradeMap[c.code] as any;
    });
  });

  // Add 3-1 Crop Science electives to satisfy 50% rule
  semesters['3-1'].push(
    { code: 'CS31203', name: 'Plant Tissue Culture', credits: 2, dept: 'CS', isCompulsory: false, grade: 'A+' },
    { code: 'CS31205', name: 'Organic Agriculture', credits: 2, dept: 'CS', isCompulsory: false, grade: 'A' }
  );

  return {
    id: 'prof_first_class',
    name: 'Kasun Perera',
    registrationNumber: 'AG/2020/7102',
    degree: 'ARMT',
    batch: '43rd Batch (2020/2021)',
    currentAcademicYear: 3,
    currentSemester: '3-2',
    specializationDept: 'CS',
    specializationResearch: 'CS42601',
    semesters,
    orientationCourses: initOrientationCourses(),
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: new Date().toISOString()
  };
}

export function createAbmProfile(): StudentProfile {
  const semesters = initDefaultCoursesForDegree('ABM', 'EC');

  const abmGrades: Record<string, string> = {
    // 1-1
    'AS11201': 'B+', 'BL11301': 'B', 'CC11201': 'A', 'CS11201': 'B+', 'EC11201': 'A', 'EC11202': 'A-', 'FS11201': 'B+', 'CC11202': 'B+',
    // 1-2
    'AS12301': 'B', 'CS12201': 'B+', 'EC12201': 'A-', 'EC12202': 'A', 'EC12203': 'A', 'EN12201': 'B+', 'FS12201': 'B', 'SS12301': 'B+', 'CC12101': 'A-', 'CC12202': 'A',
    // 2-1
    'AS21102': 'B+', 'CS21201': 'B', 'EC21201': 'A', 'EC21202': 'A-', 'EC21204': 'A', 'EC21205': 'A', 'EN21201': 'B', 'FS21201': 'B+'
  };

  (Object.keys(semesters) as SemesterKey[]).forEach(key => {
    semesters[key].forEach((c: any) => {
      if (abmGrades[c.code]) c.grade = abmGrades[c.code] as any;
    });
  });

  return {
    id: 'prof_abm',
    name: 'Tharushi Silva',
    registrationNumber: 'AG/ABM/2021/8024',
    degree: 'ABM',
    batch: '44th Batch (2021/2022)',
    currentAcademicYear: 2,
    currentSemester: '2-2',
    specializationDept: 'EC',
    specializationResearch: 'EC42601',
    semesters,
    orientationCourses: initOrientationCourses(),
    createdAt: '2026-02-01T14:20:00.000Z',
    updatedAt: new Date().toISOString()
  };
}

export function createGtProfile(): StudentProfile {
  const semesters = initDefaultCoursesForDegree('GT', 'EN');

  const gtGrades: Record<string, string> = {
    'CC11203': 'A-', 'CS11201': 'B+', 'EC11203': 'B', 'EN11201': 'A', 'EN11302': 'A-', 'EN11203': 'A', 'EN11204': 'B+', 'CC11202': 'A-',
    'BL12202': 'B+', 'BL12203': 'A-', 'EN12202': 'A', 'EN12203': 'A', 'EN12204': 'A-', 'EN12205': 'B+', 'SS12301': 'B+', 'CC12101': 'B+', 'CC12202': 'A-'
  };

  (Object.keys(semesters) as SemesterKey[]).forEach(key => {
    semesters[key].forEach((c: any) => {
      if (gtGrades[c.code]) c.grade = gtGrades[c.code] as any;
    });
  });

  return {
    id: 'prof_gt',
    name: 'Naveen Bandara',
    registrationNumber: 'AG/GT/2022/9105',
    degree: 'GT',
    batch: '45th Batch (2022/2023)',
    currentAcademicYear: 2,
    currentSemester: '2-1',
    specializationDept: 'EN',
    specializationResearch: 'EN42601',
    semesters,
    orientationCourses: initOrientationCourses(),
    createdAt: '2026-02-10T09:15:00.000Z',
    updatedAt: new Date().toISOString()
  };
}

