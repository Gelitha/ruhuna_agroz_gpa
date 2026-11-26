// University of Ruhuna - Faculty of Agriculture
// Bilingual (English & Natural Sinhala) Copy for Beta Testing Notice & Consent Controls

export const BETA_TEXT = {
  notice: {
    badge: 'Temporary Beta Testing Mode',
    badgeSi: 'තාවකාලික Beta පරීක්ෂණ අවධිය',
    heading: 'Your academic data stays on your device — optional temporary beta diagnostics are available.',
    headingSi: 'ඔබේ GPA දත්ත ඔබේ Browser එකේ සුරැකේ — කැමති නම් පමණක් තාවකාලික Beta පරීක්ෂණයට දායක විය හැක.',
    whatCollectedTitle: 'What is collected (only with your consent):',
    whatCollectedAnalytics:
      'Usage Analytics: anonymous browser ID, feature usage, language preference, device type, browser/OS, screen size, session timing, and sanitized error logs.',
    whatCollectedAnalyticsSi:
      'භාවිත විශ්ලේෂණ: නිර්නාමික Browser ID එක, භාවිතා කරන පහසුකම්, භාෂා තේරීම, Device වර්ගය, Browser/OS, තිරයේ ප්‍රමාණය සහ දෝෂ වාර්තා.',
    whatCollectedAcademic:
      'Academic Diagnostics: degree programme, academic year & semester, profile count, course codes & credits, confirmed/projected grades, repeat/excused status, CGPA/SGPA, target CGPA, and calculation checks.',
    whatCollectedAcademicSi:
      'අධ්‍යයන ගණනය කිරීම්: Degree Programme එක, වසර සහ Semester එක, Course codes/credits, Grades, CGPA/SGPA අගයන් සහ Target GPA සැලසුම් පරීක්ෂාව.',
    excludedNote:
      'Never collected: student names, registration numbers, backup files, credentials, or precise location.',
    excludedNoteSi:
      'කිසිවිටෙකත් ලබා නොගන්නා දත්ත: ශිෂ්‍ය නම්, Registration අංක, Backup files, මුරපද හෝ නිවැරදි ස්ථානය (Location).',
    whyTitle: 'Why & Retention:',
    whyBody:
      'Collected temporarily to find GPA calculation bugs and improve app reliability. Data is automatically retained for at most 30 days and permanently deleted after beta testing ends.',
    whyBodySi:
      'GPA ගණනය කිරීම්වල දෝෂ හඳුනාගෙන යෙදුම වැඩිදියුණු කිරීමට පමණක් තාවකාලිකව භාවිතා කෙරේ. දත්ත උපරිම දින 30ක් පමණක් තබාගෙන Beta අවධිය අවසන් වූ පසු සම්පූර්ණයෙන්ම මකා දමනු ලැබේ.',
    accessTitle: 'Who has access:',
    accessBody:
      'Only the authorized developer can view the temporary testing database. Public reads are blocked.',
    accessBodySi:
      'පරීක්ෂණ දත්ත ගබඩාවට ප්‍රවේශ විය හැක්කේ බලයලත් සංවර්ධකයාට (Developer) පමණි. බාහිර කිසිවෙකුට දත්ත බැලිය නොහැක.',
    controlTitle: 'Your control & deletion:',
    controlBody:
      'You can decline without affecting any calculator feature, change or withdraw consent anytime in Settings, or delete your submitted beta data using your Anonymous ID.',
    controlBodySi:
      'ඔබ අකමැති නම් ප්‍රතික්ෂේප කළ හැකි අතර GPA Calculator එක සම්පූර්ණයෙන්ම ක්‍රියාත්මක වේ. Settings හරහා ඕනෑම වේලාවක අවසරය ඉවත් කිරීමට හෝ යැවූ දත්ත මකා දැමීමට හැකිය.'
  },
  banner: {
    title: 'Help Improve Ruhuna Agri GPA (Beta Testing)',
    titleSi: 'Ruhuna Agri GPA වැඩිදියුණු කිරීමට උදව් වන්න (Beta පරීක්ෂණය)',
    subtitle:
      'Nothing is uploaded without your permission. Your saved records stay local on your device, and the calculator works 100% if you decline.',
    subtitleSi:
      'ඔබේ අවසරයකින් තොරව කිසිදු දත්තයක් යවන්නේ නැත. ප්‍රතික්ෂේප කළද Calculator එක සම්පූර්ණයෙන්ම භාවිතා කළ හැක.',
    analyticsLabel: 'Ordinary Usage Analytics',
    analyticsDesc: 'Feature usage, device/browser category, performance & error logs (no academic grades).',
    analyticsSi: 'සාමාන්‍ය භාවිත විශ්ලේෂණ (Grades ඇතුළත් නොවේ)',
    academicLabel: 'Detailed Academic Diagnostics',
    academicDesc: 'Anonymous course codes, credits, grades, CGPA/SGPA & target plans (no name or reg number).',
    academicSi: 'අධ්‍යයන ගණනය කිරීම් පරීක්ෂාව (නම හෝ Reg අංකය නොමැතිව)',
    acceptSelected: 'Save Preferences',
    acceptAll: 'Accept Both',
    decline: 'Decline All',
    showDetails: 'View Privacy Details',
    hideDetails: 'Hide Details'
  },
  settings: {
    sectionTitle: 'Beta Testing & Privacy Controls',
    sectionTitleSi: 'Beta පරීක්ෂණ සහ පෞද්ගලිකත්ව සැකසුම්',
    anonIdLabel: 'Anonymous Browser ID',
    anonIdHelp: 'Share this ID only if you want to request manual data deletion from the developer.',
    deleteMyData: 'Delete My Submitted Beta Data',
    deleteMyDataSi: 'මම යැවූ Beta දත්ත මකා දමන්න',
    deleteConfirm: 'Permanently delete all beta testing data submitted from this browser?',
    deleteSuccess: 'All submitted beta data for this browser has been deleted.',
    deleteError: 'Could not reach the beta server right now. You can also withdraw consent locally.',
    feedbackTitle: 'Send Beta Feedback',
    feedbackTitleSi: 'Beta අදහස් හා දෝෂ වාර්තා එවන්න',
    feedbackPlaceholder: 'Report a calculation issue, UI bug, or suggestion (please do not include your name or reg number)...',
    feedbackSubmit: 'Submit Feedback',
    feedbackThanks: 'Thank you! Your feedback has been recorded for the beta review.'
  }
} as const;
