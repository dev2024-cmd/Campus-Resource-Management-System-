export type UserRole = "superadmin" | "admin" | "lecturer" | "student" | "staff";

export interface User {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  role: UserRole;
  department?: string;
  phoneNumber?: string;
  status: "active" | "inactive";
  createdAt?: string;
}

export type ResourceStatus = "Available" | "Allocated" | "Maintenance" | "Reserved";
export type ResourceCondition = "Excellent" | "Good" | "Fair" | "Needs Attention";

export interface Resource {
  _id: string;
  resourceCode: string;
  name: string;
  category: string;
  categoryId?: string;
  location?: string;
  locationId?: string;
  building?: string;
  room?: string;
  capacity: number;
  status: ResourceStatus;
  condition: ResourceCondition;
  description?: string;
  features?: string[];
  serialNumber?: string;
  isSameCategory?: boolean;
  fitsCapacity?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  _id: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  resourceCount?: number;
  createdAt?: string;
}

export interface LocationItem {
  _id: string;
  name: string;
  building: string;
  floor?: string;
  roomNumber?: string;
  capacity?: number;
  type: string;
  notes?: string;
  directions?: string;
  gpsCoordinates?: string;
  mapUrl?: string;
  isActive: boolean;
  resourceCount?: number;
  createdAt?: string;
}

export type BookingStatus = "Pending" | "Approved" | "Rejected" | "Cancelled" | "Completed";

export interface Booking {
  _id: string;
  bookingCode: string;
  resource: Resource | string;
  resourceName: string;
  resourceCategory?: string;
  user: User | string;
  userName: string;
  userEmail: string;
  userRole?: string;
  purpose: string;
  department?: string;
  date: string;
  startTime: string;
  endTime: string;
  attendeesCount: number;
  status: BookingStatus;
  priority: "Normal" | "High" | "Urgent";
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  remarks?: string;
  createdAt?: string;
}

export type MaintenancePriority = "Low" | "Medium" | "High" | "Urgent";
export type MaintenanceStatus = "Reported" | "Scheduled" | "In Progress" | "Completed" | "Cancelled";

export interface MaintenanceTicket {
  _id: string;
  ticketCode: string;
  resource: Resource | string;
  resourceName: string;
  resourceCode?: string;
  reportedBy: User | string;
  reporterName: string;
  reporterEmail?: string;
  issueTitle: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assignedTo?: string;
  scheduledDate?: string;
  completedDate?: string;
  estimatedCost?: number;
  actualCost?: number;
  resolutionNotes?: string;
  createdAt?: string;
}

export interface AuditLogItem {
  _id: string;
  action: string;
  entity: string;
  entityId?: string;
  userName: string;
  userRole: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export interface DashboardStats {
  summary: {
    totalResources: number;
    availableResources: number;
    allocatedResources: number;
    maintenanceResources: number;
    reservedResources: number;
    totalBookings: number;
    pendingBookings: number;
    approvedBookings: number;
    activeMaintenance: number;
    totalUsers: number;
    utilizationRate: number;
  };
  charts: {
    categoryDistribution: { name: string; count: number }[];
    statusDistribution: { status: string; count: number }[];
  };
  recentActivity: AuditLogItem[];
  upcomingBookings: Booking[];
  urgentMaintenance: MaintenanceTicket[];
}
