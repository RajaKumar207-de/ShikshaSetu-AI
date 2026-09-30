import { useEffect, useMemo, useState } from "react";
import { publishSarthiContext } from "../utils/sarthiContext";

const storageKey = (roadmap) =>
  `shikshasetu-career-journey:${(roadmap.recommendedCareer || "career")
    .toLowerCase()
    .slice(0, 60)}`;

const readDone = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

// Turns the AI roadmap into a visual journey. AI output is validated
// here: if `journey` is missing or malformed we fall back to the
// classic 5-step roadmap so the page never breaks.
const normalize = (roadmap) => {
  const j = roadmap.journey;
  const okPath =
    Array.isArray(j?.path) &&
    j.path.filter((p) => p && typeof p.title === "string").length >= 2;

  if (okPath) {
    return {
      field: String(j.field || roadmap.recommendedCareer || "Your field"),
      specializations: Array.isArray(j.specializations)
        ? j.specializations.filter((s) => typeof s === "string").slice(0, 4)
        : [],
      stages: j.path
        .filter((p) => p && typeof p.title === "string")
        .slice(0, 8)
        .map((p) => ({
          title: p.title,
          description: typeof p.description === "string" ? p.description : "",
          skills: Array.isArray(p.skills)
            ? p.skills.filter((s) => typeof s === "string").slice(0, 4)
            : [],
        })),
    };
  }

  return {
    field: String(roadmap.recommendedCareer || "Your field"),
    specializations: [],
    stages: (roadmap.roadmap || []).map((step) => ({
      title: step.title,
      description: step.description || "",
      skills: [],
    })),
  };
};

export default function CareerJourney({ roadmap }) {
  const journey = useMemo(() => normalize(roadmap), [roadmap]);
  const key = storageKey(roadmap);
  const [done, setDone] = useState(() => readDone(key));

  useEffect(() => {
    setDone(readDone(key));
  }, [key]);

  const currentIndex = journey.stages.findIndex((_, i) => !done.includes(i));

  useEffect(() => {
    publishSarthiContext({
      career: {
        field: journey.field,
        recommendedCareer: roadmap.recommendedCareer,
        stages: journey.stages.map((s) => s.title),
        currentStage:
          currentIndex === -1
            ? "All stages completed"
            : journey.stages[currentIndex].title,
      },
    });
  }, [journey, roadmap.recommendedCareer, currentIndex]);

  const toggle = (index) => {
    const next = done.includes(index)
      ? done.filter((i) => i < index) // un-completing resets later stages
      : [...new Set([...done, index])];
    setDone(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // storage unavailable: keep in memory only
    }
  };

  const statusOf = (index) =>
    done.includes(index)
      ? "done"
      : index === currentIndex
        ? "current"
        : "locked";

  const STATUS_TEXT = {
    done: "✓ Completed",
    current: "🟡 Current",
    locked: "🔒 Upcoming",
  };

  return (
    <div className="ss-card" style={{ marginTop: 26 }}>
      <h2 className="ss-section-title">Your career journey</h2>
      <p className="ss-note" style={{ marginTop: 0 }}>
        A suggested path, not a guarantee. Mark each stage as you complete it.
      </p>

      <div className="ss-journey">
        <div
          className="ss-node done"
          style={{ textAlign: "center", maxWidth: 320, animationDelay: "0ms" }}
        >
          <h4>{journey.field}</h4>
          <p>Your chosen field</p>
        </div>

        {journey.specializations.length > 0 && (
          <>
            <div className="ss-link" />
            <div className="ss-branches">
              {journey.specializations.map((s, i) => (
                <span
                  key={s}
                  className="ss-pill"
                  style={{ animation: `ss-rise 0.4s ease ${(i + 1) * 90}ms both` }}
                >
                  {s}
                </span>
              ))}
            </div>
            <p className="ss-note" style={{ margin: "8px 0 0" }}>
              Common specializations
            </p>
          </>
        )}

        {journey.stages.map((stage, i) => {
          const status = statusOf(i);
          return (
            <div
              key={`${stage.title}-${i}`}
              style={{ display: "contents" }}
            >
              <div className="ss-link" />
              <div
                className={`ss-node ${status}`}
                style={{ animationDelay: `${(i + 1) * 110}ms` }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <h4>
                    {i + 1}. {stage.title}
                  </h4>
                  <span className={`ss-pill ${status}`}>
                    {STATUS_TEXT[status]}
                  </span>
                </div>
                {stage.description && <p>{stage.description}</p>}
                {stage.skills.length > 0 && (
                  <div className="skills">
                    {stage.skills.map((skill) => (
                      <em key={skill}>{skill}</em>
                    ))}
                  </div>
                )}
                {status !== "locked" && (
                  <button
                    type="button"
                    className={`ss-btn small ${status === "done" ? "ghost" : ""}`}
                    style={{ marginTop: 12 }}
                    onClick={() => toggle(i)}
                  >
                    {status === "done" ? "Undo" : "Mark as completed"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {currentIndex === -1 && journey.stages.length > 0 && (
        <div className="ss-alert success" style={{ marginTop: 18 }}>
          🎉 You've completed every stage of this journey. Ask Sarthi what to
          learn next.
        </div>
      )}
    </div>
  );
}
