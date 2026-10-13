import { Response, NextFunction } from "express";
import Resource from "../models/Resource";
import Booking from "../models/Booking";
import Maintenance from "../models/Maintenance";
import { AuthRequest } from "../middleware/auth";

export const getUtilizationReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const totalResources = await Resource.countDocuments({ isArchived: false });
    
    // Category utilization
    const categoryStats = await Resource.aggregate([
      { $match: { isArchived: false } },
      {
        $group: {
          _id: "$category",
          total: { $sum: 1 },
          allocated: {
            $sum: { $cond: [{ $in: ["$status", ["Allocated", "Reserved"]] }, 1, 0] },
          },
          underMaintenance: {
            $sum: { $cond: [{ $eq: ["$status", "Maintenance"] }, 1, 0] },
          },
          available: {
            $sum: { $cond: [{ $eq: ["$status", "Available"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          category: "$_id",
          total: 1,
          allocated: 1,
          underMaintenance: 1,
          available: 1,
          utilizationRate: {
            $cond: [
              { $gt: ["$total", 0] },
              { $round: [{ $multiply: [{ $divide: ["$allocated", "$total"] }, 100] }, 1] },
              0,
            ],
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Building utilization
    const buildingStats = await Resource.aggregate([
      { $match: { isArchived: false } },
      {
        $group: {
          _id: "$building",
          total: { $sum: 1 },
          allocated: {
            $sum: { $cond: [{ $in: ["$status", ["Allocated", "Reserved"]] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          building: { $ifNull: ["$_id", "Unassigned"] },
          total: 1,
          allocated: 1,
          utilizationRate: {
            $cond: [
              { $gt: ["$total", 0] },
              { $round: [{ $multiply: [{ $divide: ["$allocated", "$total"] }, 100] }, 1] },
              0,
            ],
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalResources,
        categoryStats,
        buildingStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceCostReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const costSummary = await Maintenance.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalEstimated: { $sum: "$estimatedCost" },
          totalActual: { $sum: "$actualCost" },
        },
      },
    ]);

    const priorityBreakdown = await Maintenance.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
          totalCost: { $sum: "$actualCost" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        costSummary,
        priorityBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportResourcesCSV = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resources = await Resource.find({ isArchived: false }).sort({ resourceCode: 1 });

    const headers = ["Resource Code", "Name", "Category", "Building", "Room", "Capacity", "Status", "Condition", "Description"];
    const rows = resources.map((r) => [
      `"${r.resourceCode}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.category}"`,
      `"${r.building || ""}"`,
      `"${r.room || ""}"`,
      r.capacity,
      `"${r.status}"`,
      `"${r.condition}"`,
      `"${(r.description || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="campus_resources.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

export const exportBookingsCSV = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bookings = await Booking.find().sort({ date: -1 });

    const headers = ["Booking Code", "Resource", "Requester", "Email", "Purpose", "Date", "Start Time", "End Time", "Status", "Priority", "Approved By"];
    const rows = bookings.map((b) => [
      `"${b.bookingCode}"`,
      `"${b.resourceName.replace(/"/g, '""')}"`,
      `"${b.userName.replace(/"/g, '""')}"`,
      `"${b.userEmail}"`,
      `"${b.purpose.replace(/"/g, '""')}"`,
      `"${b.date}"`,
      `"${b.startTime}"`,
      `"${b.endTime}"`,
      `"${b.status}"`,
      `"${b.priority}"`,
      `"${b.approvedByName || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="campus_bookings.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
