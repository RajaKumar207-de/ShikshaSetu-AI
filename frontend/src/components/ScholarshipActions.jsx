import { openSarthi, publishSarthiContext } from "../utils/sarthiContext";
import { isLoggedIn } from "../utils/api";

// Track / reminder + "Ask Sarthi" buttons for one scholarship card.
export default function ScholarshipActions({
  scholarship,
  tracked,
  busy,
  onToggleTrack,
}) {
  const daysLeft = scholarship.deadlineDate
    ? Math.ceil(
        (new Date(scholarship.deadlineDate).getTime() - Date.now()) / 86400000
      )
    : null;

  const ask = () => {
    publishSarthiContext({ scholarshipId: scholarship._id });
    openSarthi("Am I eligible for this?");
  };

  return (
    <div style={{ marginTop: 14 }}>
      {daysLeft !== null && (
        <p
          className={`ss-pill ${daysLeft <= 2 ? "urgent" : daysLeft <= 7 ? "improving" : ""}`}
          style={{ marginBottom: 10 }}
        >
          {daysLeft > 0
            ? `⏰ ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
            : "Deadline passed"}
        </p>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className={`ss-btn small ${tracked ? "ghost" : ""}`}
          onClick={() => onToggleTrack(scholarship)}
          disabled={busy}
          aria-pressed={tracked}
        >
          {busy
            ? "Please wait..."
            : tracked
              ? "🔔 Tracking · Stop"
              : "🔔 Track scholarship"}
        </button>

        {isLoggedIn() && (
          <button type="button" className="ss-btn small ghost" onClick={ask}>
            ✨ Ask Sarthi
          </button>
        )}
      </div>

      {tracked && !scholarship.deadlineDate && (
        <p className="ss-note" style={{ marginTop: 8 }}>
          No exact deadline date is listed, so reminders can't be scheduled.
          Check the official website.
        </p>
      )}
    </div>
  );
}
