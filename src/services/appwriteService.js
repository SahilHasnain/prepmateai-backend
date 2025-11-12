import { Client, ID, TablesDB, Query } from "node-appwrite";
import { logError } from "../utils/logger.js";

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const tablesDB = new TablesDB(client);

// Save AI-generated study plan
export const saveStudyPlan = async ({
  userId,
  weakTopics,
  availableHours,
  planData,
}) => {
  try {
    const document = await tablesDB.createRow({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_PLANS_COLLECTION_ID,
      rowId: ID.unique(),
      data: {
        userId,
        topics: weakTopics,
        planData: JSON.stringify(planData),
        availableHours,
        aiVersion: "gemini-2.0-flash-exp",
      },
    });
    console.log("Study plan saved:", document.$id);
    return document;
  } catch (error) {
    logError("AppwriteService: saveStudyPlan failed", error);
    throw error;
  }
};

// Save generated flashcards
export const saveFlashcards = async ({ userId, topic, flashcards }) => {
  try {
    const document = await tablesDB.createRow({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_FLASHCARDS_COLLECTION_ID,
      rowId: ID.unique(),
      data: {
        userId,
        topic,
        flashcards: JSON.stringify(flashcards),
        aiVersion: "gemini-2.5-flash",
      },
    });
    console.log("Flashcards saved:", document.$id);
    return document;
  } catch (error) {
    logError("AppwriteService: saveFlashcards failed", error);
    throw error;
  }
};

// Save card review progress with SRS scheduling (upsert by userId+cardId)
export const saveProgress = async ({
  userId,
  cardId,
  topic,
  score,
  intervalHours,
  nextReview,
  lastReviewed,
}) => {
  try {
    // Check if progress exists
    const existing = await tablesDB.listRows({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_FLASHCARDS_PROGRESS_COLLECTION_ID,
      queries: [
        Query.equal("userId", userId),
        Query.equal("cardId", cardId),
        Query.limit(1),
      ],
    });

    const data = {
      userId,
      cardId,
      topic,
      score,
      intervalHours,
      nextReview,
      lastReviewed,
    };

    // Update if exists, create if not
    if (existing.rows && existing.rows.length > 0) {
      const document = await tablesDB.updateRow({
        databaseId: process.env.APPWRITE_DATABASE_ID,
        tableId: process.env.APPWRITE_FLASHCARDS_PROGRESS_COLLECTION_ID,
        rowId: existing.rows[0].$id,
        data,
      });
      console.log("Progress updated:", document.$id);
      return document;
    } else {
      const document = await tablesDB.createRow({
        databaseId: process.env.APPWRITE_DATABASE_ID,
        tableId: process.env.APPWRITE_FLASHCARDS_PROGRESS_COLLECTION_ID,
        rowId: ID.unique(),
        data,
      });
      console.log("Progress created:", document.$id);
      return document;
    }
  } catch (error) {
    logError("AppwriteService: saveProgress failed", error);
    throw new Error(`Failed to save progress: ${error.message}`);
  }
};

// Get due flashcards for review (where nextReview <= now)
export const getDueFlashcards = async (userId, limit = 20) => {
  try {
    const now = new Date().toISOString();

    const response = await tablesDB.listRows({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_FLASHCARDS_PROGRESS_COLLECTION_ID,
      queries: [
        Query.equal("userId", userId),
        Query.lessThanEqual("nextReview", now),
        Query.limit(limit),
      ],
    });

    return response.rows || [];
  } catch (error) {
    logError("AppwriteService: getDueFlashcards failed", error);
    throw new Error(`Failed to fetch due flashcards: ${error.message}`);
  }
};

// Get latest flashcard deck for user
export const getLatestFlashcardDeck = async (userId) => {
  try {
    const response = await tablesDB.listRows({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_FLASHCARDS_COLLECTION_ID,
      queries: [
        Query.equal("userId", userId),
        Query.orderDesc("$createdAt"),
        Query.limit(1),
      ],
    });

    return response.rows?.[0] || null;
  } catch (error) {
    logError("AppwriteService: getLatestFlashcardDeck failed", error);
    throw new Error(`Failed to fetch latest deck: ${error.message}`);
  }
};

// Save or update user reminder settings
export const saveReminder = async ({ userId, pushToken, timeOfDay }) => {
  try {
    // Check if reminder exists
    const existing = await tablesDB.listRows({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_REMINDERS_COLLECTION_ID,
      queries: [Query.equal("userId", userId), Query.limit(1)],
    });

    const data = { userId, pushToken, timeOfDay };

    // Update if exists, create if not
    if (existing.rows && existing.rows.length > 0) {
      const document = await tablesDB.updateRow({
        databaseId: process.env.APPWRITE_DATABASE_ID,
        tableId: process.env.APPWRITE_REMINDERS_COLLECTION_ID,
        rowId: existing.rows[0].$id,
        data,
      });
      console.log("Reminder updated:", document.$id);
      return document;
    } else {
      const document = await tablesDB.createRow({
        databaseId: process.env.APPWRITE_DATABASE_ID,
        tableId: process.env.APPWRITE_REMINDERS_COLLECTION_ID,
        rowId: ID.unique(),
        data,
      });
      console.log("Reminder created:", document.$id);
      return document;
    }
  } catch (error) {
    logError("AppwriteService: saveReminder failed", error);
    throw new Error(`Failed to save reminder: ${error.message}`);
  }
};

// Get user reminder settings
export const getUserReminder = async (userId) => {
  try {
    const response = await tablesDB.listRows({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_REMINDERS_COLLECTION_ID,
      queries: [Query.equal("userId", userId), Query.limit(1)],
    });

    return response.rows?.[0] || null;
  } catch (error) {
    logError("AppwriteService: getUserReminder failed", error);
    throw new Error(`Failed to fetch user reminder: ${error.message}`);
  }
};

// Get user progress summary (next review time)
export const getUserProgressSummary = async (userId) => {
  try {
    const now = new Date().toISOString();

    // Get next upcoming review
    const response = await tablesDB.listRows({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_FLASHCARDS_PROGRESS_COLLECTION_ID,
      queries: [
        Query.equal("userId", userId),
        Query.greaterThan("nextReview", now),
        Query.orderAsc("nextReview"),
        Query.limit(1),
      ],
    });

    return response.rows?.[0] || null;
  } catch (error) {
    logError("AppwriteService: getUserProgressSummary failed", error);
    throw new Error(`Failed to fetch progress summary: ${error.message}`);
  }
};

// Get card progress for SRS calculation
export const getCardProgress = async (userId, cardId) => {
  try {
    const response = await tablesDB.listRows({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_FLASHCARDS_PROGRESS_COLLECTION_ID,
      queries: [
        Query.equal("userId", userId),
        Query.equal("cardId", cardId),
        Query.limit(1),
      ],
    });

    return response.rows?.[0] || null;
  } catch (error) {
    logError("AppwriteService: getCardProgress failed", error);
    return null; // Return null on error to use base interval
  }
};

// Delete deck
export const deleteDeck = async (deckId) => {
  try {
    await tablesDB.deleteRow({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_FLASHCARDS_COLLECTION_ID,
      rowId: deckId,
    });
    console.log("Deck deleted:", deckId);
    return true;
  } catch (error) {
    logError("AppwriteService: deleteDeck failed", error);
    throw new Error(`Failed to delete deck: ${error.message}`);
  }
};

// Get user statistics
export const getUserStats = async (userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Get all decks
    const decksResponse = await tablesDB.listRows({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_FLASHCARDS_COLLECTION_ID,
      queries: [Query.equal("userId", userId)],
    });

    const decks = decksResponse.rows || [];

    // Get all progress
    const progressResponse = await tablesDB.listRows({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_FLASHCARDS_PROGRESS_COLLECTION_ID,
      queries: [Query.equal("userId", userId)],
    });

    const allProgress = progressResponse.rows || [];

    // Calculate today's stats
    const todayProgress = allProgress.filter(
      (p) => new Date(p.lastReviewed) >= today,
    );

    const cardsReviewedToday = todayProgress.length;
    const cardsMasteredToday = todayProgress.filter(
      (p) => p.score === 2,
    ).length;

    // Calculate deck progress
    const decksWithProgress = decks.map((deck) => {
      const flashcards = JSON.parse(deck.flashcards || "[]");
      const totalCards = flashcards.length;

      const deckProgress = allProgress.filter((p) => p.topic === deck.topic);
      const masteredCards = deckProgress.filter((p) => p.score === 2).length;

      const lastReviewedCard = deckProgress.sort(
        (a, b) => new Date(b.lastReviewed) - new Date(a.lastReviewed),
      )[0];

      return {
        deckId: deck.$id,
        topic: deck.topic,
        totalCards,
        masteredCards,
        progress: totalCards > 0 ? masteredCards / totalCards : 0,
        lastReviewed: lastReviewedCard?.lastReviewed || null,
      };
    });

    return {
      totalDecks: decks.length,
      cardsReviewedToday,
      cardsMasteredToday,
      decksWithProgress,
    };
  } catch (error) {
    logError("AppwriteService: getUserStats failed", error);
    throw new Error(`Failed to fetch user stats: ${error.message}`);
  }
};
