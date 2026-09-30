import Notification from "../models/notification.model.js";
import logger, { errorMeta } from "../utils/logger.js";
import PushSubscription from "../models/pushSubscription.model.js";
import { pushEnabled } from "../services/notification.service.js";

export const listNotifications = async (req, res) => {
  try {
    const [notifications, unread] = await Promise.all([
      Notification.find({
        user: req.user._id,
        scheduledFor: { $lte: new Date() },
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Notification.countDocuments({
        user: req.user._id,
        read: false,
      }),
    ]);

    return res.json({ success: true, unread, notifications });
  } catch (error) {
    logger.error("List notifications error:", errorMeta(error));
    return res.status(500).json({
      success: false,
      message: "Could not load notifications",
    });
  }
};

export const markRead = async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid id" });
    }
    await Notification.updateOne(
      { _id: req.params.id, user: req.user._id },
      { read: true }
    );
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not update notification",
    });
  }
};

export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not update notifications",
    });
  }
};

export const getPushConfig = (req, res) =>
  res.json({
    success: true,
    enabled: pushEnabled,
    publicKey: pushEnabled ? process.env.VAPID_PUBLIC_KEY : null,
  });

export const subscribePush = async (req, res) => {
  try {
    const { endpoint, keys } = req.body || {};

    if (
      typeof endpoint !== "string" ||
      endpoint.length > 600 ||
      !endpoint.startsWith("https://") ||
      typeof keys?.p256dh !== "string" ||
      typeof keys?.auth !== "string" ||
      keys.p256dh.length > 200 ||
      keys.auth.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid push subscription",
      });
    }

    // The same browser can be re-used by another account: re-assign it.
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        user: req.user._id,
        endpoint,
        keys: { p256dh: keys.p256dh, auth: keys.auth },
        userAgent: String(req.headers["user-agent"] || "").slice(
          0,
          200
        ),
      },
      { upsert: true, new: true }
    );

    // Keep at most 10 devices per user (drop the oldest).
    const stale = await PushSubscription.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .skip(10)
      .select("_id")
      .lean();
    if (stale.length) {
      await PushSubscription.deleteMany({
        _id: { $in: stale.map((s) => s._id) },
      });
    }

    return res.status(201).json({ success: true });
  } catch (error) {
    logger.error("Subscribe push error:", errorMeta(error));
    return res.status(500).json({
      success: false,
      message: "Could not enable push notifications",
    });
  }
};

export const unsubscribePush = async (req, res) => {
  try {
    const endpoint = req.body?.endpoint;
    if (typeof endpoint !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Endpoint is required" });
    }
    await PushSubscription.deleteOne({
      endpoint,
      user: req.user._id,
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not disable push notifications",
    });
  }
};
