// University of Ruhuna - Faculty of Agriculture
// Shared Course-Row Visual Styling Helper (4 Distinct Academic Visual States)
// Used identically across Desktop rows and Mobile course cards

export type CourseVisualState = 'normal' | 'repeat' | 'projected' | 'repeat_and_projected';

export interface CourseVisualStateResult {
  state: CourseVisualState;
  className: string;
  badgeLabel?: string;
  badgeClass?: string;
  accentBorderColor: string;
}

/**
 * Returns the exact class name and visual state according to academic specification:
 * 1. Normal: default background (#FFFFFF), neutral border (#DCDDD7)
 * 2. Repeat: background #FFF5E5, border #D6B77B, 3px amber left accent
 * 3. Projected: background #EDF5FF, border #A5C5EC, 3px blue left accent
 * 4. Repeat & Projected: background #EDF5FF, border #A5C5EC, 3px amber left accent, both active
 */
export function getCourseRowVisualState(
  isRepeat: boolean | undefined,
  isExpected: boolean | undefined
): CourseVisualStateResult {
  const rep = !!isRepeat;
  const proj = !!isExpected;

  if (rep && proj) {
    return {
      state: 'repeat_and_projected',
      className: 'course-row-repeat-projected',
      badgeLabel: 'Repeat & Projected',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      accentBorderColor: '#D6B77B'
    };
  }

  if (rep) {
    return {
      state: 'repeat',
      className: 'course-row-repeat',
      badgeLabel: 'Repeat Course (Max 2.0)',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      accentBorderColor: '#D6B77B'
    };
  }

  if (proj) {
    return {
      state: 'projected',
      className: 'course-row-projected',
      badgeLabel: 'Projected Grade',
      badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
      accentBorderColor: '#A5C5EC'
    };
  }

  return {
    state: 'normal',
    className: 'course-row-normal',
    badgeLabel: undefined,
    badgeClass: undefined,
    accentBorderColor: '#DCDDD7'
  };
}
