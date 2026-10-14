import Booking from "../models/Booking";
import Notification from "../models/Notification";
import mongoose from "mongoose";

// Try loading legacy/current Resource model safely
let LegacyResource: any;
try {
  LegacyResource = require("../../models/resources.model.js");
} catch {
  try {
    LegacyResource = mongoose.model("Resource");
  } catch {
    LegacyResource = null;
  }
}

/**
 * Converts a time string (e.g., "10:30 AM", "14:00", "08:30 AM - 10:30 AM") to minutes from midnight.
 * For range strings, picks the end time.
 */
export const extractEndTimeMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  let target = timeStr.trim();
  if (target.includes("-")) {
    const parts = target.split("-");
    target = parts[1].trim();
  }

  const clean = target.toUpperCase();
  const match = clean.match(/^(\d{1,2})(?:[:.](\d{1,2}))?(?::\d{2})?\s*(AM|PM)?$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const modifier = match[3];

    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  return 0;
};

/**
 * Parses date string (YYYY-MM-DD) and time string to a Date object.
 */
export const buildDateTime = (dateStr: string, timeStr: string): Date | null => {
  if (!dateStr) return null;
  try {
    const cleanDate = dateStr.split("T")[0].trim();
    const parts = cleanDate.split("-");
    if (parts.length !== 3) return null;

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const minutesTotal = extractEndTimeMinutes(timeStr);
    const hours = Math.floor(minutesTotal / 60);
    const minutes = minutesTotal % 60;

    return new Date(year, month, day, hours, minutes, 0);
  } catch {
    return null;
  }
};

/**
 * Scans scheduled bookings and resources whose scheduled time has concluded,
 * creating in-app reminder notifications for the user.
 */
export const checkAndGenerateReminders = async (): Promise<number> => {
  let createdCount = 0;
  const now = new Date();

  try {
    // 1. Scan Booking collection
    const bookings = await Booking.find({
      status: { $in: ["Approved", "Pending", "Completed"] },
      date: { $exists: true, $ne: "" },
    }).lean();

    for (const b of bookings) {
      const scheduledEndTime = buildDateTime(b.date, b.endTime || b.startTime);
      if (!scheduledEndTime) continue;

      // Has the scheduled time arrived / passed?
      if (now >= scheduledEndTime) {
        const refId = `reminder-booking-concluded-${b._id}`;
        const existing = await Notification.findOne({ referenceId: refId });

        if (!existing) {
          await Notification.create({
            title: `Reservation Concluded: ${b.resourceName}`,
            message: `Your scheduled booking for "${b.resourceName}" on ${b.date} (${b.startTime} - ${b.endTime}) has concluded. Please ensure the facility is vacated and equipment is properly returned.`,
            type: "reminder",
            referenceId: refId,
            resourceId: String(b.resource || ""),
            resourceName: b.resourceName,
            scheduledDate: b.date,
            scheduledTime: `${b.startTime} - ${b.endTime}`,
            userId: b.user,
            userEmail: b.userEmail,
            isRead: false,
          });
          createdCount++;
        }
      }
    }

    // 2. Scan Legacy/Direct Resource reservations (used in Lecturer Dashboard)
    if (LegacyResource) {
      const resources = await LegacyResource.find({
        reservationDate: { $exists: true, $ne: "" },
        reservationTime: { $exists: true, $ne: "" },
      }).lean();

      for (const r of resources) {
        const scheduledEndTime = buildDateTime(r.reservationDate, r.reservationTime);
        if (!scheduledEndTime) continue;

        if (now >= scheduledEndTime) {
          const refId = `reminder-resource-concluded-${r._id}`;
          const existing = await Notification.findOne({ referenceId: refId });

          if (!existing) {
            await Notification.create({
              title: `Schedule Concluded: ${r.name}`,
              message: `Your reservation for "${r.name}" (${r.category}) on ${r.reservationDate} at ${r.reservationTime} has ended. Reminder to verify room handover and equipment status.`,
              type: "reminder",
              referenceId: refId,
              resourceId: String(r._id),
              resourceName: r.name,
              scheduledDate: r.reservationDate,
              scheduledTime: r.reservationTime,
              isRead: false,
            });
            createdCount++;
          }
        }
      }
    }
  } catch (error) {
    console.error("[ReminderService] Error checking schedule reminders:", error);
  }

  return createdCount;
};
