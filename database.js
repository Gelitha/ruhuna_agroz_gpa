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
var database_exports = {};
__export(database_exports, {
  COURSE_CATALOG: () => COURSE_CATALOG,
  DEGREE_COMPULSORY_COURSES: () => DEGREE_COMPULSORY_COURSES,
  DEGREE_INFO: () => DEGREE_INFO,
  DEPARTMENTS: () => DEPARTMENTS,
  GRADING_SCALE: () => GRADING_SCALE,
  SPECIALIZATION_STREAMS: () => SPECIALIZATION_STREAMS,
  parseCourseCode: () => parseCourseCode
});
module.exports = __toCommonJS(database_exports);
const GRADING_SCALE = {
  "A+": { gpv: 4, status: "Pass", marks: ">= 85%" },
  "A": { gpv: 4, status: "Pass", marks: "80 - 84%" },
  "A-": { gpv: 3.7, status: "Pass", marks: "75 - 79%" },
  "B+": { gpv: 3.3, status: "Pass", marks: "70 - 74%" },
  "B": { gpv: 3, status: "Pass", marks: "65 - 69%" },
  "B-": { gpv: 2.7, status: "Pass", marks: "60 - 64%" },
  "C+": { gpv: 2.3, status: "Pass", marks: "55 - 59%" },
  "C": { gpv: 2, status: "Pass (Repeat Cap)", marks: "50 - 54%" },
  "C-": { gpv: 1.7, status: "Conditional (NGPA Pass)", marks: "45 - 49%" },
  "D+": { gpv: 1.3, status: "Conditional", marks: "40 - 44%" },
  "D": { gpv: 1, status: "Conditional", marks: "35 - 39%" },
  "E": { gpv: 0, status: "Fail (Must Repeat)", marks: "< 35%" }
};
const DEPARTMENTS = {
  AS: "Department of Animal Science",
  BL: "Department of Agricultural Biology",
  CS: "Department of Crop Science",
  EC: "Department of Agricultural Economics & Agribusiness",
  EN: "Department of Agricultural Engineering & Environmental Technology",
  FS: "Department of Food Science & Technology",
  SS: "Department of Soil Science",
  CC: "Common / Interdisciplinary / Computer Unit"
};
const DEGREE_INFO = {
  ARMT: {
    code: "ARMT",
    name: "BSc Hons in Agricultural Resource Management & Technology",
    shortName: "ARMT",
    totalMinGpaCredits: 126,
    minElectiveCredits: 18,
    minCompulsoryCredits: 108,
    // 93 Y1-Y3 + 6 common 4-1 + 6 spec 4-1 + 9 4-2
    nonGpaCredits: 5,
    hasSpecializationChoice: true,
    semesters: {
      "1-1": { compulsoryCredits: 15, minElectives: 0 },
      "1-2": { compulsoryCredits: 16, minElectives: 0 },
      "2-1": { compulsoryCredits: 16, minElectives: 0 },
      "2-2": { compulsoryCredits: 13, minElectives: 2 },
      "3-1": { compulsoryCredits: 12, minElectives: 4 },
      "3-2": { compulsoryCredits: 15, minElectives: 4 },
      "4-1": { compulsoryCredits: 12, minElectives: 0 },
      // 6 common + 6 spec
      "4-2": { compulsoryCredits: 9, minElectives: 0 }
    }
  },
  ABM: {
    code: "ABM",
    name: "BSc Hons in Agribusiness Management",
    shortName: "ABM",
    totalMinGpaCredits: 125,
    minElectiveCredits: 16,
    minCompulsoryCredits: 109,
    nonGpaCredits: 5,
    hasSpecializationChoice: true,
    semesters: {
      "1-1": { compulsoryCredits: 15, minElectives: 0 },
      "1-2": { compulsoryCredits: 18, minElectives: 0 },
      "2-1": { compulsoryCredits: 15, minElectives: 0 },
      "2-2": { compulsoryCredits: 16, minElectives: 0 },
      "3-1": { compulsoryCredits: 12, minElectives: 4 },
      "3-2": { compulsoryCredits: 12, minElectives: 4 },
      "4-1": { compulsoryCredits: 12, minElectives: 0 },
      "4-2": { compulsoryCredits: 9, minElectives: 0 }
    }
  },
  GT: {
    code: "GT",
    name: "BSc Hons in Green Technology",
    shortName: "GT",
    totalMinGpaCredits: 125,
    minElectiveCredits: 14,
    minCompulsoryCredits: 111,
    nonGpaCredits: 5,
    hasSpecializationChoice: false,
    semesters: {
      "1-1": { compulsoryCredits: 15, minElectives: 0 },
      "1-2": { compulsoryCredits: 15, minElectives: 0 },
      "2-1": { compulsoryCredits: 16, minElectives: 0 },
      "2-2": { compulsoryCredits: 16, minElectives: 0 },
      "3-1": { compulsoryCredits: 14, minElectives: 2 },
      "3-2": { compulsoryCredits: 14, minElectives: 2 },
      "4-1": { compulsoryCredits: 12, minElectives: 0 },
      "4-2": { compulsoryCredits: 9, minElectives: 0 }
    }
  }
};
const COURSE_CATALOG = {
  // Orientation & Non-GPA Courses
  "CC10001": { code: "CC10001", name: "General English", credits: 0, isNgpa: true, dept: "CC", semester: "Orientation" },
  "CC10002": { code: "CC10002", name: "Computer Awareness", credits: 0, isNgpa: true, dept: "CC", semester: "Orientation" },
  "CC10003": { code: "CC10003", name: "Basic Mathematics", credits: 0, isNgpa: true, dept: "CC", semester: "Orientation" },
  "CC10004": { code: "CC10004", name: "Basic Statistics", credits: 0, isNgpa: true, dept: "CC", semester: "Orientation" },
  "CC10005": { code: "CC10005", name: "Career Development and Active Citizen", credits: 0, isNgpa: true, dept: "CC", semester: "Orientation" },
  "CC11202": { code: "CC11202", name: "English I", credits: 2, isNgpa: true, dept: "CC", semester: "1-1" },
  "CC12101": { code: "CC12101", name: "Basic Technical Writing", credits: 1, isNgpa: true, dept: "CC", semester: "1-2" },
  "CC12202": { code: "CC12202", name: "English II", credits: 2, isNgpa: true, dept: "CC", semester: "1-2" },
  // 1-1 Courses
  "AS11201": { code: "AS11201", name: "Anatomy and Physiology of Farm Animals", credits: 2, isNgpa: false, dept: "AS", semester: "1-1" },
  "BL11301": { code: "BL11301", name: "Plant Physiology and Systematics", credits: 3, isNgpa: false, dept: "BL", semester: "1-1" },
  "CC11201": { code: "CC11201", name: "Information and Communication Technology in Agriculture", credits: 2, isNgpa: false, dept: "CC", semester: "1-1" },
  "CC11203": { code: "CC11203", name: "Information and Communication Technology", credits: 2, isNgpa: false, dept: "CC", semester: "1-1" },
  "CS11201": { code: "CS11201", name: "Principles of Agronomy", credits: 2, isNgpa: false, dept: "CS", semester: "1-1" },
  "EC11201": { code: "EC11201", name: "Micro Economics", credits: 2, isNgpa: false, dept: "EC", semester: "1-1" },
  "EC11202": { code: "EC11202", name: "Economic Statistics", credits: 2, isNgpa: false, dept: "EC", semester: "1-1" },
  "EC11203": { code: "EC11203", name: "Economic Principles", credits: 2, isNgpa: false, dept: "EC", semester: "1-1" },
  "EN11201": { code: "EN11201", name: "Hydrology and Climatology", credits: 2, isNgpa: false, dept: "EN", semester: "1-1" },
  "EN11302": { code: "EN11302", name: "Environmental Pollution, Toxicology and Remediation", credits: 3, isNgpa: false, dept: "EN", semester: "1-1" },
  "EN11203": { code: "EN11203", name: "Natural and Cultural Heritage Conservation", credits: 2, isNgpa: false, dept: "EN", semester: "1-1" },
  "EN11204": { code: "EN11204", name: "Environmental Law & Policy", credits: 2, isNgpa: false, dept: "EN", semester: "1-1" },
  "FS11201": { code: "FS11201", name: "Biochemistry", credits: 2, isNgpa: false, dept: "FS", semester: "1-1" },
  // 1-2 Courses
  "AS12301": { code: "AS12301", name: "Animal Nutrition, Forage & Feed Technology", credits: 3, isNgpa: false, dept: "AS", semester: "1-2" },
  "BL12201": { code: "BL12201", name: "Entomology", credits: 2, isNgpa: false, dept: "BL", semester: "1-2" },
  "BL12202": { code: "BL12202", name: "Biodiversity Conservation", credits: 2, isNgpa: false, dept: "BL", semester: "1-2" },
  "BL12203": { code: "BL12203", name: "Environmental Biotechnology", credits: 2, isNgpa: false, dept: "BL", semester: "1-2" },
  "CS12201": { code: "CS12201", name: "Agroforestry and Silviculture", credits: 2, isNgpa: false, dept: "CS", semester: "1-2" },
  "EC12201": { code: "EC12201", name: "Macro Economics", credits: 2, isNgpa: false, dept: "EC", semester: "1-2" },
  "EC12202": { code: "EC12202", name: "Principles of Business Management", credits: 2, isNgpa: false, dept: "EC", semester: "1-2" },
  "EC12203": { code: "EC12203", name: "Marketing Management", credits: 2, isNgpa: false, dept: "EC", semester: "1-2" },
  "EN12201": { code: "EN12201", name: "Agricultural Machinery Engineering", credits: 2, isNgpa: false, dept: "EN", semester: "1-2" },
  "EN12202": { code: "EN12202", name: "Environmental Footprints", credits: 2, isNgpa: false, dept: "EN", semester: "1-2" },
  "EN12203": { code: "EN12203", name: "Renewable Energy Systems I", credits: 2, isNgpa: false, dept: "EN", semester: "1-2" },
  "EN12204": { code: "EN12204", name: "Climate Change Adaptation and Mitigation", credits: 2, isNgpa: false, dept: "EN", semester: "1-2" },
  "EN12205": { code: "EN12205", name: "Green Chemistry", credits: 2, isNgpa: false, dept: "EN", semester: "1-2" },
  "FS12201": { code: "FS12201", name: "Food Chemistry", credits: 2, isNgpa: false, dept: "FS", semester: "1-2" },
  "SS12301": { code: "SS12301", name: "Fundamentals of Soil Science", credits: 3, isNgpa: false, dept: "SS", semester: "1-2" },
  // 2-1 Courses
  "AS21101": { code: "AS21101", name: "Animal Genetics and Breeding", credits: 1, isNgpa: false, dept: "AS", semester: "2-1" },
  "AS21102": { code: "AS21102", name: "Animal Products Technology", credits: 1, isNgpa: false, dept: "AS", semester: "2-1" },
  "BL21201": { code: "BL21201", name: "Genetics and Plant Breeding", credits: 2, isNgpa: false, dept: "BL", semester: "2-1" },
  "BL21205": { code: "BL21205", name: "Plant Pathology", credits: 2, isNgpa: false, dept: "BL", semester: "2-1" },
  "CS21201": { code: "CS21201", name: "Agroecology", credits: 2, isNgpa: false, dept: "CS", semester: "2-1" },
  "EC21201": { code: "EC21201", name: "Agricultural Marketing", credits: 2, isNgpa: false, dept: "EC", semester: "2-1" },
  "EC21202": { code: "EC21202", name: "Book Keeping & Accountancy", credits: 2, isNgpa: false, dept: "EC", semester: "2-1" },
  "EC21204": { code: "EC21204", name: "Natural Resource Economics", credits: 2, isNgpa: false, dept: "EC", semester: "2-1" },
  "EC21205": { code: "EC21205", name: "Consumer Behavior", credits: 2, isNgpa: false, dept: "EC", semester: "2-1" },
  "EC21206": { code: "EC21206", name: "Environmental Economics", credits: 2, isNgpa: false, dept: "EC", semester: "2-1" },
  "EN21201": { code: "EN21201", name: "Bioprocessing and Post-harvest Engineering", credits: 2, isNgpa: false, dept: "EN", semester: "2-1" },
  "EN21202": { code: "EN21202", name: "Ergonomics", credits: 2, isNgpa: false, dept: "EN", semester: "2-1" },
  "EN21205": { code: "EN21205", name: "Machinery Principles and Power Units", credits: 2, isNgpa: false, dept: "EN", semester: "2-1" },
  "EN21206": { code: "EN21206", name: "Life Cycle Assessment", credits: 2, isNgpa: false, dept: "EN", semester: "2-1" },
  "EN21207": { code: "EN21207", name: "Renewable Energy Systems II", credits: 2, isNgpa: false, dept: "EN", semester: "2-1" },
  "EN21208": { code: "EN21208", name: "Productivity and Quality Management", credits: 2, isNgpa: false, dept: "EN", semester: "2-1" },
  "EN21209": { code: "EN21209", name: "Energy Audit and Energy Asset Management", credits: 2, isNgpa: false, dept: "EN", semester: "2-1" },
  "FS21201": { code: "FS21201", name: "Food and Nutrition", credits: 2, isNgpa: false, dept: "FS", semester: "2-1" },
  "SS21201": { code: "SS21201", name: "Soil, Plant and Environment", credits: 2, isNgpa: false, dept: "SS", semester: "2-1" },
  // 2-1 Electives
  "AS21203": { code: "AS21203", name: "Analytical Methods in Animal Nutrition", credits: 2, isNgpa: false, dept: "AS", semester: "2-1", isElective: true },
  "BL21202": { code: "BL21202", name: "Developmental Plant Physiology", credits: 2, isNgpa: false, dept: "BL", semester: "2-1", isElective: true },
  "BL21203": { code: "BL21203", name: "Economic Botany", credits: 2, isNgpa: false, dept: "BL", semester: "2-1", isElective: true },
  "BL21204": { code: "BL21204", name: "Environmental Biology", credits: 2, isNgpa: false, dept: "BL", semester: "2-1", isElective: true },
  "CS21202": { code: "CS21202", name: "Plant Propagation and Nursery Management", credits: 2, isNgpa: false, dept: "CS", semester: "2-1", isElective: true },
  "EC21203": { code: "EC21203", name: "Human Resource Management", credits: 2, isNgpa: false, dept: "EC", semester: "2-1", isElective: true },
  "EN21203": { code: "EN21203", name: "Workshop Technology", credits: 2, isNgpa: false, dept: "EN", semester: "2-1", isElective: true },
  "EN21204": { code: "EN21204", name: "Civil Engineering for Agriculture", credits: 2, isNgpa: false, dept: "EN", semester: "2-1", isElective: true },
  "FS21202": { code: "FS21202", name: "Food Preservation Technology", credits: 2, isNgpa: false, dept: "FS", semester: "2-1", isElective: true },
  "SS21202": { code: "SS21202", name: "Geology and Geomorphology", credits: 2, isNgpa: false, dept: "SS", semester: "2-1", isElective: true },
  // 2-2 Courses
  "AS22201": { code: "AS22201", name: "Aquaculture and Fisheries Management", credits: 2, isNgpa: false, dept: "AS", semester: "2-2" },
  "AS22102": { code: "AS22102", name: "Meat Science", credits: 1, isNgpa: false, dept: "AS", semester: "2-2" },
  "AS22204": { code: "AS22204", name: "Aquatic Ecosystem Management", credits: 2, isNgpa: false, dept: "AS", semester: "2-2" },
  "BL22201": { code: "BL22201", name: "Molecular Biology and Biotechnology", credits: 2, isNgpa: false, dept: "BL", semester: "2-2" },
  "CS22201": { code: "CS22201", name: "Principles of Crop Production", credits: 2, isNgpa: false, dept: "CS", semester: "2-2" },
  "CS22202": { code: "CS22202", name: "Field Practices in Crop Production", credits: 2, isNgpa: false, dept: "CS", semester: "2-2" },
  "CS22206": { code: "CS22206", name: "Sustainable Land Use & Urban Agriculture", credits: 2, isNgpa: false, dept: "CS", semester: "2-2" },
  "EC22201": { code: "EC22201", name: "Agricultural Policy and Law", credits: 2, isNgpa: false, dept: "EC", semester: "2-2" },
  "EC22202": { code: "EC22202", name: "Business Law", credits: 2, isNgpa: false, dept: "EC", semester: "2-2" },
  "EC22203": { code: "EC22203", name: "Advanced Marketing Management", credits: 2, isNgpa: false, dept: "EC", semester: "2-2" },
  "EC22204": { code: "EC22204", name: "Cost and Management Accounting", credits: 2, isNgpa: false, dept: "EC", semester: "2-2" },
  "EC22205": { code: "EC22205", name: "Organizational Leadership", credits: 2, isNgpa: false, dept: "EC", semester: "2-2" },
  "EN22201": { code: "EN22201", name: "Irrigation & Drainage Engineering", credits: 2, isNgpa: false, dept: "EN", semester: "2-2" },
  "EN22202": { code: "EN22202", name: "Applied Hydraulics", credits: 2, isNgpa: false, dept: "EN", semester: "2-2" },
  "EN22205": { code: "EN22205", name: "Cleaner Production and Green Productivity", credits: 2, isNgpa: false, dept: "EN", semester: "2-2" },
  "EN22206": { code: "EN22206", name: "Solid Waste Management", credits: 2, isNgpa: false, dept: "EN", semester: "2-2" },
  "EN22207": { code: "EN22207", name: "Industrial Water and Wastewater Treatment", credits: 2, isNgpa: false, dept: "EN", semester: "2-2" },
  "SS22204": { code: "SS22204", name: "Soil and Water Conservation", credits: 2, isNgpa: false, dept: "SS", semester: "2-2" },
  // 2-2 Electives
  "AS22203": { code: "AS22203", name: "Poultry Science and Production", credits: 2, isNgpa: false, dept: "AS", semester: "2-2", isElective: true },
  "BL22202": { code: "BL22202", name: "Microbial Ecology", credits: 2, isNgpa: false, dept: "BL", semester: "2-2", isElective: true },
  "CS22203": { code: "CS22203", name: "Post-harvest Biology and Technology of Horticultural Crops", credits: 2, isNgpa: false, dept: "CS", semester: "2-2", isElective: true },
  "CS22204": { code: "CS22204", name: "Floriculture and Landscape Horticulture", credits: 2, isNgpa: false, dept: "CS", semester: "2-2", isElective: true },
  "CS22205": { code: "CS22205", name: "Plantation Crop Management", credits: 2, isNgpa: false, dept: "CS", semester: "2-2", isElective: true },
  "EN22203": { code: "EN22203", name: "Geoinformatics for Natural Resource Management", credits: 2, isNgpa: false, dept: "EN", semester: "2-2", isElective: true },
  "EN22204": { code: "EN22204", name: "Environmental Geotechnology", credits: 2, isNgpa: false, dept: "EN", semester: "2-2", isElective: true },
  "FS22201": { code: "FS22201", name: "Food Quality Management", credits: 2, isNgpa: false, dept: "FS", semester: "2-2", isElective: true },
  "SS22201": { code: "SS22201", name: "Soil Quality and Sustainable Agriculture", credits: 2, isNgpa: false, dept: "SS", semester: "2-2", isElective: true },
  "SS22202": { code: "SS22202", name: "Environmental Analytical Chemistry", credits: 2, isNgpa: false, dept: "SS", semester: "2-2", isElective: true },
  // 3-1 Courses
  "AS31201": { code: "AS31201", name: "Dairy Science and Technology", credits: 2, isNgpa: false, dept: "AS", semester: "3-1" },
  "CS31201": { code: "CS31201", name: "Agricultural Innovation and Technologies", credits: 2, isNgpa: false, dept: "CS", semester: "3-1" },
  "EC31201": { code: "EC31201", name: "Agribusiness Management", credits: 2, isNgpa: false, dept: "EC", semester: "3-1" },
  "EC31203": { code: "EC31203", name: "Econometrics", credits: 2, isNgpa: false, dept: "EC", semester: "3-1" },
  "EC31204": { code: "EC31204", name: "Supply Chain Management", credits: 2, isNgpa: false, dept: "EC", semester: "3-1" },
  "EC31206": { code: "EC31206", name: "International Trade and Finance", credits: 2, isNgpa: false, dept: "EC", semester: "3-1" },
  "EC31207": { code: "EC31207", name: "Green Economics", credits: 2, isNgpa: false, dept: "EC", semester: "3-1" },
  "EC31208": { code: "EC31208", name: "Green Business Development and Entrepreneurship", credits: 2, isNgpa: false, dept: "EC", semester: "3-1" },
  "EN31201": { code: "EN31201", name: "Structures and Environmental Control Engineering", credits: 2, isNgpa: false, dept: "EN", semester: "3-1" },
  "EN31206": { code: "EN31206", name: "Bio-refinery and Bio-products", credits: 2, isNgpa: false, dept: "EN", semester: "3-1" },
  "EN31207": { code: "EN31207", name: "Smart Environmental Monitoring Techniques", credits: 2, isNgpa: false, dept: "EN", semester: "3-1" },
  "EN31208": { code: "EN31208", name: "Eco-Industrial Park Development", credits: 2, isNgpa: false, dept: "EN", semester: "3-1" },
  "FS31201": { code: "FS31201", name: "Food Processing Technology", credits: 2, isNgpa: false, dept: "FS", semester: "3-1" },
  "FS31204": { code: "FS31204", name: "Green Chemistry and Bio-processing in Food Industry", credits: 2, isNgpa: false, dept: "FS", semester: "3-1" },
  "SS31201": { code: "SS31201", name: "Soil and Environmental Chemistry", credits: 2, isNgpa: false, dept: "SS", semester: "3-1" },
  // 3-1 Electives
  "AS31202": { code: "AS31202", name: "Applied Animal Breeding", credits: 2, isNgpa: false, dept: "AS", semester: "3-1", isElective: true },
  "AS31204": { code: "AS31204", name: "Livestock Environmental Management", credits: 2, isNgpa: false, dept: "AS", semester: "3-1", isElective: true },
  "BL31201": { code: "BL31201", name: "Environmental Plant Physiology", credits: 2, isNgpa: false, dept: "BL", semester: "3-1", isElective: true },
  "BL31202": { code: "BL31202", name: "Industrial Entomology", credits: 2, isNgpa: false, dept: "BL", semester: "3-1", isElective: true },
  "BL31203": { code: "BL31203", name: "Plant-microbe Interactions", credits: 2, isNgpa: false, dept: "BL", semester: "3-1", isElective: true },
  "CC31201": { code: "CC31201", name: "Database Management Systems", credits: 2, isNgpa: false, dept: "CC", semester: "3-1", isElective: true },
  "CC31202": { code: "CC31202", name: "Smart Farming Techniques and its Applications", credits: 2, isNgpa: false, dept: "CC", semester: "3-1", isElective: true },
  "CS31202": { code: "CS31202", name: "Forest Ecology and Management", credits: 2, isNgpa: false, dept: "CS", semester: "3-1", isElective: true },
  "CS31203": { code: "CS31203", name: "Plant Tissue Culture", credits: 2, isNgpa: false, dept: "CS", semester: "3-1", isElective: true },
  "CS31204": { code: "CS31204", name: "Rice Production Technology", credits: 2, isNgpa: false, dept: "CS", semester: "3-1", isElective: true },
  "CS31205": { code: "CS31205", name: "Organic Agriculture", credits: 2, isNgpa: false, dept: "CS", semester: "3-1", isElective: true },
  "EC31202": { code: "EC31202", name: "Rural Development and Empowerment", credits: 2, isNgpa: false, dept: "EC", semester: "3-1", isElective: true },
  "EC31205": { code: "EC31205", name: "Total Quality Management", credits: 2, isNgpa: false, dept: "EC", semester: "3-1", isElective: true },
  "EN31202": { code: "EN31202", name: "Designing and Installation of Micro Irrigation Systems", credits: 2, isNgpa: false, dept: "EN", semester: "3-1", isElective: true },
  "EN31203": { code: "EN31203", name: "Technical Instrumentation and Device Development", credits: 2, isNgpa: false, dept: "EN", semester: "3-1", isElective: true },
  "EN31204": { code: "EN31204", name: "Environment Information and Management", credits: 2, isNgpa: false, dept: "EN", semester: "3-1", isElective: true },
  "EN31205": { code: "EN31205", name: "Renewable Energy for Sustainable Agriculture", credits: 2, isNgpa: false, dept: "EN", semester: "3-1", isElective: true },
  "EN31209": { code: "EN31209", name: "Business Models in Resource Recovery from Waste", credits: 2, isNgpa: false, dept: "EN", semester: "3-1", isElective: true },
  "FS31202": { code: "FS31202", name: "Food Waste Management", credits: 2, isNgpa: false, dept: "FS", semester: "3-1", isElective: true },
  "FS31203": { code: "FS31203", name: "Sensory Evaluation of Food", credits: 2, isNgpa: false, dept: "FS", semester: "3-1", isElective: true },
  "FS31205": { code: "FS31205", name: "Fish, Meat and Egg Product Technology", credits: 2, isNgpa: false, dept: "FS", semester: "3-1", isElective: true },
  "SS31202": { code: "SS31202", name: "Tools for Environmental Studies", credits: 2, isNgpa: false, dept: "SS", semester: "3-1", isElective: true },
  "SS31203": { code: "SS31203", name: "Land-use Planning", credits: 2, isNgpa: false, dept: "SS", semester: "3-1", isElective: true },
  "SS31204": { code: "SS31204", name: "Soil Fertility Management", credits: 2, isNgpa: false, dept: "SS", semester: "3-1", isElective: true },
  "SS31205": { code: "SS31205", name: "Climate Change and Soil Gas Fluxes", credits: 2, isNgpa: false, dept: "SS", semester: "3-1", isElective: true },
  // 3-2 Courses
  "AS32201": { code: "AS32201", name: "Applied Livestock Production", credits: 2, isNgpa: false, dept: "AS", semester: "3-2" },
  "BL32201": { code: "BL32201", name: "Field Biology and Crop Health Management", credits: 2, isNgpa: false, dept: "BL", semester: "3-2" },
  "CC32201": { code: "CC32201", name: "Applied Statistics I", credits: 2, isNgpa: false, dept: "CC", semester: "3-2" },
  "CS32301": { code: "CS32301", name: "Production Technology of Field Crops and Vegetables", credits: 3, isNgpa: false, dept: "CS", semester: "3-2" },
  "CS32102": { code: "CS32102", name: "Protected Agriculture", credits: 1, isNgpa: false, dept: "CS", semester: "3-2" },
  "EC32201": { code: "EC32201", name: "Extension Education", credits: 2, isNgpa: false, dept: "EC", semester: "3-2" },
  "EC32202": { code: "EC32202", name: "Project Management", credits: 2, isNgpa: false, dept: "EC", semester: "3-2" },
  "EC32204": { code: "EC32204", name: "Organizational Behaviour", credits: 2, isNgpa: false, dept: "EC", semester: "3-2" },
  "EC32206": { code: "EC32206", name: "Business Start-ups", credits: 2, isNgpa: false, dept: "EC", semester: "3-2" },
  "EC32207": { code: "EC32207", name: "Financial Management", credits: 2, isNgpa: false, dept: "EC", semester: "3-2" },
  "EC32208": { code: "EC32208", name: "Environmental Impact Assessment", credits: 2, isNgpa: false, dept: "EC", semester: "3-2" },
  "EN32201": { code: "EN32201", name: "Remote Sensing and GIS for Agriculture", credits: 2, isNgpa: false, dept: "EN", semester: "3-2" },
  "EN32206": { code: "EN32206", name: "Hazardous Waste Management", credits: 2, isNgpa: false, dept: "EN", semester: "3-2" },
  "EN32207": { code: "EN32207", name: "Green Buildings and Sustainable Infrastructure", credits: 2, isNgpa: false, dept: "EN", semester: "3-2" },
  "EN32208": { code: "EN32208", name: "Environmental Modeling and Risk Assessment", credits: 2, isNgpa: false, dept: "EN", semester: "3-2" },
  "EN32209": { code: "EN32209", name: "Environmental Nanotechnology", credits: 2, isNgpa: false, dept: "EN", semester: "3-2" },
  "SS32101": { code: "SS32101", name: "Land Degradation and Watershed Management", credits: 1, isNgpa: false, dept: "SS", semester: "3-2" },
  // 3-2 Electives
  "AS32202": { code: "AS32202", name: "Non-ruminant Production and Management", credits: 2, isNgpa: false, dept: "AS", semester: "3-2", isElective: true },
  "AS32203": { code: "AS32203", name: "Ruminant Production and Management", credits: 2, isNgpa: false, dept: "AS", semester: "3-2", isElective: true },
  "BL32202": { code: "BL32202", name: "Integrated Pest Management", credits: 2, isNgpa: false, dept: "BL", semester: "3-2", isElective: true },
  "BL32203": { code: "BL32203", name: "Weed Science", credits: 2, isNgpa: false, dept: "BL", semester: "3-2", isElective: true },
  "CC32202": { code: "CC32202", name: "Computer Programming for Agricultural Sciences", credits: 2, isNgpa: false, dept: "CC", semester: "3-2", isElective: true },
  "CS32203": { code: "CS32203", name: "Commercial Fruit Production", credits: 2, isNgpa: false, dept: "CS", semester: "3-2", isElective: true },
  "CS32204": { code: "CS32204", name: "Export Agricultural Crop Production", credits: 2, isNgpa: false, dept: "CS", semester: "3-2", isElective: true },
  "CS32205": { code: "CS32205", name: "Controlled Environment Agriculture", credits: 2, isNgpa: false, dept: "CS", semester: "3-2", isElective: true },
  "EC32203": { code: "EC32203", name: "Agricultural Project Planning and Evaluation", credits: 2, isNgpa: false, dept: "EC", semester: "3-2", isElective: true },
  "EC32205": { code: "EC32205", name: "Social Entrepreneurship", credits: 2, isNgpa: false, dept: "EC", semester: "3-2", isElective: true },
  "EN32202": { code: "EN32202", name: "Precision Agriculture", credits: 2, isNgpa: false, dept: "EN", semester: "3-2", isElective: true },
  "EN32203": { code: "EN32203", name: "Groundwater Hydrology", credits: 2, isNgpa: false, dept: "EN", semester: "3-2", isElective: true },
  "EN32204": { code: "EN32204", name: "Applied Energy Management in Agriculture", credits: 2, isNgpa: false, dept: "EN", semester: "3-2", isElective: true },
  "FS32201": { code: "FS32201", name: "Dairy Processing Technology", credits: 2, isNgpa: false, dept: "FS", semester: "3-2", isElective: true },
  "FS32202": { code: "FS32202", name: "Cereal and Grain Processing", credits: 2, isNgpa: false, dept: "FS", semester: "3-2", isElective: true },
  "SS32202": { code: "SS32202", name: "Soil-water-plant Relationships", credits: 2, isNgpa: false, dept: "SS", semester: "3-2", isElective: true },
  "SS32203": { code: "SS32203", name: "Nutrient Dynamics in Tropical Soils", credits: 2, isNgpa: false, dept: "SS", semester: "3-2", isElective: true },
  // 4-1 Common Courses (ARMT & ABM)
  "CC41201": { code: "CC41201", name: "Scientific Communication and Research Methodology", credits: 2, isNgpa: false, dept: "CC", semester: "4-1" },
  "CC41202": { code: "CC41202", name: "Applied Statistics II", credits: 2, isNgpa: false, dept: "CC", semester: "4-1" },
  "CC41203": { code: "CC41203", name: "Personality and Professional Skills Development", credits: 2, isNgpa: false, dept: "CC", semester: "4-1" },
  // 4-1 Specialization Streams
  // Animal Science
  "AS41201": { code: "AS41201", name: "Applied Animal Breeding & Biotechnology", credits: 2, isNgpa: false, dept: "AS", semester: "4-1", specDept: "AS" },
  "AS41202": { code: "AS41202", name: "Feed Resource Management & Commercial Feed Manufacture", credits: 2, isNgpa: false, dept: "AS", semester: "4-1", specDept: "AS" },
  "AS41203": { code: "AS41203", name: "Dairy Farm Management and Processing Operations", credits: 2, isNgpa: false, dept: "AS", semester: "4-1", specDept: "AS" },
  // Agricultural Biology
  "BL41201": { code: "BL41201", name: "Molecular Genetics and Functional Genomics", credits: 2, isNgpa: false, dept: "BL", semester: "4-1", specDept: "BL" },
  "BL41302": { code: "BL41302", name: "Applied Entomology & Pest Surveillance", credits: 3, isNgpa: false, dept: "BL", semester: "4-1", specDept: "BL" },
  "BL41103": { code: "BL41103", name: "Plant Pathology Diagnosis & Quarantine", credits: 1, isNgpa: false, dept: "BL", semester: "4-1", specDept: "BL" },
  // Crop Science
  "CS41101": { code: "CS41101", name: "Advanced Crop Physiology", credits: 1, isNgpa: false, dept: "CS", semester: "4-1", specDept: "CS" },
  "CS41202": { code: "CS41202", name: "Commercial Floriculture and Landscape Architecture", credits: 2, isNgpa: false, dept: "CS", semester: "4-1", specDept: "CS" },
  "CS41103": { code: "CS41103", name: "Plantation Crops & Processing Technology", credits: 1, isNgpa: false, dept: "CS", semester: "4-1", specDept: "CS" },
  "CS41104": { code: "CS41104", name: "Seed Science and Technology", credits: 1, isNgpa: false, dept: "CS", semester: "4-1", specDept: "CS" },
  "CS41105": { code: "CS41105", name: "Crop Modelling and Yield Forecasting", credits: 1, isNgpa: false, dept: "CS", semester: "4-1", specDept: "CS" },
  // Agricultural Economics
  "EC41201": { code: "EC41201", name: "Agricultural Value Chain Management", credits: 2, isNgpa: false, dept: "EC", semester: "4-1", specDept: "EC" },
  "EC41202": { code: "EC41202", name: "Advanced Agribusiness Finance & Investment Analysis", credits: 2, isNgpa: false, dept: "EC", semester: "4-1", specDept: "EC" },
  "EC41203": { code: "EC41203", name: "International Trade in Agri-Food Products", credits: 2, isNgpa: false, dept: "EC", semester: "4-1", specDept: "EC" },
  // Agricultural Engineering
  "EN41201": { code: "EN41201", name: "Advanced Post-Harvest Technology and Automation", credits: 2, isNgpa: false, dept: "EN", semester: "4-1", specDept: "EN" },
  "EN41102": { code: "EN41102", name: "Advanced Irrigation Engineering & Watershed Simulation", credits: 1, isNgpa: false, dept: "EN", semester: "4-1", specDept: "EN" },
  "EN41103": { code: "EN41103", name: "Farm Power Machinery and Automation Systems", credits: 1, isNgpa: false, dept: "EN", semester: "4-1", specDept: "EN" },
  "EN41204": { code: "EN41204", name: "Geo-informatics for Land and Water Resources Management", credits: 2, isNgpa: false, dept: "EN", semester: "4-1", specDept: "EN" },
  // Food Science & Technology
  "FS41201": { code: "FS41201", name: "Food Product Development and Sensory Science", credits: 2, isNgpa: false, dept: "FS", semester: "4-1", specDept: "FS" },
  "FS41202": { code: "FS41202", name: "Food Analysis", credits: 2, isNgpa: false, dept: "FS", semester: "4-1", specDept: "FS" },
  "FS41203": { code: "FS41203", name: "Food Process Engineering", credits: 2, isNgpa: false, dept: "FS", semester: "4-1", specDept: "FS" },
  // Soil Science
  "SS41201": { code: "SS41201", name: "Soil Physics", credits: 2, isNgpa: false, dept: "SS", semester: "4-1", specDept: "SS" },
  "SS41202": { code: "SS41202", name: "Environmental Soil Chemistry", credits: 2, isNgpa: false, dept: "SS", semester: "4-1", specDept: "SS" },
  "SS41103": { code: "SS41103", name: "Soil Ecosystem & Dynamics of Organic Matter", credits: 1, isNgpa: false, dept: "SS", semester: "4-1", specDept: "SS" },
  "SS41104": { code: "SS41104", name: "Techniques in Soil Research", credits: 1, isNgpa: false, dept: "SS", semester: "4-1", specDept: "SS" },
  // GT 4-1 Courses
  "EN41205": { code: "EN41205", name: "Research Methodology and Scientific Writing", credits: 2, isNgpa: false, dept: "EN", semester: "4-1" },
  "EN41206": { code: "EN41206", name: "Process Automation and Smart Control", credits: 2, isNgpa: false, dept: "EN", semester: "4-1" },
  "EN41207": { code: "EN41207", name: "Case Studies in Environmental Technology", credits: 2, isNgpa: false, dept: "EN", semester: "4-1" },
  "EN41208": { code: "EN41208", name: "Green Behavior and Sustainable Consumption Simulation", credits: 2, isNgpa: false, dept: "EN", semester: "4-1" },
  // 4-2 Courses (All degrees)
  "AS42601": { code: "AS42601", name: "Research Project in Animal Science", credits: 6, isNgpa: false, dept: "AS", semester: "4-2" },
  "BL42601": { code: "BL42601", name: "Research Project in Agricultural Biology", credits: 6, isNgpa: false, dept: "BL", semester: "4-2" },
  "CS42601": { code: "CS42601", name: "Research Project in Crop Science", credits: 6, isNgpa: false, dept: "CS", semester: "4-2" },
  "EC42601": { code: "EC42601", name: "Research Project in Agricultural Economics & Agribusiness", credits: 6, isNgpa: false, dept: "EC", semester: "4-2" },
  "EN42601": { code: "EN42601", name: "Research Study in Agricultural Engineering / Green Technology", credits: 6, isNgpa: false, dept: "EN", semester: "4-2" },
  "FS42601": { code: "FS42601", name: "Research Study in Food Science & Technology", credits: 6, isNgpa: false, dept: "FS", semester: "4-2" },
  "SS42601": { code: "SS42601", name: "Research Study in Soil Science", credits: 6, isNgpa: false, dept: "SS", semester: "4-2" },
  "CC42301": { code: "CC42301", name: "Internship", credits: 3, isNgpa: false, dept: "CC", semester: "4-2" },
  "CC42302": { code: "CC42302", name: "Internship", credits: 3, isNgpa: false, dept: "CC", semester: "4-2" }
};
const DEGREE_COMPULSORY_COURSES = {
  ARMT: {
    "1-1": ["AS11201", "BL11301", "CC11201", "CS11201", "EC11201", "EN11201", "FS11201", "CC11202"],
    // CC11202 is NGPA
    "1-2": ["AS12301", "BL12201", "CS12201", "EC12201", "EN12201", "FS12201", "SS12301", "CC12101", "CC12202"],
    // CC12101, CC12202 are NGPA
    "2-1": ["AS21101", "AS21102", "BL21201", "BL21205", "CS21201", "EC21201", "EN21201", "FS21201", "SS21201"],
    "2-2": ["AS22201", "AS22102", "BL22201", "CS22201", "CS22202", "EC22201", "EN22201"],
    "3-1": ["AS31201", "CS31201", "EC31201", "EN31201", "FS31201", "SS31201"],
    "3-2": ["AS32201", "BL32201", "CC32201", "CS32301", "CS32102", "EC32201", "EN32201", "SS32101"],
    "4-1": ["CC41201", "CC41202", "CC41203"],
    // Common 6 cr + 6 cr spec
    "4-2": ["CC42301"]
    // + 6 cr research project
  },
  ABM: {
    "1-1": ["AS11201", "BL11301", "CC11201", "CS11201", "EC11201", "EC11202", "FS11201", "CC11202"],
    "1-2": ["AS12301", "CS12201", "EC12201", "EC12202", "EC12203", "EN12201", "FS12201", "SS12301", "CC12101", "CC12202"],
    "2-1": ["AS21102", "CS21201", "EC21201", "EC21202", "EC21204", "EC21205", "EN21201", "FS21201"],
    "2-2": ["AS22201", "CS22201", "CS22202", "EC22201", "EC22202", "EC22203", "EC22204", "EC22205"],
    "3-1": ["CS31201", "EC31201", "EC31203", "EC31204", "EC31206", "FS31201"],
    "3-2": ["CC32201", "EC32201", "EC32202", "EC32204", "EC32206", "EC32207"],
    "4-1": ["CC41201", "CC41202", "CC41203"],
    "4-2": ["CC42301"]
  },
  GT: {
    "1-1": ["CC11203", "CS11201", "EC11203", "EN11201", "EN11302", "EN11203", "EN11204", "CC11202"],
    "1-2": ["BL12202", "BL12203", "EN12202", "EN12203", "EN12204", "EN12205", "SS12301", "CC12101", "CC12202"],
    "2-1": ["CS21201", "EC21206", "EN21202", "EN21205", "EN21206", "EN21207", "EN21208", "EN21209"],
    "2-2": ["AS22204", "CS22206", "EN22201", "EN22202", "EN22205", "EN22206", "EN22207", "SS22204"],
    "3-1": ["EC31207", "EC31208", "EN31201", "EN31206", "EN31207", "EN31208", "FS31204"],
    "3-2": ["CC32201", "EC32202", "EC32208", "EN32206", "EN32207", "EN32208", "EN32209"],
    "4-1": ["CC41202", "CC41203", "EN41205", "EN41206", "EN41207", "EN41208"],
    "4-2": ["EN42601", "CC42301"]
  }
};
const SPECIALIZATION_STREAMS = {
  AS: {
    name: "Animal Science",
    dept: "AS",
    courses: ["AS41201", "AS41202", "AS41203"],
    researchCode: "AS42601"
  },
  BL: {
    name: "Agricultural Biology",
    dept: "BL",
    courses: ["BL41201", "BL41302", "BL41103"],
    researchCode: "BL42601"
  },
  CS: {
    name: "Crop Science",
    dept: "CS",
    courses: ["CS41101", "CS41202", "CS41103", "CS41104", "CS41105"],
    researchCode: "CS42601"
  },
  EC: {
    name: "Agricultural Economics & Agribusiness",
    dept: "EC",
    courses: ["EC41201", "EC41202", "EC41203"],
    researchCode: "EC42601"
  },
  EN: {
    name: "Agricultural Engineering & Environmental Technology",
    dept: "EN",
    courses: ["EN41201", "EN41102", "EN41103", "EN41204"],
    researchCode: "EN42601"
  },
  FS: {
    name: "Food Science & Technology",
    dept: "FS",
    courses: ["FS41201", "FS41202", "FS41203"],
    researchCode: "FS42601"
  },
  SS: {
    name: "Soil Science",
    dept: "SS",
    courses: ["SS41201", "SS41202", "SS41103", "SS41104"],
    researchCode: "SS42601"
  }
};
function parseCourseCode(codeStr) {
  if (!codeStr || typeof codeStr !== "string") return null;
  const clean = codeStr.trim().toUpperCase();
  const match = clean.match(/^([A-Z]{2})(\d)(\d)(\d)(\d{2})$/);
  if (!match) return null;
  const [_, dept, year, sem, credit, courseNum] = match;
  return {
    code: clean,
    dept,
    deptName: DEPARTMENTS[dept] || "Unknown Department",
    year: parseInt(year, 10),
    semester: parseInt(sem, 10),
    semesterKey: `${year}-${sem}`,
    credits: parseInt(credit, 10),
    courseNum,
    isNgpa: dept === "CC" && (courseNum === "01" || courseNum === "02" || courseNum === "03" || courseNum === "04" || courseNum === "05") && year === "1" && sem === "0" || clean === "CC11202" || clean === "CC12101" || clean === "CC12202"
  };
}
const RUHUNA_DATABASE = {
  GRADING_SCALE,
  DEPARTMENTS,
  DEGREE_INFO,
  COURSE_CATALOG,
  DEGREE_COMPULSORY_COURSES,
  SPECIALIZATION_STREAMS,
  parseCourseCode
};
if (typeof globalThis.module !== "undefined" && globalThis.module.exports) {
  globalThis.module.exports = RUHUNA_DATABASE;
}
if (typeof window !== "undefined") {
  window.RUHUNA_DATABASE = RUHUNA_DATABASE;
  Object.assign(window, RUHUNA_DATABASE);
}
