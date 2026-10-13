import mongoose, { Document, Schema, Model } from "mongoose";

export type MaintenancePriority = "Low" | "Medium" | "High" | "Urgent";
export type MaintenanceStatus = "Reported" | "Scheduled" | "In Progress" | "Completed" | "Cancelled";

export interface IMaintenance extends Document {
  ticketCode: string;
  resource: mongoose.Types.ObjectId;
  resourceName: string;
  resourceCode?: string;
  reportedBy: mongoose.Types.ObjectId;
  reporterName: string;
  reporterEmail?: string;
  issueTitle: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assignedTo?: string;
  scheduledDate?: Date;
  completedDate?: Date;
  estimatedCost?: number;
  actualCost?: number;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceSchema = new Schema<IMaintenance>(
  {
    ticketCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    resource: {
      type: Schema.Types.ObjectId,
      ref: "Resource",
      required: [true, "Resource reference is required"],
      index: true,
    },
    resourceName: {
      type: String,
      required: true,
    },
    resourceCode: {
      type: String,
      default: "",
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter reference is required"],
      index: true,
    },
    reporterName: {
      type: String,
      required: true,
    },
    reporterEmail: {
      type: String,
      default: "",
    },
    issueTitle: {
      type: String,
      required: [true, "Issue title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["Reported", "Scheduled", "In Progress", "Completed", "Cancelled"],
      default: "Reported",
      index: true,
    },
    assignedTo: {
      type: String,
      trim: true,
      default: "Unassigned",
    },
    scheduledDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
    estimatedCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    actualCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    resolutionNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const Maintenance: Model<IMaintenance> =
  mongoose.models.Maintenance || mongoose.model<IMaintenance>("Maintenance", MaintenanceSchema);
export default Maintenance;
