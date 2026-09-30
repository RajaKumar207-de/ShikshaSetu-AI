import { useCallback, useEffect, useState } from "react";
import api, { getCurrentUser } from "../utils/api";
import { ToastStack, useToasts } from "../components/Toast";
import {
  AccessDenied,
  ActivePill,
  Drawer,
  LoadingRows,
  ScorePill,
  StatTile,
  StudentProgressView,
  formatDate,
  formatResponse,
} from "../components/panels/PanelUI";
import "../styles/panels.css";

const LANGUAGES = ["English", "Hindi", "Marathi", "Bengali", "Tamil", "Telugu", "Gujarati", "Punjabi"];
const SUBJECTS = ["Mathematics", "Science", "Computer", "English", "Career Guidance"];

const QUICK_MESSAGES = [
  "You haven't studied for a few days — let's do one short lesson today! 📚",
  "Great progress this week, keep it up! 🌟",
  "Try the practice quiz on your weak topic today. You can do it! 💪",
];

const errorMessage = (error, fallback) => error.response?.data?.message || fallback;

// ==========================================
// STUDENT DETAIL + REMINDER
// ==========================================

function MyStudentDrawer({ student, onClose, toast }) {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api
      .get(`/api/mentor-panel/students/${student.id}`)
      .then((r) => setData(r.data))
      .catch((e) => {
        toast({ type: "error", title: "Could not load progress", message: errorMessage(e, "Try again.") });
        onClose();
      });
  }, [student.id, onClose, toast]);

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post(`/api/mentor-panel/students/${student.id}/remind`, { message });
      toast({ type: "success", title: "Reminder sent", message: `${student.name} will see it in their notifications.` });
      setMessage("");
    } catch (err) {
      toast({ type: "error", title: "Could not send", message: errorMessage(err, "Try again.") });
    } finally {
      setSending(false);
    }
  };

  return (
    <Drawer title={student.name} subtitle={`${student.email} · ${student.language} · connected ${formatDate(student.connectedAt)}`} onClose={onClose}>
      <form className="pn-remind" onSubmit={send}>
        <h4 className="pn-subhead">💬 Send a reminder</h4>
        <div className="pn-chips">
          {QUICK_MESSAGES.map((m) => (
            <button key={m} type="button" className="ss-chip pn-chip-wrap" onClick={() => setMessage(m)}>
              {m}
            </button>
          ))}
        </div>
        <textarea
          className="pn-input"
          rows={3}
          maxLength={300}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a short, encouraging message…"
          aria-label="Reminder message"
        />
        <div className="pn-remind-foot">
          <small className="pn-muted">{message.length}/300</small>
          <button type="submit" className="ss-btn small" disabled={sending || !message.trim()}>
            {sending ? "Sending…" : "Send reminder"}
          </button>
        </div>
      </form>

      {data ? <StudentProgressView progress={data.progress} /> : <LoadingRows />}
    </Drawer>
  );
}

// ==========================================
// TABS
// ==========================================

function StudentsTab({ toast }) {
  const [students, setStudents] = useState(null);
  const [error, setError] = useState("");
  const [inactiveOnly, setInactiveOnly] = useState(false);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    api
      .get("/api/mentor-panel/students")
      .then((r) => setStudents(r.data.students))
      .catch((e) => setError(errorMessage(e, "Could not load your students")));
  }, []);

  const close = useCallback(() => setOpen(null), []);

  if (error) return <div className="ss-alert error">{error}</div>;
  if (!students) return <LoadingRows />;

  const isInactive = (s) => s.stats.inactiveDays === null || s.stats.inactiveDays >= 7;
  const shown = inactiveOnly ? students.filter(isInactive) : students;

  return (
    <div className="pn-stack">
      <div className="pn-toolbar">
        <button type="button" className={`ss-chip${!inactiveOnly ? " active" : ""}`} onClick={() => setInactiveOnly(false)}>
          All ({students.length})
        </button>
        <button type="button" className={`ss-chip${inactiveOnly ? " active" : ""}`} onClick={() => setInactiveOnly(true)}>
          ⏸ Need a nudge ({students.filter(isInactive).length})
        </button>
      </div>

      {shown.length ? (
        <div className="pn-student-grid">
          {shown.map((s) => (
            <button key={s.id} type="button" className="pn-student-card" onClick={() => setOpen(s)}>
              <div className="pn-student-top">
                <div className="pn-avatar" aria-hidden="true">
                  {s.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <strong>{s.name}</strong>
                  <small className="pn-block pn-muted">{s.language}</small>
                </div>
              </div>
              <div className="pn-student-stats">
                <div><span>Avg score</span><ScorePill score={s.stats.averageScore} /></div>
                <div><span>Last active</span><ActivePill days={s.stats.inactiveDays} /></div>
                <div><span>Lessons</span><strong>{s.stats.lessons}</strong></div>
                <div><span>Quizzes</span><strong>{s.stats.quizzes}</strong></div>
              </div>
              <span className="pn-student-cta">View progress →</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="ss-card ss-state">
          <div className="icon">{inactiveOnly ? "🎉" : "🎒"}</div>
          <h3>{inactiveOnly ? "Everyone studied this week" : "No students yet"}</h3>
          <p>{inactiveOnly ? "All your students were active in the last 7 days." : "Accept a student request to see their progress here."}</p>
        </div>
      )}

      {open && <MyStudentDrawer student={open} onClose={close} toast={toast} />}
    </div>
  );
}

function RequestsTab({ toast, onChanged }) {
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("pending");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    api
      .get("/api/mentors/requests")
      .then((r) => setRequests(r.data.requests || []))
      .catch((e) => setError(errorMessage(e, "Could not load requests")));
  }, []);

  useEffect(load, [load]);

  const decide = async (request, status) => {
    setBusyId(request._id);
    try {
      await api.patch(`/api/mentors/request/${request._id}`, { status });
      toast(
        status === "accepted"
          ? { type: "success", title: "Request accepted", message: `${request.student?.name || "The student"} is now your student.` }
          : { type: "info", title: "Request declined", message: "The student has been notified." }
      );
      load();
      onChanged();
    } catch (e) {
      toast({ type: "error", title: "Update failed", message: errorMessage(e, "Try again.") });
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <div className="ss-alert error">{error}</div>;
  if (!requests) return <LoadingRows />;

  const shown = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="pn-stack">
      <div className="pn-toolbar">
        {["pending", "accepted", "rejected", "all"].map((f) => (
          <button key={f} type="button" className={`ss-chip pn-capitalize${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
            {f} ({f === "all" ? requests.length : requests.filter((r) => r.status === f).length})
          </button>
        ))}
      </div>

      {shown.length ? (
        <div className="ss-card pn-flush">
          <ul className="pn-requests">
            {shown.map((r) => (
              <li key={r._id}>
                <div className="pn-avatar" aria-hidden="true">
                  {(r.student?.name || "S").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="pn-request-body">
                  <strong>{r.student?.name || "Student"}</strong>
                  <small className="pn-muted">
                    {r.student?.language || "—"} · {formatDate(r.createdAt)}
                  </small>
                  {r.message && <p>“{r.message}”</p>}
                </div>
                {r.status === "pending" ? (
                  <div className="pn-inline-confirm">
                    <button type="button" className="ss-btn small success" disabled={busyId === r._id} onClick={() => decide(r, "accepted")}>
                      ✓ Accept
                    </button>
                    <button type="button" className="ss-btn ghost small" disabled={busyId === r._id} onClick={() => decide(r, "rejected")}>
                      Decline
                    </button>
                  </div>
                ) : (
                  <span className={`pn-status ${r.status}`}>{r.status}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="ss-card ss-state">
          <div className="icon">📭</div>
          <h3>No {filter === "all" ? "" : filter} requests</h3>
          <p>New student requests will appear here.</p>
        </div>
      )}
    </div>
  );
}

function ProfileTab({ profile, toast, onSaved }) {
  const [form, setForm] = useState({
    subject: profile.subject || "",
    experience: profile.experience || "",
    language: "",
  });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { subject: form.subject, experience: form.experience };
      if (form.language) body.language = form.language;
      await api.patch(`/api/mentors/profile/${profile.id}`, body);
      toast({ type: "success", title: "Profile saved", message: "Students will see your updated profile." });
      onSaved();
    } catch (err) {
      toast({ type: "error", title: "Save failed", message: errorMessage(err, "Try again.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="ss-card pn-form" onSubmit={save}>
      <label>
        Subject
        <select className="pn-input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
          {!SUBJECTS.includes(form.subject) && <option value={form.subject}>{form.subject || "Choose a subject"}</option>}
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <label>
        Experience
        <input className="pn-input" maxLength={200} value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="e.g. 5+ Years" />
      </label>
      <label>
        Teaching language
        <select className="pn-input" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
          <option value="">Keep current ({profile.language || "not set"})</option>
          {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
        </select>
      </label>
      <button type="submit" className="ss-btn" disabled={saving}>
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

// ==========================================
// PAGE
// ==========================================

export default function MentorPanel() {
  const user = getCurrentUser();
  const [tab, setTab] = useState("students");
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState(false);
  const { toasts, showToast, dismissToast } = useToasts();

  const loadOverview = useCallback(() => {
    api
      .get("/api/mentor-panel/overview")
      .then((r) => setOverview(r.data))
      .catch((e) => setError(errorMessage(e, "Could not load your dashboard")));
  }, []);

  useEffect(() => {
    if (user?.role === "mentor") loadOverview();
  }, [user?.role, loadOverview]);

  if (user?.role !== "mentor") return <AccessDenied role="Mentor" />;

  const toggleAvailability = async () => {
    const next = overview.profile.availability === "Available" ? "Offline" : "Available";
    setToggling(true);
    try {
      await api.patch(`/api/mentors/profile/${overview.profile.id}`, { availability: next });
      setOverview({ ...overview, profile: { ...overview.profile, availability: next } });
      showToast({
        type: next === "Available" ? "success" : "info",
        title: next === "Available" ? "You're available" : "You're offline",
        message: next === "Available" ? "Students can see you're ready to help." : "Students will see you as offline.",
      });
    } catch (e) {
      showToast({ type: "error", title: "Update failed", message: errorMessage(e, "Try again.") });
    } finally {
      setToggling(false);
    }
  };

  const s = overview?.stats;
  const available = overview?.profile.availability === "Available";

  return (
    <div className="ss-page pn-page">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <header className="pn-header">
        <div>
          <span className="ss-eyebrow">🧑‍🏫 MENTOR PANEL</span>
          <h1 className="ss-h1">Hello, {user.name?.split(" ")[0] || "Mentor"}</h1>
          <p className="ss-lead">
            {overview?.profile.subject ? `${overview.profile.subject} mentor · ` : ""}
            Track your students and respond to new requests.
          </p>
        </div>

        {overview && (
          <button
            type="button"
            role="switch"
            aria-checked={available}
            className={`pn-availability${available ? " on" : ""}`}
            onClick={toggleAvailability}
            disabled={toggling}
          >
            <span className="pn-switch-track"><span /></span>
            {available ? "Available for students" : "Offline"}
          </button>
        )}
      </header>

      {error && <div className="ss-alert error">{error}</div>}

      {!overview && !error ? (
        <LoadingRows count={2} />
      ) : (
        overview && (
          <div className="pn-stats">
            <StatTile icon="🎒" label="My students" value={s.students} hint={`${s.activeStudents} active this week`} />
            <StatTile icon="⏳" label="Pending requests" value={s.pending} tone={s.pending ? "warn" : ""} hint={s.oldestPendingDays ? `oldest waiting ${s.oldestPendingDays} days` : ""} />
            <StatTile icon="⏸" label="Need a nudge" value={overview.inactiveStudents} hint={`no activity for ${overview.inactiveAfterDays}+ days`} tone={overview.inactiveStudents ? "warn" : ""} />
            <StatTile icon="🎯" label="Students' avg score" value={s.studentsAverageScore === null ? "—" : `${s.studentsAverageScore}%`} />
            <StatTile icon="✅" label="Acceptance rate" value={s.acceptanceRate === null ? "—" : `${s.acceptanceRate}%`} />
            <StatTile icon="⏱" label="Avg response time" value={formatResponse(s.avgResponseHours)} />
          </div>
        )
      )}

      <nav className="pn-tabs" role="tablist" aria-label="Mentor sections">
        {[
          ["students", "🎒 My Students"],
          ["requests", `📨 Requests${s?.pending ? ` (${s.pending})` : ""}`],
          ["profile", "👤 Profile"],
        ].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={`pn-tab${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      <section role="tabpanel">
        {tab === "students" && <StudentsTab toast={showToast} />}
        {tab === "requests" && <RequestsTab toast={showToast} onChanged={loadOverview} />}
        {tab === "profile" && overview && <ProfileTab profile={overview.profile} toast={showToast} onSaved={loadOverview} />}
      </section>
    </div>
  );
}
