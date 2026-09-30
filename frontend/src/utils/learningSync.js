import api, { getCurrentUser, isLoggedIn } from "./api";
import {
  cacheGet,
  cacheSet,
  getPendingEvents,
  queueEvent,
  removeEvents,
} from "./idbCache";

// Components listen to this to refresh after activity / sync.
export const SYNC_EVENT = "shikshasetu:sync";

const emit = (detail) =>
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail }));

const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

let syncing = false;

// Sends queued events to the server. Safe to call repeatedly: the
// server ignores duplicates by clientId.
export const syncPendingEvents = async () => {
  if (syncing || !navigator.onLine || !isLoggedIn()) {
    return { synced: 0 };
  }

  const user = getCurrentUser();
  const pending = (await getPendingEvents()).filter(
    (e) => e.userId === (user?._id || user?.id)
  );
  if (!pending.length) return { synced: 0 };

  syncing = true;
  emit({ status: "syncing", count: pending.length });

  try {
    let synced = 0;
    for (let i = 0; i < pending.length; i += 50) {
      const batch = pending.slice(i, i + 50).map(
        // eslint-disable-next-line no-unused-vars
        ({ userId, ...event }) => event
      );
      const { data } = await api.post("/api/learning/events", {
        events: batch,
      });
      await removeEvents(data.syncedIds || batch.map((b) => b.clientId));
      synced += batch.length;
    }
    emit({ status: "done", count: synced });
    return { synced };
  } catch (error) {
    // 400 = every event in the batch was invalid: drop them so they
    // don't block the queue forever. Anything else retries later.
    if (error.response?.status === 400) {
      await removeEvents(pending.map((e) => e.clientId));
    }
    emit({ status: "error" });
    return { synced: 0, error };
  } finally {
    syncing = false;
  }
};

// Records a learning action. Always queued locally first, so nothing
// is lost offline; it is then synced immediately when online.
export const recordLearningEvent = async (event) => {
  if (!isLoggedIn()) return false;
  const user = getCurrentUser();

  await queueEvent({
    clientId: newId(),
    occurredAt: new Date().toISOString(),
    userId: user?._id || user?.id,
    ...event,
  }).catch(() => null);

  emit({ status: "queued" });
  syncPendingEvents();
  return true;
};

export const pendingCount = async () => {
  const user = getCurrentUser();
  return (await getPendingEvents()).filter(
    (e) => e.userId === (user?._id || user?.id)
  ).length;
};

// Summary with offline fallback (last good copy is cached per user).
export const loadSummary = async (subject = "Mathematics") => {
  const user = getCurrentUser();
  const key = `summary:${user?._id || user?.id}:${subject}`;

  try {
    const { data } = await api.get("/api/learning/summary", {
      params: { subject },
    });
    cacheSet(key, data);
    return { data, fromCache: false };
  } catch (error) {
    const cached = await cacheGet(key);
    if (cached) return { data: cached.value, fromCache: true };
    throw error;
  }
};

// One-time import of lessons completed before events existed (they lived
// only in localStorage). Deterministic clientIds keep this idempotent.
export const migrateLegacyProgress = async () => {
  if (!isLoggedIn()) return;
  const user = getCurrentUser();
  const flag = `shikshasetu-legacy-migrated-${user?._id || user?.id}`;

  try {
    if (localStorage.getItem(flag)) return;

    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith("shikshasetu-progress-")
    );
    for (const key of keys) {
      const subject = key.replace("shikshasetu-progress-", "");
      const topics = JSON.parse(localStorage.getItem(key) || "[]");
      for (const topic of topics) {
        await queueEvent({
          clientId: `legacy-${subject}-${topic}`.slice(0, 80),
          type: "lesson_complete",
          subject,
          topic,
          occurredAt: new Date().toISOString(),
          userId: user?._id || user?.id,
        });
      }
    }
    localStorage.setItem(flag, "1");
    syncPendingEvents();
  } catch {
    // non-critical
  }
};
