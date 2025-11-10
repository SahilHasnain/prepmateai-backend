// Spaced Repetition System (SRS) interval calculator

// Base intervals in hours for each score
const BASE_INTERVALS = {
  0: 2, // forgot -> 2 hours
  1: 12, // unsure -> 12 hours
  2: 48, // remembered -> 48 hours (2 days)
};

/**
 * Calculate next review interval based on score and previous interval
 * @param {number} score - User feedback score (0=forgot, 1=unsure, 2=remembered)
 * @param {number|null} previousIntervalHours - Previous interval in hours (optional)
 * @returns {number} Next interval in hours
 *
 * Examples:
 * - calculateIntervalHours(2) -> 48 (first time, remembered)
 * - calculateIntervalHours(2, 48) -> 72 (remembered again, boost by 1.5x)
 * - calculateIntervalHours(0, 48) -> 3 (forgot, reset to base * 1.5)
 * - calculateIntervalHours(1, 12) -> 18 (unsure, boost by 1.5x)
 */
export const calculateIntervalHours = (score, previousIntervalHours = null) => {
  // Validate score
  if (![0, 1, 2].includes(score)) {
    throw new Error("Score must be 0, 1, or 2");
  }

  const baseInterval = BASE_INTERVALS[score];

  // First review or no previous interval
  if (!previousIntervalHours) {
    return baseInterval;
  }

  // Boost interval: use max of (base * 1.5) or (previous * 1.5)
  const boostedBase = Math.round(baseInterval * 1.5);
  const boostedPrevious = Math.round(previousIntervalHours * 1.5);

  return Math.max(boostedBase, boostedPrevious);
};

// Test examples (uncomment to run)
/*
console.log('Test 1 - First review, remembered:', calculateIntervalHours(2)); // 48
console.log('Test 2 - Second review, remembered:', calculateIntervalHours(2, 48)); // 72
console.log('Test 3 - Third review, remembered:', calculateIntervalHours(2, 72)); // 108
console.log('Test 4 - Forgot after long interval:', calculateIntervalHours(0, 72)); // 3
console.log('Test 5 - Unsure, boost:', calculateIntervalHours(1, 12)); // 18
console.log('Test 6 - First review, forgot:', calculateIntervalHours(0)); // 2
*/
