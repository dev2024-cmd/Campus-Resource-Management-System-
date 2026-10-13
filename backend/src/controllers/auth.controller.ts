import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import { generateToken, AuthRequest } from "../middleware/auth";
import { logAudit } from "../services/audit.service";

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    if (user.status !== "active") {
      res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact an administrator.",
      });
      return;
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    // Audit log
    await logAudit({
      action: "USER_LOGIN",
      entity: "User",
      entityId: user._id.toString(),
      req: { ...req, user } as any,
      details: `User ${user.email} logged in successfully`,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        _id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        fullName: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department,
        phoneNumber: req.user.phoneNumber,
        status: req.user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user) {
      await logAudit({
        action: "USER_LOGOUT",
        entity: "User",
        entityId: req.user._id.toString(),
        req,
        details: `User ${req.user.email} logged out`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};
