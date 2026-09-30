import { generateSpeech } from "../services/tts.service.js";
import { externalServiceFailure } from "../utils/httpError.js";
import logger, { errorMeta } from "../utils/logger.js";

const SUPPORTED = ["en", "hi", "mr", "bn", "ta", "te", "gu", "pa"];

export const textToSpeech = async (req, res) => {
  try {
    const { text, language } = req.body || {};

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Text is required",
      });
    }

    if (text.length > 1500) {
      return res.status(400).json({
        success: false,
        message: "Text is too long for voice (max 1500 characters)",
      });
    }

    const lang = SUPPORTED.includes(language) ? language : "hi";

    const result = await generateSpeech(text, lang);

    return res.status(200).json({
      success: true,
      audio: result.audio,
      languageCode: result.languageCode,
      mimeType: "audio/wav",
    });
  } catch (error) {
    logger.error("TTS failed", errorMeta(error));

    const { status, message } = externalServiceFailure(
      error,
      "The voice service"
    );

    return res.status(status).json({ success: false, message });
  }
};
