import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "./.env") });

import express from "express";
import cors from "cors";
import connectDB from "./configs/db.js";
import { inngest, functions } from "./inngest/index.js";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";
import userRouter from "./routes/userRoutes.js";

const PORT = process.env.PORT;
const app = express();

await connectDB();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.use("/api/user", userRouter);

app.get("/", (req, res) => res.send("Server is running"));
app.use("/api/inngest", serve({ client: inngest, functions }));

app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
