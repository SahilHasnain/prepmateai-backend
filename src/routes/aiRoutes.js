import express from 'express';
import { generateResponse } from '../services/geminiService.js';
import { extractTextFromImage } from '../services/ocrService.js';
import { success, error } from '../utils/formatResponse.js';

const router = express.Router();

// POST /api/ai/solve-doubt - Solve NEET/JEE questions
router.post('/solve-doubt', async (req, res) => {
  try {
    const { imageUrl, questionText, userId } = req.body;

    // Get question text from OCR if not provided
    let question = questionText;
    if (!question && imageUrl) {
      question = await extractTextFromImage(imageUrl);
    }

    if (!question) {
      return res.status(400).json(error('Either questionText or imageUrl is required', 400));
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
      .split('\n')
      .filter(line => /^\d+\./.test(line.trim()))
      .map(step => step.trim());

    // Detect subject from question keywords
    const subjectKeywords = {
      Physics: ['force', 'velocity', 'energy', 'motion', 'acceleration'],
      Chemistry: ['atom', 'molecule', 'reaction', 'element', 'compound'],
      Biology: ['cell', 'organism', 'DNA', 'protein', 'tissue'],
      Math: ['equation', 'calculate', 'solve', 'integral', 'derivative']
    };

    let subject = 'General';
    for (const [subj, keywords] of Object.entries(subjectKeywords)) {
      if (keywords.some(kw => question.toLowerCase().includes(kw))) {
        subject = subj;
        break;
      }
    }

    // Return structured response
    res.json(success({
      question,
      aiAnswer,
      steps: steps.length > 0 ? steps : [aiAnswer],
      subject
    }));
  } catch (err) {
    console.error('solve-doubt error:', err.message);
    res.status(500).json(error(err.message));
  }
});

export default router;
