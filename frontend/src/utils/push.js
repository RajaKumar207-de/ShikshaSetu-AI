import api from "./api";

const urlBase64ToUint8Array = (base64) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(
    (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  );
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

export const pushSupported = () =>
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

// "unsupported" | "denied" | "enabled" | "available"
export const getPushState = async () => {
  if (!pushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub && Notification.permission === "granted") return "enabled";
  } catch {
    // fall through
  }
  return "available";
};

// Must be called from a user gesture (button click).
export const enablePush = async () => {
  if (!pushSupported()) {
    throw new Error("This browser does not support notifications.");
  }

  const { data: config } = await api.get("/api/notifications/push-config");
  if (!config.enabled) {
    throw new Error("Push notifications are not set up on the server.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.publicKey),
    });
  }

  await api.post("/api/notifications/subscribe", sub.toJSON());
  return true;
};

export const disablePush = async () => {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await api
        .delete("/api/notifications/subscribe", {
          data: { endpoint: sub.endpoint },
        })
        .catch(() => null);
      await sub.unsubscribe();
    }
  } catch {
    // ignore
  }
};
