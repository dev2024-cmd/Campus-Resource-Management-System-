import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../config/db";
import User from "../models/User";
import Category from "../models/Category";
import Location from "../models/Location";
import Resource from "../models/Resource";
import Booking from "../models/Booking";
import Maintenance from "../models/Maintenance";
import AuditLog from "../models/AuditLog";

export const seedDatabase = async () => {
  try {
    console.log("🌱 Starting Campus Resource Management System database seed...");
    await connectDB();

    // 1. Seed Categories
    const categoriesData = [
      { name: "Seminar Hall", code: "SEM-HALL", description: "Mid-sized presentation & seminar halls equipped with AV", color: "#0284c7" },
      { name: "Auditorium", code: "AUD", description: "Large capacity theatre venues for events and convocations", color: "#6366f1" },
      { name: "Computer Lab", code: "COMP-LAB", description: "Computer workstations with high-speed internet & dev tools", color: "#0d9488" },
      { name: "Smart Classroom", code: "SMT-ROOM", description: "Interactive smart boards, hybrid lecture recording gear", color: "#8b5cf6" },
      { name: "Conference Room", code: "CONF-RM", description: "Executive meeting rooms for faculty and department boards", color: "#ea580c" },
      { name: "Science & Research Lab", code: "SCI-LAB", description: "Specialized chemistry, physics and biology laboratories", color: "#16a34a" },
      { name: "Engineering Workshop", code: "ENG-WKSP", description: "Robotics, mechanical and electrical engineering testing bays", color: "#d97706" },
      { name: "Outdoor Sports Complex", code: "SPT-CMPLX", description: "Grounds, stadium courts and athletic facilities", color: "#dc2626" },
    ];

    const categoryMap = new Map();
    for (const cat of categoriesData) {
      let doc = await Category.findOne({ code: cat.code });
      if (!doc) {
        doc = await Category.create(cat);
        console.log(`  + Created Category: ${cat.name}`);
      } else {
        doc = await Category.findOneAndUpdate({ code: cat.code }, cat, { new: true });
      }
      categoryMap.set(cat.name, doc);
    }

    // 2. Seed Locations
    const locationsData = [
      { name: "Block A - Ground Floor Wing", building: "Academic Block A", floor: "Ground", roomNumber: "A-101", capacity: 80, type: "Academic" },
      { name: "Block A - First Floor Lecture Wing", building: "Academic Block A", floor: "1st Floor", roomNumber: "A-201", capacity: 60, type: "Academic" },
      { name: "Science Complex - Lab Block B", building: "Science Complex B", floor: "2nd Floor", roomNumber: "B-204", capacity: 45, type: "Laboratory" },
      { name: "Technology Tower - Level 3 Labs", building: "Technology Building C", floor: "3rd Floor", roomNumber: "C-301", capacity: 70, type: "Laboratory" },
      { name: "Admin Center - Senate Wing", building: "Administration Center", floor: "4th Floor", roomNumber: "ADM-402", capacity: 30, type: "Administrative" },
      { name: "Grand Convocation Auditorium", building: "Campus Center", floor: "Ground", roomNumber: "AUD-MAIN", capacity: 600, type: "Auditorium" },
    ];

    const locationMap = new Map();
    for (const loc of locationsData) {
      let doc = await Location.findOne({ building: loc.building, roomNumber: loc.roomNumber });
      if (!doc) {
        doc = await Location.create(loc);
        console.log(`  + Created Location: ${loc.name} (${loc.building})`);
      } else {
        doc = await Location.findOneAndUpdate({ building: loc.building, roomNumber: loc.roomNumber }, loc, { new: true });
      }
      locationMap.set(loc.name, doc);
    }

    // 3. Seed Default Users
    const usersData = [
      {
        firstName: "Super",
        lastName: "Admin",
        email: "superadmin@campus.edu",
        password: "Admin@123456",
        role: "superadmin",
        department: "Information Technology",
        phoneNumber: "+1-555-0100",
      },
      {
        firstName: "Campus",
        lastName: "Administrator",
        email: "admin@campus.edu",
        password: "Admin@123456",
        role: "admin",
        department: "Facilities & Operations",
        phoneNumber: "+1-555-0101",
      },
      {
        firstName: "Vidusha",
        lastName: "Lakshan",
        email: "vidusha@gmail.com", // Preserved for seamless backwards-compatibility
        password: "Faculty@123456",
        role: "lecturer",
        department: "Computer Science & Engineering",
        phoneNumber: "+1-555-0102",
      },
      {
        firstName: "Prof. Sarah",
        lastName: "Jenkins",
        email: "faculty@campus.edu",
        password: "Faculty@123456",
        role: "lecturer",
        department: "Software Engineering",
        phoneNumber: "+1-555-0103",
      },
      {
        firstName: "Alex",
        lastName: "Taylor",
        email: "student@campus.edu",
        password: "Student@123456",
        role: "student",
        department: "Undergraduate IT",
        phoneNumber: "+1-555-0104",
      },
    ];

    const userMap = new Map();
    for (const u of usersData) {
      let doc = await User.findOne({ email: u.email });
      if (!doc) {
        doc = new User(u);
        await doc.save();
        console.log(`  + Created User: ${u.email} (${u.role})`);
      }
      userMap.set(u.email, doc);
    }

    // 4. Seed Resources
    const resourcesData = [
      {
        resourceCode: "AUD-1001",
        name: "Grand University Auditorium",
        category: "Auditorium",
        categoryId: categoryMap.get("Auditorium")?._id,
        location: "Grand Convocation Auditorium",
        locationId: locationMap.get("Grand Convocation Auditorium")?._id,
        building: "Campus Center",
        room: "AUD-MAIN",
        capacity: 600,
        status: "Available",
        condition: "Excellent",
        description: "Premier auditorium with line-array acoustics, motorized stage lighting, dual 4K laser projection.",
        features: ["Dual 4K Laser Projectors", "Dolby Surround Sound", "Stage Rigging", "Central AC", "Green Rooms"],
        serialNumber: "AUD-CAMPUS-01",
      },
      {
        resourceCode: "SEM-2001",
        name: "Dr. APJ Abdul Kalam Seminar Hall",
        category: "Seminar Hall",
        categoryId: categoryMap.get("Seminar Hall")?._id,
        location: "Block A - Ground Floor Wing",
        locationId: locationMap.get("Block A - Ground Floor Wing")?._id,
        building: "Academic Block A",
        room: "A-101",
        capacity: 150,
        status: "Available",
        condition: "Excellent",
        description: "Tiered seating seminar hall optimized for technical conferences and thesis presentations.",
        features: ["Wireless Microphones", "Podium Touch Screen", "Livestreaming System", "Document Camera"],
        serialNumber: "SEM-HALL-A101",
      },
      {
        resourceCode: "LAB-3001",
        name: "Advanced Cloud & AI Computing Lab",
        category: "Computer Lab",
        categoryId: categoryMap.get("Computer Lab")?._id,
        location: "Technology Tower - Level 3 Labs",
        locationId: locationMap.get("Technology Tower - Level 3 Labs")?._id,
        building: "Technology Building C",
        room: "C-301",
        capacity: 60,
        status: "Allocated",
        condition: "Excellent",
        description: "60 Workstations with NVIDIA RTX 4080 GPUs, 64GB RAM, dual monitors and gigabit fiber ethernet.",
        features: ["60x GPU Workstations", "Gigabit LAN", "Dual Projectors", "Isolated Testing Subnet"],
        serialNumber: "LAB-GPU-C301",
      },
      {
        resourceCode: "CLS-4001",
        name: "Smart Interactive Classroom 201",
        category: "Smart Classroom",
        categoryId: categoryMap.get("Smart Classroom")?._id,
        location: "Block A - First Floor Lecture Wing",
        locationId: locationMap.get("Block A - First Floor Lecture Wing")?._id,
        building: "Academic Block A",
        room: "A-201",
        capacity: 45,
        status: "Available",
        condition: "Good",
        description: "85-inch digital whiteboard interactive display with hybrid lecture capture camera.",
        features: ["85-inch Interactive Display", "Lecture Capture Camera", "Ergonomic Desks"],
        serialNumber: "CLS-SMT-A201",
      },
      {
        resourceCode: "ENG-5001",
        name: "Embedded Systems & Robotics Testing Bay",
        category: "Engineering Workshop",
        categoryId: categoryMap.get("Engineering Workshop")?._id,
        location: "Technology Tower - Level 3 Labs",
        locationId: locationMap.get("Technology Tower - Level 3 Labs")?._id,
        building: "Technology Building C",
        room: "C-305",
        capacity: 35,
        status: "Maintenance",
        condition: "Needs Attention",
        description: "Soldering benches, logic analyzers, digital oscilloscopes, and 3D printing bay.",
        features: ["12x Oscilloscope Benches", "3D Printers", "SMD Rework Stations"],
        serialNumber: "ENG-RBT-C305",
      },
      {
        resourceCode: "CNF-6001",
        name: "Executive Faculty Board Room",
        category: "Conference Room",
        categoryId: categoryMap.get("Conference Room")?._id,
        location: "Admin Center - Senate Wing",
        locationId: locationMap.get("Admin Center - Senate Wing")?._id,
        building: "Administration Center",
        room: "ADM-402",
        capacity: 25,
        status: "Available",
        condition: "Excellent",
        description: "Executive boardroom table with integrated video teleconference mics and PTZ camera.",
        features: ["Cisco Telepresence", "Motorized Cable Well", "Executive Leather Seating"],
        serialNumber: "CNF-SEN-402",
      },
      {
        resourceCode: "SCI-7001",
        name: "Optics & Laser Physics Research Laboratory",
        category: "Science & Research Lab",
        categoryId: categoryMap.get("Science & Research Lab")?._id,
        location: "Science Complex - Lab Block B",
        locationId: locationMap.get("Science Complex - Lab Block B")?._id,
        building: "Science Complex B",
        room: "B-204",
        capacity: 30,
        status: "Available",
        condition: "Good",
        description: "Vibration isolation optical tables with spectrometer and helium-neon lasers.",
        features: ["Vibration Free Tables", "High Precision Spectrometer", "Cleanroom Air Filtration"],
        serialNumber: "SCI-OPT-B204",
      },
    ];

    const resourceMap = new Map();
    for (const res of resourcesData) {
      let doc = await Resource.findOne({ resourceCode: res.resourceCode });
      if (!doc) {
        doc = await Resource.create(res);
        console.log(`  + Created Resource: ${res.name} (${res.resourceCode})`);
      } else {
        doc = await Resource.findOneAndUpdate({ resourceCode: res.resourceCode }, res, { new: true });
      }
      resourceMap.set(res.resourceCode, doc);
    }

    // 5. Seed Bookings
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

    const bookingsData = [
      {
        bookingCode: "BK-2026-0001",
        resource: resourceMap.get("LAB-3001")?._id,
        resourceName: "Advanced Cloud & AI Computing Lab",
        resourceCategory: "Computer Lab",
        user: userMap.get("vidusha@gmail.com")?._id,
        userName: "Vidusha Lakshan",
        userEmail: "vidusha@gmail.com",
        userRole: "lecturer",
        purpose: "Final Year Capstone: Distributed Deep Learning Workshop",
        department: "Computer Science",
        date: today,
        startTime: "09:00 AM",
        endTime: "12:00 PM",
        attendeesCount: 50,
        status: "Approved",
        priority: "High",
        approvedByName: "Campus Administrator",
        approvedAt: new Date(),
        remarks: "GPU quotas allocated for 60 stations.",
      },
      {
        bookingCode: "BK-2026-0002",
        resource: resourceMap.get("SEM-2001")?._id,
        resourceName: "Dr. APJ Abdul Kalam Seminar Hall",
        resourceCategory: "Seminar Hall",
        user: userMap.get("faculty@campus.edu")?._id,
        userName: "Prof. Sarah Jenkins",
        userEmail: "faculty@campus.edu",
        userRole: "lecturer",
        purpose: "Guest Lecture: Future of Quantum Cryptography in Fintech",
        department: "Software Engineering",
        date: tomorrow,
        startTime: "02:00 PM",
        endTime: "04:30 PM",
        attendeesCount: 120,
        status: "Pending",
        priority: "Normal",
        remarks: "Requires wireless microphones and zoom recording link.",
      },
      {
        bookingCode: "BK-2026-0003",
        resource: resourceMap.get("AUD-1001")?._id,
        resourceName: "Grand University Auditorium",
        resourceCategory: "Auditorium",
        user: userMap.get("admin@campus.edu")?._id,
        userName: "Campus Administrator",
        userEmail: "admin@campus.edu",
        userRole: "admin",
        purpose: "Annual Campus Technical Symposium & Project Exhibition 2026",
        department: "Engineering Faculty",
        date: nextWeek,
        startTime: "09:00 AM",
        endTime: "05:00 PM",
        attendeesCount: 500,
        status: "Approved",
        priority: "High",
        approvedByName: "Super Admin",
        approvedAt: new Date(),
        remarks: "Whole-day campus booking. AV team confirmed.",
      },
    ];

    for (const b of bookingsData) {
      if (b.resource && b.user) {
        const exists = await Booking.findOne({ bookingCode: b.bookingCode });
        if (!exists) {
          await Booking.create(b);
          console.log(`  + Created Booking: ${b.bookingCode} for ${b.resourceName}`);
        }
      }
    }

    // 6. Seed Maintenance Tickets
    const maintenanceData = [
      {
        ticketCode: "MNT-2026-0001",
        resource: resourceMap.get("ENG-5001")?._id,
        resourceName: "Embedded Systems & Robotics Testing Bay",
        resourceCode: "ENG-5001",
        reportedBy: userMap.get("faculty@campus.edu")?._id,
        reporterName: "Prof. Sarah Jenkins",
        reporterEmail: "faculty@campus.edu",
        issueTitle: "Oscilloscope station 4 calibration failure and fluctuating power supply",
        description: "Bench station #4 exhibits voltage drift above 15% tolerance. Required for lab practical next week.",
        priority: "High",
        status: "In Progress",
        assignedTo: "Senior Tech David Miller",
        estimatedCost: 350,
      },
      {
        ticketCode: "MNT-2026-0002",
        resource: resourceMap.get("CLS-4001")?._id,
        resourceName: "Smart Interactive Classroom 201",
        resourceCode: "CLS-4001",
        reportedBy: userMap.get("vidusha@gmail.com")?._id,
        reporterName: "Vidusha Lakshan",
        reporterEmail: "vidusha@gmail.com",
        issueTitle: "HDMI wall-plate loose connection",
        description: "Occasional signal drop when projecting high resolution laptops.",
        priority: "Medium",
        status: "Scheduled",
        assignedTo: "Campus AV Support",
        estimatedCost: 80,
      },
    ];

    for (const m of maintenanceData) {
      if (m.resource && m.reportedBy) {
        const exists = await Maintenance.findOne({ ticketCode: m.ticketCode });
        if (!exists) {
          await Maintenance.create(m);
          console.log(`  + Created Maintenance Ticket: ${m.ticketCode} for ${m.resourceName}`);
        }
      }
    }

    // 7. Seed Initial Audit Logs
    const auditLogsData = [
      {
        action: "SYSTEM_INITIALIZE",
        entity: "System",
        entityId: "INIT",
        userName: "System",
        userRole: "system",
        details: "Campus Resource Management System initialized and schema validated.",
      },
      {
        action: "CREATE_RESOURCE",
        entity: "Resource",
        entityId: resourceMap.get("AUD-1001")?._id?.toString() || "",
        userName: "Campus Administrator",
        userRole: "admin",
        details: "Created resource Grand University Auditorium (AUD-1001)",
      },
      {
        action: "APPROVE_BOOKING",
        entity: "Booking",
        entityId: "BK-2026-0001",
        userName: "Campus Administrator",
        userRole: "admin",
        details: "Approved booking BK-2026-0001 for Distributed Deep Learning Workshop",
      },
    ];

    for (const a of auditLogsData) {
      const exists = await AuditLog.findOne({ action: a.action, details: a.details });
      if (!exists) {
        await AuditLog.create(a);
      }
    }

    console.log("✅ Database seeding completed successfully!");
  } catch (error: any) {
    console.error("❌ Database seeding error:", error.message);
    throw error;
  } finally {
    await disconnectDB();
  }
};

// Execute if run directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
