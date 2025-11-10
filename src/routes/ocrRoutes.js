import express from "express";
import { extractTextFromImage } from "../services/ocrService.js";
import { success, error } from "../utils/formatResponse.js";
import { logInfo, logError } from "../utils/logger.js";

const router = express.Router();

// POST /api/ocr/extract-text - Extract text from image URL
router.post("/extract-text", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    logInfo(`Received request on /extract-text`);

    if (!imageUrl) {
      return res.status(400).json(error("imageUrl is required", 400));
    }

    const text = await extractTextFromImage(imageUrl);
    logInfo(`Text extracted successfully`);
    res.json(success({ text }));
  } catch (err) {
    logError("OCRRoutes: extract-text failed", err);
    res.status(500).json(error(err.message));
  }
});

export default router;
