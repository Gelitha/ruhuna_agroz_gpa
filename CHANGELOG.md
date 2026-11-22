# Changelog

All notable changes to the University of Ruhuna — Faculty of Agriculture GPA Calculator & Academic Advisor Engine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.5.0] - 2026-10-30

### ⚡ TypeScript Architecture & Advanced Advisor Upgrades
* **Full TypeScript Migration:**
  * Replaced monolithic scripts with strongly-typed TypeScript source files (`src/types.ts`, `src/database.ts`, `src/app.ts`, `src/ui.ts`).
  * Decoupled frontend controller from `index.html` into a dedicated bundled `ui.js` module.
  * Added automated build pipeline (`build.js`, `tsconfig.json`) integrating `tsc` typechecking, `esbuild` bundling, and standalone generation.
* **Dual-Option Segmented Result Status Switch Control:**
  * Replaced the ambiguous single status chip with a clear two-option segmented switch (`[ 🟢 Real | ✨ Expected ]`) in every course row.
  * Both options are visible simultaneously side-by-side with instantaneous single-click switching between confirmed official records and provisional marks.
* **Semester Quick-Fill & Bulk Preset Actions:**
  * Added instant semester toolbar: *"Fill with A (4.0)"*, *"Fill with B+ (3.3)"*, *"Mark All Real"*, *"Mark All Expected"*, and *"Clear Semester Grades"*.
* **Rapid Keyboard Navigation & Shortcuts:**
  * Typing `A`, `B`, `C`, `D`, `E` on any grade dropdown instantly cycles between corresponding grades (e.g. `A+` -> `A` -> `A-`).
  * Global shortcuts: `Alt+1` through `Alt+8` (switch semesters), `Alt+0` (all semesters), `Alt+A` (advisor), `Alt+P` (progression), `Alt+S` (workspace), and `Alt+C` (share card).
* **Concrete Grade Combinations Solver:**
  * Target GPA Planner now computes and suggests 2–3 tangible combinations of grades across remaining courses (e.g. *"Option 1: 3 × A and 7 × B+"*).
* **Faculty Regulation & Academic Standing Health Check:**
  * Automated alert detector warning students of active unrepeated `E` fails, excessive conditional passes (`D` / `D+`), and academic probation risks.
* **Letter Grade Distribution Spread Chart:**
  * Added a color-coded bar chart in the Progression view showing counts and percentages of all grades earned from `A+` down to `E`.
* **Shareable Academic Summary Card:**
  * 1-click **"📋 Share Card"** copying formatted academic performance summaries to the clipboard with animated toast notifications.
* **Progressive Web App (PWA) Offline Support:**
  * Added `manifest.webmanifest` and Service Worker (`sw.js`) enabling 100% offline installation on mobile and desktop devices.
* **Harmonized Curriculum Documentation:**
  * Reconciled credit requirements in `ACADEMIC_REGULATIONS.md` with current handbook standards (108 compulsory + 18 elective credits for ARMT).

---

## [2.1.0] - 2026-10-30

### 🎨 Modern Minimalist UI & UX Redesign
* **Ultra-Minimalist Slim Header:**
  * Eliminated header clutter by removing the dense 8-button row.
  * Replaced the bulky dark green banner with a sleek, sticky navbar (< 55px).
  * Grouped secondary utilities (*Quick Paste, Sample Data, CSV Export, Backup/Restore JSON, Print PDF, Reset*) inside a tidy `⚙️ ▾` More Actions dropdown.
  * Added clean brand mark with subtle `🌾 AgriGPA` typography and Faculty tag.
* **Personalized Dynamic Greeting Hero:**
  * Added time-aware greeting banner ("Good morning / afternoon / evening, <Name> 👋") based on client local time.
  * Added student metadata subtitle reflecting active degree and index number.
  * Integrated degree switcher (`ARMT`, `ABM`, `Green Tech`) and Year 4 Specialization dropdown directly into the hero card as modern segmented pills.
* **Segmented View Mode Switcher:**
  * Replaced the cramped side-by-side layout with clean top-level views:
    * `📚 Semester Grades`: Roomy, distraction-free course table with plenty of horizontal space for grade entry.
    * `🎯 Academic Advisor`: Full-width hub for Target Planner, What-If Simulator, Repeat Upgrade Planner, Degree Audit, Dean's Honors, and Non-GPA Checklist.
    * `📈 Progression`: Full-width SVG GPA trajectory and honours benchmark curve.
  * Added a fast jump shortcut banner at the bottom of the semester workspace linking directly to the Academic Advisor.
* **Minimalist 3-Card Metrics Strip:**
  * Consolidated 4 dense rainbow cards into 3 clean, airy summary cards:
    1. Cumulative GPA (CGPA) with honours standing badge & expected delta pill.
    2. Degree Credits Earned with an integrated micro-progress bar.
    3. Academic Standing & Dean's Honors / Non-GPA requirement badges.
* **Enhanced Micro-Interactions & Styling:**
  * Added smooth fade transitions between view panels.
  * Re-styled profile switcher pill and dropdown with clean card shadows and avatar tags.
  * Fine-tuned dark/light mode palette with improved contrast ratios and subtle borders.
  * Updated `bundle.js` and regenerated standalone offline `index-standalone.html`.

---

## [2.0.0] - 2026-10-30

### 🚀 Major Feature Release: Advisor Hub & Multi-Profile Architecture
* **Multi-Student Profile Support:**
  * Local browser storage engine storing multiple student profiles (`ruhuna_agri_profiles_v2`).
  * Instant profile switching, creation, editing, cloning (for hypothetical scenarios), and deletion.
* **Real Confirmed vs. Anticipated/Expected Tracking:**
  * Introduced provisional grade tagging with `✨ Expected` vs `🟢 Real Confirmed`.
  * Live computation of expected SGPA and CGPA deltas alongside confirmed records.
  * Added "Mark All Real" and "Fill Unreleased..." batch grade simulation helpers.
* **Comprehensive Academic Advisor Hub:**
  * **Target GPA Planner:** Credit-weighted calculation for honours degree targets (3.70 First Class, 3.30 Second Upper, etc.).
  * **"What-If" Simulator:** Simulates final CGPA across remaining degree credits.
  * **Repeat Impact Calculator:** Accurately caps repeated modules at Grade C (2.0 GPV) according to Ruhuna faculty rules, with Senate/Medical excuse exemption option.
  * **Degree Conferment Audit Checklist:** Real-time graduation compliance audit (credit minimums, compulsory completion, non-GPA C- threshold).
  * **Dean's Honors List Eligibility:** Annual GPA thresholds (Y1–Y2 ≥ 3.70, Y3–Y4 ≥ 3.80) with minimum grade B filter.
* **Quick Paste Transcript Parser:**
  * RegEx parser extracting course codes (e.g. `CS11201`, `BL11301`) and letter grades from raw text pasted from the University MIS or grade sheets.
* **Visual Progression Curve:**
  * Interactive SVG chart mapping SGPA and CGPA trends across Semesters 1-1 to 4-2 with honours benchmark reference lines.
* **Data Portability:**
  * JSON backup and restore capabilities for complete profile migration.
  * CSV transcript export formatted for external analysis.
* **Standalone Single-File Distribution:**
  * Added `bundle.js` script producing `index-standalone.html` with inlined CSS, JavaScript, and database catalogs for 100% offline usage.

---

## [1.0.0] - 2026-10-25

### 🌾 Initial Release
* Baseline GPA computation engine based on the University of Ruhuna, Faculty of Agriculture 2023/24 Curriculum Handbook.
* Course catalog for ARMT, ABM, and Green Technology degree programmes.
* Semester GPA (SGPA) and Cumulative GPA (CGPA) credit-weighted math.
* Repeat grade tracking with basic capping rules.
* Core unit test suite validating grading scales and credit math.

