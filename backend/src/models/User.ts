import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "superadmin" | "admin" | "lecturer" | "student" | "staff";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  department?: string;
  phoneNumber?: string;
  avatar?: string;
  status: "active" | "inactive";
  lastLogin?: Date;
  comparePassword(candidate: string): Promise<boolean>;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false, // Don't return password in queries by default
    },
    role: {
      type: String,
      enum: ["superadmin", "admin", "lecturer", "student", "staff"],
      default: "student",
      index: true,
    },
    department: {
      type: String,
      default: "General",
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

UserSchema.virtual("fullName").get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Pre-save hook to hash password if modified
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
