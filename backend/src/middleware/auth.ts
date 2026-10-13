import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser, UserRole } from "../models/User";

export interface AuthRequest extends Request {
  user?: IUser;
}

const JWT_SECRET = process.env.JWT_SECRET || "campus_resource_management_secret_key_2026_super_secure";

export const generateToken = (user: IUser): string => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: `${user.firstName} ${user.lastName}`,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if ((req as any).cookies && (req as any).cookies.token) {
      token = (req as any).cookies.token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication required. Please log in to access this resource.",
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User session is invalid. User account no longer exists.",
      });
      return;
    }

    if (user.status !== "active") {
      res.status(403).json({
        success: false,
        message: "User account is inactive. Please contact the campus administrator.",
      });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
      return;
    }
    res.status(401).json({
      success: false,
      message: "Invalid authentication token.",
    });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    // superadmin has access to everything
    if (req.user.role === "superadmin") {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of the following roles: [${roles.join(", ")}]. Current role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
};
