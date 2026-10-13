import AuditLog from "../models/AuditLog";
import { AuthRequest } from "../middleware/auth";

export interface LogAuditOptions {
  action: string;
  entity: string;
  entityId?: string;
  req?: AuthRequest;
  details: string;
  metadata?: Record<string, any>;
}

export const logAudit = async (options: LogAuditOptions): Promise<void> => {
  try {
    const { action, entity, entityId = "", req, details, metadata = {} } = options;

    const performedBy = req?.user?._id;
    const userName = req?.user ? `${req.user.firstName} ${req.user.lastName}` : "System";
    const userRole = req?.user ? req.user.role : "system";
    const ipAddress = req?.ip || req?.socket.remoteAddress || "127.0.0.1";

    await AuditLog.create({
      action,
      entity,
      entityId: String(entityId),
      performedBy,
      userName,
      userRole,
      details,
      ipAddress,
      metadata,
    });
  } catch (error: any) {
    console.error("[AuditLog] Failed to record audit log:", error.message);
  }
};
