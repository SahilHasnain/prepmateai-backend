import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import aiRoutes from "./routes/aiRoutes.js";
import ocrRoutes from "./routes/ocrRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import dueRoutes from "./routes/dueRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import deleteRoutes from "./routes/deleteRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js";
import habitRoutes from "./routes/habitRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:8081", "exp://*"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/ai", aiRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/due", dueRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/decks", deleteRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/habits", habitRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Test Gemini connection
app.get("/api/test-gemini", async (req, res) => {
  try {
    const { generateResponse } = await import("./services/geminiService.js");
    const response = await generateResponse("Who are you?");
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
