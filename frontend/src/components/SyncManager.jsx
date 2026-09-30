import { useEffect, useState } from "react";
import useOnline from "../hooks/useOnline";
import { isLoggedIn } from "../utils/api";
import {
  SYNC_EVENT,
  migrateLegacyProgress,
  pendingCount,
  syncPendingEvents,
} from "../utils/learningSync";

// Flushes the offline queue when the connection returns and shows
// a small status toast ("Syncing your progress..." -> "Everything synced").
export default function SyncManager() {
  const online = useOnline();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (online && isLoggedIn()) {
      migrateLegacyProgress();
      syncPendingEvents();
    }
  }, [online]);

  useEffect(() => {
    let timer;

    const onSync = (event) => {
      const { status, count } = event.detail || {};
      clearTimeout(timer);

      if (status === "syncing") {
        setToast({ type: "syncing", count });
      } else if (status === "done") {
        setToast({ type: "done", count });
        timer = setTimeout(() => setToast(null), 3500);
      } else if (status === "error") {
        setToast({ type: "error" });
        timer = setTimeout(() => setToast(null), 4500);
      } else if (status === "queued") {
        pendingCount().then((n) => {
          if (n > 0 && !navigator.onLine) {
            setToast({ type: "saved", count: n });
            timer = setTimeout(() => setToast(null), 3500);
          }
        });
      }
    };

    window.addEventListener(SYNC_EVENT, onSync);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(SYNC_EVENT, onSync);
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="ss-sync" role="status" aria-live="polite">
      {toast.type === "syncing" && (
        <>
          <span className="spinner" aria-hidden="true" />
          Syncing your progress...
        </>
      )}
      {toast.type === "done" && (
        <>✓ Everything synced ({toast.count} update{toast.count === 1 ? "" : "s"})</>
      )}
      {toast.type === "saved" && (
        <>
          💾 Saved on this device. {toast.count} update
          {toast.count === 1 ? "" : "s"} will sync when you're online.
        </>
      )}
      {toast.type === "error" && (
        <>Couldn't sync yet. We'll try again automatically.</>
      )}
    </div>
  );
}
