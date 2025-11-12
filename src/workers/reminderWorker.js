import "dotenv/config";
import { Client, TablesDB, Query } from "node-appwrite";
import { getDueFlashcards } from "../services/appwriteService.js";
import { logInfo, logError } from "../utils/logger.js";

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const tablesDB = new TablesDB(client);

// Send push notification via Expo Push API
const sendPushNotification = async (pushToken, message, dueCount) => {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        to: pushToken,
        sound: "default",
        title: "PrepMate Reminder 🔔",
        body: message,
        data: { dueCount },
      }),
    });

    const result = await response.json();

    if (result.data?.status === "error") {
      throw new Error(result.data.message);
    }

    logInfo(`Notification sent to ${pushToken}`);
    return result;
  } catch (error) {
    logError(`Failed to send notification to ${pushToken}`, error);
    throw error;
  }
};

// Get all enabled reminders
const getEnabledReminders = async () => {
  try {
    const response = await tablesDB.listRows({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_REMINDERS_COLLECTION_ID,
      queries: [Query.equal("enabled", true), Query.limit(100)],
    });

    return response.rows || [];
  } catch (error) {
    logError("Failed to fetch reminders", error);
    throw error;
  }
};

// Main reminder worker function
export const runReminders = async () => {
  logInfo("Starting reminder worker...");

  try {
    // Get all enabled reminders
    const reminders = await getEnabledReminders();
    logInfo(`Found ${reminders.length} enabled reminders`);

    if (reminders.length === 0) {
      logInfo("No reminders to process");
      return;
    }

    let successCount = 0;
    let failCount = 0;

    // Process each reminder with rate limiting
    for (const reminder of reminders) {
      try {
        // Get due flashcards for user
        const dueCards = await getDueFlashcards(reminder.userId, 20);

        if (dueCards.length > 0) {
          const message = `You have ${dueCards.length} flashcard${dueCards.length > 1 ? "s" : ""} due today. Open app to revise!`;

          // Send push notification
          await sendPushNotification(
            reminder.pushToken,
            message,
            dueCards.length,
          );
          successCount++;

          // Rate limiting: wait 100ms between notifications
          await new Promise((resolve) => setTimeout(resolve, 100));
        } else {
          logInfo(`No due cards for user ${reminder.userId}`);
        }
      } catch (error) {
        logError(
          `Failed to process reminder for user ${reminder.userId}`,
          error,
        );
        failCount++;
      }
    }

    logInfo(
      `Reminder worker completed: ${successCount} sent, ${failCount} failed`,
    );
  } catch (error) {
    logError("Reminder worker failed", error);
    throw error;
  }
};

// Run immediately if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runReminders()
    .then(() => {
      logInfo("Worker finished successfully");
      process.exit(0);
    })
    .catch((error) => {
      logError("Worker failed", error);
      process.exit(1);
    });
}
