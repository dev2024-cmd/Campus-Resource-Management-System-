import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Valid email address is required"),
  password: z.string().min(1, "Password is required"),
});

export const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["superadmin", "admin", "lecturer", "student", "staff"]).default("student"),
  department: z.string().optional(),
  phoneNumber: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["superadmin", "admin", "lecturer", "student", "staff"]).optional(),
  department: z.string().optional(),
  phoneNumber: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters"),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createLocationSchema = z.object({
  name: z.string().min(2, "Location name is required"),
  building: z.string().min(1, "Building name is required"),
  floor: z.string().optional(),
  roomNumber: z.string().optional(),
  capacity: z.number().nonnegative().optional(),
  type: z.enum(["Academic", "Administrative", "Laboratory", "Auditorium", "Outdoor", "Other"]).optional(),
  notes: z.string().optional(),
  directions: z.string().optional(),
  gpsCoordinates: z.string().optional(),
  mapUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateLocationSchema = createLocationSchema.partial();

export const createResourceSchema = z.object({
  resourceCode: z.string().optional(), // Auto-generated if not provided
  name: z.string().min(2, "Resource name must be at least 2 characters"),
  category: z.string().min(1, "Category is required"),
  categoryId: z.string().optional(),
  location: z.string().optional(),
  locationId: z.string().optional(),
  building: z.string().optional(),
  room: z.string().optional(),
  capacity: z.number().int().nonnegative().default(1),
  status: z.enum(["Available", "Allocated", "Maintenance", "Reserved"]).default("Available"),
  condition: z.enum(["Excellent", "Good", "Fair", "Needs Attention"]).default("Excellent"),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  serialNumber: z.string().optional(),
  reservationDate: z.string().optional(),
  reservationTime: z.string().optional(),
});

export const updateResourceSchema = createResourceSchema.partial();

export const createBookingSchema = z.object({
  resource: z.string().min(1, "Please select a campus facility"),
  purpose: z.string().min(3, "Event purpose must be at least 3 characters"),
  date: z.string().min(1, "Reservation date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  department: z.string().optional(),
  attendeesCount: z.coerce.number().int().positive().default(1),
  priority: z
    .preprocess(
      (v) => (typeof v === "string" ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : v),
      z.enum(["Normal", "High", "Urgent"])
    )
    .default("Normal"),
  remarks: z.string().optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(["Pending", "Approved", "Rejected", "Cancelled", "Completed"]),
  rejectionReason: z.string().optional(),
  remarks: z.string().optional(),
});

export const createMaintenanceSchema = z.object({
  resource: z.string().min(1, "Resource ID is required"),
  issueTitle: z.string().min(3, "Issue title is required"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium"),
  assignedTo: z.string().optional(),
  scheduledDate: z.string().optional(),
  estimatedCost: z.number().nonnegative().optional(),
});

export const updateMaintenanceSchema = z.object({
  issueTitle: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
  status: z.enum(["Reported", "Scheduled", "In Progress", "Completed", "Cancelled"]).optional(),
  assignedTo: z.string().optional(),
  scheduledDate: z.string().optional(),
  completedDate: z.string().optional(),
  estimatedCost: z.number().nonnegative().optional(),
  actualCost: z.number().nonnegative().optional(),
  resolutionNotes: z.string().optional(),
});
