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
