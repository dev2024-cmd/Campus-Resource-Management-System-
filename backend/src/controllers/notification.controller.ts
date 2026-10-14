import { Request, Response, NextFunction } from "express";
import Notification from "../models/Notification";
import { checkAndGenerateReminders } from "../services/reminder.service";

export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Run reminder check so latest schedule notifications are included
    await checkAndGenerateReminders();

    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, message: "Notification not found" });
      return;
    }

    const unreadCount = await Notification.countDocuments({ isRead: false });
    res.status(200).json({ success: true, data: notification, unreadCount });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: "All notifications marked as read", unreadCount: 0 });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await Notification.findByIdAndDelete(id);

    if (!deleted) {
      res.status(404).json({ success: false, message: "Notification not found" });
      return;
    }

    const unreadCount = await Notification.countDocuments({ isRead: false });
    res.status(200).json({ success: true, message: "Notification deleted", unreadCount });
  } catch (error) {
    next(error);
  }
};

export const checkRemindersEndpoint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const createdCount = await checkAndGenerateReminders();
    const unreadCount = await Notification.countDocuments({ isRead: false });
    res.status(200).json({
      success: true,
      message: `Reminder check completed. Generated ${createdCount} new reminder(s).`,
      newReminders: createdCount,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};
