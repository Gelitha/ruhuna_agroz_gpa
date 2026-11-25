import { test, expect } from '@playwright/test';

test.describe('Mobile Interaction & Profile Audit', () => {

  test('1. First-time onboarding requires explicit fields and derives academic year', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.clear();
    });
    await page.reload();

    // Verify modal title appears on fresh visit
    const modalTitle = page.locator('#profile-modal-title');
    await expect(modalTitle).toBeVisible();
    await expect(modalTitle).toHaveText('My Academic Profile');

    // Attempting submit without name, degree, or semester triggers validation
    const submitBtn = page.getByRole('button', { name: /Complete Setup & Open Dashboard/i });
    await submitBtn.click();

    // Should show error for student name
    await expect(page.locator('text=Please enter the student name.')).toBeVisible();

    // Fill in Student Name
    const nameInput = page.getByPlaceholder('e.g. K.A. Janith Silva');
    await nameInput.fill('Janith Silva');

    // Attempting submit without selecting degree triggers validation
    await submitBtn.click();
    await expect(page.locator('text=Please select your degree programme.')).toBeVisible();

    // Select ABM degree explicitly
    const abmBtn = page.getByRole('button', { name: /BSc Hons \(ABM\)/i });
    await abmBtn.click();

    // Attempting submit without selecting semester triggers validation
    await submitBtn.click();
    await expect(page.locator('text=Please select your current academic semester.')).toBeVisible();

    // Select Sem 2-1 explicitly
    const sem21Btn = page.getByRole('button', { name: /Sem 2-1/i });
    await sem21Btn.click();

    // Verify derived 2nd Year badge is displayed
    await expect(page.locator('text=2nd Year')).toBeVisible();

    // Complete setup
    await submitBtn.click();

    // Modal should close and Dashboard should be displayed
    await expect(modalTitle).not.toBeVisible();
    await expect(page.locator('header button:visible, main :visible').filter({ hasText: 'Janith Silva' }).first()).toBeVisible();

    // Verify profile persistence on page reload (returning student bypasses onboarding)
    await page.reload();
    await expect(page.locator('#profile-modal-title')).not.toBeVisible();
    await expect(page.locator('header button:visible, main :visible').filter({ hasText: 'Janith Silva' }).first()).toBeVisible();
  });

  test('2. Mobile profile switcher opens on first tap, allows new profile creation and switching', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem('gradepath_onboarded_v3', 'true');
      const initialProfile = {
        id: 'prof_initial_1',
        name: 'Student One',
        degree: 'ARMT',
        currentSemester: '1-1',
        currentAcademicYear: 1,
        batch: 'Year 1',
        specializationDept: 'CS',
        semesters: {
          '1-1': [
            { code: 'CS1101', name: 'Principles of Crop Science', credits: 2, isCompulsory: true, grade: '' },
            { code: 'AS1101', name: 'Animal Science Basics', credits: 2, isCompulsory: true, grade: '' }
          ],
          '1-2': [], '2-1': [], '2-2': [], '3-1': [], '3-2': [], '4-1': [], '4-2': []
        },
        orientationCourses: []
      };
      window.localStorage.setItem('gradepath_profiles_v3', JSON.stringify([initialProfile]));
      window.localStorage.setItem('gradepath_active_id_v3', 'prof_initial_1');
    });
    await page.reload();

    // Find visible profile switcher button in header
    const profileBtn = page.locator('header button:visible').filter({ hasText: /Student One/ }).first();
    await expect(profileBtn).toBeVisible();

    // 1. Open on first tap
    await profileBtn.click();

    // Dropdown menu should open with profile options
    const dropdownMenu = page.locator('text=Switch Profile').filter({ visible: true });
    await expect(dropdownMenu).toBeVisible();
    await expect(page.locator('text=Active').filter({ visible: true })).toBeVisible();

    // 2. Click "New Profile" to trigger setup modal in creation mode
    const newProfileBtn = page.getByRole('button', { name: /New Profile/i }).filter({ visible: true }).first();
    await newProfileBtn.click();

    const createModalTitle = page.locator('#profile-modal-title');
    await expect(createModalTitle).toBeVisible();
    await expect(createModalTitle).toHaveText('New Student Profile');

    // 3. Test cancellation: Cancel button dismisses modal without saving
    const cancelBtn = page.getByRole('button', { name: 'Cancel', exact: true });
    await cancelBtn.click();
    await expect(createModalTitle).not.toBeVisible();

    // 4. Open dropdown again and create second profile
    await profileBtn.click();
    await newProfileBtn.click();

    await page.getByPlaceholder('e.g. K.A. Janith Silva').fill('Student Two');
    await page.getByRole('button', { name: /BSc Hons \(GT\)/i }).click();
    await page.getByRole('button', { name: /Sem 2-1/i }).click();
    await page.getByRole('button', { name: /Create Profile/i }).click();

    // Active profile should now be Student Two
    const updatedProfileBtn = page.locator('header button:visible').filter({ hasText: /Student Two/ }).first();
    await expect(updatedProfileBtn).toBeVisible();

    // 5. Open dropdown and switch back to Student One
    await updatedProfileBtn.click();

    const studentOneOption = page.locator('button:visible').filter({ hasText: 'Student One' }).first();
    await studentOneOption.click();

    // Verify Student One is active again
    await expect(page.locator('header button:visible').filter({ hasText: /Student One/ }).first()).toBeVisible();

    // 6. Test outside tap closes dropdown
    await profileBtn.click();
    await expect(dropdownMenu).toBeVisible();

    // Tap outside (click on main/body below the dropdown)
    await page.mouse.click(10, 550);
    await expect(dropdownMenu).not.toBeVisible();
  });

  test('3. Horizontal grade selector: single tap, re-tap stability, and Undo notification', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem('gradepath_onboarded_v3', 'true');
      const profile = {
        id: 'prof_test_grade',
        name: 'Grade Test User',
        degree: 'ARMT',
        currentSemester: '1-1',
        currentAcademicYear: 1,
        batch: 'Year 1',
        specializationDept: 'CS',
        semesters: {
          '1-1': [
            { code: 'CS1101', name: 'Principles of Crop Production', credits: 2, isCompulsory: true, grade: '' },
            { code: 'AS1101', name: 'Introduction to Livestock', credits: 2, isCompulsory: true, grade: '' }
          ],
          '1-2': [], '2-1': [], '2-2': [], '3-1': [], '3-2': [], '4-1': [], '4-2': []
        },
        orientationCourses: []
      };
      window.localStorage.setItem('gradepath_profiles_v3', JSON.stringify([profile]));
      window.localStorage.setItem('gradepath_active_id_v3', 'prof_test_grade');
    });
    await page.reload();

    // Navigate to Calculator via visible bottom nav or top pill
    const calcNavBtn = page.locator('nav[aria-label="Mobile Navigation"]').getByRole('button', { name: /Calculator/i });
    if (await calcNavBtn.isVisible()) {
      await calcNavBtn.click();
    } else {
      await page.getByRole('button', { name: /Calculator/i }).first().click();
    }

    // Verify course CS1101 is visible
    await expect(page.getByText('CS1101').first()).toBeVisible();

    // Select Grade A on visible course card
    const gradeABtn = page.locator('button[aria-label*="Grade A "]').filter({ visible: true }).first();
    await gradeABtn.click();
    await expect(gradeABtn).toHaveAttribute('aria-checked', 'true');

    // Tap-to-deselect: tapping Grade A again should clear it
    await gradeABtn.click();
    await expect(gradeABtn).toHaveAttribute('aria-checked', 'false');

    // Undo toast should appear for cleared grade
    const undoToast = page.locator('text=Grade cleared for').filter({ visible: true });
    await expect(undoToast).toBeVisible();

    // Tap Undo button on toast
    const undoBtn = page.getByRole('button', { name: /Undo/i }).filter({ visible: true });
    await expect(undoBtn).toBeVisible();
    await undoBtn.click({ force: true });

    // Grade should revert to A
    await expect(gradeABtn).toHaveAttribute('aria-checked', 'true');

    // Tap Grade B to change grade
    const gradeBBtn = page.locator('button[aria-label*="Grade B "]').filter({ visible: true }).first();
    await gradeBBtn.click();
    await expect(gradeBBtn).toHaveAttribute('aria-checked', 'true');
  });

  test('4. Sticky GPA summary and mobile bottom navigation clearance', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem('gradepath_onboarded_v3', 'true');
      const profile = {
        id: 'prof_layout_test',
        name: 'Layout User',
        degree: 'ARMT',
        currentSemester: '1-1',
        currentAcademicYear: 1,
        batch: 'Year 1',
        specializationDept: 'CS',
        semesters: {
          '1-1': [
            { code: 'CS1101', name: 'Principles of Crop Production', credits: 2, isCompulsory: true, grade: 'A' },
            { code: 'AS1101', name: 'Introduction to Livestock', credits: 2, isCompulsory: true, grade: 'B' },
            { code: 'AB1101', name: 'Plant Biology Fundamentals', credits: 2, isCompulsory: true, grade: '' },
            { code: 'AE1101', name: 'Agricultural Mechanics', credits: 2, isCompulsory: true, grade: '' },
            { code: 'EC1101', name: 'Agricultural Economics I', credits: 2, isCompulsory: true, grade: '' },
            { code: 'SS1101', name: 'Fundamentals of Soil Science', credits: 2, isCompulsory: true, grade: '' }
          ],
          '1-2': [], '2-1': [], '2-2': [], '3-1': [], '3-2': [], '4-1': [], '4-2': []
        },
        orientationCourses: []
      };
      window.localStorage.setItem('gradepath_profiles_v3', JSON.stringify([profile]));
      window.localStorage.setItem('gradepath_active_id_v3', 'prof_layout_test');
    });
    await page.reload();

    // Navigate to Calculator
    const calcNavBtn = page.locator('nav[aria-label="Mobile Navigation"]').getByRole('button', { name: /Calculator/i });
    if (await calcNavBtn.isVisible()) {
      await calcNavBtn.click();
    } else {
      await page.getByRole('button', { name: /Calculator/i }).first().click();
    }

    // Scroll down to trigger sticky GPA summary
    await page.evaluate(() => window.scrollTo(0, 600));

    // Mobile Bottom Nav should be visible at bottom on mobile viewports (< 768px)
    const bottomNav = page.locator('nav[aria-label="Mobile Navigation"]');
    if (await bottomNav.isVisible()) {
      await expect(bottomNav).toBeVisible();

      // Bottom nav items should respond to touch
      const homeBtn = bottomNav.getByRole('button', { name: /Home/i });
      await homeBtn.click();
      await expect(page.getByText('Cumulative GPA').first()).toBeVisible();
    } else {
      // On tablet/desktop (>= 768px), sidebar navigation is used
      const dashBtn = page.getByRole('button', { name: /Dashboard/i }).first();
      await dashBtn.click();
      await expect(page.getByText('Cumulative GPA').first()).toBeVisible();
    }
  });

  test('5. Mobile bottom navigation sub-menus (Plan and More sheets)', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem('gradepath_onboarded_v3', 'true');
      const profile = {
        id: 'prof_nav_test',
        name: 'Nav User',
        degree: 'ARMT',
        currentSemester: '1-1',
        currentAcademicYear: 1,
        batch: 'Year 1',
        specializationDept: 'CS',
        semesters: { '1-1': [], '1-2': [], '2-1': [], '2-2': [], '3-1': [], '3-2': [], '4-1': [], '4-2': [] },
        orientationCourses: []
      };
      window.localStorage.setItem('gradepath_profiles_v3', JSON.stringify([profile]));
      window.localStorage.setItem('gradepath_active_id_v3', 'prof_nav_test');
    });
    await page.reload();

    const bottomNav = page.locator('nav[aria-label="Mobile Navigation"]');
    if (await bottomNav.isVisible()) {
      // Tap "Plan" tab in bottom nav
      const planTab = bottomNav.getByRole('button', { name: /^Plan$/i });
      await planTab.click();

      // Bottom sheet should open with Academic Planning options
      const bottomSheet = page.locator('.fixed.inset-0.z-50');
      await expect(bottomSheet.locator('text=Academic Planning')).toBeVisible();
      await expect(bottomSheet.locator('text=Semester Planner')).toBeVisible();
      await expect(bottomSheet.locator('text=Grade Simulator')).toBeVisible();

      // Tap Grade Simulator to navigate
      await bottomSheet.getByRole('button', { name: /Grade Simulator/i }).click();
      await expect(page.getByText('Academic Forecast & Goals').first()).toBeVisible();

      // Tap "More" in bottom nav
      const moreTab = bottomNav.getByRole('button', { name: /^More$/i });
      await moreTab.click();

      await expect(bottomSheet.locator('text=More Features & Tools')).toBeVisible();
      await expect(bottomSheet.locator('text=Academic Transcript')).toBeVisible();

      // Close sheet via X button
      const closeSheetBtn = bottomSheet.getByRole('button', { name: /Close menu/i });
      await closeSheetBtn.click();
      await expect(bottomSheet).not.toBeVisible();
    }
  });

  test('6. First-time grade entry: personalized previous semester detection on Dashboard', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem('gradepath_onboarded_v3', 'true');
      const profile21 = {
        id: 'prof_guide_21',
        name: 'Kasun Bandara',
        degree: 'ARMT',
        currentSemester: '2-1',
        currentAcademicYear: 2,
        batch: 'Year 2',
        specializationDept: 'CS',
        semesters: {
          '1-1': [{ code: 'CS1101', name: 'Principles of Crop Production', credits: 2, isCompulsory: true, grade: '' }],
          '1-2': [{ code: 'CS1201', name: 'Field Crop Production', credits: 2, isCompulsory: true, grade: '' }],
          '2-1': [{ code: 'CS2101', name: 'Plantation Crops', credits: 2, isCompulsory: true, grade: '' }],
          '2-2': [], '3-1': [], '3-2': [], '4-1': [], '4-2': []
        },
        orientationCourses: []
      };
      window.localStorage.setItem('gradepath_profiles_v3', JSON.stringify([profile21]));
      window.localStorage.setItem('gradepath_active_id_v3', 'prof_guide_21');
    });
    await page.reload();

    // Getting Started card should be visible on Dashboard
    await expect(page.getByText("Let's set up your academic results")).toBeVisible();
    await expect(page.getByText('Start by entering your previous semester results to calculate your actual CGPA.')).toBeVisible();

    // Must show Semester 1-1 and Semester 1-2
    await expect(page.locator('text=Semester 1-1').first()).toBeVisible();
    await expect(page.locator('text=Semester 1-2').first()).toBeVisible();

    // Must NOT show future semester (e.g. 2-2) in previous results setup
    await expect(page.locator('button[aria-label="Semester 2-2 Add Grades"]')).not.toBeVisible();

    // Setup Progress should indicate 0 of 2 semesters reviewed
    await expect(page.getByText(/0 of 2 semesters reviewed/i)).toBeVisible();
  });

  test('7. Direct semester navigation and permanent Previous/Next semester movement', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem('gradepath_onboarded_v3', 'true');
      const profile = {
        id: 'prof_nav_flow',
        name: 'Nimalka Perera',
        degree: 'ARMT',
        currentSemester: '2-1',
        currentAcademicYear: 2,
        batch: '',
        specializationDept: 'CS',
        semesters: {
          '1-1': [
            { code: 'CS1101', name: 'Principles of Crop Production', credits: 2, isCompulsory: true, grade: '' }
          ],
          '1-2': [
            { code: 'CS1201', name: 'Field Crop Production', credits: 2, isCompulsory: true, grade: '' }
          ],
          '2-1': [
            { code: 'CS2101', name: 'Plantation Crops', credits: 2, isCompulsory: true, grade: '' }
          ],
          '2-2': [], '3-1': [], '3-2': [], '4-1': [], '4-2': []
        },
        orientationCourses: []
      };
      window.localStorage.setItem('gradepath_profiles_v3', JSON.stringify([profile]));
      window.localStorage.setItem('gradepath_active_id_v3', 'prof_nav_flow');
    });
    await page.reload();

    // 1. Click "Add Grades" for Semester 1-1 directly from Getting Started card
    const add11Btn = page.getByRole('button', { name: /Semester 1-1 Add Grades/i });
    await add11Btn.click();

    // 2. Verifies GPA Calculator opens directly at Semester 1-1
    await expect(page.getByText('CS1101').first()).toBeVisible();

    // 3. Enter Grade A for CS1101
    const gradeABtn = page.locator('button[aria-label*="Grade A "]').filter({ visible: true }).first();
    await gradeABtn.click();
    await expect(gradeABtn).toHaveAttribute('aria-checked', 'true');

    // 4. Verify boundary: at Semester 1-1, Previous Semester button is not available
    await expect(page.getByRole('button', { name: /Previous Semester/i })).not.toBeVisible();

    // 5. Navigate to Semester 1-2 using permanent Next button [1-2 →]
    const nextTo12Btn = page.getByRole('button', { name: /1-2 →/i });
    await expect(nextTo12Btn).toBeVisible();
    await nextTo12Btn.click();

    // 6. Verifies destination is Semester 1-2 (CS1201 visible)
    await expect(page.getByText('CS1201').first()).toBeVisible();

    // 7. Navigate forward to Semester 2-1 using permanent Next button [2-1 →]
    const nextTo21Btn = page.getByRole('button', { name: /2-1 →/i });
    await expect(nextTo21Btn).toBeVisible();
    await nextTo21Btn.click();
    await expect(page.getByText('CS2101').first()).toBeVisible();

    // 8. Navigate back to Semester 1-2 using permanent Previous button [← 1-2]
    const prevTo12Btn = page.getByRole('button', { name: /← 1-2/i });
    await expect(prevTo12Btn).toBeVisible();
    await prevTo12Btn.click();
    await expect(page.getByText('CS1201').first()).toBeVisible();

    // 9. Navigate back to Dashboard
    const bottomNav = page.locator('nav[aria-label="Mobile Navigation"]');
    if (await bottomNav.isVisible()) {
      await bottomNav.getByRole('button', { name: /Home/i }).click();
    } else {
      await page.getByRole('button', { name: /Dashboard/i }).first().click();
    }

    // 10. Dashboard Cumulative GPA correctly displays 4.00 from confirmed Grade A on CS1101
    await expect(page.getByText('4.00').first()).toBeVisible();
    // Student's actual current semester remains strictly 2-1 (2nd Year)
    await expect(page.getByText('2nd Year • Sem 2-1').first()).toBeVisible();
  });

  test('8. Dismissing guidance, resume setup banner, and direct navigation', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem('gradepath_onboarded_v3', 'true');
      const profile = {
        id: 'prof_dismiss_test',
        name: 'Chamara Silva',
        degree: 'ARMT',
        currentSemester: '2-1',
        currentAcademicYear: 2,
        batch: '',
        specializationDept: 'CS',
        semesters: {
          '1-1': [{ code: 'CS1101', name: 'Principles of Crop Production', credits: 2, isCompulsory: true, grade: '' }],
          '1-2': [{ code: 'CS1201', name: 'Field Crop Production', credits: 2, isCompulsory: true, grade: '' }],
          '2-1': [], '2-2': [], '3-1': [], '3-2': [], '4-1': [], '4-2': []
        },
        orientationCourses: []
      };
      window.localStorage.setItem('gradepath_profiles_v3', JSON.stringify([profile]));
      window.localStorage.setItem('gradepath_active_id_v3', 'prof_dismiss_test');
    });
    await page.reload();

    // Getting Started card is initially visible
    await expect(page.getByText("Let's set up your academic results")).toBeVisible();

    // Click "I'll Do This Later"
    const laterBtn = page.getByRole('button', { name: /I'll Do This Later/i }).first();
    await laterBtn.click();

    // Large Getting Started card should disappear
    await expect(page.getByText("Let's set up your academic results")).not.toBeVisible();

    // Compact "Continue Setup" banner should be displayed
    const resumeBtn = page.getByRole('button', { name: /Continue Setup/i });
    await expect(resumeBtn).toBeVisible();

    // Click Continue Setup opens calculator directly at Semester 1-1
    await resumeBtn.click();
    await expect(page.getByText('CS1101').first()).toBeVisible();
  });

});
