import express from "express";
import { success, error } from "../utils/formatResponse.js";
import { deleteDeck } from "../services/appwriteService.js";
import { logInfo, logError } from "../utils/logger.js";

const router = express.Router();

// DELETE /api/decks/:deckId - Delete a deck
router.delete("/:deckId", async (req, res) => {
  try {
    const { deckId } = req.params;
    logInfo(`Deleting deck: ${deckId}`);

    if (!deckId) {
      return res.status(400).json(error("deckId is required", 400));
    }

    await deleteDeck(deckId);
    res.json(success({ message: "Deck deleted successfully" }));
  } catch (err) {
    logError("DeleteRoutes: delete deck failed", err);
    res.status(500).json(error(err.message));
  }
});

export default router;
