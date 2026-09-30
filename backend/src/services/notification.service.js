import webpush from "web-push";
import Notification from "../models/notification.model.js";
import PushSubscription from "../models/pushSubscription.model.js";
import logger from "../utils/logger.js";

const {
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
  VAPID_SUBJECT,
} = process.env;

export const pushEnabled = Boolean(
  VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY
);

if (pushEnabled) {
  webpush.setVapidDetails(
    VAPID_SUBJECT || "mailto:admin@shikshasetu.local",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
} else {
  logger.warn("VAPID keys missing - browser push notifications disabled");
}

const sendPush = async (userId, payload) => {
  if (!pushEnabled) return;

  const subscriptions = await PushSubscription.find({
    user: userId,
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify(payload)
        );
      } catch (error) {
        // 404/410 = subscription expired or revoked
        if (
          error.statusCode === 404 ||
          error.statusCode === 410
        ) {
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          logger.warn("Push delivery failed", { status: error.statusCode });
        }
      }
    })
  );
};

// Creates an in-app notification and, when the user has push
// subscriptions, delivers a browser push too. Returns null when a
// notification with the same dedupeKey already exists.
export const notify = async (
  userId,
  {
    type = "system",
    title,
    message = "",
    relatedEntity = "",
    relatedEntityId = "",
    link = "",
    metadata = {},
    dedupeKey,
  }
) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      relatedEntity,
      relatedEntityId: String(relatedEntityId || ""),
      link,
      metadata,
      dedupeKey,
      deliveredAt: new Date(),
    });

    await sendPush(userId, {
      title,
      body: message,
      url: link || "/",
      tag: notification._id.toString(),
    });

    return notification;
  } catch (error) {
    if (error.code === 11000) return null; // duplicate
    logger.error("Notify failed", { error: error.message });
    return null;
  }
};
