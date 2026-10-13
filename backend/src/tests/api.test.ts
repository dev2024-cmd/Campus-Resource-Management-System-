import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app";
import { connectDB, disconnectDB } from "../config/db";
import Resource from "../models/Resource";
import Category from "../models/Category";
import Booking from "../models/Booking";
import User from "../models/User";

let adminToken: string;
let lecturerToken: string;
let studentToken: string;
let testResourceId: string;
let testCategoryId: string;

beforeAll(async () => {
  await connectDB();

  // Login as admin
  const adminRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@campus.edu", password: "Admin@123456" });
  expect(adminRes.status).toBe(200);
  adminToken = adminRes.body.token;

  // Login as lecturer
  const lecturerRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "faculty@campus.edu", password: "Faculty@123456" });
  expect(lecturerRes.status).toBe(200);
  lecturerToken = lecturerRes.body.token;

  // Login as student
  const studentRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "student@campus.edu", password: "Student@123456" });
  expect(studentRes.status).toBe(200);
  studentToken = studentRes.body.token;
});

afterAll(async () => {
  // Clean up any test resources created
  if (testResourceId) {
    await Resource.findByIdAndDelete(testResourceId);
  }
  if (testCategoryId) {
    await Category.findByIdAndDelete(testCategoryId);
  }
  await disconnectDB();
});

describe("1. Authentication & Security API", () => {
  it("should reject login with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@campus.edu", password: "WrongPassword999" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should fetch current authenticated user profile", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("admin@campus.edu");
    expect(res.body.user.role).toBe("admin");
  });

  it("should reject access to protected endpoint without token", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });

  it("should forbid non-admin users from accessing user management", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });
});

describe("2. Resource CRUD Lifecycle", () => {
  it("should list resources with pagination and live counts", async () => {
    const res = await request(app).get("/api/resources?page=1&limit=5");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it("should create a new campus resource", async () => {
    const res = await request(app)
      .post("/api/resources")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        resourceCode: "TEST-9999",
        name: "Automated Test Robotics Bay",
        category: "Engineering Workshop",
        building: "Test Block",
        room: "T-101",
        capacity: 25,
        status: "Available",
        condition: "Excellent",
        description: "Created via automated integration test suite",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.resourceCode).toBe("TEST-9999");
    testResourceId = res.body.data._id;
  });

  it("should prevent duplicate resource code", async () => {
    const res = await request(app)
      .post("/api/resources")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        resourceCode: "TEST-9999",
        name: "Duplicate Code Attempt",
        category: "Engineering Workshop",
      });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("should read single resource by ID", async () => {
    const res = await request(app).get(`/api/resources/${testResourceId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Automated Test Robotics Bay");
  });

  it("should update an existing resource", async () => {
    const res = await request(app)
      .put(`/api/resources/${testResourceId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Updated Robotics Bay Name",
        capacity: 30,
      });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Updated Robotics Bay Name");
    expect(res.body.data.capacity).toBe(30);
  });

  it("should return 404 for non-existent resource ID", async () => {
    const res = await request(app).get("/api/resources/507f1f77bcf86cd799439011");
    expect(res.status).toBe(404);
  });

  it("should delete the test resource", async () => {
    const res = await request(app)
      .delete(`/api/resources/${testResourceId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    testResourceId = ""; // cleared
  });
});

describe("3. Referential Integrity Protection", () => {
  it("should prevent deleting a Category if referenced by active resources", async () => {
    // Get existing 'Auditorium' category which has resources assigned
    const cat = await Category.findOne({ name: "Auditorium" });
    expect(cat).toBeDefined();

    const res = await request(app)
      .delete(`/api/categories/${cat!._id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(409);
    expect(res.body.message).toContain("campus resource(s) are assigned to it");
  });
});

describe("4. Booking Conflict Prevention & Business Rules", () => {
  let createdBookingId: string;

  it("should create an initial booking request", async () => {
    const resource = await Resource.findOne({ resourceCode: "AUD-1001" });
    expect(resource).toBeDefined();

    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${lecturerToken}`)
      .send({
        resource: resource!._id.toString(),
        purpose: "Dean's Inaugural Address",
        date: "2026-11-20",
        startTime: "10:00 AM",
        endTime: "12:00 PM",
        attendeesCount: 200,
        priority: "High",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("Pending");
    createdBookingId = res.body.data._id;
  });

  it("should detect and reject overlapping booking conflict for same resource and time", async () => {
    const resource = await Resource.findOne({ resourceCode: "AUD-1001" });
    expect(resource).toBeDefined();

    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${lecturerToken}`)
      .send({
        resource: resource!._id.toString(),
        purpose: "Conflicting Student Rehearsal",
        date: "2026-11-20",
        startTime: "11:00 AM", // Overlaps with 10:00 AM - 12:00 PM
        endTime: "01:00 PM",
        attendeesCount: 50,
      });
    expect(res.status).toBe(409);
    expect(res.body.message).toContain("Booking Conflict");
  });

  it("should prevent a user from approving their own booking request", async () => {
    // Lecturer attempts to approve their own booking
    const res = await request(app)
      .patch(`/api/bookings/${createdBookingId}/status`)
      .set("Authorization", `Bearer ${lecturerToken}`)
      .send({ status: "Approved" });
    // Forbidden by role (lecturer is not admin) or self-approval rule
    expect([403, 401]).toContain(res.status);
  });

  it("should allow administrator to approve the booking", async () => {
    const res = await request(app)
      .patch(`/api/bookings/${createdBookingId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Approved" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("Approved");
    expect(res.body.data.approvedByName).toBeDefined();

    // Clean up
    await Booking.findByIdAndDelete(createdBookingId);
  });
});

describe("5. Executive Dashboard Aggregation", () => {
  it("should return live MongoDB stats with summaries and charts", async () => {
    const res = await request(app)
      .get("/api/dashboard/stats")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.summary.totalResources).toBeGreaterThan(0);
    expect(res.body.data.summary.availableResources).toBeDefined();
    expect(Array.isArray(res.body.data.charts.categoryDistribution)).toBe(true);
    expect(Array.isArray(res.body.data.recentActivity)).toBe(true);
  });
});
