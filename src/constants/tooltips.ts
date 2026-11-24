// University of Ruhuna - Faculty of Agriculture
// GradePath Centralized Sinhala & English Contextual Academic Tooltip Dictionary
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
  // ----------------------------------------------------
  // Grade Entry (T01 - T07)
  // ----------------------------------------------------
  T01: {
    id: 'T01',
    label: 'Repeat',
    category: 'grade_entry',
    english: 'Select this if you are repeating this course.',
    sinhala: 'ඔබ මෙම පාඨමාලාව නැවත හදාරන්නේ (Repeat) නම් මෙය තෝරන්න.'
  },
  T02: {
    id: 'T02',
    label: 'Projected',
    category: 'grade_entry',
    english: 'Select this if the entered grade is an expected grade, not an official result.',
    sinhala: 'ඇතුළත් කළ ශ්රේණිය නිල ප්රතිඵලයක් නොව අපේක්ෂිත ශ්රේණියක් නම් මෙය තෝරන්න.'
  },
  T03: {
    id: 'T03',
    label: 'Excused',
    category: 'grade_entry',
    english: 'Select this if your repeat attempt has been officially approved for an exemption from the repeat-grade cap.',
    sinhala: 'ඔබගේ නැවත පෙනී සිටීම (Repeat) සඳහා උපරිම ශ්රේණි සීමාවෙන් නිදහස් වීමට නිල අනුමැතිය ලැබී ඇත්නම් මෙය තෝරන්න.'
  },
  T04: {
    id: 'T04',
    label: 'Grade',
    category: 'grade_entry',
    english: 'Select the grade you received or expect to receive.',
    sinhala: 'ඔබට ලැබුණු හෝ ලැබීමට අපේක්ෂිත ශ්රේණිය තෝරන්න.'
  },
  T05: {
    id: 'T05',
    label: 'Credits',
    category: 'grade_entry',
    english: 'The credit value assigned to this course.',
    sinhala: 'මෙම පාඨමාලාවට අදාළ සම්මාන (Credit) අගය.'
  },
  T06: {
    id: 'T06',
    label: 'Non-GPA',
    category: 'grade_entry',
    english: 'This course does not contribute to your GPA.',
    sinhala: 'මෙම පාඨමාලාව ඔබගේ GPA ගණනය කිරීමට දායක නොවේ.'
  },
  T07: {
    id: 'T07',
    label: 'Clear grade',
    category: 'grade_entry',
    english: 'Remove the entered grade for this course.',
    sinhala: 'මෙම පාඨමාලාව සඳහා ඇතුළත් කළ ශ්රේණිය ඉවත් කරන්න.'
  },

  // ----------------------------------------------------
  // GPA Calculations (T08 - T14)
  // ----------------------------------------------------
  T08: {
    id: 'T08',
    label: 'Actual CGPA',
    category: 'calculations',
    english: 'Your cumulative GPA calculated using officially received grades only.',
    sinhala: 'නිල වශයෙන් ලැබුණු ශ්රේණි පමණක් භාවිතා කර ගණනය කළ ඔබගේ සමස්ත GPA (CGPA) අගය.'
  },
  T09: {
    id: 'T09',
    label: 'Projected CGPA',
    category: 'calculations',
    english: 'Your estimated cumulative GPA calculated using both official and expected grades.',
    sinhala: 'නිල සහ අපේක්ෂිත ශ්රේණි දෙකම භාවිතා කර ගණනය කළ ඔබගේ ඇස්තමේන්තුගත සමස්ත GPA (CGPA) අගය.'
  },
  T10: {
    id: 'T10',
    label: 'Actual SGPA',
    category: 'calculations',
    english: 'Your semester GPA calculated using officially received grades only.',
    sinhala: 'නිල වශයෙන් ලැබුණු ශ්රේණි පමණක් භාවිතා කර ගණනය කළ ඔබගේ අධ්යයන වාර GPA (SGPA) අගය.'
  },
  T11: {
    id: 'T11',
    label: 'Projected SGPA',
    category: 'calculations',
    english: 'Your estimated semester GPA calculated using official and expected grades.',
    sinhala: 'නිල සහ අපේක්ෂිත ශ්රේණි දෙකම භාවිතා කර ගණනය කළ ඔබගේ ඇස්තමේන්තුගත අධ්යයන වාර GPA (SGPA) අගය.'
  },
  T12: {
    id: 'T12',
    label: 'Confirmed credits',
    category: 'calculations',
    english: 'Total GPA credits for which official grades have been entered.',
    sinhala: 'නිල ශ්රේණි ඇතුළත් කර ඇති මුළු GPA සම්මාන (Credits) ගණන.'
  },
  T13: {
    id: 'T13',
    label: 'Projected credits',
    category: 'calculations',
    english: 'Total GPA credits for which expected grades have been entered.',
    sinhala: 'අපේක්ෂිත ශ්රේණි ඇතුළත් කර ඇති මුළු GPA සම්මාන (Credits) ගණන.'
  },
  T14: {
    id: 'T14',
    label: 'Incomplete projection',
    category: 'calculations',
    english: 'Some courses do not have grades or expected grades. Your projected GPA may change.',
    sinhala: 'සමහර පාඨමාලා සඳහා නිල හෝ අපේක්ෂිත ශ්රේණි ඇතුළත් කර නොමැත. ඔබගේ ඇස්තමේන්තුගත GPA අගය වෙනස් විය හැක.'
  },

  // ----------------------------------------------------
  // Semester and Results (T15 - T21)
  // ----------------------------------------------------
  T15: {
    id: 'T15',
    label: 'Current semester',
    category: 'semester',
    english: 'Select the semester you are currently studying.',
    sinhala: 'ඔබ දැනට අධ්යයනය කරන අධ්යයන වාරය (Semester) තෝරන්න.'
  },
  T16: {
    id: 'T16',
    label: 'Results pending',
    category: 'semester',
    english: 'Official results for these courses have not yet been entered.',
    sinhala: 'මෙම පාඨමාලා සඳහා නිල ප්රතිඵල තවම ඇතුළත් කර නොමැත.'
  },
  T17: {
    id: 'T17',
    label: 'Results received',
    category: 'semester',
    english: 'Official grades have been entered for these courses.',
    sinhala: 'මෙම පාඨමාලා සඳහා නිල ශ්රේණි ඇතුළත් කර ඇත.'
  },
  T18: {
    id: 'T18',
    label: 'Not started',
    category: 'semester',
    english: 'This semester has not started yet.',
    sinhala: 'මෙම අධ්යයන වාරය තවම ආරම්භ වී නොමැත.'
  },
  T19: {
    id: 'T19',
    label: 'Mark unresolved as projected',
    category: 'semester',
    english: 'Mark all courses without confirmed grades in this semester as projected.',
    sinhala: 'මෙම අධ්යයන වාරයේ නිල ශ්රේණි නොමැති සියලුම පාඨමාලා අපේක්ෂිත (Projected) ලෙස සලකුණු කරන්න.'
  },
  T20: {
    id: 'T20',
    label: 'Clear projections',
    category: 'semester',
    english: 'Remove expected grades without deleting official results.',
    sinhala: 'නිල ප්රතිඵල මකා නොදමා අපේක්ෂිත ශ්රේණි පමණක් ඉවත් කරන්න.'
  },
  T21: {
    id: 'T21',
    label: 'Official result received',
    category: 'semester',
    english: 'Enter your official grade and uncheck Projected.',
    sinhala: 'ඔබගේ නිල ශ්රේණිය ඇතුළත් කර \'Projected\' සලකුණ ඉවත් කරන්න.'
  },

  // ----------------------------------------------------
  // Academic Planning (T22 - T29)
  // ----------------------------------------------------
  T22: {
    id: 'T22',
    label: 'What-If',
    category: 'planning',
    english: 'Explore how different grades could affect your GPA without changing official grades.',
    sinhala: 'නිල ශ්රේණි වෙනස් නොකර, විවිධ ශ්රේණි ඔබගේ GPA අගයට බලපාන ආකාරය පරීක්ෂා කරන්න.'
  },
  T23: {
    id: 'T23',
    label: 'Target CGPA',
    category: 'planning',
    english: 'Enter the cumulative GPA you want to achieve.',
    sinhala: 'ඔබ ළඟා කර ගැනීමට බලාපොරොත්තු වන සමස්ත GPA (CGPA) අගය ඇතුළත් කරන්න.'
  },
  T24: {
    id: 'T24',
    label: 'Required GPA',
    category: 'planning',
    english: 'The average GPA you need across your remaining credits to achieve your target.',
    sinhala: 'ඔබගේ ඉලක්කය සපුරා ගැනීමට ඉතිරි සම්මාන (Credits) සඳහා අවශ්ය වන සාමාන්ය GPA අගය.'
  },
  T25: {
    id: 'T25',
    label: 'Forecast',
    category: 'planning',
    english: 'Estimate your final CGPA at graduation.',
    sinhala: 'උපාධිය අවසානයේ ඔබට ලැබිය හැකි අවසන් සමස්ත GPA (CGPA) අගය ඇස්තමේන්තු කරන්න.'
  },
  T26: {
    id: 'T26',
    label: 'Best case',
    category: 'planning',
    english: 'The highest possible GPA under the applicable academic rules.',
    sinhala: 'අදාළ අධ්යයන නීතිරීති යටතේ ලබා ගත හැකි උපරිම GPA අගය.'
  },
  T27: {
    id: 'T27',
    label: 'Worst case',
    category: 'planning',
    english: 'The lowest possible GPA under the applicable academic rules.',
    sinhala: 'අදාළ අධ්යයන නීතිරීති යටතේ ලබා ගත හැකි අවම GPA අගය.'
  },
  T28: {
    id: 'T28',
    label: 'Academic standing',
    category: 'planning',
    english: 'Your current GPA range. Final degree classification depends on all academic requirements.',
    sinhala: 'ඔබගේ වත්මන් GPA පරාසය. අවසන් උපාධි පන්තිය (Class) සියලුම අධ්යයන අවශ්යතා මත රඳා පවතී.'
  },
  T29: {
    id: 'T29',
    label: 'Repeat-grade cap',
    category: 'planning',
    english: 'The maximum grade point allowed for a repeat course under the applicable academic regulations.',
    sinhala: 'අදාළ අධ්යයන රෙගුලාසි යටතේ නැවත පෙනී සිටින (Repeat) පාඨමාලාවක් සඳහා අවසර දී ඇති උපරිම ශ්රේණි ලකුණු සීමාව.'
  },

  // ----------------------------------------------------
  // Course Selection and Records (T30 - T36)
  // ----------------------------------------------------
  T30: {
    id: 'T30',
    label: 'Compulsory',
    category: 'records',
    english: 'A course you are required to complete.',
    sinhala: 'ඔබ අනිවාර්යයෙන්ම සම්පූර්ණ කළ යුතු පාඨමාලාවකි.'
  },
  T31: {
    id: 'T31',
    label: 'Elective',
    category: 'records',
    english: 'An optional course that can be selected according to your degree requirements.',
    sinhala: 'ඔබගේ උපාධි අවශ්යතා අනුව තෝරා ගත හැකි විකල්ප (Elective) පාඨමාලාවකි.'
  },
  T32: {
    id: 'T32',
    label: 'Specialization',
    category: 'records',
    english: 'Your selected academic specialization.',
    sinhala: 'ඔබ තෝරා ගත් අධ්යයන විශේෂීකරණ ක්ෂේත්රය.'
  },
  T33: {
    id: 'T33',
    label: 'Transcript',
    category: 'records',
    english: 'View your entered official grades and academic performance. Projected grades are excluded.',
    sinhala: 'ඇතුළත් කළ නිල ශ්රේණි සහ අධ්යයන කාර්යසාධනය බලන්න. අපේක්ෂිත ශ්රේණි මෙයට ඇතුළත් නොවේ.'
  },
  T34: {
    id: 'T34',
    label: 'Student profile',
    category: 'records',
    english: 'Manage separate academic records and GPA calculations.',
    sinhala: 'වෙනම අධ්යයන වාර්තා සහ GPA ගණනය කිරීම් කළමනාකරණය කරන්න.'
  },
  T35: {
    id: 'T35',
    label: 'Export',
    category: 'records',
    english: 'Save a backup of your academic data.',
    sinhala: 'ඔබගේ අධ්යයන දත්තවල උපස්ථ පිටපතක් (Backup) සුරකින්න.'
  },
  T36: {
    id: 'T36',
    label: 'Import',
    category: 'records',
    english: 'Restore academic data from a previously exported backup.',
    sinhala: 'පෙර සුරකින ලද උපස්ථ පිටපතකින් (Backup) අධ්යයන දත්ත නැවත ලබා ගන්න.'
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
