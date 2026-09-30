import { openDB, CACHE_STORE, EVENT_STORE } from "./offlineDB";

const run = async (storeName, mode, work) => {
  const db = await openDB();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const result = work(tx.objectStore(storeName));
      tx.oncomplete = () => resolve(result?.result ?? result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
};

// ---------- generic key/value cache (per-user keys) ----------

export const cacheSet = (key, value) =>
  run(CACHE_STORE, "readwrite", (store) =>
    store.put({ key, value, savedAt: Date.now() })
  ).catch(() => null);

export const cacheGet = async (key) => {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const req = db
        .transaction(CACHE_STORE, "readonly")
        .objectStore(CACHE_STORE)
        .get(key);
      req.onsuccess = () => {
        db.close();
        resolve(req.result || null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    return null;
  }
};

export const cacheDelete = (key) =>
  run(CACHE_STORE, "readwrite", (store) => store.delete(key)).catch(
    () => null
  );

// ---------- pending learning events (offline queue) ----------

export const queueEvent = (event) =>
  run(EVENT_STORE, "readwrite", (store) => store.put(event));

export const removeEvents = (clientIds) =>
  run(EVENT_STORE, "readwrite", (store) => {
    clientIds.forEach((id) => store.delete(id));
  });

export const getPendingEvents = async () => {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const req = db
        .transaction(EVENT_STORE, "readonly")
        .objectStore(EVENT_STORE)
        .getAll();
      req.onsuccess = () => {
        db.close();
        resolve(req.result || []);
      };
      req.onerror = () => {
        db.close();
        resolve([]);
      };
    });
  } catch {
    return [];
  }
};
