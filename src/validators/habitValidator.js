import { z } from "zod";

// Validation schema for creating a habit
export const createHabitSchema = z.object({
  // User ID - required, non-empty string
  userId: z.string().min(1, "userId is required"),

  // Habit title - required, 1-100 characters
  title: z
    .string()
    .min(1, "title is required")
    .max(100, "title must be 100 characters or less"),

  // Micro-goal type - cards per day or minutes per day
  goalType: z.enum(["cards", "minutes"], {
    errorMap: () => ({
      message: "goalType must be either 'cards' or 'minutes'",
    }),
  }),

  // Goal value - positive integer (e.g., 1 card, 2 minutes)
  goalValue: z
    .number()
    .int("goalValue must be an integer")
    .positive("goalValue must be positive")
    .max(1000, "goalValue must be 1000 or less"),

  // Frequency - how often to repeat
  frequency: z.enum(["daily", "weekdays", "weekends", "custom"], {
    errorMap: () => ({
      message: "frequency must be one of: daily, weekdays, weekends, custom",
    }),
  }),

  // Custom days (only required if frequency is 'custom')
  customDays: z
    .array(
      z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], {
        errorMap: () => ({
          message: "customDays must contain valid day abbreviations (Mon-Sun)",
        }),
      })
    )
    .optional(),

  // Habit stacking cue (optional) - e.g., "after brushing teeth"
  stackCue: z
    .string()
    .max(200, "stackCue must be 200 characters or less")
    .optional(),

  // Reminder time in HH:MM format
  reminderTime: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "reminderTime must be in HH:MM format"
    )
    .optional(),

  // Timezone - IANA timezone string (e.g., "Asia/Kolkata")
  timezone: z.string().optional(),

  // Active status
  active: z.boolean().default(true),
});

// Validation schema for updating a habit
export const updateHabitSchema = z.object({
  habitId: z.string().min(1, "habitId is required"),
  userId: z.string().min(1, "userId is required"),

  // All fields optional for partial updates
  title: z.string().min(1).max(100).optional(),
  goalType: z.enum(["cards", "minutes"]).optional(),
  goalValue: z.number().int().positive().max(1000).optional(),
  frequency: z.enum(["daily", "weekdays", "weekends", "custom"]).optional(),
  customDays: z
    .array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]))
    .optional(),
  stackCue: z.string().max(200).optional(),
  reminderTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  timezone: z.string().optional(),
  active: z.boolean().optional(),
});

// Validation schema for habit check-in (daily completion)
export const habitCheckInSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  habitId: z.string().min(1, "habitId is required"),

  // Completion status
  completed: z.boolean(),

  // Reflective check-in (optional)
  mood: z
    .enum(["great", "good", "okay", "struggling"], {
      errorMap: () => ({
        message: "mood must be one of: great, good, okay, struggling",
      }),
    })
    .optional(),

  timeSpent: z.number().int().min(0).max(1440).optional(), // max 24 hours in minutes

  dailyWin: z
    .string()
    .max(500, "dailyWin must be 500 characters or less")
    .optional(),

  // Timestamp of completion (ISO string)
  completedAt: z.string().datetime().optional(),
});
