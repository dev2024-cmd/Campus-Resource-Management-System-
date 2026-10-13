import { Response, NextFunction } from "express";
import AuditLog from "../models/AuditLog";
import { AuthRequest } from "../middleware/auth";

export const getAuditLogs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { entity, action, page = 1, limit = 20 } = req.query as Record<string, any>;

    const query: any = {};

    if (entity && entity !== "All" && entity.trim() !== "") {
      query.entity = entity.trim();
    }

    if (action && action !== "All" && action.trim() !== "") {
      query.action = action.trim();
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = parseInt(String(limit), 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: logs,
      count: logs.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    next(error);
  }
};
