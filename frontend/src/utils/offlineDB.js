const DB_NAME = "ShikshaSetuOfflineDB";
const DB_VERSION = 2;

const LESSON_STORE = "lessons";

// Added in DB version 2 (existing lessons are preserved on upgrade).
export const EVENT_STORE = "pendingEvents";
export const CACHE_STORE = "cache";

// ======================================================
// OPEN DATABASE
// ======================================================

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(LESSON_STORE)) {
        db.createObjectStore(LESSON_STORE, {
          keyPath: "id",
        });
      }

      if (!db.objectStoreNames.contains(EVENT_STORE)) {
        db.createObjectStore(EVENT_STORE, {
          keyPath: "clientId",
        });
      }

      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, {
          keyPath: "key",
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// ======================================================
// SAVE LESSON FOR OFFLINE
// ======================================================

export async function saveOfflineLesson({
  subject,
  topic,
  lesson,
}) {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        LESSON_STORE,
        "readwrite"
      );

      const store =
        transaction.objectStore(
          LESSON_STORE
        );

      const id = `${subject}__${topic}`;

      store.put({
        id,
        subject,
        topic,
        lesson,
        savedAt: new Date().toISOString(),
      });

      transaction.oncomplete = () => {
        db.close();
        resolve(true);
      };

      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error(
      "Failed to save offline lesson:",
      error
    );

    return false;
  }
}

// ======================================================
// GET ONE OFFLINE LESSON
// ======================================================

export async function getOfflineLesson(
  subject,
  topic
) {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        LESSON_STORE,
        "readonly"
      );

      const store =
        transaction.objectStore(
          LESSON_STORE
        );

      const id = `${subject}__${topic}`;

      const request = store.get(id);

      request.onsuccess = () => {
        db.close();
        resolve(request.result || null);
      };

      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(
      "Failed to get offline lesson:",
      error
    );

    return null;
  }
}

// ======================================================
// GET ALL OFFLINE LESSONS
// ======================================================

export async function getAllOfflineLessons() {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        LESSON_STORE,
        "readonly"
      );

      const store =
        transaction.objectStore(
          LESSON_STORE
        );

      const request = store.getAll();

      request.onsuccess = () => {
        db.close();
        resolve(request.result || []);
      };

      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(
      "Failed to get offline lessons:",
      error
    );

    return [];
  }
}

// ======================================================
// CHECK WHETHER LESSON IS DOWNLOADED
// ======================================================

export async function isLessonDownloaded(
  subject,
  topic
) {
  const lesson = await getOfflineLesson(
    subject,
    topic
  );

  return Boolean(lesson);
}

// ======================================================
// DELETE OFFLINE LESSON
// ======================================================

export async function deleteOfflineLesson(
  subject,
  topic
) {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        LESSON_STORE,
        "readwrite"
      );

      const store =
        transaction.objectStore(
          LESSON_STORE
        );

      const id = `${subject}__${topic}`;

      store.delete(id);

      transaction.oncomplete = () => {
        db.close();
        resolve(true);
      };

      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error(
      "Failed to delete offline lesson:",
      error
    );

    return false;
  }
}

// ======================================================
// DELETE ALL OFFLINE LESSONS
// ======================================================

export async function clearAllOfflineLessons() {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        LESSON_STORE,
        "readwrite"
      );

      const store =
        transaction.objectStore(
          LESSON_STORE
        );

      store.clear();

      transaction.oncomplete = () => {
        db.close();
        resolve(true);
      };

      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error(
      "Failed to clear offline lessons:",
      error
    );

    return false;
  }
}