/**
 * Game Loop Service
 *
 * Pure functions for game loop computation — no React dependencies.
 * Flutter equivalents: lib/services/game_loop_service.dart
 */

import { ZIKR_PHRASES, NAMES_OF_ALLAH } from "../../constants";
import {
  BISMILLAH_FORCE_SPAWN_COUNT,
  NEWLY_UNLOCKED_GOLDEN_APPEARANCES,
  PHRASE_START_POSITION,
  PHRASE_REMOVAL_POSITION,
  PHRASE_VERTICAL_MIN,
  PHRASE_VERTICAL_RANGE,
  PHRASE_VERTICAL_SPACING,
  PHRASE_OVERLAP_MAX_ATTEMPTS,
  PHRASE_FALLBACK_LANES,
  FOCUS_ASMA_MISS_SOUND_AT,
  TASBIH_MISS_SOUND_AT,
  FOCUS_ASMA_GAME_END_MISSES,
  TASBIH_GAME_END_MISSES,
  SPAWN_WEIGHT_2_WORD,
  SPAWN_WEIGHT_3_WORD,
  SPAWN_WEIGHT_4_WORD,
} from "../../constants/gameConfig";
import { getUnlockedAsmaIds } from "./calculations";
import { calculatePercentage } from "../utilities";

// ─── Spawn helpers ────────────────────────────────────────────────────────────

/**
 * Compute the list of items available to spawn given the current game state.
 * Flutter → GameLoopService.computeSpawnAvailableItems()
 * @param {string} mode - 'focus' | 'asma' | 'tasbih'
 * @param {number} currentTotal - totalPoints + sessionScore
 * @param {number} asmaTotalTaps - Ref value (not React state)
 * @param {Object|null} tasbihSelectedPhrase
 * @returns {Object[]}
 */
export const computeSpawnAvailableItems = (
  mode,
  currentTotal,
  asmaTotalTaps,
  tasbihSelectedPhrase,
) => {
  if (mode === "focus") {
    const items = ZIKR_PHRASES.filter((p) => p.unlockAt <= currentTotal);
    console.log(
      `[FOCUS MODE] Spawning from ${items.length} unlocked ZIKR_PHRASES`,
    );
    return items;
  }
  if (mode === "asma") {
    const unlockedIds = getUnlockedAsmaIds(asmaTotalTaps);
    const items = NAMES_OF_ALLAH.filter((n) => unlockedIds.includes(n.id));
    console.log(
      `[ASMA MODE] Spawning from ${items.length} unlocked names (${asmaTotalTaps} total taps - from ref)`,
    );
    console.log(
      `[ASMA MODE] Available name IDs: ${items.map((n) => n.id).join(", ")}`,
    );
    console.log(
      `[ASMA MODE] Available names: ${items.map((n) => n.transliteration).join(", ")}`,
    );
    return items;
  }
  if (mode === "tasbih") {
    const items = tasbihSelectedPhrase ? [tasbihSelectedPhrase] : [];
    console.log(
      `[TASBIH MODE] Spawning selected phrase: ${tasbihSelectedPhrase?.transliteration || "none"}`,
    );
    return items;
  }
  return [];
};

/**
 * Select which item to spawn using probability distribution.
 * Focus: force Bismillah for first N spawns, then weight by word count.
 * Asma: weight by word count.
 * Tasbih: always the selected phrase.
 * Flutter → GameLoopService.selectItemToSpawn()
 * @param {string} mode
 * @param {Object[]} availableItems
 * @param {number} bismillahCount - Ref value (times Bismillah was force-spawned so far)
 * @returns {Object|null}
 */
export const selectItemToSpawn = (mode, availableItems, bismillahCount) => {
  if (availableItems.length === 0) return null;

  if (mode === "tasbih") {
    if (!availableItems[0]) {
      console.error("[TASBIH MODE ERROR] No phrase selected!");
      return null;
    }
    const item = availableItems[0];
    console.log(
      `[TASBIH MODE] ✓ Spawning: ${item.transliteration} (${item.arabic})`,
    );
    return item;
  }

  if (mode === "focus" && bismillahCount < BISMILLAH_FORCE_SPAWN_COUNT) {
    console.log(
      `[BISMILLAH] Selecting initial Bismillah (count: ${bismillahCount + 1}/${BISMILLAH_FORCE_SPAWN_COUNT})`,
    );
    return ZIKR_PHRASES[0];
  }

  let itemPool = availableItems;

  if (mode === "focus") {
    const withoutBismillah = availableItems.filter((p) => p.id !== 1);
    console.log(`[DEBUG] bismillahCountRef.current: ${bismillahCount}`);
    console.log(`[DEBUG] availableItems.length: ${availableItems.length}`);
    console.log(
      `[DEBUG] itemsWithoutBismillah.length: ${withoutBismillah.length}`,
    );
    console.log(
      `[DEBUG] itemsWithoutBismillah IDs: ${withoutBismillah.map((p) => p.id).join(", ")}`,
    );
    if (withoutBismillah.length === 0) {
      console.warn(
        "[WARNING] Only Bismillah available! Spawning it anyway to keep game going...",
      );
      return ZIKR_PHRASES[0];
    }
    itemPool = withoutBismillah;
  }

  const twoWordItems = itemPool.filter((p) => p.wordCount === 2);
  const threeWordItems = itemPool.filter((p) => p.wordCount === 3);
  const fourWordItems = itemPool.filter((p) => p.wordCount === 4);
  const longerItems = itemPool.filter((p) => p.wordCount > 4);

  if (mode === "focus") {
    console.log(
      `[DEBUG] 2-word: ${twoWordItems.length}, 3-word: ${threeWordItems.length}, 4-word: ${fourWordItems.length}, longer: ${longerItems.length}`,
    );
  } else {
    console.log(
      `[ASMA MODE] Word count distribution: 2-word: ${twoWordItems.length}, 3-word: ${threeWordItems.length}, 4-word: ${fourWordItems.length}, longer: ${longerItems.length}`,
    );
  }

  const rand = Math.random();
  let selected;

  if (rand < SPAWN_WEIGHT_2_WORD && twoWordItems.length > 0) {
    selected = twoWordItems[Math.floor(Math.random() * twoWordItems.length)];
  } else if (rand < SPAWN_WEIGHT_3_WORD && threeWordItems.length > 0) {
    selected =
      threeWordItems[Math.floor(Math.random() * threeWordItems.length)];
  } else if (rand < SPAWN_WEIGHT_4_WORD && fourWordItems.length > 0) {
    selected = fourWordItems[Math.floor(Math.random() * fourWordItems.length)];
  } else if (longerItems.length > 0) {
    selected = longerItems[Math.floor(Math.random() * longerItems.length)];
  } else {
    selected = itemPool[Math.floor(Math.random() * itemPool.length)];
  }

  if (mode === "focus") {
    console.log(
      `[NORMAL SPAWN] Selected: ${selected.transliteration} (ID: ${selected.id})`,
    );
  } else {
    console.log(
      `[ASMA MODE] Selected: ${selected.transliteration} (ID: ${selected.id}, wordCount: ${selected.wordCount})`,
    );
  }

  return selected;
};

/**
 * Check if an item should appear with the golden "newly unlocked" highlight.
 * Shows golden for its first N appearances after unlock.
 * Flutter → GameLoopService.isNewlyUnlockedItem()
 * @param {number} itemId
 * @param {Object} newlyUnlockedMap - { [id]: appearanceCount }
 * @returns {boolean}
 */
export const isNewlyUnlockedItem = (itemId, newlyUnlockedMap) => {
  const count = newlyUnlockedMap[itemId];
  return count !== undefined && count < NEWLY_UNLOCKED_GOLDEN_APPEARANCES;
};

/**
 * Build a falling phrase object with a non-overlapping vertical position.
 * Must be called inside setPhrases() updater to receive current phrases for overlap check.
 * Flutter → GameLoopService.buildFallingPhrase()
 * @param {Object} item - Phrase or Asma data object
 * @param {number} nextId - Unique instance ID for this falling phrase
 * @param {Object[]} currentPhrases - Active phrases on screen (for overlap detection)
 * @param {boolean} isNewlyUnlocked
 * @returns {Object} Falling phrase object
 */
export const buildFallingPhrase = (item, nextId, currentPhrases, isNewlyUnlocked) => {
  let verticalPosition;
  let attempts = 0;

  do {
    verticalPosition =
      Math.random() * PHRASE_VERTICAL_RANGE + PHRASE_VERTICAL_MIN;
    const hasOverlap = currentPhrases.some((p) => {
      if (p.position > PHRASE_REMOVAL_POSITION || p.position < PHRASE_START_POSITION - 5)
        return false;
      return Math.abs(p.verticalPosition - verticalPosition) < PHRASE_VERTICAL_SPACING;
    });
    if (!hasOverlap) break;
    attempts++;
  } while (attempts < PHRASE_OVERLAP_MAX_ATTEMPTS);

  if (attempts >= PHRASE_OVERLAP_MAX_ATTEMPTS) {
    verticalPosition =
      PHRASE_FALLBACK_LANES[Math.floor(Math.random() * PHRASE_FALLBACK_LANES.length)];
  }

  return {
    id: nextId,
    data: item,
    position: PHRASE_START_POSITION,
    verticalPosition,
    isNewlyUnlocked,
    phraseDataId: item.id,
  };
};

// ─── Tick / miss logic ────────────────────────────────────────────────────────

/**
 * Process one game tick: move all phrases down by speed.
 * Flutter → GameLoopService.tickPhrases()
 * @param {Object[]} phrases
 * @param {number} speed
 * @returns {{ remaining: Object[], missed: Object[] }}
 */
export const tickPhrases = (phrases, speed) => {
  const updated = phrases.map((p) => ({ ...p, position: p.position + speed }));
  return {
    remaining: updated.filter((p) => p.position <= PHRASE_REMOVAL_POSITION),
    missed: updated.filter((p) => p.position > PHRASE_REMOVAL_POSITION),
  };
};

/**
 * Detect items that just crossed their unlock threshold this tick.
 * Caller must add returned item IDs to previouslyUnlocked after this call.
 * Flutter → GameLoopService.checkNewlyUnlockedItems()
 * @param {Object[]} itemsToCheck - All phrases or Asma names
 * @param {number} currentTotal - totalPoints + sessionScore
 * @param {Set<number>} previouslyUnlocked - IDs already unlocked before this tick
 * @returns {Object[]} Newly unlocked items
 */
export const checkNewlyUnlockedItems = (
  itemsToCheck,
  currentTotal,
  previouslyUnlocked,
) => {
  return itemsToCheck.filter(
    (item) => item.unlockAt <= currentTotal && !previouslyUnlocked.has(item.id),
  );
};

/**
 * Whether the miss sound should play for this miss event.
 * Focus/Asma: plays on the Nth consecutive miss.
 * Tasbih: plays on specific miss counts.
 * Flutter → GameLoopService.shouldPlayMissSound()
 * @param {string} mode
 * @param {number} prevMisses
 * @param {number} newMisses
 * @returns {boolean}
 */
export const shouldPlayMissSound = (mode, prevMisses, newMisses) => {
  if (mode === "tasbih") {
    return TASBIH_MISS_SOUND_AT.some(
      (threshold) => prevMisses < threshold && newMisses >= threshold,
    );
  }
  return prevMisses < FOCUS_ASMA_MISS_SOUND_AT && newMisses >= FOCUS_ASMA_MISS_SOUND_AT;
};

/**
 * Whether the game should end due to consecutive misses.
 * Flutter → GameLoopService.shouldEndGame()
 * @param {string} mode
 * @param {number} consecutiveMisses
 * @returns {boolean}
 */
export const shouldEndGame = (mode, consecutiveMisses) => {
  if (mode === "tasbih") return consecutiveMisses >= TASBIH_GAME_END_MISSES;
  return consecutiveMisses >= FOCUS_ASMA_GAME_END_MISSES;
};

// ─── Session start / end ──────────────────────────────────────────────────────

/**
 * Compute the set of item IDs already unlocked when a session begins.
 * Used to detect new unlocks during gameplay via checkNewlyUnlockedItems().
 * Flutter → GameLoopService.computeInitialUnlocked()
 * @param {string} mode
 * @param {number} totalPoints
 * @param {Object|null} tasbihSelectedPhrase
 * @returns {Set<number>}
 */
export const computeInitialUnlocked = (mode, totalPoints, tasbihSelectedPhrase) => {
  let allItems = [];
  if (mode === "focus") allItems = ZIKR_PHRASES;
  else if (mode === "asma") allItems = NAMES_OF_ALLAH;
  else if (mode === "tasbih")
    allItems = tasbihSelectedPhrase ? [tasbihSelectedPhrase] : [];

  return new Set(
    allItems.filter((p) => p.unlockAt <= totalPoints).map((p) => p.id),
  );
};

/**
 * Compute end-of-game statistics.
 * Flutter → GameLoopService.computeEndGameStats()
 * @param {string} mode
 * @param {{ focus: number, asma: number, tasbih: number }} scores - Session scores per mode
 * @param {number} totalPoints - Points accumulated before this session
 * @param {number|null} gameStartTime - Timestamp (ms) when game started
 * @param {{ totalTaps: number, missedPhrases: number }} sessionStats
 * @returns {{ finalSessionScore: number, newTotalPoints: number, accuracy: number, duration: number }}
 */
export const computeEndGameStats = (
  mode,
  scores,
  totalPoints,
  gameStartTime,
  sessionStats,
) => {
  const duration = gameStartTime
    ? Math.floor((Date.now() - gameStartTime) / 1000)
    : 0;

  let finalSessionScore = 0;
  if (mode === "focus") finalSessionScore = scores.focus;
  else if (mode === "asma") finalSessionScore = scores.asma;
  else if (mode === "tasbih") finalSessionScore = scores.tasbih;

  return {
    finalSessionScore,
    newTotalPoints: totalPoints + finalSessionScore,
    accuracy: calculatePercentage(
      sessionStats.totalTaps,
      sessionStats.totalTaps + sessionStats.missedPhrases,
    ),
    duration,
  };
};
