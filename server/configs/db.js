import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("Database Connected Successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("Database Connection Error: ", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("Database Disconnected");
    });

    await mongoose.connect(process.env.MONGODB_URL);
  } catch (error) {
    console.error("Failed to connect to database:", error.message);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
