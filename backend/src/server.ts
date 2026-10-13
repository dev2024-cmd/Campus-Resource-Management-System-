import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB, disconnectDB } from "./config/db";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Campus Resource Management Server running on port ${PORT}`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🛡️  Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`=======================================================`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        console.log("[Server] Closed HTTP server and MongoDB connection. Bye!");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error: any) {
    console.error(`[Server] Failed to initialize: ${error.message}`);
    process.exit(1);
  }
};

startServer();
