/**
 * Game Calculations Service
 *
 * Handles all game calculation logic including:
 * - Phrase and Asma unlocking
 * - Background determination
 * - Speed calculations
 * - Freeze token calculations
 */

import { ZIKR_PHRASES, NAMES_OF_ALLAH } from "../../constants";

/**
 * Get unlocked phrase IDs based on total points
 * @param {number} points - Total points earned
 * @returns {number[]} Array of unlocked phrase IDs
 */
export const getUnlockedPhraseIds = (points) => {
  return ZIKR_PHRASES.filter((p) => p.unlockAt <= points).map((p) => p.id);
};

/**
 * Get unlocked Asma ul Husna names based on tap count
 * Every 33 taps unlocks the next name
 * @param {number} tapCount - Total Asma taps
 * @returns {number[]} Array of unlocked Asma IDs
 */
export const getUnlockedAsmaIds = (tapCount) => {
  // Start with 2 names: Ya Allah (101) and Ya Rabb (102)
  // Every 33 taps unlocks the next name
  const baseUnlocked = 2;
  const additionalUnlocked = Math.floor(tapCount / 33);
  const totalUnlocked = Math.min(
    baseUnlocked + additionalUnlocked,
    NAMES_OF_ALLAH.length,
  );

  return NAMES_OF_ALLAH.slice(0, totalUnlocked).map((n) => n.id);
};

/**
 * Get available phrases for gameplay
 * @param {number} totalPoints - Current total points
 * @returns {Object[]} Array of unlocked phrase objects
 */
export const getAvailablePhrases = (totalPoints) => {
  const unlockedIds = getUnlockedPhraseIds(totalPoints);
  return ZIKR_PHRASES.filter((p) => unlockedIds.includes(p.id));
};

/**
 * Calculate background index based on session score (1-11)
 * Used for dynamic background music transitions
 * @param {number} score - Current session score
 * @returns {number} Background index (1-11)
 */
export const getBackgroundIndex = (score) => {
  // 0-799 → 1, 800-1599 → 2, 1600-2399 → 3, ... 8000+ → 11
  return Math.min(Math.floor(score / 800) + 1, 11);
};

/**
 * Calculate freeze tokens based on total points
 * 1 token per 30,000 points, max 10 tokens
 * @param {number} totalPoints - Total points earned
 * @returns {number} Number of freeze tokens (0-10)
 */
export const calculateFreezeTokens = (totalPoints) => {
  const tokensEarned = Math.floor(totalPoints / 30000);
  return Math.min(tokensEarned, 10); // Max 10 tokens
};

/**
 * Check if a specific date has active freeze
 * @param {string} dateString - Date string to check
 * @param {string[]} activeFreezes - Array of frozen date strings
 * @returns {boolean} True if date is frozen
 */
export const isDateFrozen = (dateString, activeFreezes = []) => {
  return activeFreezes.includes(dateString);
};

/**
 * Get game background gradient based on points
 * @param {number} totalPoints - Current total points
 * @param {number} sessionScore - Current session score
 * @returns {Object} { background: string, message: string }
 */
export const getGameBackground = (totalPoints, sessionScore) => {
  const points = totalPoints + sessionScore;

  let background = "";
  let message = "";

  if (points < 250) {
    background = "bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900";
    message = "🌙 Night Sky - Peaceful contemplation";
  } else if (points < 500) {
    background =
      "bg-gradient-to-br from-amber-100 via-yellow-50 to-emerald-100";
    message = "🕌 Inside the Mosque - Sacred atmosphere";
  } else if (points < 750) {
    background = "bg-gradient-to-br from-cyan-200 via-blue-100 to-amber-100";
    message = "🏖️ Beach - Calm and serene";
  } else if (points < 1000) {
    background = "bg-gradient-to-br from-green-300 via-emerald-200 to-lime-100";
    message = "🌳 Jungle Morning - Fresh and alive";
  } else if (points < 1250) {
    background = "bg-gradient-to-br from-slate-400 via-gray-300 to-blue-200";
    message = "🌧️ Rainy Road - Reflective moment";
  } else if (points < 1500) {
    background = "bg-gradient-to-br from-orange-200 via-red-100 to-yellow-100";
    message = "🏪 Marketplace - Vibrant energy";
  } else {
    background = "bg-gradient-to-br from-sky-300 via-slate-200 to-blue-100";
    message = "🏙️ High-rise View - You've reached the top!";
  }

  return { background, message };
};

/**
 * Calculate phrase falling speed based on game mode
 * @param {string} gameMode - Current game mode ('focus', 'asma', 'tasbih')
 * @param {Object} gameStartTimeRef - Ref to game start time (optional)
 * @returns {number} Speed multiplier (0.3 for Asma, 0.5 for Focus/Tasbih)
 */
export const getSpeed = (gameMode, gameStartTimeRef = null) => {
  if (gameStartTimeRef && !gameStartTimeRef.current) return 0.3;

  // Asma ul Husna Mode: Fixed speed at 0.3 (slower, more contemplative)
  if (gameMode === "asma") {
    return 0.3;
  }

  // Focus and Tasbih Modes: Fixed speed at 0.5 (running pace)
  return 0.5;
};
