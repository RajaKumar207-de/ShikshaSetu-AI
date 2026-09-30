import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import useOnline from "../hooks/useOnline";
import {
  disablePush,
  enablePush,
  getPushState,
} from "../utils/push";

const ICONS = {
  scholarship_deadline: "🎓",
  mentor_request: "👨‍🏫",
  mentor_request_accepted: "✅",
  mentor_request_rejected: "👨‍🏫",
  learning_reminder: "📚",
  quiz_reminder: "📝",
  roadmap_update: "🧭",
  system: "🔔",
};

const timeAgo = (iso) => {
  const minutes = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
};

const POLL_MS = 60_000;

export default function NotificationCenter() {
  const navigate = useNavigate();
  const online = useOnline();
  const wrapRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pushState, setPushState] = useState("available");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState("");

  const load = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      setLoading(true);
      const { data } = await api.get("/api/notifications");
      setItems(data.notifications || []);
      setUnread(data.unread || 0);
      setError("");
    } catch {
      setError("Couldn't load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + light polling while the tab is visible.
  useEffect(() => {
    load();
    getPushState().then(setPushState);

    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  // Refresh when the connection comes back (skip the initial mount: the
  // effect above already loaded once, so this avoids a duplicate request).
  const wasOnline = useRef(online);
  useEffect(() => {
    if (online && !wasOnline.current) load();
    wasOnline.current = online;
  }, [online, load]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openItem = async (item) => {
    if (!item.read) {
      setItems((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, read: true } : n))
      );
      setUnread((n) => Math.max(0, n - 1));
      api.patch(`/api/notifications/${item._id}/read`).catch(() => null);
    }
    setOpen(false);
    if (item.link) navigate(item.link);
  };

  const markAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    api.patch("/api/notifications/read-all").catch(() => null);
  };

  const togglePush = async () => {
    setPushBusy(true);
    setPushMessage("");
    try {
      if (pushState === "enabled") {
        await disablePush();
        setPushState("available");
      } else {
        await enablePush();
        setPushState("enabled");
        setPushMessage("Reminders are on for this device.");
      }
    } catch (err) {
      setPushMessage(err.message || "Could not change notification settings.");
      setPushState(await getPushState());
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <div className="ss-bell-wrap" ref={wrapRef}>
      <button
        type="button"
        className="ss-icon-btn"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
      >
        🔔
        {unread > 0 && (
          <span className="ss-badge-count" aria-hidden="true">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="ss-notif-panel" role="dialog" aria-label="Notifications">
          <div className="ss-notif-head">
            <span>Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                className="ss-chip"
                onClick={markAll}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="ss-notif-list">
            {!online && (
              <div className="ss-state">
                <div className="icon">📶</div>
                <h3>You're offline</h3>
                Notifications will refresh when you're back online.
              </div>
            )}

            {online && loading && items.length === 0 && (
              <div style={{ padding: 18, display: "grid", gap: 10 }}>
                <div className="ss-skeleton" style={{ height: 44 }} />
                <div className="ss-skeleton" style={{ height: 44 }} />
              </div>
            )}

            {online && error && (
              <div style={{ padding: 18 }}>
                <div className="ss-alert error">{error}</div>
              </div>
            )}

            {online && !loading && !error && items.length === 0 && (
              <div className="ss-state">
                <div className="icon">🎉</div>
                <h3>You're all caught up</h3>
                New reminders will appear here.
              </div>
            )}

            {items.map((item) => (
              <button
                type="button"
                key={item._id}
                className={`ss-notif-item ${item.read ? "" : "unread"}`}
                onClick={() => openItem(item)}
              >
                <span className="ico" aria-hidden="true">
                  {ICONS[item.type] || "🔔"}
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.message}</span>
                  <small>{timeAgo(item.createdAt)}</small>
                </div>
              </button>
            ))}
          </div>

          <div className="ss-notif-foot">
            {pushState === "unsupported" && (
              <>This browser doesn't support push notifications. You'll still see reminders here.</>
            )}
            {pushState === "denied" && (
              <>Notifications are blocked in your browser settings. Reminders will still appear here.</>
            )}
            {(pushState === "available" || pushState === "enabled") && (
              <div style={{ display: "grid", gap: 8 }}>
                <span>
                  {pushState === "enabled"
                    ? "Browser reminders are on for this device."
                    : "Get scholarship deadline reminders on this device."}
                </span>
                <button
                  type="button"
                  className={`ss-btn small ${pushState === "enabled" ? "ghost" : ""}`}
                  onClick={togglePush}
                  disabled={pushBusy || !online}
                >
                  {pushBusy
                    ? "Please wait..."
                    : pushState === "enabled"
                      ? "Turn off reminders"
                      : "Allow Notifications"}
                </button>
              </div>
            )}
            {pushMessage && (
              <div style={{ marginTop: 8, fontWeight: 700 }}>{pushMessage}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
