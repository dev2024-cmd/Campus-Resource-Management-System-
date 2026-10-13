import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";

// Routes
import authRoutes from "./routes/auth.routes";
import resourceRoutes from "./routes/resource.routes";
import categoryRoutes from "./routes/category.routes";
import locationRoutes from "./routes/location.routes";
import bookingRoutes from "./routes/booking.routes";
import maintenanceRoutes from "./routes/maintenance.routes";
import userRoutes from "./routes/user.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import reportRoutes from "./routes/report.routes";
import auditRoutes from "./routes/audit.routes";

import { errorHandler } from "./middleware/errorHandler";

// Legacy routes for backward compatibility
const legacySystemAdmin = require("../routes/systemAdministrator.route");
const legacyAcademicOfficer = require("../routes/academicOfficer.route");
const legacyLecturer = require("../routes/lecturer.route");
const legacyAssignment = require("../routes/assignment.route");
const legacyResults = require("../routes/result.route");
const legacyStudent = require("../routes/student.route");
const legacyEvent = require("../routes/event.route");
const legacyCourse = require("../routes/course.route");
const legacyCourseModule = require("../routes/courseModule.route");
const legacyAnnouncement = require("../routes/announcement.route");
const legacyNotification = require("../routes/notification.route");
const legacyShedule = require("../routes/shedule.route");
const legacyLectureMaterial = require("../routes/lectureMaterial.route");
const legacyAssignmentSubmit = require("../routes/assignmentSubmit.route");

const app = express();

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // In development, allow all origins (handles null origin from Vite dev server too)
      if (process.env.NODE_ENV === "development") {
        return callback(null, true);
      }
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Request Parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiter for authentication attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts from this IP. Please try again after 15 minutes.",
  },
});

// Primary REST Endpoints
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/audit-logs", auditRoutes);

// Backward-Compatibility Legacy Routes
app.use("/api/administrator", legacySystemAdmin);
app.use("/api/academicOfficer", legacyAcademicOfficer);
app.use("/api/lecturer", legacyLecturer);
app.use("/api/assignment", legacyAssignment);
app.use("/api/results", legacyResults);
app.use("/api/student", legacyStudent);
app.use("/api/event", legacyEvent);
app.use("/api/course", legacyCourse);
app.use("/api/courseModule", legacyCourseModule);
app.use("/api/announcement", legacyAnnouncement);
app.use("/api/notification", legacyNotification);
app.use("/api/shedule", legacyShedule);
app.use("/api/lectureMaterial", legacyLectureMaterial);
app.use("/api/assignmentSubmit", legacyAssignmentSubmit);

// Health Check
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "Campus Resource Management API",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Campus Resource Management System API is running",
    version: "2.0.0",
    docs: "/api/health",
  });
});

// 404 Route handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `API endpoint '${req.originalUrl}' does not exist on this server.`,
  });
});

// Central Error Handler
app.use(errorHandler);

export default app;
