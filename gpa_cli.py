"""
University of Ruhuna - Faculty of Agriculture
GPA Calculator & Academic Advisor (2023/24 Handbook)
Interactive CLI & Script Engine
"""

import sys
import re

GRADING_SCALE = {
    'A+': {'gpv': 4.0, 'status': 'Pass', 'marks': '>= 85%'},
    'A':  {'gpv': 4.0, 'status': 'Pass', 'marks': '80 - 84%'},
    'A-': {'gpv': 3.7, 'status': 'Pass', 'marks': '75 - 79%'},
    'B+': {'gpv': 3.3, 'status': 'Pass', 'marks': '70 - 74%'},
    'B':  {'gpv': 3.0, 'status': 'Pass', 'marks': '65 - 69%'},
    'B-': {'gpv': 2.7, 'status': 'Pass', 'marks': '60 - 64%'},
    'C+': {'gpv': 2.3, 'status': 'Pass', 'marks': '55 - 59%'},
    'C':  {'gpv': 2.0, 'status': 'Pass (Repeat Cap)', 'marks': '50 - 54%'},
    'C-': {'gpv': 1.7, 'status': 'Conditional (NGPA Pass)', 'marks': '45 - 49%'},
    'D+': {'gpv': 1.3, 'status': 'Conditional', 'marks': '40 - 44%'},
    'D':  {'gpv': 1.0, 'status': 'Conditional', 'marks': '35 - 39%'},
    'E':  {'gpv': 0.0, 'status': 'Fail (Must Repeat)', 'marks': '< 35%'}
}

DEPARTMENTS = {
    'AS': 'Department of Animal Science',
    'BL': 'Department of Agricultural Biology',
    'CS': 'Department of Crop Science',
    'EC': 'Department of Agricultural Economics & Agribusiness',
    'EN': 'Department of Agricultural Engineering & Environmental Technology',
    'FS': 'Department of Food Science & Technology',
    'SS': 'Department of Soil Science',
    'CC': 'Common / Interdisciplinary / Computer Unit'
}

DEGREE_CONFIG = {
    'ARMT': {
        'name': 'BSc Hons in Agricultural Resource Management & Technology',
        'total_min_gpa_credits': 126,
        'min_compulsory': 108,
        'min_elective': 18,
        'non_gpa': 5
    },
    'ABM': {
        'name': 'BSc Hons in Agribusiness Management',
        'total_min_gpa_credits': 125,
        'min_compulsory': 109,
        'min_elective': 16,
        'non_gpa': 5
    },
    'GT': {
        'name': 'BSc Hons in Green Technology',
        'total_min_gpa_credits': 125,
        'min_compulsory': 111,
        'min_elective': 14,
        'non_gpa': 5
    }
}

COURSE_CATALOG = {
    # Non-GPA
    'CC10001': ('General English', 0, True),
    'CC10002': ('Computer Awareness', 0, True),
    'CC10003': ('Basic Mathematics', 0, True),
    'CC10004': ('Basic Statistics', 0, True),
    'CC10005': ('Career Development and Active Citizen', 0, True),
    'CC11202': ('English I', 2, True),
    'CC12101': ('Basic Technical Writing', 1, True),
    'CC12202': ('English II', 2, True),

    # 1-1
    'AS11201': ('Anatomy and Physiology of Farm Animals', 2, False),
    'BL11301': ('Plant Physiology and Systematics', 3, False),
    'CC11201': ('Information and Communication Technology in Agriculture', 2, False),
    'CC11203': ('Information and Communication Technology', 2, False),
    'CS11201': ('Principles of Agronomy', 2, False),
    'EC11201': ('Micro Economics', 2, False),
    'EC11202': ('Economic Statistics', 2, False),
    'EC11203': ('Economic Principles', 2, False),
    'EN11201': ('Hydrology and Climatology', 2, False),
    'EN11302': ('Environmental Pollution, Toxicology and Remediation', 3, False),
    'EN11203': ('Natural and Cultural Heritage Conservation', 2, False),
    'EN11204': ('Environmental Law & Policy', 2, False),
    'FS11201': ('Biochemistry', 2, False),

    # 1-2
    'AS12301': ('Animal Nutrition, Forage & Feed Technology', 3, False),
    'BL12201': ('Entomology', 2, False),
    'BL12202': ('Biodiversity Conservation', 2, False),
    'BL12203': ('Environmental Biotechnology', 2, False),
    'CS12201': ('Agroforestry and Silviculture', 2, False),
    'EC12201': ('Macro Economics', 2, False),
    'EC12202': ('Principles of Business Management', 2, False),
    'EC12203': ('Marketing Management', 2, False),
    'EN12201': ('Agricultural Machinery Engineering', 2, False),
    'EN12202': ('Environmental Footprints', 2, False),
    'EN12203': ('Renewable Energy Systems I', 2, False),
    'EN12204': ('Climate Change Adaptation and Mitigation', 2, False),
    'EN12205': ('Green Chemistry', 2, False),
    'FS12201': ('Food Chemistry', 2, False),
    'SS12301': ('Fundamentals of Soil Science', 3, False),

    # 2-1
    'AS21101': ('Animal Genetics and Breeding', 1, False),
    'AS21102': ('Animal Products Technology', 1, False),
    'BL21201': ('Genetics and Plant Breeding', 2, False),
    'BL21205': ('Plant Pathology', 2, False),
    'CS21201': ('Agroecology', 2, False),
    'EC21201': ('Agricultural Marketing', 2, False),
    'EC21202': ('Book Keeping & Accountancy', 2, False),
    'EC21204': ('Natural Resource Economics', 2, False),
    'EC21205': ('Consumer Behavior', 2, False),
    'EC21206': ('Environmental Economics', 2, False),
    'EN21201': ('Bioprocessing and Post-harvest Engineering', 2, False),
    'EN21202': ('Ergonomics', 2, False),
    'EN21205': ('Machinery Principles and Power Units', 2, False),
    'EN21206': ('Life Cycle Assessment', 2, False),
    'EN21207': ('Renewable Energy Systems II', 2, False),
    'EN21208': ('Productivity and Quality Management', 2, False),
    'EN21209': ('Energy Audit and Energy Asset Management', 2, False),
    'FS21201': ('Food and Nutrition', 2, False),
    'SS21201': ('Soil, Plant and Environment', 2, False),

    # 2-2
    'AS22201': ('Aquaculture and Non-ruminant Management', 2, False),
    'AS22102': ('Animal Health and Hygiene', 1, False),
    'AS22204': ('Sustainable Livestock Production Systems', 2, False),
    'BL22201': ('Molecular Biology, Biotechnology, and Bioinformatics', 2, False),
    'CS22201': ('Management of Spices and Beverage Crops', 2, False),
    'CS22202': ('Fruit Crop Management', 2, False),
    'CS22206': ('Landscaping and Green Interior Design', 2, False),
    'EC22201': ('Farm Business Management', 2, False),
    'EC22202': ('Communication and Diffusion of Innovation', 2, False),
    'EC22203': ('Human Resource Management', 2, False),
    'EC22204': ('Managerial Economics and Customer Relationship Management', 2, False),
    'EC22205': ('Strategic Management', 2, False),
    'EN22201': ('GIS and Remote Sensing', 2, False),
    'EN22202': ('Precision Agricultural Technology', 2, False),
    'EN22205': ('Waste Water & Water Treatment Technologies', 2, False),
    'EN22206': ('Sustainable Solid Waste Management', 2, False),
    'EN22207': ('Industrial Resource Management and Cleaner Production', 2, False),
    'SS22204': ('Soil Biophysicochemical Dynamics and Contaminants', 2, False),

    # 3-1
    'AS31201': ('Ruminant Management', 2, False),
    'CS31201': ('Plantation Crop Management and Training', 2, False),
    'EC31201': ('Social Science Research Methods', 2, False),
    'EC31203': ('International Trade & Marketing', 2, False),
    'EC31204': ('Innovation and Knowledge Management', 2, False),
    'EC31206': ('Entrepreneurship', 2, False),
    'EC31207': ('Business Management and Entrepreneurship', 2, False),
    'EC31208': ('Eco-tourism', 2, False),
    'EN31201': ('Irrigation and Water Resources Engineering', 2, False),
    'EN31206': ('Sustainable Post Harvest Technology', 2, False),
    'EN31207': ('Environmental Monitoring and Modelling', 2, False),
    'EN31208': ('Green Infrastructure and Smart Cities', 2, False),
    'FS31201': ('Food Preservation and Processing', 2, False),
    'FS31204': ('Functional Foods and Nutraceuticals', 2, False),
    'SS31201': ('Land Resource Management', 2, False),

    # 3-2
    'AS32201': ('Applied Livestock Production', 2, False),
    'BL32201': ('Field Biology and Crop Health Management', 2, False),
    'CC32201': ('Applied Statistics I', 2, False),
    'CS32301': ('Production Technology of Field Crops and Vegetables', 3, False),
    'CS32102': ('Protected Agriculture', 1, False),
    'EC32201': ('Extension Education', 2, False),
    'EC32202': ('Project Management', 2, False),
    'EC32204': ('Organizational Behaviour', 2, False),
    'EC32206': ('Business Start-ups', 2, False),
    'EC32207': ('Financial Management', 2, False),
    'EC32208': ('Environmental Impact Assessment', 2, False),
    'EN32201': ('Applied Agricultural Engineering and Environmental Technology', 2, False),
    'EN32206': ('Disaster Management and Resilience', 2, False),
    'EN32207': ('Product Design and Development Protocols', 2, False),
    'EN32208': ('Analytical Techniques and Green Solutions', 2, False),
    'EN32209': ('Coastal and Marine Resource Management', 2, False),
    'SS32101': ('Field Practices in Soil Science', 1, False),

    # 4-1 Common
    'CC41201': ('Technical Writing and Communication Skills', 2, False),
    'CC41202': ('Applied Statistics II', 2, False),
    'CC41203': ('Professional Development', 2, False),

    # 4-2
    'CC42301': ('Internship', 3, False),
    'CC42302': ('Internship', 3, False)
}

def parse_code(code: str):
    code = code.strip().upper()
    match = re.match(r'^([A-Z]{2})(\d)(\d)(\d)(\d{2})$', code)
    if match:
        dept, yr, sem, cred, num = match.groups()
        is_ngpa = (dept == 'CC' and yr == '1' and sem == '0') or code in ['CC11202', 'CC12101', 'CC12202']
        return dept, int(yr), int(sem), int(cred), is_ngpa
    return None

def calculate_gpa(courses):
    total_credits = 0
    total_weighted = 0
    detailed_rows = []

    for c in courses:
        code = c['code']
        grade = c['grade'].upper()
        is_repeat = c.get('is_repeat', False)
        is_excused = c.get('is_excused', False)

        # Lookup catalog
        if code in COURSE_CATALOG:
            name, cred, is_ngpa = COURSE_CATALOG[code]
        else:
            p = parse_code(code)
            if p:
                _, _, _, cred, is_ngpa = p
                name = f"Course {code}"
            else:
                cred = c.get('credits', 2)
                name = c.get('name', code)
                is_ngpa = False

        if grade not in GRADING_SCALE:
            continue

        base_gpv = GRADING_SCALE[grade]['gpv']
        # Cap repeat at 2.0
        final_gpv = 2.0 if (is_repeat and not is_excused and base_gpv > 2.0) else base_gpv

        if not is_ngpa:
            weighted = cred * final_gpv
            total_credits += cred
            total_weighted += weighted
        else:
            weighted = 0.0

        detailed_rows.append({
            'code': code,
            'name': name,
            'credits': cred,
            'grade': grade,
            'is_repeat': is_repeat,
            'is_ngpa': is_ngpa,
            'gpv': final_gpv,
            'weighted': weighted
        })

    gpa = (total_weighted / total_credits) if total_credits > 0 else 0.0
    return round(gpa, 2), total_credits, total_weighted, detailed_rows

def get_class_standing(gpa):
    if gpa >= 3.70:
        return "First Class Honours"
    elif gpa >= 3.30:
        return "Second Class Upper Division Honours"
    elif gpa >= 3.00:
        return "Second Class Lower Division Honours"
    elif gpa >= 2.00:
        return "Pass"
    else:
        return "Fail / Incomplete"

def main():
    print("=" * 75)
    print(" University of Ruhuna — Faculty of Agriculture")
    print(" GPA Calculator & Academic Advisor Engine (2023/24 Handbook)")
    print("=" * 75)
    print("Degree Programmes: ARMT (126 Cr), ABM (125 Cr), GT (125 Cr)")
    print("-" * 75)

    degree = input("Select Degree [ARMT / ABM / GT] (default ARMT): ").strip().upper() or 'ARMT'
    if degree not in DEGREE_CONFIG:
        degree = 'ARMT'

    print(f"\nActive Degree: {degree} ({DEGREE_CONFIG[degree]['name']})")
    print("Enter courses below as: <CourseCode> <Grade> [optional: 'repeat'] (e.g., 'CS11201 A', 'BL11301 B+ repeat')")
    print("Press Enter on an empty line when finished:\n")

    input_courses = []
    while True:
        try:
            line = input().strip()
            if not line:
                break
            parts = line.split()
            if len(parts) >= 2:
                code = parts[0].upper()
                grade = parts[1].upper()
                is_repeat = any('rep' in p.lower() for p in parts[2:])
                input_courses.append({
                    'code': code,
                    'grade': grade,
                    'is_repeat': is_repeat
                })
        except EOFError:
            break

    if not input_courses:
        print("No courses entered. Exiting.")
        return

    gpa, credits, points, rows = calculate_gpa(input_courses)

    print("\n" + "=" * 90)
    print(f"{'Course Code':<12} {'Course Name':<38} {'Cr':<4} {'Grade':<7} {'GPV':<6} {'Points':<8}")
    print("-" * 90)
    for r in rows:
        tag = "(NGPA)" if r['is_ngpa'] else ""
        rep_tag = " (Cap C)" if r['is_repeat'] else ""
        print(f"{r['code']:<12} {r['name'][:36]:<38} {r['credits']:<4} {r['grade'] + rep_tag:<7} {r['gpv']:<6.1f} {r['weighted']:<8.1f}")
    print("-" * 90)

    standing = get_class_standing(gpa)
    print(f"Calculated GPA: {gpa:.2f} / 4.00")
    print(f"Total GPA Credits: {credits} | Total Weighted Points: {points:.1f}")
    print(f"Current Class Standing: {standing}")
    print("=" * 90)

if __name__ == '__main__':
    main()
