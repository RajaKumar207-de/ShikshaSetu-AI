import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Shared building blocks for the admin and mentor panels.

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export const lastActiveLabel = (days) => {
  if (days === null || days === undefined) return "Never";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
};

// Average response time: minutes under an hour, hours after that.
export const formatResponse = (hours) => {
  if (hours === null || hours === undefined) return "—";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${Math.round(hours * 10) / 10} h`;
  return `${Math.round(hours / 24)} days`;
};

export const scoreBand = (score) => {
  if (score === null || score === undefined) return "not_assessed";
  if (score >= 70) return "strong";
  if (score >= 50) return "improving";
  return "needs_practice";
};

const BAND_LABEL = {
  strong: "Strong",
  improving: "Improving",
  needs_practice: "Needs practice",
  not_assessed: "Not assessed",
};

export function StatTile({ icon, label, value, hint, tone }) {
  return (
    <div className={`pn-stat${tone ? ` ${tone}` : ""}`}>
      <div className="pn-stat-icon" aria-hidden="true">{icon}</div>
      <div>
        <div className="pn-stat-value">{value ?? "—"}</div>
        <div className="pn-stat-label">{label}</div>
        {hint && <div className="pn-stat-hint">{hint}</div>}
      </div>
    </div>
  );
}

export function ScorePill({ score }) {
  const band = scoreBand(score);
  return (
    <span className={`ss-pill ${band}`}>
      {score === null || score === undefined ? BAND_LABEL[band] : `${score}%`}
    </span>
  );
}

export function ActivePill({ days }) {
  const inactive = days === null || days === undefined || days >= 7;
  return (
    <span className={`ss-pill ${inactive ? "needs_practice" : "strong"}`}>
      {inactive ? "⏸ " : "● "}
      {lastActiveLabel(days)}
    </span>
  );
}

// Single-series bar chart of learning events per day, with hover tooltips.
export function ActivityChart({ days }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...days.map((d) => d.events));
  const total = days.reduce((sum, d) => sum + d.events, 0);

  return (
    <div className="pn-chart">
      <div className="pn-chart-head">
        <div>
          <h3>Learning activity</h3>
          <p>Lessons, quizzes and AI doubts per day · last 14 days</p>
        </div>
        <strong>{total} events</strong>
      </div>

      <div className="pn-chart-plot" role="img" aria-label={`Learning activity, ${total} events in 14 days`}>
        <div className="pn-chart-gridline" style={{ bottom: "100%" }}>
          <span>{max}</span>
        </div>
        <div className="pn-chart-gridline" style={{ bottom: "50%" }}>
          <span>{Math.round(max / 2)}</span>
        </div>

        {days.map((d, i) => (
          <div
            key={d.date}
            className="pn-chart-col"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            tabIndex={0}
          >
            <span
              className={`pn-chart-bar${hover === i ? " hover" : ""}`}
              style={{ height: `${(d.events / max) * 100}%` }}
            />
            {hover === i && (
              <div className="pn-chart-tip" role="tooltip">
                <strong>{formatDate(d.date).replace(/ \d{4}$/, "")}</strong>
                <span>{d.events} events</span>
                <span>{d.students} active student{d.students === 1 ? "" : "s"}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pn-chart-axis">
        <span>{formatDate(days[0]?.date).replace(/ \d{4}$/, "")}</span>
        <span>Today</span>
      </div>
    </div>
  );
}

// Detailed progress for one student (used by both panels).
export function StudentProgressView({ progress }) {
  if (!progress) return null;

  return (
    <div className="pn-progress">
      <div className="pn-stats small">
        <StatTile icon="🎯" label="Overall average" value={progress.overallAverage === null ? "—" : `${progress.overallAverage}%`} />
        <StatTile icon="🔥" label="Day streak" value={progress.streak} />
        <StatTile icon="📘" label="Lessons done" value={progress.totals.lessons} />
        <StatTile icon="📝" label="Quizzes taken" value={progress.totals.quizzes} />
        <StatTile icon="🤖" label="AI doubts asked" value={progress.totals.doubts} />
        <StatTile icon="🕒" label="Last active" value={lastActiveLabel(progress.inactiveDays)} />
      </div>

      <div className="pn-week" aria-label="Active days this week">
        {progress.week.map((d) => (
          <span
            key={d.date}
            className={d.active ? "on" : ""}
            title={`${formatDate(d.date)}: ${d.active ? "studied" : "no activity"}`}
          >
            {new Date(d.date).toLocaleDateString("en-IN", { weekday: "narrow" })}
          </span>
        ))}
      </div>

      <h4 className="pn-subhead">Subject progress</h4>
      <div className="pn-subjects">
        {progress.subjects.map((s) => (
          <div key={s.name} className="pn-subject">
            <div className="pn-subject-top">
              <strong>{s.name}</strong>
              <ScorePill score={s.average} />
            </div>
            <div className={`ss-bar ${scoreBand(s.average)}`}>
              <span style={{ width: `${s.average ?? 0}%` }} />
            </div>
            <small>
              {s.lessonsCompleted}/{s.totalTopics} lessons completed
            </small>
          </div>
        ))}
      </div>

      <h4 className="pn-subhead">Needs attention</h4>
      {progress.weakTopics.length ? (
        <div className="pn-tags">
          {progress.weakTopics.map((t) => (
            <span key={`${t.subject}-${t.topic}`} className="pn-tag warn">
              {t.topic} · {t.subject} · {t.score}%
            </span>
          ))}
        </div>
      ) : (
        <p className="pn-muted">No weak topics right now. 🎉</p>
      )}

      <h4 className="pn-subhead">Recent scores</h4>
      {progress.recentScores.length ? (
        <div className="pn-table-wrap">
          <table className="pn-table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Type</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {progress.recentScores.map((r, i) => (
                <tr key={i}>
                  <td>
                    {r.topic}
                    <small className="pn-muted"> · {r.subject}</small>
                  </td>
                  <td className="pn-capitalize">{r.type}</td>
                  <td><ScorePill score={r.percent} /></td>
                  <td>{formatDate(r.occurredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="pn-muted">No quizzes taken yet.</p>
      )}
    </div>
  );
}

export function Drawer({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // Portal: page wrappers use transform animations, which would otherwise
  // trap this fixed overlay inside them.
  return createPortal(
    <div className="pn-drawer-backdrop" onClick={onClose}>
      <aside
        className="pn-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="pn-drawer-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="ss-icon-btn" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="pn-drawer-body">{children}</div>
      </aside>
    </div>,
    document.body
  );
}

export function Pager({ pagination, onPage }) {
  if (!pagination || pagination.total <= pagination.limit) return null;
  const pages = Math.ceil(pagination.total / pagination.limit);
  return (
    <div className="pn-pager">
      <button
        type="button"
        className="ss-btn ghost small"
        disabled={pagination.page <= 1}
        onClick={() => onPage(pagination.page - 1)}
      >
        ← Prev
      </button>
      <span>
        Page {pagination.page} of {pages}
      </span>
      <button
        type="button"
        className="ss-btn ghost small"
        disabled={!pagination.hasNext}
        onClick={() => onPage(pagination.page + 1)}
      >
        Next →
      </button>
    </div>
  );
}

export function LoadingRows({ count = 4 }) {
  return (
    <div className="pn-loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="ss-skeleton" style={{ height: 52 }} />
      ))}
    </div>
  );
}

// Guard for role-only pages.
export function AccessDenied({ role }) {
  return (
    <div className="ss-page">
      <div className="ss-card ss-state">
        <div className="icon">🔒</div>
        <h3>{role} access only</h3>
        <p>Please sign in with a {role.toLowerCase()} account to open this page.</p>
      </div>
    </div>
  );
}
