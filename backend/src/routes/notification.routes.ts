import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  checkRemindersEndpoint,
} from "../controllers/notification.controller";

const router = Router();

router.get("/", getNotifications);
router.post("/check-reminders", checkRemindersEndpoint);
router.patch("/mark-all-read", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;
