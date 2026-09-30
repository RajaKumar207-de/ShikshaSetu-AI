import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import loginRoutes from "./routes/login.routes.js";
import meRoutes from "./routes/me.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import mentorRequestRoutes from "./routes/mentorRequest.routes.js";
import scholarshipRoutes from "./routes/scholarship.routes.js";
import ttsRoutes from "./routes/tts.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/auth", loginRoutes);
app.use("/api/auth", meRoutes);

app.use("/api/ai", aiRoutes);
app.use("/api/ai", ttsRoutes);

app.use("/api/mentors", mentorRequestRoutes);
app.use("/api/scholarships", scholarshipRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ShikshaSetu AI Backend is running 🚀",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} 🚀`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();