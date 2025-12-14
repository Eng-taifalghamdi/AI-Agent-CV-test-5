//Ghaith's change start
// training-courses-data.js
// Loads training courses from JSON file using fetch (browser-compatible)

let TRAINING_COURSES_DATABASE = null;
let loadPromise = null;

export async function loadTrainingCourses() {
  // Return cached data if already loaded
  if (TRAINING_COURSES_DATABASE) {
    return TRAINING_COURSES_DATABASE;
  }
  
  // Return existing promise if already loading
  if (loadPromise) {
    return loadPromise;
  }
  
  // Load training courses from JSON file
  loadPromise = fetch(new URL('./training_courses_500_varied.json', import.meta.url))
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load training courses: ${response.statusText}`);
      }
      return response.json();
    })
    .then((coursesJson) => {
      TRAINING_COURSES_DATABASE = coursesJson.map((course, index) => ({
        id: `training_${index + 1}_${(course["Training Course Title"] || "")
          .replace(/\s+/g, "_")
          .toLowerCase()
          .slice(0, 30)}`,
        name: (course["Training Course Title"] || "").trim(),
        nameAr: (course["اسم الدورة التدريبية"] || "").trim(),
        overview: (course["Overview"] || "").trim(),
        overviewAr: (course["نبذة تعريفية"] || "").trim(),
        objective: (course["Objective"] || "").trim(),
        objectiveAr: (course["الهدف"] || "").trim(),
        targetAudience: (course["Target Audience"] || "").trim(),
        targetAudienceAr: (course["الفئة المستهدفة"] || "").trim(),
        level: (course["Training Level"] || "").trim(),
        levelAr: (course["مستوى الدورة"] || "").trim(),
        previousRequirements: (course["Previous Requirements"] || "").trim(),
        previousRequirementsAr: (course["المتطلبات السابقة"] || "").trim(),
        trainingLanguage: (course["Training Language"] || "").trim(),
        trainingLanguageAr: (course["لغة التدريب"] || "").trim(),
        fieldEn: (course["Training Field"] || "").trim(),
        fieldAr: (course["مجال التدريب"] || "").trim(),
        totalHours: course["Total Hours"] || course["عدد الساعات"] || 0,
        trainingType: (course["Training Type "] || "").trim(),
        trainingTypeAr: (course["نوع التدريب"] || "").trim(),
        // Keep original field names for compatibility
        "Training Course Title": (course["Training Course Title"] || "").trim(),
        "اسم الدورة التدريبية": (course["اسم الدورة التدريبية"] || "").trim(),
        "Total Hours": course["Total Hours"] || course["عدد الساعات"] || 0
      }));
      return TRAINING_COURSES_DATABASE;
    })
    .catch((err) => {
      console.error("Error loading training courses:", err);
      loadPromise = null; // Reset promise on error so we can retry
      return [];
    });
  
  return loadPromise;
}

// Export getter that ensures training courses are loaded
export function getTrainingCoursesDatabase() {
  return TRAINING_COURSES_DATABASE || [];
}
//Ghaith's change end
