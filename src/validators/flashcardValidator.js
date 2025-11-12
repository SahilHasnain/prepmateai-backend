import { z } from "zod";

// Validation schema for progress update endpoint
export const progressSchema = z.object({
  // User ID - required, non-empty string
  userId: z.string().min(1, "userId is required"),

  // Card ID - required, non-empty string
  cardId: z.string().min(1, "cardId is required"),

  // Topic name - required, non-empty string
  topic: z.string().min(1, "topic is required"),

  // Feedback type - must be one of three values
  feedback: z.enum(["forgot", "unsure", "remembered"], {
    errorMap: () => ({
      message: "feedback must be one of: forgot, unsure, remembered",
    }),
  }),
});
