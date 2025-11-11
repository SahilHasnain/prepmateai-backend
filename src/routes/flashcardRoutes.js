import express from "express";
import { Client, TablesDB, Query } from "node-appwrite";
import { success, error } from "../utils/formatResponse.js";
import { logInfo, logError } from "../utils/logger.js";

const router = express.Router();

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const tablesDB = new TablesDB(client);

// GET /api/flashcards/decks/:userId - Fetch all flashcard decks for user
router.get("/decks/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    logInfo(`Fetching flashcard decks for user: ${userId}`);

    const response = await tablesDB.listRows({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_FLASHCARDS_COLLECTION_ID,
      queries: [Query.equal("userId", userId), Query.orderDesc("$createdAt")],
    });

    logInfo(`Found ${response.rows?.length || 0} decks for user: ${userId}`);
    res.json(success(response.rows || []));
  } catch (err) {
    logError("FlashcardRoutes: fetch decks failed", err);
    res.status(500).json(error(err.message));
  }
});

export default router;
