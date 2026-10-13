import mongoose, { Document, Schema, Model } from "mongoose";

export interface ICategory extends Document {
  name: string;
  code: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, "Category code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    icon: {
      type: String,
      default: "Building",
    },
    color: {
      type: String,
      default: "#0284c7", // sky-600
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

export const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);
export default Category;
