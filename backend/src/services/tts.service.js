import { SarvamAIClient } from "sarvamai";
import { withTimeout } from "../utils/httpError.js";

const TTS_TIMEOUT_MS = 20_000;

const languageConfig = {
  en: {
    languageCode: "en-IN",
    speaker: "ratan",
  },

  hi: {
    languageCode: "hi-IN",
    speaker: "shubh",
  },

  mr: {
    languageCode: "mr-IN",
    speaker: "ratan",
  },

  bn: {
    languageCode: "bn-IN",
    speaker: "rehan",
  },

  ta: {
    languageCode: "ta-IN",
    speaker: "ratan",
  },

  te: {
    languageCode: "te-IN",
    speaker: "shubh",
  },

  gu: {
    languageCode: "gu-IN",
    speaker: "ratan",
  },

  pa: {
    languageCode: "pa-IN",
    speaker: "mani",
  },
};

export async function generateSpeech(text, language = "hi") {
  if (!text || !text.trim()) {
    throw new Error("Speech text is required");
  }

  if (!process.env.SARVAM_API_KEY) {
    throw new Error("SARVAM_API_KEY is missing in .env");
  }

  const client = new SarvamAIClient({
    apiSubscriptionKey: process.env.SARVAM_API_KEY,
  });

  const config = languageConfig[language] || languageConfig.hi;

  // A hung Sarvam request must not hold the connection open forever.
  const response = await withTimeout(
    client.textToSpeech.convert({
      text: text.trim(),
      model: "bulbul:v3",
      languageCode: config.languageCode,
      speaker: config.speaker,
      speechSampleRate: 24000,
    }),
    TTS_TIMEOUT_MS,
    "Sarvam"
  );

  if (!response?.audios?.[0]) {
    throw new Error("No audio returned from Sarvam");
  }

  return {
    audio: response.audios[0],
    languageCode: config.languageCode,
  };
}