import { generateSpeech } from "../services/tts.service.js";

export const textToSpeech = async (req, res) => {
  try {
    const { text, language } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Text is required",
      });
    }

    const result = await generateSpeech(text, language || "hi");

    return res.status(200).json({
      success: true,
      audio: result.audio,
      languageCode: result.languageCode,
      mimeType: "audio/wav",
    });
  } catch (error) {
    console.error("TTS Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate speech",
      error: error.message,
    });
  }
};