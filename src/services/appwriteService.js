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
      (p) => new Date(p.lastReviewed) >= today
    );

    const cardsReviewedToday = todayProgress.length;
    const cardsMasteredToday = todayProgress.filter(
      (p) => p.score === 2
    ).length;

    // Calculate deck progress
    const decksWithProgress = decks.map((deck) => {
      const flashcards = JSON.parse(deck.flashcards || "[]");
      const totalCards = flashcards.length;

      const deckProgress = allProgress.filter((p) => p.topic === deck.topic);
      const masteredCards = deckProgress.filter((p) => p.score === 2).length;

      const lastReviewedCard = deckProgress.sort(
        (a, b) => new Date(b.lastReviewed) - new Date(a.lastReviewed)
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

// ==================== HABIT MANAGEMENT ====================

// Create a new habit
export const createHabit = async ({
  userId,
  title,
  goalType,
  goalValue,
  frequency,
  customDays = [],
  stackCue = "",
  reminderTime = "09:00",
  timezone = "Asia/Kolkata",
  active = true,
}) => {
  try {
    const document = await tablesDB.createRow({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_HABITS_COLLECTION_ID,
      rowId: ID.unique(),
      data: {
        userId,
        title,
        goalType,
        goalValue,
        frequency,
        customDays: JSON.stringify(customDays),
        stackCue,
        reminderTime,
        timezone,
        active,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedAt: null,
        missedYesterday: false,
        createdAt: new Date().toISOString(),
      },
    });
    logInfo("Habit created successfully", { habitId: document.$id });
    return document;
  } catch (error) {
    logError("AppwriteService: createHabit failed", error);
    throw new Error(`Failed to create habit: ${error.message}`);
  }
};

// Get all habits for a user
export const getHabits = async (userId, activeOnly = false) => {
  try {
    const queries = [Query.equal("userId", userId)];
    if (activeOnly) {
      queries.push(Query.equal("active", true));
    }

    const response = await tablesDB.listRows({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_HABITS_COLLECTION_ID,
      queries,
    });

    // Parse customDays JSON for each habit
    const habits = response.rows.map((habit) => ({
      ...habit,
      customDays: habit.customDays ? JSON.parse(habit.customDays) : [],
    }));

    return habits;
  } catch (error) {
    logError("AppwriteService: getHabits failed", error);
    throw new Error(`Failed to fetch habits: ${error.message}`);
  }
};

// Update an existing habit
export const updateHabit = async (habitId, userId, updates) => {
  try {
    // Verify ownership before updating
    const habit = await tablesDB.getRow({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_HABITS_COLLECTION_ID,
      rowId: habitId,
    });

    if (habit.userId !== userId) {
      throw new Error("Unauthorized: Habit does not belong to user");
    }

    // Stringify customDays if provided
    const data = { ...updates };
    if (data.customDays) {
      data.customDays = JSON.stringify(data.customDays);
    }

    const updatedHabit = await tablesDB.updateRow({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_HABITS_COLLECTION_ID,
      rowId: habitId,
      data,
    });

    logInfo("Habit updated successfully", { habitId });
    return {
      ...updatedHabit,
      customDays: updatedHabit.customDays
        ? JSON.parse(updatedHabit.customDays)
        : [],
    };
  } catch (error) {
    logError("AppwriteService: updateHabit failed", error);
    throw new Error(`Failed to update habit: ${error.message}`);
  }
};

// Delete a habit
export const deleteHabit = async (habitId, userId) => {
  try {
    // Verify ownership before deleting
    const habit = await tablesDB.getRow({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_HABITS_COLLECTION_ID,
      rowId: habitId,
    });

    if (habit.userId !== userId) {
      throw new Error("Unauthorized: Habit does not belong to user");
    }

    await tablesDB.deleteRow({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_HABITS_COLLECTION_ID,
      rowId: habitId,
    });

    logInfo("Habit deleted successfully", { habitId });
    return true;
  } catch (error) {
    logError("AppwriteService: deleteHabit failed", error);
    throw new Error(`Failed to delete habit: ${error.message}`);
  }
};

// Record habit check-in (with never-miss-twice logic)
export const checkInHabit = async ({
  userId,
  habitId,
  completed,
  mood,
  timeSpent,
  dailyWin,
  completedAt,
}) => {
  try {
    // Get current habit data
    const habit = await tablesDB.getRow({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_HABITS_COLLECTION_ID,
      rowId: habitId,
    });

    if (habit.userId !== userId) {
      throw new Error("Unauthorized: Habit does not belong to user");
    }

    // Calculate streak updates (never-miss-twice logic)
    const today = new Date(completedAt);
    const lastCompleted = habit.lastCompletedAt
      ? new Date(habit.lastCompletedAt)
      : null;
    let newStreak = habit.currentStreak || 0;
    let missedYesterday = false;

    if (lastCompleted) {
      const daysSinceLastCompletion = Math.floor(
        (today - lastCompleted) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastCompletion === 1) {
        // Completed yesterday, increment streak
        newStreak = completed ? newStreak + 1 : newStreak;
      } else if (daysSinceLastCompletion === 2) {
        // Missed yesterday (never-miss-twice trigger)
        missedYesterday = true;
        newStreak = completed ? 1 : 0; // Reset streak if missed twice
      } else if (daysSinceLastCompletion > 2) {
        // Missed multiple days, reset streak
        newStreak = completed ? 1 : 0;
      }
    } else {
      // First check-in
      newStreak = completed ? 1 : 0;
    }

    // Update habit with new streak data
    const updatedHabit = await tablesDB.updateRow({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_HABITS_COLLECTION_ID,
      rowId: habitId,
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, habit.longestStreak || 0),
        lastCompletedAt: completed ? completedAt : habit.lastCompletedAt,
        missedYesterday,
      },
    });

    // Create check-in record
    const checkInRecord = await tablesDB.createRow({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_HABIT_CHECKINS_COLLECTION_ID,
      rowId: ID.unique(),
      data: {
        userId,
        habitId,
        completed,
        mood: mood || null,
        timeSpent: timeSpent || null,
        dailyWin: dailyWin || null,
        completedAt,
      },
    });

    logInfo("Habit check-in recorded", {
      habitId,
      completed,
      streak: newStreak,
    });

    return {
      checkIn: checkInRecord,
      streak: newStreak,
      missedYesterday,
    };
  } catch (error) {
    logError("AppwriteService: checkInHabit failed", error);
    throw new Error(`Failed to record habit check-in: ${error.message}`);
  }
};

// Get habit statistics
export const getHabitStats = async (userId, habitId) => {
  try {
    // Get habit data
    const habit = await tablesDB.getRow({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_HABITS_COLLECTION_ID,
      rowId: habitId,
    });

    if (habit.userId !== userId) {
      throw new Error("Unauthorized: Habit does not belong to user");
    }

    // Get all check-ins for this habit
    const checkInsResponse = await tablesDB.listRows({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_HABIT_CHECKINS_COLLECTION_ID,
      queries: [
        Query.equal("habitId", habitId),
        Query.orderDesc("completedAt"),
      ],
    });

    const checkIns = checkInsResponse.rows;
    const totalCheckIns = checkIns.length;
    const completedCheckIns = checkIns.filter((c) => c.completed).length;
    const completionRate =
      totalCheckIns > 0
        ? Math.round((completedCheckIns / totalCheckIns) * 100)
        : 0;

    // Get last 7 days of check-ins
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCheckIns = checkIns.filter(
      (c) => new Date(c.completedAt) >= sevenDaysAgo
    );

    return {
      currentStreak: habit.currentStreak || 0,
      longestStreak: habit.longestStreak || 0,
      totalCheckIns,
      completedCheckIns,
      completionRate,
      last7Days: recentCheckIns,
      missedYesterday: habit.missedYesterday || false,
    };
  } catch (error) {
    logError("AppwriteService: getHabitStats failed", error);
    throw new Error(`Failed to fetch habit stats: ${error.message}`);
  }
};
