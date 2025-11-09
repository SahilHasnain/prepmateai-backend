import { Client, ID, TablesDB } from "node-appwrite";

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
    console.error("saveStudyPlan error:", error.message);
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
        aiVersion: "gemini-2.0-flash-exp",
      },
    });
    console.log("Flashcards saved:", document.$id);
    return document;
  } catch (error) {
    console.error("saveFlashcards error:", error.message);
    throw error;
  }
};
