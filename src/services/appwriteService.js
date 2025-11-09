import { Client, Databases, ID } from 'node-appwrite';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Save AI-generated study plan
export const saveStudyPlan = async (userId, planData) => {
  try {
    const document = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_PLANS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        planData: JSON.stringify(planData),
        createdAt: new Date().toISOString()
      }
    );
    console.log('Study plan saved:', document.$id);
    return document;
  } catch (error) {
    console.error('saveStudyPlan error:', error.message);
    throw error;
  }
};

// Save generated flashcards
export const saveFlashcards = async (userId, topic, flashcards) => {
  try {
    const document = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_FLASHCARDS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        topic,
        flashcards: JSON.stringify(flashcards),
        createdAt: new Date().toISOString()
      }
    );
    console.log('Flashcards saved:', document.$id);
    return document;
  } catch (error) {
    console.error('saveFlashcards error:', error.message);
    throw error;
  }
};
