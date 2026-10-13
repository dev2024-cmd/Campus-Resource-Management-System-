const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.warn("⚠️ Please check your MONGO_URI in .env (provide a valid MongoDB Atlas connection string or local MongoDB URI).");
  }
};

module.exports = connectDB;
