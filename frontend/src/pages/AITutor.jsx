import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import ExplainActions from "../components/ExplainActions";
import { playSpeech } from "../utils/voice";
import { saveExplanation } from "../utils/explanations";

const API_BASE_URL = API_URL;

const languages = [
  {
    code: "en",
    name: "English",
    speechLocale: "en-IN",
    greeting:
      "Hello! I am your ShikshaSetu AI Tutor. Ask me anything about your studies.",
  },
  {
    code: "hi",
    name: "Hindi",
    speechLocale: "hi-IN",
    greeting:
      "नमस्ते! मैं आपका ShikshaSetu AI Tutor हूँ। पढ़ाई से जुड़ा कोई भी सवाल पूछिए।",
  },
  {
    code: "mr",
    name: "Marathi",
    speechLocale: "mr-IN",
    greeting:
      "नमस्कार! मी तुमचा ShikshaSetu AI Tutor आहे. अभ्यासाशी संबंधित कोणताही प्रश्न विचारा.",
  },
  {
    code: "bn",
    name: "Bengali",
    speechLocale: "bn-IN",
    greeting:
      "নমস্কার! আমি আপনার ShikshaSetu AI Tutor। পড়াশোনা সম্পর্কে যেকোনো প্রশ্ন করুন।",
  },
  {
    code: "ta",
    name: "Tamil",
    speechLocale: "ta-IN",
    greeting:
      "வணக்கம்! நான் உங்கள் ShikshaSetu AI Tutor. படிப்பு தொடர்பான எந்த கேள்வியையும் கேளுங்கள்.",
  },
  {
    code: "te",
    name: "Telugu",
    speechLocale: "te-IN",
    greeting:
      "నమస్కారం! నేను మీ ShikshaSetu AI Tutor. చదువుకు సంబంధించిన ఏ ప్రశ్ననైనా అడగండి.",
  },
  {
    code: "gu",
    name: "Gujarati",
    speechLocale: "gu-IN",
    greeting:
      "નમસ્તે! હું તમારો ShikshaSetu AI Tutor છું. અભ્યાસ સંબંધિત કોઈપણ પ્રશ્ન પૂછો.",
  },
  {
    code: "pa",
    name: "Punjabi",
    speechLocale: "pa-IN",
    greeting:
      "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ShikshaSetu AI Tutor ਹਾਂ। ਪੜ੍ਹਾਈ ਨਾਲ ਜੁੜਿਆ ਕੋਈ ਵੀ ਸਵਾਲ ਪੁੱਛੋ।",
  },
];

const recognitionLanguageMap = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  gu: "gu-IN",
  pa: "pa-IN",
};

export default function AITutor() {
  const [selectedLanguage, setSelectedLanguage] = useState("hi");

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [speechText, setSpeechText] = useState("");
  const [askedQuestion, setAskedQuestion] = useState("");

  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [listening, setListening] = useState(false);

  const [error, setError] = useState("");

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);

  const currentLanguage =
    languages.find((language) => language.code === selectedLanguage) ||
    languages[1];

  /* -----------------------------------------
     CLEANUP AUDIO
  ----------------------------------------- */

  const cleanupAudio = () => {
    if (audioRef.current) {
      audioRef.current.stop();
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    setSpeaking(false);
    setPreparing(false);
  };

  useEffect(() => {
    return () => {
      cleanupAudio();

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  /* -----------------------------------------
     ASK AI
  ----------------------------------------- */

  const askAI = async () => {
    if (!question.trim()) {
      setError("Please enter a question first.");
      return;
    }

    setLoading(true);
    setError("");
    cleanupAudio();

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/ai/ask`,
        {
          question: question.trim(),
          language: selectedLanguage,
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "AI could not generate an answer."
        );
      }

      const answerText = response.data.answer || "";
      const speechTextFromAPI =
        response.data.speechText || answerText;

      setAnswer(answerText);
      setSpeechText(speechTextFromAPI);
      setAskedQuestion(question.trim());

      // Keep a copy so it can be re-read offline.
      saveExplanation({
        question: question.trim(),
        answer: answerText,
        language: selectedLanguage,
      });
    } catch (err) {
      console.error("AI Error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong while asking AI."
      );

      setAnswer("");
      setSpeechText("");
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------------------
     SPEAK USING SARVAM BACKEND
  ----------------------------------------- */

  const speakAnswer = async () => {
    const textToSpeak = speechText || answer;

    if (!textToSpeak.trim()) {
      setError("There is no answer to speak.");
      return;
    }

    // Second click while preparing/speaking = stop.
    if (speaking || preparing) {
      cleanupAudio();
      return;
    }

    setError("");
    setPreparing(true);

    try {
      const player = await playSpeech(textToSpeak, selectedLanguage);
      audioRef.current = player;
      setPreparing(false);
      setSpeaking(true);
      await player.finished;
    } catch (err) {
      console.error("TTS Error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to generate speech."
      );
    } finally {
      cleanupAudio();
    }
  };

  /* -----------------------------------------
     VOICE INPUT
  ----------------------------------------- */

  const startVoiceInput = () => {
    setError("");

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Voice input is not supported in this browser. Please use Google Chrome."
      );
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang =
      recognitionLanguageMap[selectedLanguage] || "hi-IN";

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      const transcript =
        event.results?.[0]?.[0]?.transcript || "";

      setQuestion(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);

      setError(
        event.error === "not-allowed"
          ? "Please allow microphone permission."
          : "Voice input failed. Please try again."
      );

      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  /* -----------------------------------------
     LANGUAGE CHANGE
  ----------------------------------------- */

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;

    cleanupAudio();

    setSelectedLanguage(newLanguage);
    setAnswer("");
    setSpeechText("");
    setError("");
  };

  /* -----------------------------------------
     ENTER KEY
  ----------------------------------------- */

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      askAI();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #eef2ff 0%, #f8fafc 50%, #ecfeff 100%)",
        padding: "30px 16px",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "24px",
            padding: "28px",
            boxShadow: "0 15px 40px rgba(15, 23, 42, 0.08)",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "30px",
                  fontWeight: "800",
                  color: "#111827",
                }}
              >
                🤖 ShikshaSetu AI Tutor
              </h1>

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#64748b",
                  fontSize: "15px",
                }}
              >
                Learn with AI in your preferred Indian language.
              </p>
            </div>

            {/* LANGUAGE */}

            <div>
              <label
                htmlFor="language"
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#475569",
                }}
              >
                Language
              </label>

              <select
                id="language"
                value={selectedLanguage}
                onChange={handleLanguageChange}
                style={{
                  minWidth: "170px",
                  padding: "11px 14px",
                  borderRadius: "12px",
                  border: "1px solid #dbe3ee",
                  background: "#f8fafc",
                  fontSize: "14px",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {languages.map((language) => (
                  <option
                    key={language.code}
                    value={language.code}
                  >
                    {language.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* GREETING */}

        <div
          style={{
            background: "#11162b",
            color: "#ffffff",
            borderRadius: "22px",
            padding: "22px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              opacity: 0.7,
              marginBottom: "8px",
            }}
          >
            {currentLanguage.name}
          </div>

          <div
            style={{
              fontSize: "17px",
              lineHeight: 1.7,
            }}
          >
            {currentLanguage.greeting}
          </div>
        </div>

        {/* QUESTION BOX */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "24px",
            padding: "24px",
            boxShadow: "0 15px 40px rgba(15, 23, 42, 0.08)",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              margin: "0 0 14px",
              fontSize: "20px",
              color: "#111827",
            }}
          >
            Ask your question
          </h2>

          <textarea
            value={question}
            onChange={(event) =>
              setQuestion(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder={`Ask your question in ${currentLanguage.name}...`}
            rows={5}
            style={{
              width: "100%",
              boxSizing: "border-box",
              resize: "vertical",
              padding: "16px",
              borderRadius: "16px",
              border: "1px solid #dbe3ee",
              outline: "none",
              fontSize: "15px",
              lineHeight: 1.6,
              color: "#111827",
            }}
          />

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "14px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={askAI}
              disabled={loading}
              style={{
                border: "none",
                borderRadius: "12px",
                padding: "12px 20px",
                background: loading
                  ? "#94a3b8"
                  : "#4f46e5",
                color: "#ffffff",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Thinking..." : "✨ Ask AI"}
            </button>

            <button
              onClick={startVoiceInput}
              style={{
                border: "1px solid #dbe3ee",
                borderRadius: "12px",
                padding: "12px 18px",
                background: listening ? "#fee2e2" : "#ffffff",
                color: listening ? "#dc2626" : "#334155",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              {listening ? "🎙️ Listening..." : "🎤 Speak"}
            </button>

            <button
              onClick={() => setQuestion("")}
              style={{
                border: "1px solid #dbe3ee",
                borderRadius: "12px",
                padding: "12px 18px",
                background: "#ffffff",
                color: "#475569",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fecaca",
              borderRadius: "14px",
              padding: "14px 16px",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* ANSWER */}

        {answer && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 15px 40px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "15px",
                marginBottom: "18px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: "800",
                  }}
                >
                  AI Answer
                </div>

                <h2
                  style={{
                    margin: "5px 0 0",
                    fontSize: "21px",
                    color: "#111827",
                  }}
                >
                  {currentLanguage.name}
                </h2>
              </div>

              {/* SPEAKER */}

              <button
                onClick={speakAnswer}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  border: "none",
                  background: speaking
                    ? "#dc2626"
                    : "#4f46e5",
                  color: "#ffffff",
                  fontSize: "21px",
                  cursor: "pointer",
                  boxShadow:
                    "0 8px 20px rgba(79, 70, 229, 0.25)",
                }}
                title={
                  preparing
                    ? "Preparing voice... (click to cancel)"
                    : speaking
                    ? "Stop speaking"
                    : "Listen to answer"
                }
              >
                {preparing ? "⏳" : speaking ? "⏹️" : "🔊"}
              </button>
            </div>

            <div
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: 1.85,
                color: "#334155",
                fontSize: "16px",
              }}
            >
              {answer}
            </div>

            <ExplainActions
              question={askedQuestion}
              answer={answer}
              language={selectedLanguage}
              speaking={speaking}
              preparing={preparing}
              onSpeak={speakAnswer}
              onResult={(result) => {
                cleanupAudio();
                setAnswer(result.answer);
                setSpeechText(result.speechText || result.answer);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
