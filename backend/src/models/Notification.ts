import mongoose, { Document, Schema, Model } from "mongoose";

export interface INotification extends Document {
  title: string;
  message: string;
  type: "reminder" | "booking" | "event" | "maintenance" | "system";
  referenceId?: string; // unique identifier (e.g. reminder-concluded-<id>) to prevent duplicates
  resourceId?: string;
  resourceName?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  userId?: mongoose.Types.ObjectId;
  userEmail?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["reminder", "booking", "event", "maintenance", "system"],
      default: "reminder",
      index: true,
    },
    referenceId: {
      type: String,
      index: true,
    },
    resourceId: {
      type: String,
      default: "",
    },
    resourceName: {
      type: String,
      default: "",
    },
    scheduledDate: {
      type: String,
      default: "",
    },
    scheduledTime: {
      type: String,
      default: "",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    userEmail: {
      type: String,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
