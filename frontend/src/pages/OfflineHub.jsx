import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useOnline from "../hooks/useOnline";
import { isLoggedIn } from "../utils/api";
import {
  deleteOfflineLesson,
  getAllOfflineLessons,
  saveOfflineLesson,
} from "../utils/offlineDB";
import { cacheGet, cacheSet } from "../utils/idbCache";
import {
  pendingCount,
  syncPendingEvents,
  SYNC_EVENT,
} from "../utils/learningSync";
import { lessonLibrary, testQuestions } from "../data/lessonLibrary";
import { explanationsKey } from "../utils/explanations";

const SUBJECT_ICON = {
  Mathematics: "📐",
  Science: "🔬",
  Computer: "💻",
  English: "📖",
};

const formatSize = (bytes) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

// Real size of a pack = size of the JSON that is stored on the device.
const packSize = (subject) =>
  new Blob([
    JSON.stringify({
      lessons: lessonLibrary[subject],
      quiz: testQuestions[subject],
    }),
  ]).size;

export default function OfflineHub() {
  const navigate = useNavigate();
  const online = useOnline();

  const [downloaded, setDownloaded] = useState([]);
  const [progress, setProgress] = useState({}); // subject -> 0..100
  const [pending, setPending] = useState(0);
  const [explanations, setExplanations] = useState([]);
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    setDownloaded(await getAllOfflineLessons());
    setPending(await pendingCount());
    const saved = await cacheGet(explanationsKey());
    setExplanations(saved?.value || []);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(SYNC_EVENT, refresh);
    return () => window.removeEventListener(SYNC_EVENT, refresh);
  }, [refresh]);

  const countFor = (subject) =>
    downloaded.filter((l) => l.subject === subject).length;

  const topicsOf = (subject) => Object.keys(lessonLibrary[subject]);

  const downloadPack = async (subject) => {
    setMessage("");
    const topics = topicsOf(subject);
    setProgress((p) => ({ ...p, [subject]: 1 }));

    try {
      for (let i = 0; i < topics.length; i += 1) {
        const ok = await saveOfflineLesson({
          subject,
          topic: topics[i],
          lesson: lessonLibrary[subject][topics[i]],
        });
        if (!ok) throw new Error("save failed");
        setProgress((p) => ({
          ...p,
          [subject]: Math.round(((i + 1) / topics.length) * 100),
        }));
      }
      await cacheSet(`pack-quiz:${subject}`, testQuestions[subject]);
      setMessage(`${subject} pack is ready to use offline.`);
    } catch {
      setMessage(
        "Couldn't save the pack on this device. Check that you have free storage and that private browsing is off."
      );
    } finally {
      setProgress((p) => {
        const next = { ...p };
        delete next[subject];
        return next;
      });
      refresh();
    }
  };

  const removePack = async (subject) => {
    for (const topic of topicsOf(subject)) {
      await deleteOfflineLesson(subject, topic);
    }
    setMessage(`${subject} pack removed from this device.`);
    refresh();
  };

  const syncNow = async () => {
    setMessage("");
    const { synced } = await syncPendingEvents();
    setMessage(
      synced ? "Everything synced." : "Nothing to sync right now."
    );
    refresh();
  };

  const openLesson = (l) =>
    navigate("/lesson", { state: { subject: l.subject, topic: l.topic } });

  const hasLessons = downloaded.length > 0;

  return (
    <div className="ss-page">
      <span className="ss-eyebrow">OFFLINE LEARNING ENGINE</span>
      <h1 className="ss-h1">
        {online ? "Learn anywhere, even without internet" : "You are offline. Your learning continues."}
      </h1>
      <p className="ss-lead">
        Download learning packs while you have internet. Lessons, quizzes and
        your progress keep working when the network drops.
      </p>

      {message && (
        <div className="ss-alert success" style={{ marginTop: 18 }} role="status">
          {message}
        </div>
      )}

      <div className="ss-grid two" style={{ marginTop: 24 }}>
        <div className="ss-card">
          <h2 className="ss-section-title">Available offline</h2>
          <ul className="ss-checklist">
            <li className={hasLessons ? "" : "no"}>
              Downloaded lessons ({downloaded.length})
            </li>
            <li className={hasLessons ? "" : "no"}>
              Quizzes for downloaded subjects
            </li>
            <li>Progress saved on this device ({pending} waiting to sync)</li>
            <li className={explanations.length ? "" : "no"}>
              Saved AI explanations ({explanations.length})
            </li>
            <li className="no">
              Live AI answers, voice, scholarship search and mentors need
              internet
            </li>
          </ul>
        </div>

        <div className="ss-card">
          <h2 className="ss-section-title">Sync status</h2>
          {!isLoggedIn() ? (
            <p className="ss-note">Sign in to save and sync your progress.</p>
          ) : pending === 0 ? (
            <div className="ss-alert success">✓ Everything is synced.</div>
          ) : (
            <>
              <div className="ss-alert">
                {pending} update{pending === 1 ? "" : "s"} saved on this device
                {online ? "" : ". They will sync when you're back online."}
              </div>
              <button
                type="button"
                className="ss-btn"
                style={{ marginTop: 12 }}
                onClick={syncNow}
                disabled={!online}
              >
                Sync now
              </button>
            </>
          )}
        </div>
      </div>

      <h2 className="ss-section-title" style={{ marginTop: 34 }}>
        Learning packs
      </h2>
      {!online && (
        <p className="ss-note" style={{ marginBottom: 12 }}>
          You're offline, so new packs can't be downloaded now.
        </p>
      )}
      <div style={{ display: "grid", gap: 12 }}>
        {Object.keys(lessonLibrary).map((subject) => {
          const have = countFor(subject);
          const total = topicsOf(subject).length;
          const complete = have === total;
          const busy = progress[subject] !== undefined;

          return (
            <div className="ss-pack" key={subject}>
              <div className="ico" aria-hidden="true">
                {SUBJECT_ICON[subject]}
              </div>
              <div className="info">
                <h4>{subject}</h4>
                <p>
                  {total} lessons and a quiz · {formatSize(packSize(subject))}
                </p>
                {busy && (
                  <div
                    className="ss-bar"
                    style={{ marginTop: 8 }}
                    role="progressbar"
                    aria-valuenow={progress[subject]}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span style={{ width: `${progress[subject]}%` }} />
                  </div>
                )}
              </div>
              {complete ? (
                <>
                  <span className="ss-pill done">Available offline</span>
                  <button
                    type="button"
                    className="ss-btn ghost small"
                    onClick={() => removePack(subject)}
                  >
                    Remove
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="ss-btn small"
                  onClick={() => downloadPack(subject)}
                  disabled={busy}
                >
                  {busy
                    ? `${progress[subject]}%`
                    : have
                      ? `Finish download (${have}/${total})`
                      : "Download pack"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {hasLessons && (
        <>
          <h2 className="ss-section-title" style={{ marginTop: 34 }}>
            Downloaded lessons
          </h2>
          <div className="ss-grid three">
            {downloaded.map((l) => (
              <button
                type="button"
                key={l.id}
                className="ss-card"
                style={{ textAlign: "left", cursor: "pointer" }}
                onClick={() => openLesson(l)}
              >
                <span className="ss-pill">{l.subject}</span>
                <h4 style={{ margin: "10px 0 0", fontSize: 16 }}>{l.topic}</h4>
              </button>
            ))}
          </div>
        </>
      )}

      <h2 className="ss-section-title" style={{ marginTop: 34 }}>
        Saved explanations
      </h2>
      {explanations.length === 0 ? (
        <div className="ss-card ss-state">
          <div className="icon">💡</div>
          <h3>No saved explanations yet</h3>
          Answers from the AI Tutor are saved here so you can re-read them
          offline.
          <div style={{ marginTop: 14 }}>
            <Link to="/ai-tutor" className="ss-btn small">
              Ask the AI Tutor
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {explanations.map((e) => (
            <details className="ss-card" key={e.id}>
              <summary style={{ fontWeight: 800, cursor: "pointer" }}>
                {e.question}
              </summary>
              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                {e.answer}
              </p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
