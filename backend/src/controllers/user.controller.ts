import { Response, NextFunction } from "express";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";
import { logAudit } from "../services/audit.service";

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query as Record<string, any>;

    const query: any = {};

    if (role && role !== "All" && role.trim() !== "") {
      query.role = role.trim().toLowerCase();
    }

    if (status && status !== "All" && status.trim() !== "") {
      query.status = status.trim();
    }

    if (search && search.trim() !== "") {
      query.$or = [
        { firstName: { $regex: search.trim(), $options: "i" } },
        { lastName: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { department: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = parseInt(String(limit), 10) || 10;
    const skip = limitNum > 0 ? (pageNum - 1) * limitNum : 0;

    const total = await User.countDocuments(query);
    const users = limitNum > 0
      ? await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum)
      : await User.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users,
      count: users.length,
      total,
      totalPages: limitNum > 0 ? Math.ceil(total / limitNum) : 1,
      currentPage: pageNum,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, role } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({
        success: false,
        message: `An account with email '${email}' already exists.`,
      });
      return;
    }

    const user = new User({
      ...req.body,
      email: email.toLowerCase().trim(),
      role: role.toLowerCase().trim(),
    });
    await user.save();

    await logAudit({
      action: "CREATE_USER",
      entity: "User",
      entityId: user._id.toString(),
      req,
      details: `Created new user ${user.email} with role ${user.role}`,
    });

    res.status(201).json({
      success: true,
      message: "User account created successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    if (req.body.email && req.body.email.toLowerCase() !== user.email) {
      const emailInUse = await User.findOne({
        email: req.body.email.toLowerCase().trim(),
        _id: { $ne: id },
      });
      if (emailInUse) {
        res.status(409).json({
          success: false,
          message: `Email '${req.body.email}' is already in use by another user.`,
        });
        return;
      }
      user.email = req.body.email.toLowerCase().trim();
    }

    if (req.body.firstName) user.firstName = req.body.firstName;
    if (req.body.lastName) user.lastName = req.body.lastName;
    if (req.body.role) user.role = req.body.role.toLowerCase().trim();
    if (req.body.department) user.department = req.body.department;
    if (req.body.phoneNumber) user.phoneNumber = req.body.phoneNumber;
    if (req.body.status) user.status = req.body.status;
    if (req.body.password && req.body.password.trim().length >= 6) {
      user.password = req.body.password;
    }

    await user.save();

    await logAudit({
      action: "UPDATE_USER",
      entity: "User",
      entityId: user._id.toString(),
      req,
      details: `Updated user profile for ${user.email}`,
    });

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Protection rule 1: Cannot delete own account
    if (req.user && req.user._id.toString() === id) {
      res.status(400).json({
        success: false,
        message: "You cannot delete your own administrative account while logged in.",
      });
      return;
    }

    // Protection rule 2: Cannot delete the last superadmin
    if (user.role === "superadmin") {
      const superAdminCount = await User.countDocuments({ role: "superadmin" });
      if (superAdminCount <= 1) {
        res.status(400).json({
          success: false,
          message: "Cannot delete the sole Super Administrator account. At least one Super Administrator must exist.",
        });
        return;
      }
    }

    await User.findByIdAndDelete(id);

    await logAudit({
      action: "DELETE_USER",
      entity: "User",
      entityId: String(id),
      req,
      details: `Deleted user ${user.email} (${user.role})`,
    });

    res.status(200).json({
      success: true,
      message: `User account '${user.email}' was deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};
