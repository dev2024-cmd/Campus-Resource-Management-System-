import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

const SAFE_CORE_COLLECTIONS = new Set([
  "users",
  "resources",
  "bookings",
  "maintenances",
  "categories",
  "locations",
  "auditlogs",
]);

const UNWANTED_LMS_COLLECTION_PATTERNS = [
  /^course/i,
  /^assignment/i,
  /^lecturematerial/i,
  /^result/i,
];

async function runSafeCleanup() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smart-campus";
  console.log(`Connecting to MongoDB at: ${mongoUri}...`);

  try {
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Unable to obtain database handle from connection.");
    }

    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} total collections in database:`);

    const dropped: string[] = [];
    const preserved: string[] = [];

    for (const col of collections) {
      const name = col.name;
      const lower = name.toLowerCase();

      // Ensure core collections are NEVER dropped
      if (SAFE_CORE_COLLECTIONS.has(lower)) {
        preserved.push(name);
        continue;
      }

      // Check if it matches any unwanted LMS patterns
      const isUnwanted = UNWANTED_LMS_COLLECTION_PATTERNS.some((pattern) => pattern.test(lower));

      if (isUnwanted) {
        console.log(`🗑️  Dropping unwanted collection: '${name}'...`);
        await db.collection(name).drop();
        dropped.push(name);
      } else {
        preserved.push(name);
      }
    }

    console.log("\n================ CLEANUP SUMMARY ================");
    console.log(`✅ Preserved Core Collections (${preserved.length}):`);
    preserved.forEach((c) => console.log(`   - ${c}`));

    console.log(`\n🗑️  Dropped Collections (${dropped.length}):`);
    if (dropped.length === 0) {
      console.log("   (No matching legacy course/assignment collections were present)");
    } else {
      dropped.forEach((c) => console.log(`   - ${c}`));
    }
    console.log("=================================================\n");
  } catch (error) {
    console.error("Cleanup error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
  }
}

runSafeCleanup();
