// University of Ruhuna - Faculty of Agriculture
// GradePath Centralized Natural Sinhala-English & English Contextual Academic Tooltip Dictionary
// Contains all 36 approved academic explanations (T01 - T36)

export type TooltipId =
  | 'T01' | 'T02' | 'T03' | 'T04' | 'T05' | 'T06' | 'T07'
  | 'T08' | 'T09' | 'T10' | 'T11' | 'T12' | 'T13' | 'T14'
  | 'T15' | 'T16' | 'T17' | 'T18' | 'T19' | 'T20' | 'T21'
  | 'T22' | 'T23' | 'T24' | 'T25' | 'T26' | 'T27' | 'T28' | 'T29'
  | 'T30' | 'T31' | 'T32' | 'T33' | 'T34' | 'T35' | 'T36';

export interface AcademicTooltipEntry {
  id: TooltipId;
  label: string;
  category: 'grade_entry' | 'calculations' | 'semester' | 'planning' | 'records';
  english: string;
  sinhala: string;
}

export const ACADEMIC_TOOLTIPS: Record<TooltipId, AcademicTooltipEntry> = {
  // Grade Entry (T01 - T07)
  T01: {
    id: 'T01',
    label: 'Repeat',
    category: 'grade_entry',
    english: 'Select this if you are repeating this course.',
    sinhala: 'ඔබ මෙම විෂය Repeat කරන්නේ නම් මෙය තෝරන්න.'
  },
  T02: {
    id: 'T02',
    label: 'Projected',
    category: 'grade_entry',
    english: 'Select this if the entered grade is an expected grade, not an official result.',
    sinhala: 'ඇතුළත් කළ Grade එක Official Result එකක් නොව Expected Grade එකක් නම් Projected තෝරන්න.'
  },
  T03: {
    id: 'T03',
    label: 'Excused',
    category: 'grade_entry',
    english: 'Select this if your repeat attempt has been officially approved for an exemption from the repeat-grade cap.',
    sinhala: 'ඔබේ Repeat විෂය සඳහා උපරිම Grade සීමාවෙන් නිදහස් වීමට විශ්වවිද්‍යාලයෙන් නිල අවසරය ලැබී ඇත්නම් පමණක් Excused තෝරන්න.'
  },
  T04: {
    id: 'T04',
    label: 'Grade',
    category: 'grade_entry',
    english: 'Select the grade you received or expect to receive.',
    sinhala: 'ඔබට ලැබුණු හෝ ලැබීමට අපේක්ෂිත Grade එක තෝරන්න.'
  },
  T05: {
    id: 'T05',
    label: 'Credits',
    category: 'grade_entry',
    english: 'The credit value assigned to this course.',
    sinhala: 'මෙම විෂයට අදාළ Credits ගණන.'
  },
  T06: {
    id: 'T06',
    label: 'Non-GPA',
    category: 'grade_entry',
    english: 'This course does not contribute to your GPA.',
    sinhala: 'මෙම විෂය ඔබේ GPA එක ගණනය කිරීමට එකතු නොවේ.'
  },
  T07: {
    id: 'T07',
    label: 'Clear grade',
    category: 'grade_entry',
    english: 'Remove the entered grade for this course.',
    sinhala: 'මෙම විෂයට ඇතුළත් කළ Grade එක ඉවත් කරන්න.'
  },

  // GPA Calculations (T08 - T14)
  T08: {
    id: 'T08',
    label: 'Actual CGPA',
    category: 'calculations',
    english: 'Your cumulative GPA calculated using officially received grades only.',
    sinhala: 'Official Results පමණක් අනුව ගණනය කළ ඔබේ CGPA අගයයි.'
  },
  T09: {
    id: 'T09',
    label: 'Projected CGPA',
    category: 'calculations',
    english: 'Your estimated cumulative GPA calculated using both official and expected grades.',
    sinhala: 'Official Results සහ Expected Results යන දෙකම ඇතුළත් කර ගණනය කළ ඇස්තමේන්තුගත CGPA අගයයි.'
  },
  T10: {
    id: 'T10',
    label: 'Actual SGPA',
    category: 'calculations',
    english: 'Your semester GPA calculated using officially received grades only.',
    sinhala: 'Official Results පමණක් අනුව ගණනය කළ මෙම Semester එකේ SGPA අගයයි.'
  },
  T11: {
    id: 'T11',
    label: 'Projected SGPA',
    category: 'calculations',
    english: 'Your estimated semester GPA calculated using official and expected grades.',
    sinhala: 'Official Results සහ Expected Results දෙකම අනුව ගණනය කළ මෙම Semester එකේ SGPA ඇස්තමේන්තුවයි.'
  },
  T12: {
    id: 'T12',
    label: 'Confirmed credits',
    category: 'calculations',
    english: 'Total GPA credits for which official grades have been entered.',
    sinhala: 'Official Results ඇතුළත් කර ඇති මුළු GPA Credits ගණන.'
  },
  T13: {
    id: 'T13',
    label: 'Projected credits',
    category: 'calculations',
    english: 'Total GPA credits for which expected grades have been entered.',
    sinhala: 'Expected Grades ඇතුළත් කර ඇති මුළු GPA Credits ගණන.'
  },
  T14: {
    id: 'T14',
    label: 'Incomplete projection',
    category: 'calculations',
    english: 'Some courses do not have grades or expected grades. Your projected GPA may change.',
    sinhala: 'සමහර විෂයන් සඳහා Official හෝ Expected Grades ඇතුළත් කර නැත. Projected GPA අගය වෙනස් විය හැක.'
  },

  // Semester and Results (T15 - T21)
  T15: {
    id: 'T15',
    label: 'Current semester',
    category: 'semester',
    english: 'Select the semester you are currently studying.',
    sinhala: 'ඔබ දැනට ඉගෙන ගන්නා Semester එක තෝරන්න.'
  },
  T16: {
    id: 'T16',
    label: 'Results pending',
    category: 'semester',
    english: 'Official results for these courses have not yet been entered.',
    sinhala: 'මෙම විෂයන් සඳහා Official Results තවම ඇතුළත් කර නැත.'
  },
  T17: {
    id: 'T17',
    label: 'Results received',
    category: 'semester',
    english: 'Official grades have been entered for these courses.',
    sinhala: 'මෙම විෂයන් සඳහා Official Grades ඇතුළත් කර ඇත.'
  },
  T18: {
    id: 'T18',
    label: 'Not started',
    category: 'semester',
    english: 'This semester has not started yet.',
    sinhala: 'මෙම Semester එක තවම ආරම්භ වී නැත.'
  },
  T19: {
    id: 'T19',
    label: 'Mark unresolved as projected',
    category: 'semester',
    english: 'Mark all courses without confirmed grades in this semester as projected.',
    sinhala: 'මෙම Semester එකේ Official Results නැති සියලුම විෂයන් Projected ලෙස සලකුණු කරන්න.'
  },
  T20: {
    id: 'T20',
    label: 'Clear projections',
    category: 'semester',
    english: 'Remove expected grades without deleting official results.',
    sinhala: 'Official Results මකන්නේ නැතිව Expected Grades පමණක් ඉවත් කරන්න.'
  },
  T21: {
    id: 'T21',
    label: 'Official result received',
    category: 'semester',
    english: 'Enter your official grade and uncheck Projected.',
    sinhala: 'Official Result ලැබුණු පසු නිවැරදි Grade එක ඇතුළත් කර Projected සලකුණ ඉවත් කරන්න.'
  },

  // Academic Planning (T22 - T29)
  T22: {
    id: 'T22',
    label: 'What-If',
    category: 'planning',
    english: 'Explore how different grades could affect your GPA without changing official grades.',
    sinhala: 'Save කර ඇති Official Results වෙනස් නොකර, විවිධ Grades වලින් GPA එකට ඇති බලපෑම පරීක්ෂා කරන්න.'
  },
  T23: {
    id: 'T23',
    label: 'Target CGPA',
    category: 'planning',
    english: 'Enter the cumulative GPA you want to achieve.',
    sinhala: 'ඔබට ලබා ගැනීමට අවශ්‍ය Target CGPA අගය තෝරන්න.'
  },
  T24: {
    id: 'T24',
    label: 'Required GPA',
    category: 'planning',
    english: 'The average GPA you need across your remaining credits to achieve your target.',
    sinhala: 'Target එකට ළඟා වීමට ඉතිරි Credits සඳහා අවශ්‍ය සාමාන්‍ය GPA අගය.'
  },
  T25: {
    id: 'T25',
    label: 'Forecast',
    category: 'planning',
    english: 'Estimate your final CGPA at graduation.',
    sinhala: 'උපාධිය අවසානයේ ලැබිය හැකි CGPA අගය ඇස්තමේන්තු කරන්න.'
  },
  T26: {
    id: 'T26',
    label: 'Best case',
    category: 'planning',
    english: 'The highest possible GPA under the applicable academic rules.',
    sinhala: 'Academic රෙගුලාසි අනුව ලබා ගත හැකි උපරිම GPA ඇස්තමේන්තුව.'
  },
  T27: {
    id: 'T27',
    label: 'Worst case',
    category: 'planning',
    english: 'The lowest possible GPA under the applicable academic rules.',
    sinhala: 'Academic රෙගුලාසි අනුව ලබා ගත හැකි අවම GPA ඇස්තමේන්තුව.'
  },
  T28: {
    id: 'T28',
    label: 'Academic standing',
    category: 'planning',
    english: 'Your current GPA range. Final degree classification depends on all academic requirements.',
    sinhala: 'ඔබේ වත්මන් GPA පරාසය. අවසන් Class එක සියලුම උපාධි අවශ්‍යතා මත තීරණය වේ.'
  },
  T29: {
    id: 'T29',
    label: 'Repeat-grade cap',
    category: 'planning',
    english: 'The maximum grade point allowed for a repeat course under the applicable academic regulations.',
    sinhala: 'Repeat විෂයක් සඳහා අවසර දී ඇති උපරිම Grade සීමාව (Grade C / 2.00 GPV).'
  },

  // Course Selection and Records (T30 - T36)
  T30: {
    id: 'T30',
    label: 'Compulsory',
    category: 'records',
    english: 'A course you are required to complete.',
    sinhala: 'ඔබ අනිවාර්යයෙන්ම සම්පූර්ණ කළ යුතු විෂයකි.'
  },
  T31: {
    id: 'T31',
    label: 'Elective',
    category: 'records',
    english: 'An optional course that can be selected according to your degree requirements.',
    sinhala: 'ඔබේ Degree අවශ්‍යතා අනුව තෝරා ගත හැකි Elective විෂයකි.'
  },
  T32: {
    id: 'T32',
    label: 'Specialization',
    category: 'records',
    english: 'Your selected academic specialization.',
    sinhala: 'ඔබ තෝරා ගත් Specialization අංශය.'
  },
  T33: {
    id: 'T33',
    label: 'Transcript',
    category: 'records',
    english: 'View your entered official grades and academic performance. Projected grades are excluded.',
    sinhala: 'Official Results සහ Academic ප්‍රගතිය බලන්න. Expected Results මෙයට ඇතුළත් නොවේ.'
  },
  T34: {
    id: 'T34',
    label: 'Student profile',
    category: 'records',
    english: 'Manage separate academic records and GPA calculations.',
    sinhala: 'වෙන වෙනම Student Profiles සහ GPA ගණනය කිරීම් කළමනාකරණය කරන්න.'
  },
  T35: {
    id: 'T35',
    label: 'Export',
    category: 'records',
    english: 'Save a backup of your academic data.',
    sinhala: 'ඔබේ දත්තවල Backup එකක් Download කර Save කරගන්න.'
  },
  T36: {
    id: 'T36',
    label: 'Import',
    category: 'records',
    english: 'Restore academic data from a previously exported backup.',
    sinhala: 'පෙර Download කළ Backup file එකකින් දත්ත Restore කරගන්න.'
  }
};

export function getAcademicTooltip(id: TooltipId): AcademicTooltipEntry {
  return ACADEMIC_TOOLTIPS[id] || {
    id,
    label: id,
    category: 'calculations',
    english: '',
    sinhala: ''
  };
}
