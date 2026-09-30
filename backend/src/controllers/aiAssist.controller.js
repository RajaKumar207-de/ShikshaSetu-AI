import Scholarship from "../models/scholarship.model.js";
import { CATALOGUE } from "../services/learning.service.js";
import {
  generateWithTimeout,
  sendAiFailure,
  normalizeLanguage,
  languageRules,
  cleanJsonText,
} from "./ai.controller.js";

const clip = (value, max = 600) =>
  String(value ?? "")
    .replace(/[\u0000-\u001f]/g, " ")
    .trim()
    .slice(0, max);

const generateJson = async (prompt) => {
  const response = await generateWithTimeout(prompt);
  const raw = response.text || "";
  try {
    return { data: JSON.parse(cleanJsonText(raw)), raw };
  } catch {
    return { data: null, raw };
  }
};

const fail = (res, error, label) => sendAiFailure(res, error, label);

// =====================================================
// EXPLAIN IT MY WAY
// =====================================================

const EXPLAIN_MODES = {
  simple:
    "Explain the same idea again in very simple words, using short sentences and no jargon, as if to a student who found the first answer hard.",
  example:
    "Explain the same idea with one clear, real-life example from everyday life (for example a household, market, farm, bus journey or school situation). Keep the example respectful and realistic, and do not stereotype anyone.",
  another:
    "Explain the same idea in a completely different way from the first answer, for example with an analogy or a step-by-step breakdown.",
  language:
    "Explain the same idea in the selected language using everyday words a local student would use. Keep technical terms only when necessary.",
};

export const explainAgain = async (req, res) => {
  try {
    const question = clip(req.body.question, 500);
    const previousAnswer = clip(req.body.answer, 2500);
    const mode = req.body.mode;

    if (!question || !EXPLAIN_MODES[mode]) {
      return res.status(400).json({
        success: false,
        message: "A question and a valid mode are required",
      });
    }

    const selectedLanguage = normalizeLanguage(req.body.language);

    const prompt = `
You are ShikshaSetu AI Tutor helping a school student from India.

The student asked:
"${question}"

Your earlier answer was:
"""
${previousAnswer}
"""

Task: ${EXPLAIN_MODES[mode]}

Rules:
- Be accurate. If you are not sure about a fact, say so.
- Keep the answer under 150 words.
- Do not use markdown symbols such as ** or #.

${languageRules[selectedLanguage]}

Return ONLY valid JSON with exactly this shape:
{
  "answer": "the visible explanation",
  "speechText": "pronunciation-friendly version of the answer for text-to-speech"
}
`;

    const { data, raw } = await generateJson(prompt);
    const answer = clip(data?.answer || raw, 2500);

    if (!answer) {
      return res.status(502).json({
        success: false,
        message: "AI returned an empty explanation",
      });
    }

    return res.json({
      success: true,
      mode,
      language: selectedLanguage,
      answer,
      speechText: clip(data?.speechText || answer, 2500),
    });
  } catch (error) {
    return fail(res, error, "Could not generate explanation");
  }
};

// =====================================================
// ASK SARTHI (context-aware assistant)
// =====================================================

const buildScholarshipContext = async (id) => {
  if (!id || !/^[a-f\d]{24}$/i.test(String(id))) return "";
  const s = await Scholarship.findById(id).lean();
  if (!s) return "";
  return `
The student is viewing this scholarship (data from our database, which may be incomplete or outdated):
- Name: ${s.name}
- Provider: ${s.provider}
- Amount: ${s.amount}
- State: ${s.state}
- Categories: ${(s.category || []).join(", ") || "not specified"}
- Education levels: ${(s.educationLevel || []).join(", ") || "not specified"}
- Income limit: ${s.incomeLimit}
- Deadline: ${s.deadlineDate ? new Date(s.deadlineDate).toDateString() : s.deadline}
- Documents: ${(s.documents || []).join(", ") || "not specified"}
- Official link: ${s.officialLink || "not specified"}
`;
};

export const askSarthi = async (req, res) => {
  try {
    const message = clip(req.body.message, 600);
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const selectedLanguage = normalizeLanguage(req.body.language);
    const ctx = req.body.context || {};
    const page = clip(ctx.page, 40);

    let contextText = `The student is on the "${page || "home"}" page.`;

    if (page === "scholarships") {
      contextText += await buildScholarshipContext(ctx.scholarshipId);
      if (ctx.profile) {
        contextText += `
Student profile (self-reported): state ${clip(ctx.profile.state, 40)}, category ${clip(ctx.profile.category, 20)}, education level ${clip(ctx.profile.educationLevel, 30)}.`;
      }
    } else if (page === "learning" || page === "lesson") {
      const subject = clip(ctx.subject, 40);
      const topic = clip(ctx.topic, 60);
      if (subject) contextText += `\nCurrent subject: ${subject}.`;
      if (topic) contextText += `\nCurrent topic: ${topic}.`;
    } else if (page === "career") {
      if (ctx.career) {
        contextText += `
The student's current career roadmap: field "${clip(ctx.career.field, 80)}", recommended career "${clip(ctx.career.recommendedCareer, 80)}", stages: ${
          Array.isArray(ctx.career.stages)
            ? ctx.career.stages
                .slice(0, 8)
                .map((s) => clip(s, 60))
                .join(" -> ")
            : "unknown"
        }. Current stage: ${clip(ctx.career.currentStage, 60)}.`;
      }
    }

    const history = Array.isArray(req.body.history)
      ? req.body.history
          .slice(-6)
          .map(
            (h) =>
              `${h.role === "user" ? "Student" : "Sarthi"}: ${clip(h.text, 400)}`
          )
          .join("\n")
      : "";

    const prompt = `
You are Sarthi, the friendly AI companion inside ShikshaSetu AI, an
education platform for students in India (many from rural and
Tier-2/3 areas).

${contextText}

${history ? `Recent conversation:\n${history}\n` : ""}
Student's message:
"${message}"

Rules:
- Answer in a warm, simple, encouraging tone. Keep it under 120 words.
- Use only the context above for facts about the scholarship or career.
  If something is missing, say you do not have that information and
  suggest checking the official website or asking a teacher or mentor.
- Never state that the student is officially eligible or will be
  selected. You may say what the listed criteria appear to be and
  whether the student's self-reported details seem to match them.
- Never promise jobs, salaries or admission.
- Do not use markdown symbols such as ** or #.

${languageRules[selectedLanguage]}

Return ONLY valid JSON with exactly this shape:
{
  "reply": "the visible reply",
  "speechText": "pronunciation-friendly version for text-to-speech"
}
`;

    const { data, raw } = await generateJson(prompt);
    const reply = clip(data?.reply || raw, 1500);

    if (!reply) {
      return res.status(502).json({
        success: false,
        message: "Sarthi could not answer right now",
      });
    }

    return res.json({
      success: true,
      language: selectedLanguage,
      reply,
      speechText: clip(data?.speechText || reply, 1500),
    });
  } catch (error) {
    return fail(res, error, "Sarthi could not answer right now");
  }
};

// =====================================================
// PRACTICE / DIAGNOSTIC QUESTIONS
// =====================================================

export const generateQuestions = async (req, res) => {
  try {
    const subject = clip(req.body.subject, 40);
    const topics = CATALOGUE[subject];

    if (!topics) {
      return res.status(400).json({
        success: false,
        message: "Unknown subject",
      });
    }

    const requested = Array.isArray(req.body.topics)
      ? req.body.topics.filter((t) => topics.includes(t))
      : topics;
    const selected = requested.length ? requested : topics;
    const perTopic = Math.min(
      Math.max(parseInt(req.body.perTopic, 10) || 2, 1),
      3
    );
    const selectedLanguage = normalizeLanguage(req.body.language);

    const prompt = `
Create multiple-choice questions for a school student in India.

Subject: ${subject}
Topics: ${selected.join(", ")}
Questions per topic: ${perTopic}
Question language: ${selectedLanguage}

Rules:
- Questions must be factually correct, at an easy-to-medium school level,
  and each must have exactly 4 options with exactly one correct option.
- The "answer" value must be copied exactly from one of the options.
- The "topic" value must be exactly one of the topics listed above.
- Do not use markdown.

Return ONLY valid JSON with exactly this shape:
{
  "questions": [
    {
      "topic": "one of the topics",
      "question": "string",
      "options": ["a", "b", "c", "d"],
      "answer": "one of the options"
    }
  ]
}
`;

    const { data } = await generateJson(prompt);

    const questions = (Array.isArray(data?.questions) ? data.questions : [])
      .filter(
        (q) =>
          selected.includes(q?.topic) &&
          typeof q.question === "string" &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          q.options.includes(q.answer)
      )
      .map((q) => ({
        topic: q.topic,
        question: clip(q.question, 300),
        options: q.options.map((o) => clip(o, 120)),
        answer: clip(q.answer, 120),
      }));

    if (!questions.length) {
      return res.status(502).json({
        success: false,
        message: "Could not prepare questions. Please try again.",
      });
    }

    return res.json({ success: true, subject, questions });
  } catch (error) {
    return fail(res, error, "Could not prepare questions");
  }
};
