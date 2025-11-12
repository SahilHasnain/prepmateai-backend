import express from "express";
import { success, error } from "../utils/formatResponse.js";
import { getUserStats } from "../services/appwriteService.js";
import { logInfo, logError } from "../utils/logger.js";

const router = express.Router();

// GET /api/stats/:userId - Get user statistics
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    logInfo(`Fetching stats for user: ${userId}`);

    if (!userId) {
      return res.status(400).json(error("userId is required", 400));
    }

    const stats = await getUserStats(userId);
    res.json(success(stats));
  } catch (err) {
    logError("StatsRoutes: fetch stats failed", err);
    res.status(500).json(error(err.message));
  }
});

export default router;
