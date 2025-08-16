import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./configs/db.js";
import { inngest, functions } from "./inngest/index.js";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";
import userRouter from "./routes/userRoutes.js";
import postRouter from "./routes/postRoutes.js";
import storyRouter from "./routes/storyRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import imagekit from "./configs/imageKit.js";

const PORT = process.env.PORT;
const app = express();

await connectDB();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.get("/", (req, res) => res.send("Server is running"));
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/story", storyRouter);
app.use("/api/messages", messageRouter);

// Add this route to your main server file for debugging
app.get("/debug/imagekit", (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || "development",
    hasPublicKey: !!process.env.IMAGEKIT_PUBLIC_KEY,
    hasPrivateKey: !!process.env.IMAGEKIT_PRIVATE_KEY,
    hasUrlEndpoint: !!process.env.IMAGEKIT_URL_ENDPOINT,
    publicKeyLength: process.env.IMAGEKIT_PUBLIC_KEY?.length || 0,
    privateKeyLength: process.env.IMAGEKIT_PRIVATE_KEY?.length || 0,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
      ? process.env.IMAGEKIT_URL_ENDPOINT.substring(0, 30) + "..."
      : "Missing",
    // Don't log actual keys for security
    publicKeyStart:
      process.env.IMAGEKIT_PUBLIC_KEY?.substring(0, 8) || "Missing",
    privateKeyStart:
      process.env.IMAGEKIT_PRIVATE_KEY?.substring(0, 8) || "Missing",
  });
});

// Test ImageKit connection endpoint
app.get("/debug/imagekit-test", async (req, res) => {
  try {
    const result = await imagekit.listFiles({ limit: 1 });
    res.json({
      success: true,
      message: "ImageKit connection successful",
      filesCount: result.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "ImageKit connection failed",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
