// Match percentage + the exact criteria behind it. The number is the
// weighted share of the scholarship's *listed* criteria that the
// student's own details satisfy (see backend scholarshipExtras.controller).
export default function ScholarshipMatchInfo({ scholarship }) {
  if (scholarship.match == null) return null;

  return (
    <div style={{ marginBottom: 14 }}>
      <span className={`ss-match ${scholarship.match >= 80 ? "" : "mid"}`}>
        {scholarship.match}% match
      </span>
      {scholarship.matchChecks?.length > 0 && (
        <ul className="ss-checks">
          {scholarship.matchChecks.map((c) => (
            <li key={c.key} className={c.matched ? "ok" : "bad"}>
              <strong>{c.label}:</strong> {c.detail}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
