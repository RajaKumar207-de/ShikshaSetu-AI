// Security smoke test. Run against a LOCAL, running dev server:
//   node scripts/security-smoke.mjs
// It creates a few throw-away accounts and deletes them at the end.
// It never calls Gemini or Sarvam (limits/validation are hit first).
import "dotenv/config";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const BASE = process.env.SMOKE_BASE || "http://localhost:5000";
const ORIGIN = "http://localhost:5173";
const stamp = Date.now();
const created = [];
let passed = 0;
let failed = 0;

const call = async (method, path, { token, body, headers = {}, raw } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON
  }
  return { status: res.status, data, headers: res.headers };
};

const check = (name, condition, extra = "") => {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name} ${extra}`);
  }
};

const register = async (label, role = "student") => {
  const email = `smoke-${label}-${stamp}@example.com`;
  const r = await call("POST", "/api/auth/register", {
    body: { name: `Smoke ${label}`, email, password: "Passw0rd!x", role },
  });
  created.push(email);
  const l = await call("POST", "/api/auth/login", {
    body: { email, password: "Passw0rd!x" },
  });
  return { email, id: r.data?.user?.id, token: l.data?.token, role: r.data?.user?.role };
};

console.log("\n== Basics / headers / CORS ==");
{
  const h = await call("GET", "/api/health");
  check("health endpoint ok", h.status === 200 && h.data?.status === "ok");
  check("no x-powered-by header", !h.headers.get("x-powered-by"));
  check("security headers present (helmet)", h.headers.get("x-content-type-options") === "nosniff");
  const bad = await call("GET", "/api/health", { headers: { Origin: "http://evil.example" } });
  check("CORS blocks unknown origin", bad.status === 403, `got ${bad.status}`);
  const ok = await call("GET", "/api/health", { headers: { Origin: ORIGIN } });
  check("CORS allows configured origin", ok.headers.get("access-control-allow-origin") === ORIGIN);
  const nf = await call("GET", "/api/does-not-exist");
  check("unknown route returns JSON 404", nf.status === 404 && nf.data?.success === false);
  const big = await call("POST", "/api/auth/login", { raw: JSON.stringify({ email: "a@b.co", password: "x".repeat(200_000) }) });
  check("oversized body rejected (413)", big.status === 413, `got ${big.status}`);
  const badJson = await call("POST", "/api/auth/login", { raw: "{not json" });
  check("malformed JSON gives 400 without stack", badJson.status === 400 && !JSON.stringify(badJson.data).includes("at "));
}

console.log("\n== Registration / login validation ==");
{
  const weak = await call("POST", "/api/auth/register", { body: { name: "x", email: `w-${stamp}@example.com`, password: "123" } });
  check("weak password rejected", weak.status === 400);
  const badEmail = await call("POST", "/api/auth/register", { body: { name: "x", email: "not-an-email", password: "Passw0rd!x" } });
  check("invalid email rejected", badEmail.status === 400);
  const inj = await call("POST", "/api/auth/login", { body: { email: { $ne: "" }, password: { $ne: "" } } });
  check("NoSQL injection in login rejected", inj.status === 400, `got ${inj.status}`);
  const admin = await register("admin-try", "admin");
  check("cannot self-register as admin", admin.role === "student", `role=${admin.role}`);
  const login = await call("POST", "/api/auth/login", { body: { email: admin.email, password: "Passw0rd!x" } });
  check("login response has no password hash", !JSON.stringify(login.data).toLowerCase().includes("$2"));
  const me = await call("GET", "/api/auth/me", { token: admin.token });
  check("/me does not return password", me.status === 200 && !("password" in (me.data?.user || {})));
}

console.log("\n== JWT handling ==");
{
  const noTok = await call("GET", "/api/auth/me");
  check("missing token -> 401", noTok.status === 401);
  const junk = await call("GET", "/api/auth/me", { token: "abc.def.ghi" });
  check("garbage token -> 401", junk.status === 401);
  const wrongSecret = jwt.sign({ id: "6abcd45dccbfdb5afe33ab2f" }, "wrong-secret");
  check("token signed with wrong secret -> 401", (await call("GET", "/api/auth/me", { token: wrongSecret })).status === 401);
  const student = await register("jwt");
  const expired = jwt.sign({ id: student.id }, process.env.JWT_SECRET, { expiresIn: -10 });
  check("expired token -> 401", (await call("GET", "/api/auth/me", { token: expired })).status === 401);
  const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify({ id: student.id })).toString("base64url")}.`;
  check("alg=none token -> 401", (await call("GET", "/api/auth/me", { token: none })).status === 401);
  const hs512 = jwt.sign({ id: student.id }, process.env.JWT_SECRET, { algorithm: "HS512" });
  check("non-HS256 algorithm -> 401", (await call("GET", "/api/auth/me", { token: hs512 })).status === 401);
}

console.log("\n== Authorization / ownership ==");
{
  const studentA = await register("studentA");
  const studentB = await register("studentB");
  const mentorA = await register("mentorA", "mentor");
  const mentorB = await register("mentorB", "mentor");

  check("mentor accounts created with mentor role", mentorA.role === "mentor" && mentorB.role === "mentor");

  const reqStudentRole = await call("GET", "/api/mentors/requests", { token: studentA.token });
  check("student cannot read mentor inbox (403)", reqStudentRole.status === 403);

  const mentorSends = await call("POST", "/api/mentors/request", { token: mentorA.token, body: { mentorId: mentorB.id } });
  check("mentor cannot send student requests (403)", mentorSends.status === 403);

  const badId = await call("POST", "/api/mentors/request", { token: studentA.token, body: { mentorId: "123" } });
  check("malformed ObjectId -> 400", badId.status === 400);

  const injId = await call("POST", "/api/mentors/request", { token: studentA.token, body: { mentorId: { $gt: "" } } });
  check("operator object as id -> 400", injId.status === 400);

  const sent = await call("POST", "/api/mentors/request", { token: studentA.token, body: { mentorId: mentorA.id, message: "hi", role: "admin" } });
  check("student can send request", sent.status === 201, `got ${sent.status}`);
  const dupe = await call("POST", "/api/mentors/request", { token: studentA.token, body: { mentorId: mentorA.id } });
  check("duplicate pending request -> 409", dupe.status === 409);
  const requestId = sent.data?.request?._id;

  const wrongMentor = await call("PATCH", `/api/mentors/request/${requestId}`, { token: mentorB.token, body: { status: "accepted" } });
  check("another mentor cannot decide the request (403)", wrongMentor.status === 403, `got ${wrongMentor.status}`);
  const asStudent = await call("PATCH", `/api/mentors/request/${requestId}`, { token: studentA.token, body: { status: "accepted" } });
  check("student cannot accept requests (403)", asStudent.status === 403);
  const badStatus = await call("PATCH", `/api/mentors/request/${requestId}`, { token: mentorA.token, body: { status: "hacked" } });
  check("invalid status -> 400", badStatus.status === 400);
  const good = await call("PATCH", `/api/mentors/request/${requestId}`, { token: mentorA.token, body: { status: "accepted" } });
  check("owning mentor can accept", good.status === 200);
  const again = await call("PATCH", `/api/mentors/request/${requestId}`, { token: mentorA.token, body: { status: "rejected" } });
  check("decided request cannot be changed (409)", again.status === 409);

  const otherProfile = await call("PATCH", `/api/mentors/profile/${mentorA.id}`, { token: mentorB.token, body: { subject: "Hacked" } });
  check("mentor cannot edit another mentor's profile (403)", otherProfile.status === 403);
  const studentProfile = await call("PATCH", `/api/mentors/profile/${mentorA.id}`, { token: studentA.token, body: { subject: "Hacked" } });
  check("student cannot edit a mentor profile (403)", studentProfile.status === 403);
  const ownProfile = await call("PATCH", `/api/mentors/profile/${mentorA.id}`, { token: mentorA.token, body: { subject: "Mathematics", role: "admin" } });
  check("mentor can edit own profile", ownProfile.status === 200);

  const inbox = await call("GET", "/api/notifications", { token: studentA.token });
  const inboxB = await call("GET", "/api/notifications", { token: studentB.token });
  check("student A sees own notification", inbox.data?.notifications?.some((n) => n.type === "mentor_request_accepted"));
  check("student B cannot see A's notifications", inboxB.data?.notifications?.length === 0);
  const notifId = inbox.data?.notifications?.[0]?._id;
  await call("PATCH", `/api/notifications/${notifId}/read`, { token: studentB.token });
  const after = await call("GET", "/api/notifications", { token: studentA.token });
  check("B cannot mark A's notification read", after.data?.notifications?.find((n) => n._id === notifId)?.read === false);

  const ev = await call("POST", "/api/learning/events", {
    token: studentA.token,
    body: { events: [{ clientId: `e-${stamp}`, type: "quiz", subject: "Mathematics", topic: "Algebra", score: 3, total: 5 }] },
  });
  check("learning event saved", ev.status === 200);
  const sumB = await call("GET", "/api/learning/summary", { token: studentB.token });
  check("B's summary has none of A's activity", sumB.data?.totals?.quizzes === 0);
  const badEvent = await call("POST", "/api/learning/events", { token: studentA.token, body: { events: [{ clientId: "x", type: "quiz", subject: { $ne: 1 } }] } });
  check("operator in learning event -> 400", badEvent.status === 400);

  const list = await call("GET", "/api/mentors?limit=1");
  check("mentor list is paginated", list.data?.pagination?.limit === 1 && list.data.mentors.length <= 1);
  check("guest mentor list hides emails", (list.data?.mentors || []).every((m) => !("email" in m)));
  const authed = await call("GET", "/api/mentors?limit=5", { token: studentA.token });
  check("signed-in mentor list includes email", (authed.data?.mentors || []).every((m) => "email" in m));
  const overLimit = await call("GET", "/api/mentors?limit=99999");
  check("absurd page size rejected", overLimit.status === 400);
}

console.log("\n== Scholarships input handling ==");
{
  const s = await call("GET", "/api/scholarships/search?state[$ne]=x&limit=2");
  check("operator in query string rejected", s.status === 400, `got ${s.status}`);
  const bad = await call("GET", "/api/scholarships/not-an-id");
  check("bad scholarship id -> 400", bad.status === 400);
  const page = await call("GET", "/api/scholarships?limit=1");
  check("scholarship list paginated", page.data?.pagination?.limit === 1);
  const seed = await call("POST", "/api/scholarships/seed");
  check("seed endpoint works in dev only (200 here)", [200, 201].includes(seed.status));
}

console.log("\n== Rate limiting (no paid API is called) ==");
{
  const email = `ratelimit-${stamp}@example.com`;
  let last;
  for (let i = 0; i < 12; i += 1) {
    last = await call("POST", "/api/auth/login", { body: { email, password: "wrong-password" } });
  }
  check("login blocked after repeated attempts (429)", last.status === 429, `got ${last.status}`);
  check("429 includes Retry-After", Boolean(last.headers.get("retry-after")));
  check("429 message is user friendly", typeof last.data?.message === "string" && last.data.message.length > 10);

  const longQ = "a".repeat(601);
  let aiLast;
  for (let i = 0; i < 7; i += 1) {
    aiLast = await call("POST", "/api/ai/ask", { body: { question: longQ, language: "en" } });
  }
  check("guest AI limited after a few requests (429)", aiLast.status === 429, `got ${aiLast.status}`);

  let ttsLast;
  for (let i = 0; i < 10; i += 1) {
    ttsLast = await call("POST", "/api/ai/speech", { body: { text: "", language: "hi" } });
  }
  check("guest TTS limited (429)", ttsLast.status === 429, `got ${ttsLast.status}`);
}

// ---- cleanup ----
await mongoose.connect(process.env.MONGO_URI);
const users = await mongoose.connection.collection("users").find({ email: { $in: created } }).toArray();
const ids = users.map((u) => u._id);
for (const c of ["learningevents", "notifications", "pushsubscriptions", "trackedscholarships"]) {
  await mongoose.connection.collection(c).deleteMany({ user: { $in: ids } });
}
await mongoose.connection.collection("mentorrequests").deleteMany({ $or: [{ student: { $in: ids } }, { mentor: { $in: ids } }] });
await mongoose.connection.collection("users").deleteMany({ _id: { $in: ids } });
await mongoose.disconnect();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
