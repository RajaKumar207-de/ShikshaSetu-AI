import express from "express";
import {
  listNotifications,
  markRead,
  markAllRead,
  getPushConfig,
  subscribePush,
  unsubscribePush,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticate, listNotifications);
router.get("/push-config", authenticate, getPushConfig);
router.post("/subscribe", authenticate, subscribePush);
router.delete("/subscribe", authenticate, unsubscribePush);
router.patch("/read-all", authenticate, markAllRead);
router.patch("/:id/read", authenticate, markRead);

export default router;
