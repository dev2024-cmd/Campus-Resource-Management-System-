import { Response, NextFunction } from "express";
import Maintenance from "../models/Maintenance";
import Resource from "../models/Resource";
import { AuthRequest } from "../middleware/auth";
import { logAudit } from "../services/audit.service";

// Helper to generate a unique ticket code
const generateTicketCode = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await Maintenance.countDocuments();
  let candidate = `MNT-${year}-${String(count + 101).padStart(4, "0")}`;
  let exists = await Maintenance.findOne({ ticketCode: candidate });
  let salt = 1;
  while (exists) {
    candidate = `MNT-${year}-${String(count + 101 + salt).padStart(4, "0")}`;
    exists = await Maintenance.findOne({ ticketCode: candidate });
    salt++;
  }
  return candidate;
};

// Helper to sync resource status with maintenance tickets
const syncResourceMaintenanceStatus = async (resourceId: string): Promise<void> => {
  const activeTickets = await Maintenance.countDocuments({
    resource: resourceId,
    status: { $in: ["Reported", "Scheduled", "In Progress"] },
  });

  const resource = await Resource.findById(resourceId);
  if (!resource) return;

  if (activeTickets > 0 && resource.status !== "Maintenance") {
    resource.status = "Maintenance";
    await resource.save();
  } else if (activeTickets === 0 && resource.status === "Maintenance") {
    resource.status = "Available";
    await resource.save();
  }
};

export const getMaintenanceTickets = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      status,
      priority,
      resourceId,
      search,
      page = 1,
      limit = 10,
    } = req.query as Record<string, any>;

    const query: any = {};

    if (status && status !== "All" && status.trim() !== "") {
      query.status = status.trim();
    }

    if (priority && priority !== "All" && priority.trim() !== "") {
      query.priority = priority.trim();
    }

    if (resourceId && resourceId !== "All") {
      query.resource = resourceId;
    }

    if (search && search.trim() !== "") {
      query.$or = [
        { issueTitle: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
        { ticketCode: { $regex: search.trim(), $options: "i" } },
        { resourceName: { $regex: search.trim(), $options: "i" } },
        { assignedTo: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = parseInt(String(limit), 10) || 10;
    const skip = limitNum > 0 ? (pageNum - 1) * limitNum : 0;

    const total = await Maintenance.countDocuments(query);
    const tickets = limitNum > 0
      ? await Maintenance.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).populate("resource", "resourceCode name category status building room")
      : await Maintenance.find(query).sort({ createdAt: -1 }).populate("resource", "resourceCode name category status building room");

    res.status(200).json({
      success: true,
      data: tickets,
      count: tickets.length,
      total,
      totalPages: limitNum > 0 ? Math.ceil(total / limitNum) : 1,
      currentPage: pageNum,
    });
  } catch (error) {
    next(error);
  }
};

export const getTicketById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const ticket = await Maintenance.findById(id).populate("resource");

    if (!ticket) {
      res.status(404).json({ success: false, message: "Maintenance ticket not found" });
      return;
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

export const createTicket = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { resource: resourceId, issueTitle, description, priority, assignedTo, scheduledDate, estimatedCost } = req.body;

    const resource = await Resource.findById(resourceId);
    if (!resource || resource.isArchived) {
      res.status(404).json({ success: false, message: "Resource not found." });
      return;
    }

    const ticketCode = await generateTicketCode();
    const user = req.user;

    const ticket = await Maintenance.create({
      ticketCode,
      resource: resource._id,
      resourceName: resource.name,
      resourceCode: resource.resourceCode,
      reportedBy: user?._id,
      reporterName: user ? `${user.firstName} ${user.lastName}` : "Campus Staff",
      reporterEmail: user?.email || "",
      issueTitle,
      description,
      priority: priority || "Medium",
      status: "Reported",
      assignedTo: assignedTo || "Unassigned",
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      estimatedCost: estimatedCost || 0,
    });

    // Auto-update resource status to Maintenance
    await syncResourceMaintenanceStatus(resource._id.toString());

    await logAudit({
      action: "CREATE_MAINTENANCE",
      entity: "Maintenance",
      entityId: ticket._id.toString(),
      req,
      details: `Created maintenance ticket ${ticket.ticketCode} for ${resource.name} (${issueTitle})`,
    });

    res.status(201).json({
      success: true,
      message: "Maintenance request registered successfully.",
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTicket = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const ticket = await Maintenance.findById(id);

    if (!ticket) {
      res.status(404).json({ success: false, message: "Maintenance ticket not found" });
      return;
    }

    const updated = await Maintenance.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    // Sync resource status
    if (updated) {
      await syncResourceMaintenanceStatus(updated.resource.toString());
    }

    await logAudit({
      action: "UPDATE_MAINTENANCE",
      entity: "Maintenance",
      entityId: String(id),
      req,
      details: `Updated maintenance ticket ${ticket.ticketCode} status to ${updated?.status}`,
    });

    res.status(200).json({
      success: true,
      message: "Maintenance ticket updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTicket = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const ticket = await Maintenance.findById(id);

    if (!ticket) {
      res.status(404).json({ success: false, message: "Maintenance ticket not found" });
      return;
    }

    const resourceId = ticket.resource.toString();
    await Maintenance.findByIdAndDelete(id);

    // Re-check status of resource
    await syncResourceMaintenanceStatus(resourceId);

    await logAudit({
      action: "DELETE_MAINTENANCE",
      entity: "Maintenance",
      entityId: String(id),
      req,
      details: `Deleted maintenance ticket ${ticket.ticketCode}`,
    });

    res.status(200).json({
      success: true,
      message: `Maintenance ticket ${ticket.ticketCode} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};
