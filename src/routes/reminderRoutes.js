import express from "express";
import { success, failure } from "../utils/response.js";
import { saveReminder, getUserReminder } from "../services/appwriteService.js";
import { logInfo, logError } from "../utils/logger.js";

const router = express.Router();

// POST /api/reminders/set - Set daily reminder
router.post("/set", async (req, res) => {
  try {
    const { userId, pushToken, timeOfDay, enabled } = req.body;
    logInfo(`Setting reminder for user: ${userId}`);

    if (!userId || !pushToken || !timeOfDay) {
      return res.status(400).json(failure("userId, pushToken, and timeOfDay are required"));
    }

    await saveReminder({ userId, pushToken, timeOfDay, enabled });
    res.json(success({ message: "Reminder set successfully" }));
  } catch (err) {
    logError("ReminderRoutes: set reminder failed", err);
    res.status(500).json(failure(err.message));
  }
});

// GET /api/reminders/:userId - Get user reminder
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    logInfo(`Fetching reminder for user: ${userId}`);

    if (!userId) {
      return res.status(400).json(failure("userId is required"));
    }

    const reminder = await getUserReminder(userId);
    res.json(success(reminder));
  } catch (err) {
    logError("ReminderRoutes: fetch reminder failed", err);
    res.status(500).json(failure(err.message));
  }
});

export default router;
