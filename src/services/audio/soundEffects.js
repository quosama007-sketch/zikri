/**
 * Sound Effects Service
 *
 * Handles sound effect loading and playback for game interactions.
 *
 * NOTE: Uses Web Audio API - web-specific implementation.
 * For mobile (Flutter/React Native), these will need platform-specific implementations.
 */

/**
 * Sound volume configuration
 * Adjust these values to change default volumes for each sound
 */
export const DEFAULT_SOUND_VOLUMES = {
  tapSuccess: 0.3,
  phraseMiss: 0.4,
  phraseUnlock: 0.5,
  completion: 0.6,
};

/**
 * Load all sound effects
 * @param {Object} soundVolumes - Volume settings for each sound (optional)
 * @returns {Object} Object containing loaded sound elements
 */
export const loadSoundEffects = (soundVolumes = DEFAULT_SOUND_VOLUMES) => {
  console.log("[SOUNDS] Loading sound effects...");

  const sounds = {};

  try {
    // Load all sound files
    sounds.tapSuccess = new Audio("/assets/audio/Tap Success.mp3");
    sounds.phraseMiss = new Audio("/assets/audio/Phrase Miss.mp3");
    sounds.phraseUnlock = new Audio("/assets/audio/Phrase Unlock.mp3");
    sounds.completion = new Audio("/assets/audio/Completion.mp3");

    // Set volumes
    sounds.tapSuccess.volume = soundVolumes.tapSuccess;
    sounds.phraseMiss.volume = soundVolumes.phraseMiss;
    sounds.phraseUnlock.volume = soundVolumes.phraseUnlock;
    sounds.completion.volume = soundVolumes.completion;

    // Preload all sounds
    Object.values(sounds).forEach((sound) => {
      if (sound) sound.preload = "auto";
    });

    console.log("[SOUNDS] All sound effects loaded successfully!");
    return sounds;
  } catch (error) {
    console.error("[SOUNDS] Error loading sound effects:", error);
    return {};
  }
};

/**
 * Load phrase audio files (Zikr phrases and Asma ul Husna)
 * @param {number} phraseAudioVolume - Volume for phrase audio (0-1, default: 0.7)
 * @returns {Object} Object containing loaded phrase audio elements
 */
export const loadPhraseAudio = (phraseAudioVolume = 0.7) => {
  console.log("[PHRASE AUDIO] Loading phrase audio files...");

  const phraseAudio = {};

  try {
    // Load all 27 zikr phrase audio files (zikr_1.mp3 to zikr_27.mp3)
    for (let i = 1; i <= 27; i++) {
      const audio = new Audio(`/assets/audio/zikr_${i}.mp3`);
      audio.volume = phraseAudioVolume;
      audio.preload = "auto";
      phraseAudio[i] = audio;
    }
    console.log("[PHRASE AUDIO] ✅ Loaded 27 zikr phrase audio files");

    // Load all 99 Asma ul Husna audio files (asma_101.mp3 to asma_200.mp3)
    for (let i = 101; i <= 200; i++) {
      const audio = new Audio(`/assets/audio/asma_${i}.mp3`);
      audio.volume = phraseAudioVolume;
      audio.preload = "auto";
      phraseAudio[i] = audio;
    }
    console.log("[PHRASE AUDIO] ✅ Loaded 99 Asma ul Husna audio files");

    console.log(
      "[PHRASE AUDIO] 🎵 All 126 audio files loaded successfully! (27 zikr + 99 Asma)",
    );

    return phraseAudio;
  } catch (error) {
    console.error("[PHRASE AUDIO] Error loading phrase audio:", error);
    return {};
  }
};

/**
 * Play a sound effect
 * @param {Object} soundRefs - Object containing sound elements
 * @param {string} soundName - Name of sound to play ('tapSuccess', 'phraseMiss', etc.)
 * @param {boolean} soundsEnabled - Whether sounds are enabled
 * @returns {void}
 */
export const playSound = (soundRefs, soundName, soundsEnabled = true) => {
  if (!soundsEnabled) return;

  const sound = soundRefs[soundName];
  if (!sound) {
    console.warn(`[SOUNDS] Sound "${soundName}" not found`);
    return;
  }

  try {
    // Clone and play (allows overlapping sounds)
    const soundClone = sound.cloneNode();
    soundClone.volume = sound.volume;
    soundClone.play().catch((err) => {
      console.log(`[SOUNDS] Play prevented for ${soundName}:`, err);
    });
  } catch (error) {
    console.error(`[SOUNDS] Error playing ${soundName}:`, error);
  }
};

/**
 * Play phrase audio (Zikr or Asma ul Husna)
 * @param {Object} phraseAudioRefs - Object containing phrase audio elements
 * @param {number} phraseId - ID of phrase to play (1-27 for zikr, 101-200 for Asma)
 * @param {number} volume - Volume to play at (0-1)
 * @param {boolean} enabled - Whether phrase audio is enabled
 * @returns {void}
 */
export const playPhraseAudio = (
  phraseAudioRefs,
  phraseId,
  volume = 0.7,
  enabled = true,
) => {
  if (!enabled) return;

  const audio = phraseAudioRefs[phraseId];
  if (!audio) {
    console.warn(`[PHRASE AUDIO] Audio for phrase ${phraseId} not found`);
    return;
  }

  try {
    // Clone and play (allows overlapping)
    const audioClone = audio.cloneNode();
    audioClone.volume = volume;
    audioClone.play().catch((err) => {
      console.log(`[PHRASE AUDIO] Play prevented for phrase ${phraseId}:`, err);
    });

    // Log which type of audio is playing
    if (phraseId >= 1 && phraseId <= 27) {
      console.log(`[PHRASE AUDIO] 🔊 Playing zikr_${phraseId}.mp3`);
    } else if (phraseId >= 101 && phraseId <= 200) {
      console.log(`[PHRASE AUDIO] 🔊 Playing asma_${phraseId}.mp3`);
    }
  } catch (error) {
    console.error(`[PHRASE AUDIO] Error playing phrase ${phraseId}:`, error);
  }
};

/**
 * Cleanup sound resources
 * @param {Object} soundRefs - Object containing sound elements
 */
export const cleanupSounds = (soundRefs) => {
  Object.values(soundRefs).forEach((sound) => {
    if (sound) {
      sound.pause();
      sound.src = "";
    }
  });
};

/**
 * Cleanup phrase audio resources
 * @param {Object} phraseAudioRefs - Object containing phrase audio elements
 */
export const cleanupPhraseAudio = (phraseAudioRefs) => {
  Object.values(phraseAudioRefs).forEach((audio) => {
    if (audio) {
      audio.pause();
      audio.src = "";
    }
  });
};

/**
 * Set volume for all sounds
 * @param {Object} soundRefs - Object containing sound elements
 * @param {Object} volumes - New volume settings
 */
export const setSoundVolumes = (soundRefs, volumes) => {
  if (soundRefs.tapSuccess)
    soundRefs.tapSuccess.volume = volumes.tapSuccess || 0.3;
  if (soundRefs.phraseMiss)
    soundRefs.phraseMiss.volume = volumes.phraseMiss || 0.4;
  if (soundRefs.phraseUnlock)
    soundRefs.phraseUnlock.volume = volumes.phraseUnlock || 0.5;
  if (soundRefs.completion)
    soundRefs.completion.volume = volumes.completion || 0.6;
};

/**
 * Set volume for all phrase audio
 * @param {Object} phraseAudioRefs - Object containing phrase audio elements
 * @param {number} volume - New volume (0-1)
 */
export const setPhraseAudioVolume = (phraseAudioRefs, volume) => {
  Object.values(phraseAudioRefs).forEach((audio) => {
    if (audio) audio.volume = volume;
  });
};
