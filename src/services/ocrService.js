import Tesseract from 'tesseract.js';

// Extract text from image URL with preprocessing
export const extractTextFromImage = async (imageUrl) => {
  try {
    const { data: { text } } = await Tesseract.recognize(
      imageUrl,
      'eng',
      {
        logger: (m) => console.log(m), // Log OCR progress
      }
    );
    
    // Return clean text (trimmed)
    return text.trim();
  } catch (error) {
    console.error('OCR extraction error:', error.message);
    throw new Error('Failed to extract text from image');
  }
};

// Extract text from image buffer (for file uploads)
export const extractText = async (imageBuffer) => {
  try {
    const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng');
    return text.trim();
  } catch (error) {
    console.error('OCR buffer extraction error:', error.message);
    throw new Error('Failed to extract text from image');
  }
};
