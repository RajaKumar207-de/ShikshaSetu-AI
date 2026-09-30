import { getCurrentUser } from "./api";
import { cacheGet, cacheSet } from "./idbCache";

const MAX_SAVED = 30;

export const explanationsKey = () => {
  const user = getCurrentUser();
  return `explanations:${user?._id || user?.id || "guest"}`;
};

// Keeps the latest AI Tutor answers on the device so they can be
// re-read offline ("saved explanations").
export const saveExplanation = async ({ question, answer, language }) => {
  if (!question || !answer) return;
  const key = explanationsKey();
  const existing = (await cacheGet(key))?.value || [];
  const entry = {
    id: `${Date.now()}`,
    question: question.slice(0, 300),
    answer,
    language,
    savedAt: new Date().toISOString(),
  };
  const next = [
    entry,
    ...existing.filter(
      (e) => e.question !== entry.question || e.language !== language
    ),
  ].slice(0, MAX_SAVED);
  await cacheSet(key, next);
};
