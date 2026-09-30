import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import api, { isLoggedIn } from "../utils/api";
import useOnline from "../hooks/useOnline";
import { useLanguage } from "../context/LanguageContext";
import {
  CONTEXT_EVENT,
  OPEN_EVENT,
  getSarthiContext,
} from "../utils/sarthiContext";
import { recordLearningEvent } from "../utils/learningSync";
import { playSpeech } from "../utils/voice";

const PAGE_FROM_PATH = {
  "/learning": "learning",
  "/lesson": "lesson",
  "/scholarships": "scholarships",
  "/career": "career",
  "/progress": "progress",
  "/mentors": "mentors",
  "/ai-tutor": "ai-tutor",
  "/learning-path": "learning",
};

const SUGGESTIONS = {
  scholarships: [
    "Am I eligible for this?",
    "Which documents do I need?",
    "What is the deadline?",
    "How much money does it give?",
    "How do I apply step by step?",
  ],
  learning: [
    "I don't understand this topic",
    "Give me a simple example",
    "What should I study first?",
    "How can I remember this easily?",
  ],
  lesson: [
    "I don't understand this topic",
    "Give me a simple example",
    "Explain it in simpler words",
    "Ask me a practice question",
  ],
  career: [
    "What should I learn next?",
    "How do I start?",
    "Which free resources can I use?",
    "What projects can I build?",
  ],
  default: [
    "How can I study better?",
    "What can I do on ShikshaSetu?",
    "How do I find a scholarship?",
  ],
};

const POS_KEY = "shikshasetu-sarthi-pos";
const DRAG_THRESHOLD = 6; // px before a press counts as a drag
const EDGE = 16; // margin kept from the screen edge

const readPos = () => {
  try {
    const pos = JSON.parse(localStorage.getItem(POS_KEY) || "null");
    return pos && Number.isFinite(pos.x) && Number.isFinite(pos.y) ? pos : null;
  } catch {
    return null;
  }
};

export default function SarthiAssistant() {
  const location = useLocation();
  const online = useOnline();
  const { language } = useLanguage();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [speakingIndex, setSpeakingIndex] = useState(-1);
  const [, force] = useState(0);

  // ---- Draggable launcher -------------------------------------------
  // The button follows the pointer with a spring-like ease (no React
  // re-render per frame: the transform is written straight to the DOM),
  // tilts slightly with speed, and glides to the nearest screen edge on
  // release. The final position is remembered per browser.
  const fabRef = useRef(null);
  const posRef = useRef(null); // current rendered position
  const targetRef = useRef(null); // where it is heading
  const rafRef = useRef(0);
  const dragRef = useRef(null);
  const movedRef = useRef(false);
  const easeRef = useRef(0.2);

  const reduceMotion = () =>
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const bounds = useCallback(() => {
    const el = fabRef.current;
    const w = el?.offsetWidth || 150;
    const h = el?.offsetHeight || 50;
    return {
      w,
      h,
      maxX: Math.max(EDGE, window.innerWidth - w - EDGE),
      maxY: Math.max(EDGE, window.innerHeight - h - EDGE),
    };
  }, []);

  const clampPoint = useCallback(
    (x, y) => {
      const { maxX, maxY } = bounds();
      return {
        x: Math.min(Math.max(EDGE, x), maxX),
        y: Math.min(Math.max(EDGE, y), maxY),
      };
    },
    [bounds]
  );

  const paint = useCallback((tilt = 0, scale = 1) => {
    const el = fabRef.current;
    const p = posRef.current;
    if (!el || !p) return;
    el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${tilt}deg) scale(${scale})`;
  }, []);

  const tick = useCallback(function step() {
    const p = posRef.current;
    const t = targetRef.current;
    if (!p || !t) return;

    const ease = reduceMotion() ? 1 : easeRef.current;
    const dx = (t.x - p.x) * ease;
    const dy = (t.y - p.y) * ease;
    p.x += dx;
    p.y += dy;

    const dragging = Boolean(dragRef.current);
    const tilt = Math.max(-9, Math.min(9, dx * 0.55));
    paint(tilt, dragging ? 1.07 : 1);

    const settled = Math.abs(t.x - p.x) < 0.15 && Math.abs(t.y - p.y) < 0.15;
    if (settled && !dragging) {
      p.x = t.x;
      p.y = t.y;
      paint(0, 1);
      rafRef.current = 0;
      return;
    }
    rafRef.current = requestAnimationFrame(step);
  }, [paint]);

  const startLoop = useCallback(() => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  // Callback ref: (re)initialise whenever the button mounts.
  const attachFab = useCallback(
    (el) => {
      fabRef.current = el;
      if (!el) return;

      if (!posRef.current) {
        const saved = readPos();
        const { maxX, maxY } = bounds();
        posRef.current = saved
          ? clampPoint(saved.x, saved.y)
          : { x: maxX - 12, y: maxY - 12 };
        targetRef.current = { ...posRef.current };
      }
      paint();
    },
    [bounds, clampPoint, paint]
  );

  useEffect(() => {
    const onResize = () => {
      if (!posRef.current) return;
      targetRef.current = clampPoint(
        targetRef.current.x,
        targetRef.current.y
      );
      posRef.current = { ...targetRef.current };
      paint();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [clampPoint, paint]);

  const onPointerDown = (e) => {
    const rect = fabRef.current.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    movedRef.current = false;
    easeRef.current = 0.32; // tight while dragging, still soft
    fabRef.current.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    if (
      !movedRef.current &&
      Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_THRESHOLD
    ) {
      return;
    }
    movedRef.current = true;
    fabRef.current.classList.add("dragging");
    targetRef.current = clampPoint(
      e.clientX - d.offsetX,
      e.clientY - d.offsetY
    );
    startLoop();
  };

  const onPointerUp = () => {
    const wasDragging = dragRef.current && movedRef.current;
    dragRef.current = null;
    fabRef.current?.classList.remove("dragging");

    if (wasDragging) {
      // Glide to the nearest side edge.
      const { maxX } = bounds();
      const t = targetRef.current;
      const snapped = clampPoint(t.x < maxX / 2 ? EDGE : maxX, t.y);
      targetRef.current = snapped;
      easeRef.current = 0.11; // slow, flowing settle
      try {
        localStorage.setItem(POS_KEY, JSON.stringify(snapped));
      } catch {
        // storage unavailable: position just isn't remembered
      }
      startLoop();
    }
  };

  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);

  const page = PAGE_FROM_PATH[location.pathname] || "home";
  const suggestions = SUGGESTIONS[page] || SUGGESTIONS.default;
  const asked = new Set(
    messages.filter((m) => m.role === "user").map((m) => m.text)
  );
  const followUps = suggestions.filter((s) => !asked.has(s));

  // Re-render when a page publishes new context.
  useEffect(() => {
    const onCtx = () => force((n) => n + 1);
    const onOpen = (event) => {
      setOpen(true);
      if (event.detail?.message) setText(event.detail.message);
    };
    window.addEventListener(CONTEXT_EVENT, onCtx);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener(CONTEXT_EVENT, onCtx);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    bodyRef.current?.scrollTo({
      top: bodyRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => audioRef.current?.stop(), []);

  if (!isLoggedIn()) return null;

  const buildContext = () => {
    const published = getSarthiContext();
    const state = location.state || {};
    return {
      page,
      subject: state.subject || published.subject,
      topic: state.topic || published.topic,
      scholarshipId: published.scholarshipId,
      profile: published.profile,
      career: published.career,
    };
  };

  const send = async (raw) => {
    const message = (raw ?? text).trim();
    if (!message || busy) return;

    if (!navigator.onLine) {
      setError("You're offline. Sarthi needs an internet connection.");
      return;
    }

    const history = messages.slice(-6);
    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setText("");
    setError("");
    setBusy(true);

    const context = buildContext();

    try {
      const { data } = await api.post("/api/ai/sarthi", {
        message,
        language,
        context,
        history,
      });
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.reply, speechText: data.speechText },
      ]);

      if (context.subject && ["learning", "lesson"].includes(page)) {
        recordLearningEvent({
          type: "ai_doubt",
          subject: context.subject,
          topic: context.topic || "",
        });
      }
    } catch (err) {
      setError(
        err.response?.status === 429
          ? err.response.data.message
          : err.response?.data?.message ||
              "Sarthi couldn't answer right now. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const speak = async (index) => {
    if (speakingIndex === index) {
      audioRef.current?.stop();
      setSpeakingIndex(-1);
      return;
    }
    audioRef.current?.stop();
    const msg = messages[index];
    try {
      setSpeakingIndex(index);
      audioRef.current = await playSpeech(
        msg.speechText || msg.text,
        language
      );
      await audioRef.current.finished;
    } catch {
      setError("Couldn't play the voice. You can still read the answer.");
    } finally {
      setSpeakingIndex(-1);
    }
  };

  if (!open) {
    return (
      <button
        ref={attachFab}
        type="button"
        className="ss-fab"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={() => {
          // A drag ends with a click event; ignore it.
          if (movedRef.current) {
            movedRef.current = false;
            return;
          }
          setOpen(true);
        }}
        aria-label="Ask Sarthi, your AI learning companion. Drag to move."
        title="Drag to move"
      >
        <span aria-hidden="true">✨</span>
        <span className="label">Ask Sarthi</span>
      </button>
    );
  }

  return (
    <section
      className="ss-sarthi"
      role="dialog"
      aria-label="Ask Sarthi"
    >
      <div className="ss-sarthi-head">
        <div className="avatar" aria-hidden="true">
          🤖
        </div>
        <div>
          <strong>Sarthi</strong>
          <p>Your ShikshaSetu companion</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close Sarthi"
        >
          ✕
        </button>
      </div>

      <div className="ss-sarthi-body" ref={bodyRef} aria-live="polite">
        {messages.length === 0 && (
          <div className="ss-msg bot">
            Namaste! I'm Sarthi. Ask me about what you're studying, a
            scholarship, or your career path. I'll answer in your selected
            language.
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: "contents" }}>
            <div className={`ss-msg ${m.role === "user" ? "me" : "bot"}`}>
              {m.text}
            </div>
            {m.role === "bot" && (
              <button
                type="button"
                className="ss-chip"
                style={{ alignSelf: "flex-start" }}
                onClick={() => speak(i)}
                disabled={!online}
              >
                {speakingIndex === i ? "⏹ Stop" : "🔊 Listen"}
              </button>
            )}
          </div>
        ))}

        {busy && (
          <div className="ss-msg bot">
            Sarthi is thinking{" "}
            <span className="ss-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </div>
        )}

        {error && <div className="ss-alert error">{error}</div>}

        {/* Suggestions after every reply (skipping ones already asked) */}
        {!busy &&
          (messages.length === 0 ||
            messages[messages.length - 1].role === "bot") &&
          followUps.length > 0 && (
            <div className="ss-suggest" aria-label="Suggested questions">
              {followUps.map((s) => (
                <button
                  type="button"
                  key={s}
                  className="ss-chip"
                  onClick={() => send(s)}
                  disabled={!online}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
      </div>

      <div className="ss-sarthi-foot">
        {!online && (
          <div className="ss-alert" style={{ marginBottom: 10 }}>
            You're offline. This feature requires an internet connection.
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            ref={inputRef}
            className="ss-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask Sarthi..."
            aria-label="Message for Sarthi"
            maxLength={600}
            disabled={!online}
          />
          <button
            type="submit"
            className="ss-btn"
            disabled={!online || busy || !text.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
