import mongoose, { Document, Schema, Model } from "mongoose";

export interface ILocation extends Document {
  name: string;
  building: string;
  floor?: string;
  roomNumber?: string;
  capacity?: number;
  type: "Academic" | "Administrative" | "Laboratory" | "Auditorium" | "Outdoor" | "Other";
  notes?: string;
  directions?: string;
  gpsCoordinates?: string;
  mapUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    name: {
      type: String,
      required: [true, "Location name is required"],
      trim: true,
      index: true,
    },
    building: {
      type: String,
      required: [true, "Building name is required"],
      trim: true,
      index: true,
    },
    floor: {
      type: String,
      trim: true,
      default: "Ground",
    },
    roomNumber: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      default: 0,
      min: [0, "Capacity cannot be negative"],
    },
    type: {
      type: String,
      enum: ["Academic", "Administrative", "Laboratory", "Auditorium", "Outdoor", "Other"],
      default: "Academic",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    directions: {
      type: String,
      trim: true,
      default: "",
    },
    gpsCoordinates: {
      type: String,
      trim: true,
      default: "",
    },
    mapUrl: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate rooms in the same building
LocationSchema.index({ building: 1, roomNumber: 1 }, { unique: false });

export const Location: Model<ILocation> =
  mongoose.models.Location || mongoose.model<ILocation>("Location", LocationSchema);
export default Location;
