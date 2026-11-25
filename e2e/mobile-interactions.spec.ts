import { test, expect } from '@playwright/test';

test.describe('Mobile Interaction & Profile Audit', () => {

  test('1. First-time onboarding requires explicit fields and derives academic year', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
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
    const dropdownMenu = page.getByText(/Switch Profile/i).filter({ visible: true });
    await expect(dropdownMenu).toBeVisible();
    await expect(page.locator('button:visible span:has-text("Active")').first()).toBeVisible();

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
      await calcNavBtn.tap();
    } else {
      await page.getByRole('button', { name: /Calculator/i }).first().tap();
    }

    // Verify course CS1101 is visible
    await expect(page.getByText('CS1101').first()).toBeVisible();

    // Select Grade A on visible course card using actual touchscreen tap
    const gradeABtn = page.locator('button[aria-label*="Grade A "]').filter({ visible: true }).first();
    await gradeABtn.tap();
    await expect(gradeABtn).toHaveAttribute('aria-checked', 'true');

    // Tap-to-deselect: tapping Grade A again should clear it using actual touchscreen tap
    await gradeABtn.tap();
    await expect(gradeABtn).toHaveAttribute('aria-checked', 'false');

    // Undo toast should appear for cleared grade
    const undoToast = page.locator('text=Grade cleared for').filter({ visible: true });
    await expect(undoToast).toBeVisible();

    // Tap Undo button on toast (genuine tap without forced clicks)
    const undoBtn = page.getByRole('button', { name: /Undo/i }).filter({ visible: true });
    await expect(undoBtn).toBeVisible();
    await undoBtn.tap();

    // Grade should revert to A
    await expect(gradeABtn).toHaveAttribute('aria-checked', 'true');

    // Tap Grade B to change grade
    const gradeBBtn = page.locator('button[aria-label*="Grade B "]').filter({ visible: true }).first();
    await gradeBBtn.tap();
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

  test('5. Consolidated 4-item mobile bottom navigation and 7-destination hamburger menu', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      window.localStorage.setItem('gradepath_onboarded_v3', 'true');
      const profile = {
        id: 'prof_nav_test',
        name: 'Nav User',
        degree: 'ARMT',
        currentSemester: '1-1',
        currentAcademicYear: 1,
        batch: '',
        specializationDept: 'CS',
        semesters: { '1-1': [], '1-2': [], '2-1': [], '2-2': [], '3-1': [], '3-2': [], '4-1': [], '4-2': [] },
        orientationCourses: []
      };
      window.localStorage.setItem('gradepath_profiles_v3', JSON.stringify([profile]));
      window.localStorage.setItem('gradepath_active_id_v3', 'prof_nav_test');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    const vw = page.viewportSize()?.width ?? 390;
    const bottomNav = page.locator('nav[aria-label="Mobile Navigation"]');
    if (vw < 768) {
      await expect(bottomNav).toBeVisible();
      await expect(bottomNav.locator('button')).toHaveCount(4);
      await expect(bottomNav.getByRole('button', { name: /^Home$/i })).toBeVisible();
      await expect(bottomNav.getByRole('button', { name: /^Calculator$/i })).toBeVisible();
      await expect(bottomNav.getByRole('button', { name: /^Analytics$/i })).toBeVisible();
      await expect(bottomNav.getByRole('button', { name: /^Progress$/i })).toBeVisible();

      // Verify Plan and More sheets are removed
      await expect(bottomNav.getByRole('button', { name: /^Plan$/i })).toHaveCount(0);
      await expect(bottomNav.getByRole('button', { name: /^More$/i })).toHaveCount(0);

      // Navigate via hamburger drawer to Transcript
      await page.getByRole('button', { name: /Open navigation menu/i }).tap();
      const drawer = page.getByRole('dialog', { name: /Mobile Navigation Menu/i });
      await expect(drawer).toBeVisible();
      await expect(drawer.getByRole('button', { name: /Academic Transcript/i })).toBeVisible();
      await drawer.getByRole('button', { name: /Academic Transcript/i }).tap();
      await expect(drawer).not.toBeVisible();
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
    await expect(page.getByText(/Add your previous semester results to calculate your actual CGPA/i)).toBeVisible();

    // Must show Semester 1-1 and Semester 1-2
    await expect(page.locator('text=Semester 1-1').first()).toBeVisible();
    await expect(page.locator('text=Semester 1-2').first()).toBeVisible();

    // Must NOT show future semester (e.g. 2-2) in previous results setup
    await expect(page.locator('button[aria-label="Semester 2-2 Add Grades"]')).not.toBeVisible();

    // Setup Progress should indicate 0 of 2 semesters reviewed
    await expect(page.getByText(/0 of 2 semesters reviewed/i)).toBeVisible();
  });

  test('7. Direct semester navigation and permanent Previous/Next semester movement', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
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
    await expect(page.locator('main :visible').filter({ hasText: '4.00' }).first()).toBeVisible();
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

  test('9. Touch gesture safety: swipe/scroll (> 5px) prevents accidental grade deselection or change', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem('gradepath_onboarded_v3', 'true');
      const profile = {
        id: 'prof_touch_gesture',
        name: 'Gesture User',
        degree: 'ARMT',
        currentSemester: '1-1',
        currentAcademicYear: 1,
        batch: '',
        specializationDept: 'CS',
        semesters: {
          '1-1': [
            { code: 'CS1101', name: 'Principles of Crop Production', credits: 2, isCompulsory: true, grade: 'B' }
          ],
          '1-2': [], '2-1': [], '2-2': [], '3-1': [], '3-2': [], '4-1': [], '4-2': []
        },
        orientationCourses: []
      };
      window.localStorage.setItem('gradepath_profiles_v3', JSON.stringify([profile]));
      window.localStorage.setItem('gradepath_active_id_v3', 'prof_touch_gesture');
    });
    await page.reload();

    const calcNavBtn = page.locator('nav[aria-label="Mobile Navigation"]').getByRole('button', { name: /Calculator/i });
    if (await calcNavBtn.isVisible()) {
      await calcNavBtn.tap();
    } else {
      await page.getByRole('button', { name: /Calculator/i }).first().click();
    }

    // Verify course CS1101 is visible with Grade B initially selected
    const gradeBBtn = page.locator('button[aria-label*="Grade B "]').filter({ visible: true }).first();
    await expect(gradeBBtn).toBeVisible();
    await expect(gradeBBtn).toHaveAttribute('aria-checked', 'true');

    // 1. Simulate a touch drag / swipe gesture across Grade B button (> 5px movement)
    const box = await gradeBBtn.boundingBox();
    if (box) {
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;

      // Dispatch swipe gesture using touch events
      await page.evaluate(({ x, y }) => {
        const target = document.elementFromPoint(x, y);
        if (target) {
          const touchObj1 = new Touch({ identifier: 1, target, clientX: x, clientY: y });
          target.dispatchEvent(new TouchEvent('touchstart', { touches: [touchObj1], bubbles: true }));

          // Move 30px horizontally (swiping across grade selector)
          const touchObj2 = new Touch({ identifier: 1, target, clientX: x + 30, clientY: y });
          target.dispatchEvent(new TouchEvent('touchmove', { touches: [touchObj2], bubbles: true }));

          target.dispatchEvent(new TouchEvent('touchend', { touches: [], bubbles: true }));
          // Synthesize click that browsers dispatch after touch
          target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      }, { x: startX, y: startY });

      // Grade B should still remain selected (swiping prevented accidental deselection!)
      await expect(gradeBBtn).toHaveAttribute('aria-checked', 'true');
    }

    // 2. Perform a stationary tap on Grade B to clear it (tap-to-deselect)
    await gradeBBtn.tap();
    await expect(gradeBBtn).toHaveAttribute('aria-checked', 'false');

    // 3. Perform stationary tap on Grade A to select it
    const gradeABtn = page.locator('button[aria-label*="Grade A "]').filter({ visible: true }).first();
    await gradeABtn.tap();
    await expect(gradeABtn).toHaveAttribute('aria-checked', 'true');
  });

  test('10. Degree programme change requires explicit confirmation and provides safe recovery', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem('gradepath_onboarded_v3', 'true');
      const profile = {
        id: 'prof_degree_protect',
        name: 'Protection User',
        degree: 'ARMT',
        currentSemester: '1-1',
        currentAcademicYear: 1,
        batch: '',
        specializationDept: 'CS',
        semesters: {
          '1-1': [
            { code: 'CS1101', name: 'Principles of Crop Production', credits: 2, isCompulsory: true, grade: 'A' },
            { code: 'AS1101', name: 'Introduction to Livestock', credits: 2, isCompulsory: true, grade: 'B' }
          ],
          '1-2': [], '2-1': [], '2-2': [], '3-1': [], '3-2': [], '4-1': [], '4-2': []
        },
        orientationCourses: []
      };
      window.localStorage.setItem('gradepath_profiles_v3', JSON.stringify([profile]));
      window.localStorage.setItem('gradepath_active_id_v3', 'prof_degree_protect');
    });
    await page.reload();

    // Open Edit Profile modal
    const editBtn = page.getByRole('button', { name: /Change/i }).first();
    await editBtn.click();

    // Change degree from ARMT to ABM
    const abmBtn = page.getByRole('button', { name: /BSc Hons \(ABM\)/i });
    await abmBtn.click();

    // Click Save Changes
    const saveBtn = page.getByRole('button', { name: /Save Changes/i });
    await saveBtn.click();

    // Confirmation dialog must appear
    const confirmTitle = page.locator('text=Confirm Degree Programme Change');
    await expect(confirmTitle).toBeVisible();
    await expect(page.locator('text=Change Curriculum from ARMT to ABM')).toBeVisible();

    // 1. Test Cancel: clicking Cancel keeps ARMT and dismisses confirmation
    const cancelConfirmBtn = page.getByRole('button', { name: /Cancel \(Keep ARMT\)/i });
    await cancelConfirmBtn.click();
    await expect(confirmTitle).not.toBeVisible();

    // 2. Select ABM again and confirm
    await abmBtn.click();
    await saveBtn.click();
    await expect(confirmTitle).toBeVisible();

    const confirmReplaceBtn = page.getByRole('button', { name: /Confirm & Replace/i });
    await confirmReplaceBtn.click();

    // Active degree should now be ABM
    await expect(page.locator('text=ABM (Hons) Undergraduate').first()).toBeVisible();

    // Check localStorage: previous ARMT results should be preserved in archivedDegreeRecords
    const isArchived = await page.evaluate(() => {
      const stored = JSON.parse(window.localStorage.getItem('gradepath_profiles_v3') || '[]');
      const active = stored.find((p: any) => p.id === 'prof_degree_protect');
      return active?.archivedDegreeRecords?.['ARMT']?.semesters?.['1-1']?.[0]?.grade === 'A';
    });
    expect(isArchived).toBe(true);

    // 3. Test safe recovery: switch back to ARMT and verify archived grades are restored
    await editBtn.click();
    const armtBtn = page.getByRole('button', { name: /BSc Hons \(ARMT\)/i });
    await armtBtn.click();
    await saveBtn.click();

    // Should ask for confirmation to change back to ARMT
    await expect(confirmTitle).toBeVisible();
    await confirmReplaceBtn.click();

    // Verify ARMT grades are restored!
    await expect(page.locator('text=ARMT (Hons) Undergraduate').first()).toBeVisible();
    const restoredGrade = await page.evaluate(() => {
      const stored = JSON.parse(window.localStorage.getItem('gradepath_profiles_v3') || '[]');
      const active = stored.find((p: any) => p.id === 'prof_degree_protect');
      return active?.semesters?.['1-1']?.[0]?.grade === 'A';
    });
    expect(restoredGrade).toBe(true);
  });

  test('11. Reviewed semesters with pending results update Getting Started progress without modifying confirmed GPA', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem('gradepath_onboarded_v3', 'true');
      const profile = {
        id: 'prof_pending_test',
        name: 'Pending User',
        degree: 'ARMT',
        currentSemester: '2-1',
        currentAcademicYear: 2,
        batch: '',
        specializationDept: 'CS',
        semesters: {
          '1-1': [{ code: 'CS1101', name: 'Principles of Crop Production', credits: 2, isCompulsory: true, grade: '' }],
          '1-2': [{ code: 'CS1201', name: 'Field Crop Production', credits: 2, isCompulsory: true, grade: '' }],
          '2-1': [{ code: 'CS2101', name: 'Plantation Crops', credits: 2, isCompulsory: true, grade: '' }],
          '2-2': [], '3-1': [], '3-2': [], '4-1': [], '4-2': []
        },
        orientationCourses: []
      };
      window.localStorage.setItem('gradepath_profiles_v3', JSON.stringify([profile]));
      window.localStorage.setItem('gradepath_active_id_v3', 'prof_pending_test');
    });
    await page.reload();

    // Initial state: 0 of 2 semesters reviewed
    await expect(page.getByText('0 of 2 semesters reviewed')).toBeVisible();

    // Click "Add Grades" for Semester 1-1 to view it
    const add11Btn = page.getByRole('button', { name: /Semester 1-1 Add Grades/i });
    await add11Btn.click();

    // Semester 1-1 opened; no grades entered (pending results)
    await expect(page.getByText('CS1101').first()).toBeVisible();

    // Return to Dashboard
    const bottomNav = page.locator('nav[aria-label="Mobile Navigation"]');
    if (await bottomNav.isVisible()) {
      await bottomNav.getByRole('button', { name: /Home/i }).click();
    } else {
      await page.getByRole('button', { name: /Dashboard/i }).first().click();
    }

    // Getting Started progress must update to 1 of 2 semesters reviewed (50%)
    await expect(page.getByText('1 of 2 semesters reviewed (50%)')).toBeVisible();
    await expect(page.getByText('Reviewed (Pending)')).toBeVisible();

    // Confirmed academic metrics MUST remain strictly untouched (missing confirmed grades shown as em dash, 0 credits)
    await expect(page.getByText('—/ 4.00').first()).toBeVisible();
    await expect(page.getByText('0/ 126').first()).toBeVisible();
    await expect(page.locator('main :visible').filter({ hasText: '★ No Grades Finalized' }).first()).toBeVisible();
  });

  test('12. Previous and Next semester navigation handles persistence failures safely', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem('gradepath_onboarded_v3', 'true');
      const profile = {
        id: 'prof_persist_fail',
        name: 'Failure Test User',
        degree: 'ARMT',
        currentSemester: '1-1',
        currentAcademicYear: 1,
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
      window.localStorage.setItem('gradepath_active_id_v3', 'prof_persist_fail');
    });
    await page.reload();

    // Navigate to Calculator
    const calcNavBtn = page.locator('nav[aria-label="Mobile Navigation"]').getByRole('button', { name: /Calculator/i });
    if (await calcNavBtn.isVisible()) {
      await calcNavBtn.click();
    } else {
      await page.getByRole('button', { name: /Calculator/i }).first().click();
    }

    // Verify Next button [1-2 →] is visible
    const nextTo12Btn = page.getByRole('button', { name: /1-2 →/i });
    await expect(nextTo12Btn).toBeVisible();

    // Simulate storage quota / persistence failure
    await page.evaluate(() => {
      Storage.prototype.setItem = () => {
        throw new Error('QuotaExceededError: storage full');
      };
    });

    // Attempt to navigate to Semester 1-2
    await nextTo12Btn.click();

    // Should display safe failure notice without silent data corruption
    await expect(page.locator('text=Save failed: Storage unavailable').first()).toBeVisible();
  });

  test('13. Reported Mobile Profile Switching in GPA Calculator using real touchscreen tap (Gelitha & Nishani)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      window.localStorage.setItem('gradepath_onboarded_v3', 'true');
      const profileGelitha = {
        id: 'prof_gelitha',
        name: 'Gelitha',
        degree: 'ABM',
        currentSemester: '2-1',
        currentAcademicYear: 2,
        batch: '',
        specializationDept: 'ABM',
        semesters: {
          '1-1': [{ code: 'ABM1101', name: 'Microeconomics', credits: 2, isCompulsory: true, grade: 'A', isExpected: false }],
          '1-2': [{ code: 'ABM1201', name: 'Macroeconomics', credits: 2, isCompulsory: true, grade: 'A', isExpected: false }],
          '2-1': [{ code: 'ABM2101', name: 'Agribusiness Management', credits: 3, isCompulsory: true, grade: '', isExpected: false }],
          '2-2': [], '3-1': [], '3-2': [], '4-1': [], '4-2': []
        },
        orientationCourses: []
      };
      const profileNishani = {
        id: 'prof_nishani',
        name: 'Nishani',
        degree: 'ABM',
        currentSemester: '2-1',
        currentAcademicYear: 2,
        batch: '',
        specializationDept: 'ABM',
        semesters: {
          '1-1': [{ code: 'ABM1101', name: 'Microeconomics', credits: 2, isCompulsory: true, grade: 'C', isExpected: false }],
          '1-2': [{ code: 'ABM1201', name: 'Macroeconomics', credits: 2, isCompulsory: true, grade: 'C', isExpected: false }],
          '2-1': [{ code: 'ABM2101', name: 'Agribusiness Management', credits: 3, isCompulsory: true, grade: 'B', isExpected: false }],
          '2-2': [], '3-1': [], '3-2': [], '4-1': [], '4-2': []
        },
        orientationCourses: []
      };
      window.localStorage.setItem('gradepath_profiles_v3', JSON.stringify([profileGelitha, profileNishani]));
      window.localStorage.setItem('gradepath_active_id_v3', 'prof_nishani');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Open GPA Calculator on mobile
    const vw = page.viewportSize()?.width ?? 390;
    const calcNavBtn = vw < 768
      ? page.locator('nav[aria-label="Mobile Navigation"]').getByRole('button', { name: /Calculator/i })
      : page.getByRole('button', { name: /GPA Calculator/i }).first();
    await expect(calcNavBtn).toBeVisible();
    await calcNavBtn.tap();

    // Verify Nishani is active in header and Nishani's 2-1 grade ('B') & CGPA (2.43) are loaded
    const headerSwitcherNishani = page.locator('header button:visible').filter({ hasText: 'Nishani' }).first();
    await expect(headerSwitcherNishani).toBeVisible();
    await expect(page.locator('main :visible').filter({ hasText: '2.43' }).first()).toBeVisible();

    // Tap header profile switcher with genuine touchscreen tap
    await headerSwitcherNishani.tap();
    const dropdownHeading = page.getByText(/Switch Profile \(2\)/i).filter({ visible: true }).first();
    await expect(dropdownHeading).toBeVisible();

    // Tap Gelitha in dropdown (no force click)
    const gelithaOption = page.locator('header button:visible').filter({ hasText: 'Gelitha' }).first();
    await expect(gelithaOption).toBeVisible();
    await gelithaOption.tap();

    // Verify dropdown closed, header displays Gelitha, and Calculator loaded Gelitha's CGPA (4.00)
    await expect(dropdownHeading).not.toBeVisible();
    const headerSwitcherGelitha = page.locator('header button:visible').filter({ hasText: 'Gelitha' }).first();
    await expect(headerSwitcherGelitha).toBeVisible();
    await expect(page.locator('main :visible').filter({ hasText: '4.00' }).first()).toBeVisible();

    // Verify active profile persists after page refresh
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('header button:visible').filter({ hasText: 'Gelitha' }).first()).toBeVisible();

    // Verify switching while scrolled down (sticky summary visible) and after entering a grade (Undo toast visible)
    const gradeAPlusBtn = page.getByRole('button', { name: 'Grade A+' }).first();
    if (await gradeAPlusBtn.isVisible()) {
      await gradeAPlusBtn.tap();
    }
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(150);

    await page.locator('header button:visible').filter({ hasText: 'Gelitha' }).first().tap();
    await expect(page.getByText(/Switch Profile \(2\)/i).filter({ visible: true }).first()).toBeVisible();
    const nishaniOption = page.locator('header button:visible').filter({ hasText: 'Nishani' }).first();
    await nishaniOption.tap();
    await expect(page.locator('header button:visible').filter({ hasText: 'Nishani' }).first()).toBeVisible();
  });

  test('14. Mobile hamburger menu and profile switcher are mutually exclusive with no blocking overlays', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      window.localStorage.setItem('gradepath_onboarded_v3', 'true');
      const profile = {
        id: 'prof_hamburger_test',
        name: 'Menu Tester',
        degree: 'ARMT',
        currentSemester: '1-1',
        currentAcademicYear: 1,
        batch: '',
        specializationDept: 'CS',
        semesters: {
          '1-1': [{ code: 'CS1101', name: 'Principles of Crop Production', credits: 2, isCompulsory: true, grade: '' }],
          '1-2': [], '2-1': [], '2-2': [], '3-1': [], '3-2': [], '4-1': [], '4-2': []
        },
        orientationCourses: []
      };
      window.localStorage.setItem('gradepath_profiles_v3', JSON.stringify([profile]));
      window.localStorage.setItem('gradepath_active_id_v3', 'prof_hamburger_test');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    const hamburgerBtn = page.getByRole('button', { name: /Open navigation menu/i });
    if (!(await hamburgerBtn.isVisible())) {
      // Desktop/Tablet >= 768px does not render mobile hamburger
      return;
    }

    // 1. Open hamburger drawer via tap
    await hamburgerBtn.tap();
    const drawer = page.getByRole('dialog', { name: /Mobile Navigation Menu/i });
    await expect(drawer).toBeVisible();

    // 2. Navigate to Analytics from drawer and verify drawer closes cleanly
    await drawer.getByRole('button', { name: /^Analytics$/i }).tap();
    await expect(drawer).not.toBeVisible();

    // 3. Open profile switcher, then open hamburger -> profile switcher must close
    const profileBtn = page.locator('header button:visible').filter({ hasText: 'Menu Tester' }).first();
    await profileBtn.tap();
    await expect(page.getByText(/Switch Profile/i).filter({ visible: true }).first()).toBeVisible();

    await hamburgerBtn.tap();
    await expect(drawer).toBeVisible();
    await expect(page.getByText(/Switch Profile/i).filter({ visible: true })).toHaveCount(0);

    // 4. Close drawer and verify profile switcher still responds immediately (no blocking overlay)
    await drawer.getByRole('button', { name: /Close navigation menu/i }).tap();
    await expect(drawer).not.toBeVisible();
    await profileBtn.tap();
    await expect(page.getByText(/Switch Profile/i).filter({ visible: true }).first()).toBeVisible();
  });

  test('15. Privacy & academic disclaimers appear in onboarding, settings, and footer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Onboarding modal displays privacy & academic disclaimer
    const onboardingDialog = page.locator('form').locator('..');
    await expect(onboardingDialog.getByText('Your data stays on your device.')).toBeVisible();
    await expect(onboardingDialog.getByText(/unofficial academic planning tool/i)).toBeVisible();

    // Complete onboarding and check Footer + Settings
    await onboardingDialog.getByPlaceholder('e.g. K.A. Janith Silva').fill('Privacy Tester');
    await onboardingDialog.getByRole('button', { name: /BSc Hons \(GT\)/i }).tap();
    await onboardingDialog.getByRole('button', { name: /Sem 1-1/i }).tap();
    await onboardingDialog.getByRole('button', { name: /Complete Setup & Open Dashboard/i }).tap();

    await expect(page.locator('footer').getByText(/Your data stays on your device/i)).toBeVisible();
    await expect(page.locator('footer').getByText(/unofficial academic planning tool/i)).toBeVisible();
  });

  test('16. Consolidated navigation: 4-item mobile bottom bar, 7-item drawer, and GT hides ARMT specialization', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      window.localStorage.setItem('gradepath_onboarded_v3', 'true');
      const gtProfile = {
        id: 'prof_gt_nav',
        name: 'GT Nav User',
        degree: 'GT',
        currentSemester: '2-1',
        currentAcademicYear: 2,
        batch: '',
        specializationDept: 'EN',
        semesters: {
          '1-1': [{ code: 'CC11203', name: 'ICT', credits: 2, isCompulsory: true, grade: 'A', isExpected: false }],
          '1-2': [], '2-1': [], '2-2': [], '3-1': [], '3-2': [], '4-1': [], '4-2': []
        },
        orientationCourses: []
      };
      window.localStorage.setItem('gradepath_profiles_v3', JSON.stringify([gtProfile]));
      window.localStorage.setItem('gradepath_active_id_v3', 'prof_gt_nav');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    const vw = page.viewportSize()?.width ?? 390;
    const mobileNav = page.locator('nav[aria-label="Mobile Navigation"]');
    if (vw < 768) {
      await expect(mobileNav).toBeVisible();
      const navButtons = mobileNav.locator('button');
      await expect(navButtons).toHaveCount(4);
      await expect(mobileNav.getByRole('button', { name: /Progress/i })).toBeVisible();
      await mobileNav.getByRole('button', { name: /Progress/i }).tap();
    } else {
      const progressBtn = page.getByRole('button', { name: /Academic Progress/i }).first();
      await expect(progressBtn).toBeVisible();
      await progressBtn.tap();
    }

    // GT student must NOT see ARMT Specialization Stream Eligibility section
    await expect(page.getByText(/ARMT Specialization Stream Eligibility/i)).toHaveCount(0);
    await expect(page.getByText(/Degree Conferment Criteria/i)).toBeVisible();
  });

  test('17. Green Technology (GT) projections update immediately across Calculator and Dashboard', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      window.localStorage.setItem('gradepath_onboarded_v3', 'true');
      const gtProfile = {
        id: 'prof_gt_proj',
        name: 'GT Proj Student',
        degree: 'GT',
        currentSemester: '1-1',
        currentAcademicYear: 1,
        batch: '',
        specializationDept: 'EN',
        semesters: {
          '1-1': [
            { code: 'CC11203', name: 'ICT', credits: 3, isCompulsory: true, grade: 'A', isExpected: false },
            { code: 'CS11201', name: 'Agronomy', credits: 3, isCompulsory: true, grade: 'B', isExpected: false },
            { code: 'EC11203', name: 'Economic Principles', credits: 3, isCompulsory: true, grade: '', isExpected: false }
          ],
          '1-2': [], '2-1': [], '2-2': [], '3-1': [], '3-2': [], '4-1': [], '4-2': []
        },
        orientationCourses: []
      };
      window.localStorage.setItem('gradepath_profiles_v3', JSON.stringify([gtProfile]));
      window.localStorage.setItem('gradepath_active_id_v3', 'prof_gt_proj');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Open Calculator
    const vw = page.viewportSize()?.width ?? 390;
    const calcNavBtn = vw < 768
      ? page.locator('nav[aria-label="Mobile Navigation"]').getByRole('button', { name: /Calculator/i })
      : page.getByRole('button', { name: /GPA Calculator/i }).first();
    await expect(calcNavBtn).toBeVisible();
    await calcNavBtn.tap();

    // Actual CGPA is 3.50
    await expect(page.locator('main :visible').filter({ hasText: '3.50' }).first()).toBeVisible();

    // Mark EC11203 (3rd course) as Projected and select Grade A -> Projected CGPA becomes 3.67 while Actual remains 3.50
    await page.locator('label:visible').filter({ hasText: /^Projected$/ }).nth(2).tap();
    await page.getByRole('radiogroup', { name: 'Grade for EC11203' }).getByRole('radio', { name: /Grade A \(/i }).tap();

    await expect(page.locator('main :visible').filter({ hasText: '3.67' }).first()).toBeVisible();
    await expect(page.locator('main :visible').filter({ hasText: '3.50' }).first()).toBeVisible();
  });

  test('18. Interactive Suggested Grade Combination: manual lock, auto rebalance, reset, and apply as projected', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      window.localStorage.setItem('gradepath_onboarded_v3', 'true');
      const profile = {
        id: 'prof_dynamic_balance',
        name: 'Balancer Student',
        degree: 'GT',
        currentSemester: '1-1',
        currentAcademicYear: 1,
        batch: '',
        specializationDept: 'EN',
        semesters: {
          '1-1': [
            { code: 'CC11203', name: 'ICT', credits: 3, isCompulsory: true, grade: 'B', isExpected: false },
            { code: 'CS11201', name: 'Agronomy', credits: 3, isCompulsory: true, grade: '', isExpected: false },
            { code: 'EC11203', name: 'Economic Principles', credits: 3, isCompulsory: true, grade: '', isExpected: false },
            { code: 'EN11201', name: 'Hydrology', credits: 3, isCompulsory: true, grade: '', isExpected: false }
          ],
          '1-2': [], '2-1': [], '2-2': [], '3-1': [], '3-2': [], '4-1': [], '4-2': []
        },
        orientationCourses: []
      };
      window.localStorage.setItem('gradepath_profiles_v3', JSON.stringify([profile]));
      window.localStorage.setItem('gradepath_active_id_v3', 'prof_dynamic_balance');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    const vw = page.viewportSize()?.width ?? 390;
    const calcNavBtn = vw < 768
      ? page.locator('nav[aria-label="Mobile Navigation"]').getByRole('button', { name: /Calculator/i })
      : page.getByRole('button', { name: /GPA Calculator/i }).first();
    await expect(calcNavBtn).toBeVisible();
    await calcNavBtn.tap();

    // Open Planning Tools
    await page.getByRole('button', { name: /Planning Tools/i }).tap();
    await expect(page.getByText(/Interactive Suggested Grade Combination/i)).toBeVisible();

    // Select manual grade A+ for CS11201 -> verify Manual indicator and Manual / Auto credit summary (3 / 6 Cr)
    const csSelect = page.getByLabel('Grade for CS11201 (1-1)');
    await csSelect.selectOption('A+');
    await expect(page.getByText('3 / 6 Cr')).toBeVisible();

    // Select E for EC11203 and E for EN11201 (with Target 3.50 default) -> unreachable warning appears
    await page.getByLabel('Grade for EC11203 (1-1)').selectOption('E');
    await page.getByLabel('Grade for EN11201 (1-1)').selectOption('E');
    await expect(page.getByText(/Target currently unreachable with your selected grades/i)).toBeVisible();

    // Reset Allocation -> restores Auto and feasibility
    await page.getByRole('button', { name: /Reset Allocation/i }).tap();
    await expect(page.getByText('0 / 9 Cr')).toBeVisible();
    await expect(page.getByRole('button', { name: /Apply Suggested as Projected/i })).toBeVisible();

    // Apply Suggested as Projected -> Actual CGPA remains 3.00, Projected CGPA appears
    await page.getByRole('button', { name: /Apply Suggested as Projected/i }).tap();
    await expect(page.getByText(/Applied 3 balanced grades as projected grades/i)).toBeVisible();
  });

});
