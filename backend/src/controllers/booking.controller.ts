import { Response, NextFunction } from "express";
import Booking from "../models/Booking";
import Resource from "../models/Resource";
import { AuthRequest } from "../middleware/auth";
import { logAudit } from "../services/audit.service";
import mongoose from "mongoose";

// Helper to convert time strings (e.g., "08:30 AM", "14:00", "02:30 PM", "9 AM", "9.00 AM") to total minutes from midnight
export const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const clean = timeStr.trim().toUpperCase();

  // Handle range strings if a slot is passed like "08:30 AM - 10:30 AM"
  if (clean.includes("-")) {
    const parts = clean.split("-");
    return parseTimeToMinutes(parts[0].trim());
  }

  // Match formats: "08:30 AM", "8:30 PM", "8:30PM", "8:30", "14:30", "08.30 AM", "9 AM", "9AM", "9.00 AM"
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

// Helper for end time if range is passed
export const parseEndTimeToMinutes = (timeStr: string, defaultDurationMinutes = 60): number => {
  if (!timeStr) return 0;
  const clean = timeStr.trim();
  if (clean.includes("-")) {
    const parts = clean.split("-");
    return parseTimeToMinutes(parts[1].trim());
  }
  return parseTimeToMinutes(timeStr) || defaultDurationMinutes;
};

// Helper to generate a unique booking code
const generateBookingCode = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await Booking.countDocuments();
  let candidate = `BK-${year}-${String(count + 101).padStart(4, "0")}`;
  let exists = await Booking.findOne({ bookingCode: candidate });
  let salt = 1;
  while (exists) {
    candidate = `BK-${year}-${String(count + 101 + salt).padStart(4, "0")}`;
    exists = await Booking.findOne({ bookingCode: candidate });
    salt++;
  }
  return candidate;
};

export const getBookings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      status,
      resourceId,
      date,
      search,
      page = 1,
      limit = 10,
      myBookingsOnly,
    } = req.query as Record<string, any>;

    const query: any = {};

    // If user is a student or requested own bookings, filter by user
    if (myBookingsOnly === "true" || (req.user && req.user.role === "student")) {
      query.user = req.user?._id;
    }

    if (status && status !== "All" && status.trim() !== "") {
      query.status = status.trim();
    }

    if (resourceId && resourceId !== "All") {
      query.resource = resourceId;
    }

    if (date && date.trim() !== "") {
      query.date = date.trim();
    }

    if (search && search.trim() !== "") {
      query.$or = [
        { purpose: { $regex: search.trim(), $options: "i" } },
        { resourceName: { $regex: search.trim(), $options: "i" } },
        { userName: { $regex: search.trim(), $options: "i" } },
        { bookingCode: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = parseInt(String(limit), 10) || 10;
    const skip = limitNum > 0 ? (pageNum - 1) * limitNum : 0;

    const total = await Booking.countDocuments(query);
    const bookings = limitNum > 0
      ? await Booking.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limitNum).populate("resource", "resourceCode name category capacity status")
      : await Booking.find(query).sort({ date: -1, createdAt: -1 }).populate("resource", "resourceCode name category capacity status");

    res.status(200).json({
      success: true,
      data: bookings,
      count: bookings.length,
      total,
      totalPages: limitNum > 0 ? Math.ceil(total / limitNum) : 1,
      currentPage: pageNum,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate("resource").populate("user", "firstName lastName email role department");

    if (!booking) {
      res.status(404).json({ success: false, message: "Booking record not found" });
      return;
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { resource: resourceId, purpose, date, startTime, endTime, attendeesCount, priority, remarks } = req.body;

    // 1. Verify resource exists
    if (!resourceId || !mongoose.Types.ObjectId.isValid(resourceId)) {
      res.status(400).json({ success: false, message: "Please select a valid campus facility." });
      return;
    }

    const resource = await Resource.findById(resourceId);
    if (!resource || resource.isArchived) {
      res.status(404).json({ success: false, message: "Selected resource does not exist." });
      return;
    }

    // 2. Prevent booking if under maintenance
    if (resource.status === "Maintenance") {
      res.status(400).json({
        success: false,
        message: `Resource '${resource.name}' is currently under Maintenance and cannot be booked until repairs are completed.`,
      });
      return;
    }

    // 3. Check capacity warning/limit
    if (resource.capacity > 0 && attendeesCount && attendeesCount > resource.capacity) {
      res.status(400).json({
        success: false,
        message: `Requested attendee count (${attendeesCount}) exceeds venue maximum capacity (${resource.capacity}).`,
      });
      return;
    }

    // 4. Time Conflict Detection
    const cleanDate = (date || "").trim();
    const reqStartMin = parseTimeToMinutes(startTime);
    const reqEndMin = parseTimeToMinutes(endTime) || reqStartMin + 60;

    if (reqEndMin <= reqStartMin) {
      res.status(400).json({
        success: false,
        message: `End time (${endTime}) must be later than start time (${startTime}).`,
      });
      return;
    }

    // Fetch existing bookings for this resource on this date
    const existingBookings = await Booking.find({
      resource: resource._id,
      date: cleanDate,
      status: { $in: ["Approved", "Pending"] },
    });

    for (const eb of existingBookings) {
      const ebStartMin = parseTimeToMinutes(eb.startTime);
      const ebEndMin = parseTimeToMinutes(eb.endTime) || ebStartMin + 60;

      // Overlap condition: start < other.end AND end > other.start
      if (reqStartMin < ebEndMin && reqEndMin > ebStartMin) {
        res.status(409).json({
          success: false,
          message: `Booking Conflict: '${resource.name}' already has a ${eb.status} booking (${eb.bookingCode}) on ${cleanDate} between ${eb.startTime} and ${eb.endTime}. Please choose a different time slot or date.`,
        });
        return;
      }
    }

    const bookingCode = await generateBookingCode();
    const user = req.user;

    const booking = await Booking.create({
      bookingCode,
      resource: resource._id,
      resourceName: resource.name,
      resourceCategory: resource.category,
      user: user?._id,
      userName: user ? `${user.firstName} ${user.lastName}` : "Campus Staff",
      userEmail: user?.email || "",
      userRole: user?.role || "lecturer",
      purpose,
      department: user?.department || "General",
      date,
      startTime,
      endTime,
      attendeesCount: attendeesCount || 1,
      priority: priority || "Normal",
      status: "Pending",
      remarks: remarks || "",
    });

    await logAudit({
      action: "CREATE_BOOKING",
      entity: "Booking",
      entityId: booking._id.toString(),
      req,
      details: `Created booking request ${booking.bookingCode} for resource ${resource.name} on ${date} (${startTime} - ${endTime})`,
    });

    res.status(201).json({
      success: true,
      message: "Booking request submitted successfully and is pending review.",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, remarks } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: "Booking record not found." });
      return;
    }

    const currentUser = req.user;
    if (!currentUser) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    // Business Rule: Self-Approval Prevention
    // Users cannot approve or reject their own requests unless they are Super Admin
    if (
      (status === "Approved" || status === "Rejected") &&
      booking.user.toString() === currentUser._id.toString() &&
      currentUser.role !== "superadmin"
    ) {
      res.status(403).json({
        success: false,
        message: "Policy Enforcement: You cannot approve or reject your own booking request. An independent administrator must evaluate this request.",
      });
      return;
    }

    booking.status = status;

    if (status === "Approved") {
      const bStart = parseTimeToMinutes(booking.startTime);
      const bEnd = parseTimeToMinutes(booking.endTime) || bStart + 60;
      const existingApproved = await Booking.find({
        _id: { $ne: booking._id },
        resource: booking.resource,
        date: booking.date,
        status: "Approved",
      });
      for (const eb of existingApproved) {
        const ebStart = parseTimeToMinutes(eb.startTime);
        const ebEnd = parseTimeToMinutes(eb.endTime) || ebStart + 60;
        if (bStart < ebEnd && bEnd > ebStart) {
          res.status(409).json({
            success: false,
            message: `Conflict: Resource '${booking.resourceName}' already has an Approved reservation (${eb.bookingCode}) on ${booking.date} between ${eb.startTime} and ${eb.endTime}. Cannot approve conflicting request.`,
          });
          return;
        }
      }
      booking.approvedBy = currentUser._id as any;
      booking.approvedByName = `${currentUser.firstName} ${currentUser.lastName}`;
      booking.approvedAt = new Date();
    }
    if (rejectionReason) booking.rejectionReason = rejectionReason;
    if (remarks) booking.remarks = remarks;

    await booking.save();

    await logAudit({
      action: `BOOKING_${status.toUpperCase()}`,
      entity: "Booking",
      entityId: booking._id.toString(),
      req,
      details: `Booking ${booking.bookingCode} status updated to ${status} by ${currentUser.firstName} ${currentUser.lastName}`,
    });

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status} successfully.`,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBooking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      res.status(404).json({ success: false, message: "Booking record not found" });
      return;
    }

    if (booking.status === "Completed" || booking.status === "Cancelled") {
      res.status(400).json({
        success: false,
        message: `Cannot edit a booking that is already marked as ${booking.status}.`,
      });
      return;
    }

    const updated = await Booking.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    await logAudit({
      action: "UPDATE_BOOKING",
      entity: "Booking",
      entityId: String(id),
      req,
      details: `Updated details for booking ${booking.bookingCode}`,
    });

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /bookings/alternatives?resourceId=&date=&startTime=&endTime=&attendeesCount=
 * Intelligently returns available alternative venues across the campus for the requested date and time slot.
 * Checks date & time availability for same-category venues first, and also checks all other campus venues,
 * ensuring verified zero-conflict recommendations.
 */
export const getAlternativeResources = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { resourceId, date, startTime, endTime, attendeesCount } = req.query as Record<string, string>;

    if (!resourceId || !date || !startTime || !endTime) {
      res.status(400).json({ success: false, message: "resourceId, date, startTime, and endTime are required." });
      return;
    }

    const cleanDate = date.trim();
    const reqStartMin = parseTimeToMinutes(startTime);
    let reqEndMin = parseTimeToMinutes(endTime);
    if (!reqEndMin || reqEndMin <= reqStartMin) {
      reqEndMin = reqStartMin + 60;
    }
    const requiredCapacity = parseInt(attendeesCount || "1", 10);

    // Find the original resource to get its category
    let originalResource = null;
    if (mongoose.Types.ObjectId.isValid(resourceId)) {
      originalResource = await Resource.findById(resourceId);
    }
    const currentCategory = originalResource?.category || null;

    // Get all candidate venues: not the conflicting one, not archived, not under maintenance
    const candidateQuery: any = {
      isArchived: false,
      status: { $ne: "Maintenance" },
    };

    if (originalResource?._id) {
      candidateQuery._id = { $ne: originalResource._id };
    } else if (mongoose.Types.ObjectId.isValid(resourceId)) {
      candidateQuery._id = { $ne: new mongoose.Types.ObjectId(resourceId) };
    }

    // Query candidate venues across the entire campus
    const allCandidates = await Resource.find(candidateQuery).lean();

    if (allCandidates.length === 0) {
      res.status(200).json({
        success: true,
        data: [],
        count: 0,
        message: "No other active venues found in the campus catalog.",
      });
      return;
    }

    const candidateIds = allCandidates.map((c) => c._id);

    // Fetch existing Approved and Pending bookings for all candidates on the requested date
    const existingBookingsOnDate = await Booking.find({
      resource: { $in: candidateIds },
      date: cleanDate,
      status: { $in: ["Approved", "Pending"] },
    }).lean();

    // Group bookings by resource id for O(1) lookup
    const bookingsByResource = new Map<string, typeof existingBookingsOnDate>();
    for (const bk of existingBookingsOnDate) {
      const resIdStr = bk.resource.toString();
      if (!bookingsByResource.has(resIdStr)) {
        bookingsByResource.set(resIdStr, []);
      }
      bookingsByResource.get(resIdStr)!.push(bk);
    }

    interface AvailableAlternativeVenue extends Record<string, any> {
      isSameCategory: boolean;
      fitsCapacity: boolean;
      capacityDiff: number;
    }

    const availableAlternatives: AvailableAlternativeVenue[] = [];

    // Verify availability for each candidate: only venues with zero time conflict are accepted
    for (const candidate of allCandidates) {
      const resIdStr = candidate._id.toString();
      const venueBookings = bookingsByResource.get(resIdStr) || [];

      // Check for time overlap on cleanDate
      const hasConflict = venueBookings.some((eb) => {
        const ebStart = parseTimeToMinutes(eb.startTime);
        const ebEnd = parseTimeToMinutes(eb.endTime) || ebStart + 60;
        return reqStartMin < ebEnd && reqEndMin > ebStart;
      });

      if (!hasConflict) {
        const isSameCategory = Boolean(
          currentCategory && candidate.category?.toLowerCase() === currentCategory.toLowerCase()
        );
        const fitsCapacity = candidate.capacity >= requiredCapacity;
        const capacityDiff = Math.abs(candidate.capacity - requiredCapacity);

        availableAlternatives.push({
          ...candidate,
          isSameCategory,
          fitsCapacity,
          capacityDiff,
        });
      }
    }

    // Smart Multi-criteria Ranking:
    // 1. Venues that fit requested capacity first
    // 2. Same-category venues prioritized within capacity tier
    // 3. Closer capacity fit prioritized (prevents extreme mismatches)
    availableAlternatives.sort((a, b) => {
      if (a.fitsCapacity !== b.fitsCapacity) {
        return a.fitsCapacity ? -1 : 1;
      }
      if (a.isSameCategory !== b.isSameCategory) {
        return a.isSameCategory ? -1 : 1;
      }
      return a.capacityDiff - b.capacityDiff;
    });

    // Return top verified available alternatives
    const topAlternatives = availableAlternatives.slice(0, 8);

    res.status(200).json({
      success: true,
      data: topAlternatives,
      count: topAlternatives.length,
      totalAvailableAcrossCampus: availableAlternatives.length,
      searchedDate: cleanDate,
      searchedTime: `${startTime} - ${endTime}`,
      message:
        topAlternatives.length === 0
          ? `No alternative venues are available across the campus on ${cleanDate} between ${startTime} and ${endTime}.`
          : `Found ${availableAlternatives.length} available venue(s) across the campus for ${cleanDate} (${startTime} - ${endTime}).`,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBooking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      res.status(404).json({ success: false, message: "Booking record not found" });
      return;
    }

    await Booking.findByIdAndDelete(id);

    await logAudit({
      action: "DELETE_BOOKING",
      entity: "Booking",
      entityId: String(id),
      req,
      details: `Deleted booking record ${booking.bookingCode}`,
    });

    res.status(200).json({
      success: true,
      message: `Booking record ${booking.bookingCode} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};
