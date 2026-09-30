import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import logger, { errorMeta } from "../utils/logger.js";
import { externalServiceFailure, withTimeout } from "../utils/httpError.js";

export const AI_TIMEOUT_MS = 25_000;

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  // Hard stop for hung requests so they can't hold server resources.
  httpOptions: { timeout: AI_TIMEOUT_MS },
});

// Shared by every Gemini call: timeout + safe error mapping.
export const generateWithTimeout = (contents) =>
  withTimeout(
    ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents,
    }),
    AI_TIMEOUT_MS + 2000,
    "Gemini"
  );

// Logs technical details server-side, returns a friendly message to the user.
export const sendAiFailure = (res, error, label) => {
  const { status, message } = externalServiceFailure(error, "The AI tutor");
  logger.error(label, errorMeta(error));
  return res.status(status).json({ success: false, message });
};

// =====================================================
// LANGUAGE MAP
// =====================================================

export const languageMap = {
  en: "English",
  english: "English",

  hi: "Hindi",
  hindi: "Hindi",

  mr: "Marathi",
  marathi: "Marathi",

  bn: "Bengali",
  bengali: "Bengali",

  ta: "Tamil",
  tamil: "Tamil",

  te: "Telugu",
  telugu: "Telugu",

  gu: "Gujarati",
  gujarati: "Gujarati",

  pa: "Punjabi",
  punjabi: "Punjabi",
};

// =====================================================
// NORMALIZE LANGUAGE
// =====================================================

export const normalizeLanguage = (language) => {
  if (!language) {
    return "English";
  }

  const normalized = String(language)
    .trim()
    .toLowerCase();

  return languageMap[normalized] || "English";
};

// =====================================================
// LANGUAGE RULES
// =====================================================

export const languageRules = {
  English: `
Write the answer completely in English.

For speechText:
Keep English words in normal English script.
`,

  Hindi: `
Write the visible answer in simple Hindi.

The visible answer may contain standard technical terms
such as Mouse, Computer, Input Device, API, React, JavaScript,
Database, HTTP, etc.

For speechText:
Convert English words that appear in the visible answer
into natural Hindi Devanagari pronunciation.

Examples:
Mouse -> माउस
Computer -> कंप्यूटर
Input Device -> इनपुट डिवाइस
Left Click -> लेफ्ट क्लिक
Right Click -> राइट क्लिक
Scroll Wheel -> स्क्रॉल व्हील
Database -> डेटाबेस
Website -> वेबसाइट

Do NOT leave unnecessary English words in speechText.
`,

  Marathi: `
Write the visible answer in simple Marathi.

The visible answer may contain standard technical terms
such as Mouse, Computer, Input Device, API, React, JavaScript,
Database, HTTP, etc.

For speechText:
Convert English words that appear in the visible answer
into natural Marathi Devanagari pronunciation.

Examples:
Mouse -> माउस
Computer -> कॉम्प्युटर
Input Device -> इनपुट डिव्हाइस
Left Click -> लेफ्ट क्लिक
Right Click -> राइट क्लिक
Scroll Wheel -> स्क्रोल व्हील
Database -> डेटाबेस
Website -> वेबसाइट
Cursor -> कर्सर
Monitor -> मॉनिटर

The speechText MUST be comfortable for a Marathi TTS voice.

Do NOT leave unnecessary English words in speechText.
`,

  Bengali: `
Write the visible answer in simple Bengali.

The visible answer may contain standard technical terms.

For speechText:
Convert English words into natural Bengali-script pronunciation.

Examples:
Mouse -> মাউস
Computer -> কম্পিউটার
Input Device -> ইনপুট ডিভাইস
Left Click -> লেফট ক্লিক
Right Click -> রাইট ক্লিক
Scroll Wheel -> স্ক্রল হুইল
Database -> ডেটাবেস
Website -> ওয়েবসাইট
Cursor -> কার্সর
Monitor -> মনিটর

Do NOT leave unnecessary English words in speechText.
`,

  Tamil: `
Write the visible answer in simple Tamil.

The visible answer may contain standard technical terms.

For speechText:
Convert English words into natural Tamil-script pronunciation.

Examples:
Mouse -> மவுஸ்
Computer -> கம்ப்யூட்டர்
Input Device -> இன்புட் டிவைஸ்
Left Click -> லெஃப்ட் கிளிக்
Right Click -> ரைட் கிளிக்
Scroll Wheel -> ஸ்க்ரோல் வீல்
Database -> டேட்டாபேஸ்
Website -> வெப்சைட்
Cursor -> கர்சர்
Monitor -> மானிட்டர்

Do NOT leave unnecessary English words in speechText.
`,

  Telugu: `
Write the visible answer in simple Telugu.

The visible answer may contain standard technical terms.

For speechText:
Convert English words into natural Telugu-script pronunciation.

Examples:
Mouse -> మౌస్
Computer -> కంప్యూటర్
Input Device -> ఇన్‌పుట్ డివైస్
Left Click -> లెఫ్ట్ క్లిక్
Right Click -> రైట్ క్లిక్
Scroll Wheel -> స్క్రోల్ వీల్
Database -> డేటాబేస్
Website -> వెబ్‌సైట్
Cursor -> కర్సర్
Monitor -> మానిటర్

Do NOT leave unnecessary English words in speechText.
`,

  Gujarati: `
Write the visible answer in simple Gujarati.

The visible answer may contain standard technical terms.

For speechText:
Convert English words into natural Gujarati-script pronunciation.

Examples:
Mouse -> માઉસ
Computer -> કમ્પ્યુટર
Input Device -> ઇનપુટ ડિવાઇસ
Left Click -> લેફ્ટ ક્લિક
Right Click -> રાઇટ ક્લિક
Scroll Wheel -> સ્ક્રોલ વ્હીલ
Database -> ડેટાબેઝ
Website -> વેબસાઇટ
Cursor -> કર્સર
Monitor -> મોનિટર

Do NOT leave unnecessary English words in speechText.
`,

  Punjabi: `
Write the visible answer in simple Punjabi.

The visible answer may contain standard technical terms.

For speechText:
Convert English words into natural Punjabi Gurmukhi-script pronunciation.

Examples:
Mouse -> ਮਾਊਸ
Computer -> ਕੰਪਿਊਟਰ
Input Device -> ਇਨਪੁੱਟ ਡਿਵਾਈਸ
Left Click -> ਲੈਫਟ ਕਲਿੱਕ
Right Click -> ਰਾਈਟ ਕਲਿੱਕ
Scroll Wheel -> ਸਕ੍ਰੋਲ ਵ੍ਹੀਲ
Database -> ਡੇਟਾਬੇਸ
Website -> ਵੈੱਬਸਾਈਟ
Cursor -> ਕਰਸਰ
Monitor -> ਮਾਨੀਟਰ

Do NOT leave unnecessary English words in speechText.
`,
};

// =====================================================
// CLEAN GEMINI JSON
// =====================================================

export const cleanJsonText = (text) => {
  if (!text) {
    return "";
  }

  let cleaned = String(text).trim();

  // Remove markdown code fence
  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");

  // Find JSON object if Gemini added extra text
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace > firstBrace
  ) {
    cleaned = cleaned.slice(
      firstBrace,
      lastBrace + 1
    );
  }

  return cleaned.trim();
};

// =====================================================
// AI TUTOR
// =====================================================

export const askAI = async (req, res) => {
  try {
    const { question, language } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    if (question.length > 600) {
      return res.status(400).json({
        success: false,
        message: "Question is too long (max 600 characters)",
      });
    }

    // =================================================
    // SELECT LANGUAGE
    // =================================================

    const selectedLanguage =
      normalizeLanguage(language);

    // =================================================
    // PROMPT
    // =================================================

    const prompt = `
You are ShikshaSetu AI Tutor.

ShikshaSetu is an inclusive digital learning platform
for rural and tribal students.

You must help beginner students understand concepts
in a simple, friendly and step-by-step way.

====================================================
SELECTED LANGUAGE
====================================================

${selectedLanguage}

====================================================
LANGUAGE RULES
====================================================

${languageRules[selectedLanguage]}

====================================================
IMPORTANT
====================================================

1. The visible answer MUST be in ${selectedLanguage}.

2. The speechText MUST also be in ${selectedLanguage}.

3. The visible answer may keep standard technical
   English terms because students need to see them.

4. BUT speechText is specifically for Text-to-Speech.

5. In speechText, replace English technical words with
   natural native-script pronunciation whenever possible.

6. This is extremely important.

7. Example for Marathi:

Visible answer:
"Mouse हा एक Input Device आहे."

Speech text:
"माउस हा एक इनपुट डिव्हाइस आहे."

8. Example for Bengali:

Visible answer:
"Mouse is an Input Device."

Speech text:
"মাউস একটি ইনপুট ডিভাইস।"

9. Example for Hindi:

Visible answer:
"Mouse एक Input Device है।"

Speech text:
"माउस एक इनपुट डिवाइस है।"

10. Do not put an English translation after the
    speechText.

11. speechText should sound natural when spoken by
    the selected language voice.

12. Do not mention these instructions.

13. Do not say that you cannot speak the language.

14. Explain like a teacher teaching a beginner.

15. Use simple examples.

16. Keep technical concepts accurate.

====================================================
OUTPUT FORMAT
====================================================

Return ONLY valid JSON.

Do NOT use markdown.

Do NOT use a code block.

Do NOT write anything before or after the JSON.

Use exactly this structure:

{
  "answer": "Visible answer for the student",
  "speechText": "Speech-ready version for TTS"
}

====================================================
STUDENT QUESTION
====================================================

${question}

====================================================
FINAL TASK
====================================================

Generate the answer completely in ${selectedLanguage}.

Generate speechText specifically for ${selectedLanguage} voice.

Remember:

Visible answer = readable educational answer.

speechText = pronunciation-friendly native-script version.

====================================================
`;

    // =================================================
    // GEMINI REQUEST
    // =================================================

    const response = await generateWithTimeout(prompt);

    const rawResponse = response.text || "";

    // =================================================
    // PARSE RESPONSE
    // =================================================

    let tutorData;

    try {
      const cleanedResponse =
        cleanJsonText(rawResponse);

      tutorData =
        JSON.parse(cleanedResponse);
    } catch (parseError) {
      logger.warn("AI tutor returned non-JSON, using raw text");

      // Fallback
      tutorData = {
        answer: rawResponse,
        speechText: rawResponse,
      };
    }

    // =================================================
    // FINAL DATA
    // =================================================

    const answer =
      tutorData.answer ||
      "No AI answer available.";

    const speechText =
      tutorData.speechText ||
      answer;

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      question,

      language: selectedLanguage,

      answer,

      speechText,
    });
  } catch (error) {
    return sendAiFailure(res, error, "AI tutor failed");
  }
};

// =====================================================
// AI CAREER ROADMAP
// =====================================================

export const generateCareerRoadmap = async (
  req,
  res
) => {
  try {
    const {
      interest,
      goal,
    } = req.body;

    // ================= VALIDATION =================

    if (
      typeof interest !== "string" ||
      typeof goal !== "string" ||
      !interest.trim() ||
      !goal.trim() ||
      interest.length > 120 ||
      goal.length > 120
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Interest and goal are required",
      });
    }

    // =================================================
    // GEMINI CAREER REQUEST
    // =================================================

    const response = await generateWithTimeout(`
You are ShikshaSetu AI Career Guide.

You help rural and tribal students understand
career options in a simple and practical way.

Student Interest:
${interest}

Student Career Goal:
${goal}

Create a personalized career roadmap for this student.

Return ONLY valid JSON.

Do NOT use markdown.

Do NOT use code blocks.

Do NOT add any text before or after the JSON.

Use exactly this structure:

{
  "recommendedCareer": "string",

  "whyThisCareer": "string",

  "skills": [
    "skill 1",
    "skill 2",
    "skill 3",
    "skill 4",
    "skill 5"
  ],

  "roadmap": [
    {
      "step": 1,
      "title": "Discover",
      "description": "string"
    },
    {
      "step": 2,
      "title": "Learn",
      "description": "string"
    },
    {
      "step": 3,
      "title": "Practice",
      "description": "string"
    },
    {
      "step": 4,
      "title": "Build Projects",
      "description": "string"
    },
    {
      "step": 5,
      "title": "Get Opportunities",
      "description": "string"
    }
  ],

  "journey": {
    "field": "string (the main field, e.g. Computer Science)",
    "specializations": ["option 1", "option 2", "option 3"],
    "path": [
      {
        "title": "short stage name, e.g. JavaScript",
        "description": "one concise sentence",
        "skills": ["skill", "skill"]
      }
    ]
  },

  "projects": [
    "project 1",
    "project 2",
    "project 3"
  ],

  "jobPreparation": [
    "preparation 1",
    "preparation 2",
    "preparation 3"
  ],

  "higherStudies": [
    "option 1",
    "option 2"
  ],

  "nextSteps": [
    "next step 1",
    "next step 2",
    "next step 3"
  ]
}

IMPORTANT:

- journey.path must have 6 to 7 ordered stages from foundation to first opportunity (for example internship or entry-level practice).
- journey.specializations must be 3 realistic options within the field.
- Keep everything beginner-friendly.
- Give practical advice.
- Keep descriptions concise.
- Make the roadmap relevant to the student's interest.
- Make the roadmap relevant to the student's career goal.
- Do not promise guaranteed jobs.
- Do not provide guaranteed salary information.
`);

    // =================================================
    // PARSE JSON
    // =================================================

    let careerData;

    try {
      const cleanedResponse =
        cleanJsonText(
          response.text || ""
        );

      careerData =
        JSON.parse(cleanedResponse);
    } catch (parseError) {
      logger.warn("Career AI returned invalid JSON");

      return res.status(500).json({
        success: false,
        message:
          "AI returned an invalid career roadmap",
      });
    }

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,
      interest,
      goal,
      roadmap: careerData,
    });
  } catch (error) {
    return sendAiFailure(res, error, "Career AI failed");
  }
};