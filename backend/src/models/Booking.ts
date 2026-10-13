import mongoose, { Document, Schema, Model } from "mongoose";

export type BookingStatus = "Pending" | "Approved" | "Rejected" | "Cancelled" | "Completed";

export interface IBooking extends Document {
  bookingCode: string;
  resource: mongoose.Types.ObjectId;
  resourceName: string;
  resourceCategory?: string;
  user: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  userRole?: string;
  purpose: string;
  department?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "09:00" or "08:30 AM"
  endTime: string; // e.g. "11:00" or "10:30 AM"
  attendeesCount: number;
  status: BookingStatus;
  priority: "Normal" | "High" | "Urgent";
  approvedBy?: mongoose.Types.ObjectId;
  approvedByName?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingCode: {
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
    resourceCategory: {
      type: String,
      default: "",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      default: "lecturer",
    },
    purpose: {
      type: String,
      required: [true, "Purpose of reservation is required"],
      trim: true,
    },
    department: {
      type: String,
      default: "General",
    },
    date: {
      type: String,
      required: [true, "Date is required"],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
    },
    attendeesCount: {
      type: Number,
      default: 1,
      min: [1, "Attendees count must be at least 1"],
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled", "Completed"],
      default: "Pending",
      index: true,
    },
    priority: {
      type: String,
      enum: ["Normal", "High", "Urgent"],
      default: "Normal",
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedByName: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast conflict checking on same resource and date
BookingSchema.index({ resource: 1, date: 1, status: 1 });

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);
export default Booking;
