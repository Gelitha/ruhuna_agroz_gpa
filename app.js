var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var app_exports = {};
__export(app_exports, {
  ACTIVE_PROFILE_KEY: () => ACTIVE_PROFILE_KEY,
  LEGACY_STORAGE_KEY: () => LEGACY_STORAGE_KEY,
  PROFILES_STORAGE_KEY: () => PROFILES_STORAGE_KEY,
  STATE: () => STATE,
  THEME_STORAGE_KEY: () => THEME_STORAGE_KEY,
  calculateAcademicRiskAlerts: () => calculateAcademicRiskAlerts,
  calculateCourseGpv: () => calculateCourseGpv,
  calculateOverallStats: () => calculateOverallStats,
  calculateRepeatImpact: () => calculateRepeatImpact,
  calculateSemesterStats: () => calculateSemesterStats,
  calculateTargetGpa: () => calculateTargetGpa,
  checkDegreeConfermentAudit: () => checkDegreeConfermentAudit,
  cloneActiveProfile: () => cloneActiveProfile,
  createDefaultProfileObject: () => createDefaultProfileObject,
  createNewProfile: () => createNewProfile,
  deleteProfile: () => deleteProfile,
  exportActiveProfileJson: () => exportActiveProfileJson,
  exportAllProfilesJson: () => exportAllProfilesJson,
  exportTranscriptCsv: () => exportTranscriptCsv,
  generateAcademicSummaryCardText: () => generateAcademicSummaryCardText,
  getActiveProfileId: () => getActiveProfileId,
  getAllProfiles: () => getAllProfiles,
  getClassStanding: () => getClassStanding,
  importProfileJson: () => importProfileJson,
  initDefaultCoursesForDegree: () => initDefaultCoursesForDegree,
  loadSampleStudentData: () => loadSampleStudentData,
  loadState: () => loadState,
  parseTranscriptText: () => parseTranscriptText,
  saveAllProfiles: () => saveAllProfiles,
  saveState: () => saveState,
  setActiveProfileId: () => setActiveProfileId,
  simulateGpaProjection: () => simulateGpaProjection,
  solveConcreteGradeCombinations: () => solveConcreteGradeCombinations,
  switchProfile: () => switchProfile,
  updateProfileMetadata: () => updateProfileMetadata
});
module.exports = __toCommonJS(app_exports);
var import_database = require("./database");
const PROFILES_STORAGE_KEY = "ruhuna_agri_profiles_v2";
const ACTIVE_PROFILE_KEY = "ruhuna_agri_active_profile_id";
const LEGACY_STORAGE_KEY = "ruhuna_agri_gpa_v1";
const THEME_STORAGE_KEY = "ruhuna_agri_theme";
const STATE = {
  id: "prof_default",
  name: "Gjay",
  indexNumber: "7740",
  degree: "ARMT",
  currentSemester: "1-1",
  specializationDept: "CS",
  specializationResearch: "CS42601",
  semesters: {
    "1-1": [],
    "1-2": [],
    "2-1": [],
    "2-2": [],
    "3-1": [],
    "3-2": [],
    "4-1": [],
    "4-2": []
  },
  orientationCourses: [
    { code: "CC10001", name: "General English", credits: 0, dept: "CC", grade: "C-", isNgpa: true },
    { code: "CC10002", name: "Computer Awareness", credits: 0, dept: "CC", grade: "C-", isNgpa: true },
    { code: "CC10003", name: "Basic Mathematics", credits: 0, dept: "CC", grade: "C-", isNgpa: true },
    { code: "CC10004", name: "Basic Statistics", credits: 0, dept: "CC", grade: "C-", isNgpa: true },
    { code: "CC10005", name: "Career Development and Active Citizen", credits: 0, dept: "CC", grade: "C-", isNgpa: true }
  ]
};
function initDefaultCoursesForDegree(degreeCode) {
  const compCourses = import_database.DEGREE_COMPULSORY_COURSES[degreeCode] || {};
  const newSemesters = {};
  ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"].forEach((semKey) => {
    newSemesters[semKey] = [];
    const codes = compCourses[semKey] || [];
    codes.forEach((code) => {
      const info = import_database.COURSE_CATALOG[code] || (0, import_database.parseCourseCode)(code) || {
        code,
        name: code,
        credits: 2,
        dept: "CC",
        isNgpa: false
      };
      newSemesters[semKey].push({
        code: info.code,
        name: info.name || info.code,
        credits: info.credits,
        dept: info.dept || ((0, import_database.parseCourseCode)(info.code) ? (0, import_database.parseCourseCode)(info.code).dept : "CC"),
        isNgpa: !!info.isNgpa,
        isCompulsory: true,
        grade: "",
        isRepeat: false,
        isExcused: false,
        isExpected: false
      });
    });
    if (semKey === "4-1" && (degreeCode === "ARMT" || degreeCode === "ABM")) {
      const spec = import_database.SPECIALIZATION_STREAMS[STATE.specializationDept || "CS"];
      if (spec && spec.courses) {
        spec.courses.forEach((code) => {
          const info = import_database.COURSE_CATALOG[code] || { code, name: code, credits: 2, dept: spec.dept };
          newSemesters[semKey].push({
            code: info.code,
            name: info.name,
            credits: info.credits,
            dept: spec.dept,
            isNgpa: false,
            isCompulsory: true,
            isSpecialization: true,
            grade: "",
            isRepeat: false,
            isExcused: false,
            isExpected: false
          });
        });
      }
    }
    if (semKey === "4-2") {
      const specDept = STATE.specializationDept || "CS";
      const resCode = degreeCode === "GT" ? "EN42601" : import_database.SPECIALIZATION_STREAMS[specDept]?.researchCode || "CS42601";
      const resInfo = import_database.COURSE_CATALOG[resCode] || { code: resCode, name: "Research Project", credits: 6, dept: degreeCode === "GT" ? "EN" : specDept };
      const exists = newSemesters[semKey].some((c) => c.code === resCode);
      if (!exists) {
        newSemesters[semKey].unshift({
          code: resInfo.code,
          name: resInfo.name,
          credits: resInfo.credits,
          dept: resInfo.dept,
          isNgpa: false,
          isCompulsory: true,
          grade: "",
          isRepeat: false,
          isExcused: false,
          isExpected: false
        });
      }
    }
  });
  return newSemesters;
}
function calculateCourseGpv(course) {
  if (!course.grade || !import_database.GRADING_SCALE[course.grade]) {
    return null;
  }
  let baseGpv = import_database.GRADING_SCALE[course.grade].gpv;
  if (course.isRepeat && !course.isExcused) {
    if (baseGpv > 2) {
      baseGpv = 2;
    }
  }
  return baseGpv;
}
function calculateSemesterStats(courseList) {
  let gpaCreditsAttempted = 0;
  let gpaCreditsEarned = 0;
  let weightedPoints = 0;
  let realCreditsAttempted = 0;
  let realCreditsEarned = 0;
  let realWeightedPoints = 0;
  let ngpaPassedCount = 0;
  let ngpaTotalCount = 0;
  let hasIncomplete = false;
  let allAboveB = true;
  let hasRepeat = false;
  let expectedCoursesCount = 0;
  (courseList || []).forEach((course) => {
    if (course.isNgpa) {
      ngpaTotalCount++;
      if (course.grade) {
        const gpv2 = import_database.GRADING_SCALE[course.grade]?.gpv || 0;
        if (gpv2 >= 1.7) {
          ngpaPassedCount++;
        }
      }
      return;
    }
    if (course.isRepeat) {
      hasRepeat = true;
    }
    if (!course.grade) {
      hasIncomplete = true;
      allAboveB = false;
      return;
    }
    const gpv = calculateCourseGpv(course);
    if (gpv === null) {
      hasIncomplete = true;
      allAboveB = false;
      return;
    }
    const creds = Number(course.credits) || 0;
    gpaCreditsAttempted += creds;
    weightedPoints += creds * gpv;
    if (gpv >= 1.7) {
      gpaCreditsEarned += creds;
    }
    if (course.isExpected) {
      expectedCoursesCount++;
    } else {
      realCreditsAttempted += creds;
      realWeightedPoints += creds * gpv;
      if (gpv >= 1.7) {
        realCreditsEarned += creds;
      }
    }
    if (gpv < 3) {
      allAboveB = false;
    }
  });
  const sgpa = gpaCreditsAttempted > 0 ? weightedPoints / gpaCreditsAttempted : 0;
  const realSgpa = realCreditsAttempted > 0 ? realWeightedPoints / realCreditsAttempted : 0;
  return {
    gpaCreditsAttempted,
    gpaCreditsEarned,
    weightedPoints,
    sgpa: parseFloat(sgpa.toFixed(2)),
    sgpaExact: gpaCreditsAttempted > 0 ? weightedPoints / gpaCreditsAttempted : 0,
    realCreditsAttempted,
    realCreditsEarned,
    realWeightedPoints,
    realSgpa: parseFloat(realSgpa.toFixed(2)),
    realSgpaExact: realCreditsAttempted > 0 ? realWeightedPoints / realCreditsAttempted : 0,
    expectedCoursesCount,
    hasExpected: expectedCoursesCount > 0,
    ngpaPassedCount,
    ngpaTotalCount,
    hasIncomplete,
    allAboveB,
    hasRepeat
  };
}
function getClassStanding(cgpa, creditsAttempted = 1) {
  if (creditsAttempted === 0) return { title: "In Progress", color: "secondary" };
  if (cgpa >= 3.7) return { title: "First Class Honours", color: "gold" };
  if (cgpa >= 3.3) return { title: "Second Class (Upper Division)", color: "emerald" };
  if (cgpa >= 3) return { title: "Second Class (Lower Division)", color: "blue" };
  if (cgpa >= 2) return { title: "Pass", color: "slate" };
  return { title: "Fail / Academic Probation", color: "rose" };
}
function calculateOverallStats() {
  let totalGpaCreditsAttempted = 0;
  let totalGpaCreditsEarned = 0;
  let totalWeightedPoints = 0;
  let realCreditsAttempted = 0;
  let realCreditsEarned = 0;
  let realWeightedPoints = 0;
  let totalExpectedCoursesCount = 0;
  let totalCompulsoryEarned = 0;
  let totalElectiveEarned = 0;
  let ngpaAllPassed = true;
  let unredeemedFailCount = 0;
  (STATE.orientationCourses || []).forEach((c) => {
    if (!c.grade || (import_database.GRADING_SCALE[c.grade]?.gpv || 0) < 1.7) {
      ngpaAllPassed = false;
    }
  });
  const semStats = {};
  ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"].forEach((semKey) => {
    const list = STATE.semesters[semKey] || [];
    const stats = calculateSemesterStats(list);
    semStats[semKey] = stats;
    totalGpaCreditsAttempted += stats.gpaCreditsAttempted;
    totalGpaCreditsEarned += stats.gpaCreditsEarned;
    totalWeightedPoints += stats.weightedPoints;
    realCreditsAttempted += stats.realCreditsAttempted;
    realCreditsEarned += stats.realCreditsEarned;
    realWeightedPoints += stats.realWeightedPoints;
    totalExpectedCoursesCount += stats.expectedCoursesCount;
    list.forEach((c) => {
      if (c.isNgpa) {
        if (!c.grade || (import_database.GRADING_SCALE[c.grade]?.gpv || 0) < 1.7) {
          ngpaAllPassed = false;
        }
      } else {
        const gpv = calculateCourseGpv(c);
        if (gpv !== null && gpv >= 1.7) {
          if (c.isCompulsory) {
            totalCompulsoryEarned += Number(c.credits) || 0;
          } else {
            totalElectiveEarned += Number(c.credits) || 0;
          }
        }
        if (c.grade === "E") {
          unredeemedFailCount++;
        }
      }
    });
  });
  const cgpa = totalGpaCreditsAttempted > 0 ? totalWeightedPoints / totalGpaCreditsAttempted : 0;
  const realCgpa = realCreditsAttempted > 0 ? realWeightedPoints / realCreditsAttempted : 0;
  const degInfo = import_database.DEGREE_INFO[STATE.degree] || import_database.DEGREE_INFO.ARMT;
  const standing = getClassStanding(cgpa, totalGpaCreditsAttempted);
  const realStanding = getClassStanding(realCgpa, realCreditsAttempted);
  const deltaCgpa = cgpa - realCgpa;
  const deansHonors = {};
  const years = [
    { yr: 1, sems: ["1-1", "1-2"], cutoff: 3.7, reqCredits: degInfo.semesters["1-1"].compulsoryCredits + degInfo.semesters["1-2"].compulsoryCredits },
    { yr: 2, sems: ["2-1", "2-2"], cutoff: 3.7, reqCredits: degInfo.semesters["2-1"].compulsoryCredits + degInfo.semesters["2-2"].compulsoryCredits },
    { yr: 3, sems: ["3-1", "3-2"], cutoff: 3.8, reqCredits: degInfo.semesters["3-1"].compulsoryCredits + degInfo.semesters["3-2"].compulsoryCredits },
    { yr: 4, sems: ["4-1", "4-2"], cutoff: 3.8, reqCredits: degInfo.semesters["4-1"].compulsoryCredits + degInfo.semesters["4-2"].compulsoryCredits }
  ];
  years.forEach((y) => {
    const s1 = semStats[y.sems[0]];
    const s2 = semStats[y.sems[1]];
    const yrAttempted = s1.gpaCreditsAttempted + s2.gpaCreditsAttempted;
    const yrPoints = s1.weightedPoints + s2.weightedPoints;
    const yrGpa = yrAttempted > 0 ? yrPoints / yrAttempted : 0;
    const hasRepeats = s1.hasRepeat || s2.hasRepeat;
    const allB = s1.allAboveB && s2.allAboveB;
    const hasInc = s1.hasIncomplete || s2.hasIncomplete;
    const creditsMet = yrAttempted >= y.reqCredits;
    let status = "Incomplete";
    let reason = "";
    if (hasInc || yrAttempted === 0) {
      status = "Pending / In Progress";
      reason = "Not all semester grades are finalized.";
    } else if (hasRepeats) {
      status = "Not Eligible";
      reason = "Repeated courses are not eligible for Dean\u2019s Honor List (first attempt only).";
    } else if (!allB) {
      status = "Not Eligible";
      reason = "All registered courses must have a grade of B (3.0) or higher.";
    } else if (!creditsMet) {
      status = "Not Eligible";
      reason = `Completed credits (${yrAttempted}) do not meet the minimum requirement (${y.reqCredits}).`;
    } else if (yrGpa < y.cutoff) {
      status = "Not Eligible";
      reason = `Annual GPA (${yrGpa.toFixed(2)}) is below the required threshold of ${y.cutoff.toFixed(2)}.`;
    } else {
      status = "Eligible for Dean\u2019s Honor List";
      reason = `Annual GPA: ${yrGpa.toFixed(2)} (>= ${y.cutoff.toFixed(2)}) with all grades >= B. Congratulations!`;
    }
    deansHonors[y.yr] = {
      year: y.yr,
      annualGpa: parseFloat(yrGpa.toFixed(2)),
      status,
      eligible: status.startsWith("Eligible"),
      reason
    };
  });
  let specEligibility = {
    evaluated: false,
    gpaMet: false,
    electiveRatioMet: false,
    gpa31: 0,
    electiveDeptCredits: 0,
    totalYear3ElectiveCredits: 0,
    ratio: 0,
    statusText: "",
    chosenDept: STATE.specializationDept
  };
  if (STATE.degree === "ARMT" || STATE.degree === "ABM") {
    let pts31 = 0;
    let creds31 = 0;
    ["1-1", "1-2", "2-1", "2-2", "3-1"].forEach((k) => {
      pts31 += semStats[k].weightedPoints;
      creds31 += semStats[k].gpaCreditsAttempted;
    });
    const gpaEnd31 = creds31 > 0 ? pts31 / creds31 : 0;
    specEligibility.evaluated = creds31 >= 60;
    specEligibility.gpa31 = parseFloat(gpaEnd31.toFixed(2));
    specEligibility.gpaMet = gpaEnd31 >= 2.7;
    let yr3ElectiveTotal = 0;
    let yr3ElectiveDept = 0;
    ["3-1", "3-2"].forEach((k) => {
      (STATE.semesters[k] || []).forEach((c) => {
        if (!c.isCompulsory && !c.isNgpa) {
          const cred = Number(c.credits) || 0;
          yr3ElectiveTotal += cred;
          if (c.dept === STATE.specializationDept) {
            yr3ElectiveDept += cred;
          }
        }
      });
    });
    specEligibility.totalYear3ElectiveCredits = yr3ElectiveTotal;
    specEligibility.electiveDeptCredits = yr3ElectiveDept;
    specEligibility.ratio = yr3ElectiveTotal > 0 ? yr3ElectiveDept / yr3ElectiveTotal : 0;
    specEligibility.electiveRatioMet = yr3ElectiveTotal > 0 ? specEligibility.ratio >= 0.5 : false;
    if (!specEligibility.gpaMet) {
      specEligibility.statusText = `Cumulative GPA at end of 3-1 is ${specEligibility.gpa31.toFixed(2)} (< 2.70). Preference guarantee not assured; allocation subject to competition/availability.`;
    } else if (yr3ElectiveTotal > 0 && !specEligibility.electiveRatioMet) {
      specEligibility.statusText = `GPA requirement met (${specEligibility.gpa31.toFixed(2)} >= 2.70), but only ${(specEligibility.ratio * 100).toFixed(0)}% of 3rd year electives are from ${STATE.specializationDept} (minimum 50% required).`;
    } else {
      specEligibility.statusText = `Fully Eligible for Guaranteed Preference in ${import_database.DEPARTMENTS[STATE.specializationDept] || STATE.specializationDept}! (GPA: ${specEligibility.gpa31.toFixed(2)} >= 2.70, Dept Electives: ${yr3ElectiveDept}/${yr3ElectiveTotal} credits).`;
    }
  }
  return {
    totalGpaCreditsAttempted,
    totalGpaCreditsEarned,
    totalWeightedPoints,
    totalCompulsoryEarned,
    totalElectiveEarned,
    totalRequiredCredits: degInfo.totalMinGpaCredits,
    minElectiveCredits: degInfo.minElectiveCredits,
    minCompulsoryCredits: degInfo.minCompulsoryCredits,
    cgpa: parseFloat(cgpa.toFixed(2)),
    cgpaExact: cgpa,
    classStanding: standing.title,
    classBadgeColor: standing.color,
    realCreditsAttempted,
    realCreditsEarned,
    realWeightedPoints,
    realCgpa: parseFloat(realCgpa.toFixed(2)),
    realCgpaExact: realCgpa,
    realClassStanding: realStanding.title,
    realClassBadgeColor: realStanding.color,
    hasExpectedCourses: totalExpectedCoursesCount > 0,
    totalExpectedCoursesCount,
    deltaCgpa: parseFloat(deltaCgpa.toFixed(2)),
    ngpaAllPassed,
    unredeemedFailCount,
    semStats,
    deansHonors,
    specEligibility
  };
}
function solveConcreteGradeCombinations(requiredAvgGpa, remainingCredits) {
  if (requiredAvgGpa > 4 || requiredAvgGpa <= 0 || remainingCredits <= 0) {
    return [];
  }
  const numCourses = Math.max(1, Math.round(remainingCredits / 2));
  const combinations = [];
  const candidates = [
    { grade: "A", gpv: 4 },
    { grade: "A-", gpv: 3.7 },
    { grade: "B+", gpv: 3.3 },
    { grade: "B", gpv: 3 },
    { grade: "B-", gpv: 2.7 },
    { grade: "C+", gpv: 2.3 },
    { grade: "C", gpv: 2 }
  ];
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const g1 = candidates[i];
      const g2 = candidates[j];
      if (g1.gpv > g2.gpv) {
        const targetSum = numCourses * requiredAvgGpa;
        const kFloat = (targetSum - numCourses * g2.gpv) / (g1.gpv - g2.gpv);
        const k = Math.ceil(kFloat);
        if (k > 0 && k < numCourses) {
          const count1 = k;
          const count2 = numCourses - k;
          const achievedGpa = parseFloat(((count1 * g1.gpv + count2 * g2.gpv) / numCourses).toFixed(2));
          if (achievedGpa >= requiredAvgGpa && achievedGpa - requiredAvgGpa <= 0.15) {
            let difficulty = "Moderate";
            if (achievedGpa >= 3.8) difficulty = "Very High";
            else if (achievedGpa >= 3.5) difficulty = "Demanding";
            else if (achievedGpa <= 3) difficulty = "Achievable";
            const summary = `${count1} \xD7 ${g1.grade} (${g1.gpv.toFixed(1)}) and ${count2} \xD7 ${g2.grade} (${g2.gpv.toFixed(1)})`;
            combinations.push({
              summary,
              gradesBreakdown: { [g1.grade]: count1, [g2.grade]: count2 },
              achievedGpa,
              difficulty
            });
          }
        }
      }
    }
  }
  const uniqueCombos = [];
  const seenSummaries = /* @__PURE__ */ new Set();
  combinations.forEach((c) => {
    if (!seenSummaries.has(c.summary) && uniqueCombos.length < 3) {
      seenSummaries.add(c.summary);
      uniqueCombos.push(c);
    }
  });
  return uniqueCombos;
}
function calculateTargetGpa(targetCgpa) {
  const stats = calculateOverallStats();
  const totalRequired = stats.totalRequiredCredits;
  const attempted = stats.totalGpaCreditsAttempted;
  const currentPoints = stats.totalWeightedPoints;
  const remainingCredits = Math.max(0, totalRequired - attempted);
  if (remainingCredits === 0) {
    return {
      possible: false,
      message: "All minimum degree credits have already been attempted."
    };
  }
  const neededPoints = targetCgpa * totalRequired - currentPoints;
  const requiredAverageGpa = neededPoints / remainingCredits;
  if (requiredAverageGpa > 4) {
    return {
      possible: false,
      requiredAverageGpa: parseFloat(requiredAverageGpa.toFixed(2)),
      remainingCredits,
      message: `Mathematically unattainable. You would need an average GPA of ${requiredAverageGpa.toFixed(2)} across your remaining ${remainingCredits} credits (maximum possible is 4.00).`
    };
  }
  if (requiredAverageGpa <= 0) {
    return {
      possible: true,
      requiredAverageGpa: 0,
      remainingCredits,
      message: `Already secured! Your current weighted points already guarantee a final CGPA of at least ${targetCgpa.toFixed(2)}, provided you earn passing grades in the remaining ${remainingCredits} credits.`
    };
  }
  let suggestion = "";
  if (requiredAverageGpa >= 3.85) {
    suggestion = "Virtually all A+ / A grades required.";
  } else if (requiredAverageGpa >= 3.65) {
    suggestion = "A majority of A grades with some A- grades required.";
  } else if (requiredAverageGpa >= 3.25) {
    suggestion = "Consistent mix of A- and B+ grades required.";
  } else if (requiredAverageGpa >= 2.95) {
    suggestion = "Solid B and B+ grades required.";
  } else {
    suggestion = "Maintaining C+ or B- grades will suffice.";
  }
  const combinations = solveConcreteGradeCombinations(requiredAverageGpa, remainingCredits);
  return {
    possible: true,
    requiredAverageGpa: parseFloat(requiredAverageGpa.toFixed(2)),
    remainingCredits,
    suggestion,
    combinations,
    message: `You need to average a ${requiredAverageGpa.toFixed(2)} GPA across your remaining ${remainingCredits} credits. ${suggestion}`
  };
}
function calculateAcademicRiskAlerts() {
  const alerts = [];
  const stats = calculateOverallStats();
  const failCourses = [];
  ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"].forEach((semKey) => {
    (STATE.semesters[semKey] || []).forEach((c) => {
      if (!c.isNgpa && c.grade === "E") {
        failCourses.push(`${c.code} (${semKey})`);
      }
    });
  });
  if (failCourses.length > 0) {
    alerts.push({
      level: "danger",
      title: "Active Fail (E) Grade(s) Detected",
      message: `You have ${failCourses.length} course(s) with an active E grade: ${failCourses.join(", ")}. Under University of Ruhuna regulations, all E grades must be repeated and cleared for degree conferment.`,
      affectedCourses: failCourses
    });
  }
  const conditionalCourses = [];
  ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"].forEach((semKey) => {
    (STATE.semesters[semKey] || []).forEach((c) => {
      if (!c.isNgpa && (c.grade === "D" || c.grade === "D+")) {
        conditionalCourses.push(`${c.code} [${c.grade}]`);
      }
    });
  });
  if (conditionalCourses.length > 2) {
    alerts.push({
      level: "warning",
      title: "High Volume of Conditional Passes (D / D+)",
      message: `You have ${conditionalCourses.length} conditional passes: ${conditionalCourses.join(", ")}. Excessive conditional passes severely depress your CGPA and risk class honours standing. Consider re-sitting them if eligible.`,
      affectedCourses: conditionalCourses
    });
  }
  if (stats.totalGpaCreditsAttempted >= 15 && stats.cgpa < 2) {
    alerts.push({
      level: "danger",
      title: "Academic Probation Warning",
      message: `Your cumulative GPA (${stats.cgpa.toFixed(2)}) is below 2.00. Under Faculty regulations, maintaining a CGPA below 2.00 places a student on academic warning or probation.`
    });
  }
  const pendingNgpa = [];
  (STATE.orientationCourses || []).forEach((c) => {
    if (!c.grade || (import_database.GRADING_SCALE[c.grade]?.gpv || 0) < 1.7) {
      pendingNgpa.push(c.code);
    }
  });
  if (pendingNgpa.length > 0) {
    alerts.push({
      level: "info",
      title: "Compulsory Non-GPA Modules Incomplete",
      message: `${pendingNgpa.length} orientation or English module(s) still require a passing grade (C- or higher): ${pendingNgpa.join(", ")}.`,
      affectedCourses: pendingNgpa
    });
  }
  if (alerts.length === 0 && stats.totalGpaCreditsAttempted > 0) {
    alerts.push({
      level: "success",
      title: "Academic Record in Good Standing \u{1F31F}",
      message: "Zero fail grades, no probation flags, and all core degree progression criteria are currently satisfied!"
    });
  }
  return alerts;
}
function calculateRepeatImpact(courseCode, targetGrade, isExcused = false) {
  let targetCourse = null;
  let semFound = "";
  ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"].forEach((semKey) => {
    (STATE.semesters[semKey] || []).forEach((c) => {
      if (c.code === courseCode) {
        targetCourse = c;
        semFound = semKey;
      }
    });
  });
  if (!targetCourse || !targetCourse.grade) {
    return null;
  }
  const credits = Number(targetCourse.credits) || 0;
  const oldGpv = calculateCourseGpv(targetCourse) || 0;
  let newGpv = import_database.GRADING_SCALE[targetGrade]?.gpv || 0;
  if (!isExcused && newGpv > 2) {
    newGpv = 2;
  }
  const deltaGpv = newGpv - oldGpv;
  const deltaPoints = deltaGpv * credits;
  const currentStats = calculateOverallStats();
  const currentPoints = currentStats.totalWeightedPoints;
  const attempted = currentStats.totalGpaCreditsAttempted;
  const projectedPoints = currentPoints + deltaPoints;
  const projectedCgpa = attempted > 0 ? projectedPoints / attempted : 0;
  const deltaCgpa = projectedCgpa - currentStats.cgpa;
  const oldStanding = getClassStanding(currentStats.cgpa, attempted);
  const newStanding = getClassStanding(projectedCgpa, attempted);
  return {
    courseCode,
    courseName: targetCourse.name,
    credits,
    semester: semFound,
    oldGrade: targetCourse.grade,
    oldGpv: parseFloat(oldGpv.toFixed(2)),
    targetGrade,
    newGpv: parseFloat(newGpv.toFixed(2)),
    deltaGpv: parseFloat(deltaGpv.toFixed(2)),
    deltaPoints: parseFloat(deltaPoints.toFixed(2)),
    currentCgpa: currentStats.cgpa,
    projectedCgpa: parseFloat(projectedCgpa.toFixed(2)),
    deltaCgpa: parseFloat(deltaCgpa.toFixed(2)),
    oldStanding: oldStanding.title,
    newStanding: newStanding.title,
    classChanged: oldStanding.title !== newStanding.title
  };
}
function simulateGpaProjection(simulatedSgpa) {
  const currentStats = calculateOverallStats();
  const totalRequired = currentStats.totalRequiredCredits;
  const currentAttempted = currentStats.totalGpaCreditsAttempted;
  const remainingCredits = Math.max(0, totalRequired - currentAttempted);
  const currentPoints = currentStats.totalWeightedPoints;
  const simulatedPoints = simulatedSgpa * remainingCredits;
  const projectedTotalPoints = currentPoints + simulatedPoints;
  const projectedFinalCgpa = totalRequired > 0 ? projectedTotalPoints / totalRequired : 0;
  const standing = getClassStanding(projectedFinalCgpa, totalRequired);
  return {
    currentCgpa: currentStats.cgpa,
    remainingCredits,
    simulatedSgpa: parseFloat(simulatedSgpa.toFixed(2)),
    projectedCgpa: parseFloat(projectedFinalCgpa.toFixed(2)),
    projectedStanding: standing.title,
    standingColor: standing.color,
    deltaCgpa: parseFloat((projectedFinalCgpa - currentStats.cgpa).toFixed(2))
  };
}
function checkDegreeConfermentAudit() {
  const stats = calculateOverallStats();
  const degInfo = import_database.DEGREE_INFO[STATE.degree] || import_database.DEGREE_INFO.ARMT;
  const items = [
    {
      title: "Total GPA Credits Earned",
      requirement: `Minimum ${stats.totalRequiredCredits} credits`,
      current: `${stats.totalGpaCreditsEarned} credits earned (${stats.totalGpaCreditsAttempted} attempted)`,
      passed: stats.totalGpaCreditsEarned >= stats.totalRequiredCredits
    },
    {
      title: "Compulsory Course Credits",
      requirement: `Minimum ${stats.minCompulsoryCredits} credits`,
      current: `${stats.totalCompulsoryEarned} credits passed`,
      passed: stats.totalCompulsoryEarned >= stats.minCompulsoryCredits
    },
    {
      title: "Elective Course Credits",
      requirement: `Minimum ${stats.minElectiveCredits} credits`,
      current: `${stats.totalElectiveEarned} credits passed`,
      passed: stats.totalElectiveEarned >= stats.minElectiveCredits
    },
    {
      title: "Non-GPA Courses Completed",
      requirement: "Pass (>= C-) in all Orientation & English modules",
      current: stats.ngpaAllPassed ? "All passed (>= C-)" : "Pending / Failed modules exist",
      passed: stats.ngpaAllPassed
    },
    {
      title: "Academic Standing (CGPA)",
      requirement: "Minimum CGPA of 2.00",
      current: `Current CGPA: ${stats.cgpa.toFixed(2)} (${stats.classStanding})`,
      passed: stats.cgpa >= 2
    },
    {
      title: "No Unredeemed Fail (E) Grades",
      requirement: "Zero active E grades",
      current: stats.unredeemedFailCount === 0 ? "Clear (0 E grades)" : `${stats.unredeemedFailCount} unrepeated E grade(s)`,
      passed: stats.unredeemedFailCount === 0
    }
  ];
  const allPassed = items.every((i) => i.passed);
  return {
    allPassed,
    items,
    degreeCode: STATE.degree,
    degreeName: degInfo.name
  };
}
function generateAcademicSummaryCardText() {
  const stats = calculateOverallStats();
  const degInfo = import_database.DEGREE_INFO[STATE.degree] || import_database.DEGREE_INFO.ARMT;
  const specDeptName = import_database.DEPARTMENTS[STATE.specializationDept] || STATE.specializationDept;
  return [
    `\u{1F33E} UNIVERSITY OF RUHUNA \u2014 FACULTY OF AGRICULTURE`,
    `Student: ${STATE.name} (${STATE.indexNumber})`,
    `Degree: ${degInfo.shortName} \u2022 ${specDeptName}`,
    `--------------------------------------------------`,
    `\u{1F393} Overall CGPA: ${stats.cgpa.toFixed(2)} [${stats.classStanding}]`,
    stats.hasExpectedCourses ? `\u2728 Real Confirmed CGPA: ${stats.realCgpa.toFixed(2)} (${stats.deltaCgpa >= 0 ? "+" : ""}${stats.deltaCgpa.toFixed(2)} with expected)` : `\u{1F7E2} Status: All Grades Confirmed`,
    `\u{1F4DA} Completed Credits: ${stats.totalGpaCreditsEarned} / ${stats.totalRequiredCredits} GPA Credits`,
    `\u{1F4CB} Non-GPA Modules: ${stats.ngpaAllPassed ? "All Satisfied (Passed)" : "Pending Modules"}`,
    `--------------------------------------------------`,
    `Generated via AgriGPA Academic Advisor Engine`
  ].join("\n");
}
function getAllProfiles() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) return arr;
    }
  } catch (e) {
    console.error("Error parsing profiles from localStorage:", e);
  }
  return [];
}
function saveAllProfiles(profiles) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error("Error saving profiles to localStorage:", e);
  }
}
function getActiveProfileId() {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
}
function setActiveProfileId(id) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
}
function createDefaultProfileObject(id, name, indexNumber, degree = "ARMT") {
  return {
    id: id || "prof_" + Date.now(),
    name: name || "Gjay",
    indexNumber: indexNumber || "7740",
    degree,
    currentSemester: "1-1",
    specializationDept: "CS",
    specializationResearch: "CS42601",
    semesters: initDefaultCoursesForDegree(degree),
    orientationCourses: [
      { code: "CC10001", name: "General English", credits: 0, dept: "CC", grade: "C-", isNgpa: true },
      { code: "CC10002", name: "Computer Awareness", credits: 0, dept: "CC", grade: "C-", isNgpa: true },
      { code: "CC10003", name: "Basic Mathematics", credits: 0, dept: "CC", grade: "C-", isNgpa: true },
      { code: "CC10004", name: "Basic Statistics", credits: 0, dept: "CC", grade: "C-", isNgpa: true },
      { code: "CC10005", name: "Career Development and Active Citizen", credits: 0, dept: "CC", grade: "C-", isNgpa: true }
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function loadState() {
  if (typeof localStorage === "undefined") return false;
  try {
    let profiles = getAllProfiles();
    if (profiles.length === 0) {
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      let legacyData = null;
      if (legacyRaw) {
        try {
          legacyData = JSON.parse(legacyRaw);
        } catch (err) {
        }
      }
      const initialProfile = createDefaultProfileObject("prof_default", "Gjay", "7740", legacyData?.degree || "ARMT");
      if (legacyData && legacyData.semesters) {
        initialProfile.semesters = legacyData.semesters;
        if (legacyData.specializationDept) initialProfile.specializationDept = legacyData.specializationDept;
        if (legacyData.orientationCourses) initialProfile.orientationCourses = legacyData.orientationCourses;
      }
      profiles = [initialProfile];
      saveAllProfiles(profiles);
      setActiveProfileId(initialProfile.id);
    }
    let activeId = getActiveProfileId();
    let activeProfile = profiles.find((p) => p.id === activeId);
    if (!activeProfile) {
      activeProfile = profiles[0];
      setActiveProfileId(activeProfile.id);
    }
    STATE.id = activeProfile.id;
    STATE.name = activeProfile.name || "Gjay";
    STATE.indexNumber = activeProfile.indexNumber || "7740";
    STATE.degree = activeProfile.degree || "ARMT";
    STATE.specializationDept = activeProfile.specializationDept || "CS";
    STATE.specializationResearch = activeProfile.specializationResearch || "CS42601";
    STATE.currentSemester = activeProfile.currentSemester || "1-1";
    STATE.semesters = activeProfile.semesters || initDefaultCoursesForDegree(STATE.degree);
    STATE.orientationCourses = activeProfile.orientationCourses || [
      { code: "CC10001", name: "General English", credits: 0, grade: "C-", isNgpa: true },
      { code: "CC10002", name: "Computer Awareness", credits: 0, grade: "C-", isNgpa: true },
      { code: "CC10003", name: "Basic Mathematics", credits: 0, grade: "C-", isNgpa: true },
      { code: "CC10004", name: "Basic Statistics", credits: 0, grade: "C-", isNgpa: true },
      { code: "CC10005", name: "Career Development and Active Citizen", credits: 0, grade: "C-", isNgpa: true }
    ];
    return true;
  } catch (e) {
    console.error("Failed to load state from localStorage", e);
  }
  return false;
}
function saveState() {
  if (typeof localStorage === "undefined") return;
  try {
    let profiles = getAllProfiles();
    const activeId = STATE.id || getActiveProfileId();
    let index = profiles.findIndex((p) => p.id === activeId);
    const snapshot = {
      id: activeId || "prof_" + Date.now(),
      name: STATE.name || "Gjay",
      indexNumber: STATE.indexNumber || "7740",
      degree: STATE.degree,
      specializationDept: STATE.specializationDept,
      specializationResearch: STATE.specializationResearch,
      currentSemester: STATE.currentSemester,
      semesters: STATE.semesters,
      orientationCourses: STATE.orientationCourses,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (index >= 0) {
      profiles[index] = { ...profiles[index], ...snapshot };
    } else {
      snapshot.createdAt = (/* @__PURE__ */ new Date()).toISOString();
      profiles.push(snapshot);
      setActiveProfileId(snapshot.id);
    }
    saveAllProfiles(profiles);
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(STATE));
  } catch (e) {
    console.error("Failed to save state to localStorage", e);
  }
}
function createNewProfile(name, indexNumber, degree = "ARMT") {
  saveState();
  const newProfile = createDefaultProfileObject(null, name || "Student", indexNumber || "0000", degree);
  const profiles = getAllProfiles();
  profiles.push(newProfile);
  saveAllProfiles(profiles);
  setActiveProfileId(newProfile.id);
  loadState();
  return newProfile;
}
function switchProfile(profileId) {
  saveState();
  setActiveProfileId(profileId);
  return loadState();
}
function deleteProfile(profileId) {
  let profiles = getAllProfiles();
  if (profiles.length <= 1) {
    return { success: false, message: "Cannot delete the only profile." };
  }
  profiles = profiles.filter((p) => p.id !== profileId);
  saveAllProfiles(profiles);
  if (getActiveProfileId() === profileId) {
    setActiveProfileId(profiles[0].id);
  }
  loadState();
  return { success: true };
}
function cloneActiveProfile(cloneName) {
  saveState();
  const profiles = getAllProfiles();
  const current = profiles.find((p) => p.id === STATE.id) || profiles[0];
  const copy = JSON.parse(JSON.stringify(current));
  copy.id = "prof_" + Date.now();
  copy.name = cloneName || `${current.name} (Copy)`;
  copy.createdAt = (/* @__PURE__ */ new Date()).toISOString();
  copy.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  profiles.push(copy);
  saveAllProfiles(profiles);
  setActiveProfileId(copy.id);
  loadState();
  return copy;
}
function updateProfileMetadata(name, indexNumber, degree) {
  STATE.name = (name || "").trim() || STATE.name;
  STATE.indexNumber = (indexNumber || "").trim() || STATE.indexNumber;
  if (degree && degree !== STATE.degree) {
    STATE.degree = degree;
    STATE.semesters = initDefaultCoursesForDegree(degree);
  }
  saveState();
}
function exportActiveProfileJson() {
  const profile = {
    appName: "University of Ruhuna Faculty of Agriculture GPA Calculator",
    version: "2.5",
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    profile: {
      name: STATE.name,
      indexNumber: STATE.indexNumber,
      degree: STATE.degree,
      specializationDept: STATE.specializationDept,
      semesters: STATE.semesters,
      orientationCourses: STATE.orientationCourses
    }
  };
  return JSON.stringify(profile, null, 2);
}
function exportAllProfilesJson() {
  saveState();
  const exportData = {
    appName: "University of Ruhuna Faculty of Agriculture GPA Calculator",
    version: "2.5",
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    profiles: getAllProfiles()
  };
  return JSON.stringify(exportData, null, 2);
}
function importProfileJson(jsonString) {
  try {
    const data = typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
    const profiles = getAllProfiles();
    if (data.profiles && Array.isArray(data.profiles)) {
      data.profiles.forEach((p) => {
        p.id = "prof_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);
        profiles.push(p);
      });
      saveAllProfiles(profiles);
      setActiveProfileId(profiles[profiles.length - 1].id);
      loadState();
      return { success: true, count: data.profiles.length };
    } else if (data.profile) {
      const p = data.profile;
      const newProf = createDefaultProfileObject(
        "prof_" + Date.now(),
        p.name || "Imported Student",
        p.indexNumber || "0000",
        p.degree || "ARMT"
      );
      if (p.semesters) newProf.semesters = p.semesters;
      if (p.specializationDept) newProf.specializationDept = p.specializationDept;
      if (p.orientationCourses) newProf.orientationCourses = p.orientationCourses;
      profiles.push(newProf);
      saveAllProfiles(profiles);
      setActiveProfileId(newProf.id);
      loadState();
      return { success: true, count: 1 };
    } else {
      return { success: false, message: "Invalid file format: expected profile data structure." };
    }
  } catch (err) {
    return { success: false, message: "JSON parsing failed: " + err.message };
  }
}
function exportTranscriptCsv() {
  const stats = calculateOverallStats();
  const degInfo = import_database.DEGREE_INFO[STATE.degree] || import_database.DEGREE_INFO.ARMT;
  const lines = [
    `"UNIVERSITY OF RUHUNA - FACULTY OF AGRICULTURE"`,
    `"Undergraduate Academic Transcript Summary"`,
    `"Student Name:",${JSON.stringify(STATE.name)}`,
    `"Index Number:",${JSON.stringify(STATE.indexNumber)}`,
    `"Degree Programme:",${JSON.stringify(degInfo.name + " (" + STATE.degree + ")")}`,
    `"Specialization Field:",${JSON.stringify(import_database.DEPARTMENTS[STATE.specializationDept] || STATE.specializationDept)}`,
    `"Date Generated:",${JSON.stringify((/* @__PURE__ */ new Date()).toLocaleDateString())}`,
    ``,
    `"Semester","Course Code","Course Title","Credits","Course Type","Grade","GPV","Quality Points","Status"`
  ];
  (STATE.orientationCourses || []).forEach((c) => {
    const gpv = import_database.GRADING_SCALE[c.grade]?.gpv || 0;
    const passed = gpv >= 1.7;
    lines.push(`"Orientation",${JSON.stringify(c.code)},${JSON.stringify(c.name)},0,"Non-GPA",${JSON.stringify(c.grade || "Pending")},${gpv.toFixed(1)},0,${JSON.stringify(passed ? "Passed" : "Pending")}`);
  });
  ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"].forEach((semKey) => {
    const semList = STATE.semesters[semKey] || [];
    semList.forEach((c) => {
      const gpv = calculateCourseGpv(c);
      const creds = Number(c.credits) || 0;
      const qp = gpv !== null ? (gpv * creds).toFixed(2) : "0.00";
      const cType = c.isNgpa ? "Non-GPA" : c.isCompulsory ? "Compulsory" : "Elective";
      const repNote = c.isRepeat ? c.isExcused ? " (Repeat-Excused)" : " (Repeat-Capped)" : "";
      const status = !c.grade ? "Pending" : gpv !== null && gpv >= 1.7 ? "Passed" : "Failed";
      lines.push(`${JSON.stringify("Sem " + semKey)},${JSON.stringify(c.code)},${JSON.stringify(c.name)},${creds},${JSON.stringify(cType + repNote)},${JSON.stringify(c.grade || "-")},${gpv !== null ? gpv.toFixed(1) : "-"},${qp},${JSON.stringify(status)}`);
    });
  });
  lines.push(``);
  lines.push(`"ACADEMIC SUMMARY"`);
  lines.push(`"Total GPA Credits Attempted:",${stats.totalGpaCreditsAttempted}`);
  lines.push(`"Total GPA Credits Earned:",${stats.totalGpaCreditsEarned}`);
  lines.push(`"Cumulative GPA (CGPA):",${stats.cgpa.toFixed(2)}`);
  lines.push(`"Class Standing:",${JSON.stringify(stats.classStanding)}`);
  lines.push(`"Non-GPA Status:",${JSON.stringify(stats.ngpaAllPassed ? "All Non-GPA Modules Satisfied" : "Pending Modules")}`);
  return lines.join("\r\n");
}
function parseTranscriptText(text) {
  if (!text || typeof text !== "string") return [];
  const lines = text.split(/\r?\n/);
  const matchedCourses = [];
  const codeRegex = /\b([A-Z]{2}\d{5})\b/i;
  const gradeRegex = /(?:^|\s|\t|,)(A\+|A-|B\+|B-|C\+|C-|D\+|A|B|C|D|E)(?:$|\s|\t|,|\.|;)/i;
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const codeMatch = trimmed.match(codeRegex);
    const gradeMatch = trimmed.match(gradeRegex);
    if (codeMatch && codeMatch[1]) {
      const code = codeMatch[1].toUpperCase();
      const grade = gradeMatch && gradeMatch[1] ? gradeMatch[1].toUpperCase() : "";
      matchedCourses.push({
        code,
        grade,
        originalLine: line
      });
    }
  });
  return matchedCourses;
}
function loadSampleStudentData() {
  STATE.degree = "ARMT";
  STATE.specializationDept = "CS";
  STATE.name = "Gjay";
  STATE.indexNumber = "7740";
  STATE.semesters = initDefaultCoursesForDegree("ARMT");
  const sampleGrades = {
    "1-1": {
      "AS11201": "A",
      "BL11301": "A-",
      "CC11201": "A+",
      "CS11201": "A",
      "EC11201": "B+",
      "EN11201": "A-",
      "FS11201": "A",
      "CC11202": "A"
    },
    "1-2": {
      "AS12301": "A",
      "BL12201": "A-",
      "CS12201": "A",
      "EC12201": "B+",
      "EN12201": "A",
      "FS12201": "A-",
      "SS12301": "A",
      "CC12101": "A",
      "CC12202": "A-"
    },
    "2-1": {
      "AS21101": "A",
      "AS21102": "A-",
      "BL21201": "B+",
      "BL21205": "A-",
      "CS21201": "A",
      "EC21201": "A-",
      "EN21201": "A",
      "FS21201": "B+",
      "SS21201": "A"
    },
    "2-2": {
      "AS22201": "A",
      "AS22102": "A-",
      "BL22201": "A",
      "CS22201": "A+",
      "CS22202": "A",
      "EC22201": "A-",
      "EN22201": "A"
    },
    "3-1": {
      "AS31201": "A",
      "CS31201": "A+",
      "EC31201": "A-",
      "EN31201": "A",
      "FS31201": "A-",
      "SS31201": "A"
    }
  };
  STATE.semesters["3-1"].push({
    code: "CS31203",
    name: "Plant Tissue Culture",
    credits: 2,
    dept: "CS",
    isNgpa: false,
    isCompulsory: false,
    grade: "A",
    isRepeat: false,
    isExcused: false,
    isExpected: false
  });
  STATE.semesters["3-1"].push({
    code: "CS31205",
    name: "Organic Agriculture",
    credits: 2,
    dept: "CS",
    isNgpa: false,
    isCompulsory: false,
    grade: "A-",
    isRepeat: false,
    isExcused: false,
    isExpected: false
  });
  Object.keys(sampleGrades).forEach((sem) => {
    const grades = sampleGrades[sem];
    STATE.semesters[sem].forEach((course) => {
      if (grades[course.code]) {
        course.grade = grades[course.code];
      }
    });
  });
  saveState();
}
Object.defineProperty(STATE, "studentName", {
  get() {
    return this.name;
  },
  set(val) {
    this.name = val;
  }
});
const exportsObj = {
  STATE,
  initDefaultCoursesForDegree,
  calculateCourseGpv,
  calculateSemesterStats,
  calculateOverallStats,
  solveConcreteGradeCombinations,
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
};
if (typeof globalThis.module !== "undefined" && globalThis.module.exports) {
  globalThis.module.exports = exportsObj;
}
if (typeof window !== "undefined") {
  Object.assign(window, exportsObj);
}
