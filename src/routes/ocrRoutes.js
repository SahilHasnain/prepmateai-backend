import express from "express";
import { extractTextFromImage } from "../services/ocrService.js";
import { success, error } from "../utils/formatResponse.js";

const router = express.Router();

// POST /api/ocr/extract-text - Extract text from image URL
router.post("/extract-text", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json(error("imageUrl is required", 400));
    }

    const text = await extractTextFromImage(imageUrl);
    res.json(success({ text }));
  } catch (err) {
    console.error("extract-text error:", err.message);
    res.status(500).json(error(err.message));
  }
});

export default router;
