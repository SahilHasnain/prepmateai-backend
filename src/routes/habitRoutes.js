import express from "express";
import { success, failure } from "../utils/response.js";
import { logInfo, logError } from "../utils/logger.js";
import { validate } from "../middleware/validate.js";
import {
  createHabitSchema,
  updateHabitSchema,
  habitCheckInSchema,
} from "../validators/habitValidator.js";
import {
  createHabit,
  getHabits,
  updateHabit,
  deleteHabit,
  checkInHabit,
  getHabitStats,
} from "../services/appwriteService.js";

const router = express.Router();

// POST /api/habits - Create a new habit
router.post("/", validate(createHabitSchema), async (req, res) => {
  try {
    const {
      userId,
      title,
      goalType,
      goalValue,
      frequency,
      customDays,
      stackCue,
      reminderTime,
      timezone,
      active,
    } = req.body;

    logInfo(`Creating habit for user: ${userId}`, { title, goalType });

    const habit = await createHabit({
      userId,
      title,
      goalType,
      goalValue,
      frequency,
      customDays,
      stackCue,
      reminderTime,
      timezone: timezone || "Asia/Kolkata", // Default to IST
      active: active !== undefined ? active : true,
    });

    res.json(
      success(
        { habit },
        "Habit created successfully! Remember: tiny changes, remarkable results."
      )
    );
  } catch (err) {
    logError("HabitRoutes: POST / failed", err, { userId: req.body.userId });
    res.status(500).json(failure(err.message));
  }
});

// GET /api/habits/:userId - Get all habits for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { activeOnly } = req.query; // Optional query param

    logInfo(`Fetching habits for user: ${userId}`);

    const habits = await getHabits(userId, activeOnly === "true");

    res.json(
      success(
        { habits, count: habits.length },
        habits.length > 0
          ? "Habits loaded successfully"
          : "No habits yet. Start with something tiny!"
      )
    );
  } catch (err) {
    logError("HabitRoutes: GET /:userId failed", err, {
      userId: req.params.userId,
    });
    res.status(500).json(failure(err.message));
  }
});

// PATCH /api/habits/:habitId - Update an existing habit
router.patch("/:habitId", validate(updateHabitSchema), async (req, res) => {
  try {
    const { habitId } = req.params;
    const { userId, ...updates } = req.body;

    logInfo(`Updating habit: ${habitId} for user: ${userId}`);

    const updatedHabit = await updateHabit(habitId, userId, updates);

    res.json(success({ habit: updatedHabit }, "Habit updated successfully!"));
  } catch (err) {
    logError("HabitRoutes: PATCH /:habitId failed", err, {
      habitId: req.params.habitId,
    });
    res.status(500).json(failure(err.message));
  }
});

// DELETE /api/habits/:habitId - Delete a habit
router.delete("/:habitId", async (req, res) => {
  try {
    const { habitId } = req.params;
    const { userId } = req.query; // Pass userId as query param for validation

    if (!userId) {
      return res.status(400).json(failure("userId is required"));
    }

    logInfo(`Deleting habit: ${habitId} for user: ${userId}`);

    await deleteHabit(habitId, userId);

    res.json(success(null, "Habit deleted successfully"));
  } catch (err) {
    logError("HabitRoutes: DELETE /:habitId failed", err, {
      habitId: req.params.habitId,
    });
    res.status(500).json(failure(err.message));
  }
});

// POST /api/habits/check-in - Record daily habit completion (with never-miss-twice logic)
router.post("/check-in", validate(habitCheckInSchema), async (req, res) => {
  try {
    const {
      userId,
      habitId,
      completed,
      mood,
      timeSpent,
      dailyWin,
      completedAt,
    } = req.body;

    logInfo(`Habit check-in for user: ${userId}, habit: ${habitId}`, {
      completed,
    });

    const result = await checkInHabit({
      userId,
      habitId,
      completed,
      mood,
      timeSpent,
      dailyWin,
      completedAt: completedAt || new Date().toISOString(),
    });

    // Never-miss-twice logic: if user missed yesterday, show supportive message
    const message = result.missedYesterday
      ? "You missed yesterday, but you're here today! That's the never-miss-twice rule in action. 💪"
      : completed
      ? "Great work! Your consistency is building momentum. 🔥"
      : "No worries! Life happens. Just don't miss twice in a row.";

    res.json(
      success(
        {
          checkIn: result.checkIn,
          streak: result.streak,
          missedYesterday: result.missedYesterday,
        },
        message
      )
    );
  } catch (err) {
    logError("HabitRoutes: POST /check-in failed", err, {
      userId: req.body.userId,
    });
    res.status(500).json(failure(err.message));
  }
});

// GET /api/habits/stats/:userId/:habitId - Get habit statistics (streak, completion rate, etc.)
router.get("/stats/:userId/:habitId", async (req, res) => {
  try {
    const { userId, habitId } = req.params;

    logInfo(`Fetching habit stats for user: ${userId}, habit: ${habitId}`);

    const stats = await getHabitStats(userId, habitId);

    res.json(success({ stats }));
  } catch (err) {
    logError("HabitRoutes: GET /stats/:userId/:habitId failed", err, {
      userId: req.params.userId,
      habitId: req.params.habitId,
    });
    res.status(500).json(failure(err.message));
  }
});

export default router;
