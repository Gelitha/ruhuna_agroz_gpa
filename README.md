# GradePath — University of Ruhuna
### Faculty of Agriculture Undergraduate GPA & Academic Progress Platform 🌿

**GradePath** is a modern, privacy-first GPA Calculator and Academic Advisor designed specifically for undergraduate students of the **Faculty of Agriculture, University of Ruhuna, Sri Lanka** (built upon the official 2023/24 Undergraduate Handbook).

Crafted with a restrained botanical design aesthetic inspired by Linear, Apple, Notion, and Vercel.

---

## 🌾 Supported Degree Programmes

1. **BSc Hons in Agricultural Resource Management and Technology (ARMT)**
   - Minimum GPA Credits: **126** (Compulsory: 108 Cr, Electives: min. 18 Cr, Non-GPA: 5 Cr)
   - 7 Year 4 Departmental Specialization streams + 6-credit Research Project (`XX42601`)
2. **BSc Hons in Agribusiness Management (ABM)**
   - Minimum GPA Credits: **125** (Compulsory: 109 Cr, Electives: min. 16 Cr, Non-GPA: 5 Cr)
   - Specialized in agricultural economics, marketing, and enterprise management
3. **BSc Hons in Green Technology (GT)**
   - Minimum GPA Credits: **125** (Compulsory: 111 Cr, Electives: min. 14 Cr, Non-GPA: 5 Cr)
   - Specialized in environmental engineering, renewable energy, and cleaner production

---

## 🏛️ Academic Regulations Enforced

- **Official Grading Scale:** A+ (4.0), A (4.0), A- (3.7), B+ (3.3), B (3.0), B- (2.7), C+ (2.3), C (2.0), C- (1.7), D+ (1.3), D (1.0), E (0.0).
- **Course Repeat Capping:** Repeated courses are automatically capped at **Grade C (2.0 GPV)** unless supported by an official Senate-approved medical certificate or bereavement excuse.
- **Compulsory Non-GPA Exclusion:** Orientation modules (`CC10001`–`CC10005`) and English/Technical Writing courses (`CC11202`, `CC12101`, `CC12202`) are excluded from the GPA formula and degree credits. Minimum grade of **C- (1.7)** is required for degree award.
- **Degree Honours Class Cutoffs:**
  - First Class Honours: **CGPA ≥ 3.70**
  - Second Class (Upper Division): **3.30 ≤ CGPA < 3.70**
  - Second Class (Lower Division): **3.00 ≤ CGPA < 3.30**
  - General Pass: **2.00 ≤ CGPA < 3.00**
- **Dean's Honor List Auditor:**
  - Years 1 & 2: Annual GPA ≥ 3.70 with all courses ≥ Grade B (3.0)
  - Years 3 & 4: Annual GPA ≥ 3.80 with all courses ≥ Grade B (3.0)
  - First attempt only (repeats disqualified).
- **Specialization Eligibility (ARMT & ABM):**
  - Evaluated at the end of Year 3 Semester 1 (3-1).
  - Cumulative GPA must be **≥ 2.70** for guaranteed preference.
  - At least **50% of Year 3 elective credits** must be from the intended Department of Specialization.

---

## 💻 Tech Stack

- **Core:** React 18, TypeScript (strict mode), Vite 6, Tailwind CSS
- **State Management:** Zustand with LocalStorage versioning (`gradepath_profiles_v3`) & legacy migration
- **Icons:** Lucide React
- **Data Visualization:** Recharts
- **Offline First:** 100% private, zero telemetry, no external database dependencies.

---

## 🚀 Running GradePath Locally

### 1. Development Server
```bash
npm install
npm run dev
```

### 2. Production Build
```bash
npm run build
npm run preview
```

### 3. Verify Academic Rules
```bash
node verify_regulations.cjs
```
