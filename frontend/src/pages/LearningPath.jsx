import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { isLoggedIn } from "../utils/api";
import useOnline from "../hooks/useOnline";
import { useLanguage } from "../context/LanguageContext";
import {
  SYNC_EVENT,
  loadSummary,
  recordLearningEvent,
} from "../utils/learningSync";
import { cacheGet, cacheSet } from "../utils/idbCache";
import { publishSarthiContext } from "../utils/sarthiContext";
import StreakMission from "../components/StreakMission";

const SUBJECTS = ["Mathematics", "Science", "Computer", "English"];

const STATUS_LABEL = {
  strong: "Strong",
  improving: "Improving",
  needs_practice: "Needs practice",
  not_assessed: "Not assessed",
};

const KIND = {
  lesson: { icon: "📖", label: "Lesson", cta: "Open lesson" },
  practice: { icon: "✏️", label: "Practice", cta: "Start practice" },
  revision: { icon: "🔁", label: "Revision", cta: "Revise" },
  assessment: { icon: "🧪", label: "AI assessment", cta: "Take assessment" },
};

// ------------------------------------------------------
// Quiz runner used for both the diagnostic and practice
// ------------------------------------------------------
function QuizRunner({ title, questions, onFinish, onCancel }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const current = questions[index];
  const last = index === questions.length - 1;

  return (
    <div className="ss-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <h3 className="ss-section-title" style={{ marginBottom: 6 }}>
          {title}
        </h3>
        <span className="ss-pill">
          Question {index + 1} / {questions.length}
        </span>
      </div>

      <div className="ss-bar" style={{ margin: "10px 0 18px" }}>
        <span
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>

      <p style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.6 }}>
        {current.question}
      </p>

      <div style={{ display: "grid", gap: 10 }} role="radiogroup">
        {current.options.map((option) => (
          <button
            type="button"
            key={option}
            role="radio"
            aria-checked={answers[index] === option}
            className={`ss-chip ${answers[index] === option ? "active" : ""}`}
            style={{ textAlign: "left", borderRadius: 14, padding: "12px 16px" }}
            onClick={() =>
              setAnswers((prev) => ({ ...prev, [index]: option }))
            }
          >
            {option}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 20,
          flexWrap: "wrap",
        }}
      >
        <button type="button" className="ss-btn ghost" onClick={onCancel}>
          Cancel
        </button>
        {index > 0 && (
          <button
            type="button"
            className="ss-btn ghost"
            onClick={() => setIndex(index - 1)}
          >
            Back
          </button>
        )}
        {!last ? (
          <button
            type="button"
            className="ss-btn"
            disabled={!answers[index]}
            onClick={() => setIndex(index + 1)}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            className="ss-btn"
            disabled={Object.keys(answers).length < questions.length}
            onClick={() => onFinish(answers)}
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------

export default function LearningPath() {
  const navigate = useNavigate();
  const online = useOnline();
  const { language } = useLanguage();
  const loggedIn = isLoggedIn();

  const [subject, setSubject] = useState("Mathematics");
  const [summary, setSummary] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [quiz, setQuiz] = useState(null); // { kind, title, questions, topic? }
  const [preparing, setPreparing] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data, fromCache: cached } = await loadSummary(subject);
      setSummary(data);
      setFromCache(cached);
    } catch {
      setError(
        navigator.onLine
          ? "We couldn't load your learning path. Please try again."
          : "You're offline and there is no saved learning path yet."
      );
    } finally {
      setLoading(false);
    }
  }, [subject]);

  useEffect(() => {
    if (loggedIn) refresh();
    else setLoading(false);
  }, [loggedIn, refresh]);

  useEffect(() => {
    publishSarthiContext({ subject, topic: undefined });
  }, [subject]);

  // Refresh after queued events finish syncing.
  useEffect(() => {
    const onSync = (e) => e.detail?.status === "done" && refresh();
    window.addEventListener(SYNC_EVENT, onSync);
    return () => window.removeEventListener(SYNC_EVENT, onSync);
  }, [refresh]);

  // ----- questions (online -> cache for offline retake) -----

  const getQuestions = async (kind, topics, perTopic) => {
    const key = `questions:${kind}:${subject}:${topics.join("|")}:${language}`;
    try {
      const { data } = await api.post("/api/ai/questions", {
        subject,
        topics,
        perTopic,
        language,
      });
      await cacheSet(key, data.questions);
      return data.questions;
    } catch (err) {
      const cached = await cacheGet(key);
      if (cached?.value?.length) return cached.value;
      throw err;
    }
  };

  const startQuiz = async (kind, topic) => {
    setNotice("");
    setPreparing(kind + (topic || ""));
    try {
      const topics =
        kind === "diagnostic"
          ? summary.mastery[subject].map((t) => t.topic)
          : [topic];
      const questions = await getQuestions(
        kind,
        topics,
        kind === "diagnostic" ? 2 : 3
      );
      setQuiz({
        kind,
        topic,
        questions,
        title:
          kind === "diagnostic"
            ? `${subject} assessment`
            : `Practice: ${topic}`,
      });
    } catch (err) {
      setNotice(
        !navigator.onLine
          ? "You're offline. This assessment needs an internet connection the first time."
          : err.response?.data?.message ||
              "We couldn't prepare questions right now. Please try again."
      );
    } finally {
      setPreparing("");
    }
  };

  const finishQuiz = async (answers) => {
    const perTopic = {};
    quiz.questions.forEach((q, i) => {
      const entry = perTopic[q.topic] || { score: 0, total: 0 };
      entry.total += 1;
      if (answers[i] === q.answer) entry.score += 1;
      perTopic[q.topic] = entry;
    });

    const totalScore = Object.values(perTopic).reduce(
      (s, e) => s + e.score,
      0
    );
    const total = quiz.questions.length;

    await Promise.all(
      Object.entries(perTopic).map(([topic, { score, total: t }]) =>
        recordLearningEvent({
          type: quiz.kind === "diagnostic" ? "diagnostic" : "practice",
          subject,
          topic,
          score,
          total: t,
        })
      )
    );

    setQuiz(null);
    setNotice(
      `You scored ${totalScore} out of ${total}. ${
        navigator.onLine
          ? "Your learning path is being updated."
          : "Your result is saved on this device and will update your path when you're online."
      }`
    );
    setTimeout(refresh, 900);
  };

  const openDay = (day) => {
    if (day.kind === "assessment") return startQuiz("diagnostic");
    if (day.kind === "practice") return startQuiz("practice", day.topic);
    return navigate("/lesson", {
      state: { subject, topic: day.topic },
    });
  };

  // ----- render -----

  if (!loggedIn) {
    return (
      <div className="ss-page">
        <div className="ss-card ss-state">
          <div className="icon">🧭</div>
          <h3>Your personalized learning path</h3>
          <p>Sign in to get a path that adapts to your quiz results.</p>
          <Link to="/login" className="ss-btn">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const topics = summary?.mastery?.[subject] || [];
  const anyAssessed = topics.some((t) => t.score !== null);

  return (
    <div className="ss-page">
      <span className="ss-eyebrow">PERSONALIZED LEARNING</span>
      <h1 className="ss-h1">Your Learning Path</h1>
      <p className="ss-lead">
        A plan built from your own quiz results. It changes as you improve.
      </p>

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "22px 0" }}
        role="tablist"
        aria-label="Subject"
      >
        {SUBJECTS.map((s) => (
          <button
            type="button"
            key={s}
            role="tab"
            aria-selected={subject === s}
            className={`ss-chip ${subject === s ? "active" : ""}`}
            onClick={() => {
              setQuiz(null);
              setSubject(s);
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {fromCache && (
        <div className="ss-alert" style={{ marginBottom: 16 }}>
          Showing your last saved path. It will refresh when you're online.
        </div>
      )}
      {notice && (
        <div className="ss-alert success" style={{ marginBottom: 16 }} role="status">
          {notice}
        </div>
      )}

      {loading && (
        <div className="ss-grid">
          <div className="ss-skeleton" style={{ height: 220 }} />
          <div className="ss-skeleton" style={{ height: 320 }} />
        </div>
      )}

      {!loading && error && (
        <div className="ss-card ss-state">
          <div className="icon">⚠️</div>
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button type="button" className="ss-btn" onClick={refresh}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && summary && quiz && (
        <QuizRunner
          title={quiz.title}
          questions={quiz.questions}
          onFinish={finishQuiz}
          onCancel={() => setQuiz(null)}
        />
      )}

      {!loading && !error && summary && !quiz && (
        <div style={{ display: "grid", gap: 26 }}>
          <StreakMission summary={summary} />

          <section className="ss-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <h2 className="ss-section-title" style={{ margin: 0 }}>
                {subject}: where you stand
              </h2>
              <button
                type="button"
                className="ss-btn"
                onClick={() => startQuiz("diagnostic")}
                disabled={preparing === "diagnostic"}
              >
                {preparing === "diagnostic" ? (
                  <>
                    Preparing
                    <span className="ss-dots" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  </>
                ) : anyAssessed ? (
                  "🧪 Retake assessment"
                ) : (
                  "🧪 Take diagnostic assessment"
                )}
              </button>
            </div>

            {!anyAssessed && (
              <p className="ss-note" style={{ margin: "10px 0 0" }}>
                Nothing is assessed yet. A short assessment finds your weak
                areas so the path can focus on them.
              </p>
            )}

            <div style={{ marginTop: 14 }}>
              {topics.map((t) => (
                <div className="ss-mastery-row" key={t.topic}>
                  <b>{t.topic}</b>
                  <div className={`ss-bar ${t.status}`}>
                    <span style={{ width: `${t.score ?? 0}%` }} />
                  </div>
                  <b>{t.score === null ? "-" : `${t.score}%`}</b>
                  <span className={`ss-pill ${t.status}`}>
                    {STATUS_LABEL[t.status]}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="ss-section-title">Your 7-day plan</h2>
            {summary.path.length === 0 ? (
              <div className="ss-card ss-state">
                <div className="icon">🌱</div>
                <h3>Your personalized learning path is being prepared</h3>
                <p>Take the assessment to get started.</p>
              </div>
            ) : (
              <div className="ss-timeline">
                {summary.path.map((day, i) => {
                  const meta = KIND[day.kind];
                  return (
                    <div
                      className="ss-day"
                      key={day.day}
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className="num">
                        <small>DAY</small>
                        {day.day}
                      </div>
                      <div>
                        <h4>
                          {meta.icon} {meta.label}
                          {day.topic ? `: ${day.topic}` : ""}
                        </h4>
                        <p>{day.reason}</p>
                      </div>
                      <button
                        type="button"
                        className="ss-btn small"
                        disabled={
                          preparing === (day.kind === "assessment" ? "diagnostic" : day.kind) + (day.topic || "")
                        }
                        onClick={() => openDay(day)}
                      >
                        {meta.cta}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {!online && (
              <p className="ss-note" style={{ marginTop: 12 }}>
                You're offline. Downloaded lessons still open. New AI
                questions need internet unless you've used them before.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
