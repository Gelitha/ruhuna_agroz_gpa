// University of Ruhuna - Faculty of Agriculture
// 2023/24 Undergraduate Handbook - Complete Academic Regulations & Official Course Catalog
// Strictly aligned with Faculty Specification: ARMT (126 Cr), ABM (125 Cr), GT (125 Cr)

import { GradingScaleEntry, DegreeCode, SemesterKey } from './types';

export const GRADING_SCALE: Record<string, GradingScaleEntry> = {
  'A+': { gpv: 4.0, status: 'Pass', marks: '>= 85%' },
  'A':  { gpv: 4.0, status: 'Pass', marks: '80 - 84%' },
  'A-': { gpv: 3.7, status: 'Pass', marks: '75 - 79%' },
  'B+': { gpv: 3.3, status: 'Pass', marks: '70 - 74%' },
  'B':  { gpv: 3.0, status: 'Pass', marks: '65 - 69%' },
  'B-': { gpv: 2.7, status: 'Pass', marks: '60 - 64%' },
  'C+': { gpv: 2.3, status: 'Pass', marks: '55 - 59%' },
  'C':  { gpv: 2.0, status: 'Pass (Repeat Cap)', marks: '50 - 54%' },
  'C-': { gpv: 1.7, status: 'Conditional (NGPA Pass)', marks: '45 - 49%' },
  'D+': { gpv: 1.3, status: 'Conditional', marks: '40 - 44%' },
  'D':  { gpv: 1.0, status: 'Conditional', marks: '35 - 39%' },
  'E':  { gpv: 0.0, status: 'Fail (Must Repeat)', marks: '< 35%' }
};

export const DEPARTMENTS: Record<string, string> = {
  AS: 'Department of Animal Science',
  BL: 'Department of Agricultural Biology',
  CS: 'Department of Crop Science',
  EC: 'Department of Agricultural Economics & Agribusiness',
  EN: 'Department of Agricultural Engineering & Environmental Technology',
  FS: 'Department of Food Science & Technology',
  SS: 'Department of Soil Science',
  CC: 'Common / Interdisciplinary / Computer Unit'
};

// Vibrant Department Colors & Badges for UI
export const DEPARTMENT_COLORS: Record<string, { bg: string; text: string; border: string; glow: string; icon: string }> = {
  AS: { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300', glow: 'bg-amber-500/20', icon: '🐄' },
  BL: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300', glow: 'bg-emerald-500/20', icon: '🔬' },
  CS: { bg: 'bg-lime-100', text: 'text-lime-900', border: 'border-lime-300', glow: 'bg-lime-500/20', icon: '🌱' },
  EC: { bg: 'bg-sky-100', text: 'text-sky-900', border: 'border-sky-300', glow: 'bg-sky-500/20', icon: '📊' },
  EN: { bg: 'bg-indigo-100', text: 'text-indigo-900', border: 'border-indigo-300', glow: 'bg-indigo-500/20', icon: '⚙️' },
  FS: { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-300', glow: 'bg-rose-500/20', icon: '🧪' },
  SS: { bg: 'bg-orange-100', text: 'text-orange-950', border: 'border-orange-300', glow: 'bg-orange-500/20', icon: '🌍' },
  CC: { bg: 'bg-teal-100', text: 'text-teal-900', border: 'border-teal-300', glow: 'bg-teal-500/20', icon: '🏛️' }
};

export function getDepartmentStyle(dept?: string) {
  if (!dept || !DEPARTMENT_COLORS[dept]) {
    return { bg: 'bg-neutral-100', text: 'text-neutral-800', border: 'border-neutral-300', glow: 'bg-neutral-500/20', icon: '📖' };
  }
  return DEPARTMENT_COLORS[dept];
}

export interface DegreeConfig {
  code: DegreeCode;
  name: string;
  shortName: string;
  totalMinGpaCredits: number;
  minElectiveCredits: number;
  minCompulsoryCredits: number;
  nonGpaCredits: number;
  hasSpecializationChoice: boolean;
  semesters: Record<SemesterKey, { compulsoryCredits: number; minElectives: number }>;
}

export const DEGREE_INFO: Record<DegreeCode, DegreeConfig> = {
  ARMT: {
    code: 'ARMT',
    name: 'BSc Hons in Agricultural Resource Management & Technology',
    shortName: 'ARMT',
    totalMinGpaCredits: 126,
    minElectiveCredits: 18,
    minCompulsoryCredits: 108, // 93 core Y1-Y3 + 6 common 4-1 + 6 spec 4-1 + 9 4-2
    nonGpaCredits: 5,
    hasSpecializationChoice: true,
    semesters: {
      '1-1': { compulsoryCredits: 15, minElectives: 0 },
      '1-2': { compulsoryCredits: 16, minElectives: 0 },
      '2-1': { compulsoryCredits: 16, minElectives: 0 },
      '2-2': { compulsoryCredits: 13, minElectives: 2 },
      '3-1': { compulsoryCredits: 12, minElectives: 4 },
      '3-2': { compulsoryCredits: 15, minElectives: 4 },
      '4-1': { compulsoryCredits: 12, minElectives: 0 }, // 6 common + 6 spec
      '4-2': { compulsoryCredits: 9, minElectives: 0 }  // 6 research + 3 internship
    }
  },
  ABM: {
    code: 'ABM',
    name: 'BSc Hons in Agribusiness Management',
    shortName: 'ABM',
    totalMinGpaCredits: 125,
    minElectiveCredits: 16,
    minCompulsoryCredits: 109, // 94 core Y1-Y3 + 6 common 4-1 + 6 spec 4-1 + 9 4-2
    nonGpaCredits: 5,
    hasSpecializationChoice: true,
    semesters: {
      '1-1': { compulsoryCredits: 15, minElectives: 0 },
      '1-2': { compulsoryCredits: 18, minElectives: 0 },
      '2-1': { compulsoryCredits: 15, minElectives: 0 },
      '2-2': { compulsoryCredits: 16, minElectives: 0 },
      '3-1': { compulsoryCredits: 12, minElectives: 4 },
      '3-2': { compulsoryCredits: 12, minElectives: 4 },
      '4-1': { compulsoryCredits: 12, minElectives: 0 }, // 6 common + 6 spec
      '4-2': { compulsoryCredits: 9, minElectives: 0 }  // 6 research + 3 internship
    }
  },
  GT: {
    code: 'GT',
    name: 'BSc Hons in Green Technology',
    shortName: 'GT',
    totalMinGpaCredits: 125,
    minElectiveCredits: 14,
    minCompulsoryCredits: 111, // 102 core Y1-Y4-1 + 9 4-2
    nonGpaCredits: 5,
    hasSpecializationChoice: false,
    semesters: {
      '1-1': { compulsoryCredits: 15, minElectives: 0 },
      '1-2': { compulsoryCredits: 15, minElectives: 0 },
      '2-1': { compulsoryCredits: 16, minElectives: 0 },
      '2-2': { compulsoryCredits: 16, minElectives: 0 },
      '3-1': { compulsoryCredits: 14, minElectives: 2 },
      '3-2': { compulsoryCredits: 14, minElectives: 2 },
      '4-1': { compulsoryCredits: 12, minElectives: 0 }, // All 12 cr compulsory
      '4-2': { compulsoryCredits: 9, minElectives: 0 }  // 6 research + 3 internship
    }
  }
};

export interface CatalogCourse {
  code: string;
  name: string;
  credits: number;
  isNgpa: boolean;
  dept: string;
  semester: string;
  isElective?: boolean;
  isCompulsory?: boolean;
  specDept?: string;
  degrees?: DegreeCode[]; // Which degree programmes this course is offered for
}

export const COURSE_CATALOG: Record<string, CatalogCourse> = {
  // =========================================================================
  // 6.1. Orientation & Non-GPA Courses (All Degrees)
  // =========================================================================
  'CC10001': { code: 'CC10001', name: 'General English', credits: 0, isNgpa: true, dept: 'CC', semester: 'Orientation', degrees: ['ARMT', 'ABM', 'GT'] },
  'CC10002': { code: 'CC10002', name: 'Computer Awareness', credits: 0, isNgpa: true, dept: 'CC', semester: 'Orientation', degrees: ['ARMT', 'ABM', 'GT'] },
  'CC10003': { code: 'CC10003', name: 'Basic Mathematics', credits: 0, isNgpa: true, dept: 'CC', semester: 'Orientation', degrees: ['ARMT', 'ABM', 'GT'] },
  'CC10004': { code: 'CC10004', name: 'Basic Statistics', credits: 0, isNgpa: true, dept: 'CC', semester: 'Orientation', degrees: ['ARMT', 'ABM', 'GT'] },
  'CC10005': { code: 'CC10005', name: 'Career Development and Active Citizen', credits: 0, isNgpa: true, dept: 'CC', semester: 'Orientation', degrees: ['ARMT', 'ABM', 'GT'] },
  'CC11202': { code: 'CC11202', name: 'English I', credits: 2, isNgpa: true, dept: 'CC', semester: '1-1', degrees: ['ARMT', 'ABM', 'GT'] },
  'CC12101': { code: 'CC12101', name: 'Basic Technical Writing', credits: 1, isNgpa: true, dept: 'CC', semester: '1-2', degrees: ['ARMT', 'ABM', 'GT'] },
  'CC12202': { code: 'CC12202', name: 'English II', credits: 2, isNgpa: true, dept: 'CC', semester: '1-2', degrees: ['ARMT', 'ABM', 'GT'] },

  // =========================================================================
  // 6.2. Year 1, Semester 1 (1-1) Compulsory Courses
  // =========================================================================
  'AS11201': { code: 'AS11201', name: 'Anatomy and Physiology of Farm Animals', credits: 2, isNgpa: false, dept: 'AS', semester: '1-1', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'BL11301': { code: 'BL11301', name: 'Plant Physiology and Systematics', credits: 3, isNgpa: false, dept: 'BL', semester: '1-1', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'CC11201': { code: 'CC11201', name: 'Information and Communication Technology in Agriculture', credits: 2, isNgpa: false, dept: 'CC', semester: '1-1', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'CC11203': { code: 'CC11203', name: 'Information and Communication Technology', credits: 2, isNgpa: false, dept: 'CC', semester: '1-1', isCompulsory: true, degrees: ['GT'] },
  'CS11201': { code: 'CS11201', name: 'Principles of Agronomy', credits: 2, isNgpa: false, dept: 'CS', semester: '1-1', isCompulsory: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'EC11201': { code: 'EC11201', name: 'Micro Economics', credits: 2, isNgpa: false, dept: 'EC', semester: '1-1', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'EC11202': { code: 'EC11202', name: 'Economic Statistics', credits: 2, isNgpa: false, dept: 'EC', semester: '1-1', isCompulsory: true, degrees: ['ABM'] },
  'EC11203': { code: 'EC11203', name: 'Economic Principles', credits: 2, isNgpa: false, dept: 'EC', semester: '1-1', isCompulsory: true, degrees: ['GT'] },
  'EN11201': { code: 'EN11201', name: 'Hydrology and Climatology', credits: 2, isNgpa: false, dept: 'EN', semester: '1-1', isCompulsory: true, degrees: ['ARMT', 'GT'] },
  'EN11302': { code: 'EN11302', name: 'Environmental Pollution, Toxicology and Remediation', credits: 3, isNgpa: false, dept: 'EN', semester: '1-1', isCompulsory: true, degrees: ['GT'] },
  'EN11203': { code: 'EN11203', name: 'Natural and Cultural Heritage Conservation', credits: 2, isNgpa: false, dept: 'EN', semester: '1-1', isCompulsory: true, degrees: ['GT'] },
  'EN11204': { code: 'EN11204', name: 'Environmental Law & Policy', credits: 2, isNgpa: false, dept: 'EN', semester: '1-1', isCompulsory: true, degrees: ['GT'] },
  'FS11201': { code: 'FS11201', name: 'Biochemistry', credits: 2, isNgpa: false, dept: 'FS', semester: '1-1', isCompulsory: true, degrees: ['ARMT', 'ABM'] },

  // =========================================================================
  // 6.3. Year 1, Semester 2 (1-2) Compulsory Courses
  // =========================================================================
  'AS12301': { code: 'AS12301', name: 'Animal Nutrition, Forage & Feed Technology', credits: 3, isNgpa: false, dept: 'AS', semester: '1-2', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'BL12201': { code: 'BL12201', name: 'Entomology', credits: 2, isNgpa: false, dept: 'BL', semester: '1-2', isCompulsory: true, degrees: ['ARMT'] },
  'BL12202': { code: 'BL12202', name: 'Biodiversity Conservation', credits: 2, isNgpa: false, dept: 'BL', semester: '1-2', isCompulsory: true, degrees: ['GT'] },
  'BL12203': { code: 'BL12203', name: 'Environmental Biotechnology', credits: 2, isNgpa: false, dept: 'BL', semester: '1-2', isCompulsory: true, degrees: ['GT'] },
  'CS12201': { code: 'CS12201', name: 'Agroforestry and Silviculture', credits: 2, isNgpa: false, dept: 'CS', semester: '1-2', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'EC12201': { code: 'EC12201', name: 'Macro Economics', credits: 2, isNgpa: false, dept: 'EC', semester: '1-2', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'EC12202': { code: 'EC12202', name: 'Principles of Business Management', credits: 2, isNgpa: false, dept: 'EC', semester: '1-2', isCompulsory: true, degrees: ['ABM'] },
  'EC12203': { code: 'EC12203', name: 'Marketing Management', credits: 2, isNgpa: false, dept: 'EC', semester: '1-2', isCompulsory: true, degrees: ['ABM'] },
  'EN12201': { code: 'EN12201', name: 'Agricultural Machinery Engineering', credits: 2, isNgpa: false, dept: 'EN', semester: '1-2', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'EN12202': { code: 'EN12202', name: 'Environmental Footprints', credits: 2, isNgpa: false, dept: 'EN', semester: '1-2', isCompulsory: true, degrees: ['GT'] },
  'EN12203': { code: 'EN12203', name: 'Renewable Energy Systems I', credits: 2, isNgpa: false, dept: 'EN', semester: '1-2', isCompulsory: true, degrees: ['GT'] },
  'EN12204': { code: 'EN12204', name: 'Climate Change Adaptation and Mitigation', credits: 2, isNgpa: false, dept: 'EN', semester: '1-2', isCompulsory: true, degrees: ['GT'] },
  'EN12205': { code: 'EN12205', name: 'Green Chemistry', credits: 2, isNgpa: false, dept: 'EN', semester: '1-2', isCompulsory: true, degrees: ['GT'] },
  'FS12201': { code: 'FS12201', name: 'Food Chemistry', credits: 2, isNgpa: false, dept: 'FS', semester: '1-2', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'SS12301': { code: 'SS12301', name: 'Fundamentals of Soil Science', credits: 3, isNgpa: false, dept: 'SS', semester: '1-2', isCompulsory: true, degrees: ['ARMT', 'ABM', 'GT'] },

  // =========================================================================
  // 6.4. Year 2, Semester 1 (2-1) Courses
  // =========================================================================
  // Compulsory
  'AS21101': { code: 'AS21101', name: 'Animal Genetics and Breeding', credits: 1, isNgpa: false, dept: 'AS', semester: '2-1', isCompulsory: true, degrees: ['ARMT'] },
  'AS21102': { code: 'AS21102', name: 'Animal Products Technology', credits: 1, isNgpa: false, dept: 'AS', semester: '2-1', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'BL21201': { code: 'BL21201', name: 'Genetics and Plant Breeding', credits: 2, isNgpa: false, dept: 'BL', semester: '2-1', isCompulsory: true, degrees: ['ARMT'] },
  'BL21205': { code: 'BL21205', name: 'Plant Pathology', credits: 2, isNgpa: false, dept: 'BL', semester: '2-1', isCompulsory: true, degrees: ['ARMT'] },
  'CS21201': { code: 'CS21201', name: 'Agroecology', credits: 2, isNgpa: false, dept: 'CS', semester: '2-1', isCompulsory: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'EC21201': { code: 'EC21201', name: 'Agricultural Marketing', credits: 2, isNgpa: false, dept: 'EC', semester: '2-1', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'EC21202': { code: 'EC21202', name: 'Book Keeping & Accountancy', credits: 2, isNgpa: false, dept: 'EC', semester: '2-1', isCompulsory: true, degrees: ['ABM'], isElective: true }, // Compulsory for ABM, Elective for ARMT
  'EC21204': { code: 'EC21204', name: 'Natural Resource Economics', credits: 2, isNgpa: false, dept: 'EC', semester: '2-1', isCompulsory: true, degrees: ['ABM'], isElective: true }, // Compulsory for ABM, Elective for ARMT
  'EC21205': { code: 'EC21205', name: 'Consumer Behavior', credits: 2, isNgpa: false, dept: 'EC', semester: '2-1', isCompulsory: true, degrees: ['ABM'] },
  'EC21206': { code: 'EC21206', name: 'Environmental Economics', credits: 2, isNgpa: false, dept: 'EC', semester: '2-1', isCompulsory: true, degrees: ['GT'] },
  'EN21201': { code: 'EN21201', name: 'Bioprocessing and Post-harvest Engineering', credits: 2, isNgpa: false, dept: 'EN', semester: '2-1', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'EN21202': { code: 'EN21202', name: 'Ergonomics', credits: 2, isNgpa: false, dept: 'EN', semester: '2-1', isCompulsory: true, degrees: ['GT'], isElective: true }, // Compulsory for GT, Elective for ARMT, ABM
  'EN21205': { code: 'EN21205', name: 'Machinery Principles and Power Units', credits: 2, isNgpa: false, dept: 'EN', semester: '2-1', isCompulsory: true, degrees: ['GT'] },
  'EN21206': { code: 'EN21206', name: 'Life Cycle Assessment', credits: 2, isNgpa: false, dept: 'EN', semester: '2-1', isCompulsory: true, degrees: ['GT'] },
  'EN21207': { code: 'EN21207', name: 'Renewable Energy Systems II', credits: 2, isNgpa: false, dept: 'EN', semester: '2-1', isCompulsory: true, degrees: ['GT'] },
  'EN21208': { code: 'EN21208', name: 'Productivity and Quality Management', credits: 2, isNgpa: false, dept: 'EN', semester: '2-1', isCompulsory: true, degrees: ['GT'] },
  'EN21209': { code: 'EN21209', name: 'Energy Audit and Energy Asset Management', credits: 2, isNgpa: false, dept: 'EN', semester: '2-1', isCompulsory: true, degrees: ['GT'] },
  'FS21201': { code: 'FS21201', name: 'Food and Nutrition', credits: 2, isNgpa: false, dept: 'FS', semester: '2-1', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'SS21201': { code: 'SS21201', name: 'Soil, Plant and Environment', credits: 2, isNgpa: false, dept: 'SS', semester: '2-1', isCompulsory: true, degrees: ['ARMT'] },

  // 2-1 Electives
  'AS21203': { code: 'AS21203', name: 'Analytical Methods in Animal Nutrition', credits: 2, isNgpa: false, dept: 'AS', semester: '2-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'BL21202': { code: 'BL21202', name: 'Developmental Plant Physiology', credits: 2, isNgpa: false, dept: 'BL', semester: '2-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'BL21203': { code: 'BL21203', name: 'Economic Botany', credits: 2, isNgpa: false, dept: 'BL', semester: '2-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'BL21204': { code: 'BL21204', name: 'Environmental Biology', credits: 2, isNgpa: false, dept: 'BL', semester: '2-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'CS21202': { code: 'CS21202', name: 'Management of Aquatic Plants', credits: 2, isNgpa: false, dept: 'CS', semester: '2-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'CS21203': { code: 'CS21203', name: 'Management of Energy Crops', credits: 2, isNgpa: false, dept: 'CS', semester: '2-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'CS21204': { code: 'CS21204', name: 'Commercial Nursery Management', credits: 2, isNgpa: false, dept: 'CS', semester: '2-1', isElective: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'CS21205': { code: 'CS21205', name: 'Urban Agriculture and Food Security', credits: 2, isNgpa: false, dept: 'CS', semester: '2-1', isElective: true, degrees: ['ABM', 'GT'] },
  'EN21203': { code: 'EN21203', name: 'Agricultural Pollution, Prevention and Remediation', credits: 2, isNgpa: false, dept: 'EN', semester: '2-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'EN21204': { code: 'EN21204', name: 'Wood Engineering Technology', credits: 2, isNgpa: false, dept: 'EN', semester: '2-1', isElective: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'EN21210': { code: 'EN21210', name: 'Spirituality and Relaxation Techniques for Personality Development', credits: 2, isNgpa: false, dept: 'EN', semester: '2-1', isElective: true, degrees: ['ABM', 'GT'] },
  'FS21202': { code: 'FS21202', name: 'Basic Kitchen Skills and Menu Planning', credits: 2, isNgpa: false, dept: 'FS', semester: '2-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'FS21203': { code: 'FS21203', name: 'Food Toxicology', credits: 2, isNgpa: false, dept: 'FS', semester: '2-1', isElective: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'FS21204': { code: 'FS21204', name: 'Cereal Chemistry and Bakery Product Technology', credits: 2, isNgpa: false, dept: 'FS', semester: '2-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'SS21202': { code: 'SS21202', name: 'Wetland Resources and Management / Conservation', credits: 2, isNgpa: false, dept: 'SS', semester: '2-1', isElective: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'SS21203': { code: 'SS21203', name: 'Soil Fauna Ecology', credits: 2, isNgpa: false, dept: 'SS', semester: '2-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'SS21204': { code: 'SS21204', name: 'Geo-data Mapping and Analysis', credits: 2, isNgpa: false, dept: 'SS', semester: '2-1', isElective: true, degrees: ['ARMT', 'ABM'] },

  // =========================================================================
  // 6.5. Year 2, Semester 2 (2-2) Courses
  // =========================================================================
  // Compulsory
  'AS22201': { code: 'AS22201', name: 'Aquaculture and Non-ruminant Management', credits: 2, isNgpa: false, dept: 'AS', semester: '2-2', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'AS22102': { code: 'AS22102', name: 'Animal Health and Hygiene', credits: 1, isNgpa: false, dept: 'AS', semester: '2-2', isCompulsory: true, degrees: ['ARMT'] },
  'AS22204': { code: 'AS22204', name: 'Sustainable Livestock Production Systems', credits: 2, isNgpa: false, dept: 'AS', semester: '2-2', isCompulsory: true, degrees: ['GT'] },
  'BL22201': { code: 'BL22201', name: 'Molecular Biology, Biotechnology, and Bioinformatics', credits: 2, isNgpa: false, dept: 'BL', semester: '2-2', isCompulsory: true, degrees: ['ARMT'] },
  'CS22201': { code: 'CS22201', name: 'Management of Spices and Beverage Crops', credits: 2, isNgpa: false, dept: 'CS', semester: '2-2', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'CS22202': { code: 'CS22202', name: 'Fruit Crop Management', credits: 2, isNgpa: false, dept: 'CS', semester: '2-2', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'CS22206': { code: 'CS22206', name: 'Landscaping and Green Interior Design', credits: 2, isNgpa: false, dept: 'CS', semester: '2-2', isCompulsory: true, degrees: ['GT'] },
  'EC22201': { code: 'EC22201', name: 'Farm Business Management', credits: 2, isNgpa: false, dept: 'EC', semester: '2-2', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'EC22202': { code: 'EC22202', name: 'Communication and Diffusion of Innovation', credits: 2, isNgpa: false, dept: 'EC', semester: '2-2', isCompulsory: true, degrees: ['ABM'], isElective: true }, // Compulsory for ABM, Elective for ARMT
  'EC22203': { code: 'EC22203', name: 'Human Resource Management', credits: 2, isNgpa: false, dept: 'EC', semester: '2-2', isCompulsory: true, degrees: ['ABM'], isElective: true }, // Compulsory for ABM, Elective for ARMT, GT
  'EC22204': { code: 'EC22204', name: 'Managerial Economics and Customer Relationship Management', credits: 2, isNgpa: false, dept: 'EC', semester: '2-2', isCompulsory: true, degrees: ['ABM'], isElective: true }, // Compulsory for ABM, Elective for ARMT
  'EC22205': { code: 'EC22205', name: 'Strategic Management', credits: 2, isNgpa: false, dept: 'EC', semester: '2-2', isCompulsory: true, degrees: ['ABM'] },
  'EN22201': { code: 'EN22201', name: 'GIS and Remote Sensing', credits: 2, isNgpa: false, dept: 'EN', semester: '2-2', isCompulsory: true, degrees: ['ARMT', 'GT'] },
  'EN22202': { code: 'EN22202', name: 'Precision Agricultural Technology', credits: 2, isNgpa: false, dept: 'EN', semester: '2-2', isCompulsory: true, degrees: ['GT'], isElective: true }, // Compulsory for GT, Elective for ARMT, ABM
  'EN22205': { code: 'EN22205', name: 'Waste Water & Water Treatment Technologies', credits: 2, isNgpa: false, dept: 'EN', semester: '2-2', isCompulsory: true, degrees: ['GT'] },
  'EN22206': { code: 'EN22206', name: 'Sustainable Solid Waste Management', credits: 2, isNgpa: false, dept: 'EN', semester: '2-2', isCompulsory: true, degrees: ['GT'] },
  'EN22207': { code: 'EN22207', name: 'Industrial Resource Management and Cleaner Production', credits: 2, isNgpa: false, dept: 'EN', semester: '2-2', isCompulsory: true, degrees: ['GT'] },
  'SS22204': { code: 'SS22204', name: 'Soil Biophysicochemical Dynamics and Contaminants', credits: 2, isNgpa: false, dept: 'SS', semester: '2-2', isCompulsory: true, degrees: ['GT'] },

  // 2-2 Electives
  'AS22203': { code: 'AS22203', name: 'Livestock Economics and Marketing', credits: 2, isNgpa: false, dept: 'AS', semester: '2-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'BL22203': { code: 'BL22203', name: 'Microbial Genetics', credits: 2, isNgpa: false, dept: 'BL', semester: '2-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'BL22204': { code: 'BL22204', name: 'Weed Biology', credits: 2, isNgpa: false, dept: 'BL', semester: '2-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'BL22205': { code: 'BL22205', name: 'Plant Protection Practicum', credits: 2, isNgpa: false, dept: 'BL', semester: '2-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'CS22203': { code: 'CS22203', name: 'Management of Medicinal and Aromatic Plants', credits: 2, isNgpa: false, dept: 'CS', semester: '2-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'CS22204': { code: 'CS22204', name: 'Floriculture and Landscaping', credits: 2, isNgpa: false, dept: 'CS', semester: '2-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'CS22205': { code: 'CS22205', name: 'Crop Stress Physiology', credits: 2, isNgpa: false, dept: 'CS', semester: '2-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'EN22203': { code: 'EN22203', name: 'Agricultural Systems Design and Construction', credits: 2, isNgpa: false, dept: 'EN', semester: '2-2', isElective: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'EN22204': { code: 'EN22204', name: 'Surveying and Levelling', credits: 2, isNgpa: false, dept: 'EN', semester: '2-2', isElective: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'EN22208': { code: 'EN22208', name: 'Integrated Water Resource Management', credits: 2, isNgpa: false, dept: 'EN', semester: '2-2', isElective: true, degrees: ['ABM', 'GT'] },
  'FS22201': { code: 'FS22201', name: 'Nutrition for Life Cycle', credits: 2, isNgpa: false, dept: 'FS', semester: '2-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'FS22202': { code: 'FS22202', name: 'Food Enzymology', credits: 2, isNgpa: false, dept: 'FS', semester: '2-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'FS22203': { code: 'FS22203', name: 'Fermentation Technology', credits: 2, isNgpa: false, dept: 'FS', semester: '2-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'SS22201': { code: 'SS22201', name: 'Soil Microbiology', credits: 2, isNgpa: false, dept: 'SS', semester: '2-2', isElective: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'SS22202': { code: 'SS22202', name: 'Potting Media in Container Gardening', credits: 2, isNgpa: false, dept: 'SS', semester: '2-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'SS22203': { code: 'SS22203', name: 'Soil Amendments and Risk Assessment', credits: 2, isNgpa: false, dept: 'SS', semester: '2-2', isElective: true, degrees: ['ARMT', 'ABM'] },

  // =========================================================================
  // 6.6. Year 3, Semester 1 (3-1) Courses
  // =========================================================================
  // Compulsory
  'AS31201': { code: 'AS31201', name: 'Ruminant Management', credits: 2, isNgpa: false, dept: 'AS', semester: '3-1', isCompulsory: true, degrees: ['ARMT'] },
  'CS31201': { code: 'CS31201', name: 'Plantation Crop Management and Training', credits: 2, isNgpa: false, dept: 'CS', semester: '3-1', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'EC31201': { code: 'EC31201', name: 'Social Science Research Methods', credits: 2, isNgpa: false, dept: 'EC', semester: '3-1', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'EC31203': { code: 'EC31203', name: 'International Trade & Marketing', credits: 2, isNgpa: false, dept: 'EC', semester: '3-1', isCompulsory: true, degrees: ['ABM'], isElective: true }, // Compulsory for ABM, Elective for ARMT
  'EC31204': { code: 'EC31204', name: 'Innovation and Knowledge Management', credits: 2, isNgpa: false, dept: 'EC', semester: '3-1', isCompulsory: true, degrees: ['ABM'], isElective: true }, // Compulsory for ABM, Elective for ARMT, GT
  'EC31206': { code: 'EC31206', name: 'Entrepreneurship', credits: 2, isNgpa: false, dept: 'EC', semester: '3-1', isCompulsory: true, degrees: ['ABM'], isElective: true }, // Compulsory for ABM, Elective for ARMT
  'EC31207': { code: 'EC31207', name: 'Business Management and Entrepreneurship', credits: 2, isNgpa: false, dept: 'EC', semester: '3-1', isCompulsory: true, degrees: ['GT'] },
  'EC31208': { code: 'EC31208', name: 'Eco-tourism', credits: 2, isNgpa: false, dept: 'EC', semester: '3-1', isCompulsory: true, degrees: ['GT'] },
  'EN31201': { code: 'EN31201', name: 'Irrigation and Water Resources Engineering', credits: 2, isNgpa: false, dept: 'EN', semester: '3-1', isCompulsory: true, degrees: ['ARMT', 'GT'] },
  'EN31206': { code: 'EN31206', name: 'Sustainable Post Harvest Technology', credits: 2, isNgpa: false, dept: 'EN', semester: '3-1', isCompulsory: true, degrees: ['GT'] },
  'EN31207': { code: 'EN31207', name: 'Environmental Monitoring and Modelling', credits: 2, isNgpa: false, dept: 'EN', semester: '3-1', isCompulsory: true, degrees: ['GT'] },
  'EN31208': { code: 'EN31208', name: 'Green Infrastructure and Smart Cities', credits: 2, isNgpa: false, dept: 'EN', semester: '3-1', isCompulsory: true, degrees: ['GT'] },
  'FS31201': { code: 'FS31201', name: 'Food Preservation and Processing', credits: 2, isNgpa: false, dept: 'FS', semester: '3-1', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'FS31204': { code: 'FS31204', name: 'Functional Foods and Nutraceuticals', credits: 2, isNgpa: false, dept: 'FS', semester: '3-1', isCompulsory: true, degrees: ['GT'], isElective: true }, // Compulsory for GT, Elective for ARMT, ABM
  'SS31201': { code: 'SS31201', name: 'Land Resource Management', credits: 2, isNgpa: false, dept: 'SS', semester: '3-1', isCompulsory: true, degrees: ['ARMT'], isElective: true }, // Compulsory for ARMT, Elective for ABM, GT

  // 3-1 Electives
  'AS31202': { code: 'AS31202', name: 'Livestock Genomics', credits: 2, isNgpa: false, dept: 'AS', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'AS31203': { code: 'AS31203', name: 'Micro-livestock Production', credits: 2, isNgpa: false, dept: 'AS', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'BL31201': { code: 'BL31201', name: 'Environmental Plant Physiology', credits: 2, isNgpa: false, dept: 'BL', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'BL31202': { code: 'BL31202', name: 'Industrial Entomology', credits: 2, isNgpa: false, dept: 'BL', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'BL31203': { code: 'BL31203', name: 'Plant-microbe Interactions', credits: 2, isNgpa: false, dept: 'BL', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'CC31201': { code: 'CC31201', name: 'Database Management Systems', credits: 2, isNgpa: false, dept: 'CC', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'CC31202': { code: 'CC31202', name: 'Smart Farming Techniques and its Applications', credits: 2, isNgpa: false, dept: 'CC', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'CS31202': { code: 'CS31202', name: 'Forest Ecology and Management', credits: 2, isNgpa: false, dept: 'CS', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'CS31203': { code: 'CS31203', name: 'Plant Tissue Culture', credits: 2, isNgpa: false, dept: 'CS', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'CS31204': { code: 'CS31204', name: 'Rice Production Technology', credits: 2, isNgpa: false, dept: 'CS', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'CS31205': { code: 'CS31205', name: 'Organic Agriculture', credits: 2, isNgpa: false, dept: 'CS', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'EC31202': { code: 'EC31202', name: 'Rural Development and Empowerment', credits: 2, isNgpa: false, dept: 'EC', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'EC31205': { code: 'EC31205', name: 'Total Quality Management', credits: 2, isNgpa: false, dept: 'EC', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'EN31202': { code: 'EN31202', name: 'Designing and Installation of Micro Irrigation Systems', credits: 2, isNgpa: false, dept: 'EN', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'EN31203': { code: 'EN31203', name: 'Technical Instrumentation and Device Development', credits: 2, isNgpa: false, dept: 'EN', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'EN31204': { code: 'EN31204', name: 'Environment Information and Management', credits: 2, isNgpa: false, dept: 'EN', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'EN31205': { code: 'EN31205', name: 'Renewable Energy for Sustainable Agriculture', credits: 2, isNgpa: false, dept: 'EN', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'EN31209': { code: 'EN31209', name: 'Business Models in Resource Recovery from Waste', credits: 2, isNgpa: false, dept: 'EN', semester: '3-1', isElective: true, degrees: ['ABM', 'GT'] },
  'FS31202': { code: 'FS31202', name: 'Food Waste Management', credits: 2, isNgpa: false, dept: 'FS', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'FS31203': { code: 'FS31203', name: 'Sensory Evaluation of Food', credits: 2, isNgpa: false, dept: 'FS', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'FS31205': { code: 'FS31205', name: 'Fish, Meat and Egg Product Technology', credits: 2, isNgpa: false, dept: 'FS', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'SS31202': { code: 'SS31202', name: 'Tools for Environmental Studies', credits: 2, isNgpa: false, dept: 'SS', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'SS31203': { code: 'SS31203', name: 'Land-use Planning', credits: 2, isNgpa: false, dept: 'SS', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'SS31204': { code: 'SS31204', name: 'Soil Fertility Management', credits: 2, isNgpa: false, dept: 'SS', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM'] },
  'SS31205': { code: 'SS31205', name: 'Climate Change and Soil Gas Fluxes', credits: 2, isNgpa: false, dept: 'SS', semester: '3-1', isElective: true, degrees: ['ARMT', 'ABM'] },

  // =========================================================================
  // 6.7. Year 3, Semester 2 (3-2) Courses
  // =========================================================================
  // Compulsory
  'AS32201': { code: 'AS32201', name: 'Applied Livestock Production', credits: 2, isNgpa: false, dept: 'AS', semester: '3-2', isCompulsory: true, degrees: ['ARMT'] },
  'BL32201': { code: 'BL32201', name: 'Field Biology and Crop Health Management', credits: 2, isNgpa: false, dept: 'BL', semester: '3-2', isCompulsory: true, degrees: ['ARMT'] },
  'CC32201': { code: 'CC32201', name: 'Applied Statistics I', credits: 2, isNgpa: false, dept: 'CC', semester: '3-2', isCompulsory: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'CS32301': { code: 'CS32301', name: 'Production Technology of Field Crops and Vegetables', credits: 3, isNgpa: false, dept: 'CS', semester: '3-2', isCompulsory: true, degrees: ['ARMT'] },
  'CS32102': { code: 'CS32102', name: 'Protected Agriculture', credits: 1, isNgpa: false, dept: 'CS', semester: '3-2', isCompulsory: true, degrees: ['ARMT'], isElective: true }, // Compulsory for ARMT, Elective for ABM, GT
  'EC32201': { code: 'EC32201', name: 'Extension Education', credits: 2, isNgpa: false, dept: 'EC', semester: '3-2', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'EC32202': { code: 'EC32202', name: 'Project Management', credits: 2, isNgpa: false, dept: 'EC', semester: '3-2', isCompulsory: true, degrees: ['ABM', 'GT'], isElective: true }, // Compulsory for ABM, GT; Elective for ARMT
  'EC32204': { code: 'EC32204', name: 'Organizational Behaviour', credits: 2, isNgpa: false, dept: 'EC', semester: '3-2', isCompulsory: true, degrees: ['ABM'] },
  'EC32206': { code: 'EC32206', name: 'Business Start-ups', credits: 2, isNgpa: false, dept: 'EC', semester: '3-2', isCompulsory: true, degrees: ['ABM'] },
  'EC32207': { code: 'EC32207', name: 'Financial Management', credits: 2, isNgpa: false, dept: 'EC', semester: '3-2', isCompulsory: true, degrees: ['ABM'], isElective: true }, // Compulsory for ABM, Elective for ARMT
  'EC32208': { code: 'EC32208', name: 'Environmental Impact Assessment', credits: 2, isNgpa: false, dept: 'EC', semester: '3-2', isCompulsory: true, degrees: ['GT'] },
  'EN32201': { code: 'EN32201', name: 'Applied Agricultural Engineering and Environmental Technology', credits: 2, isNgpa: false, dept: 'EN', semester: '3-2', isCompulsory: true, degrees: ['ARMT'] },
  'EN32206': { code: 'EN32206', name: 'Disaster Management and Resilience', credits: 2, isNgpa: false, dept: 'EN', semester: '3-2', isCompulsory: true, degrees: ['GT'] },
  'EN32207': { code: 'EN32207', name: 'Product Design and Development Protocols', credits: 2, isNgpa: false, dept: 'EN', semester: '3-2', isCompulsory: true, degrees: ['GT'] },
  'EN32208': { code: 'EN32208', name: 'Analytical Techniques and Green Solutions', credits: 2, isNgpa: false, dept: 'EN', semester: '3-2', isCompulsory: true, degrees: ['GT'] },
  'EN32209': { code: 'EN32209', name: 'Coastal and Marine Resource Management', credits: 2, isNgpa: false, dept: 'EN', semester: '3-2', isCompulsory: true, degrees: ['GT'] },
  'SS32101': { code: 'SS32101', name: 'Field Practices in Soil Science', credits: 1, isNgpa: false, dept: 'SS', semester: '3-2', isCompulsory: true, degrees: ['ARMT'] },

  // 3-2 Electives
  'AS32202': { code: 'AS32202', name: 'Animal Reproduction', credits: 2, isNgpa: false, dept: 'AS', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'AS32203': { code: 'AS32203', name: 'Livestock Waste Management', credits: 2, isNgpa: false, dept: 'AS', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'AS32204': { code: 'AS32204', name: 'Indigenous Farm Animal Genetic Resources Management', credits: 2, isNgpa: false, dept: 'AS', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'AS32205': { code: 'AS32205', name: 'Wildlife Conservation & Management', credits: 2, isNgpa: false, dept: 'AS', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'BL32202': { code: 'BL32202', name: 'Practicum in Molecular Biology and Biotechnology', credits: 2, isNgpa: false, dept: 'BL', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'BL32203': { code: 'BL32203', name: 'Ecological Engineering for Pest and Disease Management', credits: 2, isNgpa: false, dept: 'BL', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'BL32204': { code: 'BL32204', name: 'Commercial Apiculture', credits: 2, isNgpa: false, dept: 'BL', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'BL32205': { code: 'BL32205', name: 'Occupational Health and Safety in Agriculture', credits: 2, isNgpa: false, dept: 'BL', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'CC32202': { code: 'CC32202', name: 'Programming Concepts and Computer Programming', credits: 2, isNgpa: false, dept: 'CC', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'CC32203': { code: 'CC32203', name: 'Data Science in Agriculture and its Applications', credits: 2, isNgpa: false, dept: 'CC', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'CC32204': { code: 'CC32204', name: 'Time Series Data Analysis', credits: 2, isNgpa: false, dept: 'CC', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'CC32205': { code: 'CC32205', name: 'Multivariate Data Analysis', credits: 2, isNgpa: false, dept: 'CC', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'CC32206': { code: 'CC32206', name: 'Research Data Analysis', credits: 2, isNgpa: false, dept: 'CC', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'CC32207': { code: 'CC32207', name: 'Non-parametric Data Analysis', credits: 2, isNgpa: false, dept: 'CC', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'CS32203': { code: 'CS32203', name: 'Root Architecture and Crop Productivity', credits: 2, isNgpa: false, dept: 'CS', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'CS32204': { code: 'CS32204', name: 'Crop Modelling', credits: 2, isNgpa: false, dept: 'CS', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'CS32205': { code: 'CS32205', name: 'Commercial Seed Production', credits: 2, isNgpa: false, dept: 'CS', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'CS32206': { code: 'CS32206', name: 'Weed Management Technology', credits: 2, isNgpa: false, dept: 'CS', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'EC32203': { code: 'EC32203', name: 'Fisheries Management and Wellbeing', credits: 2, isNgpa: false, dept: 'EC', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'EC32205': { code: 'EC32205', name: 'Social Network Analysis', credits: 2, isNgpa: false, dept: 'EC', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'EC32209': { code: 'EC32209', name: 'Logistics Management and Professional Communication', credits: 2, isNgpa: false, dept: 'EC', semester: '3-2', isElective: true, degrees: ['ABM', 'GT'] },
  'EN32202': { code: 'EN32202', name: 'Non-Destructive Analytical Techniques', credits: 2, isNgpa: false, dept: 'EN', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'EN32203': { code: 'EN32203', name: 'Engineering Solutions for Controlled Environment in Agriculture', credits: 2, isNgpa: false, dept: 'EN', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'EN32204': { code: 'EN32204', name: 'Training in Agricultural Machineries', credits: 2, isNgpa: false, dept: 'EN', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'EN32205': { code: 'EN32205', name: 'Engineering Drawing', credits: 2, isNgpa: false, dept: 'EN', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'EN32210': { code: 'EN32210', name: 'Ecological Sanitation', credits: 2, isNgpa: false, dept: 'EN', semester: '3-2', isElective: true, degrees: ['ABM', 'GT'] },
  'EN32211': { code: 'EN32211', name: 'Climate Change at Urban and Peri-Urban Scale in Tropics (MOOC)', credits: 2, isNgpa: false, dept: 'EN', semester: '3-2', isElective: true, degrees: ['ABM', 'GT'] },
  'FS32201': { code: 'FS32201', name: 'Food Product Development', credits: 2, isNgpa: false, dept: 'FS', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'FS32202': { code: 'FS32202', name: 'Dairy Product Technology', credits: 2, isNgpa: false, dept: 'FS', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'FS32203': { code: 'FS32203', name: 'Food Packaging and Labeling', credits: 2, isNgpa: false, dept: 'FS', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'FS32204': { code: 'FS32204', name: 'Food Materials Science', credits: 2, isNgpa: false, dept: 'FS', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'SS32202': { code: 'SS32202', name: 'Field Identification and Management of Soils', credits: 2, isNgpa: false, dept: 'SS', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'SS32203': { code: 'SS32203', name: 'Land Use and Environment Quality', credits: 2, isNgpa: false, dept: 'SS', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'SS32204': { code: 'SS32204', name: 'Data Interpretation and Communication', credits: 2, isNgpa: false, dept: 'SS', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },
  'SS32205': { code: 'SS32205', name: 'Research Initiation and Publication Ethics', credits: 2, isNgpa: false, dept: 'SS', semester: '3-2', isElective: true, degrees: ['ARMT', 'ABM'] },

  // =========================================================================
  // 6.8. Year 4, Semester 1 (4-1) Courses
  // =========================================================================
  // Common Compulsory Courses (ARMT & ABM - 6 Credits)
  'CC41201': { code: 'CC41201', name: 'Technical Writing and Communication Skills', credits: 2, isNgpa: false, dept: 'CC', semester: '4-1', isCompulsory: true, degrees: ['ARMT', 'ABM'] },
  'CC41202': { code: 'CC41202', name: 'Applied Statistics II', credits: 2, isNgpa: false, dept: 'CC', semester: '4-1', isCompulsory: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'CC41203': { code: 'CC41203', name: 'Professional Development', credits: 2, isNgpa: false, dept: 'CC', semester: '4-1', isCompulsory: true, degrees: ['ARMT', 'ABM', 'GT'] },

  // Specialization Modules by Department (ARMT & ABM - 6 Credits per Stream)
  // Animal Science (AS)
  'AS41201': { code: 'AS41201', name: 'Extended Essays in Animal Science', credits: 2, isNgpa: false, dept: 'AS', semester: '4-1', specDept: 'AS', degrees: ['ARMT', 'ABM'] },
  'AS41202': { code: 'AS41202', name: 'Animal Welfare and Legislations', credits: 2, isNgpa: false, dept: 'AS', semester: '4-1', specDept: 'AS', degrees: ['ARMT', 'ABM'] },
  'AS41203': { code: 'AS41203', name: 'Sustainable Livestock Production Systems', credits: 2, isNgpa: false, dept: 'AS', semester: '4-1', specDept: 'AS', degrees: ['ARMT', 'ABM'] },

  // Agricultural Biology (BL)
  'BL41201': { code: 'BL41201', name: 'Advances in Crop Protection', credits: 2, isNgpa: false, dept: 'BL', semester: '4-1', specDept: 'BL', degrees: ['ARMT', 'ABM'] },
  'BL41302': { code: 'BL41302', name: 'Advances in Crop Improvement', credits: 3, isNgpa: false, dept: 'BL', semester: '4-1', specDept: 'BL', degrees: ['ARMT', 'ABM'] },
  'BL41103': { code: 'BL41103', name: 'Conservation Biology', credits: 1, isNgpa: false, dept: 'BL', semester: '4-1', specDept: 'BL', degrees: ['ARMT', 'ABM'] },

  // Crop Science (CS)
  'CS41101': { code: 'CS41101', name: 'Communications in Crop Science', credits: 1, isNgpa: false, dept: 'CS', semester: '4-1', specDept: 'CS', degrees: ['ARMT', 'ABM'] },
  'CS41202': { code: 'CS41202', name: 'Crop Experimentation', credits: 2, isNgpa: false, dept: 'CS', semester: '4-1', specDept: 'CS', degrees: ['ARMT', 'ABM'] },
  'CS41103': { code: 'CS41103', name: 'Urban and Peri-urban Agriculture', credits: 1, isNgpa: false, dept: 'CS', semester: '4-1', specDept: 'CS', degrees: ['ARMT', 'ABM'] },
  'CS41104': { code: 'CS41104', name: 'Floriculture and Landscape Training', credits: 1, isNgpa: false, dept: 'CS', semester: '4-1', specDept: 'CS', degrees: ['ARMT', 'ABM'] },
  'CS41105': { code: 'CS41105', name: 'Training in Forestry', credits: 1, isNgpa: false, dept: 'CS', semester: '4-1', specDept: 'CS', degrees: ['ARMT', 'ABM'] },

  // Agricultural Economics & Agribusiness (EC)
  'EC41201': { code: 'EC41201', name: 'Natural Resource Management', credits: 2, isNgpa: false, dept: 'EC', semester: '4-1', specDept: 'EC', degrees: ['ARMT', 'ABM'] },
  'EC41202': { code: 'EC41202', name: 'Agricultural Policy Analysis', credits: 2, isNgpa: false, dept: 'EC', semester: '4-1', specDept: 'EC', degrees: ['ARMT', 'ABM'] },
  'EC41203': { code: 'EC41203', name: 'Econometrics', credits: 2, isNgpa: false, dept: 'EC', semester: '4-1', specDept: 'EC', degrees: ['ARMT', 'ABM'] },

  // Agricultural Engineering & Environmental Technology (EN)
  'EN41201': { code: 'EN41201', name: 'Automated and Connected Agriculture', credits: 2, isNgpa: false, dept: 'EN', semester: '4-1', specDept: 'EN', degrees: ['ARMT', 'ABM'] },
  'EN41102': { code: 'EN41102', name: 'Modeling and Simulation in Systems Engineering', credits: 1, isNgpa: false, dept: 'EN', semester: '4-1', specDept: 'EN', degrees: ['ARMT', 'ABM'] },
  'EN41103': { code: 'EN41103', name: 'Disaster Risk Reduction & Climate Resilient Development', credits: 1, isNgpa: false, dept: 'EN', semester: '4-1', specDept: 'EN', degrees: ['ARMT', 'ABM'] },
  'EN41204': { code: 'EN41204', name: 'Design and Manufacturing Engineering', credits: 2, isNgpa: false, dept: 'EN', semester: '4-1', specDept: 'EN', degrees: ['ARMT', 'ABM'] },

  // Food Science & Technology (FS)
  'FS41201': { code: 'FS41201', name: 'Food Microbiology and Safety', credits: 2, isNgpa: false, dept: 'FS', semester: '4-1', specDept: 'FS', degrees: ['ARMT', 'ABM'] },
  'FS41202': { code: 'FS41202', name: 'Food Analysis', credits: 2, isNgpa: false, dept: 'FS', semester: '4-1', specDept: 'FS', degrees: ['ARMT', 'ABM'] },
  'FS41203': { code: 'FS41203', name: 'Food Process Engineering', credits: 2, isNgpa: false, dept: 'FS', semester: '4-1', specDept: 'FS', degrees: ['ARMT', 'ABM'] },

  // Soil Science (SS)
  'SS41201': { code: 'SS41201', name: 'Soil Physics', credits: 2, isNgpa: false, dept: 'SS', semester: '4-1', specDept: 'SS', degrees: ['ARMT', 'ABM'] },
  'SS41202': { code: 'SS41202', name: 'Environmental Soil Chemistry', credits: 2, isNgpa: false, dept: 'SS', semester: '4-1', specDept: 'SS', degrees: ['ARMT', 'ABM'] },
  'SS41103': { code: 'SS41103', name: 'Soil Ecosystem & Dynamics of Organic Matter', credits: 1, isNgpa: false, dept: 'SS', semester: '4-1', specDept: 'SS', degrees: ['ARMT', 'ABM'] },
  'SS41104': { code: 'SS41104', name: 'Techniques in Soil Research', credits: 1, isNgpa: false, dept: 'SS', semester: '4-1', specDept: 'SS', degrees: ['ARMT', 'ABM'] },

  // Compulsory Courses for Green Technology (GT 4-1 - 12 Credits)
  'EN41205': { code: 'EN41205', name: 'Research Methodology and Scientific Writing', credits: 2, isNgpa: false, dept: 'EN', semester: '4-1', isCompulsory: true, degrees: ['GT'] },
  'EN41206': { code: 'EN41206', name: 'Process Automation and Smart Control', credits: 2, isNgpa: false, dept: 'EN', semester: '4-1', isCompulsory: true, degrees: ['GT'] },
  'EN41207': { code: 'EN41207', name: 'Case Studies in Environmental Technology', credits: 2, isNgpa: false, dept: 'EN', semester: '4-1', isCompulsory: true, degrees: ['GT'] },
  'EN41208': { code: 'EN41208', name: 'Green Behavior and Sustainable Consumption Simulation', credits: 2, isNgpa: false, dept: 'EN', semester: '4-1', isCompulsory: true, degrees: ['GT'] },

  // =========================================================================
  // 6.9. Year 4, Semester 2 (4-2) Courses (All Degrees - 9 Credits)
  // =========================================================================
  // Research Project (6 Credits, 24 Weeks)
  'AS42601': { code: 'AS42601', name: 'Research Project in Animal Science', credits: 6, isNgpa: false, dept: 'AS', semester: '4-2', degrees: ['ARMT', 'ABM'] },
  'BL42601': { code: 'BL42601', name: 'Research Project in Agricultural Biology', credits: 6, isNgpa: false, dept: 'BL', semester: '4-2', degrees: ['ARMT', 'ABM'] },
  'CS42601': { code: 'CS42601', name: 'Research Project in Crop Science', credits: 6, isNgpa: false, dept: 'CS', semester: '4-2', degrees: ['ARMT', 'ABM'] },
  'EC42601': { code: 'EC42601', name: 'Research Project in Agricultural Economics & Agribusiness', credits: 6, isNgpa: false, dept: 'EC', semester: '4-2', degrees: ['ARMT', 'ABM'] },
  'EN42601': { code: 'EN42601', name: 'Research Study in Agricultural Engineering / Green Technology', credits: 6, isNgpa: false, dept: 'EN', semester: '4-2', degrees: ['ARMT', 'ABM', 'GT'] },
  'FS42601': { code: 'FS42601', name: 'Research Study in Food Science & Technology', credits: 6, isNgpa: false, dept: 'FS', semester: '4-2', degrees: ['ARMT', 'ABM'] },
  'SS42601': { code: 'SS42601', name: 'Research Study in Soil Science', credits: 6, isNgpa: false, dept: 'SS', semester: '4-2', degrees: ['ARMT', 'ABM'] },

  // Internship (3 Credits, 16 Weeks)
  'CC42301': { code: 'CC42301', name: 'Internship', credits: 3, isNgpa: false, dept: 'CC', semester: '4-2', isCompulsory: true, degrees: ['ARMT', 'ABM', 'GT'] },
  'CC42302': { code: 'CC42302', name: 'Internship', credits: 3, isNgpa: false, dept: 'CC', semester: '4-2', isCompulsory: true, degrees: ['ARMT', 'ABM', 'GT'] }
};

export const DEGREE_COMPULSORY_COURSES: Record<DegreeCode, Record<SemesterKey, string[]>> = {
  ARMT: {
    '1-1': ['AS11201', 'BL11301', 'CC11201', 'CS11201', 'EC11201', 'EN11201', 'FS11201', 'CC11202'], // 15 GPA + 2 NGPA
    '1-2': ['AS12301', 'BL12201', 'CS12201', 'EC12201', 'EN12201', 'FS12201', 'SS12301', 'CC12101', 'CC12202'], // 16 GPA + 3 NGPA
    '2-1': ['AS21101', 'AS21102', 'BL21201', 'BL21205', 'CS21201', 'EC21201', 'EN21201', 'FS21201', 'SS21201'], // 16 GPA
    '2-2': ['AS22201', 'AS22102', 'BL22201', 'CS22201', 'CS22202', 'EC22201', 'EN22201'], // 13 GPA
    '3-1': ['AS31201', 'CS31201', 'EC31201', 'EN31201', 'FS31201', 'SS31201'], // 12 GPA
    '3-2': ['AS32201', 'BL32201', 'CC32201', 'CS32301', 'CS32102', 'EC32201', 'EN32201', 'SS32101'], // 15 GPA
    '4-1': ['CC41201', 'CC41202', 'CC41203'], // 6 Common Core (+ 6 Spec)
    '4-2': ['CC42301'] // 3 Internship (+ 6 Research)
  },
  ABM: {
    '1-1': ['AS11201', 'BL11301', 'CC11201', 'CS11201', 'EC11201', 'EC11202', 'FS11201', 'CC11202'], // 15 GPA + 2 NGPA
    '1-2': ['AS12301', 'CS12201', 'EC12201', 'EC12202', 'EC12203', 'EN12201', 'FS12201', 'SS12301', 'CC12101', 'CC12202'], // 18 GPA + 3 NGPA
    '2-1': ['AS21102', 'CS21201', 'EC21201', 'EC21202', 'EC21204', 'EC21205', 'EN21201', 'FS21201'], // 15 GPA
    '2-2': ['AS22201', 'CS22201', 'CS22202', 'EC22201', 'EC22202', 'EC22203', 'EC22204', 'EC22205'], // 16 GPA
    '3-1': ['CS31201', 'EC31201', 'EC31203', 'EC31204', 'EC31206', 'FS31201'], // 12 GPA
    '3-2': ['CC32201', 'EC32201', 'EC32202', 'EC32204', 'EC32206', 'EC32207'], // 12 GPA
    '4-1': ['CC41201', 'CC41202', 'CC41203'], // 6 Common Core (+ 6 Spec)
    '4-2': ['CC42301'] // 3 Internship (+ 6 Research)
  },
  GT: {
    '1-1': ['CC11203', 'CS11201', 'EC11203', 'EN11201', 'EN11302', 'EN11203', 'EN11204', 'CC11202'], // 15 GPA + 2 NGPA
    '1-2': ['BL12202', 'BL12203', 'EN12202', 'EN12203', 'EN12204', 'EN12205', 'SS12301', 'CC12101', 'CC12202'], // 15 GPA + 3 NGPA
    '2-1': ['CS21201', 'EC21206', 'EN21202', 'EN21205', 'EN21206', 'EN21207', 'EN21208', 'EN21209'], // 16 GPA
    '2-2': ['AS22204', 'CS22206', 'EN22201', 'EN22202', 'EN22205', 'EN22206', 'EN22207', 'SS22204'], // 16 GPA
    '3-1': ['EC31207', 'EC31208', 'EN31201', 'EN31206', 'EN31207', 'EN31208', 'FS31204'], // 14 GPA
    '3-2': ['CC32201', 'EC32202', 'EC32208', 'EN32206', 'EN32207', 'EN32208', 'EN32209'], // 14 GPA
    '4-1': ['CC41202', 'CC41203', 'EN41205', 'EN41206', 'EN41207', 'EN41208'], // 12 Compulsory
    '4-2': ['EN42601', 'CC42301'] // 6 Research + 3 Internship
  }
};

export interface SpecializationStreamConfig {
  name: string;
  dept: string;
  courses: string[];
  researchCode: string;
}

export const SPECIALIZATION_STREAMS: Record<string, SpecializationStreamConfig> = {
  AS: {
    name: 'Animal Science',
    dept: 'AS',
    courses: ['AS41201', 'AS41202', 'AS41203'],
    researchCode: 'AS42601'
  },
  BL: {
    name: 'Agricultural Biology',
    dept: 'BL',
    courses: ['BL41201', 'BL41302', 'BL41103'],
    researchCode: 'BL42601'
  },
  CS: {
    name: 'Crop Science',
    dept: 'CS',
    courses: ['CS41101', 'CS41202', 'CS41103', 'CS41104', 'CS41105'],
    researchCode: 'CS42601'
  },
  EC: {
    name: 'Agricultural Economics & Agribusiness',
    dept: 'EC',
    courses: ['EC41201', 'EC41202', 'EC41203'],
    researchCode: 'EC42601'
  },
  EN: {
    name: 'Agricultural Engineering & Environmental Technology',
    dept: 'EN',
    courses: ['EN41201', 'EN41102', 'EN41103', 'EN41204'],
    researchCode: 'EN42601'
  },
  FS: {
    name: 'Food Science & Technology',
    dept: 'FS',
    courses: ['FS41201', 'FS41202', 'FS41203'],
    researchCode: 'FS42601'
  },
  SS: {
    name: 'Soil Science',
    dept: 'SS',
    courses: ['SS41201', 'SS41202', 'SS41103', 'SS41104'],
    researchCode: 'SS42601'
  }
};

// Course Code Parser: XXYZNNA
export function parseCourseCode(code: string): {
  dept: string;
  year: number;
  semester: number;
  credits: number;
  courseNum: string;
  isNgpa: boolean;
} | null {
  if (!code || code.length < 7) return null;
  const clean = code.trim().toUpperCase();
  const dept = clean.slice(0, 2);
  const year = parseInt(clean.charAt(2), 10);
  const semester = parseInt(clean.charAt(3), 10);
  const credits = parseInt(clean.charAt(4), 10);
  const courseNum = clean.slice(5);

  if (isNaN(year) || isNaN(semester) || isNaN(credits)) {
    return null;
  }

  // Check Non-GPA criteria
  const isNgpa =
    clean.startsWith('CC1000') ||
    clean === 'CC11202' ||
    clean === 'CC12101' ||
    clean === 'CC12202';

  return { dept, year, semester, credits, courseNum, isNgpa };
}

/**
 * Filter available electives for a student based strictly on their degree programme and semester.
 * Special Rule: ABM students may also select 2-1, 2-2, 3-1, 3-2 compulsory or elective courses
 * from ARMT/GT as electives (per Faculty Handbook Section 6).
 */
export function getAvailableElectivesForStudent(
  degree: DegreeCode,
  semesterKey: SemesterKey,
  alreadyRegisteredCodes: string[]
): CatalogCourse[] {
  const registeredSet = new Set(alreadyRegisteredCodes);

  return Object.values(COURSE_CATALOG).filter(course => {
    // Must match the semester
    if (course.semester !== semesterKey) return false;
    // Don't show orientation or already registered courses
    if (registeredSet.has(course.code)) return false;
    if (course.isNgpa) return false;

    // Check degree eligibility
    if (course.degrees && course.degrees.includes(degree)) {
      // If it's an elective or not compulsory for this degree, it's an available elective
      const isCompulsoryForThisDegree = DEGREE_COMPULSORY_COURSES[degree]?.[semesterKey]?.includes(course.code);
      if (!isCompulsoryForThisDegree) {
        return true;
      }
    }

    // Special handbook clause for ABM students:
    // "Note: ABM students may also select 2-1, 2-2, 3-1, 3-2 compulsory or elective courses from ARMT/GT as electives"
    if (degree === 'ABM' && ['2-1', '2-2', '3-1', '3-2'].includes(semesterKey)) {
      const isCompulsoryForAbm = DEGREE_COMPULSORY_COURSES.ABM[semesterKey]?.includes(course.code);
      if (!isCompulsoryForAbm && (course.degrees?.includes('ARMT') || course.degrees?.includes('GT'))) {
        return true;
      }
    }

    return false;
  });
}
