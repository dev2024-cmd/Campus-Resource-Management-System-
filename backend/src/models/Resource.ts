import mongoose, { Document, Schema, Model } from "mongoose";

export type ResourceStatus = "Available" | "Allocated" | "Maintenance" | "Reserved";
export type ResourceCondition = "Excellent" | "Good" | "Fair" | "Needs Attention";

export interface IResource extends Document {
  resourceCode: string;
  name: string;
  category: string;
  categoryId?: mongoose.Types.ObjectId;
  location?: string;
  locationId?: mongoose.Types.ObjectId;
  building?: string;
  room?: string;
  capacity: number;
  status: ResourceStatus;
  condition: ResourceCondition;
  description?: string;
  features: string[];
  serialNumber?: string;
  isArchived: boolean;
  // Legacy fields preserved for backward compatibility
  reservationDate?: string;
  reservationTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    resourceCode: {
      type: String,
      required: [true, "Resource code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Resource name is required"],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      index: true,
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      index: true,
    },
    building: {
      type: String,
      trim: true,
      default: "",
    },
    room: {
      type: String,
      trim: true,
      default: "",
    },
    capacity: {
      type: Number,
      default: 1,
      min: [0, "Capacity cannot be negative"],
    },
    status: {
      type: String,
      enum: ["Available", "Allocated", "Maintenance", "Reserved"],
      default: "Available",
      index: true,
    },
    condition: {
      type: String,
      enum: ["Excellent", "Good", "Fair", "Needs Attention"],
      default: "Excellent",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    features: {
      type: [String],
      default: [],
    },
    serialNumber: {
      type: String,
      trim: true,
      default: "",
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    reservationDate: {
      type: String,
      default: "",
    },
    reservationTime: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Full text search index
ResourceSchema.index({ name: "text", resourceCode: "text", description: "text" });

export const Resource: Model<IResource> =
  mongoose.models.Resource || mongoose.model<IResource>("Resource", ResourceSchema);
export default Resource;
