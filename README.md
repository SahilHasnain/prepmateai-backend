# PrepMateAI Backend

Clean Node.js backend for AI education app with Gemini API and OCR.

## Tech Stack

- **Express.js** - Web framework
- **Gemini AI** - Google's generative AI (gemini-2.0-flash-exp)
- **Tesseract.js** - OCR text extraction
- **node-fetch** - HTTP client
- **Morgan** - Request logging
- **CORS** - Cross-origin support

## Project Structure

```
/src
├── routes/          # API endpoints
│   ├── aiRoutes.js
│   ├── ocrRoutes.js
├── services/        # Business logic
│   ├── geminiService.js
│   ├── ocrService.js
├── utils/           # Helpers
│   └── formatResponse.js
├── app.js           # Express config
└── server.js        # Entry point
```

## Setup

```bash
npm install
```

Add your Gemini API key in `.env`:
```
PORT=5000
GEMINI_API_KEY=your_key_here
```

## Run

```bash
npm run dev    # Development with auto-reload
npm start      # Production
```

## API Endpoints

### AI Routes
- `POST /api/ai/solve-doubt` - Solve NEET/JEE questions
  ```json
  { 
    "questionText": "Explain photosynthesis",
    "imageUrl": "https://example.com/image.jpg",
    "userId": "123"
  }
  ```

### OCR Routes
- `POST /api/ocr/extract-text` - Extract text from image
  ```json
  { "imageUrl": "https://example.com/image.jpg" }
  ```

### Health
- `GET /api/health` - Server status
- `GET /api/test-gemini` - Test Gemini connection

## Frontend Repository

Frontend App: [prepmateai](https://github.com/<yourname>/prepmateai)
