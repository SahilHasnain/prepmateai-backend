import express from "express";
import { success, failure } from "../utils/response.js";
import {
  getDueFlashcards,
  getLatestFlashcardDeck,
} from "../services/appwriteService.js";
import { logInfo, logError } from "../utils/logger.js";

const router = express.Router();

// GET /api/due/today/:userId - Get due flashcards for review
router.get("/today/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    logInfo(`Received request on /today for user: ${userId}`);

    // Validate userId
    if (!userId) {
      return res.status(400).json(failure("userId is required"));
    }

    // Get due flashcards from progress collection
    let dueCards = await getDueFlashcards(userId, limit);

    // Fallback: if no due cards, get latest generated deck
    if (!dueCards || dueCards.length === 0) {
      const latestDeck = await getLatestFlashcardDeck(userId);

      if (latestDeck) {
        const flashcards = JSON.parse(latestDeck.flashcards);
        dueCards = flashcards.slice(0, limit).map((card, index) => ({
          cardId: `${latestDeck.$id}_${index}`,
          question: card.question,
          answer: card.answer,
          topic: latestDeck.topic,
          nextReview: null,
        }));
      } else {
        dueCards = [];
      }
    }

    logInfo(`Fetched ${dueCards.length} due cards for user: ${userId}`);
    res.json(success(dueCards));
  } catch (err) {
    logError("DueRoutes: today failed", err);
    res.status(500).json(failure(err.message));
  }
});

export default router;
