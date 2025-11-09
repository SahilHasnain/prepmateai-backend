// Prompt templates for Gemini API

// Generate study plan prompt for NEET/JEE
export const generateStudyPlanPrompt = (weakTopics, hours) =>
  `Make a structured study plan for NEET/JEE covering these weak topics: ${weakTopics.join(
    ", "
  )} in ${hours} hours. Include topic, time (in mins), and difficulty.
Return as JSON array: [{"topic": "...", "duration": number, "difficulty": "easy/medium/hard"}]`;

// Generate flashcard prompt for NEET/JEE
export const generateFlashcardPrompt = (topic) =>
  `Generate 10 simple flashcards (question + short answer) for topic "${topic}", NEET/JEE level.
Return as JSON: {"topic": "${topic}", "flashcards": [{"question": "...", "answer": "..."}]}`;
