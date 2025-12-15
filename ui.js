// ui.js
// Entry point: wires DOM events, dynamic rules UI, and coordinates modules.

import {
  DEFAULT_RULES,
  DEFAULT_RULES_EN,
  DEFAULT_RULES_AR,
  getDefaultRules,
  getFinalCertificateCatalog,
  //Ghaith's change start
  getFinalTrainingCoursesCatalog,
  //Ghaith's change end
} from "./constants.js";

import {
  saveChatHistory,
  loadChatHistory,
  saveUserRules,
  loadUserRules,
  saveLastRecommendations,
  loadLastRecommendations,
  loadCertificateCatalog,
  //Ghaith's change start
  loadTrainingCoursesCatalog,
  //Ghaith's change end
  calculateTotalExperience,
  calculateYearsFromPeriod,
} from "./storage-catalog.js";

import {
  addMessage,
  showTypingIndicator,
  hideTypingIndicator,
  buildChatSystemPrompt,
  buildChatContextMessage,
  extractTextFromFile,
  parseCvIntoStructuredSections,
  parseAndApplyRules,
  analyzeCvsWithAI,
  displayRecommendations,
  callGeminiAPI,
  analyzeSingleCvWithAI, 
} from "./ai.js";

// --- GLOBAL STATE ---
let currentLang = 'en';
let uploadedCvs = [];
let submittedCvData = [];
let allRecommendationsMap = {};
let lastRecommendations = { candidates: [] }; 
let userRules = [];

// --- TRANSLATION DICTIONARY ---
const UI_TEXT = {
  en: {
    // App Strings
    appTitle: "SkillMatch Pro",
    tagline: "AI-powered training and certification recommendations",
    chatTitle: "Chat Assistant",
    chatPlaceholder: "Ask about training programs, upload CVs, or set rules...",
    uploadTitle: "Upload CVs",
    dragDrop: "Drag & drop CV files here or click to browse",
    rulesTitle: "Business Rules",
    optional: "Optional",
    addRule: "Add Rule",
    generateBtn: "Generate Recommendations",
    uploadedCvs: "Uploaded CVs",
    reviewTitle: "CV Analysis Review",
    searchCv: "Search CV by name...",
    submit: "Submit",
    recommendationsTitle: "Recommendations",

    downloadBtn: "Download Recommendations (PDF)",
    welcomeMessage: `Hello! I'm your training and certification assistant. I can help you:
      <ul>
        <li>Discuss training programs and certificates</li>
        <li>Analyze CVs for suitable recommendations</li>
        <li>Adjust recommendations based on your business rules</li>
      </ul>
      How can I help you today?`,
    toggleBtnText: "العربية",
    enterRule: "Enter a business rule...",
    
    // Timeline Text
    estTime: "Estimated time to complete:",
    total: "Total",
    hours: "hours",
    na: "N/A",
    rulesApplied: "Rules:",

    // CV Field Labels
    experience: "Experience",
    education: "Education",
    certifications: "Certifications",
    skills: "Skills",
    jobTitle: "Job Title",
    company: "Company Name",
    description: "Description",
    years: "Years",
    degree: "Degree and Field of study",
    school: "School",
    certification: "Certification",
    skill: "Skill",
    add: "+ Add",
    submitSingle: "Submit CV",
    submitAll: "Submit all CVs",
    
    // PDF Specific
    pdfTitle: "Training & Certification Recommendations",
    pdfGeneratedOn: "Generated on",
    pdfCandidate: "Candidate",
    pdfFile: "File"
  },
  ar: {
    // App Strings
    appTitle: "SkillMatch Pro",
    tagline: "توصيات التدريب والشهادات المدعومة بالذكاء الاصطناعي",
    chatTitle: "المساعد الذكي",
    chatPlaceholder: "اسأل عن البرامج، ارفع السير الذاتية...",
    uploadTitle: "رفع السير الذاتية",
    dragDrop: "اسحب وأفلت الملفات هنا أو انقر للتصفح",
    rulesTitle: "قواعد العمل",
    optional: "اختياري",
    addRule: "إضافة قاعدة",
    generateBtn: "إصدار التوصيات",
    uploadedCvs: "السير الذاتية المرفوعة",
    reviewTitle: "مراجعة التحليل",
    searchCv: "بحث عن السيرة الذاتية...",
    submit: "إرسال",
    recommendationsTitle: "التوصيات",
    downloadBtn: "تحميل التوصيات (PDF)",
    welcomeMessage: `مرحباً! أنا مساعد التدريب والشهادات الخاص بك. يمكنني مساعدتك في:
      <ul>
        <li>مناقشة البرامج التدريبية والشهادات</li>
        <li>تحليل السيرة الذاتية للحصول على توصيات مناسبة</li>
        <li>تعديل التوصيات بناءً على قواعد عملك</li>
      </ul>
      كيف يمكنني مساعدتك اليوم؟`,
    toggleBtnText: "English",
    enterRule: "أدخل قاعدة عمل...",

    // Timeline Text
    estTime: "الوقت التقديري لإكمال الشهادة:",
    total: "الإجمالي",
    hours: "ساعة",
    na: "غير متوفر",
    rulesApplied: "القواعد المطبقة:",

    // CV Field Labels
    experience: "الخبرة المهنية",
    education: "التعليم",
    certifications: "الشهادات",
    skills: "المهارات",
    jobTitle: "المسمى الوظيفي",
    company: "اسم الشركة",
    description: "الوصف",
    years: "السنوات",
    degree: "الدرجة ومجال الدراسة",
    school: "الجامعة / المدرسة",
    certification: "اسم الشهادة",
    skill: "المهارة",
    add: "+ إضافة",
    submitSingle: "إرسال السيرة الذاتية",
    submitAll: "إرسال جميع السير الذاتية",

    // PDF Specific
    pdfTitle: "توصيات التدريب والشهادات",
    pdfGeneratedOn: "تم الإصدار في",
    pdfCandidate: "المرشح",
    pdfFile: "الملف"
  }
};

const STATUS_MESSAGES = {
  en: {
    analyzing: "Parsing details in background...",
    extracting: "Reading files...",
    parsing: "Parsing CV into sections...",
    success: "Files ready! You can generate recommendations now.",
    error: "Failed to read files.",
    selectFile: "Please select at least one CV file.",
    generating: "Generating recommendations...",
    genSuccess: "Recommendations generated successfully!",
    rulesSaved: "Rules saved successfully.",
    rulesCleared: "Rules cleared.",
    completedCVs: "Completed CVs."
  },
  ar: {
    analyzing: "جاري تحليل التفاصيل في الخلفية...",
    extracting: "جاري قراءة الملفات...",
    parsing: "جاري تقسيم السيرة الذاتية إلى أقسام...",
    success: "الملفات جاهزة! يمكنك إصدار التوصيات الآن.",
    error: "فشل في قراءة الملفات.",
    selectFile: "يرجى اختيار ملف سيرة ذاتية واحد على الأقل.",
    generating: "جاري إصدار التوصيات...",
    genSuccess: "تم إصدار التوصيات بنجاح!",
    rulesSaved: "تم حفظ القواعد بنجاح.",
    rulesCleared: "تم مسح القواعد.",
    completedCVs: "تم الانتهاء من السير الذاتية."
  }
};

function getStatusText(key) {
  return STATUS_MESSAGES[currentLang][key] || STATUS_MESSAGES['en'][key];
}

function getUiText(key) {
  return UI_TEXT[currentLang][key] || UI_TEXT['en'][key];
}

// ===========================================================================
// LANGUAGE HANDLING
// ===========================================================================

// 14-12-2025 Starting Taif's updates
function updateLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;

  if (lang === 'ar') {
    document.body.classList.add('keep-ltr-layout');
    document.body.classList.remove('ltr-layout');
  } else {
    document.body.classList.add('ltr-layout');
    document.body.classList.remove('keep-ltr-layout');
  }

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (el && UI_TEXT[lang][key]) {
      const icon = el.querySelector('i');
      if (icon) {
        const iconClone = icon.cloneNode(true);
        el.textContent = " " + UI_TEXT[lang][key];
        el.prepend(iconClone);
      } else {
        el.textContent = UI_TEXT[lang][key];
      }
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (el && UI_TEXT[lang][key]) {
      el.placeholder = UI_TEXT[lang][key];
    }
  });

  const langTextSpan = document.getElementById('lang-text');
  if (langTextSpan) langTextSpan.textContent = UI_TEXT[lang].toggleBtnText;

  const chatMessages = document.getElementById("chat-messages");
  if (chatMessages) {
    const firstMsg = chatMessages.querySelector('.bot-message');
    if (chatMessages.children.length === 1 && firstMsg) {
      firstMsg.innerHTML = UI_TEXT[lang].welcomeMessage;
    }
  }

  const currentRulesFromUI = getRulesFromUI();
  const prevLang = lang === 'en' ? 'ar' : 'en';
  const prevDefaults = prevLang === 'en' ? DEFAULT_RULES_EN : DEFAULT_RULES_AR;
  const newDefaults = lang === 'en' ? DEFAULT_RULES_EN : DEFAULT_RULES_AR;

  const isUsingDefaults = JSON.stringify(currentRulesFromUI) === JSON.stringify(prevDefaults);

  if (isUsingDefaults) {
    userRules = [...newDefaults];
    initializeRulesUI(userRules);
    saveUserRules(userRules);
  } else {
    const ruleInputs = document.querySelectorAll('.rule-input');
    ruleInputs.forEach(input => {
      input.placeholder = UI_TEXT[lang].enterRule;
    });
  }

  if (submittedCvData.length > 0) {
    renderSubmittedCvBubbles(submittedCvData);
  }

  const recommendationsContainer = document.getElementById("recommendations-container");
  const resultsSection = document.getElementById("results-section");

  if (
    recommendationsContainer &&
    lastRecommendations &&
    lastRecommendations.candidates &&
    lastRecommendations.candidates.length > 0
  ) {
    recommendationsContainer.innerHTML = `<div class="loader"></div>`;

    (async () => {
      try {
        const { translateRecommendations } = await import("./ai.js");
        const translatedRecommendations = await translateRecommendations(lastRecommendations, lang);

        lastRecommendations = translatedRecommendations;
        saveLastRecommendations(lastRecommendations);

        recommendationsContainer.innerHTML = "";
        displayRecommendations(translatedRecommendations, recommendationsContainer, resultsSection, lang);
      } catch (err) {
        recommendationsContainer.innerHTML = "";
        displayRecommendations(lastRecommendations, recommendationsContainer, resultsSection, lang);
      }
    })();
  }
}
// 14-12-2025 Ending Taif's updates

function initializeLanguage() {
  const toggleBtn = document.getElementById('language-toggle');
  updateLanguage('en');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'en' ? 'ar' : 'en';
      updateLanguage(newLang);
    });
  }
}

// ===========================================================================
// Rules UI
// ===========================================================================

function createRuleInput(ruleText = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "rule-input-wrapper";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = getUiText('enterRule');
  input.value = ruleText;
  input.className = "rule-input";

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "delete-rule-btn";
  deleteBtn.innerHTML = "×";
  deleteBtn.title = "Delete this rule";

  deleteBtn.addEventListener("click", (e) => {
    e.preventDefault();
    wrapper.remove();
  });

  wrapper.appendChild(input);
  wrapper.appendChild(deleteBtn);
  return wrapper;
}

function initializeRulesUI(rules) {
  const container = document.getElementById("rules-container");
  if (!container) return;

  const statusOverlay = container.querySelector("#rules-status");
  container.innerHTML = "";
  if (statusOverlay) {
    container.appendChild(statusOverlay);
  }

  if (rules && rules.length > 0) {
    rules.forEach((rule) => {
      container.appendChild(createRuleInput(rule));
    });
  } else {
    container.appendChild(createRuleInput());
  }
}

function getRulesFromUI() {
  const container = document.getElementById("rules-container");
  if (!container) return [];

  const inputs = container.querySelectorAll(".rule-input");
  const rules = [];
  inputs.forEach((input) => {
    const value = input.value.trim();
    if (value) {
      rules.push(value);
    }
  });
  return rules;
}

// 14-12-2025 Starting Taif's updates
function updateGenerateButton(uploadedCvs) {
  const generateBtn = document.getElementById("generate-recommendations-btn");
  const fileInput = document.getElementById("file-input");
  if (generateBtn) {
    const hasFiles = fileInput && fileInput.files && fileInput.files.length > 0;
    const hasCvs = uploadedCvs.length > 0;
    generateBtn.disabled = !hasFiles && !hasCvs;
  }
}
// 14-12-2025 Ending Taif's updates

// ---------------------------------------------------------------------------
// Candidate Card Creation (With Timeline)
// ---------------------------------------------------------------------------
function createCandidateCard(candidateData, language = 'en') {
  const catalog = getFinalCertificateCatalog();
  //Ghaith's change start
  const trainingCatalog = getFinalTrainingCoursesCatalog();
  //Ghaith's change end
  const candidateDiv = document.createElement("div");
  candidateDiv.className = "candidate-result";
  candidateDiv.style.opacity = "0"; 
  candidateDiv.style.animation = "slideIn 0.5s forwards"; 

  let displayCandidateName = candidateData.candidateName;
  if (!displayCandidateName || displayCandidateName === "N/A" || displayCandidateName === "n/a") {
      displayCandidateName = candidateData.cvName || (language === 'ar' ? "مرشح" : "Candidate");
  }

  const nameDiv = document.createElement("h3");
  nameDiv.className = "candidate-name";
  nameDiv.textContent = displayCandidateName;
  candidateDiv.appendChild(nameDiv);

  if (candidateData.cvName && candidateData.cvName !== displayCandidateName) {
    const fileDiv = document.createElement("div");
    fileDiv.className = "candidate-cv-name";
    fileDiv.textContent = `File: ${candidateData.cvName}`;
    candidateDiv.appendChild(fileDiv);
  }

  // 14-12-2025 Taif's intro in main UI cards as well
  const introDiv = document.createElement("div");
  introDiv.className = "recommendation-intro";

  let introText =
    candidateData.recommendationIntro ||
    candidateData.recommendationSummary ||
    "";

  if (!introText) {
    if (language === "ar") {
      introText =
        "هذا دور مهم ويتطلب خبرة قوية على المستوى الاستراتيجي. بناءً على خبرات المرشح الحالية ودوره المستهدف، تم ترشيح الشهادات التالية لأنها تعزز المهارات الأساسية وتدعم التقدّم المهني.";
    } else {
      introText =
        "This is a senior and critical role that requires strong strategic capability. Based on the candidate's background and target responsibilities, the following certifications are recommended to strengthen core skills and support career growth.";
    }
  }

  introDiv.textContent = introText;
  candidateDiv.appendChild(introDiv);

  //Ghaith's change start
  // ========== CERTIFICATES SUBSECTION ==========
  const certificatesSubsection = document.createElement("div");
  certificatesSubsection.className = "recommendations-subsection";
  const certTitle = document.createElement("h4");
  certTitle.className = "subsection-title";
  certTitle.textContent = language === "ar" ? "الشهادات" : "Certificates";
  certificatesSubsection.appendChild(certTitle);

  const certTimeline = [];
  let certTotalHours = 0;
  //Ghaith's change end

  if (candidateData.recommendations && candidateData.recommendations.length > 0) {
    candidateData.recommendations.forEach((rec) => {
      let displayName = rec.certName;
      let catalogEntry = null;

      // Try to find catalog entry to translate name
      if (catalog) {
        catalogEntry = catalog.find(c => c.id === rec.certId) ||
          catalog.find(c =>
            c.name === rec.certName ||
            c.Certificate_Name_EN === rec.certName
          );
      }

      if (language === 'ar') {
        if (catalogEntry && catalogEntry.nameAr) displayName = catalogEntry.nameAr;
      }

      // Timeline Data Collection
      let hours = catalogEntry?.Estimated_Hours_To_Complete || catalogEntry?.estimatedHours || 0;
      hours = Number(hours) || 0;
      //Ghaith's change start
      certTimeline.push({ name: displayName, hours });
      certTotalHours += hours;
      //Ghaith's change end

      const hourWord = getUiText('hours');
      const hoursText = hours > 0 ? `${hours} ${hourWord}` : getUiText('na');

      const card = document.createElement("div");
      card.className = "recommendation-card";
      card.innerHTML = `
        <div class="recommendation-title">${displayName}</div>
        <div class="recommendation-reason">
          <i class="fas fa-lightbulb"></i> ${rec.reason}
        </div>
        <div class="recommendation-hours">
          <i class="far fa-clock"></i>
          <span>${getUiText('estTime')}</span>
          <strong>${hoursText}</strong>
          ${rec.rulesApplied && rec.rulesApplied.length > 0
              ? `<span class="recommendation-rule-inline"><i class="fas fa-gavel"></i> ${getUiText('rulesApplied')} ${rec.rulesApplied.join(", ")}</span>`
              : ""
          }
        </div>
      `;
      //Ghaith's change start
      certificatesSubsection.appendChild(card);
      //Ghaith's change end
    });
  } else {
    const msg = document.createElement("p");
    msg.textContent = candidateData.error || (language === 'ar' ? "لم يتم العثور على توصيات." : "No specific recommendations found.");
    //Ghaith's change start
    certificatesSubsection.appendChild(msg);
    //Ghaith's change end
  }

  //Ghaith's change start
  // Certificates Timeline
  if (certTimeline.length > 0 && certTotalHours > 0) {
    const timelineWrapper = document.createElement("div");
    timelineWrapper.className = "timeline-wrapper";

    //Ghaith's change start - make timeline more compact by including total in title
    const hourWord = getUiText('hours');
    const isArabic = language === "ar";
    const baseTitleText = language === "ar" ? "الوقت التقريبي لإكمال الشهادات المقترحة" : "Estimated timeline to complete recommended certificates";
    const titleText = `${baseTitleText} (${getUiText('total')}: ${certTotalHours} ${hourWord})`;
    //Ghaith's change end

    // Helper color function
    function getColor(hours) {
      if (hours <= 100) return "#c8f7c5"; // Greenish
      if (hours < 200) return "#ffe5b4";  // Yellowish
      return "#f5b5b5";                   // Reddish
    }

    const barsHtml = `
      <div class="stacked-bar ${isArabic ? "stacked-bar-rtl" : ""}">
        ${certTimeline.map((item) => {
          const safeHours = Number(item.hours) || 0;
          const percentage = safeHours > 0 ? (safeHours / certTotalHours) * 100 : 0;
          const displayHours = `${safeHours} ${hourWord}`;
          const color = getColor(safeHours);

          return `
              <div class="bar-segment" style="width:${percentage}%; background:${color}" title="${item.name}: ${displayHours}">
                <span class="segment-hours">${safeHours > 0 ? safeHours : ''}</span>
              </div>
            `;
        }).join("")}
      </div>

      <div class="stacked-labels ${isArabic ? "stacked-labels-rtl" : ""}">
        ${certTimeline.map((item) => {
          const safeHours = Number(item.hours) || 0;
          const percentage = safeHours > 0 ? (safeHours / certTotalHours) * 100 : 0;
          if (percentage < 5) return ""; // Hide label if too small
          return `
              <div class="segment-label" style="width:${percentage}%">
                ${item.name}
              </div>
            `;
        }).join("")}
      </div>
    `;

    //Ghaith's change start - remove total row, total now in title
    timelineWrapper.innerHTML = `
      <h4 class="timeline-title ${isArabic ? "timeline-title-rtl" : ""}">${titleText}</h4>
      <div class="stacked-timeline ${isArabic ? "stacked-timeline-rtl" : ""}">
        ${barsHtml}
      </div>
    `;
    //Ghaith's change end
    certificatesSubsection.appendChild(timelineWrapper);
  }
  candidateDiv.appendChild(certificatesSubsection);

  // ========== TRAINING COURSES SUBSECTION ==========
  const trainingSubsection = document.createElement("div");
  trainingSubsection.className = "recommendations-subsection";
  const trainingTitle = document.createElement("h4");
  trainingTitle.className = "subsection-title";
  trainingTitle.textContent = language === "ar" ? "الدورات التدريبية" : "Training Courses";
  trainingSubsection.appendChild(trainingTitle);

  const trainingTimeline = [];
  let trainingTotalHours = 0;

  if (candidateData.trainingCourses && candidateData.trainingCourses.length > 0) {
    candidateData.trainingCourses.forEach((rec) => {
      let displayName = rec.courseName;
      let catalogEntry = null;

      if (trainingCatalog) {
        catalogEntry = trainingCatalog.find(c => c.id === rec.courseId) ||
          trainingCatalog.find(c => c.name === rec.courseName) ||
          trainingCatalog.find(c => c["Training Course Title"] === rec.courseName) ||
          trainingCatalog.find(c => c.nameAr === rec.courseName) ||
          trainingCatalog.find(c => c["اسم الدورة التدريبية"] === rec.courseName);
      }

      if (language === 'ar') {
        if (catalogEntry && catalogEntry.nameAr) displayName = catalogEntry.nameAr;
      }

        //Ghaith's change start - training hours (prefer rec, then catalog) to avoid N/A
        let hours = 0;
        if (rec && (rec.hours || rec.totalHours || rec.estimatedHours)) {
          hours = rec.hours || rec.totalHours || rec.estimatedHours || 0;
        }
        if (hours === 0 && catalogEntry) {
          hours = catalogEntry.totalHours || 
                  catalogEntry["Total Hours"] || 
                  catalogEntry["عدد الساعات"] || 
                  0;
        }
        hours = Number(hours) || 0;
        //Ghaith's change end
      trainingTimeline.push({ name: displayName, hours });
      trainingTotalHours += hours;

      const hourWord = getUiText('hours');
      const hoursText = hours > 0 ? `${hours} ${hourWord}` : getUiText('na');

      const card = document.createElement("div");
      card.className = "recommendation-card";
      //Ghaith's change start
      card.innerHTML = `
        <div class="recommendation-title">${displayName}</div>
        <div class="recommendation-reason">
          <i class="fas fa-lightbulb"></i> ${rec.reason}
        </div>
        <div class="recommendation-hours">
          <i class="far fa-clock"></i>
          <span>${getUiText('estTime')}</span>
          <strong>${hoursText}</strong>
          ${rec.rulesApplied && rec.rulesApplied.length > 0
              ? `<span class="recommendation-rule-inline"><i class="fas fa-gavel"></i> ${getUiText('rulesApplied')} ${rec.rulesApplied.join(", ")}</span>`
              : ""
          }
        </div>
      `;
      //Ghaith's change end
      trainingSubsection.appendChild(card);
    });
  } else {
    const msg = document.createElement("p");
    msg.textContent = language === 'ar' ? "لا توجد توصيات للدورات التدريبية." : "No training course recommendations found.";
    trainingSubsection.appendChild(msg);
  }

  // Training Timeline
  if (trainingTimeline.length > 0 && trainingTotalHours > 0) {
    const timelineWrapper = document.createElement("div");
    timelineWrapper.className = "timeline-wrapper";

    //Ghaith's change start - make timeline more compact by including total in title
    const hourWord = getUiText('hours');
    const isArabic = language === "ar";
    const baseTitleText = language === "ar" ? "الوقت التقريبي لإكمال الدورات التدريبية المقترحة" : "Estimated timeline to complete recommended training courses";
    const titleText = `${baseTitleText} (${getUiText('total')}: ${trainingTotalHours} ${hourWord})`;
    //Ghaith's change end

    // Helper color function
    function getColor(hours) {
      if (hours <= 100) return "#c8f7c5"; // Greenish
      if (hours < 200) return "#ffe5b4";  // Yellowish
      return "#f5b5b5";                   // Reddish
    }

    const barsHtml = `
      <div class="stacked-bar ${isArabic ? "stacked-bar-rtl" : ""}">
        ${trainingTimeline.map((item) => {
          const safeHours = Number(item.hours) || 0;
          const percentage = safeHours > 0 ? (safeHours / trainingTotalHours) * 100 : 0;
          const displayHours = `${safeHours} ${hourWord}`;
          const color = getColor(safeHours);

          return `
              <div class="bar-segment" style="width:${percentage}%; background:${color}" title="${item.name}: ${displayHours}">
                <span class="segment-hours">${safeHours > 0 ? safeHours : ''}</span>
              </div>
            `;
        }).join("")}
      </div>

      <div class="stacked-labels ${isArabic ? "stacked-labels-rtl" : ""}">
        ${trainingTimeline.map((item) => {
          const safeHours = Number(item.hours) || 0;
          const percentage = safeHours > 0 ? (safeHours / trainingTotalHours) * 100 : 0;
          if (percentage < 5) return ""; // Hide label if too small
          return `
              <div class="segment-label" style="width:${percentage}%">
                ${item.name}
              </div>
            `;
        }).join("")}
      </div>
    `;

    //Ghaith's change start - remove total row, total now in title
    timelineWrapper.innerHTML = `
      <h4 class="timeline-title ${isArabic ? "timeline-title-rtl" : ""}">${titleText}</h4>
      <div class="stacked-timeline ${isArabic ? "stacked-timeline-rtl" : ""}">
        ${barsHtml}
      </div>
    `;
    //Ghaith's change end
    trainingSubsection.appendChild(timelineWrapper);
  }
  candidateDiv.appendChild(trainingSubsection);
  //Ghaith's change end

  return candidateDiv;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function updateStatus(element, messageKey, isError = false, rawText = null) {
  if (!element) return;
  const text = rawText || getStatusText(messageKey) || messageKey;

  element.innerHTML = `
    <div class="status-message ${isError ? "status-error" : "status-success"}">
      ${text}
    </div>
  `;
  setTimeout(() => { element.innerHTML = ""; }, 8000);
}

function showLoading(element, messageKey, rawText = null) {
  if (!element) return;
  const text = rawText || getStatusText(messageKey) || messageKey;
  element.innerHTML = `<div class="loader"></div>${text}`;
}

function hideLoading(element) {
  if (!element) return;
  element.innerHTML = "";
}

function clearChatHistoryDom() {
  const chatMessages = document.getElementById("chat-messages");
  if (chatMessages) {
    chatMessages.innerHTML = `<div class="message bot-message">${getUiText('welcomeMessage')}</div>`;
  }
}

function updateDownloadButtonVisibility(recommendations) {
  const downloadBtn = document.getElementById("download-recommendations-btn");
  if (!downloadBtn) return;

  if (!recommendations || !recommendations.candidates || recommendations.candidates.length === 0) {
    downloadBtn.classList.add("hidden");
  } else {
    downloadBtn.classList.remove("hidden");
  }
}

function downloadRecommendationsAsPDF(recommendations, language = 'en') {
  if (!recommendations || !recommendations.candidates || recommendations.candidates.length === 0) {
    const message = language === 'ar' ? 'لا توجد توصيات للتحميل.' : 'No recommendations to download.';
    alert(message);
    return;
  }

  if (typeof html2pdf === 'undefined') {
    const err = language === 'ar' ? "لم يتم العثور على مكتبة PDF." : "PDF library not found.";
    alert(err);
    return;
  }

  // --- PDF GENERATION LOGIC ---
  const catalog = getFinalCertificateCatalog();
  //Ghaith's change start
  const trainingCatalog = getFinalTrainingCoursesCatalog();
  //Ghaith's change end
  const isArabic = language === 'ar';
  
  // 1. Create a container for the PDF content
  const pdfContainer = document.createElement('div');
  pdfContainer.className = 'pdf-content';
  //Ghaith's change start - remove top spacing so header is at very top of page
  pdfContainer.style.marginTop = '0';
  pdfContainer.style.paddingTop = '0';
  //Ghaith's change end
  if (isArabic) {
    pdfContainer.style.direction = 'rtl';
    pdfContainer.style.textAlign = 'right';
    pdfContainer.style.fontFamily = "'Cairo', sans-serif"; 
  } else {
    pdfContainer.style.fontFamily = "'Roboto', sans-serif";
  }

  // 2. Add Header (match UI header styling)
  //Ghaith's change start
  const header = document.createElement('div');
  header.className = 'pdf-header';
  //Ghaith's change start - ensure recommendations appear directly under header on same page, header at very top
  header.style.pageBreakAfter = 'avoid';
  header.style.breakAfter = 'avoid';
  header.style.marginTop = '0';
  header.style.marginBottom = '0';
  header.style.paddingTop = '0';
  header.style.paddingBottom = '0';
  //Ghaith's change end
  const now = new Date().toLocaleDateString(isArabic ? 'ar-SA' : 'en-US');
  
  const titleText = UI_TEXT[language].pdfTitle;
  const generatedText = UI_TEXT[language].pdfGeneratedOn;
  
  // Reuse the same brand logo SVG as the main UI header for visual consistency
  header.innerHTML = `
    <div style="
      background: linear-gradient(90deg, #15878A, #007D89);
      color: #fff;
      padding: 16px 18px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.08);
      margin-bottom: 0;
    ">
      <div style="display:flex; align-items:center; gap:10px; font-size:18px; font-weight:700;">
        <!-- 14-12-2025 Taif's brand logo reused in PDF header -->
        <svg xmlns="http://www.w3.org/2000/svg" width="68" height="32" viewBox="0 0 86 40" fill="none" class="brand-logo">
          <path d="M1.38806 18.0754C1.15332 18.0754 0.979388 17.9014 0.979388 17.6667C0.979388 17.4319 1.15332 17.2579 1.38806 17.2579C1.6228 17.2579 1.78883 17.4319 1.78883 17.6667C1.78883 17.9014 1.6228 18.0754 1.38806 18.0754ZM2.87354 17.6667C2.87354 17.4319 2.70751 17.2579 2.47278 17.2579C2.23804 17.2579 2.06411 17.4319 2.06411 17.6667C2.06411 17.9014 2.23804 18.0754 2.47278 18.0754C2.70751 18.0754 2.87354 17.9014 2.87354 17.6667ZM5.88858 23.3449C5.65384 23.3449 5.47991 23.5189 5.47991 23.7536C5.47991 23.9884 5.65384 24.1624 5.88858 24.1624C6.12332 24.1624 6.28935 23.9884 6.28935 23.7536C6.28935 23.5189 6.12332 23.3449 5.88858 23.3449ZM4.80406 23.3449C4.56932 23.3449 4.39519 23.5189 4.39519 23.7536C4.39519 23.9884 4.56932 24.1624 4.80406 24.1624C5.0388 24.1624 5.20463 23.9884 5.20463 23.7536C5.20463 23.5189 5.0388 23.3449 4.80406 23.3449ZM4.61375 22.6407H4.40329C3.70718 22.6407 3.15262 22.5476 2.89765 22.1024C2.66292 22.2076 2.27039 22.3452 1.74021 22.3452C0.898397 22.3452 0 21.9364 0 20.6859C0 19.5729 0.720391 18.9294 1.91431 18.9294H3.48872V21.3901C3.48872 21.9203 3.75981 22.0579 4.4276 22.0579H4.49637C5.22486 22.0579 5.58109 21.7543 5.58109 21.0137V18.9253H6.2852V21.1432C6.2852 22.1428 5.72672 22.6366 4.60565 22.6366M2.77236 19.496H1.99118C1.33149 19.496 0.696006 19.6781 0.696006 20.6778C0.696006 21.5924 1.38402 21.73 1.80088 21.73C2.21774 21.73 2.55786 21.645 2.77236 21.5115V19.496ZM15.9702 16.3392C15.7354 16.3392 15.5613 16.5132 15.5613 16.7479C15.5613 16.9827 15.7354 17.1567 15.9702 17.1567C16.2049 17.1567 16.3708 16.9827 16.3708 16.7479C16.3708 16.5132 16.2049 16.3392 15.9702 16.3392ZM15.0232 17.6626C15.0232 17.8973 15.1971 18.0714 15.4319 18.0714C15.6666 18.0714 15.8326 17.8973 15.8326 17.6626C15.8326 17.4279 15.6666 17.2538 15.4319 17.2538C15.1971 17.2538 15.0232 17.4279 15.0232 17.6626ZM16.1119 17.6626C16.1119 17.8973 16.2858 18.0714 16.5205 18.0714C16.7553 18.0714 16.9213 17.8973 16.9213 17.6626C16.9213 17.4279 16.7553 17.2538 16.5205 17.2538C16.2858 17.2538 16.1119 17.4279 16.1119 17.6626ZM20.9199 23.3125C20.6852 23.3125 20.511 23.4865 20.511 23.7213C20.511 23.956 20.6852 24.13 20.9199 24.13C21.1546 24.13 21.3205 23.956 21.3205 23.7213C21.3205 23.4865 21.1546 23.3125 20.9199 23.3125ZM23.3441 21.0096C23.3441 21.7503 22.988 22.0538 22.2595 22.0538C21.6605 22.0538 21.3045 21.7826 21.3045 21.2201V18.9253H20.592V21.0137C20.592 21.7543 20.252 22.0579 19.5154 22.0579H19.5073C18.8112 22.0579 18.5766 21.7381 18.5766 21.1432V18.9253H17.8643V21.0137C17.8643 21.4063 17.7873 22.0579 17.1519 22.0579C16.6744 22.0579 16.3506 21.7705 16.3506 21.2241V19.7388H15.6384V21.1027C15.6384 21.6167 15.4724 22.0579 14.8734 22.0579C14.3958 22.0579 14.0721 21.7705 14.0721 21.2241V19.7388H13.3597V21.1027C13.3597 21.6167 13.1939 22.0579 12.5949 22.0579H8.81469V18.9294H8.10248V22.4666C8.10248 23.2315 7.86776 23.5553 7.30924 23.5553C7.17973 23.5553 7.05014 23.5472 6.91658 23.5189L6.81955 24.1098C6.98549 24.1462 7.18362 24.1624 7.34956 24.1624C8.28851 24.1624 8.73383 23.6565 8.80263 22.6407H12.6718C13.4205 22.6407 13.732 22.3007 13.8818 22.0821C14.0639 22.4221 14.4282 22.6407 14.9503 22.6407C15.699 22.6407 16.0105 22.3007 16.1603 22.0821C16.3424 22.4221 16.7593 22.6407 17.2814 22.6407C17.848 22.6407 18.1759 22.3978 18.358 22.074C18.6089 22.4828 19.0864 22.6407 19.6166 22.6407H19.6247C20.337 22.6407 20.8269 22.4504 21.0859 22.0579C21.3166 22.4504 21.7657 22.6164 22.2716 22.6366C22.304 22.6366 22.3364 22.6366 22.3688 22.6366C23.4899 22.6366 24.0565 22.1428 24.0565 21.1432V16.2461H23.3441V21.0096ZM25.5336 22.6366H26.2461V16.2461H25.5336V22.6366Z" fill="white"/>
          <!-- remaining SVG paths omitted for brevity; ideally keep full logo identical to index.html -->
        </svg>
        <span>SkillMatch Pro</span>
      </div>
      <div style="font-size:13px; font-weight:400;">
        ${titleText} - ${generatedText}: ${now}
      </div>
    </div>
  `;
  pdfContainer.appendChild(header);
  //Ghaith's change end

  //Ghaith's change start - inline compact styles for PDF cards/timelines (smaller to fit pages)
  const pdfStyle = document.createElement('style');
  pdfStyle.textContent = `
    /*Ghaith's change start - compact PDF */
    .pdf-content { font-size: 12px; }
    .pdf-candidate-result { margin-top: 8px; padding-bottom: 6px; }
    .pdf-candidate-result:first-child { margin-top: 0 !important; padding-top: 0 !important; }
    .pdf-subsection { margin-top: 6px; }
    .pdf-subsection h3 { font-size: 13.5px; margin: 8px 0 6px 0; }
    .pdf-recommendation-card { font-size: 12px; padding: 6px 8px !important; }
    .pdf-recommendation-title { font-size: 13px; }
    .pdf-recommendation-reason { font-size: 12px; }
    .pdf-recommendation-hours, .pdf-recommendation-rule { font-size: 11.5px; }
    .timeline-wrapper { margin-top: 4px; }
    .timeline-title { font-size: 12px; margin-bottom: 3px; }
    .stacked-bar .segment-hours { font-size: 10.5px; }
    .stacked-labels .segment-label { font-size: 10.5px; }
    .total-label { font-size: 11.5px; }
    /*Ghaith's change end */
  `;
  pdfContainer.appendChild(pdfStyle);
  //Ghaith's change end

  // 3. Iterate candidates and build content
  recommendations.candidates.forEach((candidate, index) => {
    const candidateSection = document.createElement('div');
    candidateSection.className = 'pdf-candidate-result';
    //Ghaith's change start - avoid page breaks splitting candidate sections, each CV starts on new page (except first)
    candidateSection.style.pageBreakInside = 'avoid';
    candidateSection.style.breakInside = 'avoid';
    if (index === 0) {
      candidateSection.style.pageBreakBefore = 'avoid';
      candidateSection.style.breakBefore = 'avoid';
      candidateSection.style.marginTop = '0';
      candidateSection.style.paddingTop = '0';
    } else {
      candidateSection.style.pageBreakBefore = 'always';
      candidateSection.style.breakBefore = 'page';
    }
    //Ghaith's change end

    // Candidate Name
    let displayCandidateName = candidate.candidateName;
    if (!displayCandidateName || displayCandidateName === "N/A" || displayCandidateName === "n/a") {
      displayCandidateName = candidate.cvName || (isArabic ? "مرشح" : "Candidate");
    }

    const nameHeader = document.createElement('h3');
    nameHeader.className = 'pdf-candidate-name';
    nameHeader.style.color = '#15878A';
    //Ghaith's change start - reduce spacing for first candidate to ensure certificates start on page 1
    if (index === 0) {
      nameHeader.style.marginTop = '8px';
      nameHeader.style.marginBottom = '6px';
    }
    //Ghaith's change end
    nameHeader.textContent = `${UI_TEXT[language].pdfCandidate}: ${displayCandidateName}`;
    candidateSection.appendChild(nameHeader);

    if (candidate.cvName && candidate.cvName !== displayCandidateName) {
      const fileDiv = document.createElement('div');
      fileDiv.className = 'pdf-candidate-cv-name';
      //Ghaith's change start - darken file name text, reduce spacing for first candidate
      fileDiv.style.color = '#023B42';
      fileDiv.style.fontWeight = '600';
      if (index === 0) {
        fileDiv.style.marginBottom = '4px';
      }
      //Ghaith's change end
      fileDiv.textContent = `${UI_TEXT[language].pdfFile}: ${candidate.cvName}`;
      candidateSection.appendChild(fileDiv);
    }

    //Ghaith's change start
    // ========== CERTIFICATES SUBSECTION ==========
    if (candidate.recommendationIntro) {
      const introDiv = document.createElement('p');
      introDiv.className = 'pdf-recommendation-intro';
      introDiv.style.margin = '8px 0 16px 0';
      introDiv.style.padding = '0';
      introDiv.style.fontSize = '11px';
      introDiv.style.lineHeight = '1.6';
      introDiv.style.color = '#023B42';
      introDiv.textContent = candidate.recommendationIntro;
      candidateSection.appendChild(introDiv);
    }

    if (candidate.recommendations && candidate.recommendations.length > 0) {
      const certSubsection = document.createElement('div');
      certSubsection.className = 'pdf-subsection';
      //Ghaith's change start - certificates section should start on page 1 for first candidate
      const certMarginTop = index === 0 ? '12px' : '20px';
      certSubsection.innerHTML = `<h3 style="color:#023B42; margin-top:${certMarginTop};">${language === 'ar' ? 'الشهادات' : 'Certificates'}</h3>`;
      //Ghaith's change start - avoid page breaks in certificates subsection, ensure first one starts on page 1
      certSubsection.style.pageBreakInside = 'avoid';
      certSubsection.style.breakInside = 'avoid';
      certSubsection.style.pageBreakBefore = 'avoid';
      certSubsection.style.pageBreakAfter = 'avoid';
      certSubsection.style.breakBefore = 'avoid';
      certSubsection.style.breakAfter = 'avoid';
      //Ghaith's change end
      
      let certTimeline = [];
      let certTotalHours = 0;
    //Ghaith's change end

      candidate.recommendations.forEach(rec => {
        let displayName = rec.certName;
        let catalogEntry = null;

        // Find entry for translation/hours
        if (catalog) {
          catalogEntry = catalog.find(c => c.id === rec.certId) ||
            catalog.find(c => c.name === rec.certName || c.Certificate_Name_EN === rec.certName);
        }

        if (isArabic && catalogEntry && catalogEntry.nameAr) {
          displayName = catalogEntry.nameAr;
        }

        // Timeline Stats
        let hours = catalogEntry?.Estimated_Hours_To_Complete || catalogEntry?.estimatedHours || 0;
        hours = Number(hours) || 0;
        //Ghaith's change start
        certTimeline.push({ name: displayName, hours });
        certTotalHours += hours;
        //Ghaith's change end

        const hourWord = UI_TEXT[language].hours;
        const hoursText = hours > 0 ? `${hours} ${hourWord}` : UI_TEXT[language].na;

        // Recommendation Card
        const card = document.createElement('div');
        card.className = 'pdf-recommendation-card';
        //Ghaith's change start - make each card a separate object that won't split across pages
        // Inline styles for safe PDF rendering if external CSS lags
        card.style.marginBottom = '12px';
        card.style.padding = '10px';
        card.style.borderLeft = isArabic ? 'none' : '4px solid #CFB586';
        card.style.borderRight = isArabic ? '4px solid #CFB586' : 'none';
        card.style.backgroundColor = '#fbfbfc';
        card.style.pageBreakInside = 'avoid';
        card.style.breakInside = 'avoid';
        //Ghaith's change end

        //Ghaith's change start - match exact UI format with icons and inline rules
        card.innerHTML = `
          <div class="recommendation-title" style="font-weight:600; font-size:1rem; margin:0 0 8px 0; color:#023B42;">${displayName}</div>
          <div class="recommendation-reason" style="margin:8px 0; color:#023B42; line-height:1.6;">
            <i class="fas fa-lightbulb"></i> ${rec.reason}
          </div>
          <div class="recommendation-hours" style="margin-top:4px; font-size:0.9rem; color:#7E9196; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <i class="far fa-clock" style="color:#15878A;"></i>
            <span>${UI_TEXT[language].estTime}</span>
            <strong style="color:#023B42; font-weight:600;">${hoursText}</strong>
            ${rec.rulesApplied && rec.rulesApplied.length > 0
              ? `<span class="recommendation-rule-inline" style="margin-top:0; font-size:0.85rem; color:#7E9196; font-style:italic;"><i class="fas fa-gavel"></i> ${UI_TEXT[language].rulesApplied} ${rec.rulesApplied.join(", ")}</span>`
              : ""
            }
          </div>
        `;
        //Ghaith's change end
        //Ghaith's change start
        certSubsection.appendChild(card);
      });

      // Certificates Timeline
      if (certTimeline.length > 0 && certTotalHours > 0) {
        const timelineWrapper = document.createElement('div');
        timelineWrapper.className = 'timeline-wrapper';
        //Ghaith's change start - make timeline a separate object that won't split across pages
        timelineWrapper.style.pageBreakInside = 'avoid';
        timelineWrapper.style.breakInside = 'avoid';
        timelineWrapper.style.pageBreakBefore = 'avoid';
        timelineWrapper.style.pageBreakAfter = 'avoid';
        timelineWrapper.style.breakBefore = 'avoid';
        timelineWrapper.style.breakAfter = 'avoid';
        //Ghaith's change end
        
        //Ghaith's change start - make timeline more compact by including total in title
        const hourWord = UI_TEXT[language].hours;
        const baseTitleText = isArabic ? "الوقت التقريبي لإكمال الشهادات المقترحة" : "Estimated timeline to complete recommended certificates";
        const titleText = `${baseTitleText} (${UI_TEXT[language].total}: ${certTotalHours} ${hourWord})`;
        //Ghaith's change end

        function getColor(hours) {
          if (hours <= 100) return "#c8f7c5";
          if (hours < 200) return "#ffe5b4";
          return "#f5b5b5";
        }

        const barsHtml = `
          <div class="stacked-bar ${isArabic ? "stacked-bar-rtl" : ""}">
            ${certTimeline.map((item) => {
              const safeHours = Number(item.hours) || 0;
              const percentage = safeHours > 0 ? (safeHours / certTotalHours) * 100 : 0;
              const displayHours = `${safeHours} ${hourWord}`;
              const color = getColor(safeHours);

              return `
                  <div class="bar-segment" style="width:${percentage}%; background:${color}" title="${item.name}: ${displayHours}">
                    <span class="segment-hours">${safeHours > 0 ? safeHours : ''}</span>
                  </div>
                `;
            }).join("")}
          </div>

          <div class="stacked-labels ${isArabic ? "stacked-labels-rtl" : ""}">
            ${certTimeline.map((item) => {
              const safeHours = Number(item.hours) || 0;
              const percentage = safeHours > 0 ? (safeHours / certTotalHours) * 100 : 0;
              if (percentage < 5) return "";
              return `
                  <div class="segment-label" style="width:${percentage}%">
                    ${item.name}
                  </div>
                `;
            }).join("")}
          </div>
        `;

        //Ghaith's change start - remove total row, total now in title
        timelineWrapper.innerHTML = `
          <h4 class="timeline-title ${isArabic ? "timeline-title-rtl" : ""}">${titleText}</h4>
          <div class="stacked-timeline ${isArabic ? "stacked-timeline-rtl" : ""}">
            ${barsHtml}
          </div>
        `;
        //Ghaith's change end
        certSubsection.appendChild(timelineWrapper);
      }

      candidateSection.appendChild(certSubsection);
    }

    // ========== TRAINING COURSES SUBSECTION ==========
    if (candidate.trainingCourses && candidate.trainingCourses.length > 0) {
      const trainingSubsection = document.createElement('div');
      trainingSubsection.className = 'pdf-subsection';
      //Ghaith's change start - training courses should start at the top of a new page with spacing to prevent cutoff
      trainingSubsection.innerHTML = `<h3 style="color:#023B42; margin-top:8px;">${language === 'ar' ? 'الدورات التدريبية' : 'Training Courses'}</h3>`;
      //Ghaith's change start - training courses start at top of new page, add padding to prevent header cutoff
      trainingSubsection.style.pageBreakInside = 'avoid';
      trainingSubsection.style.breakInside = 'avoid';
      trainingSubsection.style.pageBreakBefore = 'always';
      trainingSubsection.style.breakBefore = 'page';
      trainingSubsection.style.pageBreakAfter = 'avoid';
      trainingSubsection.style.breakAfter = 'avoid';
      trainingSubsection.style.paddingTop = '4px';
      //Ghaith's change end
      
      let trainingTimeline = [];
      let trainingTotalHours = 0;

      candidate.trainingCourses.forEach(rec => {
        let displayName = rec.courseName;
        let catalogEntry = null;

        if (trainingCatalog) {
          catalogEntry = trainingCatalog.find(c => c.id === rec.courseId) ||
            trainingCatalog.find(c => c.name === rec.courseName) ||
            trainingCatalog.find(c => c["Training Course Title"] === rec.courseName) ||
            trainingCatalog.find(c => c.nameAr === rec.courseName) ||
            trainingCatalog.find(c => c["اسم الدورة التدريبية"] === rec.courseName);
        }

        if (isArabic && catalogEntry && catalogEntry.nameAr) {
          displayName = catalogEntry.nameAr;
        }

        //Ghaith's change start - training hours (prefer rec, then catalog) to avoid N/A
        let hours = 0;
        if (rec && (rec.hours || rec.totalHours || rec.estimatedHours)) {
          hours = rec.hours || rec.totalHours || rec.estimatedHours || 0;
        }
        if (hours === 0 && catalogEntry) {
          hours = catalogEntry.totalHours || 
                  catalogEntry["Total Hours"] || 
                  catalogEntry["عدد الساعات"] || 
                  0;
        }
        hours = Number(hours) || 0;
        //Ghaith's change end
        trainingTimeline.push({ name: displayName, hours });
        trainingTotalHours += hours;

        const hourWord = UI_TEXT[language].hours;
        const hoursText = hours > 0 ? `${hours} ${hourWord}` : UI_TEXT[language].na;

        const card = document.createElement('div');
        card.className = 'pdf-recommendation-card';
        //Ghaith's change start - make each card a separate object that won't split across pages
        card.style.marginBottom = '12px';
        card.style.padding = '10px';
        card.style.borderLeft = isArabic ? 'none' : '4px solid #CFB586';
        card.style.borderRight = isArabic ? '4px solid #CFB586' : 'none';
        card.style.backgroundColor = '#fbfbfc';
        card.style.pageBreakInside = 'avoid';
        card.style.breakInside = 'avoid';
        //Ghaith's change end

        //Ghaith's change start - match exact UI format with icons and inline rules
        card.innerHTML = `
          <div class="recommendation-title" style="font-weight:600; font-size:1rem; margin:0 0 8px 0; color:#023B42;">${displayName}</div>
          <div class="recommendation-reason" style="margin:8px 0; color:#023B42; line-height:1.6;">
            <i class="fas fa-lightbulb"></i> ${rec.reason}
          </div>
          <div class="recommendation-hours" style="margin-top:4px; font-size:0.9rem; color:#7E9196; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <i class="far fa-clock" style="color:#15878A;"></i>
            <span>${UI_TEXT[language].estTime}</span>
            <strong style="color:#023B42; font-weight:600;">${hoursText}</strong>
            ${rec.rulesApplied && rec.rulesApplied.length > 0
              ? `<span class="recommendation-rule-inline" style="margin-top:0; font-size:0.85rem; color:#7E9196; font-style:italic;"><i class="fas fa-gavel"></i> ${UI_TEXT[language].rulesApplied} ${rec.rulesApplied.join(", ")}</span>`
              : ""
            }
          </div>
        `;
        //Ghaith's change end
        trainingSubsection.appendChild(card);
      });

      // Training Courses Timeline
      if (trainingTimeline.length > 0 && trainingTotalHours > 0) {
      const timelineWrapper = document.createElement('div');
      timelineWrapper.className = 'timeline-wrapper';
      //Ghaith's change start - avoid page breaks on training timeline
      timelineWrapper.style.pageBreakInside = 'avoid';
      timelineWrapper.style.breakInside = 'avoid';
      timelineWrapper.style.pageBreakBefore = 'avoid';
      timelineWrapper.style.pageBreakAfter = 'avoid';
      timelineWrapper.style.breakBefore = 'avoid';
      timelineWrapper.style.breakAfter = 'avoid';
      //Ghaith's change end
        
        //Ghaith's change start - make timeline more compact by including total in title
        const hourWord = UI_TEXT[language].hours;
        const baseTitleText = isArabic ? "الوقت التقريبي لإكمال الدورات التدريبية المقترحة" : "Estimated timeline to complete recommended training courses";
        const titleText = `${baseTitleText} (${UI_TEXT[language].total}: ${trainingTotalHours} ${hourWord})`;
        //Ghaith's change end

        function getColor(hours) {
          if (hours <= 100) return "#c8f7c5";
          if (hours < 200) return "#ffe5b4";
          return "#f5b5b5";
        }

        const barsHtml = `
          <div class="stacked-bar ${isArabic ? "stacked-bar-rtl" : ""}">
            ${trainingTimeline.map((item) => {
              const safeHours = Number(item.hours) || 0;
              const percentage = safeHours > 0 ? (safeHours / trainingTotalHours) * 100 : 0;
              const displayHours = `${safeHours} ${hourWord}`;
              const color = getColor(safeHours);

              return `
                  <div class="bar-segment" style="width:${percentage}%; background:${color}" title="${item.name}: ${displayHours}">
                    <span class="segment-hours">${safeHours > 0 ? safeHours : ''}</span>
                  </div>
                `;
            }).join("")}
          </div>

          <div class="stacked-labels ${isArabic ? "stacked-labels-rtl" : ""}">
            ${trainingTimeline.map((item) => {
              const safeHours = Number(item.hours) || 0;
              const percentage = safeHours > 0 ? (safeHours / trainingTotalHours) * 100 : 0;
              if (percentage < 5) return "";
              return `
                  <div class="segment-label" style="width:${percentage}%">
                    ${item.name}
                  </div>
                `;
            }).join("")}
          </div>
        `;

        //Ghaith's change start - remove total row, total now in title
        timelineWrapper.innerHTML = `
          <h4 class="timeline-title ${isArabic ? "timeline-title-rtl" : ""}">${titleText}</h4>
          <div class="stacked-timeline ${isArabic ? "stacked-timeline-rtl" : ""}">
            ${barsHtml}
          </div>
        `;
        //Ghaith's change end
        trainingSubsection.appendChild(timelineWrapper);
      }

      candidateSection.appendChild(trainingSubsection);
    }
    //Ghaith's change end

    pdfContainer.appendChild(candidateSection);
    // Divider
    pdfContainer.appendChild(document.createElement('hr'));
  });

  // 5. Trigger PDF Download
  //Ghaith's change start - add white space at top of each page
  const opt = {
    margin: [10, 10, 10, 10], // top, left, bottom, right - top margin for white space on each page
    filename: `SkillMatch_Recommendations_${new Date().toISOString().slice(0,10)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  //Ghaith's change end

  html2pdf().set(opt).from(pdfContainer).save().catch(err => {
    console.error("PDF generation failed:", err);
    alert(isArabic ? "فشل في إنشاء ملف PDF. يرجى المحاولة مرة أخرى." : "Failed to generate PDF. Please try again.");
  });
}

// ---------------------------------------------------------------------------
// Modal helpers (CV review)
// ---------------------------------------------------------------------------
function formatDescriptionAsBullets(text) {
  if (!text) return "";
  const withBreaks = text.replace(/\r/g, "").replace(/\.\s+/g, ".\n");
  const sentences = [];
  withBreaks.split(/\n+/).forEach((part) => {
    const cleaned = part.replace(/^[\s•\-]+/, "").trim();
    if (!cleaned) return;
    cleaned.split(".").map((s) => s.trim()).filter(Boolean).forEach((s) => sentences.push(s));
  });
  if (sentences.length === 0) return text.trim();
  return sentences.map((s) => `• ${s}`).join("\n");
}

function createItemRow(item, fields) {
  const row = document.createElement("div");
  row.className = "item-row";
  const deleteBtn = document.createElement("span");
  deleteBtn.className = "delete-item-btn";
  deleteBtn.textContent = "×";
  deleteBtn.addEventListener("click", () => row.remove());
  row.appendChild(deleteBtn);

  fields.forEach((f) => {
    const field = typeof f === "string" ? { name: f } : f;
    const isTextarea = field.type === "textarea" || field.multiline;
    const isDescriptionField = field.name === "description";
    const input = document.createElement(isTextarea ? "textarea" : "input");
    if (!isTextarea) input.type = "text";
    let autoResizeFn = null;
    if (isTextarea) {
      input.rows = field.rows || 1;
      input.wrap = "soft";
      input.style.resize = "none";
      autoResizeFn = (el) => {
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
      };
      autoResizeFn(input);
      input.addEventListener("input", () => autoResizeFn(input));
    }
    const placeholderText = field.placeholder || (field.name ? field.name.charAt(0).toUpperCase() + field.name.slice(1) : "");
    input.placeholder = placeholderText;
    input.value = item[field.name] || "";
    if (isDescriptionField) {
      const applyFormattedBullets = () => {
        input.value = formatDescriptionAsBullets(input.value);
        if (autoResizeFn) autoResizeFn(input);
      };
      applyFormattedBullets();
      input.addEventListener("blur", () => applyFormattedBullets());
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const { selectionStart, selectionEnd, value } = input;
          const insertText = "\n• ";
          const newValue = value.slice(0, selectionStart) + insertText + value.slice(selectionEnd);
          input.value = newValue;
          const newPos = selectionStart + insertText.length;
          input.setSelectionRange(newPos, newPos);
          if (autoResizeFn) autoResizeFn(input);
        }
      });
    }
    input.dataset.field = field.name || "";
    if (field.className) input.classList.add(field.className);
    if (field.isBold) input.style.fontWeight = "700";
    if (autoResizeFn) requestAnimationFrame(() => autoResizeFn(input));
    row.appendChild(input);
  });
  return row;
}

function createSkillBubble(item, fields) {
  const bubble = document.createElement("div");
  bubble.className = "skill-bubble";
  const input = document.createElement("input");
  input.type = "text";
  input.className = "skill-input";
  const primaryField = typeof fields[0] === "string" ? fields[0] : fields[0].name;
  input.placeholder = typeof fields[0] === "object" && fields[0].placeholder ? fields[0].placeholder : primaryField.charAt(0).toUpperCase() + primaryField.slice(1);
  const skillValue = item[primaryField] || item.title || "";
  input.value = skillValue;
  input.dataset.field = primaryField;
  const minWidth = 10;
  input.style.minWidth = `${minWidth}ch`;
  input.style.maxWidth = "20ch";
  const calculatedWidth = Math.max(minWidth, skillValue.length + 1);
  input.style.width = `${calculatedWidth}ch`;
  input.addEventListener("input", (e) => {
    input.style.width = `${Math.max(minWidth, e.target.value.length + 1)}ch`;
  });
  bubble.appendChild(input);
  const deleteBtn = document.createElement("span");
  deleteBtn.className = "delete-item-btn";
  deleteBtn.textContent = "×";
  deleteBtn.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); bubble.remove(); });
  bubble.appendChild(deleteBtn);
  return bubble;
}

function renderCvDetails(cv) {
  const container = document.getElementById("cvResultsContainer");
  if (!container) return;
  container.innerHTML = "";

  if (!cv.structured && !cv.education) { 
    container.innerHTML = `<div class="status-message"><div class="loader"></div> ${getStatusText('analyzing')}</div>`;
      return;
  }

  const t = (k) => getUiText(k);

  const sections = [
    {
      key: "experience",
      label: t("experience"),
      fields: [
        { name: "jobTitle", placeholder: t("jobTitle"), className: "cv-field-job-title", isBold: true },
        { name: "company", placeholder: t("company"), className: "cv-field-company" },
        { name: "description", placeholder: t("description"), className: "cv-description-textarea", multiline: true },
        { name: "years", placeholder: t("years") },
      ],
    },
    {
      key: "education",
      label: t("education"),
      fields: [
        { name: "degreeField", placeholder: t("degree"), className: "education-degree-input", isBold: true },
        { name: "school", placeholder: t("school") },
      ],
    },
    { key: "certifications", label: t("certifications"), fields: [{ name: "title", placeholder: t("certification") }] },
    { key: "skills", label: t("skills"), fields: [{ name: "title", placeholder: t("skill") }] },
  ];

  sections.forEach((sec) => {
    const secDiv = document.createElement("div");
    //Ghaith's change start - add section-specific class to apply layout (company under title)
    secDiv.className = `cv-section${sec.key ? ` cv-section-${sec.key}` : ""}`;
    //Ghaith's change end
    secDiv.innerHTML = `<h3>${sec.label}</h3>`;
    let listDiv;
    if (sec.key === "skills") {
      listDiv = document.createElement("div");
      listDiv.className = "skills-bubble-list";
      listDiv.id = `${cv.name}_${sec.key}_list`;
      (cv[sec.key] || []).forEach((item) => listDiv.appendChild(createSkillBubble(item, sec.fields)));
    } else {
      listDiv = document.createElement("div");
      listDiv.id = `${cv.name}_${sec.key}_list`;
      (cv[sec.key] || []).forEach((item) => listDiv.appendChild(createItemRow(item, sec.fields)));
    }
    const addBtn = document.createElement("button");
    addBtn.className = "add-btn";
    addBtn.textContent = `${t("add")} ${sec.label}`;
    addBtn.addEventListener("click", () => {
      const emptyItem = {};
      sec.fields.forEach(f => { const field = typeof f === "string" ? { name: f } : f; if (field.name) emptyItem[field.name] = ""; });
      if (sec.key === "skills") listDiv.appendChild(createSkillBubble(emptyItem, sec.fields));
      else listDiv.appendChild(createItemRow(emptyItem, sec.fields));
    });
    secDiv.appendChild(listDiv);
    secDiv.appendChild(addBtn);
    container.appendChild(secDiv);
  });
}

// Modal state
let modalCvData = [];
let activeCvIndex = 0;

function upsertByName(existing, incoming) {
  const map = new Map();
  existing.forEach((cv) => map.set(cv.name, cv));
  incoming.forEach((cv) => map.set(cv.name, cv));
  return Array.from(map.values());
}

function deepClone(obj) {
  try { return structuredClone(obj); } catch (_) { return JSON.parse(JSON.stringify(obj)); }
}

function readCvFromDom(cv) {
  if (!cv || !cv.structured) return cv; 
  const updated = deepClone(cv);
  ["experience", "education", "certifications", "skills"].forEach((sec) => {
    const list = document.getElementById(`${cv.name}_${sec}_list`);
    if (!list) return;
    if (sec === "skills") {
      updated.skills = [];
      list.querySelectorAll(".skill-bubble").forEach((bubble) => {
        const input = bubble.querySelector("input");
        if (input) updated.skills.push({ title: input.value });
      });
    } else {
      updated[sec] = [];
      list.querySelectorAll(".item-row").forEach((row) => {
        const entry = {};
        row.querySelectorAll("input, textarea").forEach((input) => {
          const key = input.dataset.field || input.placeholder.toLowerCase();
          entry[key] = input.value;
        });
        updated[sec].push(entry);
      });
    }
  });
  return updated;
}

function syncActiveCvFromDom() {
  if (!modalCvData.length) return;
  const current = modalCvData[activeCvIndex];
  if (current.isParsing) return;
  const updated = readCvFromDom(current);
  modalCvData[activeCvIndex] = updated;
}

function openCvModal(allCvResults, initialIndex = 0) {
  const modal = document.getElementById("cvModal");
  const tabs = document.getElementById("cvTabsContainer");
  const content = document.getElementById("cvResultsContainer");
  const submitBtn = document.getElementById("submitCvReview");
  const searchInput = document.getElementById("cvSearchInput");
  
  if (!modal || !tabs || !content) return;
  if (searchInput) searchInput.value = "";

  modalCvData = allCvResults;
  activeCvIndex = initialIndex;

  modal.style.display = "flex";
  modal.removeAttribute("hidden");
  tabs.innerHTML = "";
  content.innerHTML = "";

  modalCvData.forEach((cv, index) => {
    const tab = document.createElement("div");
    tab.className = "cv-tab";
    tab.textContent = cv.name;
    tab.dataset.index = index;
    if (index === initialIndex) tab.classList.add("active");

    tab.addEventListener("click", () => {
      syncActiveCvFromDom();
      document.querySelectorAll(".cv-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      activeCvIndex = index;
      renderCvDetails(modalCvData[index]);
    });
    tabs.appendChild(tab);
  });

  renderCvDetails(modalCvData[initialIndex] || modalCvData[0]);
  if (submitBtn) submitBtn.textContent = modalCvData.length > 1 ? getUiText("submitAll") : getUiText("submitSingle");
}

const upsertAndRenderSubmittedCvs = (cvResultsForModal) => {
  if (!cvResultsForModal || !cvResultsForModal.length) return;
  submittedCvData = upsertByName(submittedCvData, cvResultsForModal);
  renderSubmittedCvBubbles(submittedCvData);
};

const renderSubmittedCvBubbles = (allResults) => {
  const counterEl = document.getElementById("uploaded-cv-count");
  if (counterEl) counterEl.textContent = allResults ? allResults.length : 0;

  const container = document.getElementById("submitted-cv-bubbles");
  if (!container) return;
  container.innerHTML = "";

  const recommendationsContainer = document.getElementById("recommendations-container");
  const resultsSection = document.getElementById("results-section");

  allResults.forEach((cv, idx) => {
    const bubble = document.createElement("div");
    bubble.className = "cv-summary-bubble";
    // Added for cv Selection (START)
    const checkbox = document.createElement("input"); // Added for cv Selection
    checkbox.type = "checkbox";
    checkbox.className = "cv-select-checkbox";
    checkbox.checked = cv.selected !== false;
    
    checkbox.addEventListener("change", (e) => {
      cv.selected = e.target.checked;
      updateGenerateButton(submittedCvData);
    });
    
    bubble.appendChild(checkbox);
    bubble.title = "Click to re-open CV review";
    const nameEl = document.createElement("span");
    nameEl.className = "bubble-name";
    nameEl.textContent = cv.name || "CV";
    const metaEl = document.createElement("span");
    metaEl.className = "bubble-meta";
    
    if (cv.isParsing) {
      //Ghaith's change start - use status text to avoid undefined during parsing
      metaEl.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> ${getStatusText('analyzing') || ''}`;
      //Ghaith's change end
    } else {
      const expCount = (cv.experience || []).length;
      const skillCount = (cv.skills || []).length;
      metaEl.textContent = `${expCount} exp | ${skillCount} skills`;
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-bubble-btn";
    deleteBtn.innerHTML = "×";
    deleteBtn.style.zIndex = "10"; 
    
    // Explicit click handler with proper propagation stopping
    deleteBtn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const cvToRemove = submittedCvData[idx];
      submittedCvData = submittedCvData.filter((_, i) => i !== idx);
      
      if (cvToRemove && cvToRemove.name && allRecommendationsMap[cvToRemove.name]) {
        delete allRecommendationsMap[cvToRemove.name];
        const allRecommendations = { candidates: Object.values(allRecommendationsMap) };
        lastRecommendations = allRecommendations;
        saveLastRecommendations(lastRecommendations);
        
        // Use imported function to update view
        const { displayRecommendations } = await import("./ai.js");
        displayRecommendations(allRecommendations, recommendationsContainer, resultsSection, currentLang);
      }
      
      //Ghaith's change start - tie recommendations to uploaded CVs; clear when none remain
      if (submittedCvData.length === 0) {
        const recommendationsContainer = document.getElementById("recommendations-container");
        const resultsSection = document.getElementById("results-section");
        allRecommendationsMap = {};
        lastRecommendations = { candidates: [] };
        saveLastRecommendations(lastRecommendations);
        if (recommendationsContainer) recommendationsContainer.innerHTML = "";
        if (resultsSection) resultsSection.classList.add("hidden");
        updateDownloadButtonVisibility(lastRecommendations);
      } else {
        updateDownloadButtonVisibility(lastRecommendations);
      }
      //Ghaith's change end
      
      renderSubmittedCvBubbles(submittedCvData);
      if (submittedCvData.length === 0) updateGenerateButton([]);
    };

    bubble.appendChild(nameEl);
    bubble.appendChild(metaEl);
    bubble.appendChild(deleteBtn);
    // Start
    bubble.addEventListener("click", (e) => {
      if (e.target.closest(".cv-select-checkbox")) return;
      openCvModal(submittedCvData, idx);
    });
    // END
    container.appendChild(bubble);
  });
};

// ---------------------------------------------------------------------------
// Main bootstrap
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  saveChatHistory([]);
  saveLastRecommendations({ candidates: [] });
  
  initializeLanguage();

  let chatHistory = [];
  
  await loadCertificateCatalog();
  //Ghaith's change start
  await loadTrainingCoursesCatalog();
  //Ghaith's change end

  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");
  const fileInput = document.getElementById("file-input");
  const cvUploadArea = document.getElementById("cv-upload-area");
  const uploadStatus = document.getElementById("upload-status");
  const rulesStatus = document.getElementById("rules-status");
  const resultsSection = document.getElementById("results-section");
  const recommendationsContainer = document.getElementById("recommendations-container");

  const addRuleBtn = document.getElementById("add-rule-btn");
  const generateBtn = document.getElementById("generate-recommendations-btn");

  const defaultRulesForLang = getDefaultRules(currentLang);
  initializeRulesUI(defaultRulesForLang);
  userRules = [...defaultRulesForLang];
  saveUserRules(userRules);

  clearChatHistoryDom();

  // Chat Handler
  async function handleSendMessage() {
    const message = (userInput.value || "").trim();
    if (!message) return;

    addMessage(message, true);
    chatHistory.push({ text: message, isUser: true });

    userInput.value = "";
    sendButton.disabled = true;
    showTypingIndicator();

    try {
      const cvArrayForChat = submittedCvData.length > 0 ? submittedCvData : uploadedCvs;
      const normalizedCvsForChat = cvArrayForChat.map((cv) => ({
         name: cv.name,
         text: cv.text,
         structured: cv.structured || cv,
      }));
      const enhancedSystemPrompt = buildChatSystemPrompt(normalizedCvsForChat, currentLang);
      
      let enhancedMessage = buildChatContextMessage(message, userRules, lastRecommendations, currentLang);
      const reply = await callGeminiAPI(enhancedMessage, chatHistory, enhancedSystemPrompt);

      hideTypingIndicator();
      addMessage(reply, false);
      chatHistory.push({ text: reply, isUser: false });
    } catch (err) {
      console.error("Chat API Error:", err);
      hideTypingIndicator();
      addMessage("Connection error. Please try again.", false);
    } finally {
      sendButton.disabled = false;
    }
  }

  if (sendButton) sendButton.addEventListener("click", handleSendMessage);
  if (userInput) {
    userInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSendMessage();
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener("click", async () => {
      function setButtonLoading(btn, loading) {
          if(loading) { btn.disabled = true; btn.innerHTML = '<div class="loader"></div>'; }
          else { btn.disabled = false; btn.innerHTML = getUiText('generateBtn'); }
      }

      setButtonLoading(generateBtn, true);
      recommendationsContainer.innerHTML = "";
      resultsSection.classList.remove("hidden");
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

      //Ghaith's change start - remove empty business rule inputs before generating
      const rulesContainer = document.getElementById("rules-container");
      if (rulesContainer) {
        const ruleInputs = rulesContainer.querySelectorAll(".rule-input");
        ruleInputs.forEach(input => {
          if (!input.value.trim()) {
            const wrapper = input.closest(".rule-input-wrapper");
            if (wrapper) wrapper.remove();
          }
        });
      }
      //Ghaith's change end

      const rules = getRulesFromUI();
      // const cvArray = submittedCvData; replaced this line with the below line 
      const cvArray = submittedCvData.filter(cv => cv.selected); 
      
      allRecommendationsMap = {}; 
      lastRecommendations = { candidates: [] };
      saveLastRecommendations(lastRecommendations);
      // added below function for CV Selection //Start
      if (cvArray.length === 0) {
        setButtonLoading(generateBtn, false);
        alert(currentLang === 'ar'
          ? "يرجى اختيار سيرة ذاتية واحدة على الأقل"
          : "Please select at least one CV");
        return;
      }
      // End
      let completedCount = 0;
      for (const cv of cvArray) {
        const placeholder = document.createElement("div");
        placeholder.className = "candidate-result";
        placeholder.innerHTML = `<h3 class="candidate-name">${cv.name}</h3><div class="loader" style="margin: 10px 0;"></div> ${getStatusText('generating')}`;
        recommendationsContainer.appendChild(placeholder);

        try {
      const result = await analyzeSingleCvWithAI(cv, rules, currentLang);
      const resultCard = createCandidateCard(result, currentLang);
      recommendationsContainer.replaceChild(resultCard, placeholder);
      
      allRecommendationsMap[cv.name] = {
         candidateName: result.candidateName || cv.name,
         cvName: cv.name,
         // Taif's update start - store intro text for each CV
         recommendationIntro: result.recommendationIntro || "",
         //Ghaith's change start - store both certificates and training courses for PDF/UI
         recommendations: result.recommendations || [],
         trainingCourses: result.trainingCourses || []
         //Ghaith's change end
      };

          lastRecommendations = { candidates: Object.values(allRecommendationsMap) };
          saveLastRecommendations(lastRecommendations);
        } catch (err) {
          console.error(err);
          placeholder.innerHTML = `<p style="color:red">Error analyzing ${cv.name}</p>`;
        }
        completedCount++;
      }

      setButtonLoading(generateBtn, false);
      //Ghaith's change start - remove popup/status in business rules after generating recs
      if (rulesStatus) rulesStatus.innerHTML = "";
      //Ghaith's change end
      updateDownloadButtonVisibility(lastRecommendations);
    });
  }

  // File Upload
  if (cvUploadArea) {
    cvUploadArea.addEventListener("click", () => fileInput && fileInput.click());
    cvUploadArea.addEventListener("dragover", (e) => { e.preventDefault(); cvUploadArea.style.borderColor = "var(--primary)"; });
    cvUploadArea.addEventListener("dragleave", () => { cvUploadArea.style.borderColor = "var(--border-color)"; });
    cvUploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      cvUploadArea.style.borderColor = "var(--border-color)";
      if (!fileInput) return;
      fileInput.files = e.dataTransfer.files;
      if (fileInput.files.length) {
         updateStatus(uploadStatus, `Selected ${fileInput.files.length} file(s)`);
         runFastFileProcessing();
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        updateStatus(uploadStatus, `Selected ${fileInput.files.length} file(s)`);
        runFastFileProcessing();
      }
    });
  }

  async function runFastFileProcessing() {
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;
    const files = Array.from(fileInput.files);
    showLoading(uploadStatus, "extracting");

    try {
        const extracted = await Promise.all(files.map(async (file) => {
            const rawText = await extractTextFromFile(file);
            return { name: file.name, text: rawText, structured: null, isParsing: true, selected: true  }; // ✅ ADD selected: true  to THIS
        }));

        upsertAndRenderSubmittedCvs(extracted);
        updateStatus(uploadStatus, "success");
        const generateBtn = document.getElementById("generate-recommendations-btn");
        if (generateBtn) generateBtn.disabled = false;
        runBackgroundParsing(extracted);

    } catch (err) {
        console.error("Extraction error:", err);
        updateStatus(uploadStatus, "error", true);
    }
  }

  async function runBackgroundParsing(cvsToParse) {
      cvsToParse.forEach(async (cvRef) => {
          try {
              const structuredSections = await parseCvIntoStructuredSections(cvRef.text);
              const processed = {
                  experience: (structuredSections.experience || []).map((exp) => ({
                      jobTitle: exp.jobTitle || exp.title || "",
                      company: exp.company || exp.companyName || "",
                      description: exp.description || "",
                      years: exp.period || exp.years || "",
                  })),
                  education: (structuredSections.education || []).map((edu) => ({
                      degreeField: edu.degree || edu.major || "",
                      school: edu.school || edu.institution || "",
                  })),
                  certifications: (structuredSections.certifications || []).map((cert) => ({ title: cert.title || "" })),
                  skills: (structuredSections.skills || []).map((skill) => ({ title: typeof skill === "string" ? skill : skill.title || "" })),
              };

              cvRef.experience = processed.experience;
              cvRef.education = processed.education;
              cvRef.certifications = processed.certifications;
              cvRef.skills = processed.skills;
              cvRef.structured = structuredSections;
              cvRef.isParsing = false;
              renderSubmittedCvBubbles(submittedCvData);
          } catch (err) {
              console.error(`Background parsing failed for ${cvRef.name}`, err);
              cvRef.isParsing = false;
              renderSubmittedCvBubbles(submittedCvData);
          }
      });
  }

  // Add Rule
  if (addRuleBtn) {
    addRuleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const container = document.getElementById("rules-container");
      if (container) {
        //Ghaith's change start - check if there's already an empty rule input
        const existingInputs = container.querySelectorAll(".rule-input");
        let hasEmptyInput = false;
        for (const input of existingInputs) {
          if (!input.value.trim()) {
            hasEmptyInput = true;
            input.focus();
            break; // Focus the first empty input and stop
          }
        }
        
        if (!hasEmptyInput) {
          const newInput = createRuleInput();
          container.appendChild(newInput);
          const input = newInput.querySelector('input');
          if (input) input.focus();
        }
        //Ghaith's change end
      }
    });
  }

  // --- MERGED: Liyan's Maximize Logic ---
  const maximizeRulesBtn = document.getElementById("maximize-rules-btn");
  const rulesModal = document.getElementById("rulesModal");
  const closeRulesModalBtn = document.getElementById("closeRulesModal");
  const rulesContainer = document.getElementById("rules-container");
  const rulesModalBody = document.getElementById("rules-modal-body");
  const rulesModalAddContainer = document.getElementById("rules-modal-add-container");
  const rulesModalFooter = document.getElementById("rules-modal-footer");
  const sidebarSection = document.querySelector(".merged-section"); 

  function toggleRulesModal(show) {
    if (!rulesModal || !rulesModalBody) return;
    if (show) {
      rulesModalBody.appendChild(rulesContainer);
      rulesModalAddContainer.appendChild(addRuleBtn);
      rulesModalFooter.appendChild(generateBtn);
      rulesModal.style.display = "flex";
    } else {
      rulesModal.style.display = "none";
      if (sidebarSection) {
        sidebarSection.appendChild(rulesContainer);
        sidebarSection.appendChild(addRuleBtn);
        sidebarSection.appendChild(generateBtn);
      }
    }
  }

  if (maximizeRulesBtn) maximizeRulesBtn.addEventListener("click", (e) => { e.preventDefault(); toggleRulesModal(true); });
  if (closeRulesModalBtn) closeRulesModalBtn.addEventListener("click", () => toggleRulesModal(false));
  window.addEventListener("click", (e) => { if (e.target === rulesModal) toggleRulesModal(false); });
  if (generateBtn) generateBtn.addEventListener("click", () => { if (rulesModal && rulesModal.style.display !== 'none') toggleRulesModal(false); });

  // Maximize Uploaded
  const maximizeUploadedBtn = document.getElementById("maximize-uploaded-btn");
  if (maximizeUploadedBtn) {
    maximizeUploadedBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (typeof submittedCvData !== 'undefined' && submittedCvData.length > 0) {
        openCvModal(submittedCvData, 0);
      } else {
        alert(currentLang === 'ar' ? "يرجى رفع وتحليل سيرة ذاتية أولاً." : "Please upload and analyze a CV first to view details.");
      }
    });
  }

  // Search Input
  const cvSearchInput = document.getElementById("cvSearchInput");
  if (cvSearchInput) {
    cvSearchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      const tabs = document.querySelectorAll(".cv-tab");
      tabs.forEach(tab => {
        const name = (tab.textContent || "").toLowerCase();
        tab.style.display = name.includes(searchTerm) ? "" : "none";
      });
    });
  }
  
  // Submit CV Modal
  const submitCvReview = document.getElementById("submitCvReview");
  if (submitCvReview) {
    submitCvReview.addEventListener("click", async () => {
      syncActiveCvFromDom();
      document.getElementById("cvModal").style.display = "none";
      if (submittedCvData.length > 0) {
        const generateBtn = document.getElementById("generate-recommendations-btn");
        if (generateBtn) generateBtn.click();
      }
    });
  }
  
  // Close CV Modal
  const closeCvModalBtn = document.getElementById("closeCvModalBtn");
  const cvModal = document.getElementById("cvModal");
  
  if (closeCvModalBtn) {
    closeCvModalBtn.addEventListener("click", () => {
      if (cvModal) cvModal.style.display = "none";
    });
  }
  
  // Also close on outside click for CV Modal (good practice)
  window.addEventListener("click", (e) => {
    if (e.target === cvModal) {
      cvModal.style.display = "none";
    }
  });
  
  // Download Button Logic
  const downloadBtn = document.getElementById("download-recommendations-btn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      downloadRecommendationsAsPDF(lastRecommendations, currentLang);
    });
  }
});
