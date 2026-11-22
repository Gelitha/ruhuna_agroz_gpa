// University of Ruhuna - Faculty of Agriculture GPA Calculator & Advisor Engine
// Frontend UI Controller & Event Handlers (TypeScript Source File)

import {
  Grade,
  DegreeCode,
  SemesterKey,
  Course,
  StudentProfile,
  RegulationRiskAlert,
  ConcreteGradeCombination
} from './types';

import {
  GRADING_SCALE,
  DEPARTMENTS,
  DEGREE_INFO,
  COURSE_CATALOG,
  DEGREE_COMPULSORY_COURSES,
  SPECIALIZATION_STREAMS
} from './database';

import {
  STATE,
  initDefaultCoursesForDegree,
  calculateCourseGpv,
  calculateSemesterStats,
  calculateOverallStats,
  calculateTargetGpa,
  calculateAcademicRiskAlerts,
  calculateRepeatImpact,
  simulateGpaProjection,
  checkDegreeConfermentAudit,
  generateAcademicSummaryCardText,
  parseTranscriptText,
  loadSampleStudentData,
  saveState,
  loadState,
  getAllProfiles,
  saveAllProfiles,
  getActiveProfileId,
  setActiveProfileId,
  createNewProfile,
  switchProfile,
  deleteProfile,
  cloneActiveProfile,
  updateProfileMetadata,
  exportActiveProfileJson,
  exportAllProfilesJson,
  importProfileJson,
  exportTranscriptCsv
} from './app';

const ONBOARDING_KEY = 'ruhuna_agri_onboarded_v2';
const THEME_STORAGE_KEY = 'ruhuna_agri_theme';
let isEditingProfile = false;

// Toast notification helper
export function showToast(message: string, duration = 3000): void {
  let toast = document.getElementById('appToastNotification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToastNotification';
    toast.className = 'app-toast';
    document.body.appendChild(toast);
  }
  toast.innerText = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast?.classList.remove('show');
  }, duration);
}

// Copy text to clipboard helper
export async function copyToClipboard(text: string, successMessage = 'Copied to clipboard!'): Promise<void> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      showToast(`✔ ${successMessage}`);
    } else {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(`✔ ${successMessage}`);
    }
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    showToast('Failed to copy to clipboard');
  }
}

// 1. Initialize Theme (Dark / Light)
export function initTheme(): void {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.body.classList.add('dark-mode');
    const btn = document.getElementById('btnThemeToggle');
    if (btn) btn.innerHTML = '☀️ Light';
  } else {
    document.body.classList.remove('dark-mode');
    const btn = document.getElementById('btnThemeToggle');
    if (btn) btn.innerHTML = '🌙 Dark';
  }
}

export function toggleTheme(): void {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
  const btn = document.getElementById('btnThemeToggle');
  if (btn) btn.innerHTML = isDark ? '☀️ Light' : '🌙 Dark';
  renderGpaTrendChart();
  renderGradeDistribution();
}

// 2. Check First Time Entry Onboarding
export function checkFirstTimeOnboarding(): void {
  if (!localStorage.getItem(ONBOARDING_KEY)) {
    const modal = document.getElementById('onboardingModal');
    if (modal) modal.classList.add('show');
  }
}

// Helper: Escape HTML
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Render dynamic greeting
export function updateGreeting(): void {
  const greetingEl = document.getElementById('greetingTitle');
  const subtitleEl = document.getElementById('greetingSubtitle');
  if (!greetingEl) return;

  const hour = new Date().getHours();
  let timeGreeting = 'Good day';
  if (hour >= 4 && hour < 12) timeGreeting = 'Good morning';
  else if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
  else if (hour >= 17 && hour < 22) timeGreeting = 'Good evening';
  else timeGreeting = 'Burning the midnight oil';

  const studentName = escapeHtml(STATE.name || 'Student');
  greetingEl.innerHTML = `${timeGreeting}, <span class="greeting-name">${studentName}</span> 👋`;

  if (subtitleEl) {
    const degInfo = DEGREE_INFO[STATE.degree] || DEGREE_INFO.ARMT;
    const specName = (STATE.degree !== 'GT') ? ` • ${STATE.specializationDept} Stream` : '';
    subtitleEl.innerText = `${degInfo.name}${specName} • Index: ${STATE.indexNumber || 'N/A'}`;
  }
}

// Render profile header pill and dropdown
export function renderProfileHeader(): void {
  const profileDisplayName = document.getElementById('profileDisplayName');
  const profileAvatar = document.getElementById('profileAvatar');
  if (profileDisplayName) {
    profileDisplayName.innerText = `${STATE.name} (${STATE.indexNumber || 'No Index'})`;
  }
  if (profileAvatar) {
    profileAvatar.innerText = (STATE.name || 'G').charAt(0).toUpperCase();
  }
  renderProfileDropdownList();
  updateGreeting();
}

export function renderProfileDropdownList(): void {
  const container = document.getElementById('profileListItems');
  if (!container) return;
  container.innerHTML = '';

  const profiles = getAllProfiles();
  profiles.forEach(p => {
    const item = document.createElement('div');
    item.className = 'profile-dropdown-item' + (p.id === STATE.id ? ' active' : '');
    item.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="avatar" style="width: 24px; height: 24px; font-size: 0.7rem;">${(p.name || 'S').charAt(0).toUpperCase()}</span>
        <div>
          <div style="font-weight: 600; font-size: 0.8rem;">${escapeHtml(p.name)}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">${p.degree} • ${p.indexNumber}</div>
        </div>
      </div>
      ${p.id === STATE.id ? '<span style="color: var(--primary-accent); font-size: 0.75rem;">✓ Active</span>' : ''}
    `;
    item.addEventListener('click', () => {
      if (p.id !== STATE.id) {
        switchProfile(p.id);
        renderAll();
      }
      const dropdown = document.getElementById('profileDropdown');
      if (dropdown) dropdown.classList.remove('show');
    });
    container.appendChild(item);
  });
}

// Render print header
export function renderPrintHeader(): void {
  const printStudent = document.getElementById('printStudentInfo');
  const printDegree = document.getElementById('printDegreeName');
  if (printStudent) {
    printStudent.innerText = `Student: ${STATE.name} | Index Number: ${STATE.indexNumber} | Generated: ${new Date().toLocaleDateString()}`;
  }
  if (printDegree) {
    const deg = DEGREE_INFO[STATE.degree] || DEGREE_INFO.ARMT;
    printDegree.innerText = `${deg.name} (${STATE.degree}) • Specialization: ${DEPARTMENTS[STATE.specializationDept] || STATE.specializationDept}`;
  }
}

// Render Degree switch buttons & Specialization dropdown
export function renderDegreeButtons(): void {
  document.querySelectorAll('#degreeBtnGroup .degree-btn').forEach(btn => {
    if (btn.getAttribute('data-degree') === STATE.degree) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const specContainer = document.getElementById('specializationContainer');
  const specSelect = document.getElementById('specDeptSelect') as HTMLSelectElement | null;
  if (specContainer) {
    specContainer.style.display = (STATE.degree === 'GT') ? 'none' : 'flex';
  }
  if (specSelect) {
    specSelect.value = STATE.specializationDept || 'CS';
  }
}

// Render semester tabs
export function renderTabs(): void {
  document.querySelectorAll('#semesterTabsContainer .semester-tab').forEach(tab => {
    if (tab.getAttribute('data-sem') === STATE.currentSemester) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
}

// Render top-level summary metrics
export function renderSummaryCards(): void {
  const stats = calculateOverallStats();

  // 1. CGPA Metric Card
  const cgpaEl = document.getElementById('summaryCgpaValue');
  const classStandingEl = document.getElementById('summaryClassStanding');
  const expectedCgpaPill = document.getElementById('summaryExpectedCgpaPill');

  if (cgpaEl) {
    cgpaEl.innerText = stats.realCreditsAttempted > 0 ? stats.realCgpa.toFixed(2) : stats.cgpa.toFixed(2);
  }

  if (classStandingEl) {
    const displayStanding = stats.realCreditsAttempted > 0 ? stats.realClassStanding : stats.classStanding;
    const badgeColor = stats.realCreditsAttempted > 0 ? stats.realClassBadgeColor : stats.classBadgeColor;
    classStandingEl.className = `metric-badge badge-${badgeColor}`;
    classStandingEl.innerText = displayStanding;
  }

  if (expectedCgpaPill) {
    if (stats.hasExpectedCourses) {
      expectedCgpaPill.style.display = 'inline-flex';
      expectedCgpaPill.innerText = `✨ Expected: ${stats.cgpa.toFixed(2)} (${stats.deltaCgpa >= 0 ? '+' : ''}${stats.deltaCgpa.toFixed(2)})`;
    } else {
      expectedCgpaPill.style.display = 'none';
    }
  }

  // 2. Credits Progress Card
  const creditsProgressEl = document.getElementById('summaryCreditsProgress');
  const progressBar = document.getElementById('summaryCreditsBar');
  const pct = Math.min(100, Math.round((stats.totalGpaCreditsEarned / stats.totalRequiredCredits) * 100));

  if (creditsProgressEl) {
    creditsProgressEl.innerText = `${stats.totalGpaCreditsEarned} / ${stats.totalRequiredCredits} Cr`;
  }
  if (progressBar) {
    progressBar.style.width = `${pct}%`;
  }

  // 3. Status Badges
  const honorsBadge = document.getElementById('summaryHonorsBadge');
  const ngpaBadge = document.getElementById('summaryNgpaBadge');

  if (honorsBadge) {
    let anyEligible = false;
    for (let yr = 1; yr <= 4; yr++) {
      if (stats.deansHonors[yr]?.eligible) {
        anyEligible = true;
        break;
      }
    }
    if (anyEligible) {
      honorsBadge.className = 'metric-badge badge-gold';
      honorsBadge.innerText = 'Dean’s Honors Eligible 🏅';
    } else {
      honorsBadge.className = 'metric-badge badge-slate';
      honorsBadge.innerText = 'Dean’s Honors Pending';
    }
  }

  if (ngpaBadge) {
    if (stats.ngpaAllPassed) {
      ngpaBadge.className = 'metric-badge badge-emerald';
      ngpaBadge.innerText = 'Non-GPA Modules: Passed';
    } else {
      ngpaBadge.className = 'metric-badge badge-rose';
      ngpaBadge.innerText = 'Non-GPA Modules: Incomplete';
    }
  }
}

// GPA Progression SVG Chart
export function renderGpaTrendChart(): void {
  const container = document.getElementById('gpaTrendChartWrapper');
  if (!container) return;

  const semKeys: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
  const overall = calculateOverallStats();
  const isDark = document.body.classList.contains('dark-mode');

  let cumPointsReal = 0;
  let cumCreditsReal = 0;
  let cumPointsExp = 0;
  let cumCreditsExp = 0;
  const data: Array<{ sem: string; realSgpa: number; expSgpa: number; realCgpa: number | null; expCgpa: number; hasExpected: boolean }> = [];

  semKeys.forEach(sem => {
    const s = overall.semStats[sem];
    if (s.gpaCreditsAttempted > 0) {
      cumPointsExp += s.weightedPoints;
      cumCreditsExp += s.gpaCreditsAttempted;

      cumPointsReal += s.realWeightedPoints;
      cumCreditsReal += s.realCreditsAttempted;

      data.push({
        sem,
        realSgpa: s.realSgpa,
        expSgpa: s.sgpa,
        realCgpa: cumCreditsReal > 0 ? parseFloat((cumPointsReal / cumCreditsReal).toFixed(2)) : null,
        expCgpa: parseFloat((cumPointsExp / cumCreditsExp).toFixed(2)),
        hasExpected: s.hasExpected
      });
    }
  });

  const width = 800;
  const height = 180;
  const padLeft = 40;
  const padRight = 30;
  const padTop = 15;
  const padBottom = 25;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const getY = (val: number) => padTop + chartH - ((val / 4.0) * chartH);
  const getX = (idx: number) => padLeft + (chartW / (semKeys.length - 1)) * idx;

  const y37 = getY(3.70);
  const y33 = getY(3.30);
  const y30 = getY(3.00);
  const y20 = getY(2.00);

  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#1f293d' : '#e2e8f0';

  let svg = `
    <svg viewBox="0 0 ${width} ${height}" class="chart-svg" style="font-family: inherit;">
      <line x1="${padLeft}" y1="${y37}" x2="${width - padRight}" y2="${y37}" stroke="#f59e0b" stroke-dasharray="4,4" stroke-width="1.2" opacity="0.8" />
      <text x="${width - padRight + 4}" y="${y37 + 3}" fill="#f59e0b" font-size="9" font-weight="700">3.70</text>

      <line x1="${padLeft}" y1="${y33}" x2="${width - padRight}" y2="${y33}" stroke="#3b82f6" stroke-dasharray="4,4" stroke-width="1.2" opacity="0.8" />
      <text x="${width - padRight + 4}" y="${y33 + 3}" fill="#3b82f6" font-size="9" font-weight="700">3.30</text>

      <line x1="${padLeft}" y1="${y30}" x2="${width - padRight}" y2="${y30}" stroke="${gridColor}" stroke-dasharray="2,2" stroke-width="1" />
      <line x1="${padLeft}" y1="${y20}" x2="${width - padRight}" y2="${y20}" stroke="${gridColor}" stroke-dasharray="2,2" stroke-width="1" />

      <line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${padTop + chartH}" stroke="${gridColor}" stroke-width="1.5" />
      <line x1="${padLeft}" y1="${padTop + chartH}" x2="${width - padRight}" y2="${padTop + chartH}" stroke="${gridColor}" stroke-width="1.5" />

      <text x="${padLeft - 6}" y="${getY(4.0) + 3}" fill="${textColor}" font-size="9" text-anchor="end">4.0</text>
      <text x="${padLeft - 6}" y="${getY(3.0) + 3}" fill="${textColor}" font-size="9" text-anchor="end">3.0</text>
      <text x="${padLeft - 6}" y="${getY(2.0) + 3}" fill="${textColor}" font-size="9" text-anchor="end">2.0</text>
      <text x="${padLeft - 6}" y="${getY(1.0) + 3}" fill="${textColor}" font-size="9" text-anchor="end">1.0</text>
  `;

  semKeys.forEach((sem, idx) => {
    const x = getX(idx);
    svg += `<text x="${x}" y="${padTop + chartH + 16}" fill="${textColor}" font-size="10" text-anchor="middle" font-weight="700">${sem}</text>`;
  });

  if (data.length > 0) {
    let realPath = '';
    let expPath = '';

    data.forEach((d, i) => {
      const semIdx = semKeys.indexOf(d.sem as SemesterKey);
      const x = getX(semIdx);
      const yExp = getY(d.expCgpa);

      if (i === 0) {
        expPath += `M ${x} ${yExp}`;
      } else {
        expPath += ` L ${x} ${yExp}`;
      }

      if (d.realCgpa !== null) {
        const yReal = getY(d.realCgpa);
        if (!realPath) {
          realPath += `M ${x} ${yReal}`;
        } else {
          realPath += ` L ${x} ${yReal}`;
        }
      }
    });

    if (expPath) {
      svg += `<path d="${expPath}" fill="none" stroke="#8b5cf6" stroke-width="2.5" stroke-dasharray="4,4" opacity="0.85" />`;
    }
    if (realPath) {
      svg += `<path d="${realPath}" fill="none" stroke="#10b981" stroke-width="3.5" />`;
    }

    data.forEach(d => {
      const semIdx = semKeys.indexOf(d.sem as SemesterKey);
      const x = getX(semIdx);

      if (d.realCgpa !== null) {
        const yReal = getY(d.realCgpa);
        svg += `<circle cx="${x}" cy="${yReal}" r="4.5" fill="#10b981" stroke="${isDark ? '#111827' : '#ffffff'}" stroke-width="1.5" />`;
        svg += `<text x="${x}" y="${yReal - 8}" fill="${isDark ? '#f8fafc' : '#1e293b'}" font-size="9.5" font-weight="700" text-anchor="middle">${d.realCgpa.toFixed(2)}</text>`;
      }

      if (d.hasExpected) {
        const yExp = getY(d.expCgpa);
        svg += `<circle cx="${x}" cy="${yExp}" r="4" fill="#8b5cf6" />`;
      }
    });
  } else {
    svg += `<text x="${width / 2}" y="${height / 2}" fill="${textColor}" font-size="12" text-anchor="middle">Enter grades to generate your real vs. expected progression curves.</text>`;
  }

  svg += `</svg>`;
  container.innerHTML = svg;
}

// Render Grade Distribution Chart in Progression Tab
export function renderGradeDistribution(): void {
  const container = document.getElementById('gradeDistributionWrapper');
  if (!container) return;

  const counts: Record<string, number> = {
    'A+': 0, 'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'B-': 0,
    'C+': 0, 'C': 0, 'C-': 0, 'D+': 0, 'D': 0, 'E': 0
  };
  let totalGraded = 0;

  (['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'] as SemesterKey[]).forEach(semKey => {
    (STATE.semesters[semKey] || []).forEach(c => {
      if (!c.isNgpa && c.grade && counts[c.grade] !== undefined) {
        counts[c.grade]++;
        totalGraded++;
      }
    });
  });

  if (totalGraded === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 18px; font-size: 0.85rem;">No completed course grades entered yet. Grade distribution will populate automatically.</div>`;
    return;
  }

  const gradesList = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E'];
  const maxCount = Math.max(...Object.values(counts), 1);

  let html = `<div class="grade-distribution-grid">`;
  gradesList.forEach(g => {
    const cnt = counts[g] || 0;
    const barHeightPct = Math.round((cnt / maxCount) * 100);
    const gpv = GRADING_SCALE[g]?.gpv || 0;
    let colorClass = 'bar-pass';
    if (gpv >= 3.7) colorClass = 'bar-gold';
    else if (gpv >= 3.0) colorClass = 'bar-green';
    else if (gpv >= 2.0) colorClass = 'bar-blue';
    else if (gpv >= 1.0) colorClass = 'bar-amber';
    else colorClass = 'bar-red';

    html += `
      <div class="grade-dist-col">
        <span class="dist-count">${cnt > 0 ? cnt : ''}</span>
        <div class="dist-bar-track">
          <div class="dist-bar ${colorClass}" style="height: ${barHeightPct}%;"></div>
        </div>
        <span class="dist-label">${g}</span>
      </div>
    `;
  });
  html += `</div>`;
  html += `
    <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 0.78rem; color: var(--text-secondary); border-top: 1px solid var(--border-color); padding-top: 6px;">
      <span>Total Graded Courses: <strong>${totalGraded}</strong></span>
      <span>Top Tier (A/A+/A-): <strong>${counts['A+'] + counts['A'] + counts['A-']}</strong> (${Math.round(((counts['A+'] + counts['A'] + counts['A-']) / totalGraded) * 100)}%)</span>
    </div>
  `;
  container.innerHTML = html;
}

// Filter semester table rows
export function filterSemesterCourseRows(term: string): void {
  const rows = document.querySelectorAll('#courseTableBody tr');
  rows.forEach(r => {
    const text = (r as HTMLElement).innerText.toLowerCase();
    if (!term || text.includes(term.toLowerCase())) {
      (r as HTMLElement).style.display = '';
    } else {
      (r as HTMLElement).style.display = 'none';
    }
  });
}

// RENDER SEMESTER VIEW (WITH 2-OPTION RESULT STATUS SWITCH BUTTON)
export function renderCurrentSemesterView(): void {
  const tableBody = document.getElementById('courseTableBody');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  if (STATE.currentSemester === 'all') {
    renderAllSemestersView(tableBody);
    return;
  }

  const semList = STATE.semesters[STATE.currentSemester] || [];
  const semStats = calculateSemesterStats(semList);

  const titleEl = document.getElementById('semesterTitle');
  const subtitleEl = document.getElementById('semesterSubtitle');
  const realSgpaEl = document.getElementById('semRealSgpaValue');
  const creditsEl = document.getElementById('semCreditsValue');

  if (titleEl) titleEl.innerText = `Semester ${STATE.currentSemester}`;
  if (subtitleEl) subtitleEl.innerText = `Track real confirmed grades vs. anticipated/expected subject results`;
  if (realSgpaEl) realSgpaEl.innerText = semStats.realSgpa.toFixed(2);
  if (creditsEl) creditsEl.innerText = String(semStats.gpaCreditsAttempted);

  const expStatWrap = document.getElementById('semExpectedStatWrap');
  const expSgpaEl = document.getElementById('semExpectedSgpaValue');
  if (expStatWrap && expSgpaEl) {
    if (semStats.hasExpected) {
      expStatWrap.style.display = 'block';
      expSgpaEl.innerText = semStats.sgpa.toFixed(2);
    } else {
      expStatWrap.style.display = 'none';
    }
  }

  if (semList.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 28px; color: var(--text-muted);">No courses registered in this semester. Click "Add Elective" or "Reset Standard Compulsory" to populate.</td></tr>`;
    return;
  }

  semList.forEach((course, index) => {
    const tr = document.createElement('tr');
    if (course.isExpected) {
      tr.classList.add('row-expected');
    }

    // 1. Course Code badge
    const tdCode = document.createElement('td');
    tdCode.innerHTML = `<span class="code-badge">${course.code}</span><span class="dept-tag">${course.dept}</span>`;

    // 2. Course Title
    const tdName = document.createElement('td');
    tdName.className = 'course-name-cell';
    tdName.innerHTML = `<span class="course-title">${course.name}</span>`;

    // 3. Credits
    const tdCredits = document.createElement('td');
    tdCredits.style.textAlign = 'center';
    tdCredits.innerHTML = `<strong>${course.credits}</strong>`;

    // 4. Type
    const tdType = document.createElement('td');
    if (course.isNgpa) {
      tdType.innerHTML = `<span class="metric-badge badge-slate" title="Excluded from GPA">Non-GPA</span>`;
    } else if (course.isSpecialization) {
      tdType.innerHTML = `<span class="metric-badge badge-gold">Specialization</span>`;
    } else if (course.isCompulsory) {
      tdType.innerHTML = `<span class="metric-badge badge-blue">Compulsory</span>`;
    } else {
      tdType.innerHTML = `<span class="metric-badge badge-emerald">Elective</span>`;
    }

    // 5. Result Status (CLEAR TWO-OPTION SEGMENTED SWITCH BUTTON)
    const tdStatus = document.createElement('td');
    tdStatus.style.textAlign = 'center';
    if (course.isNgpa) {
      tdStatus.innerHTML = `<span style="color: var(--text-muted); font-size: 0.72rem;">Standard</span>`;
    } else {
      const toggleContainer = document.createElement('div');
      toggleContainer.className = 'result-status-toggle';
      toggleContainer.setAttribute('role', 'group');
      toggleContainer.setAttribute('aria-label', `Result status for ${course.code}`);

      // Real Option Button
      const btnReal = document.createElement('button');
      btnReal.type = 'button';
      btnReal.className = 'status-toggle-btn status-real' + (!course.isExpected ? ' active' : '');
      btnReal.innerHTML = `<span class="status-dot"></span>Real`;
      btnReal.title = 'Confirmed Final Grade (Officially released by faculty)';
      btnReal.addEventListener('click', (e) => {
        e.stopPropagation();
        if (course.isExpected) {
          course.isExpected = false;
          saveState();
          renderAll();
        }
      });

      // Expected Option Button
      const btnExpected = document.createElement('button');
      btnExpected.type = 'button';
      btnExpected.className = 'status-toggle-btn status-expected' + (course.isExpected ? ' active' : '');
      btnExpected.innerHTML = `<span class="status-sparkle">✨</span>Expected`;
      btnExpected.title = 'Anticipated / Expected Mark (Provisional scenario planning)';
      btnExpected.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!course.isExpected) {
          course.isExpected = true;
          saveState();
          renderAll();
        }
      });

      toggleContainer.appendChild(btnReal);
      toggleContainer.appendChild(btnExpected);
      tdStatus.appendChild(toggleContainer);
    }

    // 6. Grade selector (with keyboard fast select)
    const tdGrade = document.createElement('td');
    const select = document.createElement('select');
    select.className = 'grade-select';
    select.innerHTML = `
      <option value="">--</option>
      <option value="A+">A+ (4.0)</option>
      <option value="A">A (4.0)</option>
      <option value="A-">A- (3.7)</option>
      <option value="B+">B+ (3.3)</option>
      <option value="B">B (3.0)</option>
      <option value="B-">B- (2.7)</option>
      <option value="C+">C+ (2.3)</option>
      <option value="C">C (2.0)</option>
      <option value="C-">C- (1.7)</option>
      <option value="D+">D+ (1.3)</option>
      <option value="D">D (1.0)</option>
      <option value="E">E (0.0)</option>
    `;
    select.value = course.grade || '';
    select.addEventListener('change', (e) => {
      course.grade = (e.target as HTMLSelectElement).value as Grade;
      saveState();
      renderAll();
    });

    // Keyboard rapid navigation on grade dropdown
    select.addEventListener('keydown', (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D', 'E'].includes(key)) {
        e.preventDefault();
        const currentVal = select.value;
        const optionsForLetter: Record<string, Grade[]> = {
          'A': ['A+', 'A', 'A-'],
          'B': ['B+', 'B', 'B-'],
          'C': ['C+', 'C', 'C-'],
          'D': ['D+', 'D'],
          'E': ['E']
        };
        const list = optionsForLetter[key];
        const nextIndex = (list.indexOf(currentVal as Grade) + 1) % list.length;
        const nextGrade = list[nextIndex] || list[0];
        select.value = nextGrade;
        course.grade = nextGrade;
        saveState();
        renderAll();
      }
    });

    tdGrade.appendChild(select);

    // 7. Repeat checkbox
    const tdRepeat = document.createElement('td');
    if (!course.isNgpa) {
      const repeatGroup = document.createElement('div');
      repeatGroup.className = 'repeat-toggle-group';

      const repeatLabel = document.createElement('label');
      repeatLabel.className = 'repeat-checkbox-label' + (course.isRepeat ? ' active' : '');
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.checked = !!course.isRepeat;
      chk.addEventListener('change', (e) => {
        course.isRepeat = (e.target as HTMLInputElement).checked;
        saveState();
        renderAll();
      });
      repeatLabel.appendChild(chk);
      repeatLabel.appendChild(document.createTextNode(course.isRepeat ? ' Repeat (Cap C)' : ' Repeat'));
      repeatGroup.appendChild(repeatLabel);

      if (course.isRepeat) {
        const excuseLabel = document.createElement('label');
        excuseLabel.className = 'repeat-checkbox-label';
        excuseLabel.style.fontSize = '0.7rem';
        const exChk = document.createElement('input');
        exChk.type = 'checkbox';
        exChk.checked = !!course.isExcused;
        exChk.addEventListener('change', (e) => {
          course.isExcused = (e.target as HTMLInputElement).checked;
          saveState();
          renderAll();
        });
        excuseLabel.appendChild(exChk);
        excuseLabel.appendChild(document.createTextNode(' Medical/Excuse'));
        repeatGroup.appendChild(excuseLabel);
      }
      tdRepeat.appendChild(repeatGroup);
    } else {
      tdRepeat.innerHTML = `<span style="color: var(--text-muted); font-size: 0.75rem;">N/A</span>`;
    }

    // 8. GPV display
    const tdGpv = document.createElement('td');
    tdGpv.style.textAlign = 'center';
    const gpv = calculateCourseGpv(course);
    tdGpv.innerHTML = course.isNgpa
      ? `<span style="color: var(--text-muted);">NGPA</span>`
      : (gpv !== null ? `<strong>${gpv.toFixed(1)}</strong>` : `—`);

    // 9. Weighted points
    const tdPoints = document.createElement('td');
    tdPoints.style.textAlign = 'right';
    if (course.isNgpa || gpv === null) {
      tdPoints.innerText = '—';
    } else {
      const pts = (Number(course.credits) || 0) * gpv;
      tdPoints.innerHTML = `<strong>${pts.toFixed(1)}</strong>`;
    }

    // 10. Action (delete)
    const tdAction = document.createElement('td');
    tdAction.style.textAlign = 'center';
    if (!course.isCompulsory && !course.isSpecialization) {
      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-danger-outline';
      delBtn.style.padding = '4px 8px';
      delBtn.style.fontSize = '0.75rem';
      delBtn.innerHTML = '🗑️';
      delBtn.title = 'Remove elective course';
      delBtn.addEventListener('click', () => {
        semList.splice(index, 1);
        saveState();
        renderAll();
      });
      tdAction.appendChild(delBtn);
    } else {
      tdAction.innerHTML = `<span style="color: var(--text-muted); font-size: 0.75rem;">Req</span>`;
    }

    tr.appendChild(tdCode);
    tr.appendChild(tdName);
    tr.appendChild(tdCredits);
    tr.appendChild(tdType);
    tr.appendChild(tdStatus);
    tr.appendChild(tdGrade);
    tr.appendChild(tdRepeat);
    tr.appendChild(tdGpv);
    tr.appendChild(tdPoints);
    tr.appendChild(tdAction);

    tableBody.appendChild(tr);
  });
}

// Cumulative All Semesters View
export function renderAllSemestersView(tableBody: HTMLElement): void {
  const titleEl = document.getElementById('semesterTitle');
  const subtitleEl = document.getElementById('semesterSubtitle');
  if (titleEl) titleEl.innerText = 'All Semesters Overview (Cumulative)';
  if (subtitleEl) subtitleEl.innerText = 'Complete academic history across all 8 semesters';

  const stats = calculateOverallStats();
  const realSgpaEl = document.getElementById('semRealSgpaValue');
  const creditsEl = document.getElementById('semCreditsValue');
  if (realSgpaEl) realSgpaEl.innerText = stats.realCgpa.toFixed(2);
  if (creditsEl) creditsEl.innerText = String(stats.totalGpaCreditsAttempted);

  const expStatWrap = document.getElementById('semExpectedStatWrap');
  const expSgpaEl = document.getElementById('semExpectedSgpaValue');
  if (expStatWrap && expSgpaEl) {
    if (stats.hasExpectedCourses) {
      expStatWrap.style.display = 'block';
      expSgpaEl.innerText = stats.cgpa.toFixed(2);
    } else {
      expStatWrap.style.display = 'none';
    }
  }

  (['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'] as SemesterKey[]).forEach(semKey => {
    const semList = STATE.semesters[semKey] || [];
    if (semList.length === 0) return;

    const semStats = stats.semStats[semKey];

    const headerRow = document.createElement('tr');
    headerRow.style.backgroundColor = document.body.classList.contains('dark-mode') ? '#1e293b' : '#f1f5f9';
    headerRow.innerHTML = `
      <td colspan="10" style="padding: 10px 14px; font-weight: 700; color: var(--primary-accent);">
        Semester ${semKey} — Real SGPA: ${semStats.realSgpa.toFixed(2)} ${semStats.hasExpected ? '| Expected SGPA: ' + semStats.sgpa.toFixed(2) : ''} (${semStats.gpaCreditsAttempted} GPA Credits)
      </td>
    `;
    tableBody.appendChild(headerRow);

    semList.forEach(course => {
      const tr = document.createElement('tr');
      if (course.isExpected) tr.classList.add('row-expected');

      const gpv = calculateCourseGpv(course);
      const pts = (gpv !== null && !course.isNgpa) ? (Number(course.credits) * gpv).toFixed(1) : '—';

      tr.innerHTML = `
        <td><span class="code-badge">${course.code}</span><span class="dept-tag">${course.dept}</span></td>
        <td><span class="course-title">${course.name}</span></td>
        <td style="text-align: center;">${course.credits}</td>
        <td>${course.isNgpa ? '<span class="metric-badge badge-slate">NGPA</span>' : (course.isCompulsory ? '<span class="metric-badge badge-blue">Compulsory</span>' : '<span class="metric-badge badge-emerald">Elective</span>')}</td>
        <td style="text-align: center;">${course.isExpected ? '<span class="status-toggle-btn status-expected active" style="pointer-events:none;"><span class="status-sparkle">✨</span>Expected</span>' : '<span class="status-toggle-btn status-real active" style="pointer-events:none;"><span class="status-dot"></span>Real</span>'}</td>
        <td><strong>${course.grade || '<span style="color: var(--text-muted);">--</span>'}</strong></td>
        <td>${course.isRepeat ? '<span class="metric-badge badge-rose">Repeat</span>' : '—'}</td>
        <td style="text-align: center;">${course.isNgpa ? 'NGPA' : (gpv !== null ? gpv.toFixed(1) : '—')}</td>
        <td style="text-align: right;">${pts}</td>
        <td style="text-align: center;">—</td>
      `;
      tableBody.appendChild(tr);
    });
  });
}

// Bulk Quick-Fill actions for current semester
export function bulkFillSemesterGrades(targetGrade: Grade): void {
  if (STATE.currentSemester === 'all') {
    showToast('Please select a specific semester to fill grades.');
    return;
  }
  const semList = STATE.semesters[STATE.currentSemester] || [];
  let filledCount = 0;
  semList.forEach(c => {
    if (!c.isNgpa && !c.grade) {
      c.grade = targetGrade;
      c.isExpected = true; // Default bulk-filled hypothetical grades to Expected
      filledCount++;
    }
  });
  saveState();
  renderAll();
  showToast(`✔ Filled ${filledCount} unfinalized course(s) with ${targetGrade} (✨ Expected)`);
}

export function bulkToggleSemesterExpected(setExpected: boolean): void {
  if (STATE.currentSemester === 'all') {
    showToast('Please select a specific semester.');
    return;
  }
  const semList = STATE.semesters[STATE.currentSemester] || [];
  semList.forEach(c => {
    if (!c.isNgpa) {
      c.isExpected = setExpected;
    }
  });
  saveState();
  renderAll();
  showToast(setExpected ? '✨ Marked all semester courses as Expected' : '🟢 Marked all semester courses as Real Confirmed');
}

export function clearCurrentSemesterGrades(): void {
  if (STATE.currentSemester === 'all') {
    showToast('Select a specific semester to clear.');
    return;
  }
  if (!confirm(`Are you sure you want to clear all entered grades for Semester ${STATE.currentSemester}?`)) {
    return;
  }
  const semList = STATE.semesters[STATE.currentSemester] || [];
  semList.forEach(c => {
    c.grade = '';
    c.isExpected = false;
    c.isRepeat = false;
    c.isExcused = false;
  });
  saveState();
  renderAll();
  showToast(`Semester ${STATE.currentSemester} grades cleared`);
}

// WHAT-IF SIMULATOR
export function renderWhatIfSimulator(): void {
  const select = document.getElementById('whatIfGradeSelect') as HTMLSelectElement | null;
  const container = document.getElementById('whatIfResultBox');
  if (!select || !container) return;

  const simGpv = parseFloat(select.value) || 3.70;
  const result = simulateGpaProjection(simGpv);

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="font-size: 0.82rem; color: var(--text-secondary);">Projected Final CGPA:</span>
      <span style="font-size: 1.4rem; font-weight: 800; color: var(--primary-accent);">${result.projectedCgpa.toFixed(2)}</span>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="font-size: 0.82rem; color: var(--text-secondary);">Honours Classification:</span>
      <span class="metric-badge badge-${result.standingColor}">${result.projectedStanding}</span>
    </div>
    <div style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.4; border-top: 1px solid var(--border-color); padding-top: 6px;">
      Simulated across your remaining <strong>${result.remainingCredits} credits</strong>. Projected CGPA delta:
      <strong style="color: ${result.deltaCgpa >= 0 ? 'var(--success)' : 'var(--danger)'};">
        ${result.deltaCgpa >= 0 ? '+' : ''}${result.deltaCgpa.toFixed(2)}
      </strong>
    </div>
  `;
}

// TARGET GPA PLANNER (WITH CONCRETE GRADE COMBINATIONS)
export function renderTargetPlannerResult(targetGpa: number): void {
  const container = document.getElementById('targetGpaResultBox');
  if (!container) return;

  const result = calculateTargetGpa(targetGpa);

  if (!result.possible) {
    container.innerHTML = `
      <div style="padding: 10px; border-radius: var(--radius-sm); font-size: 0.82rem; background: rgba(239, 68, 68, 0.12); color: var(--danger); line-height: 1.4;">
        ⚠️ ${result.message}
      </div>
    `;
    return;
  }

  let combinationsHtml = '';
  if (result.combinations && result.combinations.length > 0) {
    combinationsHtml += `
      <div style="margin-top: 12px; border-top: 1px dashed var(--border-color); padding-top: 10px;">
        <span style="font-size: 0.76rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted);">Recommended Grade Combinations:</span>
        <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px;">
    `;
    result.combinations.forEach((c, idx) => {
      let badgeClass = 'badge-blue';
      if (c.difficulty === 'Very High' || c.difficulty === 'Demanding') badgeClass = 'badge-gold';
      else if (c.difficulty === 'Achievable') badgeClass = 'badge-emerald';

      combinationsHtml += `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 6px 10px; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 0.8rem;">
            <strong>Option ${idx + 1}:</strong> ${c.summary}
          </div>
          <span class="metric-badge ${badgeClass}" style="font-size: 0.7rem;">${c.difficulty}</span>
        </div>
      `;
    });
    combinationsHtml += `</div></div>`;
  }

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="font-size: 0.82rem; color: var(--text-secondary);">Required Average SGPA:</span>
      <span style="font-size: 1.4rem; font-weight: 800; color: var(--primary-accent);">${result.requiredAverageGpa?.toFixed(2)}</span>
    </div>
    <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">
      ${result.message}
    </div>
    ${combinationsHtml}
  `;
}

// REPEAT GRADE UPGRADE PLANNER
export function populateRepeatCoursesDropdown(): void {
  const select = document.getElementById('repeatCourseSelect') as HTMLSelectElement | null;
  if (!select) return;
  select.innerHTML = '';

  const foundCourses: Course[] = [];
  (['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'] as SemesterKey[]).forEach(sem => {
    (STATE.semesters[sem] || []).forEach(c => {
      if (!c.isNgpa && c.grade) {
        foundCourses.push(c);
      }
    });
  });

  if (foundCourses.length === 0) {
    select.innerHTML = '<option value="">No completed graded courses found</option>';
    return;
  }

  foundCourses.sort((a, b) => {
    const gpvA = GRADING_SCALE[a.grade || '']?.gpv || 0;
    const gpvB = GRADING_SCALE[b.grade || '']?.gpv || 0;
    return gpvA - gpvB;
  });

  foundCourses.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.code;
    opt.innerText = `${c.code} - ${c.name} (${c.credits} Cr) [Current: ${c.grade}]`;
    select.appendChild(opt);
  });

  updateRepeatImpactDisplay();
}

export function updateRepeatImpactDisplay(): void {
  const code = (document.getElementById('repeatCourseSelect') as HTMLSelectElement)?.value;
  const targetGrade = (document.getElementById('repeatTargetGradeSelect') as HTMLSelectElement)?.value as Grade;
  const isExcused = (document.getElementById('repeatExcusedCheck') as HTMLInputElement)?.checked || false;
  const container = document.getElementById('repeatResultBox');
  if (!container || !code) return;

  const res = calculateRepeatImpact(code, targetGrade, isExcused);
  if (!res) {
    container.innerHTML = 'Select a valid graded course to preview impact.';
    return;
  }

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <span>Grade Upgrade:</span>
      <strong>${res.oldGrade} (${res.oldGpv.toFixed(1)}) → ${res.targetGrade} (${res.newGpv.toFixed(1)}${!isExcused && res.newGpv > 2.0 ? ' Capped at 2.0' : ''})</strong>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <span>Net Points Gained:</span>
      <span style="font-weight: 700; color: ${res.deltaPoints > 0 ? 'var(--success)' : 'var(--text-muted)'};">
        ${res.deltaPoints > 0 ? '+' : ''}${res.deltaPoints.toFixed(1)} Points
      </span>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <span>CGPA Projection:</span>
      <strong>${res.currentCgpa.toFixed(2)} → <span style="color: var(--primary-accent); font-size: 1.05rem;">${res.projectedCgpa.toFixed(2)}</span> (${res.deltaCgpa >= 0 ? '+' : ''}${res.deltaCgpa.toFixed(2)})</strong>
    </div>
    <div style="padding: 6px 8px; border-radius: var(--radius-sm); font-size: 0.78rem; background: ${res.classChanged ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-main)'};">
      ${res.classChanged ? `🎉 <strong>Class Standing Upgraded:</strong> ${res.oldStanding} → <strong>${res.newStanding}</strong>!` : `Class Standing: ${res.newStanding}`}
    </div>
  `;
}

// GRADUATION AUDIT CHECKLIST
export function renderGraduationAudit(): void {
  const container = document.getElementById('auditChecklistContainer');
  if (!container) return;

  const audit = checkDegreeConfermentAudit();
  container.innerHTML = `
    <div style="padding: 8px 10px; border-radius: var(--radius-sm); margin-bottom: 8px; font-weight: 700; font-size: 0.82rem; background: ${audit.allPassed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'}; color: ${audit.allPassed ? 'var(--success)' : 'var(--warning)'};">
      ${audit.allPassed ? '✅ All Degree Conferment Requirements Satisfied!' : '⚠️ Requirements In Progress / Pending'}
    </div>
  `;

  audit.items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'audit-item ' + (item.passed ? 'audit-passed' : 'audit-pending');
    div.innerHTML = `
      <div>
        <strong>${item.title}</strong>
        <div style="font-size: 0.75rem; color: var(--text-secondary);">${item.current} (${item.requirement})</div>
      </div>
      <span style="font-weight: 800; font-size: 0.95rem;">${item.passed ? '✓' : '✗'}</span>
    `;
    container.appendChild(div);
  });
}

// ACADEMIC RISK & REGULATION ALERTS
export function renderAcademicRiskAlerts(): void {
  const container = document.getElementById('academicRiskAlertsContainer');
  if (!container) return;

  const alerts = calculateAcademicRiskAlerts();
  container.innerHTML = '';

  alerts.forEach(alert => {
    const div = document.createElement('div');
    div.className = `alert-card alert-${alert.level}`;
    let icon = 'ℹ️';
    if (alert.level === 'danger') icon = '🚨';
    else if (alert.level === 'warning') icon = '⚠️';
    else if (alert.level === 'success') icon = '🌟';

    div.innerHTML = `
      <div style="display: flex; gap: 8px; align-items: flex-start;">
        <span style="font-size: 1.1rem; line-height: 1;">${icon}</span>
        <div>
          <div style="font-weight: 700; font-size: 0.82rem; margin-bottom: 2px;">${alert.title}</div>
          <div style="font-size: 0.76rem; line-height: 1.4;">${alert.message}</div>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

// DEAN'S HONORS
export function renderDeansHonors(): void {
  const stats = calculateOverallStats();
  const container = document.getElementById('deansHonorListContainer');
  if (!container) return;
  container.innerHTML = '';

  [1, 2, 3, 4].forEach(yr => {
    const item = stats.deansHonors[yr];
    const row = document.createElement('div');
    row.className = 'deans-year-row';

    let badgeClass = 'badge-slate';
    let badgeText = item.status;
    if (item.eligible) {
      badgeClass = 'badge-gold';
      badgeText = 'Eligible 🏅';
    } else if (item.status.includes('Pending')) {
      badgeClass = 'badge-blue';
      badgeText = 'In Progress';
    } else {
      badgeClass = 'badge-rose';
      badgeText = 'Not Eligible';
    }

    row.innerHTML = `
      <div class="deans-year-label">
        <strong>Year ${yr}</strong>
        <div style="font-size: 0.76rem; color: var(--text-muted);">${item.annualGpa > 0 ? 'Annual GPA: ' + item.annualGpa.toFixed(2) : 'No finalized grades'}</div>
      </div>
      <div>
        <span class="metric-badge ${badgeClass}">${badgeText}</span>
      </div>
    `;
    container.appendChild(row);
  });
}

// SPECIALIZATION ADVISOR (WITH ELECTIVE PROGRESS BAR)
export function renderSpecializationAdvisor(): void {
  const stats = calculateOverallStats();
  const container = document.getElementById('specializationAdvisorContent');
  if (!container) return;

  const spec = stats.specEligibility;
  const ratioPct = Math.round(spec.ratio * 100);

  container.innerHTML = `
    <div style="margin-bottom: 6px;">
      <strong>Chosen Field:</strong> ${DEPARTMENTS[spec.chosenDept] || spec.chosenDept}
    </div>
    <div style="margin-bottom: 6px;">
      <strong>End of 3-1 Cumulative GPA:</strong>
      <span style="font-weight: 700; color: ${spec.gpaMet ? 'var(--success)' : 'var(--danger)'};">
        ${spec.gpa31.toFixed(2)}
      </span> (Minimum 2.70 required)
    </div>
    <div style="margin-bottom: 8px;">
      <strong>3rd Year Departmental Elective Progress:</strong>
      <span style="font-weight: 700; color: ${spec.electiveRatioMet ? 'var(--success)' : 'var(--warning)'};">
        ${ratioPct}%
      </span> (${spec.electiveDeptCredits} out of ${spec.totalYear3ElectiveCredits} credits in ${spec.chosenDept})
      <div class="progress-bar-container" style="margin-top: 4px; height: 6px;">
        <div class="progress-bar-fill" style="width: ${Math.min(100, ratioPct)}%; background: ${spec.electiveRatioMet ? 'var(--success)' : 'var(--warning)'};"></div>
      </div>
    </div>
    <div style="padding: 8px 10px; border-radius: var(--radius-sm); font-size: 0.8rem; background: ${spec.gpaMet && spec.electiveRatioMet ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.1)'}; color: ${spec.gpaMet && spec.electiveRatioMet ? 'var(--success)' : 'var(--danger)'};">
      ${spec.statusText}
    </div>
  `;
}

// COMPULSORY NON-GPA LIST
export function renderNgpaList(): void {
  const container = document.getElementById('ngpaCoursesList');
  if (!container) return;
  container.innerHTML = '';

  const items = [...STATE.orientationCourses];
  (['1-1', '1-2'] as SemesterKey[]).forEach(sem => {
    (STATE.semesters[sem] || []).forEach(c => {
      if (c.isNgpa) items.push(c);
    });
  });

  items.forEach(c => {
    const gpv = GRADING_SCALE[c.grade || '']?.gpv || 0;
    const passed = c.grade && gpv >= 1.7;
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.padding = '4px 0';
    div.style.borderBottom = '1px solid var(--border-color)';
    div.innerHTML = `
      <span><code>${c.code}</code> ${c.name}</span>
      <span style="font-weight: 700; color: ${passed ? 'var(--success)' : 'var(--danger)'};">
        ${c.grade || 'Pending'} ${passed ? '✓' : '✗'}
      </span>
    `;
    container.appendChild(div);
  });
}

// ELECTIVE CATALOG MODAL
export function renderElectiveCatalog(): void {
  const container = document.getElementById('electiveCoursesListContainer');
  const searchInput = document.getElementById('electiveSearchInput') as HTMLInputElement | null;
  const search = (searchInput?.value || '').toLowerCase();
  if (!container) return;
  container.innerHTML = '';

  const currentSem = STATE.currentSemester;
  const registeredCodes = (STATE.semesters[currentSem] || []).map(c => c.code);

  const matchingCourses: any[] = [];
  Object.keys(COURSE_CATALOG).forEach(code => {
    const c = COURSE_CATALOG[code];
    if (c.semester === currentSem && !c.isCompulsory) {
      if (!search || c.code.toLowerCase().includes(search) || c.name.toLowerCase().includes(search) || c.dept.toLowerCase().includes(search)) {
        matchingCourses.push(c);
      }
    }
  });

  if (matchingCourses.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted);">No matching elective courses found for Semester ${currentSem}.</div>`;
    return;
  }

  matchingCourses.forEach(course => {
    const item = document.createElement('div');
    item.className = 'elective-item';
    const alreadyAdded = registeredCodes.includes(course.code);

    item.innerHTML = `
      <div>
        <span class="code-badge">${course.code}</span>
        <span style="font-weight: 600; margin-left: 6px;">${course.name}</span>
        <span style="color: var(--text-muted); font-size: 0.78rem;">(${course.credits} Credits • ${course.dept})</span>
      </div>
      <button class="btn btn-primary" style="padding: 4px 10px; font-size: 0.78rem;" ${alreadyAdded ? 'disabled' : ''}>
        ${alreadyAdded ? 'Added' : '+ Add'}
      </button>
    `;

    if (!alreadyAdded) {
      item.querySelector('button')?.addEventListener('click', () => {
        STATE.semesters[currentSem].push({
          code: course.code,
          name: course.name,
          credits: course.credits,
          dept: course.dept,
          isNgpa: !!course.isNgpa,
          isCompulsory: false,
          grade: '',
          isRepeat: false,
          isExcused: false,
          isExpected: false
        });
        saveState();
        renderAll();
        renderElectiveCatalog();
      });
    }

    container.appendChild(item);
  });
}

// Master Render All function
export function renderAll(): void {
  renderProfileHeader();
  renderPrintHeader();
  renderDegreeButtons();
  renderTabs();
  renderSummaryCards();
  renderCurrentSemesterView();
  renderGpaTrendChart();
  renderGradeDistribution();
  populateRepeatCoursesDropdown();
  renderGraduationAudit();
  renderAcademicRiskAlerts();
  renderDeansHonors();
  renderSpecializationAdvisor();
  renderNgpaList();
}

// Register Service Worker for PWA
export function registerPwaServiceWorker(): void {
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').then(() => {
      console.log('AgriGPA Service Worker registered for offline use.');
    }).catch(err => {
      console.log('Service Worker registration skipped or failed:', err);
    });
  }
}

// Global Keyboard Navigation & Shortcut Handler
export function initKeyboardShortcuts(): void {
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    // Only process shortcuts when not typing in text input/textarea
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'textarea') return;

    if (e.altKey) {
      // Alt+1 to Alt+8: Switch Semesters
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 8) {
        e.preventDefault();
        const semKeys: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
        const targetSem = semKeys[num - 1];
        if (targetSem) {
          STATE.currentSemester = targetSem;
          saveState();
          renderAll();
          showToast(`Switched to Semester ${targetSem}`);
        }
      } else if (e.key === '0') {
        e.preventDefault();
        STATE.currentSemester = 'all';
        saveState();
        renderAll();
        showToast('Switched to All Semesters Overview');
      } else if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        (document.querySelector('#mainNavSwitcher [data-view="advisor"]') as HTMLElement)?.click();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        (document.querySelector('#mainNavSwitcher [data-view="workspace"]') as HTMLElement)?.click();
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        (document.querySelector('#mainNavSwitcher [data-view="analytics"]') as HTMLElement)?.click();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copyToClipboard(generateAcademicSummaryCardText(), 'Academic performance card copied to clipboard!');
      }
    }
  });
}

// ==========================================
// DOM INITIALIZATION & EVENT LISTENERS
// ==========================================

export function initApp(): void {
  initTheme();
  checkFirstTimeOnboarding();

  if (!loadState()) {
    STATE.semesters = initDefaultCoursesForDegree(STATE.degree);
  }

  renderAll();
  registerPwaServiceWorker();
  initKeyboardShortcuts();

  // View Switcher (Workspace / Advisor / Analytics)
  function switchMainView(viewName: string) {
    document.querySelectorAll('#mainNavSwitcher .nav-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-view') === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    document.querySelectorAll('.view-panel').forEach(p => ((p as HTMLElement).style.display = 'none'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.style.display = 'block';
      if (viewName === 'analytics') {
        renderGpaTrendChart();
        renderGradeDistribution();
      } else if (viewName === 'advisor') {
        const activeToolBtn = document.querySelector('.tool-tab-btn.active');
        const tool = activeToolBtn ? activeToolBtn.getAttribute('data-tool') : 'planner';
        if (tool === 'whatif') renderWhatIfSimulator();
        if (tool === 'repeat') {
          populateRepeatCoursesDropdown();
          updateRepeatImpactDisplay();
        }
        if (tool === 'audit') renderGraduationAudit();
        renderAcademicRiskAlerts();
      }
    }
  }

  document.querySelectorAll('#mainNavSwitcher .nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchMainView(btn.getAttribute('data-view') || 'workspace');
    });
  });

  const btnGoToAdvisor = document.getElementById('btnGoToAdvisor');
  if (btnGoToAdvisor) {
    btnGoToAdvisor.addEventListener('click', () => switchMainView('advisor'));
  }

  // More Actions Dropdown Menu
  const btnMoreMenu = document.getElementById('btnMoreMenu');
  const moreDropdown = document.getElementById('moreDropdown');
  if (btnMoreMenu && moreDropdown) {
    btnMoreMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      moreDropdown.classList.toggle('show');
    });
    document.addEventListener('click', (e) => {
      const wrapper = document.getElementById('moreMenuWrapper');
      if (wrapper && !wrapper.contains(e.target as Node)) {
        moreDropdown.classList.remove('show');
      }
    });
    document.querySelectorAll('.more-dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        moreDropdown.classList.remove('show');
      });
    });
  }

  // Copy shareable summary card
  const btnCopySummaryCard = document.getElementById('btnCopySummaryCard');
  if (btnCopySummaryCard) {
    btnCopySummaryCard.addEventListener('click', () => {
      copyToClipboard(generateAcademicSummaryCardText(), 'Academic performance summary copied to clipboard!');
    });
  }

  // Theme toggle button
  document.getElementById('btnThemeToggle')?.addEventListener('click', toggleTheme);

  // Onboarding option buttons
  document.querySelectorAll('.onboarding-opt-btn').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.onboarding-opt-btn').forEach(b => b.classList.remove('active'));
      opt.classList.add('active');
      const deg = opt.getAttribute('data-deg') as DegreeCode;
      const onboardSpec = document.getElementById('onboardSpecGroup');
      if (onboardSpec) onboardSpec.style.display = (deg === 'GT') ? 'none' : 'block';
    });
  });

  document.getElementById('btnCompleteOnboarding')?.addEventListener('click', () => {
    const name = (document.getElementById('onboardName') as HTMLInputElement)?.value.trim() || 'Student';
    const indexNumber = (document.getElementById('onboardIndex') as HTMLInputElement)?.value.trim() || '0000';
    const activeDegreeBtn = document.querySelector('.onboarding-opt-btn.active');
    const degree = (activeDegreeBtn ? activeDegreeBtn.getAttribute('data-deg') : 'ARMT') as DegreeCode;
    const specDept = (document.getElementById('onboardSpec') as HTMLSelectElement)?.value || 'CS';

    updateProfileMetadata(name, indexNumber, degree);
    STATE.specializationDept = specDept;
    saveState();
    localStorage.setItem(ONBOARDING_KEY, 'true');
    document.getElementById('onboardingModal')?.classList.remove('show');
    renderAll();
  });

  // Profile Dropdown Toggle
  const profilePillBtn = document.getElementById('profilePillBtn');
  const profileDropdown = document.getElementById('profileDropdown');
  if (profilePillBtn && profileDropdown) {
    profilePillBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('show');
    });
    document.addEventListener('click', (e) => {
      const wrapper = document.getElementById('profilePillWrapper');
      if (wrapper && !wrapper.contains(e.target as Node)) {
        profileDropdown.classList.remove('show');
      }
    });
  }

  // Profile Modal Actions
  document.getElementById('btnOpenNewProfileModal')?.addEventListener('click', () => {
    isEditingProfile = false;
    (document.getElementById('profileModalTitle') as HTMLElement).innerText = 'Create New Student Profile';
    (document.getElementById('profileModalName') as HTMLInputElement).value = '';
    (document.getElementById('profileModalIndex') as HTMLInputElement).value = '';
    (document.getElementById('profileModalDegree') as HTMLSelectElement).value = 'ARMT';
    document.getElementById('profileModal')?.classList.add('show');
    document.getElementById('profileDropdown')?.classList.remove('show');
  });

  document.getElementById('btnEditProfileModal')?.addEventListener('click', () => {
    isEditingProfile = true;
    (document.getElementById('profileModalTitle') as HTMLElement).innerText = 'Edit Active Student Profile';
    (document.getElementById('profileModalName') as HTMLInputElement).value = STATE.name;
    (document.getElementById('profileModalIndex') as HTMLInputElement).value = STATE.indexNumber;
    (document.getElementById('profileModalDegree') as HTMLSelectElement).value = STATE.degree;
    document.getElementById('profileModal')?.classList.add('show');
    document.getElementById('profileDropdown')?.classList.remove('show');
  });

  document.getElementById('btnCloneProfile')?.addEventListener('click', () => {
    const cloneName = prompt('Enter a name for the duplicated profile:', `${STATE.name} (Scenario)`);
    if (cloneName) {
      cloneActiveProfile(cloneName);
      renderAll();
      document.getElementById('profileDropdown')?.classList.remove('show');
      showToast(`Profile cloned: ${cloneName}`);
    }
  });

  document.getElementById('btnDeleteCurrentProfile')?.addEventListener('click', () => {
    if (confirm(`Are you sure you want to delete profile "${STATE.name}"?`)) {
      const res = deleteProfile(STATE.id);
      if (!res.success) {
        alert(res.message || 'Cannot delete profile.');
      } else {
        renderAll();
        document.getElementById('profileDropdown')?.classList.remove('show');
        showToast('Profile deleted');
      }
    }
  });

  document.getElementById('btnSaveProfileModal')?.addEventListener('click', () => {
    const name = (document.getElementById('profileModalName') as HTMLInputElement).value.trim();
    const indexNumber = (document.getElementById('profileModalIndex') as HTMLInputElement).value.trim();
    const degree = (document.getElementById('profileModalDegree') as HTMLSelectElement).value as DegreeCode;

    if (!name) {
      alert('Please enter a student name.');
      return;
    }

    if (isEditingProfile) {
      updateProfileMetadata(name, indexNumber, degree);
    } else {
      createNewProfile(name, indexNumber, degree);
    }

    document.getElementById('profileModal')?.classList.remove('show');
    renderAll();
  });

  // Export Transcript CSV
  document.getElementById('btnExportCsv')?.addEventListener('click', () => {
    const csv = exportTranscriptCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ruhuna_Agri_Transcript_${STATE.indexNumber || 'Student'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Transcript exported as CSV');
  });

  // Backup / Restore JSON
  document.getElementById('btnBackupRestore')?.addEventListener('click', () => {
    const choice = confirm('Click "OK" to DOWNLOAD backup JSON.\nClick "Cancel" to RESTORE/IMPORT from file.');
    if (choice) {
      const json = exportAllProfilesJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Ruhuna_Agri_Profiles_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Profile backup downloaded');
    } else {
      document.getElementById('jsonFileInput')?.click();
    }
  });

  document.getElementById('jsonFileInput')?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const res = importProfileJson(content);
        if (res.success) {
          alert(`Successfully imported profile data!`);
          renderAll();
        } else {
          alert(`Import failed: ${res.message}`);
        }
      };
      reader.readAsText(file);
    }
  });

  // Degree Switcher Buttons
  document.querySelectorAll('#degreeBtnGroup .degree-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const deg = (e.target as HTMLElement).getAttribute('data-degree') as DegreeCode;
      if (deg && deg !== STATE.degree) {
        if (confirm(`Switch to ${deg}? Standard semester courses will be re-initialized for ${deg}.`)) {
          STATE.degree = deg;
          STATE.semesters = initDefaultCoursesForDegree(deg);
          saveState();
          renderAll();
        }
      }
    });
  });

  // Specialization Stream Dropdown
  const specSelect = document.getElementById('specDeptSelect');
  if (specSelect) {
    specSelect.addEventListener('change', (e) => {
      const dept = (e.target as HTMLSelectElement).value;
      STATE.specializationDept = dept;
      const spec = SPECIALIZATION_STREAMS[dept];
      STATE.specializationResearch = spec?.researchCode || 'CS42601';

      if (STATE.semesters['4-1']) {
        STATE.semesters['4-1'] = STATE.semesters['4-1'].filter(c => !c.isSpecialization);
        if (spec && spec.courses) {
          spec.courses.forEach(code => {
            const info = COURSE_CATALOG[code] || { code, name: code, credits: 2, dept: spec.dept };
            STATE.semesters['4-1'].push({
              code: info.code,
              name: info.name,
              credits: info.credits,
              dept: spec.dept,
              isNgpa: false,
              isCompulsory: true,
              isSpecialization: true,
              grade: '',
              isRepeat: false,
              isExcused: false,
              isExpected: false
            });
          });
        }
      }

      if (STATE.semesters['4-2']) {
        const resCode = spec?.researchCode || 'CS42601';
        const resInfo = COURSE_CATALOG[resCode] || { code: resCode, name: 'Research Project', credits: 6, dept };
        STATE.semesters['4-2'] = STATE.semesters['4-2'].filter(c => Number(c.credits) !== 6);
        STATE.semesters['4-2'].unshift({
          code: resInfo.code,
          name: resInfo.name,
          credits: resInfo.credits,
          dept: resInfo.dept,
          isNgpa: false,
          isCompulsory: true,
          grade: '',
          isRepeat: false,
          isExcused: false,
          isExpected: false
        });
      }

      saveState();
      renderAll();
      showToast(`Specialization stream updated to ${DEPARTMENTS[dept] || dept}`);
    });
  }

  // Semester Tabs
  document.querySelectorAll('#semesterTabsContainer .semester-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sem = (e.target as HTMLElement).getAttribute('data-sem');
      if (sem) {
        STATE.currentSemester = sem;
        saveState();
        renderAll();
      }
    });
  });

  // Course Filter Input
  const filterInput = document.getElementById('courseFilterInput') as HTMLInputElement | null;
  if (filterInput) {
    filterInput.addEventListener('input', () => {
      filterSemesterCourseRows(filterInput.value);
    });
  }

  // Bulk Actions
  document.getElementById('btnMarkAllReal')?.addEventListener('click', () => {
    bulkToggleSemesterExpected(false);
  });

  document.getElementById('btnFillExpected')?.addEventListener('click', () => {
    bulkToggleSemesterExpected(true);
  });

  document.getElementById('btnBulkFillA')?.addEventListener('click', () => {
    bulkFillSemesterGrades('A');
  });

  document.getElementById('btnBulkFillBPlus')?.addEventListener('click', () => {
    bulkFillSemesterGrades('B+');
  });

  document.getElementById('btnClearSemGrades')?.addEventListener('click', () => {
    clearCurrentSemesterGrades();
  });

  // Advisor Tool Tabs
  function switchAdvisorTool(toolName: string) {
    document.querySelectorAll('.tool-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tool') === toolName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    document.querySelectorAll('.advisor-tool-pane').forEach(p => ((p as HTMLElement).style.display = 'none'));
    const target = document.getElementById(`tool-pane-${toolName}`);
    if (target) target.style.display = 'block';

    if (toolName === 'whatif') renderWhatIfSimulator();
    if (toolName === 'repeat') {
      populateRepeatCoursesDropdown();
      updateRepeatImpactDisplay();
    }
    if (toolName === 'audit') renderGraduationAudit();
  }

  document.querySelectorAll('.tool-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tool = (e.target as HTMLElement).getAttribute('data-tool');
      if (tool) switchAdvisorTool(tool);
    });
  });

  // Target GPA Planner Calculate Button
  function executeTargetCalculation() {
    const inputEl = document.getElementById('targetGpaInput') as HTMLInputElement | null;
    const selectEl = document.getElementById('targetGoalSelect') as HTMLSelectElement | null;
    const rawVal = inputEl?.value || selectEl?.value || '3.70';
    const val = parseFloat(rawVal);
    if (isNaN(val) || val <= 0 || val > 4.0) {
      alert('Please enter a valid target CGPA between 2.00 and 4.00.');
      return;
    }
    renderTargetPlannerResult(val);
  }

  document.getElementById('btnCalculateTarget')?.addEventListener('click', executeTargetCalculation);
  document.getElementById('targetGoalSelect')?.addEventListener('change', (e) => {
    const val = (e.target as HTMLSelectElement).value;
    const inputEl = document.getElementById('targetGpaInput') as HTMLInputElement | null;
    if (inputEl) inputEl.value = val;
    executeTargetCalculation();
  });

  // What-If Simulator Grade Select
  document.getElementById('whatIfGradeSelect')?.addEventListener('change', renderWhatIfSimulator);

  // Repeat Impact Selects
  document.getElementById('repeatCourseSelect')?.addEventListener('change', updateRepeatImpactDisplay);
  document.getElementById('repeatTargetGradeSelect')?.addEventListener('change', updateRepeatImpactDisplay);
  document.getElementById('repeatExcusedCheck')?.addEventListener('change', updateRepeatImpactDisplay);

  // Quick Paste Transcript Modal
  document.getElementById('btnQuickPaste')?.addEventListener('click', () => {
    document.getElementById('quickPasteModal')?.classList.add('show');
    (document.getElementById('pasteInputText') as HTMLInputElement).value = '';
    const preview = document.getElementById('pasteResultsPreview');
    if (preview) preview.innerHTML = '';
  });

  document.getElementById('pasteInputText')?.addEventListener('input', (e) => {
    const text = (e.target as HTMLTextAreaElement).value;
    const matches = parseTranscriptText(text);
    const preview = document.getElementById('pasteResultsPreview');
    if (!preview) return;

    if (matches.length === 0) {
      preview.innerHTML = `<span style="color: var(--text-muted); font-size: 0.8rem;">No recognizable course codes found. Paste raw text containing codes like AS11201, BL11301...</span>`;
      return;
    }

    let html = `<div style="font-weight: 700; margin-bottom: 6px; font-size: 0.82rem; color: var(--primary-accent);">Found ${matches.length} Course Match(es):</div><div style="display: flex; flex-wrap: wrap; gap: 6px;">`;
    matches.forEach(m => {
      html += `<span class="code-badge" style="background: var(--bg-card);">${m.code}: <strong>${m.grade || 'No Grade'}</strong></span>`;
    });
    html += `</div>`;
    preview.innerHTML = html;
  });

  document.getElementById('btnApplyParsedResults')?.addEventListener('click', () => {
    const text = (document.getElementById('pasteInputText') as HTMLTextAreaElement).value;
    const matches = parseTranscriptText(text);

    if (matches.length === 0) {
      alert('No matching courses found to import.');
      return;
    }

    let appliedCount = 0;
    matches.forEach(m => {
      if (!m.grade) return;
      (['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'] as SemesterKey[]).forEach(sem => {
        (STATE.semesters[sem] || []).forEach(course => {
          if (course.code === m.code) {
            course.grade = m.grade;
            appliedCount++;
          }
        });
      });
      (STATE.orientationCourses || []).forEach(course => {
        if (course.code === m.code) {
          course.grade = m.grade;
          appliedCount++;
        }
      });
    });

    saveState();
    renderAll();
    document.getElementById('quickPasteModal')?.classList.remove('show');
    showToast(`✔ Applied ${appliedCount} grade(s) from transcript text!`);
  });

  // Elective Catalog Modal
  document.getElementById('btnAddElectiveModalBtn')?.addEventListener('click', () => {
    if (STATE.currentSemester === 'all') {
      alert('Please switch to a specific semester tab first.');
      return;
    }
    const title = document.getElementById('electiveModalSemesterTitle');
    if (title) title.innerText = `Semester ${STATE.currentSemester}`;
    renderElectiveCatalog();
    document.getElementById('electiveCatalogModal')?.classList.add('show');
  });

  document.getElementById('electiveSearchInput')?.addEventListener('input', renderElectiveCatalog);

  // Add Custom Course
  document.getElementById('btnAddCustomCourseBtn')?.addEventListener('click', () => {
    if (STATE.currentSemester === 'all') {
      alert('Please switch to a specific semester tab first.');
      return;
    }
    const code = prompt('Enter Course Code (e.g. EX31201):', 'EX31201');
    if (!code) return;
    const cleanCode = code.trim().toUpperCase();
    const name = prompt('Enter Course Title:', 'Special Agricultural Study') || cleanCode;
    const creditsStr = prompt('Enter Credit Weight (1 - 6):', '2');
    const credits = parseInt(creditsStr || '2', 10) || 2;
    const dept = cleanCode.substring(0, 2) || 'CC';

    STATE.semesters[STATE.currentSemester].push({
      code: cleanCode,
      name,
      credits,
      dept,
      isNgpa: false,
      isCompulsory: false,
      grade: '',
      isRepeat: false,
      isExcused: false,
      isExpected: false
    });

    saveState();
    renderAll();
    showToast(`Added custom course: ${cleanCode}`);
  });

  // Restore Default Compulsory Courses
  document.getElementById('btnRestoreCompulsory')?.addEventListener('click', () => {
    if (STATE.currentSemester === 'all') {
      alert('Please select a specific semester.');
      return;
    }
    if (confirm(`Reset Semester ${STATE.currentSemester} to default compulsory courses? Non-compulsory courses will be preserved.`)) {
      const defaults = initDefaultCoursesForDegree(STATE.degree);
      const current = STATE.semesters[STATE.currentSemester] || [];
      const electives = current.filter(c => !c.isCompulsory && !c.isSpecialization);
      STATE.semesters[STATE.currentSemester] = [...defaults[STATE.currentSemester], ...electives];
      saveState();
      renderAll();
      showToast('Reset to default compulsory courses');
    }
  });

  // Load Sample Data
  document.getElementById('btnLoadSample')?.addEventListener('click', () => {
    if (confirm('Load sample student records (Gjay - 7740)? This will populate semesters 1-1 to 3-1 with sample grades.')) {
      loadSampleStudentData();
      renderAll();
      showToast('Loaded sample student data');
    }
  });

  // Reset All
  document.getElementById('btnResetAll')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to RESET all course grades and restore clean degree defaults?')) {
      STATE.semesters = initDefaultCoursesForDegree(STATE.degree);
      saveState();
      renderAll();
      showToast('All course records reset');
    }
  });

  // Print Report
  document.getElementById('btnPrintReport')?.addEventListener('click', () => {
    window.print();
  });

  // Generic Modal Close Buttons
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      if (modalId) {
        document.getElementById(modalId)?.classList.remove('show');
      }
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal && modal.id !== 'onboardingModal') {
        modal.classList.remove('show');
      }
    });
  });
}

// Auto-run when DOM is loaded
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
