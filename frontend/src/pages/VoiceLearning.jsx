import { useEffect, useRef, useState } from "react";
import api from "../utils/api";
import useOnline from "../hooks/useOnline";
import { useLanguage } from "../context/LanguageContext";
import {
  RECOGNITION_LOCALES,
  getRecognition,
  playSpeech,
} from "../utils/voice";

const GREETING = {
  hi: "बोलो, मैं समझाता हूँ...",
  en: "Speak, and I'll explain...",
};

// Friendly messages for every way voice can fail.
const recognitionError = (code) => {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission is blocked. Allow the microphone in your browser settings, or type your question below.";
    case "no-speech":
      return "I didn't hear anything. Tap the microphone and try again.";
    case "audio-capture":
      return "No microphone was found on this device. You can type your question below.";
    case "network":
      return "Voice recognition needs an internet connection. Please check your network.";
    default:
      return "I couldn't understand that. Please try again or type your question.";
  }
};

export default function VoiceLearning() {
  const online = useOnline();
  const { language, languages, changeLanguage } = useLanguage();
  const supported = Boolean(getRecognition());

  // idle | listening | thinking | speaking
  const [phase, setPhase] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState("");
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      audioRef.current?.stop();
    },
    []
  );

  const stopEverything = () => {
    recognitionRef.current?.abort();
    audioRef.current?.stop();
    audioRef.current = null;
    setPhase("idle");
  };

  const ask = async (question) => {
    const q = question.trim();
    if (!q) return;

    if (!navigator.onLine) {
      setError("You're offline. Voice Learning needs an internet connection.");
      setPhase("idle");
      return;
    }

    setTranscript(q);
    setAnswer("");
    setError("");
    setPhase("thinking");

    try {
      const { data } = await api.post("/api/ai/ask", {
        question: q,
        language,
      });
      const text = data.answer || "";
      setAnswer(text);

      // Text is already on screen; if audio fails the student can still read.
      try {
        setPhase("speaking");
        audioRef.current = await playSpeech(
          data.speechText || text,
          language
        );
        await audioRef.current.finished;
      } catch {
        setError(
          "I couldn't play the voice this time, but the answer is shown below."
        );
      }
    } catch (err) {
      setError(
        err.response?.status === 429
          ? err.response.data.message
          : err.response?.data?.message ||
              "Something went wrong while getting the answer. Please try again."
      );
    } finally {
      setPhase("idle");
    }
  };

  const listen = () => {
    setError("");

    if (phase === "listening") {
      recognitionRef.current?.stop();
      return;
    }
    if (phase !== "idle") {
      stopEverything();
      return;
    }

    const Recognition = getRecognition();
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = RECOGNITION_LOCALES[language] || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    let finalText = "";

    recognition.onstart = () => setPhase("listening");
    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ");
      setTranscript(text);
      if (event.results[event.results.length - 1].isFinal) {
        finalText = text;
      }
    };
    recognition.onerror = (event) => {
      setError(recognitionError(event.error));
      setPhase("idle");
      finalText = "";
    };
    recognition.onend = () => {
      if (finalText) ask(finalText);
      else setPhase((p) => (p === "listening" ? "idle" : p));
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setError("Voice input couldn't start. Please try again.");
    }
  };

  const busy = phase === "thinking";
  const greeting = GREETING[language] || GREETING.en;

  return (
    <div className="ss-page" style={{ maxWidth: 780 }}>
      <div style={{ textAlign: "center" }}>
        <span className="ss-eyebrow">VOICE LEARNING</span>
        <h1 className="ss-h1">Learn by talking</h1>
        <p className="ss-lead" style={{ margin: "0 auto" }}>
          Ask a question in your language. Sarthi answers with voice and text.
        </p>
      </div>

      <div className="ss-card soft" style={{ marginTop: 26 }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
          role="group"
          aria-label="Choose language"
        >
          {languages.map((l) => (
            <button
              type="button"
              key={l.code}
              className={`ss-chip ${language === l.code ? "active" : ""}`}
              onClick={() => {
                stopEverything();
                changeLanguage(l.code);
              }}
            >
              {l.nativeName}
            </button>
          ))}
        </div>

        <div className="ss-voice-stage">
          <div className="ss-voice-bot" aria-hidden="true">
            🤖
          </div>
          <strong style={{ fontSize: 20 }}>Sarthi AI</strong>
          <p className="ss-lead" style={{ margin: "6px 0 0" }}>
            “{greeting}”
          </p>

          <button
            type="button"
            className={`ss-mic ${phase === "listening" ? "live" : ""}`}
            onClick={listen}
            disabled={!supported || busy || !online}
            aria-label={
              phase === "listening"
                ? "Stop listening"
                : "Tap to speak your question"
            }
          >
            🎙️
          </button>

          <div aria-live="polite" style={{ minHeight: 30, fontWeight: 700 }}>
            {phase === "idle" && (supported ? "Tap to speak" : "")}
            {phase === "listening" && (
              <span className="ss-bars" aria-label="Listening">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
            )}
            {phase === "thinking" && (
              <>
                Sarthi is thinking{" "}
                <span className="ss-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </>
            )}
            {phase === "speaking" && (
              <>
                <span className="ss-bars" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>{" "}
                <button
                  type="button"
                  className="ss-chip"
                  onClick={stopEverything}
                >
                  ⏹ Stop
                </button>
              </>
            )}
          </div>

          {!supported && (
            <div className="ss-alert" style={{ marginTop: 14 }}>
              Voice input isn't supported in this browser. Please use Google
              Chrome, or type your question below.
            </div>
          )}
          {!online && (
            <div className="ss-alert" style={{ marginTop: 14 }}>
              You're offline. This feature requires an internet connection.
            </div>
          )}
          {error && (
            <div className="ss-alert error" style={{ marginTop: 14 }} role="alert">
              {error}
            </div>
          )}

          <form
            className="ss-transcript"
            onSubmit={(e) => {
              e.preventDefault();
              const value = typed;
              setTyped("");
              ask(value);
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="ss-input"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="Or type your question..."
                aria-label="Type your question"
                maxLength={500}
                disabled={busy || !online}
              />
              <button
                type="submit"
                className="ss-btn"
                disabled={busy || !online || !typed.trim()}
              >
                Ask
              </button>
            </div>
          </form>

          {(transcript || answer) && (
            <div className="ss-transcript" style={{ display: "grid", gap: 12 }}>
              {transcript && (
                <div className="ss-msg me" style={{ justifySelf: "end" }}>
                  {transcript}
                </div>
              )}
              {answer && (
                <div className="ss-msg bot" style={{ maxWidth: "100%" }}>
                  {answer}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
