import { Response, NextFunction } from "express";
import Resource from "../models/Resource";
import Booking from "../models/Booking";
import Maintenance from "../models/Maintenance";
import User from "../models/User";
import AuditLog from "../models/AuditLog";
import { AuthRequest } from "../middleware/auth";

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalResources,
      availableResources,
      allocatedResources,
      maintenanceResources,
      reservedResources,
      totalBookings,
      pendingBookings,
      approvedBookings,
      activeMaintenance,
      totalUsers,
      categoryDistribution,
      statusDistribution,
      recentActivity,
      upcomingBookings,
      urgentMaintenance,
    ] = await Promise.all([
      Resource.countDocuments({ isArchived: false }),
      Resource.countDocuments({ isArchived: false, status: "Available" }),
      Resource.countDocuments({ isArchived: false, status: "Allocated" }),
      Resource.countDocuments({ isArchived: false, status: "Maintenance" }),
      Resource.countDocuments({ isArchived: false, status: "Reserved" }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "Pending" }),
      Booking.countDocuments({ status: "Approved" }),
      Maintenance.countDocuments({ status: { $in: ["Reported", "Scheduled", "In Progress"] } }),
      User.countDocuments(),
      // Category distribution aggregation
      Resource.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Status distribution aggregation
      Resource.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      // Recent audit activity
      AuditLog.find().sort({ createdAt: -1 }).limit(8),
      // Upcoming bookings
      Booking.find({ status: "Approved" })
        .sort({ date: 1, startTime: 1 })
        .limit(5)
        .populate("resource", "resourceCode name building room"),
      // Urgent maintenance tickets
      Maintenance.find({
        status: { $in: ["Reported", "Scheduled", "In Progress"] },
        priority: { $in: ["Urgent", "High"] },
      }).sort({ createdAt: -1 }).limit(5),
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalResources,
          availableResources,
          allocatedResources,
          maintenanceResources,
          reservedResources,
          totalBookings,
          pendingBookings,
          approvedBookings,
          activeMaintenance,
          totalUsers,
          utilizationRate: totalResources > 0 ? Math.round(((allocatedResources + reservedResources) / totalResources) * 100) : 0,
        },
        charts: {
          categoryDistribution: categoryDistribution.map((item) => ({
            name: item._id || "Uncategorized",
            count: item.count,
          })),
          statusDistribution: statusDistribution.map((item) => ({
            status: item._id,
            count: item.count,
          })),
        },
        recentActivity,
        upcomingBookings,
        urgentMaintenance,
      },
    });
  } catch (error) {
    next(error);
  }
};
