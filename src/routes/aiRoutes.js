import express from "express";
import { generateResponse } from "../services/geminiService.js";
import { extractTextFromImage } from "../services/ocrService.js";
import { success, error } from "../utils/formatResponse.js";
import {
  generateStudyPlanPrompt,
  generateFlashcardPrompt,
} from "../utils/promptTemplates.js";
import { saveStudyPlan, saveFlashcards } from "../services/appwriteService.js";

const router = express.Router();

// POST /api/ai/solve-doubt - Solve NEET/JEE questions
router.post("/solve-doubt", async (req, res) => {
  try {
    const { imageUrl, questionText, userId } = req.body;

    // Get question text from OCR if not provided
    let question = questionText;
    if (!question && imageUrl) {
      question = await extractTextFromImage(imageUrl);
    }

    if (!question) {
      return res
        .status(400)
        .json(error("Either questionText or imageUrl is required", 400));
    }

    // Generate AI response with custom prompt
    const prompt = `Explain this NEET/JEE question in simple Roman Urdu, step-by-step, like a tutor.

Question: ${question}

Provide:
1. A clear explanation
2. Step-by-step solution
3. Subject classification (Physics/Chemistry/Biology/Math)`;

    const aiAnswer = await generateResponse(prompt);

    // Parse steps from AI response (split by numbered lines)
    const steps = aiAnswer
      .split("\n")
      .filter((line) => /^\d+\./.test(line.trim()))
      .map((step) => step.trim());

    // Detect subject from question keywords
    const subjectKeywords = {
      Physics: ["force", "velocity", "energy", "motion", "acceleration"],
      Chemistry: ["atom", "molecule", "reaction", "element", "compound"],
      Biology: ["cell", "organism", "DNA", "protein", "tissue"],
      Math: ["equation", "calculate", "solve", "integral", "derivative"],
    };

    let subject = "General";
    for (const [subj, keywords] of Object.entries(subjectKeywords)) {
      if (keywords.some((kw) => question.toLowerCase().includes(kw))) {
        subject = subj;
        break;
      }
    }

    // Return structured response
    res.json(
      success({
        question,
        aiAnswer,
        steps: steps.length > 0 ? steps : [aiAnswer],
        subject,
      })
    );
  } catch (err) {
    console.error("solve-doubt error:", err.message);
    res.status(500).json(error(err.message));
  }
});

// POST /api/ai/generate-plan - Generate personalized study plan
router.post("/generate-plan", async (req, res) => {
  try {
    const { userId, weakTopics, availableHours } = req.body;

    // Validate inputs
    if (!userId || !weakTopics || !availableHours) {
      return res
        .status(400)
        .json(
          error("userId, weakTopics, and availableHours are required", 400)
        );
    }

    if (!Array.isArray(weakTopics) || weakTopics.length === 0) {
      return res
        .status(400)
        .json(error("weakTopics must be a non-empty array", 400));
    }

    if (typeof availableHours !== "number" || availableHours <= 0) {
      return res
        .status(400)
        .json(error("availableHours must be a positive number", 400));
    }

    // Build prompt for Gemini
    const prompt = generateStudyPlanPrompt(weakTopics, availableHours);

    // Call Gemini API
    const aiResponse = await generateResponse(prompt);

    // Parse AI output to JSON
    let studyPlan;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = aiResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
      studyPlan = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiResponse);
    } catch (parseError) {
      // Fallback: create basic plan if parsing fails
      const hoursPerTopic = Math.floor(
        (availableHours * 60) / weakTopics.length
      );
      studyPlan = weakTopics.map((topic) => ({
        topic,
        duration: hoursPerTopic,
        difficulty: "medium",
      }));
    }

    // Save to Appwrite
    await saveStudyPlan({ userId, weakTopics, availableHours, planData: studyPlan });
    console.log("✅ Saved to Appwrite for user:", userId);

    // Return response
    res.json(success(studyPlan));
  } catch (err) {
    console.error("generate-plan error:", err.message);
    res.status(500).json(error(err.message));
  }
});

// POST /api/ai/generate-flashcards - Generate flashcards for a topic
router.post("/generate-flashcards", async (req, res) => {
  try {
    const { topic, userId } = req.body;

    // Validate input
    if (!topic) {
      return res.status(400).json(error("topic is required", 400));
    }

    // Create prompt for Gemini
    const prompt = generateFlashcardPrompt(topic);

    // Call Gemini API
    const aiResponse = await generateResponse(prompt);

    // Parse and return
    let flashcardsData;
    try {
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{\s*"topic"[\s\S]*\}/);
      flashcardsData = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : JSON.parse(aiResponse);
    } catch (parseError) {
      // Fallback: return raw response
      flashcardsData = {
        topic,
        flashcards: [
          {
            question: "Unable to parse flashcards",
            answer: aiResponse,
          },
        ],
      };
    }

    // Save to Appwrite
    if (userId) {
      await saveFlashcards({ userId, topic, flashcards: flashcardsData.flashcards });
      console.log("✅ Saved to Appwrite for user:", userId);
    }

    res.json(success(flashcardsData));
  } catch (err) {
    console.error("generate-flashcards error:", err.message);
    res.status(500).json(error(err.message));
  }
});

export default router;
