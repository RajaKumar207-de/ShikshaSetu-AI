import { useState } from "react";
import api from "../utils/api";
import useOnline from "../hooks/useOnline";

const ACTIONS = [
  { mode: "simple", label: "💬 Explain simply" },
  { mode: "example", label: "🌾 Explain with example" },
  { mode: "language", label: "🗣️ Explain in my language" },
  { mode: "another", label: "🔄 Explain another way" },
];

// "Explain It My Way": follow-up actions shown under an AI Tutor answer.
export default function ExplainActions({
  question,
  answer,
  language,
  onResult,
  onSpeak,
  speaking,
  preparing,
}) {
  const online = useOnline();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const run = async (mode) => {
    if (!navigator.onLine) {
      setError("You're offline. This feature requires an internet connection.");
      return;
    }
    setBusy(mode);
    setError("");
    try {
      const { data } = await api.post("/api/ai/explain", {
        question,
        answer,
        mode,
        language,
      });
      onResult({ answer: data.answer, speechText: data.speechText });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Couldn't explain that again. Please try once more."
      );
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="ss-explain">
      <h4>Explain it my way</h4>
      <div className="row">
        {ACTIONS.map((a) => (
          <button
            type="button"
            key={a.mode}
            className="ss-chip"
            onClick={() => run(a.mode)}
            disabled={Boolean(busy) || !online}
          >
            {busy === a.mode ? "Thinking..." : a.label}
          </button>
        ))}
        <button
          type="button"
          className="ss-chip"
          onClick={onSpeak}
          disabled={!online}
        >
          {preparing
            ? "⏳ Preparing voice..."
            : speaking
              ? "⏹ Stop voice"
              : "🔊 Explain by voice"}
        </button>
      </div>

      {busy && (
        <p className="ss-note" style={{ marginTop: 10 }} role="status">
          Sarthi is thinking{" "}
          <span className="ss-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </p>
      )}
      {error && (
        <div className="ss-alert error" style={{ marginTop: 10 }} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
