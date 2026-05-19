/**
 * Game Configuration Constants
 *
 * Single source of truth for all game tuning values.
 * Flutter equivalent: lib/constants/game_config.dart
 */

// ─── Core game mechanics ──────────────────────────────────────────────────────

export const STARTING_LIVES = 5;
export const GAME_LOOP_INTERVAL_MS = 50;
export const DEFAULT_TASBIH_TARGET = 100;

// ─── Phrase spawning ──────────────────────────────────────────────────────────

export const TARGET_PHRASES_ON_SCREEN = 4;
export const SPAWN_PROBABILITY = 0.95;          // chance to spawn when at target count
export const BISMILLAH_FORCE_SPAWN_COUNT = 3;   // force Bismillah for first N spawns

// ─── Phrase position / layout ─────────────────────────────────────────────────

export const PHRASE_START_POSITION = -20;       // % — off-screen top (starts here)
export const PHRASE_REMOVAL_POSITION = 110;     // % — off-screen bottom (removed here)
export const PHRASE_VERTICAL_MIN = 20;          // % — leftmost spawn lane
export const PHRASE_VERTICAL_RANGE = 60;        // % — range from min (min+range = max)
export const PHRASE_VERTICAL_SPACING = 15;      // % — minimum gap between phrases
export const PHRASE_OVERLAP_MAX_ATTEMPTS = 20;  // retries before falling back to lanes
export const PHRASE_FALLBACK_LANES = [25, 50, 75]; // % — used when overlap check fails

// ─── Miss / game-end thresholds ───────────────────────────────────────────────

// Focus & Asma modes
export const FOCUS_ASMA_MISS_SOUND_AT = 3;     // play miss sound on Nth consecutive miss
export const FOCUS_ASMA_GAME_END_MISSES = 5;   // end game after N consecutive misses

// Tasbih mode
export const TASBIH_MISS_SOUND_AT = [4, 7];    // play miss sound on these miss counts
export const TASBIH_GAME_END_MISSES = 10;      // end game after N consecutive misses

// ─── Spawn probability weights ────────────────────────────────────────────────

export const SPAWN_WEIGHT_2_WORD = 0.90;   // 2-word phrases (most common)
export const SPAWN_WEIGHT_3_WORD = 0.95;   // cumulative — 3-word phrases
export const SPAWN_WEIGHT_4_WORD = 0.97;   // cumulative — 4-word phrases
                                            // remainder  — 5+ word phrases

// ─── Golden highlight (newly unlocked phrases) ───────────────────────────────

export const NEWLY_UNLOCKED_GOLDEN_APPEARANCES = 3; // show golden for first N spawns

// ─── Asma ul Husna system ────────────────────────────────────────────────────

export const ASMA_INITIAL_UNLOCKED = 2;    // names available from the start
export const ASMA_TAPS_PER_UNLOCK = 33;   // taps required to unlock next name
export const ASMA_POINTS_PER_TAP = 10;    // points awarded per Asma tap

// ─── Phrase falling speed ────────────────────────────────────────────────────

export const PHRASE_SPEED_FOCUS = 0.5;    // %/tick — Focus & Tasbih modes
export const PHRASE_SPEED_ASMA = 0.3;     // %/tick — Asma mode (slower, contemplative)

// ─── Background progression ───────────────────────────────────────────────────

export const POINTS_PER_BACKGROUND = 800; // session points per background stage
export const MAX_BACKGROUND_INDEX = 11;   // number of background stages

// ─── Freeze token system ─────────────────────────────────────────────────────

export const POINTS_PER_FREEZE_TOKEN = 30000; // total points per token earned
export const MAX_FREEZE_TOKENS = 10;           // maximum tokens a user can hold
