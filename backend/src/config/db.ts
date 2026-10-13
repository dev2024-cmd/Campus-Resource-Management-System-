import mongoose from "mongoose";

export const connectDB = async (customUri?: string): Promise<typeof mongoose> => {
  const uri = customUri || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smart-campus";
  try {
    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error: any) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log("[MongoDB] Disconnected successfully.");
  } catch (error: any) {
    console.error(`[MongoDB] Disconnection error: ${error.message}`);
  }
};
