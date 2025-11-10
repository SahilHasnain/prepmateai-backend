import express from "express";
import { success, failure } from "../utils/response.js";
import {
  saveProgress,
  getUserProgressSummary,
} from "../services/appwriteService.js";
import { progressSchema } from "../validators/flashcardValidator.js";
import { logInfo, logError } from "../utils/logger.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

// Feedback to score mapping
const FEEDBACK_SCORES = {
  forgot: 0,
  unsure: 1,
  remembered: 2,
};

// SRS interval mapping (in hours)
const SRS_INTERVALS = {
  0: 2, // forgot -> 2 hours
  1: 12, // unsure -> 12 hours
  2: 48, // remembered -> 48 hours (2 days)
};

// POST /api/progress/update-progress - Update card review progress
router.post("/update-progress", validate(progressSchema), async (req, res, next) => {
  try {
    // Get validated data from middleware
    const { userId, cardId, topic, feedback } = req.validatedData;
    logInfo(`Received request on /update-progress for user: ${userId}`);

    // Map feedback to score
    const score = FEEDBACK_SCORES[feedback];

    // Get SRS interval
    const intervalHours = SRS_INTERVALS[score];

    // Calculate next review time
    const lastReviewed = new Date();
    const nextReview = new Date(
      lastReviewed.getTime() + intervalHours * 60 * 60 * 1000,
    );

    // Save progress to Appwrite
    await saveProgress({
      userId,
      cardId,
      topic,
      score,
      intervalHours,
      nextReview: nextReview.toISOString(),
      lastReviewed: lastReviewed.toISOString(),
    });

    logInfo(`Progress saved successfully for user: ${userId}`);
    
    // Return success response
    res.status(200).json(
      success({
        cardId,
        nextReview: nextReview.toISOString(),
        intervalHours,
      }),
    );
  } catch (err) {
    logError("ProgressRoutes: update-progress failed", err);
    res.status(500).json(failure(err.message));
  }
});

// GET /api/progress/summary/:userId - Get user progress summary
router.get("/summary/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    logInfo(`Received request on /summary for user: ${userId}`);

    if (!userId) {
      return res.status(400).json(failure("userId is required"));
    }

    const summary = await getUserProgressSummary(userId);

    res.status(200).json(
      success({
        nextReview: summary?.nextReview || null,
        topic: summary?.topic || null,
      }),
    );
  } catch (err) {
    logError("ProgressRoutes: summary failed", err);
    res.status(500).json(failure(err.message));
  }
});

export default router;
