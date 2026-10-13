import { Response, NextFunction } from "express";
import Resource from "../models/Resource";
import Booking from "../models/Booking";
import Maintenance from "../models/Maintenance";
import { AuthRequest } from "../middleware/auth";
import { logAudit } from "../services/audit.service";

// Helper to generate a unique resource code
const generateUniqueResourceCode = async (category: string): Promise<string> => {
  const prefix = (category.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "") || "RES").padEnd(3, "X");
  const count = await Resource.countDocuments();
  let candidate = `${prefix}-${String(count + 101).padStart(4, "0")}`;
  
  let exists = await Resource.findOne({ resourceCode: candidate });
  let salt = 1;
  while (exists) {
    candidate = `${prefix}-${String(count + 101 + salt).padStart(4, "0")}`;
    exists = await Resource.findOne({ resourceCode: candidate });
    salt++;
  }
  return candidate;
};

export const getResources = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      search,
      category,
      status,
      condition,
      building,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query as Record<string, any>;

    const query: any = { isArchived: false };

    if (search && search.trim() !== "") {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { resourceCode: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
        { building: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (category && category !== "All" && category.trim() !== "") {
      query.category = category.trim();
    }

    if (status && status !== "All" && status.trim() !== "") {
      query.status = status.trim();
    }

    if (condition && condition !== "All" && condition.trim() !== "") {
      query.condition = condition.trim();
    }

    if (building && building !== "All" && building.trim() !== "") {
      query.building = building.trim();
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = parseInt(String(limit), 10) || 10;
    const skip = limitNum > 0 ? (pageNum - 1) * limitNum : 0;

    const sortOption: any = {};
    sortOption[String(sortBy)] = sortOrder === "asc" ? 1 : -1;

    const total = await Resource.countDocuments(query);
    const resources = limitNum > 0
      ? await Resource.find(query).sort(sortOption).skip(skip).limit(limitNum)
      : await Resource.find(query).sort(sortOption);

    res.status(200).json({
      success: true,
      data: resources,
      count: resources.length,
      total,
      totalPages: limitNum > 0 ? Math.ceil(total / limitNum) : 1,
      currentPage: pageNum,
    });
  } catch (error) {
    next(error);
  }
};

export const getResourceById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource || resource.isArchived) {
      res.status(404).json({
        success: false,
        message: "Resource not found.",
      });
      return;
    }

    // Fetch related bookings and maintenance
    const activeBookings = await Booking.find({
      resource: resource._id,
      status: { $in: ["Approved", "Pending"] },
    }).sort({ date: 1, startTime: 1 }).limit(5);

    const maintenanceTickets = await Maintenance.find({
      resource: resource._id,
    }).sort({ createdAt: -1 }).limit(5);

    res.status(200).json({
      success: true,
      data: resource,
      activeBookings,
      maintenanceTickets,
    });
  } catch (error) {
    next(error);
  }
};

export const createResource = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let { resourceCode, category } = req.body;

    if (!resourceCode || resourceCode.trim() === "") {
      resourceCode = await generateUniqueResourceCode(category || "RES");
    } else {
      const existing = await Resource.findOne({ resourceCode: resourceCode.toUpperCase().trim() });
      if (existing) {
        res.status(409).json({
          success: false,
          message: `Resource code '${resourceCode.toUpperCase().trim()}' is already in use. Please choose another code.`,
        });
        return;
      }
    }

    const resource = await Resource.create({
      ...req.body,
      resourceCode: resourceCode.toUpperCase().trim(),
    });

    await logAudit({
      action: "CREATE_RESOURCE",
      entity: "Resource",
      entityId: resource._id.toString(),
      req,
      details: `Created resource: ${resource.name} (${resource.resourceCode}) in category ${resource.category}`,
    });

    res.status(201).json({
      success: true,
      message: "Resource created successfully",
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};

export const updateResource = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.body.resourceCode) {
      const existing = await Resource.findOne({
        resourceCode: req.body.resourceCode.toUpperCase().trim(),
        _id: { $ne: id },
      });
      if (existing) {
        res.status(409).json({
          success: false,
          message: `Resource code '${req.body.resourceCode}' is already used by another resource.`,
        });
        return;
      }
      req.body.resourceCode = req.body.resourceCode.toUpperCase().trim();
    }

    const updated = await Resource.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      res.status(404).json({
        success: false,
        message: "Resource not found",
      });
      return;
    }

    await logAudit({
      action: "UPDATE_RESOURCE",
      entity: "Resource",
      entityId: updated._id.toString(),
      req,
      details: `Updated resource ${updated.name} (${updated.resourceCode})`,
    });

    res.status(200).json({
      success: true,
      message: "Resource updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteResource = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource) {
      res.status(404).json({
        success: false,
        message: "Resource not found",
      });
      return;
    }

    // Reference Integrity Constraint: Check active bookings
    const activeBookingCount = await Booking.countDocuments({
      resource: resource._id,
      status: { $in: ["Approved", "Pending"] },
    });

    if (activeBookingCount > 0) {
      res.status(409).json({
        success: false,
        message: `Cannot delete resource '${resource.name}': It has ${activeBookingCount} active or pending booking(s). Please cancel or complete them first.`,
      });
      return;
    }

    // Check open maintenance tickets
    const openMaintenanceCount = await Maintenance.countDocuments({
      resource: resource._id,
      status: { $in: ["Reported", "Scheduled", "In Progress"] },
    });

    if (openMaintenanceCount > 0) {
      res.status(409).json({
        success: false,
        message: `Cannot delete resource '${resource.name}': It has ${openMaintenanceCount} active maintenance ticket(s).`,
      });
      return;
    }

    await Resource.findByIdAndDelete(id);

    await logAudit({
      action: "DELETE_RESOURCE",
      entity: "Resource",
      entityId: String(id),
      req,
      details: `Deleted resource ${resource.name} (${resource.resourceCode})`,
    });

    res.status(200).json({
      success: true,
      message: `Resource '${resource.name}' was deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};
