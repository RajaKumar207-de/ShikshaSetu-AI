import { useCallback, useEffect, useState } from "react";
import api, { getCurrentUser } from "../utils/api";
import { ToastStack, useToasts } from "../components/Toast";
import {
  AccessDenied,
  ActivePill,
  ActivityChart,
  Drawer,
  LoadingRows,
  Pager,
  ScorePill,
  StatTile,
  StudentProgressView,
  formatDate,
  formatResponse,
} from "../components/panels/PanelUI";
import "../styles/panels.css";

const LANGUAGES = ["English", "Hindi", "Marathi", "Bengali", "Tamil", "Telugu", "Gujarati", "Punjabi"];
const SUBJECTS = ["Mathematics", "Science", "Computer", "English", "Career Guidance"];

const TABS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "students", label: "Students", icon: "🎒" },
  { id: "mentors", label: "Mentors", icon: "🧑‍🏫" },
  { id: "scholarships", label: "Scholarships", icon: "🎓" },
  { id: "announce", label: "Announcements", icon: "📣" },
];

const errorMessage = (error, fallback) => error.response?.data?.message || fallback;

// Debounced value so search boxes don't fire a request per keystroke.
const useDebounced = (value, delay = 350) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// ==========================================
// OVERVIEW
// ==========================================

function OverviewTab({ onOpenTab }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/admin/overview")
      .then((r) => setData(r.data))
      .catch((e) => setError(errorMessage(e, "Could not load overview")));
  }, []);

  if (error) return <div className="ss-alert error">{error}</div>;
  if (!data) return <LoadingRows count={5} />;

  const { users, requests, learning, scholarships } = data;
  const maxLang = Math.max(1, ...data.languages.map((l) => l.count));

  return (
    <div className="pn-stack">
      <div className="pn-stats">
        <StatTile icon="🎒" label="Students" value={users.students} hint={`+${users.newStudentsThisWeek} this week`} />
        <StatTile icon="🧑‍🏫" label="Mentors" value={users.mentors} />
        <StatTile
          icon="⚡"
          label="Active students (7 days)"
          value={users.activeStudents7d}
          hint={`${users.activeStudents30d} in last 30 days`}
          tone="good"
        />
        <StatTile
          icon="⏳"
          label="Pending mentor requests"
          value={requests.pending}
          hint={`${requests.accepted} accepted · ${requests.rejected} rejected`}
          tone={requests.pending ? "warn" : ""}
        />
        <StatTile icon="📝" label="Quizzes taken" value={learning.quizzes} hint={`${learning.lessonsCompleted} lessons completed`} />
        <StatTile icon="🤖" label="AI doubts asked" value={learning.aiDoubts} hint="via Sarthi assistant" />
      </div>

      <div className="pn-two">
        <div className="ss-card">
          <ActivityChart days={data.activity} />
        </div>

        <div className="ss-card">
          <h3 className="pn-card-title">Students by language</h3>
          {data.languages.length ? (
            <ul className="pn-hbars">
              {data.languages.map((l) => (
                <li key={l.language}>
                  <span>{l.language}</span>
                  <div className="pn-hbar">
                    <span style={{ width: `${(l.count / maxLang) * 100}%` }} />
                  </div>
                  <strong>{l.count}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="pn-muted">No students yet.</p>
          )}
        </div>
      </div>

      <div className="pn-two">
        <div className="ss-card">
          <h3 className="pn-card-title">Weakest topics across all students</h3>
          {data.weakTopics.length ? (
            <div className="pn-table-wrap">
              <table className="pn-table">
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Average</th>
                    <th>Students</th>
                  </tr>
                </thead>
                <tbody>
                  {data.weakTopics.map((t) => (
                    <tr key={`${t.subject}-${t.topic}`}>
                      <td>
                        {t.topic}
                        <small className="pn-muted"> · {t.subject}</small>
                      </td>
                      <td><ScorePill score={t.average} /></td>
                      <td>{t.students}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="pn-muted">Not enough quiz data yet.</p>
          )}
        </div>

        <div className="ss-card">
          <h3 className="pn-card-title">Quick actions</h3>
          <div className="pn-quick">
            <button type="button" className="pn-quick-btn" onClick={() => onOpenTab("students", { inactive: true })}>
              <span>⏸</span> Inactive students
            </button>
            <button type="button" className="pn-quick-btn" onClick={() => onOpenTab("mentors")}>
              <span>🧑‍🏫</span> Mentor performance
            </button>
            <button type="button" className="pn-quick-btn" onClick={() => onOpenTab("scholarships")}>
              <span>🎓</span> {scholarships.active} active scholarships
            </button>
            <button type="button" className="pn-quick-btn" onClick={() => onOpenTab("announce")}>
              <span>📣</span> Send announcement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// STUDENTS
// ==========================================

function StudentDrawer({ id, onClose, toast, onChanged }) {
  const [data, setData] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get(`/api/admin/students/${id}`)
      .then((r) => setData(r.data))
      .catch((e) => {
        toast({ type: "error", title: "Could not load student", message: errorMessage(e, "Try again.") });
        onClose();
      });
  }, [id, onClose, toast]);

  const makeMentor = async () => {
    setSaving(true);
    try {
      await api.patch(`/api/admin/users/${id}/role`, { role: "mentor" });
      toast({ type: "success", title: "Role updated", message: `${data.student.name} is now a mentor.` });
      onChanged();
      onClose();
    } catch (e) {
      toast({ type: "error", title: "Update failed", message: errorMessage(e, "Could not change role.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={data?.student.name || "Student"}
      subtitle={data ? `${data.student.email} · ${data.student.language} · joined ${formatDate(data.student.createdAt)}` : ""}
      onClose={onClose}
    >
      {!data ? (
        <LoadingRows />
      ) : (
        <>
          <StudentProgressView progress={data.progress} />

          <h4 className="pn-subhead">Mentor connections</h4>
          {data.mentorRequests.length ? (
            <ul className="pn-list">
              {data.mentorRequests.map((r) => (
                <li key={r.id}>
                  <span>
                    <strong>{r.mentor?.name || "Deleted mentor"}</strong>
                    <small className="pn-muted"> · {r.mentor?.subject || "—"}</small>
                  </span>
                  <span className={`pn-status ${r.status}`}>{r.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="pn-muted">No mentor requests sent.</p>
          )}

          <p className="pn-muted">🎓 Tracking {data.trackedScholarships} scholarship(s)</p>

          <div className="pn-danger">
            <div>
              <strong>Make this student a mentor</strong>
              <p>They will appear in the mentor list and can receive requests.</p>
            </div>
            {confirming ? (
              <div className="pn-inline-confirm">
                <button type="button" className="ss-btn small" onClick={makeMentor} disabled={saving}>
                  {saving ? "Saving…" : "Yes, make mentor"}
                </button>
                <button type="button" className="ss-btn ghost small" onClick={() => setConfirming(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button type="button" className="ss-btn ghost small" onClick={() => setConfirming(true)}>
                Change role
              </button>
            )}
          </div>
        </>
      )}
    </Drawer>
  );
}

function StudentsTab({ toast, initialInactive }) {
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("");
  const [inactive, setInactive] = useState(Boolean(initialInactive));
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);
  const [reload, setReload] = useState(0);
  const q = useDebounced(search);

  useEffect(() => setPage(1), [q, language, inactive]);

  useEffect(() => {
    setData(null);
    setError("");
    api
      .get("/api/admin/students", {
        params: { search: q || undefined, language: language || undefined, inactive: inactive || undefined, page },
      })
      .then((r) => setData(r.data))
      .catch((e) => setError(errorMessage(e, "Could not load students")));
  }, [q, language, inactive, page, reload]);

  const close = useCallback(() => setOpenId(null), []);

  return (
    <div className="pn-stack">
      <div className="pn-toolbar">
        <input
          className="pn-input grow"
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search students"
        />
        <select className="pn-input" value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Language">
          <option value="">All languages</option>
          {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
        </select>
        <button type="button" className={`ss-chip${inactive ? " active" : ""}`} onClick={() => setInactive((x) => !x)}>
          ⏸ Inactive 7+ days
        </button>
      </div>

      {error && <div className="ss-alert error">{error}</div>}

      <div className="ss-card pn-flush">
        {!data && !error ? (
          <LoadingRows />
        ) : data?.students.length ? (
          <div className="pn-table-wrap">
            <table className="pn-table hover">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Language</th>
                  <th>Last active</th>
                  <th>Lessons</th>
                  <th>Quizzes</th>
                  <th>Avg score</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {data.students.map((s) => (
                  <tr key={s.id} onClick={() => setOpenId(s.id)}>
                    <td>
                      <strong>{s.name}</strong>
                      <small className="pn-block pn-muted">{s.email}</small>
                    </td>
                    <td>{s.language}</td>
                    <td><ActivePill days={s.stats.inactiveDays} /></td>
                    <td>{s.stats.lessons}</td>
                    <td>{s.stats.quizzes}</td>
                    <td><ScorePill score={s.stats.averageScore} /></td>
                    <td>
                      <button type="button" className="ss-btn ghost small" onClick={(e) => { e.stopPropagation(); setOpenId(s.id); }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          data && (
            <div className="ss-state">
              <div className="icon">🔍</div>
              <h3>No students found</h3>
              <p>Try a different search or filter.</p>
            </div>
          )
        )}
      </div>

      {data && <Pager pagination={data.pagination} onPage={setPage} />}

      {openId && (
        <StudentDrawer id={openId} onClose={close} toast={toast} onChanged={() => setReload((n) => n + 1)} />
      )}
    </div>
  );
}

// ==========================================
// MENTORS
// ==========================================

function MentorDrawer({ id, onClose, toast, onChanged }) {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    api
      .get(`/api/admin/mentors/${id}`)
      .then((r) => {
        setData(r.data);
        const m = r.data.mentor;
        setForm({ subject: m.subject || "", experience: m.experience || "", availability: m.availability, language: "" });
      })
      .catch((e) => {
        toast({ type: "error", title: "Could not load mentor", message: errorMessage(e, "Try again.") });
        onClose();
      });
  }, [id, onClose, toast]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { subject: form.subject, experience: form.experience, availability: form.availability };
      if (form.language) body.language = form.language;
      await api.patch(`/api/mentors/profile/${id}`, body);
      toast({ type: "success", title: "Profile saved", message: `${data.mentor.name}'s profile was updated.` });
      onChanged();
    } catch (err) {
      toast({ type: "error", title: "Save failed", message: errorMessage(err, "Could not save profile.") });
    } finally {
      setSaving(false);
    }
  };

  const demote = async () => {
    setSaving(true);
    try {
      await api.patch(`/api/admin/users/${id}/role`, { role: "student" });
      toast({ type: "success", title: "Role updated", message: `${data.mentor.name} is now a student.` });
      onChanged();
      onClose();
    } catch (err) {
      toast({ type: "error", title: "Update failed", message: errorMessage(err, "Could not change role.") });
    } finally {
      setSaving(false);
    }
  };

  const s = data?.stats;

  return (
    <Drawer title={data?.mentor.name || "Mentor"} subtitle={data ? `${data.mentor.email} · joined ${formatDate(data.mentor.createdAt)}` : ""} onClose={onClose}>
      {!data ? (
        <LoadingRows />
      ) : (
        <>
          <div className="pn-stats small">
            <StatTile icon="📨" label="Requests received" value={s.total} />
            <StatTile icon="✅" label="Acceptance rate" value={s.acceptanceRate === null ? "—" : `${s.acceptanceRate}%`} />
            <StatTile icon="⏱" label="Avg response" value={formatResponse(s.avgResponseHours)} />
            <StatTile icon="⏳" label="Pending" value={s.pending} hint={s.oldestPendingDays ? `oldest ${s.oldestPendingDays} days` : ""} tone={s.pending ? "warn" : ""} />
            <StatTile icon="🎒" label="Students" value={s.students} hint={`${s.activeStudents} active this week`} />
            <StatTile icon="🎯" label="Students' avg score" value={s.studentsAverageScore === null ? "—" : `${s.studentsAverageScore}%`} />
          </div>

          <h4 className="pn-subhead">Edit profile</h4>
          <form className="pn-form" onSubmit={save}>
            <label>
              Subject
              <select className="pn-input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                {!SUBJECTS.includes(form.subject) && <option value={form.subject}>{form.subject || "Not set"}</option>}
                {SUBJECTS.map((x) => <option key={x}>{x}</option>)}
              </select>
            </label>
            <label>
              Experience
              <input className="pn-input" value={form.experience} maxLength={200} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="e.g. 5+ Years" />
            </label>
            <label>
              Language
              <select className="pn-input" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                <option value="">Keep current ({data.mentor.language || "not set"})</option>
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </label>
            <label>
              Availability
              <select className="pn-input" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })}>
                <option>Available</option>
                <option>Offline</option>
              </select>
            </label>
            <button type="submit" className="ss-btn" disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </button>
          </form>

          <h4 className="pn-subhead">Requests</h4>
          {data.requests.length ? (
            <div className="pn-table-wrap">
              <table className="pn-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Status</th>
                    <th>Sent</th>
                    <th>Student avg</th>
                  </tr>
                </thead>
                <tbody>
                  {data.requests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.student?.name || "Deleted user"}</td>
                      <td><span className={`pn-status ${r.status}`}>{r.status}</span></td>
                      <td>{formatDate(r.createdAt)}</td>
                      <td><ScorePill score={r.student?.stats.averageScore} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="pn-muted">No requests yet.</p>
          )}

          <div className="pn-danger">
            <div>
              <strong>Change to student account</strong>
              <p>They will be removed from the mentor list. Existing requests are kept.</p>
            </div>
            {confirming ? (
              <div className="pn-inline-confirm">
                <button type="button" className="ss-btn small danger" onClick={demote} disabled={saving}>
                  Yes, change
                </button>
                <button type="button" className="ss-btn ghost small" onClick={() => setConfirming(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button type="button" className="ss-btn ghost small" onClick={() => setConfirming(true)}>
                Change role
              </button>
            )}
          </div>
        </>
      )}
    </Drawer>
  );
}

function MentorsTab({ toast }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);
  const [reload, setReload] = useState(0);
  const q = useDebounced(search);

  useEffect(() => setPage(1), [q]);

  useEffect(() => {
    setData(null);
    setError("");
    api
      .get("/api/admin/mentors", { params: { search: q || undefined, page } })
      .then((r) => setData(r.data))
      .catch((e) => setError(errorMessage(e, "Could not load mentors")));
  }, [q, page, reload]);

  const close = useCallback(() => setOpenId(null), []);

  return (
    <div className="pn-stack">
      <div className="pn-toolbar">
        <input
          className="pn-input grow"
          type="search"
          placeholder="Search mentors by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search mentors"
        />
      </div>

      {error && <div className="ss-alert error">{error}</div>}

      <div className="ss-card pn-flush">
        {!data && !error ? (
          <LoadingRows />
        ) : data?.mentors.length ? (
          <div className="pn-table-wrap">
            <table className="pn-table hover">
              <thead>
                <tr>
                  <th>Mentor</th>
                  <th>Status</th>
                  <th>Requests</th>
                  <th>Acceptance</th>
                  <th>Avg response</th>
                  <th>Students</th>
                  <th>Students' avg</th>
                </tr>
              </thead>
              <tbody>
                {data.mentors.map((m) => (
                  <tr key={m.id} onClick={() => setOpenId(m.id)}>
                    <td>
                      <strong>{m.name}</strong>
                      <small className="pn-block pn-muted">{m.subject || "No subject"}</small>
                    </td>
                    <td>
                      <span className={`ss-pill ${m.availability === "Available" ? "strong" : "not_assessed"}`}>
                        {m.availability}
                      </span>
                    </td>
                    <td>
                      {m.stats.total}
                      {m.stats.pending > 0 && <small className="pn-warn-text"> · {m.stats.pending} pending</small>}
                    </td>
                    <td>{m.stats.acceptanceRate === null ? "—" : `${m.stats.acceptanceRate}%`}</td>
                    <td>{formatResponse(m.stats.avgResponseHours)}</td>
                    <td>
                      {m.stats.students}
                      <small className="pn-muted"> ({m.stats.activeStudents} active)</small>
                    </td>
                    <td><ScorePill score={m.stats.studentsAverageScore} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          data && (
            <div className="ss-state">
              <div className="icon">🔍</div>
              <h3>No mentors found</h3>
            </div>
          )
        )}
      </div>

      {data && <Pager pagination={data.pagination} onPage={setPage} />}

      {openId && <MentorDrawer id={openId} onClose={close} toast={toast} onChanged={() => setReload((n) => n + 1)} />}
    </div>
  );
}

// ==========================================
// SCHOLARSHIPS
// ==========================================

const EMPTY_SCHOLARSHIP = {
  name: "",
  provider: "",
  description: "",
  amount: "",
  state: "All India",
  category: "",
  educationLevel: "",
  incomeLimit: "",
  deadline: "",
  deadlineDate: "",
  documents: "",
  officialLink: "",
  isActive: true,
};

const toForm = (s) => ({
  ...EMPTY_SCHOLARSHIP,
  ...s,
  category: (s.category || []).join(", "),
  educationLevel: (s.educationLevel || []).join(", "),
  documents: (s.documents || []).join(", "),
  deadlineDate: s.deadlineDate ? String(s.deadlineDate).slice(0, 10) : "",
});

function ScholarshipDrawer({ scholarship, onClose, toast, onSaved }) {
  const isNew = !scholarship._id;
  const [form, setForm] = useState(() => toForm(scholarship));
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const list = (text) => text.split(",").map((x) => x.trim()).filter(Boolean);
    const body = {
      name: form.name,
      provider: form.provider,
      description: form.description,
      amount: form.amount,
      state: form.state,
      incomeLimit: form.incomeLimit,
      deadline: form.deadline,
      officialLink: form.officialLink,
      category: list(form.category),
      educationLevel: list(form.educationLevel),
      documents: list(form.documents),
      deadlineDate: form.deadlineDate || null,
      isActive: form.isActive,
    };
    // Empty optional text fields are simply not sent (the API keeps defaults).
    for (const key of ["description", "amount", "state", "incomeLimit", "deadline", "officialLink"]) {
      if (!body[key]) delete body[key];
    }
    try {
      if (isNew) await api.post("/api/admin/scholarships", body);
      else await api.patch(`/api/admin/scholarships/${scholarship._id}`, body);
      toast({ type: "success", title: isNew ? "Scholarship added" : "Scholarship updated", message: form.name });
      onSaved();
      onClose();
    } catch (err) {
      toast({ type: "error", title: "Save failed", message: errorMessage(err, "Please check the fields.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer title={isNew ? "Add scholarship" : "Edit scholarship"} subtitle={isNew ? "" : scholarship.name} onClose={onClose}>
      <form className="pn-form" onSubmit={save}>
        <label>Name *<input className="pn-input" required maxLength={160} value={form.name} onChange={set("name")} /></label>
        <label>Provider *<input className="pn-input" required maxLength={160} value={form.provider} onChange={set("provider")} /></label>
        <label className="full">Description<textarea className="pn-input" rows={3} maxLength={2000} value={form.description} onChange={set("description")} /></label>
        <label>Amount<input className="pn-input" maxLength={80} value={form.amount} onChange={set("amount")} placeholder="e.g. ₹12,000 per year" /></label>
        <label>State<input className="pn-input" maxLength={80} value={form.state} onChange={set("state")} /></label>
        <label>Categories<input className="pn-input" value={form.category} onChange={set("category")} placeholder="SC, ST, OBC, General" /></label>
        <label>Education levels<input className="pn-input" value={form.educationLevel} onChange={set("educationLevel")} placeholder="Class 10, Class 12, UG" /></label>
        <label>Income limit<input className="pn-input" maxLength={80} value={form.incomeLimit} onChange={set("incomeLimit")} placeholder="e.g. ₹2.5 lakh" /></label>
        <label>Deadline (text)<input className="pn-input" maxLength={80} value={form.deadline} onChange={set("deadline")} placeholder="e.g. 31 October" /></label>
        <label>Deadline date<input className="pn-input" type="date" value={form.deadlineDate} onChange={set("deadlineDate")} /></label>
        <label>Official link<input className="pn-input" type="url" maxLength={500} value={form.officialLink} onChange={set("officialLink")} placeholder="https://" /></label>
        <label className="full">Documents<input className="pn-input" value={form.documents} onChange={set("documents")} placeholder="Aadhaar, Income certificate, Marksheet" /></label>
        <label className="pn-check full">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Visible to students
        </label>
        <button type="submit" className="ss-btn" disabled={saving}>
          {saving ? "Saving…" : isNew ? "Add scholarship" : "Save changes"}
        </button>
      </form>
    </Drawer>
  );
}

function ScholarshipsTab({ toast }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [reload, setReload] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const q = useDebounced(search);

  useEffect(() => setPage(1), [q, status]);

  useEffect(() => {
    setData(null);
    setError("");
    api
      .get("/api/admin/scholarships", { params: { search: q || undefined, status: status || undefined, page } })
      .then((r) => setData(r.data))
      .catch((e) => setError(errorMessage(e, "Could not load scholarships")));
  }, [q, status, page, reload]);

  const toggle = async (s) => {
    setBusyId(s._id);
    try {
      await api.patch(`/api/admin/scholarships/${s._id}`, { isActive: !s.isActive });
      toast({ type: "success", title: s.isActive ? "Hidden from students" : "Visible to students", message: s.name });
      setReload((n) => n + 1);
    } catch (e) {
      toast({ type: "error", title: "Update failed", message: errorMessage(e, "Try again.") });
    } finally {
      setBusyId(null);
    }
  };

  const close = useCallback(() => setEditing(null), []);

  return (
    <div className="pn-stack">
      <div className="pn-toolbar">
        <input className="pn-input grow" type="search" placeholder="Search by name or provider…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search scholarships" />
        {[["", "All"], ["active", "Active"], ["inactive", "Hidden"], ["expired", "Deadline passed"]].map(([id, label]) => (
          <button key={id} type="button" className={`ss-chip${status === id ? " active" : ""}`} onClick={() => setStatus(id)}>
            {label}
          </button>
        ))}
        <button type="button" className="ss-btn small" onClick={() => setEditing(EMPTY_SCHOLARSHIP)}>
          + Add scholarship
        </button>
      </div>

      {error && <div className="ss-alert error">{error}</div>}

      <div className="ss-card pn-flush">
        {!data && !error ? (
          <LoadingRows />
        ) : data?.scholarships.length ? (
          <div className="pn-table-wrap">
            <table className="pn-table">
              <thead>
                <tr>
                  <th>Scholarship</th>
                  <th>Amount</th>
                  <th>Deadline</th>
                  <th>Saved by</th>
                  <th>Visible</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {data.scholarships.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <strong>{s.name}</strong>
                      <small className="pn-block pn-muted">{s.provider}</small>
                    </td>
                    <td>{s.amount}</td>
                    <td>
                      {s.deadlineDate ? formatDate(s.deadlineDate) : s.deadline}
                      {s.expired && <small className="pn-block pn-warn-text">Deadline passed</small>}
                    </td>
                    <td>{s.trackedBy} students</td>
                    <td>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={s.isActive}
                        aria-label={`Visible to students: ${s.name}`}
                        className={`pn-switch${s.isActive ? " on" : ""}`}
                        disabled={busyId === s._id}
                        onClick={() => toggle(s)}
                      >
                        <span />
                      </button>
                    </td>
                    <td>
                      <button type="button" className="ss-btn ghost small" onClick={() => setEditing(s)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          data && (
            <div className="ss-state">
              <div className="icon">🎓</div>
              <h3>No scholarships found</h3>
            </div>
          )
        )}
      </div>

      {data && <Pager pagination={data.pagination} onPage={setPage} />}

      {editing && <ScholarshipDrawer scholarship={editing} onClose={close} toast={toast} onSaved={() => setReload((n) => n + 1)} />}
    </div>
  );
}

// ==========================================
// ANNOUNCEMENTS
// ==========================================

const LINKS = [
  ["", "No link"],
  ["/learning", "Learning"],
  ["/learning-path", "Learning Path"],
  ["/ai-tutor", "AI Tutor"],
  ["/scholarships", "Scholarships"],
  ["/mentors", "Mentors"],
  ["/career", "Career"],
];

function AnnounceTab({ toast }) {
  const [form, setForm] = useState({ audience: "students", language: "", title: "", message: "", link: "" });
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);

  const audienceLabel = {
    all: "all students and mentors",
    students: "all students",
    mentors: "all mentors",
  }[form.audience] + (form.language ? ` who use ${form.language}` : "");

  const send = async () => {
    setSending(true);
    try {
      const body = { ...form };
      if (!body.language) delete body.language;
      if (!body.link) delete body.link;
      const { data } = await api.post("/api/admin/announcements", body);
      toast({ type: "success", title: "Announcement sent 📣", message: data.message });
      setForm({ ...form, title: "", message: "" });
      setConfirming(false);
    } catch (e) {
      toast({ type: "error", title: "Could not send", message: errorMessage(e, "Try again.") });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pn-two">
      <form
        className="ss-card pn-form single"
        onSubmit={(e) => {
          e.preventDefault();
          setConfirming(true);
        }}
      >
        <h3 className="pn-card-title">New announcement</h3>
        <div className="pn-field">
          <span>Send to</span>
          <div className="pn-chips">
            {[["students", "Students"], ["mentors", "Mentors"], ["all", "Everyone"]].map(([id, label]) => (
              <button key={id} type="button" className={`ss-chip${form.audience === id ? " active" : ""}`} onClick={() => setForm({ ...form, audience: id })}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <label>
          Only users with language
          <select className="pn-input" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
            <option value="">Any language</option>
            {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        <label>
          Title *
          <input className="pn-input" required maxLength={140} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. New Science lessons are live!" />
        </label>
        <label>
          Message *
          <textarea className="pn-input" required rows={4} maxLength={400} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <small className="pn-muted">{form.message.length}/400</small>
        </label>
        <label>
          Open page when clicked
          <select className="pn-input" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}>
            {LINKS.map(([path, label]) => <option key={path} value={path}>{label}</option>)}
          </select>
        </label>

        {confirming ? (
          <div className="pn-confirm-box">
            <p>Send this to <strong>{audienceLabel}</strong>? This cannot be undone.</p>
            <div className="pn-inline-confirm">
              <button type="button" className="ss-btn" onClick={send} disabled={sending}>
                {sending ? "Sending…" : "Yes, send now"}
              </button>
              <button type="button" className="ss-btn ghost" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="submit" className="ss-btn">Review & send</button>
        )}
      </form>

      <div className="ss-card">
        <h3 className="pn-card-title">Preview</h3>
        <div className="pn-preview">
          <div className="pn-preview-icon">🔔</div>
          <div>
            <strong>{form.title || "Your title appears here"}</strong>
            <p>{form.message || "The message students will see in their notification centre."}</p>
          </div>
        </div>
        <p className="pn-muted">
          Delivered to the in-app notification centre, and as a browser push to users who enabled notifications.
        </p>
      </div>
    </div>
  );
}

// ==========================================
// PAGE
// ==========================================

export default function AdminPanel() {
  const user = getCurrentUser();
  const [tab, setTab] = useState("overview");
  const [tabOptions, setTabOptions] = useState({});
  const { toasts, showToast, dismissToast } = useToasts();

  if (user?.role !== "admin") return <AccessDenied role="Admin" />;

  const openTab = (id, options = {}) => {
    setTabOptions(options);
    setTab(id);
  };

  return (
    <div className="ss-page pn-page">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <header className="pn-header">
        <div>
          <span className="ss-eyebrow">🛡️ ADMIN PANEL</span>
          <h1 className="ss-h1">Welcome back, {user.name?.split(" ")[0] || "Admin"}</h1>
          <p className="ss-lead">Monitor students, mentors and learning across ShikshaSetu.</p>
        </div>
      </header>

      <nav className="pn-tabs" role="tablist" aria-label="Admin sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`pn-tab${tab === t.id ? " active" : ""}`}
            onClick={() => openTab(t.id)}
          >
            <span aria-hidden="true">{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>

      <section role="tabpanel">
        {tab === "overview" && <OverviewTab onOpenTab={openTab} />}
        {tab === "students" && <StudentsTab toast={showToast} initialInactive={tabOptions.inactive} />}
        {tab === "mentors" && <MentorsTab toast={showToast} />}
        {tab === "scholarships" && <ScholarshipsTab toast={showToast} />}
        {tab === "announce" && <AnnounceTab toast={showToast} />}
      </section>
    </div>
  );
}
