import express from "express";
import { success, failure } from "../utils/response.js";
import { getUserStats } from "../services/appwriteService.js";
import { logInfo, logError } from "../utils/logger.js";

const router = express.Router();

// GET /api/stats/:userId - Get user statistics
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    logInfo(`Fetching stats for user: ${userId}`);

    if (!userId) {
      return res.status(400).json(failure("userId is required"));
    }

    const stats = await getUserStats(userId);
    res.json(success(stats));
  } catch (err) {
    logError("StatsRoutes: fetch stats failed", err);
    res.status(500).json(failure(err.message));
  }
});

export default router;
