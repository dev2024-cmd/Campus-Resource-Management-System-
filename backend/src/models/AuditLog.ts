import mongoose, { Document, Schema, Model } from "mongoose";

export interface IAuditLog extends Document {
  action: string;
  entity: string;
  entityId?: string;
  performedBy?: mongoose.Types.ObjectId;
  userName: string;
  userRole: string;
  details: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    entity: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      default: "",
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    userName: {
      type: String,
      default: "System",
    },
    userRole: {
      type: String,
      default: "system",
    },
    details: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      default: "127.0.0.1",
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable log
  }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
export default AuditLog;
