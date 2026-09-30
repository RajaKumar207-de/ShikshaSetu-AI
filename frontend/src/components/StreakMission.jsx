const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

// Streak + weekly mission card. Pure presentational: all numbers come
// from /api/learning/summary (nothing is hard-coded).
export default function StreakMission({ summary }) {
  if (!summary) return null;

  const { streak, mission } = summary;
  const days = summary.week || [];

  return (
    <div className="ss-grid two">
      <div className="ss-card">
        <h3 className="ss-section-title" style={{ fontSize: 18 }}>
          🔥 {streak.streak} day learning streak
        </h3>
        <p className="ss-note" style={{ margin: 0 }}>
          {streak.streak > 0
            ? "Nice consistency. Study a little every day to keep it going."
            : "Complete a lesson or quiz today to start your streak."}
        </p>

        <div className="ss-week" aria-label="Last 7 days of learning">
          {days.map((d) => {
            const dayIndex = new Date(`${d.date}T00:00:00Z`).getUTCDay();
            return (
              <div key={d.date} className={d.active ? "on" : ""}>
                <span aria-label={d.active ? "Studied" : "No activity"}>
                  {d.active ? "✓" : "○"}
                </span>
                {DAY_LABELS[dayIndex]}
              </div>
            );
          })}
        </div>
      </div>

      <div className="ss-card">
        <h3 className="ss-section-title" style={{ fontSize: 18 }}>
          🎯 Weekly mission
          {mission.focusTopic ? `: ${mission.focusTopic}` : ""}
        </h3>

        <div className="ss-stat-row">
          <span>Lessons</span>
          <b>
            {mission.lessons.done}/{mission.lessons.target}
          </b>
        </div>
        <div className="ss-stat-row">
          <span>Quizzes & practice</span>
          <b>
            {mission.quizzes.done}/{mission.quizzes.target}
          </b>
        </div>
        <div className="ss-stat-row">
          <span>AI doubts asked</span>
          <b>{mission.doubts}</b>
        </div>

        <div style={{ marginTop: 12 }}>
          <div
            className="ss-bar"
            role="progressbar"
            aria-valuenow={mission.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Weekly mission progress"
          >
            <span style={{ width: `${mission.progress}%` }} />
          </div>
          <p className="ss-note" style={{ margin: "8px 0 0" }}>
            {mission.progress}% of this week's mission
          </p>
        </div>

        {mission.achievement && (
          <div className="ss-alert success" style={{ marginTop: 12 }}>
            🏅 Achievement unlocked: {mission.achievement}
          </div>
        )}
      </div>
    </div>
  );
}
