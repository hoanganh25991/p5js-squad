// Squad Survival Game
// A 3D p5.js game with squad-based combat

// ===== CONSTANTS =====

// Game states
const GameState = {
  MENU: "menu",
  PLAYING: "playing",
  PAUSED: "paused",
  GAME_OVER: "gameOver",
};

// Performance levels
const PerformanceLevel = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  AUTO: "auto",
};

// Skill name constants
const SkillName = {
  STAR_BLAST: "STAR_BLAST",
  MACHINE_GUN: "MACHINE_GUN",
  SHIELD: "SHIELD",
  FREEZE: "FREEZE",
  REJUVENATION: "REJUVENATION",
  INFERNAL_RAGE: "INFERNAL_RAGE",
  QUANTUM_ACCELERATION: "QUANTUM_ACCELERATION",
  ATOMIC_BOMB: "ATOMIC_BOMB",
  BARRIER: "DEFENSE_WALL",
};

// Mapping of skill enum values to their display names
const skillDisplayNames = {
  [SkillName.STAR_BLAST]: "Star Blast",
  [SkillName.MACHINE_GUN]: "Machine Gun",
  [SkillName.SHIELD]: "Shield",
  [SkillName.FREEZE]: "Freeze",
  [SkillName.REJUVENATION]: "Rejuvenation",
  [SkillName.INFERNAL_RAGE]: "Infernal Rage",
  [SkillName.QUANTUM_ACCELERATION]: "Quantum Accel",
  [SkillName.ATOMIC_BOMB]: "Atomic Bomb",
  [SkillName.BARRIER]: "Defense Wall",
};

const skillKeys = {
  [SkillName.STAR_BLAST]: "A",
  [SkillName.MACHINE_GUN]: "S",
  [SkillName.SHIELD]: "D",
  [SkillName.FREEZE]: "F",
  [SkillName.REJUVENATION]: "Q",
  [SkillName.INFERNAL_RAGE]: "W",
  [SkillName.QUANTUM_ACCELERATION]: "E",
  [SkillName.ATOMIC_BOMB]: "R",
  [SkillName.BARRIER]: "B",
};

const skillHandlers = {
  [SkillName.STAR_BLAST]: activateStarBlastSkill,
  [SkillName.MACHINE_GUN]: activateMachineGunSkill,
  [SkillName.SHIELD]: activateShieldSkill,
  [SkillName.FREEZE]: activateFreezeSkill,
  [SkillName.REJUVENATION]: activateRejuvenationSkill,
  [SkillName.INFERNAL_RAGE]: activateInfernalRageSkill,
  [SkillName.QUANTUM_ACCELERATION]: activateQuantumAccelerationSkill,
  [SkillName.ATOMIC_BOMB]: activateAtomicBombSkill,
  [SkillName.BARRIER]: activateBarrierSkill,
};

/**
 * Get the human-readable display name for a skill
 * @param {string} skillName - The skill name enum value (from SkillName object)
 * @returns {string} The display name of the skill
 */
function getSkillName(skillName) {
  return skillDisplayNames[skillName] || "";
}

function getSkillKey(skillName) {
  return skillKeys[skillName] || "";
}

function getSkillHandler(skillName) {
  return (
    skillHandlers[skillName] ||
    function () {
      console.log(`No handler for skillName: ${skillName}`);
    }
  );
}

// Mapping of skill names for UI organization
const skillUIOrder = [
  SkillName.STAR_BLAST,
  SkillName.MACHINE_GUN,
  SkillName.SHIELD,
  SkillName.FREEZE,
  SkillName.REJUVENATION,
  SkillName.INFERNAL_RAGE,
  SkillName.QUANTUM_ACCELERATION,
  SkillName.ATOMIC_BOMB,
  SkillName.BARRIER,
  "G",
  "T",
  "Y",
];

// For backward compatibility with UI elements that use numeric indices
const skillNameToNumber = {};
const skillNumberToName = {};

// Initialize the mappings
skillUIOrder.forEach((skillName, index) => {
  const skillNumber = index + 1;
  skillNameToNumber[skillName] = skillNumber;
  skillNumberToName[skillNumber] = skillName;
});

// Add placeholder entries for unused skill slots
for (let i = skillUIOrder.length + 1; i <= 12; i++) {
  skillNumberToName[i] = "-";
}

// ===== GLOBAL VARIABLES =====

// Game state variables
let gameState = GameState.MENU;
let currentWave = 1;
let score = 0;
let gameStartTime = 0;
let startTime = 0;
let totalEnemiesKilled = 0; // Total enemies killed across all waves
let waveEnemiesKilled = 0; // Enemies killed in the current wave

// Sound system variables
let soundSystemInitialized = false;

// Sound storage
let sounds = {
  // Background music
  music: {
    main: null,
    battle: null,
    boss: null,
    victory: null,
  },

  // UI sounds
  ui: {
    click: null,
    hover: null,
    upgrade: null,
    error: null,
    levelUp: null,
  },

  // Combat sounds
  combat: {
    shoot: null,
    hit: null,
    explosion: null,
    death: null,
    criticalHit: null,
  },

  // Skill sounds - using skill names for better readability
  skills: {
    [SkillName.STAR_BLAST]: null, // Rapid Fire
    [SkillName.MACHINE_GUN]: null, // Scatter Shot
    [SkillName.SHIELD]: null, // Orbital Strike
    [SkillName.FREEZE]: null, // Cryo Freeze
    [SkillName.REJUVENATION]: null, // Rejuvenation Field
    [SkillName.INFERNAL_RAGE]: null, // Infernal Rage
    [SkillName.QUANTUM_ACCELERATION]: null, // Quantum Acceleration
    [SkillName.ATOMIC_BOMB]: null, // Apocalyptic Devastation
    [SkillName.BARRIER]: null, // Barrier
  },

  // Environment sounds
  environment: {
    wind: true,
  },

  // Power-up sounds
  powerups: {
    collect: null,
    spawn: null,
  },
};

// Sound settings
let soundSettings = {
  masterVolume: 0.5,
  musicVolume: 0.05, // Reduced background music volume
  sfxVolume: 0.8,
  uiVolume: 0.6,

  // Combat sound volumes
  combatVolume: {
    shoot: 0.1, // Reduced shoot sound to 1/3 of original volume
    hit: 0.5,
    explosion: 1.0,
    death: 1.0,
    criticalHit: 0.5,
  },

  // Skill sound volumes - using skill names for better readability
  skillVolume: {
    [SkillName.STAR_BLAST]: 0.4, // Auto-fire skill - lower volume
    [SkillName.MACHINE_GUN]: 0.8, // Scatter shot - normal volume
    [SkillName.SHIELD]: 0.8, // Orbital strike - normal volume
    [SkillName.FREEZE]: 2.4, // Freeze - much higher volume (3x)
    [SkillName.REJUVENATION]: 0.8, // Normal volume
    [SkillName.INFERNAL_RAGE]: 0.8, // Normal volume
    [SkillName.QUANTUM_ACCELERATION]: 0.8, // Normal volume
    [SkillName.ATOMIC_BOMB]: 0.8, // Normal volume
    [SkillName.BARRIER]: 0.8, // Normal volume
  },

  muted: false, // Sound off by default
  currentMusic: null,

  // Sound optimization settings
  maxConcurrentSounds: 8, // Maximum number of sounds that can play simultaneously

  // Priority levels for different sound types (higher = more important)
  soundPriority: {
    ui: 10, // UI sounds are highest priority
    skills: 8, // Skill sounds are high priority
    death: 7, // Death sounds are important
    criticalHit: 6, // Critical hits are somewhat important
    explosion: 5, // Explosions are medium priority
    hit: 3, // Regular hits are lower priority
    shoot: 2, // Shoot sounds are low priority
    environment: 1, // Environment sounds are lowest priority
  },

  // Minimum time (ms) between playing the same sound type
  soundCooldowns: {
    shoot: 50, // Don't play shoot sounds more than once per 50ms
    hit: 80, // Don't play hit sounds more than once per 80ms
    criticalHit: 150, // Don't play critical hit sounds more than once per 150ms
  },

  batchSounds: true, // Whether to batch similar sounds together
  dynamicCulling: true, // Whether to dynamically reduce sounds based on game performance
};

// ===== SOUND LOADING FUNCTIONS =====

// Preload all sounds
function preloadSounds() {
  try {
    // Check if p5.sound is available
    if (
      typeof p5 === "undefined" ||
      !p5.prototype.hasOwnProperty("loadSound")
    ) {
      console.warn("p5.sound library not available. Sound loading skipped.");
      return;
    }

    // Helper function to safely load sounds
    const safeLoadSound = (path) => {
      try {
        return loadSound(
          path,
          // Success callback
          () => {},
          // Error callback
          (err) => {
            console.warn(`Failed to load sound: ${path}`, err);
            return null;
          }
        );
      } catch (e) {
        console.warn(`Error loading sound: ${path}`, e);
        return null;
      }
    };

    // Background music
    sounds.music.main = safeLoadSound("sounds/music/main_theme.mp3");

    // UI sounds
    sounds.ui.click = safeLoadSound("sounds/ui/click.mp3");
    sounds.ui.hover = safeLoadSound("sounds/ui/hover.mp3");
    sounds.ui.upgrade = safeLoadSound("sounds/ui/upgrade.mp3");
    sounds.ui.error = safeLoadSound("sounds/ui/error.mp3");
    sounds.ui.levelUp = safeLoadSound("sounds/ui/level_up.mp3");

    // Combat sounds
    sounds.combat.shoot = safeLoadSound("sounds/combat/shoot.mp3");
    sounds.combat.hit = safeLoadSound("sounds/combat/hit.mp3");
    sounds.combat.explosion = safeLoadSound("sounds/combat/explosion.mp3");
    sounds.combat.death = safeLoadSound("sounds/combat/death.mp3");
    sounds.combat.criticalHit = safeLoadSound("sounds/combat/critical_hit.mp3");

    // Skill sounds - using skill names for better readability
    sounds.skills[SkillName.STAR_BLAST] = safeLoadSound(
      "sounds/skills/rapid_fire.mp3"
    );
    sounds.skills[SkillName.MACHINE_GUN] = safeLoadSound(
      "sounds/skills/scatter_shot.mp3"
    );
    sounds.skills[SkillName.SHIELD] = safeLoadSound(
      "sounds/skills/heavy_strike.mp3"
    );
    sounds.skills[SkillName.FREEZE] = safeLoadSound(
      "sounds/skills/cryo_freeze.mp3"
    );
    sounds.skills[SkillName.REJUVENATION] = safeLoadSound(
      "sounds/skills/rejuvenation.mp3"
    );
    sounds.skills[SkillName.INFERNAL_RAGE] = safeLoadSound(
      "sounds/skills/infernal_rage.mp3"
    );
    sounds.skills[SkillName.QUANTUM_ACCELERATION] = safeLoadSound(
      "sounds/skills/quantum_acceleration.mp3"
    );
    sounds.skills[SkillName.ATOMIC_BOMB] = safeLoadSound(
      "sounds/skills/apocalypse.mp3"
    );
    sounds.skills[SkillName.BARRIER] = safeLoadSound(
      "sounds/skills/barrier.mp3"
    );

    // Environment sounds
    sounds.environment.wind = safeLoadSound("sounds/environment/wind.mp3");

    // Power-up sounds
    sounds.powerups.collect = safeLoadSound("sounds/powerups/collect.mp3");
    sounds.powerups.spawn = safeLoadSound("sounds/powerups/spawn.mp3");

    console.log("Sound preloading completed");
  } catch (e) {
    console.error("Error in preloadSounds:", e);
  }
}

// Handle sound fallbacks if files don't load
function handleSoundLoadError() {
  try {
    // Create a dummy sound object with all required methods
    const createDummySound = () => {
      // Return a simple object with dummy methods
      return {
        play: () => {},
        stop: () => {},
        loop: () => {},
        isPlaying: () => false,
        setVolume: () => {},
        rate: () => {},
        pan: () => {},
        fade: () => {},
        // Flag to identify dummy sounds
        isDummy: true,
      };
    };

    // Create placeholder sounds for any that failed to load
    Object.keys(sounds).forEach((category) => {
      Object.keys(sounds[category]).forEach((soundName) => {
        if (!sounds[category][soundName]) {
          console.log(`Creating fallback for sound: ${category}.${soundName}`);
          sounds[category][soundName] = createDummySound();
        }
      });
    });

    console.log("Sound fallbacks created successfully");
  } catch (e) {
    console.error("Error creating sound fallbacks:", e);
  }
}

// ===== SOUND MANAGER =====
// Sound manager for tracking and optimizing sound playback
const soundManager = {
  // Properties
  activeSounds: [], // Currently playing sounds
  lastPlayedTime: {}, // Last time each sound type was played
  soundsThisFrame: {}, // Sounds requested this frame (for batching)
  frameStartTime: 0, // Start time of current frame
  frameRates: [], // Track recent frame rates
  performanceIssue: false, // Flag for performance issues

  // Initialize the sound manager
  init() {
    this.activeSounds = [];
    this.lastPlayedTime = {};
    this.frameStartTime = millis();
    this.soundsThisFrame = {};

    // Set up performance monitoring
    this.frameRates = [];
    this.performanceIssue = false;
  },

  // Start a new frame
  startFrame() {
    // Get current frame rate using p5.js built-in function
    const currentTime = millis();

    // Track frame rates for the last 10 frames using p5's frameRate()
    const fps = frameRate();
    this.frameRates.push(fps);
    if (this.frameRates.length > 10) {
      this.frameRates.shift();
    }

    // Check if we're experiencing performance issues
    if (this.frameRates.length >= 5) {
      const avgFps =
        this.frameRates.reduce((sum, fps) => sum + fps, 0) /
        this.frameRates.length;
      this.performanceIssue = avgFps < 30; // Consider it a performance issue if below 30 FPS
    }

    this.frameStartTime = currentTime;
    this.soundsThisFrame = {};
  },

  // End the current frame and process batched sounds
  endFrame() {
    if (!soundSettings.batchSounds) return;

    // Process batched sounds
    Object.keys(this.soundsThisFrame).forEach((soundKey) => {
      const batch = this.soundsThisFrame[soundKey];
      if (batch.count > 0) {
        // For batched sounds, we play one instance with adjusted volume
        const volumeMultiplier = Math.min(
          1.5,
          1 + Math.log10(batch.count) * 0.3
        );
        this._playSound(
          batch.sound,
          batch.volume * volumeMultiplier,
          batch.rate,
          batch.pan
        );
      }
    });
  },

  // Check if a sound can be played based on priority and cooldowns
  canPlaySound(soundType, priority) {
    const currentTime = millis();

    // Check cooldown
    if (soundSettings.soundCooldowns[soundType]) {
      const lastPlayed = this.lastPlayedTime[soundType] || 0;
      if (currentTime - lastPlayed < soundSettings.soundCooldowns[soundType]) {
        return false;
      }
    }

    // If we're at the max number of concurrent sounds, check priority
    if (soundSettings.dynamicCulling && this.performanceIssue) {
      // During performance issues, be more aggressive with culling
      if (priority < 5) return false; // Only play high priority sounds
    }

    if (this.activeSounds.length >= soundSettings.maxConcurrentSounds) {
      // Find the lowest priority active sound
      let lowestPriority = Infinity;
      let lowestPriorityIndex = -1;

      for (let i = 0; i < this.activeSounds.length; i++) {
        if (this.activeSounds[i].priority < lowestPriority) {
          lowestPriority = this.activeSounds[i].priority;
          lowestPriorityIndex = i;
        }
      }

      // If this sound has higher priority than the lowest one, stop the lowest one
      if (priority > lowestPriority && lowestPriorityIndex >= 0) {
        const soundToStop = this.activeSounds[lowestPriorityIndex];
        if (soundToStop.sound && soundToStop.sound.stop) {
          soundToStop.sound.stop();
        }
        this.activeSounds.splice(lowestPriorityIndex, 1);
      } else {
        // This sound has lower priority, don't play it
        return false;
      }
    }

    return true;
  },

  // Add a sound to the active sounds list
  addActiveSound(sound, priority, soundType) {
    // Update last played time for this sound type
    this.lastPlayedTime[soundType] = millis();

    // Add to active sounds
    this.activeSounds.push({
      sound,
      priority,
      startTime: millis(),
      soundType,
    });

    // Clean up finished sounds
    this.cleanupFinishedSounds();
  },

  // Request to play a sound (may be batched)
  requestSound(sound, volume, rate, pan, soundType, priority, batchKey) {
    if (!sound || soundSettings.muted) return;

    // If batching is enabled and this sound type can be batched
    if (
      soundSettings.batchSounds &&
      batchKey &&
      (soundType === "hit" || soundType === "shoot")
    ) {
      // Create or update batch
      if (!this.soundsThisFrame[batchKey]) {
        this.soundsThisFrame[batchKey] = {
          sound,
          volume,
          rate,
          pan,
          count: 0,
          priority,
        };
      }

      // Increment count for this batch
      this.soundsThisFrame[batchKey].count++;

      // For the first sound in a batch, or high priority sounds, play immediately
      if (this.soundsThisFrame[batchKey].count === 1 || priority >= 6) {
        if (this.canPlaySound(soundType, priority)) {
          this._playSound(sound, volume, rate, pan);
          this.addActiveSound(sound, priority, soundType);
        }
      }
    } else {
      // Non-batched sounds play immediately if they pass priority check
      if (this.canPlaySound(soundType, priority)) {
        this._playSound(sound, volume, rate, pan);
        this.addActiveSound(sound, priority, soundType);
      }
    }
  },

  // Actually play the sound (internal method)
  _playSound(sound, volume, rate, pan) {
    try {
      // Check if the sound object has the necessary methods
      if (!sound.play || !sound.setVolume) {
        return;
      }

      // Play the sound with specified parameters
      if (sound.rate) sound.rate(rate);
      if (sound.pan) sound.pan(pan);
      sound.setVolume(volume);
      sound.play();
    } catch (e) {
      console.warn("Error playing sound:", e);
    }
  },

  // Clean up finished sounds from the active sounds list
  cleanupFinishedSounds() {
    const currentTime = millis();
    this.activeSounds = this.activeSounds.filter((activeSound) => {
      // Remove sounds that have been playing for more than 5 seconds
      if (currentTime - activeSound.startTime > 5000) {
        return false;
      }

      // Remove sounds that are no longer playing
      if (
        activeSound.sound &&
        activeSound.sound.isPlaying &&
        !activeSound.sound.isPlaying()
      ) {
        return false;
      }

      return true;
    });
  },
};

// ===== SOUND SYSTEM CORE FUNCTIONS =====

// Initialize sound system - only call this after user interaction
function initSounds() {
  // If already initialized, don't do it again
  if (soundSystemInitialized) return;

  try {
    console.log("Initializing sound system after user interaction");

    // Check if p5.sound is available by testing if a sound object has the necessary methods
    const soundAvailable =
      sounds.music.main &&
      typeof sounds.music.main.setVolume === "function" &&
      typeof sounds.music.main.play === "function";

    if (soundAvailable) {
      // Resume AudioContext if it exists
      if (typeof getAudioContext === "function") {
        try {
          const audioContext = getAudioContext();
          if (audioContext && audioContext.state !== "running") {
            audioContext
              .resume()
              .then(() => {
                console.log("AudioContext resumed successfully");
              })
              .catch((err) => {
                console.warn("Error resuming AudioContext:", err);
              });
          }
        } catch (e) {
          console.warn("Error accessing AudioContext:", e);
        }
      }

      // Set master volume if the function exists
      if (typeof masterVolume === "function") {
        masterVolume(soundSettings.masterVolume);
      }

      // Set individual volumes for music
      Object.values(sounds.music).forEach((sound) => {
        if (sound && sound.setVolume) {
          sound.setVolume(soundSettings.musicVolume);
        }
      });

      // Initialize sound manager
      soundManager.init();

      // Don't automatically start ambient sounds - we'll do this when game starts
      console.log("Sound system initialized successfully");
      soundSystemInitialized = true;

      // Set muted to false now that we've initialized
      soundSettings.muted = false;
    } else {
      console.log("Sound objects not properly loaded. Creating fallbacks...");
      // Create fallbacks for sound objects
      handleSoundLoadError();
      soundSettings.muted = true;
    }
  } catch (e) {
    console.error("Error initializing sound system:", e);
    // Set muted to true as a fallback
    soundSettings.muted = true;
  }
}

// Update sound system - call this once per frame from the main game loop
function updateSoundSystem() {
  // Skip if sound system isn't initialized
  if (!soundSystemInitialized) return;

  // Start a new sound frame
  soundManager.startFrame();

  // Update ambient sounds
  updateAmbientSounds();

  // Clean up finished sounds
  soundManager.cleanupFinishedSounds();

  // Process any batched sounds
  soundManager.endFrame();
}

// Play a sound with specified volume and optional rate/pan
function playSound(
  sound,
  volume = 1.0,
  rate = 1.0,
  pan = 0,
  soundType = "generic",
  priority = 1
) {
  try {
    // Check if sound is available and not muted
    if (!sound || soundSettings.muted) return;

    // Check if the sound object has the necessary methods
    if (!sound.play || !sound.setVolume) {
      console.warn(
        "Sound object is missing required methods. Skipping playback."
      );
      return;
    }

    // Calculate final volume based on master volume
    const finalVolume = volume * soundSettings.masterVolume;

    // Use the sound manager to handle this sound request
    soundManager.requestSound(
      sound,
      finalVolume,
      rate,
      pan,
      soundType,
      priority
    );
  } catch (e) {
    console.warn("Error playing sound:", e);
  }
}

// Stop all sounds
function stopAllSounds() {
  // Stop all music
  Object.values(sounds.music).forEach((sound) => {
    if (sound && sound.isPlaying && sound.isPlaying()) sound.stop();
  });

  // Stop all environment sounds
  Object.values(sounds.environment).forEach((sound) => {
    if (sound && sound.isPlaying && sound.isPlaying()) sound.stop();
  });

  // Stop all combat sounds
  Object.values(sounds.combat).forEach((sound) => {
    if (sound && sound.isPlaying && sound.isPlaying()) sound.stop();
  });

  // Stop all skill sounds
  Object.values(sounds.skills).forEach((sound) => {
    if (sound && sound.isPlaying && sound.isPlaying()) sound.stop();
  });

  // Stop all UI sounds
  Object.values(sounds.ui).forEach((sound) => {
    if (sound && sound.isPlaying && sound.isPlaying()) sound.stop();
  });

  // Stop all powerup sounds
  Object.values(sounds.powerups).forEach((sound) => {
    if (sound && sound.isPlaying && sound.isPlaying()) sound.stop();
  });

  soundSettings.currentMusic = null;
}

// ===== VOLUME CONTROL FUNCTIONS =====

// Toggle mute all sounds
function toggleMute() {
  soundSettings.muted = !soundSettings.muted;

  try {
    // Check if p5.sound is available
    if (
      typeof p5 !== "undefined" &&
      p5.prototype.hasOwnProperty("masterVolume")
    ) {
      if (soundSettings.muted) {
        stopAllSounds();
      } else {
        // Restore master volume
        masterVolume(soundSettings.masterVolume);

        // Resume background music if it was playing
        if (soundSettings.currentMusic) {
          playMusic(soundSettings.currentMusic, 0.5);
        } else {
          // If no music was playing, start the main theme
          playMusic("main", 0.5);
        }
      }
    } else {
      console.warn(
        "p5.sound library not fully loaded. Mute state changed but volume control unavailable."
      );
    }
  } catch (e) {
    console.error("Error toggling mute:", e);
  }

  return soundSettings.muted;
}

// Set master volume
function setMasterVolume(volume) {
  soundSettings.masterVolume = constrain(volume, 0, 1);

  try {
    // Check if p5.sound is available
    if (
      typeof p5 !== "undefined" &&
      p5.prototype.hasOwnProperty("masterVolume")
    ) {
      masterVolume(soundSettings.masterVolume);
    } else {
      console.warn(
        "p5.sound library not fully loaded. Volume change requested but unavailable."
      );
    }
  } catch (e) {
    console.error("Error setting master volume:", e);
  }
}

// Set music volume
function setMusicVolume(volume) {
  soundSettings.musicVolume = constrain(volume, 0, 1);

  // Update volume of currently playing music
  if (soundSettings.currentMusic && sounds.music[soundSettings.currentMusic]) {
    sounds.music[soundSettings.currentMusic].setVolume(
      soundSettings.musicVolume
    );
  }
}

// Set SFX volume
function setSFXVolume(volume) {
  soundSettings.sfxVolume = constrain(volume, 0, 1);
}

// ===== SOUND PLAYBACK FUNCTIONS =====

// Play UI sound
function playUISound(soundName) {
  if (sounds.ui[soundName]) {
    // UI sounds have high priority
    const priority = soundSettings.soundPriority.ui || 10;
    playSound(
      sounds.ui[soundName],
      soundSettings.uiVolume,
      1.0,
      0,
      "ui",
      priority
    );
  }
}

// Play background music with crossfade
function playMusic(musicName, fadeTime = 2.0) {
  try {
    // Check if sound system is initialized
    if (!soundSystemInitialized) {
      // Just store the music name for later when sound is initialized
      soundSettings.currentMusic = musicName;
      console.log(
        `Sound system not initialized yet. Storing music name: ${musicName}`
      );
      return;
    }

    // Always update the current music name even if muted
    // This ensures we remember what should be playing when unmuted
    if (!sounds.music[musicName]) return;

    // Store the music name regardless of mute state
    soundSettings.currentMusic = musicName;

    // If muted, just store the music name but don't play
    if (soundSettings.muted) return;

    // Check if the sound object has the necessary methods
    if (
      !sounds.music[musicName].isPlaying ||
      !sounds.music[musicName].setVolume ||
      !sounds.music[musicName].loop
    ) {
      console.warn(
        `Music ${musicName} is missing required methods. Skipping playback.`
      );
      return;
    }

    // If same music is already playing, do nothing
    if (
      sounds.music[musicName].isPlaying &&
      sounds.music[musicName].isPlaying()
    ) {
      return;
    }

    // Fade out current music if playing
    if (
      soundSettings.currentMusic &&
      sounds.music[soundSettings.currentMusic] &&
      sounds.music[soundSettings.currentMusic].isPlaying &&
      sounds.music[soundSettings.currentMusic].isPlaying() &&
      soundSettings.currentMusic !== musicName
    ) {
      if (sounds.music[soundSettings.currentMusic].fade) {
        sounds.music[soundSettings.currentMusic].fade(0, fadeTime);
      } else {
        sounds.music[soundSettings.currentMusic].setVolume(0);
      }
    }

    // Play the new music
    sounds.music[musicName].setVolume(0);
    sounds.music[musicName].loop();

    // Fade in new music
    if (sounds.music[musicName].fade) {
      sounds.music[musicName].setVolume(soundSettings.musicVolume, fadeTime);
    } else {
      // Manually implement fade if the fade method is not available
      let startTime = millis();
      let fadeInterval = setInterval(() => {
        let elapsed = (millis() - startTime) / 1000;
        let progress = elapsed / fadeTime;
        if (progress >= 1) {
          sounds.music[musicName].setVolume(soundSettings.musicVolume);
          clearInterval(fadeInterval);
        } else {
          sounds.music[musicName].setVolume(
            soundSettings.musicVolume * progress
          );
        }
      }, 50);
    }

    console.log(`Now playing: ${musicName}`);
  } catch (e) {
    console.error(`Error playing music ${musicName}:`, e);
  }
}

// Play ambient sounds based on game state
function updateAmbientSounds() {
  // Only play ambient sounds if not muted
  if (soundSettings.muted) {
    // If muted, make sure ambient sounds are paused
    if (
      sounds.environment.wind &&
      sounds.environment.wind.isPlaying &&
      sounds.environment.wind.isPlaying()
    ) {
      sounds.environment.wind.pause();
    }
    return;
  }

  // Adjust wind sound based on camera height
  if (sounds.environment.wind) {
    const windVolume = map(cameraZoom, 300, 1000, 0.1, 0.4);
    sounds.environment.wind.setVolume(windVolume * soundSettings.sfxVolume);

    if (!sounds.environment.wind.isPlaying()) {
      sounds.environment.wind.loop();
    }
  }
}

// Play skill sound - using skill names for better readability
function playSkillSound(skillName) {
  if (sounds.skills[skillName]) {
    // Use specific skill volume if available, otherwise use default sfx volume
    const volume =
      soundSettings.skillVolume && soundSettings.skillVolume[skillName]
        ? soundSettings.skillVolume[skillName]
        : soundSettings.sfxVolume;

    // Skills have high priority
    const priority = soundSettings.soundPriority.skills || 8;

    playSound(sounds.skills[skillName], volume, 1.0, 0, "skill", priority);
  }
}

// Play combat sound with optional position-based panning
function playCombatSound(soundName, x = 0, y = 0, volume = 1.0) {
  if (sounds.combat[soundName]) {
    // Calculate pan based on x position relative to screen center
    const screenCenterX = width / 2;
    const pan = constrain((x - screenCenterX) / screenCenterX, -1, 1) * 0.7;

    // Calculate volume falloff based on distance from camera
    const distanceFromCamera = abs(y - cameraOffsetY) / height;
    const distanceVolume = constrain(1 - distanceFromCamera * 0.5, 0.3, 1);

    // Use specific combat volume if available, otherwise use default sfx volume
    const combatVolumeMultiplier =
      soundSettings.combatVolume && soundSettings.combatVolume[soundName]
        ? soundSettings.combatVolume[soundName]
        : 1.0;

    // Get priority for this sound type
    const priority =
      soundSettings.soundPriority[soundName] ||
      (soundName === "criticalHit"
        ? 6
        : soundName === "explosion"
        ? 5
        : soundName === "hit"
        ? 3
        : soundName === "shoot"
        ? 2
        : 4);

    // For sounds that can be batched, create a batch key
    const batchKey =
      soundName === "hit" || soundName === "shoot"
        ? `${soundName}_${Math.floor(x / 100)}_${Math.floor(y / 100)}`
        : null;

    // Calculate final volume
    const finalVolume =
      soundSettings.sfxVolume *
      combatVolumeMultiplier *
      volume *
      distanceVolume;

    // Request the sound through the sound manager
    soundManager.requestSound(
      sounds.combat[soundName],
      finalVolume,
      1.0,
      pan,
      soundName,
      priority,
      batchKey
    );
  }
}

// Play random hit sound with variation
function playRandomHitSound(x, y, isCritical = false) {
  // Start a new sound frame to track batched sounds
  soundManager.startFrame();

  if (isCritical) {
    playCombatSound("criticalHit", x, y, 1.0);
  } else {
    // For regular hits, randomize volume slightly
    const hitVolume = random(0.8, 1.0);

    // For regular hits, we'll use the sound manager's batching system
    playCombatSound("hit", x, y, hitVolume);
  }

  // Process any batched sounds at the end of the frame
  soundManager.endFrame();
}

// Play explosion sound with size-based variations
function playExplosionSound(x, y, size = 1.0) {
  // Start a new sound frame
  soundManager.startFrame();

  // Larger explosions have lower pitch and higher volume
  const rate = map(size, 0.5, 3, 1.2, 0.7);
  const volume = map(size, 0.5, 3, 0.7, 1.0);

  // For explosions, we'll use a higher priority for larger explosions
  const priority =
    soundSettings.soundPriority.explosion +
    (size > 2.0 ? 2 : size > 1.0 ? 1 : 0);

  // Use the sound manager to play the explosion sound
  if (sounds.combat.explosion) {
    // Calculate pan based on x position
    const screenCenterX = width / 2;
    const pan = constrain((x - screenCenterX) / screenCenterX, -1, 1) * 0.7;

    // Calculate volume falloff based on distance
    const distanceFromCamera = abs(y - cameraOffsetY) / height;
    const distanceVolume = constrain(1 - distanceFromCamera * 0.5, 0.3, 1);

    // Calculate final volume
    const finalVolume =
      soundSettings.sfxVolume *
      (soundSettings.combatVolume.explosion || 1.0) *
      volume *
      distanceVolume;

    // Request the sound directly through the sound manager
    soundManager.requestSound(
      sounds.combat.explosion,
      finalVolume,
      rate,
      pan,
      "explosion",
      priority
    );
  }

  // Process any batched sounds
  soundManager.endFrame();
}

// ===== DEBUGGING AND STATISTICS =====

// Debug function to show sound statistics (can be called from the debug overlay)
function getSoundStats() {
  return {
    activeSounds: soundManager.activeSounds.length,
    maxSounds: soundSettings.maxConcurrentSounds,
    performanceIssue: soundManager.performanceIssue,
    muted: soundSettings.muted,
    currentMusic: soundSettings.currentMusic,
  };
}

let isMobileDevice = false;
let performanceMode = PerformanceLevel.AUTO;
let currentPerformanceLevel = PerformanceLevel.HIGH; // Will be set based on device detection
let fpsHistory = [];
let lastPerformanceCheck = 0;
let performanceCheckInterval = 300; // Check every 5 seconds (300 frames at 60fps)

// Font
let gameFont;

const MIN_ZOOM = -10_000; // Minimum zoom level to ensure the bridge is visible
const MAX_ZOOM = 10_000; // Maximum zoom level for when players want to zoom out further
let isDragging = false;
let prevMouseX, prevMouseY;

// Wall and gate dimensions
const WALL_HEIGHT = 180;
const WALL_THICKNESS = 20;
const GATE_WIDTH = 150;
const GATE_HEIGHT = WALL_HEIGHT - 10;

// Game dimensions
const BRIDGE_LENGTH = 5000; // Significantly increased bridge length to fully fill the screen
const BRIDGE_WIDTH = 400;
const POWER_UP_LANE_WIDTH = 150;

// Camera settings
const CAMERA_OFFSET_X = -(POWER_UP_LANE_WIDTH / 2);
const CAMERA_OFFSET_Y = -600; // Even more significantly adjusted to show the squad at the bottom of the screen
const CAMERA_OFFSET_Z = 270; // Base zoom distance for reference (will be adjusted dynamically)
const CAMERA_ZOOM_HEIGHT_RATIO = 0.45; // Ratio of zoom to screen height
const SQUAD_Y = -200;
const WALL_Y = SQUAD_Y + 100;
const ENEMY_FIGHT_DISTANCE_THRESHOLD = 500;

const TOTAL_WIDTH = BRIDGE_WIDTH + POWER_UP_LANE_WIDTH;

// Debug mode for testing
const DEBUG_MODE = false; // Set to true for easier testing, false for normal gameplay

// Configurable game parameters
const SQUAD_X = 0;
const SQUAD_Z = 40;
const SQUAD_HEALTH = DEBUG_MODE ? 500 : 100; // Higher health in debug mode
const MAX_SQUAD_MEMBERS_PER_ROW = 9; // Number of squad members in a row before stacking vertically
const ENEMIES_TO_KILL_FOR_NEXT_WAVE = DEBUG_MODE ? 10 : 30; // Fewer enemies needed in debug mode
const MIRROR_POWERUP_SPAWN_RATE = DEBUG_MODE ? 30 : 10; // Frames between mirror power-up spawns (0.5s in debug)
const MAX_POWER_UPS = 20; // Maximum number of power-ups allowed on screen

// Colors
const BRIDGE_COLOR = [150, 150, 150];
const POWER_UP_LANE_COLOR = [100, 200, 250];
const SQUAD_COLOR = [0, 200, 0];
const ENEMY_COLORS = {
  standard: [255, 0, 0],
  elite: [255, 100, 0],
  boss1: [200, 0, 100],
  boss2: [150, 0, 150],
  boss3: [100, 0, 200],
};
const WEAPON_COLORS = {
  blaster: [0, 255, 0],
  thunderbolt: [255, 255, 0],
  inferno: [255, 100, 0],
  frostbite: [0, 200, 255],
  vortex: [150, 0, 255],
  plasma: [255, 0, 255],
  photon: [200, 255, 200],
  mirror: [255, 255, 255], // Add mirror type
};

// Squad properties
const HUMAN_SIZE = 30;
const SQUAD_SIZE = 9; // Maximum number of squad members
let squad = [];
let squadSpeed = 10;
let squadFireRate = 30; // frames between shots (faster firing rate)
let lastFireTime = 0;

// Skill upgrade tracking
let fireRateBoost = DEBUG_MODE ? 10 : 0; // Reduces time between shots (starts with some in debug mode)
let damageBoost = DEBUG_MODE ? 10 : 0; // Increases damage (starts with some in debug mode)
let aoeBoost = DEBUG_MODE ? 10 : 0; // Increases area of effect (starts with some in debug mode)
let cameraOffsetX = CAMERA_OFFSET_X;
let cameraOffsetY = CAMERA_OFFSET_Y;
let cameraZoom = CAMERA_OFFSET_Z; // Will be set dynamically in setup

// Enemy properties
let enemies = [];
let lastEnemySpawn = 0;

const ENEMY_SPAWN_RATE = 45; // frames between spawns (much faster)
const STANDARD_ENEMY_SIZE = 25;
const ELITE_ENEMY_SIZE = 35;
const BOSS_SIZES = [50, 70, 90];
const ENEMIES_PER_ROW = 5 * 2; // Number of enemies per row when spawning

// Projectiles
let projectiles = [];
const PROJECTILE_SPEED = 12 * 1.5; // Faster projectiles
const PROJECTILE_SIZE = 30;

// Visual effects
let effects = [];
const EFFECT_DURATION = 30 * 0.5; // frames

// Power-ups
let powerUps = [];
const POWER_UP_SIZE = 60;
const POWER_UP_SPAWN_RATE = 90 * 1; // frames between power-up spawns (continuous spawning)
const WEAPON_SPAWN_CHANCE = DEBUG_MODE ? 1 : 0.1; // chance for weapon
const SKILL_SPAWN_CHANCE = 0.3; // chance for skill
let lastPowerUpSpawn = 0;
const POWER_UP_SPEED = 3 * 2; // Speed at which power-ups move down the lane

// Weapons inventory (false means locked, true means available)
let weapons = {
  thunderbolt: true,
  blaster: false,
  inferno: false,
  frostbite: false,
  vortex: false,
  plasma: false,
  photon: false,
};

const WEAPON_TYPES = [
  "thunderbolt",
  "blaster",
  "inferno",
  "frostbite",
  "vortex",
  "plasma",
  "photon",
];
const SKILL_TYPES = ["fire_rate", "damage", "aoe"];

// Currently equipped weapon
let currentWeapon = WEAPON_TYPES[0];

// Skills cooldowns and durations in frames (60 frames = 1 second)
// Player skills with cooldowns and durations
let skills = {
  [SkillName.STAR_BLAST]: {
    cooldown: 300,
    lastUsed: -10_000,
    active: false,
    activeDuration: 180, // Star Blast duration (3 seconds = 180 frames at 60fps)
    endTime: 0,
  },
  [SkillName.MACHINE_GUN]: {
    cooldown: 600,
    lastUsed: -10_000,
    active: false,
    activeDuration: 300, // Machine Gun duration (5 seconds = 300 frames at 60fps)
    endTime: 0,
  },
  [SkillName.SHIELD]: {
    cooldown: 600,
    lastUsed: -10_000,
    active: false,
    activeDuration: 300, // Shield duration (5 seconds = 300 frames at 60fps)
    endTime: 0,
  },
  [SkillName.FREEZE]: {
    cooldown: 600,
    lastUsed: -10_000,
    active: false,
    activeDuration: 180, // Freeze duration (3 seconds = 180 frames at 60fps)
    endTime: 0,
  },
  [SkillName.REJUVENATION]: {
    cooldown: 600,
    lastUsed: -10_000,
    active: false,
    activeDuration: 120, // Rejuvenation duration (2 seconds = 120 frames at 60fps)
    endTime: 0,
  },
  [SkillName.INFERNAL_RAGE]: {
    cooldown: 600,
    lastUsed: -10_000,
    active: false,
    activeDuration: 120, // Infernal Rage duration (2 seconds = 120 frames at 60fps)
    endTime: 0,
  },
  [SkillName.QUANTUM_ACCELERATION]: {
    cooldown: 600,
    lastUsed: -10_000,
    active: false,
    activeDuration: 120, // Quantum Acceleration duration (2 seconds = 120 frames at 60fps)
    endTime: 0,
  },
  [SkillName.ATOMIC_BOMB]: {
    cooldown: 600,
    lastUsed: -10_000,
    active: false,
    activeDuration: 120, // Apocalyptic Devastation duration (2 seconds = 120 frames at 60fps)
    endTime: 0,
  },
  [SkillName.BARRIER]: {
    cooldown: 480,
    lastUsed: -10_000,
    active: false,
    endTime: 0,
    health: 5_000, // Barrier health
    activeDuration: 120, // Barrier duration (2 seconds = 120 frames at 60fps)
    maxBarriers: 5, // Maximum number of barriers allowed
    activeBarriers: 0, // Current number of active barriers
  },
};

let squadLeader = {
  x: SQUAD_X,
  y: SQUAD_Y, // Starting extremely far from the wall to be clearly visible at the bottom of the screen
  z: SQUAD_Z,
  size: HUMAN_SIZE,
  health: SQUAD_HEALTH, // Use configurable health
  weapon: currentWeapon,
  id: Date.now(), // Unique ID for reference
};

// Font and sound loading
function preload() {
  // Load a default system font
  gameFont = loadFont(
    "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf"
  );

  // Load all game sounds
  try {
    preloadSounds();
  } catch (e) {
    console.warn("Error loading sounds:", e);
  }
}

// Game setup
// Track and manage memory issues
// Using MemoryManager for memory tracking instead of global variables

// ===== PERFORMANCE MANAGEMENT =====
const PerformanceManager = {
  gpuInfo: null,
  gpuTier: 0, // 0=unknown, 1=low, 2=medium, 3=high
  targetFPS: 60, // Default target FPS
  frameRateLimited: false, // Track if we've limited the frame rate
  lastFPSAdjustment: 0, // Last time we adjusted the frame rate
  benchmarkComplete: false, // Flag to track if initial benchmark is complete

  // Detect GPU capabilities
  detectGPUCapabilities: function () {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

      if (!gl) {
        console.warn("WebGL not supported");
        return false;
      }

      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

        this.gpuInfo = {
          vendor: vendor,
          renderer: renderer,
          maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
          maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
          extensions: gl.getSupportedExtensions(),
        };

        // Determine GPU tier based on renderer string
        const rendererLower = renderer.toLowerCase();

        // Check for high-end GPUs
        if (
          (rendererLower.includes("nvidia") &&
            !rendererLower.includes("mobile")) ||
          (rendererLower.includes("amd") &&
            !rendererLower.includes("mobile")) ||
          rendererLower.includes("metal") || // Apple Metal GPU
          rendererLower.includes("apple") || // Apple GPU
          (rendererLower.includes("intel") &&
            (rendererLower.includes("iris") ||
              rendererLower.includes("hd 6") ||
              rendererLower.includes("uhd")))
        ) {
          this.gpuTier = 3; // High-end
        }
        // Check for mid-range GPUs
        else if (
          rendererLower.includes("intel") ||
          rendererLower.includes("mali-t") ||
          rendererLower.includes("adreno 6") ||
          // Add more mid-range mobile GPUs
          rendererLower.includes("mali-g") ||
          rendererLower.includes("adreno 5") ||
          rendererLower.includes("apple a12") ||
          rendererLower.includes("apple a13")
        ) {
          this.gpuTier = 2; // Mid-range
        }
        // Everything else is considered low-end
        else {
          this.gpuTier = 1; // Low-end
        }

        console.log("GPU Tier:", this.gpuTier);
        return true;
      }
    } catch (e) {
      console.warn("Error detecting GPU:", e);
    }

    return false;
  },

  // Detect if the device is mobile
  detectMobileDevice: function () {
    // Check if the device has touch capability
    const hasTouchScreen =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0;

    // Check user agent for mobile devices
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(
        userAgent
      );

    // Check screen size (typical mobile width is less than 768px)
    const hasSmallScreen = window.innerWidth < 768;

    // Consider it a mobile device if it has a touch screen and either has a mobile user agent or small screen
    return hasTouchScreen && (isMobile || hasSmallScreen);
  },

  // Calculate average FPS from history
  getAverageFPS: function () {
    if (fpsHistory.length === 0) return 60; // Default to 60 if no history
    return fpsHistory.reduce((sum, fps) => sum + fps, 0) / fpsHistory.length;
  },

  // Get stable FPS (removing outliers)
  getStableFPS: function () {
    if (fpsHistory.length < 5) return this.getAverageFPS();

    // Sort FPS values
    const sortedFPS = [...fpsHistory].sort((a, b) => a - b);

    // Remove top and bottom 10% to eliminate outliers
    const cutoff = Math.floor(sortedFPS.length * 0.1);
    const stableFPS = sortedFPS.slice(cutoff, sortedFPS.length - cutoff);

    // Calculate average of remaining values
    return stableFPS.reduce((sum, fps) => sum + fps, 0) / stableFPS.length;
  },

  // Set performance level based on device, GPU and FPS
  setPerformanceLevel: function () {
    if (performanceMode !== PerformanceLevel.AUTO) {
      currentPerformanceLevel = performanceMode;
      return;
    }

    // Try to detect GPU capabilities if not already done
    if (!this.gpuInfo) {
      this.detectGPUCapabilities();
    }

    const avgFPS = this.getAverageFPS();
    const stableFPS = this.getStableFPS();

    // If we're on a mobile device, use more conservative settings
    if (isMobileDevice) {
      // Start with medium as default for mobile
      currentPerformanceLevel = PerformanceLevel.MEDIUM;

      // If we have GPU info, use it to refine our decision
      if (this.gpuTier === 3) {
        // High-end mobile GPU can handle medium settings
        currentPerformanceLevel = PerformanceLevel.MEDIUM;
      } else if (this.gpuTier === 1) {
        // Low-end mobile GPU should use low settings
        currentPerformanceLevel = PerformanceLevel.LOW;
      }

      // If we have enough FPS history and it's consistently low, adjust down
      if (fpsHistory.length >= 10) {
        if (stableFPS < 45) {
          currentPerformanceLevel = PerformanceLevel.LOW;
        } else if (
          stableFPS > 55 &&
          currentPerformanceLevel === PerformanceLevel.LOW
        ) {
          // If we're getting good performance on LOW, try upgrading to MEDIUM
          currentPerformanceLevel = PerformanceLevel.MEDIUM;
        }
      }

      // Set target FPS based on device capabilities
      // For mobile, we aim for stable 60 FPS on high-end, 45-60 on mid-range
      if (this.gpuTier === 3) {
        this.targetFPS = 60;
      } else if (this.gpuTier === 2) {
        this.targetFPS = stableFPS > 55 ? 60 : 45;
      } else {
        this.targetFPS = 30; // Low-end devices target 30 FPS
      }
    } else {
      // On desktop, start with high performance
      currentPerformanceLevel = PerformanceLevel.HIGH;
      this.targetFPS = 60; // Desktop always targets 60 FPS

      // If we have GPU info, use it to refine our decision
      if (this.gpuTier === 1) {
        // Low-end desktop GPU should use medium settings
        currentPerformanceLevel = PerformanceLevel.MEDIUM;
      }

      // If we have enough FPS history and it's consistently low, adjust
      if (fpsHistory.length >= 10) {
        if (stableFPS < 45) {
          currentPerformanceLevel = PerformanceLevel.MEDIUM;
        } else if (stableFPS < 30) {
          currentPerformanceLevel = PerformanceLevel.LOW;
        }
      }
    }

    // Apply frame rate limiting if needed
    this.applyFrameRateLimiting();

    console.log(
      "Performance level set to:",
      currentPerformanceLevel,
      "Target FPS:",
      this.targetFPS
    );
  },

  // Apply frame rate limiting based on device capabilities
  applyFrameRateLimiting: function () {
    // Only adjust frame rate every 5 seconds to avoid constant changes
    const now = millis();
    if (now - this.lastFPSAdjustment < 5000 && this.frameRateLimited) return;

    this.lastFPSAdjustment = now;

    // If we're on a mobile device, limit the frame rate to our target
    if (isMobileDevice) {
      frameRate(this.targetFPS);
      this.frameRateLimited = true;
    } else {
      // On desktop, we can use the default frame rate
      frameRate(60);
      this.frameRateLimited = true;
    }
  },

  // Get multipliers for effect counts based on performance level
  getEffectMultiplier: function () {
    // More aggressive reduction for mobile
    if (isMobileDevice) {
      switch (currentPerformanceLevel) {
        case PerformanceLevel.LOW:
          return 0.2; // 20% of normal effects
        case PerformanceLevel.MEDIUM:
          return 0.4; // 40% of normal effects
        case PerformanceLevel.HIGH:
          return 0.7; // 70% of normal effects
        default:
          return 0.4; // Default to medium
      }
    } else {
      // Desktop can handle more effects
      switch (currentPerformanceLevel) {
        case PerformanceLevel.LOW:
          return 0.3; // 30% of normal effects
        case PerformanceLevel.MEDIUM:
          return 0.6; // 60% of normal effects
        case PerformanceLevel.HIGH:
          return 1.0; // 100% of normal effects
        default:
          return 0.6; // Default to medium
      }
    }
  },

  // Apply performance settings to WebGL context
  applyWebGLSettings: function () {
    try {
      // Configure WebGL settings based on performance level
      // Use a consistent set of attributes to avoid shader recompilation issues
      const attributes = {
        antialias: currentPerformanceLevel !== PerformanceLevel.LOW,
        alpha: true,
        depth: true,
        preserveDrawingBuffer: false,
        perPixelLighting:
          currentPerformanceLevel === PerformanceLevel.HIGH && !isMobileDevice,
      };

      // Apply all attributes at once to avoid partial state changes
      setAttributes(attributes);

      // Disable texture mipmapping to save memory
      textureMode(NORMAL);

      // Enable hardware acceleration hints if renderer is available
      if (typeof _renderer !== "undefined" && _renderer.GL) {
        const gl = _renderer.GL;

        // Use fastest hint for mipmaps and shader derivatives
        gl.hint(gl.GENERATE_MIPMAP_HINT, gl.FASTEST);
        if (gl.FRAGMENT_SHADER_DERIVATIVE_HINT) {
          gl.hint(gl.FRAGMENT_SHADER_DERIVATIVE_HINT, gl.FASTEST);
        }

        // Set consistent blending mode
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Ensure depth test is enabled for 3D rendering
        gl.enable(gl.DEPTH_TEST);

        // Set depth function to less than or equal for better z-fighting handling
        gl.depthFunc(gl.LEQUAL);

        // Reset any custom shaders to default to avoid 'totalLight' errors
        resetShader();
      }

      console.log(
        "WebGL settings applied for performance level:",
        currentPerformanceLevel
      );
    } catch (e) {
      console.error("Error applying WebGL settings:", e);
    }
  },

  // Run a quick benchmark to determine optimal settings
  runBenchmark: function () {
    if (this.benchmarkComplete) return;

    console.log("Running performance benchmark...");

    // Clear FPS history to start fresh
    fpsHistory = [];

    // Set a timer to evaluate performance after 3 seconds
    setTimeout(() => {
      const benchmarkFPS = this.getStableFPS();
      console.log("Benchmark FPS:", benchmarkFPS);

      // Set initial performance level based on benchmark
      if (benchmarkFPS < 30) {
        currentPerformanceLevel = PerformanceLevel.LOW;
        this.targetFPS = 30;
      } else if (benchmarkFPS < 50) {
        currentPerformanceLevel = PerformanceLevel.MEDIUM;
        this.targetFPS = 45;
      } else {
        currentPerformanceLevel = PerformanceLevel.HIGH;
        this.targetFPS = 60;
      }

      // Apply settings
      this.applyWebGLSettings();
      this.applyFrameRateLimiting();

      console.log(
        "Benchmark complete. Performance level:",
        currentPerformanceLevel
      );
      this.benchmarkComplete = true;
    }, 3000);
  },

  // Check if we can use advanced GPU features
  canUseAdvancedFeatures: function () {
    return (
      this.gpuTier >= 2 && currentPerformanceLevel !== PerformanceLevel.LOW
    );
  },

  // Get distance for object culling based on performance level
  getCullingDistance: function () {
    if (isMobileDevice) {
      switch (currentPerformanceLevel) {
        case PerformanceLevel.LOW:
          return 2000; // Aggressive culling
        case PerformanceLevel.MEDIUM:
          return 3000;
        case PerformanceLevel.HIGH:
          return 4000;
        default:
          return 3000;
      }
    } else {
      return 5000; // Desktop can render further
    }
  },
};

// Wrapper functions for backward compatibility
function detectMobileDevice() {
  return PerformanceManager.detectMobileDevice();
}

function setPerformanceLevel() {
  PerformanceManager.setPerformanceLevel();
}

function getEffectMultiplier() {
  return PerformanceManager.getEffectMultiplier();
}

// Check if GPU acceleration is enabled
function isGPUAccelerationEnabled() {
  return gpuAccelerationEnabled;
}

function setup() {
  try {
    pixelDensity(1);
    // Create WebGL canvas with error handling
    try {
      createCanvas(windowWidth, windowHeight, WEBGL);
    } catch (e) {
      console.error("Error creating WebGL canvas:", e);
      // Try again with default renderer as fallback
      createCanvas(windowWidth, windowHeight);
    }

    // Detect if we're on a mobile device
    isMobileDevice = PerformanceManager.detectMobileDevice();
    console.log("Mobile device detected:", isMobileDevice);

    // Set WebGL attributes based on device
    if (isMobileDevice) {
      console.log("Using mobile-optimized WebGL settings");
      // Use more conservative WebGL settings for mobile
      try {
        setAttributes("antialias", false);
        setAttributes("alpha", false);
        setAttributes("depth", true);
        setAttributes("preserveDrawingBuffer", false);
      } catch (e) {
        console.warn("Error setting WebGL attributes:", e);
      }
    }

    // Add orientation change listener for mobile devices
    if (isMobileDevice) {
      // Use multiple methods to detect orientation changes for better cross-browser support

      // Method 1: matchMedia (modern browsers)
      if (window.matchMedia) {
        window
          .matchMedia("(orientation: portrait)")
          .addEventListener("change", handleOrientationChange);
      }

      // Method 2: orientationchange event (older mobile browsers)
      window.addEventListener("orientationchange", handleOrientationChange);

      // Method 3: resize event as fallback (will catch orientation changes too)
      window.addEventListener("resize", debounce(handleOrientationChange, 250));
    }

    // Function to handle orientation changes
    function handleOrientationChange() {
      // Use a single timeout with a longer delay to ensure the browser has fully
      // updated dimensions and WebGL context is stable
      setTimeout(() => {
        // Force WebGL context reset to prevent WebGL errors
        try {
          // Get the current WebGL canvas
          const canvas = document.querySelector("canvas");
          if (canvas) {
            // Resize canvas to trigger WebGL context refresh
            resizeCanvas(windowWidth, windowHeight);

            // Update perspective for the new aspect ratio
            perspective(PI / 4, width / height, 0.1, 5000);

            // Update camera zoom based on new dimensions
            cameraZoom = calculateDynamicCameraZoom();

            console.log(
              `Orientation update: zoom=${cameraZoom.toFixed(
                2
              )}, dimensions=${windowWidth}x${windowHeight}`
            );
          }
        } catch (e) {
          console.error("Error handling orientation change:", e);
        }
      }, 500); // Single longer delay to ensure stability
    }

    // Helper function to update camera zoom with delay (kept for compatibility)
    function updateCameraZoomWithDelay(delay) {
      setTimeout(() => {
        cameraZoom = calculateDynamicCameraZoom();
        console.log(
          `Orientation update (${delay}ms): zoom=${cameraZoom.toFixed(2)}`
        );
      }, delay);
    }

    // Debounce function to limit how often a function can be called
    function debounce(func, wait) {
      let timeout;
      return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
      };
    }

    // Detect GPU capabilities
    PerformanceManager.detectGPUCapabilities();

    // Set initial performance level
    PerformanceManager.setPerformanceLevel();

    // Apply WebGL settings based on performance level
    PerformanceManager.applyWebGLSettings();

    // Set the font for all text
    textFont(gameFont);
  } catch (e) {
    console.error("Error in setup:", e);
  }

  // Initialize the squad with a single member
  squad.push(squadLeader);

  // Set perspective for better 3D view with increased far plane to see the entire bridge
  perspective(PI / 4, width / height, 0.1, 5000);

  // Set dynamic camera zoom based on screen dimensions
  cameraZoom = calculateDynamicCameraZoom();

  // Add WebGL context lost/restored event handlers
  const canvas = document.querySelector("canvas");
  if (canvas) {
    // Handle WebGL context loss
    canvas.addEventListener(
      "webglcontextlost",
      function (e) {
        console.warn("WebGL context lost. Preventing default behavior.");
        e.preventDefault(); // Allow context to be restored

        // Notify user of the issue
        alert(
          "Graphics context was lost. The game will try to recover automatically."
        );
      },
      false
    );

    // Handle WebGL context restoration
    canvas.addEventListener(
      "webglcontextrestored",
      function () {
        console.log("WebGL context restored. Reinitializing...");

        try {
          // Reset any custom shaders to default
          resetShader();

          // Reapply WebGL settings
          PerformanceManager.applyWebGLSettings();

          // Reset perspective
          perspective(PI / 4, width / height, 0.1, 5000);

          // Recalculate camera zoom
          cameraZoom = calculateDynamicCameraZoom();

          // Force a redraw
          redraw();

          console.log("WebGL context successfully restored");
        } catch (e) {
          console.error("Error during WebGL context restoration:", e);

          // Try to recover by reloading the page if restoration fails
          if (
            confirm(
              "Graphics recovery failed. Would you like to reload the game?"
            )
          ) {
            window.location.reload();
          }
        }
      },
      false
    );
  }

  // Initialize GPU acceleration systems if supported
  if (PerformanceManager.canUseAdvancedFeatures()) {
    console.log("Initializing GPU acceleration features");

    // Use the centralized GPU acceleration initialization
    if (typeof initGPUAcceleration === "function") {
      const gpuInitialized = initGPUAcceleration();
      if (gpuInitialized) {
        console.log("GPU acceleration successfully initialized");
        gpuAccelerationEnabled = true;
      } else {
        console.warn(
          "GPU acceleration initialization failed, falling back to CPU"
        );
        gpuAccelerationEnabled = false;
      }
    } else {
      console.warn(
        "GPU acceleration module not found, using individual initializations"
      );

      // Track successful initializations
      let particlesInitialized = false;
      let rendererInitialized = false;
      let collisionInitialized = false;

      // Fallback to individual initializations
      // Initialize GPU-based particle system
      try {
        if (typeof initGPUParticles === "function") {
          initGPUParticles();
          console.log("GPU Particle system initialized");
          particlesInitialized = true;
        }
      } catch (e) {
        console.warn("Could not initialize GPU particles:", e);
      }

      // Initialize GPU-based renderer for effects
      try {
        if (typeof initGPURenderer === "function") {
          initGPURenderer();
          console.log("GPU Renderer initialized");
          rendererInitialized = true;
        }
      } catch (e) {
        console.warn("Could not initialize GPU renderer:", e);
      }

      // Initialize spatial partitioning for collision detection
      try {
        if (typeof initCollisionSystem === "function") {
          initCollisionSystem();
          console.log("Collision system initialized");
          collisionInitialized = true;
        }
      } catch (e) {
        console.warn("Could not initialize collision system:", e);
      }

      // Consider GPU acceleration enabled if at least one system was initialized
      gpuAccelerationEnabled =
        particlesInitialized || rendererInitialized || collisionInitialized;
      console.log(
        "GPU acceleration status:",
        gpuAccelerationEnabled ? "Enabled" : "Disabled"
      );
    }
  } else {
    console.log("Advanced GPU features not available, using CPU rendering");
    gpuAccelerationEnabled = false;

    // Initialize basic collision system even without GPU acceleration
    try {
      if (typeof initCollisionSystem === "function") {
        initCollisionSystem();
        console.log("Basic collision system initialized");
      }
    } catch (e) {
      console.warn("Could not initialize collision system:", e);
    }
  }

  // Optimize WebGL context for performance if available
  if (typeof optimizeWebGLContext === "function") {
    try {
      optimizeWebGLContext();
    } catch (e) {
      console.warn("Could not optimize WebGL context:", e);
    }
  }

  // Auto-start the game (no need to press enter)
  gameStartTime = frameCount;

  // Create all UI elements
  initializeUI();

  // Clean up memory
  cleanupMemory();

  // Set sound as initially muted until user interaction
  if (typeof soundSettings !== "undefined") {
    soundSettings.muted = true;
  }
}

function touchMoved() {
  // Prevent default touch behavior during movement
  if (isMobileDevice) {
    return false;
  }
  return true;
}

function touchEnded() {
  // Prevent default touch behavior when touch ends
  if (isMobileDevice) {
    return false;
  }
  return true;
}

// Prevent double-tap zoom on mobile
document.addEventListener(
  "touchstart",
  function (event) {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  },
  { passive: false }
);

// Initialize all UI elements
function initializeUI() {
  createUiUsingDomElements();
  createPerformanceSettingsUI();
}

function createUiUsingDomElements() {
  // Create the HUD DOM elements
  createStatusBoardElements();
  createTechnicalBoardElements();
  // Create Menu - Control
  createMenuElement();
  // Create controls container with pause/resume, sound, and settings buttons
  createControlsContainer();
  createGameOverElement();
  // Create skill bar and d-pad inside the container
  createDirectionalPadElement();
  createSkillBarElement();
  // Create sound toggle button but don't initialize sounds yet
  createSoundToggleButton();
}

// ===== MEMORY MANAGEMENT =====
const MemoryManager = {
  warningOverlay: null,
  warningShown: false,
  lastWarningTime: 0,

  // Create memory warning overlay if needed
  createWarningOverlay: function () {
    if (this.warningOverlay) return;

    if (window.performance && window.performance.memory) {
      this.warningOverlay = createStyledContainer(width / 2 - 150, 50, 300, {
        styles: {
          backgroundColor: "rgba(255, 0, 0, 0.7)",
          textAlign: "center",
          display: "none",
        },
      });
    }
  },

  // Check memory usage and show warning if needed
  checkMemoryUsage: function () {
    this.createWarningOverlay();

    if (
      !this.warningOverlay ||
      !window.performance ||
      !window.performance.memory
    ) {
      return;
    }

    const currentMemory =
      window.performance.memory.usedJSHeapSize / (1024 * 1024);

    // Show warning if memory usage is too high
    if (currentMemory > 800 && !this.warningShown) {
      this.warningShown = true;
      this.warningOverlay.html(`
        <h3>HIGH MEMORY USAGE!</h3>
        <p>Game is using ${currentMemory.toFixed(1)} MB</p>
        <p>Consider refreshing</p>
      `);
      this.warningOverlay.style("display", "block");

      // Emergency cleanup
      this.performEmergencyCleanup();
    }

    // Hide warning if memory usage drops
    if (currentMemory < 600 && this.warningShown) {
      this.warningShown = false;
      this.warningOverlay.style("display", "none");
    }
  },

  // Perform emergency cleanup when memory is too high
  performEmergencyCleanup: function () {
    projectiles = [];
    projectilePool = [];
    effects = [];

    // Reduce enemies to essential minimum
    if (enemies.length > 20) {
      enemies.splice(20, enemies.length - 20);
    }

    // Try to trigger garbage collection
    if (window.gc) {
      try {
        window.gc();
      } catch (e) {
        // Ignore if gc is not available
      }
    }
  },
};

// Sound toggle button
let soundToggleButton = null;

// ===== UI STYLING UTILITIES =====
// Utility function to apply common styles to UI elements
function applyCommonStyles(element, styles = {}) {
  const defaultStyles = {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontFamily: "monospace",
    zIndex: "2000",
    position: "fixed",
    display: "block",
    visibility: "visible",
  };

  // Merge default styles with provided styles
  const finalStyles = { ...defaultStyles, ...styles };

  // Apply all styles
  Object.entries(finalStyles).forEach(([property, value]) => {
    // Convert camelCase to kebab-case for CSS properties
    const cssProperty = property.replace(/([A-Z])/g, "-$1").toLowerCase();
    element.style(cssProperty, value);
  });

  return element;
}

// Create a styled button with common properties
function createStyledButton(label, x, y, options = {}) {
  const button = createButton(label);
  button.position(x, y);

  // Default button styles
  const buttonStyles = {
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "14px",
    ...options.styles,
  };

  applyCommonStyles(button, buttonStyles);

  if (options.id) {
    button.id(options.id);
  }

  if (options.onClick) {
    button.mousePressed(options.onClick);
    button.touchStarted(options.onClick);
  }

  return button;
}

// Create a styled container div
function createStyledContainer(x, y, width, options = {}) {
  const container = createDiv("");
  container.position(x, y);

  // Default container styles
  const containerStyles = {
    width: width + "px",
    padding: "10px",
    ...options.styles,
  };

  applyCommonStyles(container, containerStyles);

  if (options.id) {
    container.id(options.id);
  }

  return container;
}

function createSoundToggleButton() {
  // Create button with initial state based on current mute setting
  const buttonLabel = soundSettings.muted ? "🔇" : "🔊";

  soundToggleButton = createStyledButton(buttonLabel, width - 50, 20, {
    id: "sound-toggle-button",
    styles: {
      borderRadius: "50%",
      width: "40px",
      height: "40px",
      fontSize: "20px",
      padding: "0",
      textAlign: "center",
      lineHeight: "40px",
    },
    onClick: toggleSoundState,
  });

  // Function to handle sound toggle
  function toggleSoundState() {
    // Initialize sound system if this is the first interaction
    if (
      typeof initSounds === "function" &&
      typeof soundSystemInitialized !== "undefined" &&
      !soundSystemInitialized
    ) {
      initSounds();

      // Resume AudioContext if it exists
      if (typeof getAudioContext === "function") {
        try {
          const audioContext = getAudioContext();
          if (audioContext && audioContext.state !== "running") {
            audioContext.resume().then(() => {
              console.log(
                "AudioContext resumed by user interaction with sound toggle"
              );
            });
          }
        } catch (e) {
          console.warn("Error accessing AudioContext:", e);
        }
      }
    }

    const isMuted = toggleMute();
    soundToggleButton.html(isMuted ? "🔇" : "🔊");

    if (isMuted) {
      stopAllSounds();
    }

    // Prevent default to avoid double triggering
    return false;
  }
}

// Function to update sound toggle button visibility
function drawSoundToggleButton() {
  if (soundToggleButton) {
    // Always show the sound toggle button regardless of game state
    soundToggleButton.style("display", "block");
    soundToggleButton.style("visibility", "visible");

    // Reposition in case of window resize
    soundToggleButton.position(width - 120, 20);
  }
}

// Wrapper function for backward compatibility
function checkMemoryUsage() {
  MemoryManager.checkMemoryUsage();
}

// Create UI for performance settings
// Global variables for our custom buttons
let pauseResumeButton;
let techBoardButton;
let techBoardVisible = false; // Default is hidden
let lastFpsUpdate = 0; // Track when we last updated the FPS display

function createPerformanceSettingsUI() {
  try {
    // If the button already exists, just update it
    if (pauseResumeButton) {
      updatePauseResumeButton();
      return;
    }

    // Create a static pause/resume button as a placeholder
    // This will be updated dynamically based on game state in updatePauseResumeButton
    pauseResumeButton = createStyledButton("⏸️", width - 100, 20, {
      id: "pause-resume-button",
      styles: {
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        fontSize: "20px",
        padding: "0",
        textAlign: "center",
        lineHeight: "40px",
        visibility: "hidden", // Initially hidden, will be shown by updatePauseResumeButton
      },
      onClick: () => {
        // This will be updated by updatePauseResumeButton
        if (gameState === GameState.PLAYING) {
          pauseGame();
        } else {
          resumeGame();
        }
      },
    });

    // Create a tech board toggle button with the same style
    techBoardButton = createStyledButton("60", width - 150, 20, {
      id: "tech-board-button",
      styles: {
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        fontSize: "18px", // Larger font size for better visibility
        fontWeight: "bold", // Make the text bold
        padding: "0",
        textAlign: "center",
        lineHeight: "40px",
        visibility: "hidden", // Initially hidden, will be shown by updatePauseResumeButton
        backgroundColor: "rgba(0, 0, 0, 0.8)", // Darker background for better contrast
        color: "#4CAF50", // Default to green
        transition: "all 0.3s ease", // Transition for all properties
        boxShadow: "0 2px 5px rgba(0,0,0,0.3)", // Add shadow for depth
      },
      onClick: () => {
        // Toggle tech board visibility
        techBoardVisible = !techBoardVisible;
        updateTechBoardVisibility();
      },
    });

    // Update the buttons to show the correct state
    updatePauseResumeButton();
    updateTechBoardButton();

    console.log("Created pause/resume button with state:", gameState);
  } catch (e) {
    console.error("Error creating pause/resume button:", e);
  }
}

// Update FPS display and track history
function updatePerformanceMetrics() {
  // Get current FPS using p5.js built-in function
  const currentFPS = frameRate();

  // Update FPS history
  fpsHistory.push(currentFPS);
  if (fpsHistory.length > 60) {
    // Keep last 60 frames (1 second at 60fps)
    fpsHistory.shift();
  }

  // Check if we need to adjust performance level
  if (frameCount - lastPerformanceCheck > performanceCheckInterval) {
    // Run initial benchmark if not done yet
    if (!PerformanceManager.benchmarkComplete && frameCount > 180) {
      // Wait 3 seconds before benchmarking
      PerformanceManager.runBenchmark();
    }

    // Adjust performance settings based on current metrics
    PerformanceManager.setPerformanceLevel();
    lastPerformanceCheck = frameCount;

    // Log performance metrics for debugging
    if (DEBUG_MODE) {
      console.log(
        `FPS: ${Math.round(PerformanceManager.getStableFPS())}, Target: ${
          PerformanceManager.targetFPS
        }, Level: ${currentPerformanceLevel}`
      );
      console.log(
        `Objects: Enemies: ${enemies.length}, Projectiles: ${projectiles.length}, Effects: ${effects.length}`
      );
    }
  }

  // Update pause/resume button based on current game state
  updatePauseResumeButton();
}

// Function to update the pause/resume button based on game state
function updatePauseResumeButton() {
  try {
    // If button doesn't exist, create it
    if (!pauseResumeButton) {
      createPerformanceSettingsUI();
      return;
    }

    // Update button based on game state
    if (gameState === GameState.PLAYING) {
      // Show pause button
      pauseResumeButton.html("⏸️");
      pauseResumeButton.style("visibility", "visible");

      // Update click handler
      pauseResumeButton.mousePressed(() => {
        pauseGame();
      });

      // Also show tech board button when playing
      if (techBoardButton) {
        techBoardButton.style("visibility", "visible");
      }
    } else if (gameState === GameState.PAUSED) {
      // Show resume button
      pauseResumeButton.html("▶️");
      pauseResumeButton.style("visibility", "visible");

      // Update click handler
      pauseResumeButton.mousePressed(() => {
        resumeGame();
      });

      // Also show tech board button when paused
      if (techBoardButton) {
        techBoardButton.style("visibility", "visible");
      }
    } else {
      // Hide button for menu and game over states
      pauseResumeButton.style("visibility", "hidden");

      // Also hide tech board button
      if (techBoardButton) {
        techBoardButton.style("visibility", "hidden");
      }
    }
  } catch (e) {
    console.warn("Error updating pause/resume button:", e);
    // If there was an error, try to recreate the button
    try {
      // Reset the button variable so it will be recreated
      pauseResumeButton = null;
      createPerformanceSettingsUI();
    } catch (e2) {
      console.error("Failed to recreate pause/resume button:", e2);
    }
  }
}

// Function to update the tech board button with current FPS
function updateTechBoardButton() {
  try {
    // If button doesn't exist, create it
    if (!techBoardButton) {
      createPerformanceSettingsUI();
      return;
    }

    // Only update FPS display every few frames for better performance
    if (frameCount - lastFpsUpdate < 15) {
      // Update every 15 frames (about 4 times per second at 60fps)
      return;
    }

    lastFpsUpdate = frameCount;

    // Get current FPS
    const avgFPS = Math.floor(
      fpsHistory.length > 0
        ? fpsHistory.reduce((sum, fps) => sum + fps, 0) / fpsHistory.length
        : frameRate()
    );

    // Determine color based on FPS
    let fpsColor;
    let bgColor;

    if (avgFPS >= 50) {
      // Good performance - green
      fpsColor = "#4CAF50"; // Bright green
      bgColor = "rgba(0, 50, 0, 0.8)"; // Dark green background
    } else if (avgFPS >= 30) {
      // Medium performance - yellow/orange
      fpsColor = "#FFC107"; // Amber yellow
      bgColor = "rgba(50, 50, 0, 0.8)"; // Dark yellow background
    } else {
      // Poor performance - red
      fpsColor = "#F44336"; // Material red
      bgColor = "rgba(50, 0, 0, 0.8)"; // Dark red background
    }

    // Update button text with FPS
    techBoardButton.html(avgFPS);

    // Set the text color based on performance
    techBoardButton.style("color", fpsColor);

    // Flash the background when updated
    techBoardButton.style("background-color", "rgba(255, 255, 255, 0.3)");
    techBoardButton.style("transform", "scale(1.1)");

    // Reset the background color and scale after a short delay
    setTimeout(() => {
      if (techBoardButton) {
        techBoardButton.style("background-color", bgColor);
        techBoardButton.style("transform", "scale(1.0)");
      }
    }, 200);
  } catch (e) {
    console.warn("Error updating tech board button:", e);
  }
}

// Function to update the tech board visibility
function updateTechBoardVisibility() {
  try {
    if (!techBoard) return;

    if (techBoardVisible) {
      techBoard.style("display", "block");
    } else {
      techBoard.style("display", "none");
    }
  } catch (e) {
    console.warn("Error updating tech board visibility:", e);
  }
}

// ===== GAME LOOP =====
function draw() {
  // Special handling for mobile landscape mode
  if (isMobileDevice && windowWidth > windowHeight) {
    // In mobile landscape mode, use a simplified rendering approach to avoid WebGL errors
    try {
      // Clear the background
      background(0);

      // Display a message encouraging portrait mode
      push();
      resetMatrix();
      fill(255);
      textSize(16);
      textAlign(CENTER, CENTER);
      text(
        "For the best experience, please rotate your device to portrait mode",
        width / 2,
        height / 2 - 20
      );

      // Continue rendering the game with simplified graphics
      // This will use our error-handling code in the rendering functions
      pop();
    } catch (e) {
      console.error("Error in mobile landscape mode handling:", e);
    }
  }

  // Performance and memory management
  MemoryManager.checkMemoryUsage();
  updatePerformanceMetrics();
  limitEffects();

  // Draw sky and environment instead of just a black background
  drawSkyAndMountains();

  // Check for global effects
  let globalFrostEffect = effects.find((e) => e.type === "globalFrost");
  let globalFireEffect = effects.find((e) => e.type === "globalFire");
  let globalTimeDilationEffect = effects.find(
    (e) => e.type === "globalTimeDilation"
  );

  // Handle multiple global effects with priority
  if (globalFrostEffect && globalFireEffect && globalTimeDilationEffect) {
    // If all three effects are active, create a simplified blend
    const frostIntensity = globalFrostEffect.intensity || 0.5;
    const fireIntensity = globalFireEffect.intensity || 0.3;
    const dilationIntensity = globalTimeDilationEffect.intensity || 0.2;

    const frostFadeAlpha = (globalFrostEffect.life / 120) * frostIntensity * 12; // Adjusted for shorter duration
    const fireFadeAlpha = (globalFireEffect.life / 600) * fireIntensity * 12; // Reduced for blending
    const dilationFadeAlpha =
      (globalTimeDilationEffect.life / 480) * dilationIntensity * 12; // Reduced for blending

    // Apply a simplified overlay
    push();
    translate(0, 0, 1000); // Move in front of everything
    noStroke();

    // Combined layer - blend all effects
    fill(
      (255 + 200 + 0) / 3,
      (100 + 240 + 200) / 3,
      (50 + 255 + 255) / 3,
      min((frostFadeAlpha + fireFadeAlpha + dilationFadeAlpha) / 2, 150) // Cap alpha for performance
    );
    plane(width * 2, height * 2);

    pop();

    // Balanced lighting for combined effects
    ambientLight(200, 200, 210);
    directionalLight(220, 220, 240, 0, -1, -1);
  } else if (globalFrostEffect && globalFireEffect) {
    // If both frost and fire effects are active, use a simplified blend
    const frostIntensity = globalFrostEffect.intensity || 0.5;
    const fireIntensity = globalFireEffect.intensity || 0.3;

    const frostFadeAlpha = (globalFrostEffect.life / 120) * frostIntensity * 15; // Adjusted for shorter duration
    const fireFadeAlpha = (globalFireEffect.life / 600) * fireIntensity * 15; // Reduced for blending

    // Apply a single blended overlay for better performance
    push();
    translate(0, 0, 1000); // Move in front of everything
    noStroke();

    // Combined layer - purple-ish blend of fire and ice
    fill(
      (255 + 200) / 2,
      (100 + 240) / 2,
      (50 + 255) / 2,
      min((frostFadeAlpha + fireFadeAlpha) / 2, 150) // Cap alpha for performance
    );
    plane(width * 2, height * 2); // Cover the entire screen

    pop();

    // Adjust lighting for combined effect - balanced light
    ambientLight(200, 190, 210); // Balanced ambient light
    directionalLight(230, 220, 230, 0, -1, -1); // Balanced directional light
  } else if (globalFrostEffect && globalTimeDilationEffect) {
    // If both frost and time dilation effects are active, use a simplified blend
    const frostIntensity = globalFrostEffect.intensity || 0.5;
    const dilationIntensity = globalTimeDilationEffect.intensity || 0.2;

    const frostFadeAlpha = (globalFrostEffect.life / 120) * frostIntensity * 15; // Adjusted for shorter duration
    const dilationFadeAlpha =
      (globalTimeDilationEffect.life / 480) * dilationIntensity * 15; // Reduced for blending

    // Apply a single blended overlay for better performance
    push();
    translate(0, 0, 1000); // Move in front of everything
    noStroke();

    // Combined layer - cyan blend of frost and time dilation
    fill(
      (200 + 0) / 2,
      (240 + 200) / 2,
      255,
      min((frostFadeAlpha + dilationFadeAlpha) / 2, 150) // Cap alpha for performance
    );
    plane(width * 2, height * 2);

    // Simplified special effect - only on desktop and less frequent
    if (!isMobileDevice && frameCount % 8 === 0) {
      fill(150, 220, 255, random(3, 8));
      plane(width * 2, height * 2);
    }

    pop();

    // Adjust lighting for combined effect - cool cyan light
    ambientLight(180, 210, 230);
    directionalLight(190, 230, 255, 0, -1, -1);
  } else if (globalFireEffect && globalTimeDilationEffect) {
    // If both fire and time dilation effects are active, blend them
    const fireIntensity = globalFireEffect.intensity || 0.3;
    const dilationIntensity = globalTimeDilationEffect.intensity || 0.2;

    const fireFadeAlpha = (globalFireEffect.life / 600) * fireIntensity * 20; // Reduced for blending
    const dilationFadeAlpha =
      (globalTimeDilationEffect.life / 480) * dilationIntensity * 20; // Reduced for blending

    // Apply a semi-transparent blended overlay
    push();
    translate(0, 0, 1000); // Move in front of everything
    noStroke();

    // First layer - fire effect
    fill(255, 100, 50, fireFadeAlpha * 0.7);
    plane(width * 2, height * 2);

    // Second layer - time dilation effect
    fill(0, 200, 255, dilationFadeAlpha * 0.6);
    plane(width * 2, height * 2);

    // Add special combined effect - energy flicker
    if (frameCount % 3 === 0) {
      fill(200, 150, 200, random(5, 10));
      plane(width * 2, height * 2);
    }

    pop();

    // Adjust lighting for combined effect - energized light
    ambientLight(210, 190, 200);
    directionalLight(230, 210, 220, 0, -1, -1);
  } else if (globalFrostEffect) {
    // Apply a simplified blue tint to the scene based on the frost intensity
    const intensity = globalFrostEffect.intensity || 0.5;
    const fadeAlpha = (globalFrostEffect.life / 120) * intensity * 25; // Fade as effect expires, adjusted for shorter duration

    // Apply a simplified semi-transparent blue overlay
    push();
    translate(0, 0, 1000); // Move in front of everything
    fill(200, 240, 255, min(fadeAlpha, 150)); // Cap the maximum alpha for better performance
    noStroke();
    plane(width * 2, height * 2); // Cover the entire screen
    pop();

    // Simplified lighting for frost effect
    ambientLight(190, 210, 230); // Bluer ambient light
    directionalLight(200, 220, 255, 0, -1, -1); // Bluer directional light
  } else if (globalFireEffect) {
    // Apply a red-orange tint to the scene based on the fire intensity
    const intensity = globalFireEffect.intensity || 0.3;
    const fadeAlpha = (globalFireEffect.life / 600) * intensity * 30; // Fade as effect expires

    // Apply a semi-transparent red-orange overlay
    push();
    // Use a 2D overlay for the fire effect
    translate(0, 0, 1000); // Move in front of everything
    fill(255, 100, 50, fadeAlpha);
    noStroke();
    plane(width * 2, height * 2); // Cover the entire screen

    // Add flickering effect
    if (frameCount % 5 === 0) {
      // Random flicker overlay
      fill(255, 150, 0, random(5, 15));
      plane(width * 2, height * 2);
    }
    pop();

    // Adjust lighting for fire effect - warmer, redder light
    ambientLight(220, 180, 160); // Warmer ambient light
    directionalLight(255, 220, 180, 0, -1, -1); // Warmer directional light
  } else if (globalTimeDilationEffect) {
    // Apply a cyan tint to the scene based on the time dilation intensity
    const intensity = globalTimeDilationEffect.intensity || 0.2;
    const fadeAlpha = (globalTimeDilationEffect.life / 480) * intensity * 25; // Fade as effect expires

    // Apply a semi-transparent cyan overlay
    push();
    // Use a 2D overlay for the time dilation effect
    translate(0, 0, 1000); // Move in front of everything
    fill(0, 200, 255, fadeAlpha);
    noStroke();
    plane(width * 2, height * 2); // Cover the entire screen

    // Add time ripple effect
    if (frameCount % 6 === 0) {
      // Subtle ripple overlay
      fill(100, 220, 255, random(3, 8));
      plane(width * 2, height * 2);
    }

    // Add occasional bright flash for time distortion
    if (frameCount % 60 === 0) {
      fill(200, 240, 255, random(10, 20));
      plane(width * 2, height * 2);
    }
    pop();

    // Adjust lighting for time dilation effect - cooler, cyan-tinted light
    ambientLight(190, 210, 220); // Cyan-tinted ambient light
    directionalLight(200, 240, 255, 0, -1, -1); // Cyan-tinted directional light
  } else {
    // Normal lighting
    ambientLight(200); // Higher value for more brightness
    directionalLight(255, 255, 255, 0, -1, -1); // Optimize lighting - only one light source
  }

  // Apply camera transformations with optional shake effect
  try {
    let shakeX = 0;
    let shakeY = 0;

    // Apply camera shake if active
    if (typeof cameraShake === "undefined") {
      cameraShake = 0;
    }

    if (cameraShake > 0) {
      shakeX = random(-cameraShake, cameraShake);
      shakeY = random(-cameraShake, cameraShake);
      cameraShake *= 0.9; // Decay the shake effect
      if (cameraShake < 0.5) cameraShake = 0;
    }

    // Apply camera transformations
    translate(cameraOffsetX + shakeX, -cameraOffsetY + shakeY, -cameraZoom);
    rotateX(PI / 4); // Angle to show the entire bridge from bottom to top

    // Draw the 3D game elements
    drawGame();

    // Draw the sky overlay on top of the game elements
    // Only if not in mobile landscape mode (handled inside the function)
    drawSkyOverlay();
  } catch (e) {
    console.error("Error in camera/rendering setup:", e);

    // Try to recover by resetting the WebGL context
    try {
      resetMatrix();

      // Display a simple error message if rendering fails
      if (isMobileDevice && windowWidth > windowHeight) {
        fill(0);
        textSize(16);
        textAlign(CENTER, CENTER);
        text(
          "Please rotate your device to portrait mode for better experience",
          width / 2,
          height / 2
        );
      }
    } catch (e2) {
      console.error("Failed to recover from rendering error:", e2);
    }
  }

  if (gameState == "playing") {
    updateGame();

    // Update ambient sounds during gameplay
    try {
      if (!soundSettings.muted) {
        updateAmbientSounds();
      }
    } catch (e) {
      // Silently ignore sound errors during gameplay
    }
  }

  // DOM
  drawMenu();
  // Show/hide controls container based on game state
  if (controlsContainer) {
    if (gameState === "menu" || gameState === "gameOver") {
      controlsContainer.style("display", "none");
    } else {
      controlsContainer.style("display", "flex");
    }
  }
  drawGameOverContainer();
  updateDirectionalPad(); // Update the directional pad visibility and state

  // Periodically try to clear memory
  if (frameCount % 900 === 0) {
    // Every 15 seconds
    // Delete unused references that might be causing memory leaks
    fpsHistory = fpsHistory.slice(-5); // Keep only last 5 samples
    memoryUsageSamples = memoryUsageSamples.slice(-3); // Keep only last 3 samples

    // Force texture cache cleanup if possible
    if (typeof p5 !== "undefined" && p5._renderer) {
      try {
        p5._renderer._clearTextures();
      } catch (e) {
        // Ignore if method doesn't exist
      }
    }
  }
}

// Memory leak tracking and prevention
let lastMemoryCleanup = 0;
const MEMORY_CLEANUP_INTERVAL = 300; // Run garbage collection helper every 5 seconds (300 frames at 60fps)
const MAX_OBJECTS = 10_000; // Maximum total number of game objects
const MAX_PROJECTILES = 300; // Maximum projectiles
const MAX_EFFECTS = 300; // Maximum visual effects

// Function to limit effects based on performance level
function limitEffects() {
  // Count active skills to adjust effect limits
  const activeSkillCount = Object.values(skills).filter(
    (skill) => skill.active
  ).length;

  // Dynamically reduce effects when multiple skills are active
  const skillMultiplier = Math.max(0.5, 1 - activeSkillCount * 0.15); // Reduce by 15% per active skill, min 50%

  // Get maximum effects based on performance level and active skills
  const maxEffects = isMobileDevice
    ? currentPerformanceLevel === PerformanceLevel.LOW
      ? Math.floor(50 * skillMultiplier) // Much more aggressive limit for low-end mobile
      : currentPerformanceLevel === PerformanceLevel.MEDIUM
      ? Math.floor(100 * skillMultiplier) // Reduced for medium mobile
      : Math.floor(150 * skillMultiplier) // Reduced for high-end mobile too
    : currentPerformanceLevel === PerformanceLevel.LOW
    ? Math.floor(150 * skillMultiplier)
    : currentPerformanceLevel === PerformanceLevel.MEDIUM
    ? Math.floor(250 * skillMultiplier)
    : Math.floor(MAX_EFFECTS * skillMultiplier);

  // If we have too many effects, remove the oldest ones
  if (effects.length > maxEffects) {
    // Sort effects by priority (keep important ones)
    const priorityEffects = effects.filter(
      (e) =>
        e.forceRenderDetail ||
        e.type === "atomicBomb" ||
        e.type === "atomicExplosion" ||
        e.type === "atomicFlash" ||
        e.type === "shockwave" ||
        e.type === "areaBarrier" ||
        e.type === "globalFrost"
    );

    const normalEffects = effects.filter(
      (e) =>
        !e.forceRenderDetail &&
        e.type !== "atomicBomb" &&
        e.type !== "atomicExplosion" &&
        e.type !== "atomicFlash" &&
        e.type !== "shockwave" &&
        e.type !== "areaBarrier" &&
        e.type !== "globalFrost"
    );

    // Keep all priority effects and as many normal effects as we can
    const normalEffectsToKeep = Math.max(
      0,
      maxEffects - priorityEffects.length
    );

    // Keep the newest normal effects (they're more relevant)
    const newNormalEffects = normalEffects.slice(-normalEffectsToKeep);

    // Update the effects array
    effects = [...priorityEffects, ...newNormalEffects];
  }
}

// Memory cleanup helper function
function cleanupMemory() {
  // Only run cleanup at specified intervals to avoid performance impact
  if (frameCount - lastMemoryCleanup < MEMORY_CLEANUP_INTERVAL) return;

  lastMemoryCleanup = frameCount;

  // Calculate total objects
  const totalObjects =
    squad.length +
    enemies.length +
    projectiles.length +
    powerUps.length +
    effects.length;

  // If too many objects, aggressively reduce all arrays
  if (totalObjects > MAX_OBJECTS) {
    // Keep this limited to prevent memory buildup
    const excessRatio = MAX_OBJECTS / totalObjects;

    // Don't reduce squad (important for gameplay)

    // Reduce projectiles if too many (keep newest ones - most important)
    if (projectiles.length > MAX_PROJECTILES / 2) {
      projectiles.splice(0, projectiles.length - MAX_PROJECTILES / 2);
    }

    // Reduce effects (visual only, won't affect gameplay)
    if (effects.length > MAX_EFFECTS / 2) {
      effects.splice(0, effects.length - MAX_EFFECTS / 2);
    }

    // // Reduce power-ups if excessive
    // if (powerUps.length > MAX_POWER_UPS) {
    //   powerUps.splice(0, powerUps.length - MAX_POWER_UPS);
    // }

    // Only reduce enemies as a last resort (important for gameplay)
    if (totalObjects > MAX_OBJECTS && enemies.length > 50) {
      // Remove enemies that are farthest away from the player
      enemies.sort((a, b) => {
        // Find distance from first squad member
        if (squad.length === 0) return 0;

        const mainMember = squad[0];
        const distA =
          Math.pow(a.x - mainMember.x, 2) + Math.pow(a.y - mainMember.y, 2);
        const distB =
          Math.pow(b.x - mainMember.x, 2) + Math.pow(b.y - mainMember.y, 2);

        // Sort by distance (descending - farthest first)
        return distB - distA;
      });

      // Remove farthest enemies
      enemies.splice(50, enemies.length - 50);
    }

    // Clear object pools when they get too large
    while (projectilePool.length > 30) projectilePool.pop();
  }

  // Force release of any references that might be causing memory leaks
  if (frameCount % 1800 === 0) {
    // Every 30 seconds
    projectilePool.length = 0; // Clear the pool completely
  }
}

// Main game logic functions
function updateGame() {
  spawnEnemies();
  spawnPowerUps();

  updatePowerUps();

  updateSquad();
  updateProjectiles();
  updateEnemies();

  // Clean up any objects that have gone beyond the wall
  cleanupEffectsBeyondWall();

  applyEffects();
  applyEnemyEffects();

  checkCollisions();
  checkWaveCompletion();

  // Run memory cleanup
  cleanupMemory();

  updateHUD();
}

// Draw the sky, mountains, and environment
function drawSkyAndMountains() {
  // Save the current WebGL state
  push();

  // Completely reset the matrix to draw in 2D screen space
  resetMatrix();

  // Switch to 2D rendering mode for the background
  ortho(-width / 2, width / 2, height / 2, -height / 2, -10000, 10000);

  // Get WebGL context and disable depth testing temporarily
  const gl = drawingContext;
  const depthTest = gl.isEnabled(gl.DEPTH_TEST);
  gl.disable(gl.DEPTH_TEST);

  // Move far back in Z space to ensure background is behind everything
  translate(0, 0, -5000);

  noStroke(); // No stroke for all background elements

  // Extra size to ensure coverage beyond screen edges
  // Increased to ensure full coverage on larger screens
  const extraSize = Math.max(1000, width); // Use at least 1000px or the full width, whichever is larger

  // ===== SKY GRADIENT =====
  // Create a horizon-oriented gradient (lighter at horizon, darker at top)
  // This creates a more realistic sky appearance for a bridge going toward the horizon
  const skyColors = [
    [25, 25, 112], // Midnight blue (top of sky)
    [65, 105, 225], // Royal blue (upper sky)
    [135, 206, 235], // Sky blue (mid sky)
    [240, 248, 255], // Alice blue (horizon)
  ];

  // Draw the sky gradient from top to horizon
  for (let i = 0; i < skyColors.length; i++) {
    const y1 = map(i, 0, skyColors.length, -extraSize, height * 0.5);
    const y2 = map(i + 1, 0, skyColors.length, -extraSize, height * 0.5);

    fill(skyColors[i]);
    rect(-extraSize, y1, width + extraSize * 2, y2 - y1 + 1);
  }

  // ===== DISTANT MOUNTAINS =====
  // Draw mountain ranges at the horizon
  // First mountain range (furthest)
  fill(70, 80, 120); // Distant purple-blue mountains
  beginShape();
  vertex(-extraSize, height * 0.5); // Start at horizon

  // Create a jagged mountain range using noise
  for (let x = -extraSize; x < width + extraSize; x += 20) {
    const mountainHeight =
      noise(x * 0.002, frameCount * 0.0001) * height * 0.15;
    vertex(x, height * 0.5 - mountainHeight);
  }

  vertex(width + extraSize, height * 0.5);
  endShape(CLOSE);

  // Second mountain range (closer)
  fill(90, 100, 140); // Slightly lighter blue mountains
  beginShape();
  vertex(-extraSize, height * 0.5);

  for (let x = -extraSize; x < width + extraSize; x += 15) {
    const mountainHeight =
      noise(x * 0.003 + 100, frameCount * 0.0002) * height * 0.1;
    vertex(x, height * 0.5 - mountainHeight);
  }

  vertex(width + extraSize, height * 0.5);
  endShape(CLOSE);

  // ===== OCEAN/WATER =====
  // Draw water below the horizon (for a bridge over water)
  // Water gradient from horizon to bottom
  const waterColors = [
    [100, 149, 237], // Cornflower blue (near horizon)
    [65, 105, 225], // Royal blue (mid water)
    [25, 25, 112], // Midnight blue (deep water)
  ];

  // Draw water gradient
  for (let i = 0; i < waterColors.length; i++) {
    const y1 = map(i, 0, waterColors.length, height * 0.5, height + extraSize);
    const y2 = map(
      i + 1,
      0,
      waterColors.length,
      height * 0.5,
      height + extraSize
    );

    fill(waterColors[i]);
    rect(-extraSize, y1, width + extraSize * 2, y2 - y1 + 1);
  }

  // Re-enable depth testing if it was enabled before
  if (depthTest) {
    gl.enable(gl.DEPTH_TEST);
  }

  // Restore the previous state
  pop();
}

// Function to draw clouds that appear on top of the bridge at the horizon
function drawSkyOverlay() {
  try {
    // Check if we're in mobile landscape mode - if so, skip drawing clouds
    // This is a workaround for the WebGL context issue in mobile landscape
    if (isMobileDevice && windowWidth > windowHeight) {
      return; // Skip drawing clouds in mobile landscape mode
    }

    // Save the current WebGL state
    push();

    try {
      // Completely reset the matrix to draw in 2D screen space
      resetMatrix();

      // Switch to 2D rendering mode - use try/catch to handle potential WebGL errors
      try {
        ortho(-width / 2, width / 2, height / 2, -height / 2, -10000, 10000);
      } catch (e) {
        console.warn("Error setting ortho projection:", e);
        // If ortho fails, try to use a simpler approach
        resetMatrix();
      }

      // Move in front of everything
      translate(0, 0, 1000);

      noStroke();

      // Extra size to ensure coverage beyond screen edges
      const extraSize = Math.max(1000, width);

      // ===== CLOUDS OVERLAY =====
      // Add clouds that appear on top of the bridge near the horizon
      // Use a simpler approach for mobile devices
      if (isMobileDevice) {
        try {
          // For mobile, use a much simpler cloud rendering approach
          // Draw just a few simple cloud shapes
          const cloudCount = 3; // Fewer clouds for mobile

          for (let i = 0; i < cloudCount; i++) {
            // Simple cloud positioning
            const cloudX = map(
              noise(i * 0.5, frameCount * 0.0005),
              0,
              1,
              -width / 2,
              width / 2
            );
            const cloudY = height * 0.25; // Fixed position above horizon

            // Draw a simple cloud shape
            fill(255, 255, 255, 80); // Very transparent
            noStroke();

            // Use a single ellipse for each cloud on mobile
            const cloudWidth = 150 + i * 30;
            const cloudHeight = 40;

            ellipse(cloudX, cloudY, cloudWidth, cloudHeight);
          }
        } catch (e) {
          console.warn("Error in mobile cloud rendering:", e);
          // Clouds are non-essential, so we can just skip them if there's an error
        }
      } else {
        // Desktop version with more detailed clouds
        // Use noise for cloud positions
        for (let i = 0; i < 6; i++) {
          // Position clouds near the horizon (middle of screen)
          const cloudX =
            noise(i * 0.5, frameCount * 0.0005) * (width + extraSize * 2) -
            extraSize;

          // Position clouds slightly above the horizon line for better visibility
          const cloudY = 420; // Slightly above center of screen in ortho mode

          const cloudWidth = noise(i * 0.3) * 250 + 120; // Slightly smaller clouds
          const cloudHeight = 40 + noise(i) * 25; // Slightly smaller height

          // Draw cloud as a series of overlapping ellipses
          for (let j = 0; j < 5; j++) {
            try {
              const offsetX = ((j - 2) * cloudWidth) / 6;
              const offsetY = sin(j * 0.5) * 6;

              // Add alpha to make clouds more transparent
              fill(255, 255, 255, map(j, 0, 4, 80, 120));

              ellipse(
                cloudX + offsetX,
                cloudY + offsetY,
                cloudWidth / 3,
                cloudHeight
              );
            } catch (e) {
              // Silently ignore errors in cloud drawing - non-critical element
            }
          }
        }
      }
    } catch (e) {
      console.error("Error in sky overlay rendering:", e);
    }

    // Always try to restore the previous state
    pop();
  } catch (e) {
    console.error("Critical error in drawSkyOverlay:", e);
  }
}

function drawGame() {
  try {
    // Draw each component in a separate try-catch block to prevent cascading failures

    // Draw the power-up lane first
    try {
      drawPowerUpLane();
    } catch (e) {
      console.error("Error drawing power-up lane:", e);
    }

    // Draw power-ups
    try {
      drawPowerUps();
    } catch (e) {
      console.error("Error drawing power-ups:", e);
    }

    // Draw the main lane
    try {
      drawMainLane();
    } catch (e) {
      console.error("Error drawing main lane:", e);
    }

    // Draw squad members
    try {
      drawSquad();
    } catch (e) {
      console.error("Error drawing squad:", e);
    }

    // Draw enemies
    try {
      drawEnemies();
    } catch (e) {
      console.error("Error drawing enemies:", e);
    }

    // Draw projectiles
    try {
      drawProjectiles();
    } catch (e) {
      console.error("Error drawing projectiles:", e);
    }

    // Draw visual effects
    try {
      drawEffects();
    } catch (e) {
      console.error("Error drawing effects:", e);
    }
  } catch (e) {
    console.error("Critical error in drawGame:", e);
  }
}

function drawMainLane() {
  try {
    // Draw the bridge (main lane) - extending from bottom to top of screen
    push();
    translate(0, 0, 0);

    // Main bridge structure - this is where WebGL errors often occur
    try {
      fill(...BRIDGE_COLOR);
      box(BRIDGE_WIDTH, BRIDGE_LENGTH, 10); // Using the updated bridge length to cover full screen
    } catch (e) {
      console.warn("Error drawing main bridge:", e);
      // Fallback to a simpler shape if box fails
      fill(...BRIDGE_COLOR);
      plane(BRIDGE_WIDTH, BRIDGE_LENGTH); // Use a plane as fallback
    }

    // Add bridge details if not on low performance mode
    if (!isMobileDevice || currentPerformanceLevel !== PerformanceLevel.LOW) {
      // Add bridge railings
      try {
        // Left railing
        push();
        fill(120, 120, 120); // Slightly darker than bridge
        translate(-BRIDGE_WIDTH / 2 + 10, 0, 15);
        box(5, BRIDGE_LENGTH, 20);
        pop();

        // Right railing
        push();
        fill(120, 120, 120);
        translate(BRIDGE_WIDTH / 2 - 10, 0, 15);
        box(5, BRIDGE_LENGTH, 20);
        pop();
      } catch (e) {
        console.warn("Error drawing railings:", e);
      }

      // Add bridge supports/pillars
      try {
        const pillarCount = 8;
        const pillarSpacing = BRIDGE_LENGTH / pillarCount;

        for (let i = 0; i < pillarCount; i++) {
          const yPos =
            -BRIDGE_LENGTH / 2 + i * pillarSpacing + pillarSpacing / 2;

          // Skip pillars too close to the wall
          if (Math.abs(yPos - WALL_Y) < 100) continue;

          // Left pillar
          push();
          fill(100, 100, 100);
          translate(-BRIDGE_WIDTH / 2 + 20, yPos, -100);
          box(20, 20, 200);
          pop();

          // Right pillar
          push();
          fill(100, 100, 100);
          translate(BRIDGE_WIDTH / 2 - 20, yPos, -100);
          box(20, 20, 200);
          pop();

          // Cross support
          push();
          fill(110, 110, 110);
          translate(0, yPos, -50);
          box(BRIDGE_WIDTH - 40, 10, 5);
          pop();
        }
      } catch (e) {
        console.warn("Error drawing pillars:", e);
      }

      // Add lane markings
      try {
        stroke(255, 255, 255, 150);
        strokeWeight(2);

        // Center line
        push();
        translate(0, 0, 6);
        line(0, -BRIDGE_LENGTH / 2, 0, BRIDGE_LENGTH / 2);
        pop();

        // Dashed lines
        const dashCount = 30;
        const dashLength = 20;
        const dashSpacing = BRIDGE_LENGTH / dashCount;

        for (let i = 0; i < dashCount; i++) {
          const yPos = -BRIDGE_LENGTH / 2 + i * dashSpacing + dashSpacing / 2;

          push();
          translate(0, yPos, 6);
          line(
            -BRIDGE_WIDTH / 4,
            -dashLength / 2,
            -BRIDGE_WIDTH / 4,
            dashLength / 2
          );
          line(
            BRIDGE_WIDTH / 4,
            -dashLength / 2,
            BRIDGE_WIDTH / 4,
            dashLength / 2
          );
          pop();
        }
      } catch (e) {
        console.warn("Error drawing lane markings:", e);
      }
    }

    pop();

    // Draw the wall and gate at the start of the bridge
    try {
      drawWallAndGate();
    } catch (e) {
      console.warn("Error drawing wall and gate:", e);
    }
  } catch (e) {
    console.error("Critical error in drawMainLane:", e);

    // Attempt to recover WebGL context if possible
    if (typeof _renderer !== "undefined" && _renderer.GL) {
      try {
        // Reset WebGL state
        resetMatrix();

        // Reapply WebGL settings
        PerformanceManager.applyWebGLSettings();
      } catch (err) {
        console.error("Failed to recover WebGL context:", err);
      }
    }
  }
}

function drawWallAndGate() {
  // Position at the bottom of the bridge (start)
  const wallY = WALL_Y;

  push();

  // Add wall foundation/base
  push();
  translate(0, wallY, -WALL_HEIGHT / 4);
  fill(80, 80, 80); // Darker gray for foundation
  box(BRIDGE_WIDTH + 60, WALL_THICKNESS + 20, WALL_HEIGHT / 2);
  pop();

  // Wall color - stone gray with texture effect
  fill(100, 100, 100);

  // Left section of wall
  push();
  translate(
    -BRIDGE_WIDTH / 2 + (BRIDGE_WIDTH - GATE_WIDTH) / 4,
    wallY,
    WALL_HEIGHT / 2
  );

  // Main wall section
  box((BRIDGE_WIDTH - GATE_WIDTH) / 2, WALL_THICKNESS, WALL_HEIGHT);

  // Add stone texture details if not on low performance mode
  if (!isMobileDevice || currentPerformanceLevel !== PerformanceLevel.LOW) {
    // Add stone texture by drawing small boxes on the wall surface
    push();
    translate(0, WALL_THICKNESS / 2 + 1, 0);

    const stoneRows = 8;
    const stoneCols = 10;
    const stoneWidth = (BRIDGE_WIDTH - GATE_WIDTH) / 2 / stoneCols;
    const stoneHeight = WALL_HEIGHT / stoneRows;

    for (let row = 0; row < stoneRows; row++) {
      for (let col = 0; col < stoneCols; col++) {
        // Alternate stone pattern for each row
        const offsetX = row % 2 === 0 ? 0 : stoneWidth / 2;
        const x =
          -((BRIDGE_WIDTH - GATE_WIDTH) / 4) + col * stoneWidth + offsetX;
        const y = -WALL_HEIGHT / 2 + row * stoneHeight + stoneHeight / 2;

        // Random stone color variation
        const colorVar = random(-10, 10);
        fill(100 + colorVar, 100 + colorVar, 100 + colorVar);

        // Draw stone block with slight random size variation
        push();
        translate(x, 0, y);
        box(stoneWidth * 0.9, 2, stoneHeight * 0.9);
        pop();
      }
    }
    pop();
  }
  pop();

  // Right section of wall
  push();
  translate(
    BRIDGE_WIDTH / 2 - (BRIDGE_WIDTH - GATE_WIDTH) / 4,
    wallY,
    WALL_HEIGHT / 2
  );

  // Main wall section
  box((BRIDGE_WIDTH - GATE_WIDTH) / 2, WALL_THICKNESS, WALL_HEIGHT);

  // Add stone texture details if not on low performance mode
  if (!isMobileDevice || currentPerformanceLevel !== PerformanceLevel.LOW) {
    // Add stone texture by drawing small boxes on the wall surface
    push();
    translate(0, WALL_THICKNESS / 2 + 1, 0);

    const stoneRows = 8;
    const stoneCols = 10;
    const stoneWidth = (BRIDGE_WIDTH - GATE_WIDTH) / 2 / stoneCols;
    const stoneHeight = WALL_HEIGHT / stoneRows;

    for (let row = 0; row < stoneRows; row++) {
      for (let col = 0; col < stoneCols; col++) {
        // Alternate stone pattern for each row
        const offsetX = row % 2 === 0 ? 0 : stoneWidth / 2;
        const x =
          -((BRIDGE_WIDTH - GATE_WIDTH) / 4) + col * stoneWidth + offsetX;
        const y = -WALL_HEIGHT / 2 + row * stoneHeight + stoneHeight / 2;

        // Random stone color variation
        const colorVar = random(-10, 10);
        fill(100 + colorVar, 100 + colorVar, 100 + colorVar);

        // Draw stone block with slight random size variation
        push();
        translate(x, 0, y);
        box(stoneWidth * 0.9, 2, stoneHeight * 0.9);
        pop();
      }
    }
    pop();
  }
  pop();

  // Gate (closed)
  push();
  translate(0, wallY, GATE_HEIGHT / 2);

  // Gate frame
  push();
  fill(80, 60, 30); // Darker wood for frame
  translate(0, 0, 0);
  box(GATE_WIDTH + 10, WALL_THICKNESS + 8, GATE_HEIGHT + 10);
  pop();

  // Main gate
  fill(120, 80, 40); // Brown wooden gate
  box(GATE_WIDTH, WALL_THICKNESS + 5, GATE_HEIGHT);

  // Gate details
  stroke(60, 40, 20);
  strokeWeight(3);

  // Horizontal bars
  for (let i = 1; i < 3; i++) {
    const barY = -GATE_HEIGHT / 2 + i * (GATE_HEIGHT / 3);
    line(-GATE_WIDTH / 2, 0, barY, GATE_WIDTH / 2, 0, barY);
  }

  // Vertical supports
  for (let i = 0; i < 5; i++) {
    const barX = -GATE_WIDTH / 2 + i * (GATE_WIDTH / 4);
    line(barX, 0, -GATE_HEIGHT / 2, barX, 0, GATE_HEIGHT / 2);
  }

  // Add metal reinforcements
  fill(50, 50, 50);
  noStroke();

  // Corner reinforcements
  push();
  translate(-GATE_WIDTH / 2 + 10, 0, -GATE_HEIGHT / 2 + 10);
  box(20, WALL_THICKNESS + 6, 20);
  pop();

  push();
  translate(GATE_WIDTH / 2 - 10, 0, -GATE_HEIGHT / 2 + 10);
  box(20, WALL_THICKNESS + 6, 20);
  pop();

  push();
  translate(-GATE_WIDTH / 2 + 10, 0, GATE_HEIGHT / 2 - 10);
  box(20, WALL_THICKNESS + 6, 20);
  pop();

  push();
  translate(GATE_WIDTH / 2 - 10, 0, GATE_HEIGHT / 2 - 10);
  box(20, WALL_THICKNESS + 6, 20);
  pop();

  // Add gate handles
  push();
  translate(0, WALL_THICKNESS / 2 + 5, 0);
  fill(40, 40, 40);
  torus(15, 3);
  pop();

  pop();

  // Add a visual boundary indicator - red line showing the wall boundary
  push();
  translate(0, wallY - WALL_THICKNESS / 2, 5); // Position just in front of the wall
  stroke(255, 0, 0); // Bright red
  strokeWeight(3);
  line(-BRIDGE_WIDTH / 2, 0, BRIDGE_WIDTH / 2 + POWER_UP_LANE_WIDTH, 0);

  // Add small warning indicators along the boundary
  for (
    let x = -BRIDGE_WIDTH / 2;
    x <= BRIDGE_WIDTH / 2 + POWER_UP_LANE_WIDTH;
    x += 50
  ) {
    // Pulsing effect for the warning indicators
    const pulseSize = 5 + sin(frameCount * 0.1) * 2;

    push();
    translate(x, 0, 5);
    noStroke();
    fill(255, 0, 0, 150 + sin(frameCount * 0.1) * 50); // Pulsing opacity
    sphere(pulseSize);
    pop();
  }
  pop();

  // Wall top decorations (crenellations)
  stroke(80, 80, 80);
  strokeWeight(2);

  const crenellationCount = 20;
  const crenellationWidth = BRIDGE_WIDTH / crenellationCount;
  const crenellationHeight = 20;

  for (let i = 0; i < crenellationCount; i++) {
    // Skip the middle section where the gate is
    if (
      i >= crenellationCount / 2 - GATE_WIDTH / (2 * crenellationWidth) &&
      i < crenellationCount / 2 + GATE_WIDTH / (2 * crenellationWidth)
    ) {
      continue;
    }

    const x = -BRIDGE_WIDTH / 2 + (i + 0.5) * crenellationWidth;

    push();
    translate(x, wallY, WALL_HEIGHT + crenellationHeight / 2);
    fill(90, 90, 90);
    box(crenellationWidth * 0.8, WALL_THICKNESS, crenellationHeight);
    pop();
  }

  // Add wall towers at the ends if not on low performance mode
  if (!isMobileDevice || currentPerformanceLevel !== PerformanceLevel.LOW) {
    // Left tower
    push();
    translate(-BRIDGE_WIDTH / 2 - 30, wallY, WALL_HEIGHT / 2);
    fill(90, 90, 90);
    cylinder(40, WALL_HEIGHT);

    // Tower top
    translate(0, 0, WALL_HEIGHT / 2 + 10);
    fill(70, 70, 70);
    cone(45, 40);
    pop();

    // Right tower
    push();
    translate(BRIDGE_WIDTH / 2 + 30, wallY, WALL_HEIGHT / 2);
    fill(90, 90, 90);
    cylinder(40, WALL_HEIGHT);

    // Tower top
    translate(0, 0, WALL_HEIGHT / 2 + 10);
    fill(70, 70, 70);
    cone(45, 40);
    pop();
  }

  pop();
}

function drawPowerUpLane() {
  try {
    // Always use the simplest approach for mobile devices to avoid WebGL context issues
    if (isMobileDevice) {
      try {
        push();
        // Use 2D mode for mobile rendering to avoid WebGL issues
        // Save the current renderer state
        const currentCanvas = _renderer;

        // Switch to 2D temporarily if we're in WEBGL mode
        let tempCanvas = null;
        if (_renderer.isP3D) {
          // Create a temporary 2D canvas for drawing
          tempCanvas = createGraphics(width, height);
          tempCanvas.background(0, 0, 0, 0); // Transparent background

          // Set up the 2D canvas
          tempCanvas.push();
          tempCanvas.translate(width / 2, height / 2); // Center origin
          tempCanvas.fill(
            POWER_UP_LANE_COLOR[0],
            POWER_UP_LANE_COLOR[1],
            POWER_UP_LANE_COLOR[2]
          );
          tempCanvas.rectMode(CENTER);

          // Draw the power-up lane as a simple rectangle
          const laneWidth = POWER_UP_LANE_WIDTH;
          const laneHeight = height * 0.8; // Use a percentage of screen height
          tempCanvas.rect(
            BRIDGE_WIDTH / 2 + laneWidth / 2,
            0,
            laneWidth,
            laneHeight
          );

          // Add a few simple lane markers
          tempCanvas.fill(180, 220, 255, 150);
          const markerCount = 5;
          const markerSpacing = laneHeight / markerCount;

          for (let i = 0; i < markerCount; i++) {
            const yPos =
              -laneHeight / 2 + i * markerSpacing + markerSpacing / 2;
            tempCanvas.rect(
              BRIDGE_WIDTH / 2 + laneWidth / 2,
              yPos,
              laneWidth - 20,
              5
            );
          }

          tempCanvas.pop();

          // Draw the 2D canvas to the screen
          image(tempCanvas, -width / 2, -height / 2);
        } else {
          // If we're already in 2D mode, draw directly
          translate(
            width / 2 + BRIDGE_WIDTH / 2 + POWER_UP_LANE_WIDTH / 2,
            height / 2
          );
          fill(...POWER_UP_LANE_COLOR);
          rectMode(CENTER);
          rect(0, 0, POWER_UP_LANE_WIDTH, height * 0.8);

          // Add minimal lane markers
          fill(180, 220, 255, 150);
          const laneHeight = height * 0.8;
          const markerCount = 5;
          const markerSpacing = laneHeight / markerCount;

          for (let i = 0; i < markerCount; i++) {
            const yPos =
              -laneHeight / 2 + i * markerSpacing + markerSpacing / 2;
            rect(0, yPos, POWER_UP_LANE_WIDTH - 20, 5);
          }
        }

        pop();
      } catch (e) {
        console.warn("Error in mobile power-up lane rendering:", e);
        // Fallback to an even simpler rendering if there's an error
        try {
          push();
          fill(
            POWER_UP_LANE_COLOR[0],
            POWER_UP_LANE_COLOR[1],
            POWER_UP_LANE_COLOR[2],
            200
          );
          rect(width - POWER_UP_LANE_WIDTH, 0, POWER_UP_LANE_WIDTH, height);
          pop();
        } catch (e2) {
          console.error("Even fallback power-up lane rendering failed:", e2);
        }
      }
      return; // Exit early for mobile devices
    }

    // For desktop devices, continue with the more detailed rendering
    try {
      // Draw the power-up lane (extended to match main bridge)
      push();
      translate(BRIDGE_WIDTH / 2 + POWER_UP_LANE_WIDTH / 2, 0, 0);

      // Use a slightly different fill color for better contrast
      fill(...POWER_UP_LANE_COLOR);

      // Check if we're in low performance mode
      if (currentPerformanceLevel === PerformanceLevel.LOW) {
        // Use rect() instead of box() for better compatibility
        push();
        rectMode(CENTER);
        translate(0, 0, 0);
        rect(0, 0, POWER_UP_LANE_WIDTH, BRIDGE_LENGTH);
        pop();
      } else {
        // For high-performance devices, try the 3D version with fallback
        try {
          // Check if WebGL context is still valid before drawing
          if (
            drawingContext &&
            drawingContext.isContextLost &&
            !drawingContext.isContextLost()
          ) {
            box(POWER_UP_LANE_WIDTH, BRIDGE_LENGTH, 0);
          } else {
            throw new Error("WebGL context is lost or invalid");
          }
        } catch (e) {
          console.warn("Error drawing power-up lane box:", e);
          // Fallback to a simpler shape if box fails
          push();
          translate(0, 0, 0);
          rectMode(CENTER);
          rect(0, 0, POWER_UP_LANE_WIDTH, BRIDGE_LENGTH);
          pop();
        }
      }

      // Add lane markers/decorations for better visual guidance
      const laneMarkers =
        currentPerformanceLevel === PerformanceLevel.LOW ? 15 : 30;
      const stepSize = BRIDGE_LENGTH / laneMarkers;

      // Draw lane markers
      for (let i = 0; i < laneMarkers; i++) {
        try {
          const yPos = -BRIDGE_LENGTH / 2 + i * stepSize + stepSize / 2;
          push();
          translate(0, yPos, 5); // Position slightly above the lane
          fill(180, 220, 255, 150); // Lighter blue with transparency

          if (currentPerformanceLevel === PerformanceLevel.LOW) {
            // Use rect() for low performance mode
            rectMode(CENTER);
            rect(0, 0, POWER_UP_LANE_WIDTH - 20, 5);
          } else {
            // For high performance, try 3D with fallback
            try {
              if (
                drawingContext &&
                drawingContext.isContextLost &&
                !drawingContext.isContextLost()
              ) {
                box(POWER_UP_LANE_WIDTH - 20, 5, 1); // Thin horizontal marker
              } else {
                throw new Error("WebGL context is lost or invalid");
              }
            } catch (e) {
              // Fallback to a simpler shape if box fails
              rectMode(CENTER);
              rect(0, 0, POWER_UP_LANE_WIDTH - 20, 5);
            }
          }

          pop();
        } catch (e) {
          console.warn("Error drawing lane marker:", e);
          continue; // Skip this marker and continue with the next one
        }
      }

      pop(); // Close the main push
    } catch (e) {
      console.warn("Error in desktop power-up lane rendering:", e);
    }
  } catch (e) {
    console.error("Critical error in drawPowerUpLane:", e);
  }
}

function drawSquad() {
  // Draw squad members
  for (let i = 0; i < squad.length; i++) {
    const member = squad[i];

    push();
    translate(member.x, member.y, member.z);

    // Rotate the member to stand upright
    rotateX(-HALF_PI); // Rotate 90 degrees to make the box stand upright

    // Draw a simple human figure
    drawHuman(member.size, i === 0);

    // Draw health bar above squad member
    push(); // Save the current transformation state
    translate(0, -member.size * 1.5, 0); // Position bar directly above member
    const healthBarWidth = member.size * 1.2;
    const healthBarHeight = 5;
    const healthPercentage = member.health / 100;

    // Background of health bar
    fill(100, 100, 100);
    box(healthBarWidth, healthBarHeight, 2);

    // Health indicator
    fill(0, 255 * healthPercentage, 0);
    translate(-(healthBarWidth - healthBarWidth * healthPercentage) / 2, 0, 1);
    box(healthBarWidth * healthPercentage, healthBarHeight, 3);
    pop(); // Restore the transformation state
    pop();
  }
}

function drawHuman(size, isLeader) {
  // Head
  push();
  translate(0, -size * 0.75, 0);
  fill(200, 150, 150);
  sphere(size * 0.25);
  pop();

  // Body
  push();
  translate(0, -size * 0.25, 0);
  fill(0, 255, 0); // Green shirt
  box(size * 0.5, size, size * 0.3);
  pop();

  // Arms raised holding a gun
  push();
  translate(-size * 0.4, -size * 0.25, 0);
  fill(0, 255, 0); // Green sleeves
  rotateZ(PI / 4);
  box(size * 0.1, size * 0.5, size * 0.1);
  pop();

  push();
  translate(size * 0.4, -size * 0.25, 0);
  fill(0, 255, 0); // Green sleeves
  rotateZ(-PI / 4);
  box(size * 0.1, size * 0.5, size * 0.1);
  pop();

  // Gun rotated 90 degrees towards the top of the screen
  push();
  translate(size * 0.6, -size * 0.5, 0);
  fill(50); // Gun color
  rotateY(HALF_PI); // Rotate the gun 90 degrees
  box(size * 0.5, size * 0.1, size * 0.1);
  pop();

  // Legs
  push();
  translate(-size * 0.2, size * 0.5, 0);
  fill(128, 128, 128); // Gray pants
  box(size * 0.1, size * 0.5, size * 0.1);
  pop();

  push();
  translate(size * 0.2, size * 0.5, 0);
  fill(128, 128, 128); // Gray pants
  box(size * 0.1, size * 0.5, size * 0.1);
  pop();

  // Hat
  push();
  translate(0, -size * 0.95, 0);
  noStroke(); // Remove stroke from the hat
  isLeader ? fill(255, 215, 0) : fill(50, 50, 50); // Gold for leader, dark gray for others
  cylinder(size * 0.3, size * 0.1);
  pop();
}

function drawEnemies() {
  // Count active skills to adjust rendering detail
  const activeSkillCount = Object.values(skills).filter(
    (skill) => skill.active
  ).length;

  // Dynamically reduce detail when multiple skills are active
  const skillDetailMultiplier = Math.max(0.3, 1 - activeSkillCount * 0.2); // Reduce by 20% per active skill, min 30%

  // Adjust distance thresholds based on active skills
  const farDistanceThreshold = activeSkillCount > 1 ? 600 * 600 : 800 * 800;
  const mediumDistanceThreshold = activeSkillCount > 1 ? 300 * 300 : 400 * 400;

  // Limit the number of enemies to render when multiple skills are active
  const maxEnemiesToRender =
    activeSkillCount > 1
      ? Math.floor(enemies.length * skillDetailMultiplier)
      : enemies.length;

  // Sort enemies by distance for better culling
  const sortedEnemies = [...enemies];

  if (squad.length > 0 && activeSkillCount > 1) {
    const mainMember = squad[0];
    sortedEnemies.sort((a, b) => {
      const dxA = a.x - mainMember.x;
      const dyA = a.y - mainMember.y;
      const distA = dxA * dxA + dyA * dyA;

      const dxB = b.x - mainMember.x;
      const dyB = b.y - mainMember.y;
      const distB = dxB * dxB + dyB * dyB;

      return distA - distB; // Sort by closest first
    });
  }

  // Draw enemies with distance-based LOD (Level of Detail)
  for (let i = 0; i < Math.min(maxEnemiesToRender, sortedEnemies.length); i++) {
    const enemy = sortedEnemies[i];

    // Find distance to camera/player for LOD calculations
    let distToCamera = 0;
    if (squad.length > 0) {
      const mainMember = squad[0];
      const dx = enemy.x - mainMember.x;
      const dy = enemy.y - mainMember.y;
      distToCamera = dx * dx + dy * dy; // Squared distance - no need for sqrt
    }

    // Skip very distant enemies when multiple skills are active
    if (activeSkillCount > 1 && distToCamera > farDistanceThreshold) {
      continue;
    }

    push();
    translate(enemy.x, enemy.y, enemy.z + enemy.size / 2);

    // Apply distance-based LOD
    if (distToCamera > farDistanceThreshold) {
      // Very distant enemies - ultra simplified rendering
      fill(...ENEMY_COLORS[enemy.type]);
      sphere(enemy.size / 2);

      // Skip health bar for very distant enemies
      pop();
      continue;
    }

    fill(...ENEMY_COLORS[enemy.type]);

    // Draw different shapes for different enemy types
    if (enemy.type.includes("boss")) {
      // Boss enemies are important - always full detail
      sphere(enemy.size / 2);
    } else if (enemy.type === "elite") {
      // Elite enemies are pyramids
      cone(enemy.size / 2, enemy.size);
    } else {
      // Standard enemies - simplify for medium distances
      if (distToCamera > mediumDistanceThreshold) {
        // Medium distance - use simpler shape
        sphere(enemy.size / 2);
      } else {
        // Close enough for full detail
        box(enemy.size, enemy.size, enemy.size);
      }
    }

    // Only draw health bars for enemies within reasonable distance and when not too many skills active
    if (
      distToCamera < 600 * 600 &&
      (activeSkillCount < 2 || enemy.type.includes("boss"))
    ) {
      // Draw health bar above enemy - only for bosses when multiple skills active
      const maxHealth = getEnemyMaxHealth(enemy.type);
      const healthPercentage = enemy.health / maxHealth;

      translate(0, 0, enemy.size);
      const healthBarWidth = enemy.size * 1.2;
      const healthBarHeight = 5;

      // Use simpler rendering for health bars when skills active
      if (activeSkillCount > 0 && !enemy.type.includes("boss")) {
        // Simplified health bar for non-boss enemies - just the health part, no background
        fill(255 * (1 - healthPercentage), 255 * healthPercentage, 0);
        box(healthBarWidth * healthPercentage, healthBarHeight, 3);
      } else {
        // Full health bar for bosses or when no skills active
        // Background of health bar
        fill(100, 100, 100);
        box(healthBarWidth, healthBarHeight, 2);

        // Health indicator
        fill(255 * (1 - healthPercentage), 255 * healthPercentage, 0);
        translate(
          -(healthBarWidth - healthBarWidth * healthPercentage) / 2,
          0,
          1
        );
        box(healthBarWidth * healthPercentage, healthBarHeight, 3);
      }
    }

    pop();
  }
}

function drawProjectiles() {
  // Count active skills to adjust rendering detail
  const activeSkillCount = Object.values(skills).filter(
    (skill) => skill.active
  ).length;

  // Dynamically reduce detail when multiple skills are active
  const skillDetailMultiplier = Math.max(0.3, 1 - activeSkillCount * 0.2); // Reduce by 20% per active skill, min 30%

  // Adjust distance thresholds based on active skills
  const farDistanceThreshold = activeSkillCount > 1 ? 600 * 600 : 800 * 800;
  const mediumDistanceThreshold = activeSkillCount > 1 ? 300 * 300 : 400 * 400;

  // Draw projectiles with performance optimizations
  for (let proj of projectiles) {
    // Distance-based Level of Detail
    let distToCamera = 0;
    if (squad.length > 0) {
      const mainMember = squad[0];
      const dx = proj.x - mainMember.x;
      const dy = proj.y - mainMember.y;
      distToCamera = dx * dx + dy * dy; // Squared distance
    }

    // Skip rendering very distant projectiles when multiple skills are active
    if (activeSkillCount > 1 && distToCamera > farDistanceThreshold) {
      continue;
    }

    push();
    translate(proj.x, proj.y, proj.z);

    // Use custom color if defined, otherwise use weapon color
    let projColor = proj.color
      ? [...proj.color]
      : [...(WEAPON_COLORS[proj.weapon] || [255, 255, 255])];

    // Enhanced visuals based on power-up levels
    let enhancedSize = 1.0;
    let hasGlowEffect = false;

    // Check if this is a machine gun projectile
    const isMachineGunProjectile =
      skills[SkillName.MACHINE_GUN].active &&
      proj.color &&
      proj.color[0] === 255 &&
      proj.color[1] === 215 &&
      proj.color[2] === 0;

    // Modify projectile appearance based on power-ups
    if (damageBoost > 5) {
      // Add red glow for high damage
      projColor[0] = min(255, projColor[0] + 50);
      enhancedSize *= 1.2;
      hasGlowEffect = true;
    }
    if (fireRateBoost > 5) {
      // Add green glow for high fire rate
      projColor[1] = min(255, projColor[1] + 50);
      enhancedSize *= 1.1;
      hasGlowEffect = true;
    }
    if (aoeBoost > 5) {
      // Add blue glow for high AOE
      projColor[2] = min(255, projColor[2] + 100);
      enhancedSize *= 1.3;
      hasGlowEffect = true;
    }

    // For very distant projectiles, use simple rendering
    if (distToCamera > 800 * 800) {
      fill(projColor[0], projColor[1], projColor[2]);
      sphere(proj.size);
      pop();
      continue;
    }

    // Add glow effect for enhanced projectiles (but only at medium-close distances)
    if (hasGlowEffect && distToCamera < 500 * 500) {
      // Outer glow
      push();
      noStroke();
      fill(projColor[0], projColor[1], projColor[2], 150);
      sphere(proj.size * 1.5 * enhancedSize);
      pop();

      // Add trail effect (only for medium-close distances)
      if (distToCamera < 300 * 300) {
        push();
        translate(0, PROJECTILE_SPEED * 0.5, 0); // Position behind bullet
        fill(projColor[0], projColor[1], projColor[2], 100);
        sphere(proj.size * 1.2 * enhancedSize);
        pop();

        // For very powerful bullets, add an additional effect (only for close distances)
        if (
          damageBoost + fireRateBoost + aoeBoost > 15 &&
          distToCamera < 200 * 200
        ) {
          push();
          translate(0, PROJECTILE_SPEED * 1.0, 0); // Further behind
          fill(projColor[0], projColor[1], projColor[2], 70);
          sphere(proj.size * 0.9 * enhancedSize);
          pop();
        }
      }
    }

    // Main projectile with enhanced color
    fill(projColor[0], projColor[1], projColor[2]);

    // Different projectile shapes based on weapon type and distance
    // For medium-range and farther projectiles, use simplified rendering
    if (distToCamera > 400 * 400) {
      // Simplified rendering for distant projectiles
      sphere(proj.size);
    } else if (proj.weapon === "blaster") {
      // Enhanced Green laser beam with a glowing effect - fewer effects at distance
      const detailLevel = distToCamera < 200 * 200 ? 3 : 1;
      for (let i = 0; i < detailLevel; i++) {
        push();
        rotateX(frameCount * 0.1 + i);
        rotateY(frameCount * 0.1 + i);
        torus(proj.size * enhancedSize, proj.size * 0.1);
        pop();
      }
    } else if (proj.weapon === "thunderbolt") {
      // Thunder projectile with a zigzag pattern - simplified at distance
      stroke(255, 255, 0);
      strokeWeight(2);
      noFill();
      beginShape();
      let x = 0,
        y = 0,
        z = 0;
      // Fewer vertices for distant projectiles
      const vertexCount = distToCamera < 200 * 200 ? 10 : 5;
      for (let i = 0; i < vertexCount; i++) {
        vertex(x, y, z);
        x += random(-5, 5);
        y += random(-5, 5);
        z += random(5, 15);
      }
      endShape();
    } else if (proj.weapon === "inferno") {
      // Fire projectile with a dynamic flame effect - fewer particles at distance
      const particleCount = distToCamera < 200 * 200 ? 5 : 2;
      for (let i = 0; i < particleCount; i++) {
        push();
        translate(random(-5, 5), random(-5, 5), random(-5, 5));
        rotateY(frameCount * 0.1);
        cone(proj.size * 0.5, proj.size * enhancedSize);
        pop();
      }
    } else if (proj.weapon === "frostbite") {
      // Ice projectile with crystal spikes - fewer spikes at distance
      const spikeCount = distToCamera < 200 * 200 ? 6 : 3;
      for (let i = 0; i < spikeCount; i++) {
        push();
        rotateX(random(TWO_PI));
        rotateY(random(TWO_PI));
        translate(0, 0, proj.size * 0.4);
        box(proj.size * 0.2, proj.size * 0.2, proj.size * 0.8);
        pop();
      }
    } else if (proj.weapon === "vortex") {
      // Vortex projectile with swirling rings - fewer rings at distance
      const ringCount = distToCamera < 200 * 200 ? 3 : 1;
      for (let i = 0; i < ringCount; i++) {
        push();
        rotateX(frameCount * 0.1 + i);
        rotateY(frameCount * 0.1 + i);
        torus(proj.size * 0.8, proj.size * 0.1);
        pop();
      }
    } else if (proj.weapon === "plasma") {
      // Plasma projectile with a pulsating effect - fewer pulses at distance
      const pulseCount = distToCamera < 200 * 200 ? 3 : 1;
      for (let i = 0; i < pulseCount; i++) {
        push();
        translate(random(-5, 5), random(-5, 5), random(-5, 5));
        sphere(proj.size * (0.8 + sin(frameCount * 0.2 + i) * 0.2));
        pop();
      }
    } else if (proj.weapon === "photon") {
      // Photon projectile with a rotating disc - fewer discs at distance
      const discCount = distToCamera < 200 * 200 ? 3 : 1;
      for (let i = 0; i < discCount; i++) {
        push();
        rotateX(frameCount * 0.1 + i);
        rotateY(frameCount * 0.1 + i);
        cylinder(proj.size * 0.5, proj.size * 0.2);
        pop();
      }
    } else if (isMachineGunProjectile) {
      // Special rendering for machine gun projectiles
      // Elongated bullet shape for machine gun projectiles
      push();
      // Rotate to face direction of travel
      rotateX(HALF_PI);

      // Bullet body (cylinder)
      fill(255, 215, 0);
      cylinder(proj.size * 0.4, proj.size * 1.5);

      // Bullet tip (cone)
      translate(0, proj.size * 0.8, 0);
      fill(255, 200, 50);
      cone(proj.size * 0.4, proj.size * 0.5);

      // Bullet trail/muzzle flash (only for close projectiles)
      if (distToCamera < 300 * 300) {
        translate(0, -proj.size * 2, 0);
        fill(255, 150, 0, 150);
        cone(proj.size * 0.3, proj.size * 0.7);
      }
      pop();
    } else {
      // Default sphere
      sphere(proj.size);
    }
    pop();
  }
}

function drawEffects() {
  // Get performance-based multipliers
  const effectMultiplier = getEffectMultiplier();

  // Count active skills to adjust rendering
  const activeSkillCount = Object.values(skills).filter(
    (skill) => skill.active
  ).length;

  // Dynamically reduce effects when multiple skills are active
  const skillMultiplier = Math.max(0.4, 1 - activeSkillCount * 0.2); // Reduce by 20% per active skill, min 40%

  // Determine if we should use high-detail effects
  const useHighDetail = currentPerformanceLevel === "high";
  const useMediumDetail = currentPerformanceLevel === "medium";
  const useLowDetail = currentPerformanceLevel === "low";

  // Limit the number of effects to render based on performance level and active skills
  const maxEffectsToRender = isMobileDevice
    ? useLowDetail
      ? Math.floor(50 * skillMultiplier)
      : useMediumDetail
      ? Math.floor(100 * skillMultiplier)
      : Math.floor(150 * skillMultiplier)
    : useLowDetail
    ? Math.floor(100 * skillMultiplier)
    : useMediumDetail
    ? Math.floor(200 * skillMultiplier)
    : Math.floor(300 * skillMultiplier);

  // Sort effects by priority (certain effect types are more important)
  const priorityEffects = effects.filter(
    (e) =>
      e.forceRenderDetail ||
      e.type === "atomicBomb" ||
      e.type === "atomicExplosion" ||
      e.type === "atomicFlash" ||
      e.type === "shockwave" ||
      e.type === "areaBarrier" ||
      e.type === "globalFrost"
  );

  const normalEffects = effects.filter(
    (e) =>
      !e.forceRenderDetail &&
      e.type !== "atomicBomb" &&
      e.type !== "atomicExplosion" &&
      e.type !== "atomicFlash" &&
      e.type !== "shockwave" &&
      e.type !== "areaBarrier" &&
      e.type !== "globalFrost"
  );

  // Combine effects, prioritizing important ones
  const effectsToRender = [
    ...priorityEffects,
    ...normalEffects.slice(
      0,
      Math.max(0, maxEffectsToRender - priorityEffects.length)
    ),
  ];

  // Process delayed effects before rendering
  // This replaces the setTimeout approach with a frame-based delay system
  for (let i = effects.length - 1; i >= 0; i--) {
    if (effects[i].delayFrames !== undefined) {
      effects[i].delayFrames--;
      if (effects[i].delayFrames <= 0) {
        // Remove the delay property and keep the effect
        delete effects[i].delayFrames;
      }
    }
  }

  // Draw visual effects - optimized with distance culling
  // Skip effects that are still delayed
  for (let effect of effectsToRender.filter(
    (e) => e.delayFrames === undefined
  )) {
    // Skip rendering effects too far from the player (distance culling)
    // Find closest squad member to use as reference
    if (squad.length > 0) {
      const mainMember = squad[0];
      const dx = effect.x - mainMember.x;
      const dy = effect.y - mainMember.y;
      const distSquared = dx * dx + dy * dy;

      // Skip distance culling for effects that should always render in detail
      const forceDetailedRendering =
        effect.forceRenderDetail ||
        effect.type === "atomicBomb" ||
        effect.type === "atomicExplosion" ||
        effect.type === "atomicFlash" ||
        effect.type === "shockwave" ||
        effect.type === "areaBarrier" ||
        effect.type === "globalFrost" ||
        effect.type === "barrier";

      // On mobile/low performance, use more aggressive culling
      const cullingDistanceSquared = isMobileDevice
        ? useLowDetail
          ? 300 * 300
          : 400 * 400
        : 500 * 500;

      // Fast distance check - if effect is far away AND not forced to render in detail, skip detailed rendering
      if (!forceDetailedRendering && distSquared > cullingDistanceSquared) {
        // On low performance, skip some distant effects entirely
        if (useLowDetail && random() > 0.5 && !forceDetailedRendering) {
          continue;
        }

        // Draw simplified version for distant effects
        push();
        translate(effect.x, effect.y, effect.z);
        const effectColor = effect.color || [255, 255, 255];
        fill(...effectColor, 200 * (effect.life / EFFECT_DURATION));
        sphere(effect.size * 0.5);
        pop();
        continue;
      }
    }

    push();
    translate(effect.x, effect.y, effect.z);

    // Default color if effect.color is undefined
    const effectColor = effect.color || [255, 255, 255];

    // Apply LOD (Level of Detail) based on effect life and performance level
    // Less particles as effect fades away and on lower performance settings
    const lifeFactor = effect.life > EFFECT_DURATION / 2 ? 1.0 : 0.5;

    // Scale particle count based on performance level
    let performanceFactor = 1.0;
    if (isMobileDevice) {
      performanceFactor = useLowDetail ? 0.3 : useMediumDetail ? 0.6 : 0.8;
    } else {
      performanceFactor = useLowDetail ? 0.5 : useMediumDetail ? 0.8 : 1.0;
    }

    // Further reduce particles when multiple skills are active
    const activeSkillCount = Object.values(skills).filter(
      (skill) => skill.active
    ).length;
    const skillFactor = Math.max(0.3, 1 - activeSkillCount * 0.2); // Reduce by 20% per active skill, min 30%

    // Calculate final particle count
    const baseParticleCount = 10;
    const particleCount = Math.ceil(
      lifeFactor * performanceFactor * skillFactor * baseParticleCount
    );

    if (effect.type === "explosion") {
      // Explosion effect
      fill(...effectColor, 255 * (effect.life / EFFECT_DURATION));
      // Reduce particle count based on detail level
      for (let i = 0; i < particleCount; i++) {
        push();
        rotateX(random(TWO_PI));
        rotateY(random(TWO_PI));
        translate(random(-20, 20), random(-20, 20), random(-20, 20));
        sphere(effect.size * 0.2);
        pop();
      }
      // Reduce secondary particles even more
      for (let i = 0; i < Math.ceil(particleCount / 2); i++) {
        push();
        rotateX(random(TWO_PI));
        rotateY(random(TWO_PI));
        translate(random(-30, 30), random(-30, 30), random(-30, 30));
        cone(effect.size * 0.1, effect.size * 0.5);
        pop();
      }
    } else if (effect.type === "hit") {
      // Hit effect - simplified
      fill(...effectColor, 255 * (effect.life / EFFECT_DURATION));
      // Reduce particle count
      const hitParticles = Math.min(
        8,
        Math.ceil(lifeFactor * performanceFactor * 8)
      );
      for (let i = 0; i < hitParticles; i++) {
        push();
        translate(random(-10, 10), random(-10, 10), random(-10, 10));
        box(effect.size * 0.2);
        pop();
      }
      // Skip secondary particles when low detail
      if (lifeFactor * performanceFactor > 0.7) {
        for (let i = 0; i < 2; i++) {
          push();
          translate(random(-15, 15), random(-15, 15), random(-15, 15));
          cone(effect.size * 0.1, effect.size * 0.3);
          pop();
        }
      }
    } else if (effect.type === "fire") {
      // Fire effect - simplified
      fill(255, 100 + random(155), 0, 255 * (effect.life / EFFECT_DURATION));
      // Reduce particle count
      const fireParticles = Math.ceil(lifeFactor * performanceFactor * 5);
      for (let i = 0; i < fireParticles; i++) {
        push();
        translate(random(-10, 10), random(-10, 10), random(0, 20));
        sphere(5 + random(5));
        pop();
      }
      // Fewer secondary particles
      if (lifeFactor * performanceFactor > 0.6) {
        for (let i = 0; i < 2; i++) {
          push();
          translate(random(-10, 10), random(-10, 10), random(0, 20));
          cylinder(3 + random(3), 10);
          pop();
        }
      }
    } else if (effect.type === "ice") {
      // Enhanced Ice effect - simplified
      fill(200, 200, 255, 255 * (effect.life / EFFECT_DURATION));
      // Reduce particle count
      const iceParticles = Math.ceil(lifeFactor * performanceFactor * 10);
      for (let i = 0; i < iceParticles; i++) {
        push();
        translate(random(-15, 15), random(-15, 15), random(-15, 15));
        box(effect.size * 0.1, effect.size * 0.1, effect.size * 0.5);
        pop();
      }
      // Skip secondary particles when low detail
      if (lifeFactor * performanceFactor > 0.7) {
        for (let i = 0; i < 3; i++) {
          push();
          translate(random(-20, 20), random(-20, 20), random(-20, 20));
          cone(effect.size * 0.1, effect.size * 0.3);
          pop();
        }
      }
    } else if (effect.type === "thunder") {
      // Realistic Thunder effect - simplified
      stroke(255, 255, 0, 255 * (effect.life / EFFECT_DURATION));
      strokeWeight(3);
      // Reduce lightning bolts
      const thunderLines = Math.ceil(lifeFactor * performanceFactor * 3);
      for (let i = 0; i < thunderLines; i++) {
        push();
        translate(0, -50, 0); // Start from above
        beginShape();
        let x = 0,
          y = 0,
          z = 0;
        // Simplified lightning path
        const points = Math.max(
          5,
          Math.ceil(lifeFactor * performanceFactor * 10)
        );
        for (let j = 0; j < points; j++) {
          vertex(x, y, z);
          x += random(-10, 10);
          y += random(5, 15); // Move downwards
          z += random(-10, 10);
        }
        endShape();
        pop();
      }
    } else if (effect.type === "vortex") {
      // Vortex effect - simplified
      rotateZ(frameCount * 0.1);
      fill(150, 0, 255, 200 * (effect.life / EFFECT_DURATION));
      // Reduce torus count
      const torusCount = Math.ceil(lifeFactor * performanceFactor * 5);
      for (let i = 0; i < torusCount; i++) {
        push();
        rotateX(frameCount * 0.05);
        rotateY(frameCount * 0.05);
        torus(30 * (1 - effect.life / EFFECT_DURATION), 5);
        pop();
      }
    } else if (effect.type === "plasma") {
      // Plasma effect - simplified
      fill(255, 0, 255, 200 * (effect.life / EFFECT_DURATION));
      // Reduce particle count
      const plasmaParticles = Math.ceil(lifeFactor * performanceFactor * 4);
      for (let i = 0; i < plasmaParticles; i++) {
        push();
        translate(random(-20, 20), random(-20, 20), random(0, 10));
        rotateX(frameCount * 0.03);
        rotateY(frameCount * 0.03);
        ellipsoid(5 + random(5), 3 + random(3), 3 + random(3));
        pop();
      }
    } else if (effect.type === "shield") {
      // Shield effect - always needed at full detail for gameplay
      noFill();
      stroke(0, 150, 255, 100 * (effect.life / EFFECT_DURATION));
      strokeWeight(1);
      for (let i = 0; i < 3; i++) {
        push();
        rotateX(frameCount * 0.02 + i);
        rotateY(frameCount * 0.02 + i);
        sphere(effect.size * 0.8);
        pop();
      }

      fill(0, 150, 255, 30 * (effect.life / EFFECT_DURATION));
      for (let i = 0; i < 2; i++) {
        push();
        rotateX(frameCount * 0.05 + i);
        rotateY(frameCount * 0.05 + i);
        torus(effect.size * 0.6, 3);
        pop();
      }
    } else if (effect.type === "barrier") {
      // Barrier effect - wall that enemies target first
      noStroke();

      // Calculate health percentage for color
      const healthPercent = effect.health / effect.maxHealth;

      // Color changes from yellow brick to red as health decreases
      const r = 230 + (1 - healthPercent) * 25; // 230 to 255
      const g = 180 - (1 - healthPercent) * 130; // 180 to 50
      const b = 60 - (1 - healthPercent) * 10; // 60 to 50

      // Draw the barrier wall
      push();
      fill(r, g, b, 200 * (effect.life / effect.life));

      // Draw the main barrier wall
      box(effect.width, effect.thickness, effect.height);

      // Draw health bar above the barrier
      push();
      translate(0, 0, effect.height / 2 + 20);

      // Background of health bar
      fill(50, 50, 50, 200);
      box(effect.width * 0.8, 10, 5);

      // Actual health bar
      translate(-effect.width * 0.4 * (1 - healthPercent), 0, 0);
      fill(r, g, b, 230);
      box(effect.width * 0.8 * healthPercent, 10, 5);
      pop();

      // Add some detail to the barrier
      if (currentPerformanceLevel !== PerformanceLevel.LOW) {
        // Add vertical supports
        const supportCount = Math.min(5, Math.floor(effect.width / 50));
        for (let i = 0; i < supportCount; i++) {
          const offsetX = (i / (supportCount - 1) - 0.5) * effect.width;

          push();
          translate(offsetX, 0, 0);
          fill(r * 0.8, g * 0.8, b * 0.8, 230);
          box(effect.thickness * 1.5, effect.thickness * 1.5, effect.height);
          pop();
        }

        // Add horizontal reinforcements
        push();
        translate(0, 0, -effect.height * 0.25);
        fill(r * 0.9, g * 0.9, b * 0.9, 230);
        box(effect.width, effect.thickness * 1.2, effect.thickness * 1.2);
        pop();

        push();
        translate(0, 0, effect.height * 0.25);
        fill(r * 0.9, g * 0.9, b * 0.9, 230);
        box(effect.width, effect.thickness * 1.2, effect.thickness * 1.2);
        pop();
      }

      // Add energy field effect
      if (currentPerformanceLevel === PerformanceLevel.HIGH) {
        for (let i = 0; i < 5; i++) {
          if (frameCount % 10 === i) {
            const offsetX = random(-effect.width / 2, effect.width / 2);
            const offsetZ = random(-effect.height / 2, effect.height / 2);

            effects.push({
              x: effect.x + offsetX,
              y: effect.y,
              z: effect.z + offsetZ,
              type: "energyBurst",
              size: 15,
              life: 10,
              color: [r, g, b, 150], // Uses the same color as the barrier
              forceRenderDetail: false,
            });
          }
        }
      }

      pop();
    } else if (effect.type === "machineGun") {
      // Machine Gun effect - visual indicator for active machine gun skill
      // Follow the squad member if reference exists
      if (effect.member) {
        effect.x = effect.member.x;
        effect.y = effect.member.y;
        effect.z = effect.member.z;
      }

      // Pulsing yellow/orange aura with occasional muzzle flashes
      const pulseRate = frameCount % 10;
      const flashIntensity = pulseRate < 3 ? 1 : 0.5; // Brighter during "flash" frames

      // Main aura
      noFill();
      stroke(
        255,
        200 * flashIntensity,
        0,
        150 * (effect.life / skills[SkillName.MACHINE_GUN].activeDuration)
      );
      strokeWeight(2);
      sphere(effect.size * 0.9);

      // Inner glow
      fill(
        255,
        200 * flashIntensity,
        0,
        30 * (effect.life / skills[SkillName.MACHINE_GUN].activeDuration)
      );
      for (let i = 0; i < 2; i++) {
        push();
        // Rotate based on squad member position and frame count
        const rotAngle = atan2(effect.y, effect.x) + frameCount * 0.1;
        rotateZ(rotAngle + (i * PI) / 4);

        // Draw "barrel" indicators in front of the member
        translate(0, -effect.size * 0.8, 0); // Position in front
        cylinder(effect.size * 0.15, effect.size * 0.5);
        pop();
      }

      // Add small particles for "shell casings" occasionally
      if (frameCount % 5 === 0) {
        push();
        fill(200, 150, 0, 150);
        translate(
          random(-effect.size / 2, effect.size / 2),
          -effect.size * 0.6,
          random(-effect.size / 2, effect.size / 2)
        );
        box(3, 6, 3);
        pop();
      }
    } else if (effect.type === "atomicBomb") {
      // Render falling bomb with elaborate trail
      push();

      // Update position as it falls from sky to target using consistent timing
      if (effect.endPos) {
        const progress = 1 - effect.life / ATOMIC_BOMB_FALL_DURATION; // 0 to 1 as it falls
        effect.z = 800 - (800 - effect.endPos.z) * progress; // Linear interpolation from 800 to ground

        // Record current position for trail (less frequent for slower fall)
        if (frameCount % 8 === 0 && effect.trail) {
          // Every 8 frames (was 3)
          effect.trail.push({
            x: effect.x,
            y: effect.y,
            z: effect.z,
            age: 0,
          });

          // Limit trail length
          if (effect.trail.length > 10) {
            // Reduced from 20 to 10 for cleaner trail
            effect.trail.shift();
          }
        }

        // Age trail points
        if (effect.trail) {
          for (let point of effect.trail) {
            point.age++;
          }
        }
      }

      // Bomb body - fixed orientation pointing downward in player view
      fill(50, 50, 50); // Dark gray
      rotateX(HALF_PI); // Align bomb with player view
      // Fixed rotation angle rather than changing each frame for consistent orientation
      rotateZ(effect.fallStartTime * 0.1); // Fixed rotation based on start time

      // Main bomb shape - "Little Boy" style atomic bomb with enhanced visibility
      push();
      // Main body - slightly larger and more metallic color
      fill(60, 60, 70); // More bluish metallic color
      cylinder(effect.size / 2.3, effect.size * 1.6); // Slightly larger

      // Nose cone - more prominent (pointing toward the ground in player view)
      push();
      fill(80, 80, 90); // Lighter color for nose
      translate(0, effect.size * 0.8, 0); // In rotated space: Y+ is down toward ground
      rotateX(PI); // Rotate cone to point downward
      cone(effect.size / 2.3, effect.size * 0.7); // Slightly larger
      pop();

      // Tail fins - more visible (adjusted for player view)
      fill(90, 90, 100); // Lighter color for fins
      for (let i = 0; i < 4; i++) {
        push();
        rotateZ((i * PI) / 2);
        translate(effect.size * 0.6, -effect.size * 0.5, 0); // Y- is up in rotated space

        // Trapezoidal fin shape (aligned with player view)
        beginShape();
        vertex(0, 0, 0);
        vertex(effect.size * 0.45, -effect.size * 0.3, 0); // Horizontal spread
        vertex(effect.size * 0.45, effect.size * 0.4, 0); // Horizontal spread
        vertex(0, effect.size * 0.7, 0); // Extend back along Y axis
        endShape(CLOSE);
        pop();
      }

      // More prominent bomb casing stripes (oriented for player view)
      push();
      fill(180, 20, 20); // Brighter red stripes
      stroke(200, 200, 200); // Add silver outline
      strokeWeight(1);
      // No need for additional rotation - already in rotated space
      for (let i = 0; i < 3; i++) {
        push();
        translate(0, -effect.size * 0.5 + i * effect.size * 0.5, 0); // Position along rotated Y axis
        rotateY(PI / 2); // Rotate torus to encircle the cylinder
        torus(effect.size / 2.3 + 0.1, effect.size / 15); // Slightly larger
        pop();
      }

      // Add warning markings (oriented for player view)
      push();
      fill(220, 220, 40); // Bright yellow

      // Warning triangle on the side of the bomb
      const triangleSize = effect.size * 0.5;
      rotateZ(PI / 4); // Rotate triangle for better visibility
      translate((effect.size / 2.3) * 0.8, 0, 0); // Position on the side of the bomb

      // Draw triangle perpendicular to bomb surface
      beginShape();
      vertex(0.1, -triangleSize / 2, -triangleSize / 2);
      vertex(0.1, -triangleSize / 2, triangleSize / 2);
      vertex(0.1, triangleSize / 2, 0);
      endShape(CLOSE);
      pop();
      pop();
      pop();

      // Draw trail of previous positions
      if (effect.trail) {
        for (let i = 0; i < effect.trail.length; i++) {
          const point = effect.trail[i];
          const trailFade = 1 - point.age / 60; // Fade based on age

          if (trailFade > 0) {
            // Main smoke trail
            push();
            translate(
              point.x - effect.x,
              point.y - effect.y,
              point.z - effect.z
            );

            // Minimal smoke puffs for better bomb visibility
            fill(230, 230, 230, 80 * trailFade); // Much more transparent smoke
            for (let j = 0; j < 2; j++) {
              // Reduced from 5 to 2 puffs
              push();
              const spread = effect.size * (0.5 + point.age / 20); // Less spread
              translate(
                random(-spread, spread),
                random(-spread, spread),
                random(-spread, spread)
              );
              const smokeSize =
                random(effect.size / 6, effect.size / 2) * (1 + point.age / 40); // Smaller puffs
              sphere(smokeSize * trailFade);
              pop();
            }

            // Add fire particles for recent trail points
            if (point.age < 10) {
              for (let j = 0; j < 3; j++) {
                push();
                fill(255, random(100, 200), 0, 200 * trailFade);
                translate(
                  random(-effect.size / 2, effect.size / 2),
                  random(-effect.size / 2, effect.size / 2),
                  random(-effect.size / 2, effect.size / 2)
                );
                sphere(random(effect.size / 6, effect.size / 3));
                pop();
              }
            }

            pop();
          }
        }
      }

      // Add minimal fire effect at the bomb's current position (reduced smoke for visibility)
      push();
      // Fire at the tail - smaller and fewer flames
      for (let i = 0; i < 5; i++) {
        // Reduced from 10 to 5 flames
        push();
        fill(255, random(150, 250), 0, random(180, 255)); // Brighter flames
        translate(
          random(-effect.size / 4, effect.size / 4),
          random(-effect.size / 4, effect.size / 4),
          effect.size * 0.7 + random(0, effect.size / 3)
        );
        sphere(random(effect.size / 6, effect.size / 3)); // Smaller flames
        pop();
      }

      // Minimal smoke trail for better bomb visibility
      for (let i = 0; i < 6; i++) {
        // Reduced from 15 to 6 smoke puffs
        push();
        const smokeGray = random(180, 240); // Lighter smoke
        fill(smokeGray, smokeGray, smokeGray, random(50, 100)); // More transparent smoke
        translate(
          random(-effect.size / 2, effect.size / 2), // Less spread
          random(-effect.size / 2, effect.size / 2), // Less spread
          effect.size + random(0, effect.size) // Less tail length
        );
        sphere(random(effect.size / 5, effect.size / 2)); // Smaller smoke puffs
        pop();
      }
      pop();

      pop();
    } else if (effect.type === "atomicExplosion") {
      // Render atomic explosion with mushroom cloud effect
      push();

      // Use custom color if defined
      const explosionColor = effect.color || [255, 200, 50];
      const alpha = 255 * (effect.life / 120); // Fade out based on life

      // Draw based on which layer of the explosion this is
      const layer = effect.layer || 0;

      if (layer === 0) {
        // Central bright flash
        // Central bright core
        fill(explosionColor[0], explosionColor[1], explosionColor[2], alpha);
        sphere(effect.size * 0.8);

        // Add random particles for initial explosion
        for (let i = 0; i < 10; i++) {
          push();
          const angle = random(TWO_PI);
          const radius = random(effect.size * 0.5, effect.size * 1.2);
          translate(
            cos(angle) * radius,
            sin(angle) * radius,
            random(-effect.size / 2, effect.size / 2)
          );
          fill(255, 255, 200, random(100, 200));
          sphere(random(5, 15));
          pop();
        }
      } else if (layer === 1) {
        // Fire layer
        // Fire sphere
        fill(explosionColor[0], explosionColor[1], explosionColor[2], alpha);
        sphere(effect.size * 0.9);

        // Add flame effects
        for (let i = 0; i < 15; i++) {
          push();
          const angle = random(TWO_PI);
          const radius = random(effect.size * 0.8, effect.size * 1.1);
          translate(
            cos(angle) * radius,
            sin(angle) * radius,
            random(-effect.size / 2, effect.size)
          );
          fill(255, random(100, 200), random(0, 100), random(150, 255));
          rotateX(random(TWO_PI));
          rotateY(random(TWO_PI));
          cone(random(5, 15), random(20, 40));
          pop();
        }
      } else if (layer === 2) {
        // Mushroom stem
        // Draw mushroom stem with correct orientation for player view
        push();
        // Rotate to align with player view
        rotateX(HALF_PI);

        fill(explosionColor[0], explosionColor[1], explosionColor[2], alpha);
        // Place stem along Y-axis after rotation
        translate(0, effect.size * 0.3, 0);
        cylinder(effect.size * 0.4, effect.size * 1.5);
        pop();

        // Draw base spheroid with correct orientation
        push();
        fill(
          explosionColor[0],
          explosionColor[1],
          explosionColor[2],
          alpha * 0.7
        );
        sphere(effect.size * 0.7);
        pop();
      } else if (layer === 3) {
        // Mushroom cap
        // Mushroom cap with correct orientation
        push();
        // Rotate to align with player view
        rotateX(HALF_PI);

        fill(
          explosionColor[0],
          explosionColor[1],
          explosionColor[2],
          alpha * 0.8
        );
        // Place cap along Y-axis after rotation
        translate(0, effect.size * 1.2, 0);

        // Mushroom cap top
        push();
        scale(1.2, 1.2, 0.7); // Flattened sphere for mushroom cap
        sphere(effect.size * 0.9);
        pop();

        // Add smoke/debris effects around the cap with correct orientation
        for (let i = 0; i < 20; i++) {
          push();
          const angle = random(TWO_PI);
          const radius = random(effect.size * 0.8, effect.size * 1.4);
          const height = random(effect.size * 0.1, effect.size * 0.5);
          // After rotation, debris should spread in X-Z plane with NEGATIVE Y as height (to be on top)
          translate(cos(angle) * radius, height, sin(angle) * radius);
          fill(100, 100, 100, random(50, 150));
          sphere(random(5, 20));
          pop();
        }
        pop();
      } else if (layer === 4) {
        // Outer smoke/debris
        // Large smoke cloud with correct orientation
        push();
        // Rotate to align with player view
        rotateX(HALF_PI);

        noFill();
        stroke(
          explosionColor[0],
          explosionColor[1],
          explosionColor[2],
          alpha * 0.5
        );
        strokeWeight(2);

        // Draw smoke cloud as a series of perturbed spheres
        for (let i = 0; i < 15; i++) {
          push();
          // In rotated space: X is right/left, Y is up/down, Z is forward/back
          translate(
            random(-effect.size, effect.size), // Spread horizontally (left/right)
            random(effect.size * 0.8, effect.size * 1.6), // Height (up from ground)
            random(-effect.size, effect.size) // Spread horizontally (forward/back)
          );
          sphere(random(effect.size * 0.2, effect.size * 0.5));
          pop();
        }

        // Add debris particles with correct orientation
        for (let i = 0; i < 25; i++) {
          push();
          const angle = random(TWO_PI);
          const radius = random(effect.size * 0.8, effect.size * 1.8);
          const height = random(0, effect.size * 2);
          translate(
            cos(angle) * radius, // X (horizontal spread after rotation)
            height, // Up in Y direction (after rotation)
            sin(angle) * radius // Z (horizontal spread after rotation)
          );
          fill(200, 200, 200, random(30, 80));
          box(random(3, 10));
          pop();
        }
        pop(); // Close the rotateX transformation
      }

      pop();
    } else if (
      effect.type === "shockwave" ||
      effect.type === "directionalShockwave"
    ) {
      // Shockwave effect for area damage skill
      push();
      noFill();

      // Get effect color (default to blue if not specified)
      const effectColor = effect.color || [0, 200, 255];

      // Pulsing ring
      const alpha = 200 * (effect.life / 60); // Fade based on life
      stroke(effectColor[0], effectColor[1], effectColor[2], alpha);
      strokeWeight(5);

      // Expanding ring
      if (effect.type === "directionalShockwave") {
        // Draw half-circle arc for directional shockwave
        const angleStart = effect.angleStart || 0;
        const angleEnd = effect.angleEnd || PI;

        // Rotate 90 degrees around Y axis to change the orientation of the half-circle
        push();
        // Translate up to raise the effect above the bridge
        translate(0, 0, 10); // Raise the effect 100 units above the bridge (negative Y is up)
        rotateY(HALF_PI); // Rotate 90 degrees around Y axis
        rotateZ(HALF_PI); // Rotate 90 degrees around Z axis

        // Draw main arc
        push();
        beginShape();
        for (let angle = angleStart; angle <= angleEnd; angle += 0.1) {
          const x = cos(angle) * effect.size;
          const z = sin(angle) * effect.size;
          vertex(x, 0, z);
        }
        endShape();

        // Draw radius lines to complete the half-circle
        line(
          0,
          0,
          0,
          cos(angleStart) * effect.size,
          0,
          sin(angleStart) * effect.size
        );
        line(
          0,
          0,
          0,
          cos(angleEnd) * effect.size,
          0,
          sin(angleEnd) * effect.size
        );
        pop();

        // Add inner arc for more visual interest
        // Lighter version of the main color
        const innerColor = [
          Math.min(255, effectColor[0] + 50),
          Math.min(255, effectColor[1] + 50),
          Math.min(255, effectColor[2] + 50),
        ];
        stroke(innerColor[0], innerColor[1], innerColor[2], alpha * 0.7);
        strokeWeight(3);

        push();
        beginShape();
        for (let angle = angleStart; angle <= angleEnd; angle += 0.1) {
          const x = cos(angle) * effect.size * 0.8;
          const z = sin(angle) * effect.size * 0.8;
          vertex(x, 0, z);
        }
        endShape();
        pop();

        // Add energy particles around the arc
        if (effect.life > 30) {
          // Only show particles during first half of effect
          noStroke();
          fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.8);

          // Number of particles based on size - increased for better visibility
          const particleCount = Math.min(25, Math.ceil(effect.size / 20));

          for (let i = 0; i < particleCount; i++) {
            push();
            // Random angle within the arc range
            const angle = random(angleStart, angleEnd);
            const radius = effect.size * random(0.9, 1.1);

            // Position particles around the arc
            translate(cos(angle) * radius, 0, sin(angle) * radius);

            // Particle size varies - increased for better visibility
            const particleSize = random(8, 20);
            sphere(particleSize);
            pop();
          }
        }

        // Add a glowing effect to make it more visible
        push();
        noStroke();
        // Use a brighter version of the effect color for the glow
        const glowColor = [
          Math.min(255, effectColor[0] + 80),
          Math.min(255, effectColor[1] + 80),
          Math.min(255, effectColor[2] + 80),
        ];

        // Draw a semi-transparent plane beneath the effect for better visibility
        fill(glowColor[0], glowColor[1], glowColor[2], alpha * 0.4);
        translate(0, 10, 0); // Position slightly below the main effect
        rotateX(HALF_PI); // Rotate to be parallel with the ground

        // Draw an elliptical glow that follows the arc shape
        beginShape();
        for (
          let angle = angleStart - 0.2;
          angle <= angleEnd + 0.2;
          angle += 0.1
        ) {
          const x = cos(angle) * (effect.size * 1.2);
          const y = sin(angle) * (effect.size * 1.2);
          vertex(x, y);
        }
        // Complete the shape by connecting back to center and first point
        vertex(0, 0);
        vertex(
          cos(angleStart - 0.2) * (effect.size * 1.2),
          sin(angleStart - 0.2) * (effect.size * 1.2)
        );
        endShape(CLOSE);
        pop();

        pop(); // Close the rotation push
      } else {
        // Draw full circle for regular shockwave
        // Draw main ring
        torus(effect.size, 10);

        // Add inner rings for more visual interest
        // Lighter version of the main color
        const innerColor = [
          Math.min(255, effectColor[0] + 50),
          Math.min(255, effectColor[1] + 50),
          Math.min(255, effectColor[2] + 50),
        ];
        stroke(innerColor[0], innerColor[1], innerColor[2], alpha * 0.7);
        strokeWeight(3);
        torus(effect.size * 0.8, 5);

        // Add energy particles around the ring
        if (effect.life > 30) {
          // Only show particles during first half of effect
          noStroke();
          fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.8);

          // Number of particles based on size
          const particleCount = Math.min(20, Math.ceil(effect.size / 20));

          for (let i = 0; i < particleCount; i++) {
            push();
            const angle = random(TWO_PI);
            const radius = effect.size * random(0.9, 1.1);

            // Position particles around the ring
            translate(cos(angle) * radius, 0, sin(angle) * radius);

            // Particle size varies
            const particleSize = random(5, 15);
            sphere(particleSize);
            pop();
          }
        }
      }
      pop();
    } else if (effect.type === "shield" || effect.type === "areaBarrier") {
      // Protective barrier effect that stays around the squad
      push();

      // Get effect color (default to blue if not specified)
      const effectColor = effect.color || [0, 200, 255];

      // Semi-transparent flat shield
      const alpha = 100 * (effect.life / 300); // Fade based on life
      fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.3);
      stroke(effectColor[0], effectColor[1], effectColor[2], alpha * 0.7);
      strokeWeight(2);

      // Draw flat shield on the ground instead of a dome
      // No rotation needed - keep it flat on the bridge floor

      // Draw flat circle
      push();
      translate(0, 0, 1); // Slightly above ground to avoid z-fighting
      circle(0, 0, effect.size * 2); // Flat circle on the ground
      pop();

      // Add energy field lines - flat on the ground
      stroke(
        effectColor[0] + 100,
        effectColor[1] + 20,
        effectColor[2],
        alpha * 0.8
      );
      strokeWeight(1);

      // Draw field lines as a flat pattern
      const lineCount = 12;
      for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * TWO_PI;

        push();
        // Draw straight lines from center to edge
        line(0, 0, cos(angle) * effect.size, sin(angle) * effect.size);
        pop();
      }

      // Add concentric circles for visual interest
      for (let i = 1; i <= 3; i++) {
        const ringSize = effect.size * (i / 3);
        noFill();
        stroke(
          effectColor[0],
          effectColor[1],
          effectColor[2],
          alpha * (0.8 - i * 0.2)
        );
        circle(0, 0, ringSize * 2);
      }

      // Pulsing effect
      const pulseSize = effect.size * (1 + 0.05 * sin(frameCount * 0.1));
      noFill();
      stroke(effectColor[0], effectColor[1], effectColor[2], alpha * 0.5);
      circle(0, 0, pulseSize * 2);

      // Add some particle effects on the shield perimeter
      noStroke();
      fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.8);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * TWO_PI + frameCount * 0.02;
        const x = cos(angle) * effect.size;
        const y = sin(angle) * effect.size;

        push();
        translate(x, y, 2 + 3 * sin(frameCount * 0.1 + i)); // Slightly above ground
        sphere(3 + sin(frameCount * 0.1 + i)); // Small pulsing particles
        pop();
      }

      pop();
    } else if (effect.type === "iceCrystal") {
      // Ice crystal effect for freeze skill
      push();

      // Get the growth factor (crystals grow from 0 to full size)
      const growthTime = effect.growthTime || 10;
      const growthFactor = min(
        1,
        (growthTime - min(growthTime, effect.life % growthTime)) / growthTime
      );

      // Get effect color (default to ice blue if not specified)
      const effectColor = effect.color || [200, 240, 255];

      // Semi-transparent ice crystal
      const alpha = 200 * (effect.life / 120); // Fade based on life
      fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.7);

      // Add slight blue glow
      stroke(
        effectColor[0] - 50,
        effectColor[1] - 20,
        effectColor[2],
        alpha * 0.5
      );
      strokeWeight(1);

      // Rotate the crystal for visual interest
      const rotationSpeed = effect.rotationSpeed || 0.02;
      rotateX(frameCount * rotationSpeed);
      rotateY(frameCount * rotationSpeed * 1.5);
      rotateZ(frameCount * rotationSpeed * 0.7);

      // Scale based on growth factor
      const currentSize = effect.size * growthFactor;

      // Draw crystal shape - use custom geometry for ice crystal
      // Main body
      push();
      scale(currentSize / 25); // Normalize to a standard size

      // Draw a crystal shape using multiple cones
      // Main vertical spike
      push();
      fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.9);
      cone(5, 25);
      pop();

      // Secondary spikes at angles
      for (let i = 0; i < 6; i++) {
        push();
        const angle = (i / 6) * TWO_PI;
        rotateY(angle);
        translate(0, -5, 7);
        rotateX(-PI / 4);
        fill(
          effectColor[0] + 20,
          effectColor[1] + 20,
          effectColor[2] + 20,
          alpha * 0.8
        );
        cone(3, 15);
        pop();
      }

      // Small crystal facets
      for (let i = 0; i < 8; i++) {
        push();
        const angle = (i / 8) * TWO_PI;
        rotateY(angle);
        translate(0, 0, 4);
        rotateX(PI / 3);
        fill(
          effectColor[0] + 40,
          effectColor[1] + 40,
          effectColor[2] + 40,
          alpha * 0.7
        );
        cone(2, 8);
        pop();
      }

      pop();

      // Add a subtle glow effect
      if (effect.life > 30) {
        noStroke();
        fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.2);
        sphere(currentSize * 1.2);
      }

      pop();
    } else if (effect.type === "frostBurst") {
      // Frost burst effect (expanding particles)
      push();

      // Get effect color (default to ice blue if not specified)
      const effectColor = effect.color || [200, 240, 255];

      // Fade based on life
      const alpha = 200 * (effect.life / 20);

      // No stroke for particles
      noStroke();

      // Draw expanding particles
      const particleCount = 20;
      const expansionFactor = 1 - effect.life / 20; // Start at center, expand outward

      for (let i = 0; i < particleCount; i++) {
        push();
        // Calculate particle position on a sphere
        const angle1 = random(TWO_PI);
        const angle2 = random(TWO_PI);
        const radius = effect.size * expansionFactor;

        const x = cos(angle1) * sin(angle2) * radius;
        const y = sin(angle1) * sin(angle2) * radius;
        const z = cos(angle2) * radius;

        translate(x, y, z);

        // Particle color with slight variation
        fill(
          effectColor[0] + random(-20, 20),
          effectColor[1] + random(-20, 20),
          effectColor[2] + random(-20, 20),
          alpha * random(0.5, 1.0)
        );

        // Particle size varies and shrinks as it expands
        const particleSize = random(2, 5) * (1 - expansionFactor);
        sphere(particleSize);
        pop();
      }

      pop();
    } else if (effect.type === "bridgeFrost") {
      // Bridge frost effect - covers the bridge with ice
      push();

      // Get effect color (default to ice blue if not specified)
      const effectColor = effect.color || [200, 240, 255];

      // Semi-transparent ice layer
      const alpha = 150 * (effect.life / 300); // Fade based on life

      // Draw a flat disc on the bridge
      rotateX(HALF_PI); // Align with ground plane

      // Ice layer
      noStroke();
      fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.3);
      circle(0, 0, effect.size * 2);

      // Ice patterns
      stroke(effectColor[0], effectColor[1], effectColor[2], alpha * 0.7);
      strokeWeight(2);
      noFill();

      // Draw fractal-like ice patterns
      const patternCount = 12;
      for (let i = 0; i < patternCount; i++) {
        const angle = (i / patternCount) * TWO_PI;
        const startX = cos(angle) * (effect.size * 0.2);
        const startY = sin(angle) * (effect.size * 0.2);

        push();
        translate(startX, startY, 1); // Slightly above bridge
        drawIcePattern(
          0,
          0,
          effect.size * 0.8,
          angle,
          4,
          alpha * 0.7,
          effectColor
        );
        pop();
      }

      // Add a subtle glow
      noStroke();
      fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.1);
      circle(0, 0, effect.size * 2.2);

      pop();
      // Star blast field effect removed - using directional blasts instead
    } else if (effect.type === "healingField") {
      // Healing field effect - persistent healing area
      push();

      // Get effect color (default to green if not specified)
      const effectColor = effect.color || [100, 255, 100, 150];

      // Semi-transparent field
      const alpha = 80 * (effect.life / 300); // Fade based on life
      fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.3);
      stroke(effectColor[0], effectColor[1], effectColor[2], alpha * 0.7);
      strokeWeight(1.5);

      // Draw a pulsing field
      const pulseRate = frameCount * (effect.pulseRate || 0.05);
      const pulseSize = effect.size * (0.9 + 0.1 * sin(pulseRate));

      // Draw a flat disc on the ground
      rotateX(HALF_PI); // Align with ground plane
      circle(0, 0, pulseSize * 2);

      // Draw healing cross pattern
      noFill();
      stroke(effectColor[0], effectColor[1], effectColor[2], alpha * 0.9);
      strokeWeight(2);

      // Vertical line of cross
      line(0, -pulseSize * 0.7, 0, pulseSize * 0.7);

      // Horizontal line of cross
      line(-pulseSize * 0.7, 0, pulseSize * 0.7, 0);

      // Add particle effects - floating healing symbols
      noStroke();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * TWO_PI + frameCount * 0.01;
        const radius = pulseSize * (0.4 + 0.3 * sin(frameCount * 0.05 + i));
        const x = cos(angle) * radius;
        const y = sin(angle) * radius;

        push();
        translate(x, y, random(5, 15) + 5 * sin(frameCount * 0.1 + i));
        fill(
          effectColor[0],
          effectColor[1],
          effectColor[2],
          alpha * random(0.7, 1.0)
        );

        // Draw a small plus symbol (healing)
        const plusSize = 8 + 3 * sin(frameCount * 0.1 + i);
        rectMode(CENTER);
        rect(0, 0, plusSize, plusSize / 3); // Horizontal bar
        rect(0, 0, plusSize / 3, plusSize); // Vertical bar
        pop();
      }

      // Add rising particles
      for (let i = 0; i < 3; i++) {
        if (random() > 0.7) {
          const angle = random(TWO_PI);
          const dist = random(0, pulseSize * 0.8);
          effects.push({
            x: effect.x + cos(angle) * dist,
            y: effect.y + sin(angle) * dist,
            z: effect.z,
            type: "healParticle",
            size: random(5, 10),
            life: random(30, 60),
            color: [100, 255, 150, 200],
            velocity: {
              x: random(-0.5, 0.5),
              y: random(-0.5, 0.5),
              z: random(1, 2),
            },
          });
        }
      }

      pop();
    } else if (effect.type === "flameAura") {
      // Flame aura effect - surrounds squad member with fire
      push();

      // Follow the squad member if reference exists
      if (effect.member) {
        effect.x = effect.member.x;
        effect.y = effect.member.y;
        effect.z = effect.member.z;
      }

      // Get effect color (default to orange-red if not specified)
      const effectColor = effect.color || [255, 50, 0];

      // Semi-transparent flame aura
      const alpha = 150 * (effect.life / 600); // Fade based on life

      // Draw flame particles around the member
      noStroke();

      // Number of flame particles
      const particleCount = 20;

      for (let i = 0; i < particleCount; i++) {
        // Calculate particle position in a sphere around the member
        const angle1 = (i / particleCount) * TWO_PI + frameCount * 0.02;
        const angle2 = random(TWO_PI);
        const radius = effect.size * (0.7 + 0.3 * sin(frameCount * 0.1 + i));

        const x = cos(angle1) * sin(angle2) * radius;
        const y = sin(angle1) * sin(angle2) * radius;
        const z = cos(angle2) * radius * 0.7; // Flatten slightly

        push();
        translate(x, y, z);

        // Flame color with variation
        const flameIntensity = 0.7 + 0.3 * sin(frameCount * 0.2 + i);
        fill(
          effectColor[0],
          effectColor[1] * flameIntensity,
          effectColor[2] * flameIntensity,
          alpha * random(0.5, 1.0)
        );

        // Flame particle size varies and pulses
        const particleSize =
          random(5, 10) * (0.8 + 0.2 * sin(frameCount * 0.1 + i));

        // Draw flame particle - use cone for flame shape
        push();
        // Random rotation for variety
        rotateX(random(TWO_PI));
        rotateY(random(TWO_PI));
        rotateZ(random(TWO_PI));

        // Draw flame shape
        if (random() > 0.5) {
          // Cone for flame tip
          cone(particleSize * 0.7, particleSize * 2);
        } else {
          // Sphere for flame body
          sphere(particleSize);
        }
        pop();

        pop();
      }

      // Add inner glow
      fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.2);
      sphere(effect.size * 0.7);

      // Add occasional spark effects
      if (frameCount % 5 === 0) {
        effects.push({
          x: effect.x + random(-effect.size / 2, effect.size / 2),
          y: effect.y + random(-effect.size / 2, effect.size / 2),
          z: effect.z + random(-effect.size / 2, effect.size / 2),
          type: "spark",
          size: random(3, 6),
          life: random(15, 30),
          color: [255, 200, 0],
          velocity: { x: random(-2, 2), y: random(-2, 2), z: random(1, 3) },
        });
      }

      pop();
    } else if (effect.type === "rageBurst") {
      // Rage burst effect - explosive burst of fire
      push();

      // Get effect color (default to orange-red if not specified)
      const effectColor = effect.color || [255, 50, 0];

      // Fade based on life
      const alpha = 200 * (effect.life / 45);

      // No stroke for particles
      noStroke();

      // Draw expanding particles
      const particleCount = 25;
      const expansionFactor = 1 - effect.life / 45; // Start at center, expand outward

      for (let i = 0; i < particleCount; i++) {
        push();
        // Calculate particle position on a sphere
        const angle1 = random(TWO_PI);
        const angle2 = random(TWO_PI);
        const radius = effect.size * expansionFactor;

        const x = cos(angle1) * sin(angle2) * radius;
        const y = sin(angle1) * sin(angle2) * radius;
        const z = cos(angle2) * radius;

        translate(x, y, z);

        // Particle color with variation
        fill(
          effectColor[0],
          effectColor[1] + random(-20, 20),
          effectColor[2] + random(0, 20),
          alpha * random(0.5, 1.0)
        );

        // Particle size varies and shrinks as it expands
        const particleSize = random(3, 8) * (1 - expansionFactor * 0.5);

        // Draw flame shape
        if (random() > 0.5) {
          // Cone for flame tip
          push();
          rotateX(random(TWO_PI));
          rotateY(random(TWO_PI));
          cone(particleSize * 0.7, particleSize * 2);
          pop();
        } else {
          // Sphere for flame body
          sphere(particleSize);
        }

        pop();
      }

      // Add central flash
      fill(255, 255, 200, alpha * 0.7);
      sphere(effect.size * 0.3 * (1 - expansionFactor));

      pop();
    } else if (effect.type === "flameBurst") {
      // Flame burst effect - smaller fire burst
      push();

      // Get effect color (default to orange-red if not specified)
      const effectColor = effect.color || [255, 100, 0];

      // Fade based on life
      const alpha = 200 * (effect.life / 30);

      // No stroke for particles
      noStroke();

      // Draw flame particles
      const particleCount = 15;

      for (let i = 0; i < particleCount; i++) {
        push();
        // Random position within a sphere
        const angle1 = random(TWO_PI);
        const angle2 = random(TWO_PI);
        const radius = random(effect.size * 0.2, effect.size * 0.8);

        const x = cos(angle1) * sin(angle2) * radius;
        const y = sin(angle1) * sin(angle2) * radius;
        const z = cos(angle2) * radius + random(0, effect.size * 0.5); // Bias upward

        translate(x, y, z);

        // Flame color with variation
        fill(
          effectColor[0],
          effectColor[1] + random(-30, 30),
          effectColor[2] + random(0, 30),
          alpha * random(0.5, 1.0)
        );

        // Flame particle size
        const particleSize = random(3, 7);

        // Draw flame shape - use cone for flame
        push();
        rotateX(random(TWO_PI));
        rotateY(random(TWO_PI));
        cone(particleSize * 0.7, particleSize * 2);
        pop();

        pop();
      }

      // Add central glow
      fill(255, 200, 100, alpha * 0.5);
      sphere(effect.size * 0.3);

      pop();
    } else if (effect.type === "damageSymbol") {
      // Damage symbol effect - floating damage indicators
      push();

      // Move particle based on velocity
      if (effect.velocity) {
        effect.x += effect.velocity.x;
        effect.y += effect.velocity.y;
        effect.z += effect.velocity.z;
      }

      // Get effect color (default to red if not specified)
      const effectColor = effect.color || [255, 50, 0, 200];

      // Fade based on life
      const alpha = effectColor[3] * (effect.life / 90);

      // No stroke for text
      noStroke();
      fill(effectColor[0], effectColor[1], effectColor[2], alpha);

      // Draw a damage symbol (+ or x)
      push();
      // Face the camera
      rotateY(PI); // Rotate to face forward

      // Draw a plus or cross symbol
      if (random() > 0.5) {
        // Plus symbol
        rectMode(CENTER);
        const symbolSize = effect.size * 0.8;
        rect(0, 0, symbolSize, symbolSize / 4); // Horizontal bar
        rect(0, 0, symbolSize / 4, symbolSize); // Vertical bar
      } else {
        // Cross/X symbol
        const symbolSize = effect.size * 0.6;
        push();
        rotateZ(PI / 4); // 45 degrees
        rectMode(CENTER);
        rect(0, 0, symbolSize, symbolSize / 4); // Rotated bar
        rotateZ(PI / 2); // 90 degrees more
        rect(0, 0, symbolSize, symbolSize / 4); // Perpendicular bar
        pop();
      }

      pop();

      pop();
    } else if (effect.type === "spark") {
      // Spark effect - small bright particles
      push();

      // Move spark based on velocity
      if (effect.velocity) {
        effect.x += effect.velocity.x;
        effect.y += effect.velocity.y;
        effect.z += effect.velocity.z;

        // Slow down over time
        effect.velocity.x *= 0.95;
        effect.velocity.y *= 0.95;
        effect.velocity.z *= 0.95;
      }

      // Get effect color (default to yellow if not specified)
      const effectColor = effect.color || [255, 200, 0];

      // Fade based on life
      const alpha = 255 * (effect.life / 30);

      // No stroke for particles
      noStroke();
      fill(effectColor[0], effectColor[1], effectColor[2], alpha);

      // Draw spark as a small sphere
      sphere(effect.size * (effect.life / 30)); // Shrink as it fades

      // Add trail effect
      if (effect.life > 5) {
        fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.5);
        push();
        // Draw trail in opposite direction of velocity
        if (effect.velocity) {
          translate(
            -effect.velocity.x * 2,
            -effect.velocity.y * 2,
            -effect.velocity.z * 2
          );
          sphere(effect.size * 0.7 * (effect.life / 30));
        }
        pop();
      }

      pop();
    } else if (effect.type === "rageExplosion") {
      // Rage explosion effect - central explosion for the damage boost
      push();

      // Get effect color (default to orange-red if not specified)
      const effectColor = effect.color || [255, 50, 0];

      // Fade based on life
      const alpha = 200 * (effect.life / 60);

      // No stroke for particles
      noStroke();

      // Draw expanding particles
      const particleCount = 30;
      const expansionFactor = 1 - effect.life / 60; // Start at center, expand outward

      for (let i = 0; i < particleCount; i++) {
        push();
        // Calculate particle position on a sphere
        const angle1 = random(TWO_PI);
        const angle2 = random(TWO_PI);
        const radius = effect.size * expansionFactor;

        const x = cos(angle1) * sin(angle2) * radius;
        const y = sin(angle1) * sin(angle2) * radius;
        const z = cos(angle2) * radius;

        translate(x, y, z);

        // Particle color with variation - more yellow at center, more red at edges
        const centerFactor = 1 - radius / (effect.size * expansionFactor);
        fill(
          effectColor[0],
          effectColor[1] + centerFactor * 150, // More yellow at center
          effectColor[2] + centerFactor * 50,
          alpha * random(0.5, 1.0)
        );

        // Particle size varies and shrinks as it expands
        const particleSize = random(5, 15) * (1 - expansionFactor * 0.5);

        // Draw flame shape
        if (random() > 0.3) {
          // Cone for flame tip
          push();
          rotateX(random(TWO_PI));
          rotateY(random(TWO_PI));
          cone(particleSize * 0.7, particleSize * 2);
          pop();
        } else {
          // Sphere for flame body
          sphere(particleSize);
        }

        pop();
      }

      // Add central bright flash
      fill(255, 255, 200, alpha * 0.8);
      sphere(effect.size * 0.4 * (1 - expansionFactor * 0.8));

      pop();
    } else if (effect.type === "globalFrost") {
      // Global frost effect - adds a blue tint to the scene
      // This is handled in the draw function to apply a filter to the entire scene
      // No rendering needed here
    } else if (effect.type === "globalFire") {
      // Global fire effect - adds a red tint to the scene
      // This is handled in the draw function to apply a filter to the entire scene
      // No rendering needed here
    } else if (effect.type === "globalTimeDilation") {
      // Global time dilation effect - adds a cyan tint to the scene
      // This is handled in the draw function to apply a filter to the entire scene
      // No rendering needed here
    } else if (effect.type === "speedAura") {
      // Speed aura effect - surrounds squad member with energy
      push();

      // Follow the squad member if reference exists
      if (effect.member) {
        effect.x = effect.member.x;
        effect.y = effect.member.y;
        effect.z = effect.member.z;
      }

      // Get effect color (default to cyan if not specified)
      const effectColor = effect.color || [0, 200, 255];

      // Semi-transparent energy aura
      const alpha = 150 * (effect.life / 480); // Fade based on life

      // Draw energy particles around the member
      noStroke();

      // Number of energy particles
      const particleCount = 16;

      for (let i = 0; i < particleCount; i++) {
        // Calculate particle position in a sphere around the member
        const angle1 = (i / particleCount) * TWO_PI + frameCount * 0.1; // Faster rotation
        const angle2 = random(TWO_PI);
        const radius = effect.size * (0.7 + 0.3 * sin(frameCount * 0.2 + i));

        const x = cos(angle1) * sin(angle2) * radius;
        const y = sin(angle1) * sin(angle2) * radius;
        const z = cos(angle2) * radius * 0.7; // Flatten slightly

        push();
        translate(x, y, z);

        // Energy color with variation
        const energyIntensity = 0.7 + 0.3 * sin(frameCount * 0.3 + i);
        fill(
          effectColor[0] * energyIntensity,
          effectColor[1] * energyIntensity,
          effectColor[2],
          alpha * random(0.5, 1.0)
        );

        // Energy particle size varies and pulses
        const particleSize =
          random(3, 8) * (0.8 + 0.2 * sin(frameCount * 0.2 + i));

        // Draw energy particle - use various shapes
        if (random() > 0.7) {
          // Small sphere for energy node
          sphere(particleSize);
        } else {
          // Stretched box for energy streak
          push();
          // Random rotation for variety
          rotateX(random(TWO_PI));
          rotateY(random(TWO_PI));
          rotateZ(random(TWO_PI));

          // Draw stretched box
          box(particleSize * 0.5, particleSize * 0.5, particleSize * 3);
          pop();
        }

        pop();
      }

      // Add inner glow
      fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.2);
      sphere(effect.size * 0.7);

      // Add motion streaks
      if (frameCount % 3 === 0) {
        // Direction of movement (assuming forward is negative Y)
        const moveAngle = random(TWO_PI);
        const moveX = cos(moveAngle) * effect.size;
        const moveY = -abs(sin(moveAngle) * effect.size * 1.5); // Bias backward

        effects.push({
          x: effect.x + moveX,
          y: effect.y + moveY,
          z: effect.z + random(-effect.size / 2, effect.size / 2),
          type: "speedStreak",
          size: random(15, 25),
          life: random(10, 20),
          color: [effectColor[0], effectColor[1], effectColor[2], 150],
          angle: moveAngle,
        });
      }

      pop();
    } else if (effect.type === "speedBurst") {
      // Speed burst effect - explosive burst of energy
      push();

      // Get effect color (default to cyan if not specified)
      const effectColor = effect.color || [0, 200, 255];

      // Fade based on life
      const alpha = 200 * (effect.life / 45);

      // No stroke for particles
      noStroke();

      // Draw expanding particles
      const particleCount = 20;
      const expansionFactor = 1 - effect.life / 45; // Start at center, expand outward

      for (let i = 0; i < particleCount; i++) {
        push();
        // Calculate particle position on a sphere
        const angle1 = random(TWO_PI);
        const angle2 = random(TWO_PI);
        const radius = effect.size * expansionFactor;

        const x = cos(angle1) * sin(angle2) * radius;
        const y = sin(angle1) * sin(angle2) * radius;
        const z = cos(angle2) * radius;

        translate(x, y, z);

        // Particle color with variation
        fill(
          effectColor[0] + random(-20, 20),
          effectColor[1] + random(-20, 20),
          effectColor[2] + random(-20, 20),
          alpha * random(0.5, 1.0)
        );

        // Particle size varies and shrinks as it expands
        const particleSize = random(3, 8) * (1 - expansionFactor * 0.5);

        // Draw energy shape - use various shapes
        if (random() > 0.6) {
          // Sphere for energy node
          sphere(particleSize);
        } else {
          // Stretched box for energy streak
          push();
          // Random rotation for variety
          rotateX(random(TWO_PI));
          rotateY(random(TWO_PI));
          rotateZ(random(TWO_PI));

          // Draw stretched box
          box(particleSize * 0.5, particleSize * 0.5, particleSize * 3);
          pop();
        }

        pop();
      }

      // Add central flash
      fill(255, 255, 255, alpha * 0.7);
      sphere(effect.size * 0.3 * (1 - expansionFactor));

      pop();
    } else if (effect.type === "speedTrail") {
      // Speed trail effect - motion blur trail behind squad member
      push();

      // Follow the squad member if reference exists
      if (effect.member && effect.offset) {
        effect.x = effect.member.x;
        effect.y = effect.member.y + effect.offset; // Trail behind
        effect.z = effect.member.z;
      }

      // Get effect color (default to cyan if not specified)
      const effectColor = effect.color || [0, 200, 255, 150];

      // Fade based on life
      const alpha = effectColor[3] * (effect.life / 30);

      // No stroke for trail
      noStroke();
      fill(effectColor[0], effectColor[1], effectColor[2], alpha);

      // Draw trail as a flattened ellipsoid
      push();
      // Scale to create a stretched trail
      scale(1, 2, 0.5); // Stretched along Y axis (behind the member)
      sphere(effect.size);
      pop();

      pop();
    } else if (effect.type === "speedStreak") {
      // Speed streak effect - motion blur streaks
      push();

      // Get effect color (default to cyan if not specified)
      const effectColor = effect.color || [0, 200, 255, 150];

      // Fade based on life
      const alpha = effectColor[3] * (effect.life / 20);

      // No stroke for streak
      noStroke();
      fill(effectColor[0], effectColor[1], effectColor[2], alpha);

      // Draw streak as a stretched box
      push();
      // Rotate based on angle
      if (effect.angle !== undefined) {
        rotateZ(effect.angle);
      }

      // Scale to create a stretched streak
      scale(0.2, 1, 0.2); // Stretched along Y axis
      box(effect.size * 0.5, effect.size * 2, effect.size * 0.5);
      pop();

      pop();
    } else if (effect.type === "accelerationBurst") {
      // Acceleration burst effect - central explosion for the speed boost
      push();

      // Get effect color (default to cyan if not specified)
      const effectColor = effect.color || [0, 200, 255];

      // Fade based on life
      const alpha = 200 * (effect.life / 60);

      // No stroke for particles
      noStroke();

      // Draw expanding particles
      const particleCount = 30;
      const expansionFactor = 1 - effect.life / 60; // Start at center, expand outward

      for (let i = 0; i < particleCount; i++) {
        push();
        // Calculate particle position on a sphere
        const angle1 = random(TWO_PI);
        const angle2 = random(TWO_PI);
        const radius = effect.size * expansionFactor;

        const x = cos(angle1) * sin(angle2) * radius;
        const y = sin(angle1) * sin(angle2) * radius;
        const z = cos(angle2) * radius;

        translate(x, y, z);

        // Particle color with variation - more white at center, more cyan at edges
        const centerFactor = 1 - radius / (effect.size * expansionFactor);
        fill(
          effectColor[0] + centerFactor * 150, // More white at center
          effectColor[1] + centerFactor * 50,
          effectColor[2],
          alpha * random(0.5, 1.0)
        );

        // Particle size varies and shrinks as it expands
        const particleSize = random(5, 15) * (1 - expansionFactor * 0.5);

        // Draw energy shape - use various shapes
        if (random() > 0.3) {
          // Sphere for energy node
          sphere(particleSize);
        } else {
          // Stretched box for energy streak
          push();
          // Random rotation for variety
          rotateX(random(TWO_PI));
          rotateY(random(TWO_PI));
          rotateZ(random(TWO_PI));

          // Draw stretched box
          box(particleSize * 0.5, particleSize * 0.5, particleSize * 3);
          pop();
        }

        pop();
      }

      // Add central bright flash
      fill(255, 255, 255, alpha * 0.8);
      sphere(effect.size * 0.4 * (1 - expansionFactor * 0.8));

      pop();
    } else if (effect.type === "targetingReticle") {
      // Targeting reticle effect for atomic bomb
      push();

      // Get effect color (default to red if not specified)
      const effectColor = effect.color || [255, 50, 50, 150];

      // Semi-transparent reticle
      const alpha = effectColor[3] * (effect.life / ATOMIC_BOMB_FALL_DURATION);

      // Draw reticle on the ground
      rotateX(HALF_PI); // Align with ground plane

      // No fill for reticle
      noFill();
      stroke(effectColor[0], effectColor[1], effectColor[2], alpha);
      strokeWeight(2);

      // Draw pulsing reticle
      const pulseRate = frameCount * (effect.pulseRate || 0.1);
      const pulseSize = effect.size * (0.9 + 0.1 * sin(pulseRate));

      // Draw outer circle
      circle(0, 0, pulseSize * 2);

      // Draw inner circle
      circle(0, 0, pulseSize);

      // Draw crosshairs
      line(-pulseSize, 0, pulseSize, 0); // Horizontal line
      line(0, -pulseSize, 0, pulseSize); // Vertical line

      // Draw corner markers
      const cornerSize = pulseSize * 0.3;

      // Top-right corner
      line(pulseSize - cornerSize, pulseSize, pulseSize, pulseSize);
      line(pulseSize, pulseSize - cornerSize, pulseSize, pulseSize);

      // Top-left corner
      line(-pulseSize + cornerSize, pulseSize, -pulseSize, pulseSize);
      line(-pulseSize, pulseSize - cornerSize, -pulseSize, pulseSize);

      // Bottom-right corner
      line(pulseSize - cornerSize, -pulseSize, pulseSize, -pulseSize);
      line(pulseSize, -pulseSize + cornerSize, pulseSize, -pulseSize);

      // Bottom-left corner
      line(-pulseSize + cornerSize, -pulseSize, -pulseSize, -pulseSize);
      line(-pulseSize, -pulseSize + cornerSize, -pulseSize, -pulseSize);

      // Add warning text
      push();
      rotateX(-HALF_PI); // Rotate back to face camera
      rotateY(PI); // Rotate to face forward

      // Draw warning text
      textAlign(CENTER, CENTER);
      textSize(20);
      fill(effectColor[0], effectColor[1], effectColor[2], alpha);

      // Pulsing warning text
      const textPulse = 0.7 + 0.3 * sin(frameCount * 0.2);
      scale(textPulse);

      // Only show text if life is above certain threshold
      if (effect.life > ATOMIC_BOMB_FALL_DURATION * 0.3) {
        text("TARGET LOCKED", 0, -pulseSize * 1.2);
      }
      pop();

      // Add occasional warning flashes
      if (
        frameCount % 20 < 5 &&
        effect.life > ATOMIC_BOMB_FALL_DURATION * 0.5
      ) {
        fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.3);
        circle(0, 0, pulseSize * 2.2);
      }

      pop();
    } else if (effect.type === "radiationField") {
      // Radiation field effect - persistent radiation area
      push();

      // Get effect color (default to green if not specified)
      const effectColor = effect.color || [100, 255, 100, 100];

      // Semi-transparent field
      const alpha = effectColor[3] * (effect.life / 600); // Fade based on life

      // Draw radiation field on the ground
      rotateX(HALF_PI); // Align with ground plane

      // Draw pulsing field
      const pulseRate = frameCount * (effect.pulseRate || 0.03);
      const pulseSize = effect.size * (0.95 + 0.05 * sin(pulseRate));

      // Main radiation field
      fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.2);
      stroke(effectColor[0], effectColor[1], effectColor[2], alpha * 0.5);
      strokeWeight(1);
      circle(0, 0, pulseSize * 2);

      // Draw radiation symbol
      push();
      noFill();
      stroke(effectColor[0], effectColor[1], effectColor[2], alpha * 0.8);
      strokeWeight(3);

      // Center circle
      circle(0, 0, pulseSize * 0.3);

      // Radiation blades
      for (let i = 0; i < 3; i++) {
        push();
        rotate((i * TWO_PI) / 3);

        // Draw blade
        beginShape();
        for (let angle = 0; angle <= PI / 3; angle += 0.1) {
          const r = pulseSize * 0.8;
          const x = cos(angle) * r;
          const y = sin(angle) * r;
          vertex(x, y);
        }
        for (let angle = PI / 3; angle >= 0; angle -= 0.1) {
          const r = pulseSize * 0.6;
          const x = cos(angle) * r;
          const y = sin(angle) * r;
          vertex(x, y);
        }
        endShape(CLOSE);
        pop();
      }
      pop();

      // Add radiation particles
      noStroke();
      for (let i = 0; i < 20; i++) {
        const angle = random(TWO_PI);
        const dist = random(0, pulseSize * 0.9);
        const x = cos(angle) * dist;
        const y = sin(angle) * dist;

        push();
        translate(x, y, random(1, 10));
        fill(
          effectColor[0],
          effectColor[1],
          effectColor[2],
          alpha * random(0.5, 1.0)
        );

        // Draw radiation particle
        const particleSize = 3 + 2 * sin(frameCount * 0.1 + i);
        sphere(particleSize);
        pop();
      }

      // Add rising radiation particles
      if (frameCount % 3 === 0) {
        const angle = random(TWO_PI);
        const dist = random(0, pulseSize * 0.8);
        effects.push({
          x: effect.x + cos(angle) * dist,
          y: effect.y + sin(angle) * dist,
          z: effect.z,
          type: "radiationParticle",
          size: random(3, 8),
          life: random(30, 60),
          color: [100, 255, 100, 150],
          velocity: {
            x: random(-0.5, 0.5),
            y: random(-0.5, 0.5),
            z: random(1, 3),
          },
        });
      }

      pop();
    } else if (effect.type === "radiationBurst") {
      // Radiation burst effect - small radiation explosion
      push();

      // Get effect color (default to green if not specified)
      const effectColor = effect.color || [100, 255, 100];

      // Fade based on life
      const alpha = 200 * (effect.life / 30);

      // No stroke for particles
      noStroke();

      // Draw expanding particles
      const particleCount = 12;
      const expansionFactor = 1 - effect.life / 30; // Start at center, expand outward

      for (let i = 0; i < particleCount; i++) {
        push();
        // Calculate particle position on a sphere
        const angle1 = random(TWO_PI);
        const angle2 = random(TWO_PI);
        const radius = effect.size * expansionFactor;

        const x = cos(angle1) * sin(angle2) * radius;
        const y = sin(angle1) * sin(angle2) * radius;
        const z = cos(angle2) * radius;

        translate(x, y, z);

        // Particle color with variation
        fill(
          effectColor[0] + random(-20, 20),
          effectColor[1] + random(-20, 20),
          effectColor[2] + random(-20, 20),
          alpha * random(0.5, 1.0)
        );

        // Particle size varies and shrinks as it expands
        const particleSize = random(2, 5) * (1 - expansionFactor * 0.5);

        // Draw radiation particle
        sphere(particleSize);

        pop();
      }

      // Add central glow
      fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.5);
      sphere(effect.size * 0.3 * (1 - expansionFactor));

      pop();
    } else if (effect.type === "radiationParticle") {
      // Radiation particle effect - rising particles
      push();

      // Move particle based on velocity
      if (effect.velocity) {
        effect.x += effect.velocity.x;
        effect.y += effect.velocity.y;
        effect.z += effect.velocity.z;
      }

      // Get effect color (default to green if not specified)
      const effectColor = effect.color || [100, 255, 100, 150];

      // Fade based on life
      const alpha = effectColor[3] * (effect.life / 60);

      // No stroke for particle
      noStroke();
      fill(effectColor[0], effectColor[1], effectColor[2], alpha);

      // Draw radiation particle
      sphere(effect.size * (0.8 + 0.2 * sin(frameCount * 0.2)));

      // Add trail effect
      if (effect.life > 10) {
        fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.5);
        push();
        // Draw trail in opposite direction of velocity
        if (effect.velocity) {
          translate(
            -effect.velocity.x * 2,
            -effect.velocity.y * 2,
            -effect.velocity.z * 2
          );
          sphere(effect.size * 0.6);
        }
        pop();
      }

      pop();
    } else if (effect.type === "atomicParticle") {
      // Atomic particle effect - disintegration particles
      push();

      // Move particle based on velocity
      if (effect.velocity) {
        effect.x += effect.velocity.x;
        effect.y += effect.velocity.y;
        effect.z += effect.velocity.z;

        // Slow down over time
        effect.velocity.x *= 0.98;
        effect.velocity.y *= 0.98;
        effect.velocity.z *= 0.98;
      }

      // Get effect color (default to orange if not specified)
      const effectColor = effect.color || [255, 150, 50, 200];

      // Fade based on life
      const alpha = effectColor[3] * (effect.life / 120);

      // No stroke for particle
      noStroke();
      fill(effectColor[0], effectColor[1], effectColor[2], alpha);

      // Draw atomic particle
      if (random() > 0.5) {
        // Sphere for particle
        sphere(effect.size * (effect.life / 120));
      } else {
        // Box for debris
        push();
        rotateX(frameCount * 0.05);
        rotateY(frameCount * 0.05);
        box(effect.size * (effect.life / 120));
        pop();
      }

      // Add glow effect
      if (effect.life > 30) {
        fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.3);
        sphere(effect.size * 1.5 * (effect.life / 120));
      }

      pop();
    } else if (effect.type === "debrisParticle") {
      // Debris particle effect - floating debris
      push();

      // Move particle based on velocity
      if (effect.velocity) {
        effect.x += effect.velocity.x;
        effect.y += effect.velocity.y;
        effect.z += effect.velocity.z;

        // Apply gravity - slowly fall
        effect.velocity.z -= 0.01;
      }

      // Rotate debris
      const rotationSpeed = effect.rotationSpeed || 0.02;
      rotateX(frameCount * rotationSpeed);
      rotateY(frameCount * rotationSpeed * 1.2);
      rotateZ(frameCount * rotationSpeed * 0.8);

      // Get effect color (default to gray if not specified)
      const effectColor = effect.color || [100, 100, 100, 180];

      // Fade based on life
      const alpha = effectColor[3] * (effect.life / 500);

      // Draw debris
      fill(effectColor[0], effectColor[1], effectColor[2], alpha);
      stroke(
        effectColor[0] * 0.8,
        effectColor[1] * 0.8,
        effectColor[2] * 0.8,
        alpha * 0.8
      );
      strokeWeight(0.5);

      // Random debris shape
      if (effect.shape === "box" || random() > 0.5) {
        // Box for debris
        box(
          effect.size * random(0.8, 1.2),
          effect.size * random(0.8, 1.2),
          effect.size * random(0.8, 1.2)
        );
      } else {
        // Irregular tetrahedron for debris
        beginShape();
        vertex(effect.size * 0.5, -effect.size * 0.5, -effect.size * 0.5);
        vertex(-effect.size * 0.5, effect.size * 0.5, -effect.size * 0.5);
        vertex(-effect.size * 0.5, -effect.size * 0.5, effect.size * 0.5);
        endShape(CLOSE);

        beginShape();
        vertex(effect.size * 0.5, -effect.size * 0.5, -effect.size * 0.5);
        vertex(-effect.size * 0.5, effect.size * 0.5, -effect.size * 0.5);
        vertex(effect.size * 0.5, effect.size * 0.5, effect.size * 0.5);
        endShape(CLOSE);

        beginShape();
        vertex(effect.size * 0.5, -effect.size * 0.5, -effect.size * 0.5);
        vertex(-effect.size * 0.5, -effect.size * 0.5, effect.size * 0.5);
        vertex(effect.size * 0.5, effect.size * 0.5, effect.size * 0.5);
        endShape(CLOSE);

        beginShape();
        vertex(-effect.size * 0.5, effect.size * 0.5, -effect.size * 0.5);
        vertex(-effect.size * 0.5, -effect.size * 0.5, effect.size * 0.5);
        vertex(effect.size * 0.5, effect.size * 0.5, effect.size * 0.5);
        endShape(CLOSE);
      }

      pop();
    } else if (effect.type === "infernoField") {
      // Inferno field effect - persistent fire area on the bridge
      push();

      // Get effect color (default to red-orange if not specified)
      const effectColor = effect.color || [255, 50, 0, 150];

      // Semi-transparent field
      const alpha = effectColor[3] * (effect.life / 600); // Fade based on life

      // Draw inferno field on the ground
      rotateX(HALF_PI); // Align with ground plane

      // Draw pulsing field
      const pulseRate = frameCount * (effect.pulseRate || 0.05);
      const pulseSize = effect.size * (0.95 + 0.05 * sin(pulseRate));

      // Main inferno field
      fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.2);
      stroke(effectColor[0], effectColor[1], effectColor[2], alpha * 0.5);
      strokeWeight(1);
      circle(0, 0, pulseSize * 2);

      // Draw fire symbol
      push();
      noFill();
      stroke(effectColor[0], effectColor[1], effectColor[2], alpha * 0.8);
      strokeWeight(3);

      // Draw stylized flame in center
      beginShape();
      for (let angle = -PI / 6; angle <= PI / 6; angle += 0.1) {
        const r = pulseSize * 0.3;
        const flameHeight = 0.8 + 0.2 * sin(frameCount * 0.1);
        const x = cos(angle) * r;
        const y = sin(angle) * r * flameHeight;
        vertex(x, y);
      }
      endShape();

      // Draw outer flames
      for (let i = 0; i < 5; i++) {
        push();
        rotate((i * TWO_PI) / 5);

        // Draw flame
        beginShape();
        for (let angle = -PI / 8; angle <= PI / 8; angle += 0.1) {
          const r = pulseSize * 0.6;
          const flameHeight = 0.7 + 0.3 * sin(frameCount * 0.1 + i);
          const x = cos(angle) * r;
          const y = sin(angle) * r * flameHeight;
          vertex(x, y);
        }
        endShape();
        pop();
      }
      pop();

      // Add fire particles
      noStroke();
      for (let i = 0; i < 30; i++) {
        const angle = random(TWO_PI);
        const dist = random(0, pulseSize * 0.9);
        const x = cos(angle) * dist;
        const y = sin(angle) * dist;

        push();
        translate(x, y, random(1, 10));
        fill(255, 50 + random(0, 150), 0, alpha * random(0.5, 1.0));

        // Draw fire particle
        const particleSize = 3 + 2 * sin(frameCount * 0.1 + i);
        sphere(particleSize);
        pop();
      }

      // Add rising fire particles
      if (frameCount % 2 === 0) {
        const angle = random(TWO_PI);
        const dist = random(0, pulseSize * 0.8);
        effects.push({
          x: effect.x + cos(angle) * dist,
          y: effect.y + sin(angle) * dist,
          z: effect.z,
          type: "flameEruption",
          size: random(20, 40),
          life: random(30, 60),
          color: [255, 50 + random(0, 150), 0],
          velocity: {
            x: random(-0.5, 0.5),
            y: random(-0.5, 0.5),
            z: random(2, 4),
          },
        });
      }

      pop();
    } else if (effect.type === "firePatch") {
      // Fire patch effect - individual fire on the bridge
      push();

      // Get effect color (default to red-orange if not specified)
      const effectColor = effect.color || [255, 50, 0, 200];

      // Semi-transparent fire
      const alpha = effectColor[3] * (effect.life / 600); // Fade based on life

      // Draw fire patch on the ground
      rotateX(HALF_PI); // Align with ground plane

      // Draw pulsing fire
      const pulseRate = frameCount * (effect.pulseRate || 0.05);
      const pulseSize = effect.size * (0.9 + 0.1 * sin(pulseRate));

      // Main fire patch
      fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.3);
      noStroke();
      circle(0, 0, pulseSize);

      // Add fire particles
      for (let i = 0; i < 15; i++) {
        const angle = random(TWO_PI);
        const dist = random(0, pulseSize * 0.4);
        const x = cos(angle) * dist;
        const y = sin(angle) * dist;

        push();
        translate(x, y, random(1, 20));

        // Gradient colors from yellow to red
        const colorPos = random();
        if (colorPos < 0.3) {
          // Yellow-white center
          fill(255, 200 + random(0, 55), 0, alpha * random(0.7, 1.0));
        } else if (colorPos < 0.7) {
          // Orange middle
          fill(255, 100 + random(0, 100), 0, alpha * random(0.6, 0.9));
        } else {
          // Red outer
          fill(255, 50 + random(0, 50), 0, alpha * random(0.5, 0.8));
        }

        // Draw fire particle
        const particleSize = 5 + 3 * sin(frameCount * 0.2 + i);
        sphere(particleSize);
        pop();
      }

      // Add rising fire particles occasionally
      if (frameCount % 10 === 0 && random() > 0.5) {
        effects.push({
          x: effect.x,
          y: effect.y,
          z: effect.z,
          type: "flameBurst",
          size: random(15, 30),
          life: random(20, 40),
          color: [255, 100 + random(0, 155), 0],
          velocity: {
            x: random(-0.3, 0.3),
            y: random(-0.3, 0.3),
            z: random(1, 3),
          },
        });
      }

      pop();
    } else if (effect.type === "flameEruption") {
      // Flame eruption effect - rising column of fire
      push();

      // Move particle based on velocity
      if (effect.velocity) {
        effect.x += effect.velocity.x;
        effect.y += effect.velocity.y;
        effect.z += effect.velocity.z;

        // Slow down over time
        effect.velocity.x *= 0.98;
        effect.velocity.y *= 0.98;
        effect.velocity.z *= 0.96; // Slower vertical slowdown for longer rise
      }

      // Get effect color (default to orange if not specified)
      const effectColor = effect.color || [255, 100, 0];

      // Fade based on life
      const alpha = 200 * (effect.life / 75);

      // No stroke for particle
      noStroke();

      // Draw flame column
      const flameHeight = effect.size * (effect.life / 75) * 1.5;
      const flameWidth = effect.size * 0.5;

      // Draw multiple flame layers
      for (let i = 0; i < 5; i++) {
        const layerHeight = flameHeight * (1 - i * 0.15);
        const layerWidth = flameWidth * (1 - i * 0.1);
        const layerAlpha = alpha * (1 - i * 0.15);

        // Color gradient from yellow center to red outer
        if (i === 0) {
          // Yellow-white center
          fill(255, 220, 50, layerAlpha);
        } else if (i === 1) {
          // Yellow
          fill(255, 180, 0, layerAlpha);
        } else if (i === 2) {
          // Orange
          fill(255, 120, 0, layerAlpha);
        } else {
          // Red outer
          fill(255, 50, 0, layerAlpha * 0.8);
        }

        // Draw flame layer
        push();
        translate(0, 0, layerHeight / 2);

        // Use cone for flame shape
        cone(layerWidth, layerHeight, 8, 1, true);
        pop();
      }

      // Add small particles around the flame
      for (let i = 0; i < 3; i++) {
        const angle = random(TWO_PI);
        const dist = random(5, flameWidth * 0.8);
        const height = random(0, flameHeight);

        push();
        translate(cos(angle) * dist, sin(angle) * dist, height);

        // Ember color
        fill(255, 100 + random(0, 155), 0, alpha * 0.7);

        // Draw ember
        sphere(random(3, 8));
        pop();
      }

      pop();
    } else if (effect.type === "atomicFlash") {
      // Full screen bright flash effect
      push();

      // Create a fullscreen flash effect that covers everything
      // This is rendered as a large sphere that encompasses the camera
      noStroke();

      // Fade based on life
      const flashOpacity = effect.life / 40; // Fades from 1 to 0

      // Use custom color if provided
      const flashColor = effect.color || [255, 255, 255];
      fill(flashColor[0], flashColor[1], flashColor[2], 255 * flashOpacity);

      // Position in front of camera - follow camera position
      translate(cameraOffsetX, -cameraOffsetY, -cameraZoom + 100);

      // Large enough to cover the view
      sphere(10000); // Much larger to ensure full coverage

      // Add additional inner flash layers for more intensity
      push();
      fill(255, 255, 255, 200 * flashOpacity);
      sphere(5000);
      pop();

      // Add lens flare effect
      if (flashOpacity > 0.5) {
        for (let i = 0; i < 6; i++) {
          push();
          fill(255, 255, 255, 150 * flashOpacity);
          translate(random(-500, 500), random(-500, 500), random(-100, 100));
          sphere(random(100, 300));
          pop();
        }
      }

      pop();
    }

    pop();
  }
}

function drawPowerUps() {
  try {
    // Use a simplified approach for mobile devices to avoid WebGL context issues
    if (isMobileDevice) {
      // Draw power-ups with simplified rendering for mobile
      for (let powerUp of powerUps) {
        try {
          push();
          translate(powerUp.x, powerUp.y, powerUp.z + POWER_UP_SIZE / 2);

          // Simplified rotation for mobile
          let rotationAmount = powerUp.rotation || 0;
          rotationAmount += powerUp.rotationSpeed || 0.02;
          powerUp.rotation = rotationAmount;

          rotateX(rotationAmount);
          rotateY(rotationAmount * 0.7);

          // Use simplified shapes for all power-ups on mobile
          if (powerUp.type === "mirror") {
            fill(WEAPON_COLORS.mirror);
            // Use a sphere instead of box for better WebGL compatibility
            sphere(POWER_UP_SIZE / 2);
          } else if (
            powerUp.type === "fire_rate" ||
            powerUp.type === "damage" ||
            powerUp.type === "aoe"
          ) {
            // Skill power-ups - use distinctive colors
            const color =
              powerUp.type === "fire_rate"
                ? [50, 255, 50]
                : powerUp.type === "damage"
                ? [255, 50, 50]
                : [50, 50, 255];
            fill(...color);
            sphere(POWER_UP_SIZE / 2);
          } else {
            // Weapon power-ups
            const powerUpColor = WEAPON_COLORS[powerUp.type] || [200, 200, 200];
            fill(...powerUpColor);
            // Use a sphere instead of cylinder for better WebGL compatibility
            sphere(POWER_UP_SIZE / 2);
          }
          pop();
        } catch (e) {
          console.warn("Error drawing power-up:", e);
          // Continue with the next power-up
          continue;
        }
      }
      return; // Skip the rest of the function for mobile devices
    }

    // For desktop devices, continue with the full rendering
    try {
      // Clear any remaining visual artifacts at the beginning of each frame
      // by drawing a clean overlay over the power-up lane
      push();
      translate(BRIDGE_WIDTH / 2 + POWER_UP_LANE_WIDTH / 2, 0, -1); // Position just behind the power-up lane
      fill(...POWER_UP_LANE_COLOR);
      box(POWER_UP_LANE_WIDTH + 2, BRIDGE_LENGTH * 1, 8); // Slightly narrower than the lane
      pop();
    } catch (e) {
      console.warn("Error drawing power-up lane overlay:", e);
    }

    // Draw power-ups with proper depth testing
    for (let powerUp of powerUps) {
      try {
        // Distance-based Level of Detail
        let distToCamera = 0;
        if (squad.length > 0) {
          const mainMember = squad[0];
          const dx = powerUp.x - mainMember.x;
          const dy = powerUp.y - mainMember.y;
          distToCamera = dx * dx + dy * dy; // Squared distance
        }

        push();
        translate(powerUp.x, powerUp.y, powerUp.z + POWER_UP_SIZE / 2);

        // Rotate slowly to make power-ups look interesting
        let rotationAmount = powerUp.rotation || 0;
        rotationAmount += powerUp.rotationSpeed || 0.02;
        powerUp.rotation = rotationAmount; // Store updated rotation

        rotateX(rotationAmount);
        rotateY(rotationAmount * 0.7);

        // Add a slight hover effect
        const hoverOffset =
          sin(frameCount * 0.05 + (powerUp.pulsePhase || 0)) * 3;
        translate(0, 0, hoverOffset);

        // Different shapes for different power-up types - with simplified rendering for distant power-ups
        if (distToCamera > 800 * 800) {
          // Very distant power-ups - ultra simplified
          if (powerUp.type === "mirror") {
            fill(WEAPON_COLORS.mirror);
            box(POWER_UP_SIZE);
          } else if (
            powerUp.type === "fire_rate" ||
            powerUp.type === "damage" ||
            powerUp.type === "aoe"
          ) {
            // Skill power-ups - use distinctive colors
            const color =
              powerUp.type === "fire_rate"
                ? [50, 255, 50]
                : powerUp.type === "damage"
                ? [255, 50, 50]
                : [50, 50, 255];
            fill(...color);
            sphere(POWER_UP_SIZE / 2);
          } else {
            // Weapon power-ups
            const powerUpColor = WEAPON_COLORS[powerUp.type] || [200, 200, 200];
            fill(...powerUpColor);
            cylinder(POWER_UP_SIZE / 2, POWER_UP_SIZE);
          }
        } else {
          // Fully detailed power-ups for nearby ones
          if (powerUp.type === "mirror") {
            // Mirror - white cube with sparkle effect
            fill(WEAPON_COLORS.mirror);
            box(POWER_UP_SIZE, POWER_UP_SIZE, POWER_UP_SIZE);

            // Add sparkle effect
            if (distToCamera < 500 * 500) {
              push();
              noStroke();
              fill(255, 255, 255, 150 + sin(frameCount * 0.1) * 50);
              for (let i = 0; i < 3; i++) {
                push();
                rotateX(frameCount * 0.1 + (i * TWO_PI) / 3);
                rotateY(frameCount * 0.15 + (i * TWO_PI) / 3);
                translate(0, 0, POWER_UP_SIZE / 2 + 5);
                sphere(3);
                pop();
              }
              pop();
            }
          } else if (powerUp.type === "fire_rate") {
            // Fire rate boost - green sphere
            fill(50, 255, 50);

            // Add a pulsating effect
            const pulseScale = 1 + sin(frameCount * 0.1) * 0.1;
            sphere((POWER_UP_SIZE / 2) * pulseScale);

            // Add value text
            if (distToCamera < 400 * 400) {
              push();
              rotateX(-PI / 4);
              fill(255);
              textSize(16);
              textAlign(CENTER, CENTER);
              text(`+${powerUp.value}`, 0, -POWER_UP_SIZE);
              pop();
            }
          } else if (powerUp.type === "damage") {
            // Damage boost - red cube
            fill(255, 50, 50);

            // Add a rotating effect
            box(POWER_UP_SIZE * (1 + sin(frameCount * 0.05) * 0.1));

            // Add value text
            if (distToCamera < 400 * 400) {
              push();
              rotateX(-PI / 4);
              fill(255);
              textSize(16);
              textAlign(CENTER, CENTER);
              text(`+${powerUp.value}`, 0, -POWER_UP_SIZE);
              pop();
            }
          } else if (powerUp.type === "aoe") {
            // Area effect boost - blue pyramid
            fill(50, 50, 255);

            // Add a subtle rotation
            cone(POWER_UP_SIZE, POWER_UP_SIZE * 1.5);

            // Add value text
            if (distToCamera < 400 * 400) {
              push();
              rotateX(-PI / 4);
              fill(255);
              textSize(16);
              textAlign(CENTER, CENTER);
              text(`+${powerUp.value}`, 0, -POWER_UP_SIZE);
              pop();
            }
          } else {
            // Weapon power-ups - use default color if type not found
            const powerUpColor = WEAPON_COLORS[powerUp.type] || [200, 200, 200];
            fill(...powerUpColor);

            // Add interesting shape with orbital effect
            cylinder(POWER_UP_SIZE / 2, POWER_UP_SIZE);

            // Add orbital particles
            if (distToCamera < 600 * 600 && powerUp.orbitals > 0) {
              push();
              noStroke();
              fill(...powerUpColor, 200);
              const orbitalCount = Math.min(3, powerUp.orbitals || 0);
              for (let i = 0; i < orbitalCount; i++) {
                push();
                const angle = frameCount * 0.05 + (i * TWO_PI) / orbitalCount;
                const orbitalRadius = POWER_UP_SIZE * 0.8;
                translate(
                  cos(angle) * orbitalRadius,
                  sin(angle) * orbitalRadius,
                  0
                );
                sphere(4);
                pop();
              }
              pop();
            }
          }
        }
        pop();
      } catch (e) {
        console.warn("Error drawing power-up:", e);
        // Continue with the next power-up
        continue;
      }
    }
  } catch (e) {
    console.error("Critical error in drawPowerUps:", e);
  }
}

// Helper function to check if an object is beyond the defensive wall
function isBeyondWall(y) {
  // Use the exact wall position from drawWallAndGate function
  const wallPosition = 220; // This matches the fixed position in drawWallAndGate

  // Check if the object's y position is beyond the wall
  return y >= wallPosition;
}

// Function to create an explosion effect at the specified position
function createCombatHitEffect(x, y, z, color, size = 30) {
  // Create the main explosion
  effects.push({
    x: x,
    y: y,
    z: z,
    type: "explosion",
    size: size,
    life: 45,
    color: color || [255, 100, 0],
    forceRenderDetail: true,
  });

  // Add some particle effects for more visual impact
  const particleCount = Math.min(10, Math.floor(size / 3)); // Scale particles with size
  for (let i = 0; i < particleCount; i++) {
    const angle = random(TWO_PI);
    const dist = random(size * 0.3, size * 0.7);
    effects.push({
      x: x + cos(angle) * dist,
      y: y + sin(angle) * dist,
      z: z + random(-10, 10),
      type: "particle",
      size: random(5, 10),
      life: random(20, 40),
      color: color || [255, 100, 0],
      velocity: {
        x: cos(angle) * random(1, 3),
        y: sin(angle) * random(1, 3),
        z: random(0.5, 2),
      },
    });
  }

  // Create a shockwave effect
  effects.push({
    x: x,
    y: y,
    z: z,
    type: "shockwave",
    size: size * 1.5,
    life: 30,
    color: [255, 255, 255, 150],
  });
}

// Function to create a hit effect at the specified position
function createHitEffect(x, y, z, color, size = 15) {
  // Create the main hit effect
  effects.push({
    x: x,
    y: y,
    z: z,
    type: "hit",
    size: size,
    life: 20,
    color: color || [255, 255, 255],
  });

  // Add a few spark particles
  const sparkCount = Math.min(5, Math.floor(size / 3));
  for (let i = 0; i < sparkCount; i++) {
    const angle = random(TWO_PI);
    const dist = random(size * 0.2, size * 0.5);
    effects.push({
      x: x + cos(angle) * dist,
      y: y + sin(angle) * dist,
      z: z + random(-5, 5),
      type: "spark",
      size: random(2, 5),
      life: random(10, 20),
      color: color || [255, 255, 255],
      velocity: {
        x: cos(angle) * random(0.5, 2),
        y: sin(angle) * random(0.5, 2),
        z: random(0.2, 1),
      },
    });
  }
}

// Function to clean up any effects that go beyond the wall
function cleanupEffectsBeyondWall() {
  // Process effects from the end of the array to avoid index issues when removing
  for (let i = effects.length - 1; i >= 0; i--) {
    let effect = effects[i];

    // Check if effect is beyond the wall and remove it
    // Skip certain global effects that should persist regardless of position
    if (
      effect.y &&
      isBeyondWall(effect.y) &&
      !effect.type.includes("global") &&
      !effect.type.includes("atomic") &&
      !effect.type.includes("shield")
    ) {
      // Remove the effect
      effects.splice(i, 1);
    }
  }
}

// Helper function to move the squad in a specific direction
function moveSquad(deltaX, deltaY) {
  if (squad.length == 0) {
    return;
  }

  let mainMember = squad[0];

  // Check for wall boundary when moving down (positive deltaY)
  if (deltaY > 0) {
    // Use the exact wall position from drawWallAndGate function
    const wallPosition = WALL_Y; // This matches the fixed position in drawWallAndGate

    // If the squad is approaching the wall, prevent movement past it
    if (
      mainMember.y + deltaY >=
      wallPosition - HUMAN_SIZE - WALL_THICKNESS / 2
    ) {
      // Only allow movement up to the wall boundary
      mainMember.y = wallPosition - HUMAN_SIZE - WALL_THICKNESS / 2;

      // Add visual feedback when hitting the wall
      if (frameCount % 5 === 0) {
        // Only create effect occasionally to avoid too many effects
        // Create a small impact effect at the point of contact
        createHitEffect(
          mainMember.x,
          wallPosition - WALL_THICKNESS / 2, // Position at the wall
          WALL_HEIGHT / 2, // At the middle height of the wall
          [255, 255, 255], // White spark
          20 // Small effect
        );

        // Try to play a bump sound if available
        if (
          typeof playCombatSound === "function" &&
          sounds &&
          sounds.combat &&
          sounds.combat.hit
        ) {
          playCombatSound("hit", mainMember.x, mainMember.y, 0.3);
        }
      }

      return; // Exit early as we've handled the movement
    }
  }

  // For other directions, proceed normally
  mainMember.x += deltaX;
  mainMember.y += deltaY;

  // Apply constraints immediately to prevent going out of bounds
  const leftBound = -BRIDGE_WIDTH / 2;
  const rightBound = BRIDGE_WIDTH / 2 + POWER_UP_LANE_WIDTH - HUMAN_SIZE;
  const topBound = (-BRIDGE_LENGTH * 1) / 2;
  const bottomBound = (BRIDGE_LENGTH * 1) / 2;

  mainMember.x = constrain(mainMember.x, leftBound, rightBound);
  mainMember.y = constrain(mainMember.y, topBound, bottomBound);
}

// Squad Movement and Controls
function updateSquad() {
  if (squad.length == 0) {
    return;
  }
  // Control main squad member (first in the array)

  let mainMember = squad[0];

  // Arrow key movement
  if (keyIsDown(LEFT_ARROW)) {
    moveSquad(-squadSpeed, 0);
  }
  if (keyIsDown(RIGHT_ARROW)) {
    moveSquad(squadSpeed, 0);
  }
  if (keyIsDown(UP_ARROW)) {
    moveSquad(0, -squadSpeed);
  }
  if (keyIsDown(DOWN_ARROW)) {
    moveSquad(0, squadSpeed);
  }

  // Bridge boundaries are now handled in the moveSquad function

  // Define boundary constraints for the squad
  const leftBound = -BRIDGE_WIDTH / 2;
  const rightBound = BRIDGE_WIDTH / 2 + POWER_UP_LANE_WIDTH - HUMAN_SIZE;
  const topBound = (-BRIDGE_LENGTH * 1) / 2;
  const bottomBound = (BRIDGE_LENGTH * 1) / 2;

  // Formation - arrange other squad members around the leader
  if (squad.length > 1) {
    const spacing = HUMAN_SIZE * 1.3; // Spacing between members
    const leaderX = mainMember.x;
    const leaderY = mainMember.y;

    // Position all non-leader members in grid formation
    // Start from index 1 to skip the leader
    for (let i = 1; i < squad.length; i++) {
      // Calculate row and column for each member
      const row = Math.floor(i / MAX_SQUAD_MEMBERS_PER_ROW);
      const col = i % MAX_SQUAD_MEMBERS_PER_ROW;

      // Position based on row and column but relative to leader's actual position
      squad[i].x = leaderX + col * spacing;
      squad[i].y = leaderY + row * spacing;

      // Constrain other members to stay on the bridge
      squad[i].x = constrain(squad[i].x, leftBound, rightBound);
      squad[i].y = constrain(squad[i].y, topBound, bottomBound);
    }
  }

  // Auto-firing with machine gun skill check
  if (frameCount - lastFireTime > squadFireRate) {
    // Play a single shoot sound for the whole squad
    if (squad.length > 0) {
      // Calculate the center position of the squad for sound positioning
      let centerX = 0,
        centerY = 0;
      for (let member of squad) {
        centerX += member.x;
        centerY += member.y;
      }
      centerX /= squad.length;
      centerY /= squad.length;

      // Calculate volume based on squad size
      // Volume scales up to 2x when squad is at full size (MAX_SQUAD_SIZE)
      const volumeMultiplier = 1 + Math.min(1, squad.length / SQUAD_SIZE);

      // Check if machine gun skill is active
      const isMachineGunActive = skills[SkillName.MACHINE_GUN].active;

      // Play a single sound with appropriate volume
      if (isMachineGunActive) {
        // Machine gun sound - faster rate, slightly higher pitch
        playCombatSound("shoot", centerX, centerY, volumeMultiplier * 0.7);
        sounds.combat.shoot.rate(random(1.1, 1.3));
      } else {
        // Normal weapon sound
        playCombatSound("shoot", centerX, centerY, volumeMultiplier * 0.9);
        sounds.combat.shoot.rate(random(0.9, 1.1));
      }
    }

    // Fire weapons for each squad member
    for (let member of squad) {
      // Create projectile without playing sound
      fireWeapon(member, false);

      // If machine gun skill is active, create small muzzle flash effect
      if (skills[SkillName.MACHINE_GUN].active) {
        createHitEffect(
          member.x,
          member.y - 10, // Position in front of squad member
          member.z + member.size / 2,
          [255, 200, 0],
          member.size / 3 // Smaller effect size
        );
      }
    }
    lastFireTime = frameCount;
  }

  // Check if machine gun skill duration has ended
  if (
    skills[SkillName.MACHINE_GUN].active &&
    frameCount >= skills[SkillName.MACHINE_GUN].endTime
  ) {
    // Reset to normal fire rate
    squadFireRate = 30; // Normal fire rate
    skills[SkillName.MACHINE_GUN].active = false;
  }
}

function fireWeapon(squadMember, playSound = true) {
  // Check if machine gun skill is active
  const isMachineGunActive = skills[SkillName.MACHINE_GUN].active;

  // Play shooting sound with variation based on weapon and machine gun status
  // Only if playSound is true (we'll use false when we play a single sound for the whole squad)
  if (playSound) {
    if (isMachineGunActive) {
      // Machine gun sound - faster rate, slightly higher pitch
      playCombatSound("shoot", squadMember.x, squadMember.y, 0.7);
      sounds.combat.shoot.rate(random(1.1, 1.3));
    } else {
      // Normal weapon sound
      playCombatSound("shoot", squadMember.x, squadMember.y, 0.9);
      sounds.combat.shoot.rate(random(0.9, 1.1));
    }
  }

  // Use projectile from object pool if available (object reuse)
  let projectile;

  if (projectilePool.length > 0) {
    // Reuse a projectile from the pool
    projectile = projectilePool.pop();

    // Reset properties
    projectile.x = squadMember.x;
    projectile.y = squadMember.y;
    projectile.z = squadMember.z + squadMember.size / 2;
    projectile.weapon = currentWeapon;

    // Modify projectile properties if machine gun is active
    if (isMachineGunActive) {
      projectile.speed = PROJECTILE_SPEED * 1.3; // Faster bullets
      projectile.damage = getWeaponDamage(currentWeapon) * 0.6; // Less damage per bullet but fires much faster
      projectile.size = PROJECTILE_SIZE * 0.75; // Smaller bullets
      projectile.color = [255, 215, 0]; // Gold/yellow color for machine gun bullets
    } else {
      projectile.speed = PROJECTILE_SPEED;
      projectile.damage = getWeaponDamage(currentWeapon);
      projectile.size = PROJECTILE_SIZE;
      projectile.color = undefined; // Use default color
    }
  } else {
    // Create a new projectile if pool is empty
    projectile = {
      x: squadMember.x,
      y: squadMember.y,
      z: squadMember.z + squadMember.size / 2,
      weapon: currentWeapon,
      speed: PROJECTILE_SPEED,
      damage: getWeaponDamage(currentWeapon),
      size: PROJECTILE_SIZE,
    };

    // Modify projectile properties if machine gun is active
    if (isMachineGunActive) {
      projectile.speed = PROJECTILE_SPEED * 1.3; // Faster bullets
      projectile.damage = getWeaponDamage(currentWeapon) * 0.6; // Less damage per bullet but fires much faster
      projectile.size = PROJECTILE_SIZE * 0.75; // Smaller bullets
      projectile.color = [255, 215, 0]; // Gold/yellow color for machine gun bullets
    }
  }

  // Add slight randomization to machine gun fire direction
  if (isMachineGunActive) {
    // Add random spread to create a machine gun effect
    projectile.x += random(-10, 10);
    projectile.z += random(-5, 5);
  }

  projectiles.push(projectile);

  // If machine gun is active, create an additional projectile for spread effect (one burst = multiple bullets)
  if (isMachineGunActive && random() > 0.5) {
    // 50% chance for an extra bullet
    // Create a second projectile with slight offset
    let secondProjectile = { ...projectile };
    secondProjectile.x += random(-15, 15);
    secondProjectile.z += random(-10, 10);

    // Use slightly different properties
    secondProjectile.damage *= random(0.8, 1.2); // Random damage variation

    projectiles.push(secondProjectile);
  }
}

function getWeaponDamage(weapon) {
  let baseDamage = 0;
  switch (weapon) {
    case "blaster":
      baseDamage = 20;
      break; // Base damage
    case "thunderbolt":
      baseDamage = 45;
      break;
    case "inferno":
      baseDamage = 30;
      break; // Plus DoT effect
    case "frostbite":
      baseDamage = 30;
      break; // Plus CC effect
    case "vortex":
      baseDamage = 40;
      break; // AoE damage
    case "plasma":
      baseDamage = 60;
      break; // Spread damage
    case "photon":
      baseDamage = 80;
      break; // High precision
    default:
      baseDamage = 20;
  }

  // Apply damage boost from power-ups
  return baseDamage + damageBoost;
}

// Maximum number of projectiles to maintain performance
// const MAX_PROJECTILES = 200;
let projectilePool = [];

function updateProjectiles() {
  // Move projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let proj = projectiles[i];
    proj.y -= proj.speed; // Move upward (toward enemies)

    // Remove projectiles that go off-screen (adjusted for longer bridge)
    if (proj.y < (-BRIDGE_LENGTH * 1) / 2) {
      // Add to object pool for reuse instead of garbage collection
      if (projectilePool.length < 50) {
        // Limit pool size
        projectilePool.push(proj);
      }
      projectiles.splice(i, 1);
    }
    // Remove projectiles that go beyond the wall
    else if (isBeyondWall(proj.y)) {
      // Create a small effect when projectile hits the wall
      createHitEffect(
        proj.x,
        220 - WALL_THICKNESS / 2, // Position at the wall
        proj.z,
        WEAPON_COLORS[proj.weapon] || [255, 255, 255],
        15 // Small effect
      );

      // Add to object pool for reuse
      if (projectilePool.length < 50) {
        projectilePool.push(proj);
      }
      projectiles.splice(i, 1);
    }
  }

  // Limit total projectiles to avoid performance issues
  if (projectiles.length > MAX_PROJECTILES) {
    // Remove oldest projectiles when exceeding limit
    const excessCount = projectiles.length - MAX_PROJECTILES;
    projectiles.splice(0, excessCount);
  }
}

// Enemy spawning and movement
function spawnEnemies() {
  if (frameCount - lastEnemySpawn > ENEMY_SPAWN_RATE) {
    // Always spawn enemies (no chance check, continuous spawning)
    // Sometimes spawn rows of enemies
    const spawnRow = random() < 0.8;

    if (spawnRow) {
      // Spawn a row of enemies
      spawnEnemyRow();
    } else {
      // Spawn a single enemy
      spawnSingleEnemy();
    }

    lastEnemySpawn = frameCount;
  }
}

function spawnEnemyRow() {
  // Spawn a row of enemies across the main lane
  const spacing = BRIDGE_WIDTH / ENEMIES_PER_ROW;
  // const spacing = STANDARD_ENEMY_SIZE * 1.2;

  for (let i = 0; i < ENEMIES_PER_ROW; i++) {
    const x = -BRIDGE_WIDTH / 2 + spacing / 2 + i * spacing;

    enemies.push({
      x: x,
      y: (-BRIDGE_LENGTH * 1) / 2 + 100, // Near the top of extended bridge
      z: 0,
      size: STANDARD_ENEMY_SIZE,
      type: "standard", // Rows are always standard enemies
      health: 20, // Easier to defeat in rows
      speed: 3 * 1.2, // Fast moving rows
    });
  }
}

function spawnSingleEnemy() {
  const enemyTypes = ["standard", "standard", "standard", "elite"];
  // Add boss types in later waves
  if (currentWave >= 5 && currentWave % 5 === 0) {
    enemyTypes.push("boss1");
  }
  if (currentWave >= 10 && currentWave % 10 === 0) {
    enemyTypes.push("boss2");
  }
  if (currentWave >= 15 && currentWave % 15 === 0) {
    enemyTypes.push("boss3");
  }

  // Add more elite enemies as waves progress
  if (currentWave >= 3) {
    enemyTypes.push("elite");
  }

  const type = random(enemyTypes);

  // Determine size based on type
  let size = STANDARD_ENEMY_SIZE * 2;
  let health = 30;

  if (type === "elite") {
    size = ELITE_ENEMY_SIZE;
    health = 60;
  } else if (type === "boss1") {
    size = BOSS_SIZES[0];
    health = 150;
  } else if (type === "boss2") {
    size = BOSS_SIZES[1];
    health = 300;
  } else if (type === "boss3") {
    size = BOSS_SIZES[2];
    health = 500;
  }

  // Scale health with wave number for increasing difficulty but keep it easier
  health = Math.floor(health * (1 + currentWave * 0.05 * 10));

  // Only special enemies (elites and bosses) can spawn in power-up lane
  const spawnInPowerUpLane = type !== "standard" && random() < 0.1; // Only elite/boss enemies in power-up lane
  const x = spawnInPowerUpLane
    ? random(BRIDGE_WIDTH / 2, BRIDGE_WIDTH / 2 + POWER_UP_LANE_WIDTH)
    : random(-BRIDGE_WIDTH / 2, BRIDGE_WIDTH / 2);

  enemies.push({
    x: x,
    y: (-BRIDGE_LENGTH * 1) / 2 + 100, // Near the top of extended bridge
    z: 0,
    size: size,
    type: type,
    health: health,
    speed: type.includes("boss") ? 1.5 : 3, // Faster enemies for more action
  });
}

function updateEnemies() {
  // Find the closest squad member to use as a target
  let targetX = 0;
  let targetY = BRIDGE_LENGTH / 2 - 100;
  if (squad.length > 0) {
    // Find the average position of squad members as target
    let avgX = 0;
    let avgY = 0;
    for (let member of squad) {
      avgX += member.x;
      avgY += member.y;
    }
    targetX = avgX / squad.length;
    targetY = avgY / squad.length;
  }

  // Find the shield effect
  let shieldEffect = effects.find((effect) => effect.type === "shield");
  let shieldX = shieldEffect ? shieldEffect.x : targetX;
  let shieldY = shieldEffect ? shieldEffect.y : targetY;
  let shieldRadius = shieldEffect ? shieldEffect.size : 0; // Adjust size factor as needed

  // Find the barrier effect
  let barrierEffect = effects.find((effect) => effect.type === "barrier");
  let barrierX = barrierEffect ? barrierEffect.x : null;
  let barrierY = barrierEffect ? barrierEffect.y : null;
  let barrierWidth = barrierEffect ? barrierEffect.width : 0;

  // Process enemies from the end of the array to avoid index issues when removing
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];

    // Check if enemy is beyond the wall and remove it
    if (isBeyondWall(enemy.y)) {
      // Create an effect to show the enemy being destroyed by the wall
      createCombatHitEffect(
        enemy.x,
        220 - WALL_THICKNESS / 2, // Position at the wall
        enemy.z,
        [255, 100, 0], // Orange explosion
        enemy.size
      );

      // Play destruction sound if available
      if (
        typeof playCombatSound === "function" &&
        sounds &&
        sounds.combat &&
        sounds.combat.explosion
      ) {
        playCombatSound("explosion", enemy.x, enemy.y, 0.5);
      }

      // Remove the enemy
      enemies.splice(i, 1);
      continue; // Skip to the next enemy
    }

    // Check if there's an active barrier to target
    let hasBarrier = barrierEffect !== undefined && barrierX !== null;
    let targetingBarrier = false;

    if (hasBarrier) {
      // Calculate distance to barrier
      const distToBarrierY = Math.abs(barrierY - enemy.y);
      const distToBarrierX = Math.abs(barrierX - enemy.x);

      // Check if enemy is within range to target the barrier
      // Only target the barrier if the enemy is close enough and within the barrier's width
      if (
        distToBarrierY < ENEMY_FIGHT_DISTANCE_THRESHOLD &&
        distToBarrierX < barrierWidth / 2 + enemy.size
      ) {
        targetingBarrier = true;

        // Calculate vector to barrier
        const dx = barrierX - enemy.x;
        const dy = barrierY - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Normalize and apply speed consistently
        if (dist > 0) {
          enemy.x += (dx / dist) * enemy.speed * 2;
          enemy.y += (dy / dist) * enemy.speed * 2;
        }

        // Check for collision with barrier
        const barrierThickness = barrierEffect.thickness || WALL_THICKNESS;
        if (dist < enemy.size / 2 + barrierThickness / 2) {
          // Enemy is hitting the barrier

          // Damage the barrier
          const damageAmount = enemy.type.includes("boss")
            ? 5
            : enemy.type === "elite"
            ? 2
            : 1;
          barrierEffect.health -= damageAmount;

          // Create hit effect
          if (frameCount % 5 === 0) {
            effects.push({
              x: enemy.x + (barrierX - enemy.x) * 0.5,
              y: enemy.y + (barrierY - enemy.y) * 0.5,
              z: enemy.z,
              type: "hit",
              size: 15,
              life: 15,
              color: [200, 100, 100],
            });
          }

          // If barrier is destroyed, remove it
          if (barrierEffect.health <= 0) {
            // Find the barrier effect index and remove it
            const barrierIndex = effects.findIndex(
              (effect) => effect === barrierEffect
            );
            if (barrierIndex !== -1) {
              // Call the onDestroy callback if it exists
              if (typeof barrierEffect.onDestroy === "function") {
                barrierEffect.onDestroy();
              } else {
                // Fallback to the old method if onDestroy doesn't exist
                createBarrierCollapseEffect(
                  {
                    x: barrierEffect.x,
                    y: barrierEffect.y,
                    z: barrierEffect.z,
                  },
                  barrierEffect.width,
                  barrierEffect.height
                );

                // Decrement active barriers count
                skills.skill9.activeBarriers--;
              }

              // Remove the barrier
              effects.splice(barrierIndex, 1);
            }
          }
        }
      }
    }

    // If not targeting barrier, check if enemy is close to the squad
    if (!targetingBarrier) {
      const distanceToSquadY = Math.abs(targetY - enemy.y);

      if (distanceToSquadY < ENEMY_FIGHT_DISTANCE_THRESHOLD) {
        // When close to squad, directly target the squad at consistent speed
        // Calculate vector to target
        const dx = targetX - enemy.x;
        const dy = targetY - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Normalize and apply speed consistently (no acceleration)
        if (dist > 0) {
          enemy.x += (dx / dist) * enemy.speed * 2;
          enemy.y += (dy / dist) * enemy.speed * 2;
        }
      } else {
        // Regular downward movement when far from squad
        enemy.y += enemy.speed;

        // Only bosses have side-to-side movement when far away
        if (enemy.type.includes("boss")) {
          enemy.x += sin(frameCount * 0.05) * 1;
        }
      }
    }

    // Check if enemy is within the shield radius
    const distanceToShield = Math.sqrt(
      Math.pow(enemy.x - shieldX, 2) + Math.pow(enemy.y - shieldY, 2)
    );

    if (distanceToShield < shieldRadius) {
      // Push enemy out of the shield with stronger force
      const pushFactor =
        ((shieldRadius - distanceToShield) / distanceToShield) * 1.5;
      enemy.x += (enemy.x - shieldX) * pushFactor;
      enemy.y += (enemy.y - shieldY) * pushFactor;

      // Create a small visual effect to show the shield is working
      if (frameCount % 10 === 0) {
        effects.push({
          x: enemy.x,
          y: enemy.y,
          z: enemy.z,
          type: "hit",
          size: 10,
          life: 20,
          color: [0, 200, 255],
        });
      }
    }

    // Keep within bridge boundaries
    const leftBound = -BRIDGE_WIDTH / 2;
    const rightBound =
      BRIDGE_WIDTH / 2 +
      (enemy.type.includes("boss") ? POWER_UP_LANE_WIDTH : 0);
    enemy.x = constrain(enemy.x, leftBound, rightBound);
  }
}

// Power-up system
function spawnPowerUps() {
  // Regular power-ups on a timer
  if (frameCount - lastPowerUpSpawn > POWER_UP_SPAWN_RATE) {
    // Check if we're under the limit to avoid too many power-ups
    // if (powerUps.length < MAX_POWER_UPS) {
    // Determine power-up type based on probability
    const rand = random();
    let type = "mirror";

    if (rand < WEAPON_SPAWN_CHANCE) {
      // Weapon power-up
      type = random(WEAPON_TYPES);
    } else if (rand < SKILL_SPAWN_CHANCE) {
      // Skill power-up (fire_rate, damage, or aoe)
      type = random(SKILL_TYPES);
    }

    // Add value for skill power-ups
    let value = 1; // Default value
    if (type === "fire_rate") value = 3; // +3 fire rate
    if (type === "damage") value = 4; // +4 damage
    if (type === "aoe") value = 2; // +2 area effect

    // Calculate position in the center of power-up lane
    const x = BRIDGE_WIDTH / 2 + POWER_UP_LANE_WIDTH / 2; // Center of power-up lane

    // Start position at the far end of the bridge (where enemies spawn)
    let y = (-BRIDGE_LENGTH * 1) / 2 + 100; // Start at the very beginning of bridge

    // Use object from pool if available to reduce memory allocations
    powerUp = {
      x: x,
      y: y,
      z: 0,
      type: type,
      value: value,
      speed: POWER_UP_SPEED + random(-0.5, 1), // Slightly varied speeds
      size: type === "mirror" ? POWER_UP_SIZE * 1.2 : POWER_UP_SIZE, // Slightly larger for mirrors
      rotation: random(0, TWO_PI), // Random starting rotation
      rotationSpeed: type === "mirror" ? 0.03 : random(0.01, 0.05), // How fast it rotates
      stackLevel: 1, // Power-ups of same type can stack
      pulsePhase: random(0, TWO_PI), // For pulsing effect
      orbitals: type === "mirror" ? 3 : type.includes("weapon") ? 3 : 1, // Small orbiting particles
    };

    powerUps.push(powerUp);
    // }

    lastPowerUpSpawn = frameCount;
  }
}

function updatePowerUps() {
  // Move power-ups down the lane
  const bottomBound = (BRIDGE_LENGTH * 1) / 2 + POWER_UP_SIZE;

  for (let i = powerUps.length - 1; i >= 0; i--) {
    let powerUp = powerUps[i];

    // Update rotation and animation states
    powerUp.rotation =
      (powerUp.rotation || 0) + (powerUp.rotationSpeed || 0.02);
    powerUp.pulsePhase = (powerUp.pulsePhase || 0) + 0.01;

    // Move down the lane at varying speeds
    powerUp.y += powerUp.speed;

    // Check if power-up is beyond the wall and remove it
    if (isBeyondWall(powerUp.y)) {
      // Remove the power-up
      powerUps.splice(i, 1);
    }
    // Remove power-ups that go off-screen
    else if (powerUp.y > bottomBound) {
      powerUps.splice(i, 1);
    }
  }
}

// Collision detection - optimized with squared distance calculations
function checkCollisions() {
  // Projectile-Enemy Collisions
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let proj = projectiles[i];

    // Skip if projectile is undefined or missing required properties
    if (!proj || proj.x === undefined || proj.y === undefined) {
      if (i >= 0 && i < projectiles.length) {
        projectiles.splice(i, 1);
      }
      continue;
    }

    // Set default damage if not defined
    if (proj.damage === undefined) {
      proj.damage = 10 + damageBoost; // Base damage + boost
    }

    let hitEnemy = false;

    for (let j = enemies.length - 1; j >= 0; j--) {
      let enemy = enemies[j];

      // Skip if enemy is undefined or missing required properties
      if (!enemy || enemy.x === undefined || enemy.y === undefined) {
        if (j >= 0 && j < enemies.length) {
          enemies.splice(j, 1);
        }
        continue;
      }

      // Skip collision checks for distant objects (culling optimization)
      // Increased the distance check to ensure we don't miss collisions
      if (Math.abs(proj.y - enemy.y) > 150) continue;

      // Fast squared distance check (avoids expensive sqrt operation)
      const dx = proj.x - enemy.x;
      const dy = proj.y - enemy.y;
      const dz = (proj.z || 0) - (enemy.z || 0); // Default to 0 if z is undefined
      const squaredDist = dx * dx + dy * dy + dz * dz;

      // Significantly increased collision threshold to make hits much more forgiving
      const collisionSize = enemy.size / 2 + PROJECTILE_SIZE * 2.5;
      const squaredThreshold = collisionSize * collisionSize;

      if (squaredDist < squaredThreshold) {
        hitEnemy = true;

        // Create a visual indicator of the collision area (only in debug mode)
        if (DEBUG_MODE) {
          effects.push({
            x: (proj.x + enemy.x) / 2,
            y: (proj.y + enemy.y) / 2,
            z: (proj.z + enemy.z) / 2,
            type: "hit",
            size: collisionSize / 2,
            life: 15,
            color: [0, 255, 0, 150], // Green for successful hit
          });
        }

        // Apply damage
        enemy.health -= proj.damage;

        // Add hit effect
        createHitEffect(proj.x, proj.y, proj.z, WEAPON_COLORS[proj.weapon]);

        // Play hit sound with variation based on weapon type
        const isCritical = random() < 0.1; // 10% chance for critical hit sound
        playRandomHitSound(proj.x, proj.y, isCritical);

        // Apply special effects based on weapon
        if (proj.weapon === "inferno") {
          // DoT effect - additional damage over time
          if (!enemy.effects) enemy.effects = {};
          enemy.effects.burning = { duration: 180, damage: 2 };
          // Fire effect
          createFireEffect(enemy.x, enemy.y, enemy.z);
        } else if (proj.weapon === "frostbite") {
          // CC effect - slow movement
          if (!enemy.effects) enemy.effects = {};
          enemy.effects.frozen = { duration: 120, slowFactor: 0.5 };
          enemy.speed *= 0.5;
          // Ice effect
          createIceEffect(enemy.x, enemy.y, enemy.z);
        } else if (proj.weapon === "thunderbolt") {
          // Thunder effect
          createThunderEffect(enemy.x, enemy.y, enemy.z);
        } else if (proj.weapon === "vortex") {
          // Vortex effect optimized to avoid nested loop
          createVortexEffect(enemy.x, enemy.y, enemy.z);
        } else if (proj.weapon === "plasma") {
          // Plasma shotgun spread effect
          createPlasmaEffect(enemy.x, enemy.y, enemy.z);
        }

        // Check if enemy is defeated
        if (enemy.health <= 0) {
          // Add score based on enemy type
          if (enemy.type === "standard") score += 10;
          else if (enemy.type === "elite") score += 25;
          else if (enemy.type === "boss1") score += 100;
          else if (enemy.type === "boss2") score += 250;
          else if (enemy.type === "boss3") score += 500;

          // Increment enemies killed counter
          waveEnemiesKilled++;
          totalEnemiesKilled++;

          // Create explosion effect
          createExplosion(enemy.x, enemy.y, enemy.z, ENEMY_COLORS[enemy.type]);

          enemies.splice(j, 1);
        }

        break; // Projectile hit something, move to next projectile
      }
    }

    // Remove the projectile if it hit an enemy
    if (hitEnemy && i >= 0 && i < projectiles.length) {
      projectiles.splice(i, 1);
    }
  }

  // Squad-PowerUp Collisions - using squared distance
  for (let i = powerUps.length - 1; i >= 0; i--) {
    let powerUp = powerUps[i];

    // Skip if powerUp is undefined or missing required properties
    if (!powerUp || powerUp.x === undefined || powerUp.y === undefined) {
      if (i >= 0 && i < powerUps.length) {
        powerUps.splice(i, 1);
      }
      continue;
    }

    for (let squadMember of squad) {
      // Skip if squadMember is undefined or missing required properties
      if (
        !squadMember ||
        squadMember.x === undefined ||
        squadMember.y === undefined
      ) {
        continue;
      }

      // Skip collision checks for distant power-ups (culling optimization)
      // Increased the distance check to ensure we don't miss collisions
      if (Math.abs(powerUp.y - squadMember.y) > 150) continue;

      // Fast squared distance calculation
      const dx = powerUp.x - squadMember.x;
      const dy = powerUp.y - squadMember.y;
      const dz = (powerUp.z || 0) - (squadMember.z || 0); // Default to 0 if z is undefined
      const squaredDist = dx * dx + dy * dy + dz * dz;

      // Significantly increased collision threshold to make pickups much more forgiving
      const collisionSize = (squadMember.size / 2 + POWER_UP_SIZE / 2) * 2.0;
      const squaredThreshold = collisionSize * collisionSize;

      if (squaredDist < squaredThreshold) {
        // Create a visual indicator of the collision area (only in debug mode)
        if (DEBUG_MODE) {
          effects.push({
            x: (powerUp.x + squadMember.x) / 2,
            y: (powerUp.y + squadMember.y) / 2,
            z: (powerUp.z + squadMember.z) / 2,
            type: "hit",
            size: collisionSize / 2,
            life: 15,
            color: [0, 255, 255, 150], // Cyan for power-up collision
          });
        }

        // Apply power-up effect
        if (powerUp.type === "mirror") {
          // Add a new squad member
          if (squad.length < SQUAD_SIZE) {
            // Configurable max squad size
            // Calculate position for new squad member
            // Arrange in horizontal rows first (up to MAX_SQUAD_MEMBERS_PER_ROW per row)
            // then stack vertically
            const squadRow = Math.floor(
              squad.length / MAX_SQUAD_MEMBERS_PER_ROW
            );
            const squadCol = squad.length % MAX_SQUAD_MEMBERS_PER_ROW;

            // Space to use is 2/3 of bridge width
            const usableWidth = (BRIDGE_WIDTH * 2) / 3;
            const spacing = usableWidth / MAX_SQUAD_MEMBERS_PER_ROW;

            // Calculate position (centered within usable width)
            const startX = -usableWidth / 2 + spacing / 2;
            const newX = startX + squadCol * spacing;
            const newY = BRIDGE_LENGTH / 2 - 100 - squadRow * HUMAN_SIZE * 1.2; // Slight spacing between rows

            squad.push({
              x: newX,
              y: newY,
              z: SQUAD_Z,
              size: HUMAN_SIZE,
              health: SQUAD_HEALTH, // Use configurable health
              weapon: currentWeapon,
              id: Date.now() + squad.length, // Unique ID for reference
            });
          }
        } else if (powerUp.type === "fire_rate") {
          // Accumulate fire rate boost
          fireRateBoost += powerUp.value;
          // Create a visual effect
          createEffect(
            "boost",
            squadMember.x,
            squadMember.y,
            squadMember.z,
            [50, 255, 50]
          );
          // Update score
          score += 100;
        } else if (powerUp.type === "damage") {
          // Accumulate damage boost
          damageBoost += powerUp.value;
          // Create a visual effect
          createEffect(
            "boost",
            squadMember.x,
            squadMember.y,
            squadMember.z,
            [255, 50, 50]
          );
          // Update score
          score += 100;
        } else if (powerUp.type === "aoe") {
          // Accumulate area of effect boost
          aoeBoost += powerUp.value;
          // Create a visual effect
          createEffect(
            "boost",
            squadMember.x,
            squadMember.y,
            squadMember.z,
            [50, 50, 255]
          );
          // Update score
          score += 100;
        } else {
          // Unlock weapon
          weapons[powerUp.type] = true;
          // Equip the new weapon
          currentWeapon = powerUp.type;
          for (let member of squad) {
            member.weapon = currentWeapon;
          }
        }

        // Remove the power-up
        powerUps.splice(i, 1);
        break;
      }
    }
  }

  // Enemy-Squad Collisions - using squared distance
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];

    // Skip if enemy is undefined or missing required properties
    if (!enemy || enemy.x === undefined || enemy.y === undefined) {
      if (i >= 0 && i < enemies.length) {
        enemies.splice(i, 1);
      }
      continue;
    }

    for (let j = squad.length - 1; j >= 0; j--) {
      let member = squad[j];

      // Skip if member is undefined or missing required properties
      if (!member || member.x === undefined || member.y === undefined) {
        continue;
      }

      // Skip collision checks for distant objects (culling optimization)
      // Increased the distance check to ensure we don't miss collisions
      if (Math.abs(enemy.y - member.y) > 150) continue;

      // Fast squared distance calculation
      const dx = enemy.x - member.x;
      const dy = enemy.y - member.y;
      const dz = (enemy.z || 0) - (member.z || 0); // Default to 0 if z is undefined
      const squaredDist = dx * dx + dy * dy + dz * dz;

      // Significantly increased collision threshold to make collisions more reliable
      const collisionSize = (enemy.size / 2 + member.size / 2) * 2.0;
      const squaredThreshold = collisionSize * collisionSize;

      if (squaredDist < squaredThreshold) {
        // Create hit effect to visualize the collision
        createHitEffect(
          (enemy.x + member.x) / 2,
          (enemy.y + member.y) / 2,
          (enemy.z + member.z) / 2,
          [255, 0, 0]
        );

        // Create a visual indicator of the collision area (only in debug mode)
        if (DEBUG_MODE) {
          effects.push({
            x: (enemy.x + member.x) / 2,
            y: (enemy.y + member.y) / 2,
            z: (enemy.z + member.z) / 2,
            type: "hit",
            size: collisionSize / 2,
            life: 15,
            color: [255, 0, 0, 150], // Red for enemy collision
          });
        }

        // Squad member takes damage
        member.health -= 20;

        if (member.health <= 0) {
          // Squad member is defeated
          squad.splice(j, 1);

          // Game over if all squad members are defeated
          if (squad.length === 0) {
            gameState = "gameOver";
          }
        }

        // Enemy also takes damage in collision
        enemy.health -= 30;
        if (enemy.health <= 0) {
          // Create explosion effect
          createCombatHitEffect(
            enemy.x,
            enemy.y,
            enemy.z,
            [255, 100, 0],
            enemy.size
          );
          enemies.splice(i, 1);
        }

        break;
      }
    }
  }
}

// Game progression
function checkWaveCompletion() {
  // Wave is complete when enough enemies are defeated or all enemies are defeated after minimum time
  // Track number of enemies killed in the wave
  const waveTime = DEBUG_MODE ? 10 * 60 : 60 * 60; // 10 seconds in debug mode, 60 seconds normally
  const timeInWave = frameCount - gameStartTime;

  // Require all enemies to be gone AND minimum time to pass
  if (
    waveEnemiesKilled >= ENEMIES_TO_KILL_FOR_NEXT_WAVE ||
    (enemies.length === 0 && timeInWave > waveTime)
  ) {
    // Reset the enemies killed counter for next wave
    waveEnemiesKilled = 0;
    currentWave++;
    gameStartTime = frameCount;
  }
}

// Atomic bomb constants for consistent timing
const ATOMIC_BOMB_FALL_DURATION = 150; // 2.5 seconds at 60fps
const ATOMIC_BOMB_FALL_DURATION_MS = ATOMIC_BOMB_FALL_DURATION * (1000 / 60); // in milliseconds

// Skill system
function activateSkill(skillName) {
  const skill = skills[skillName];

  if (!skill) {
    console.log(`No skill defined for skillName: ${skillName}`);
    return;
  }

  // In debug mode, ignore cooldowns; in normal mode, check cooldowns
  if (frameCount - skill.lastUsed < skill.cooldown) {
    // Skill on cooldown (only in non-debug mode)
    playUISound("error"); // Play error sound for cooldown
    return;
  }

  // Play skill activation sound
  playSkillSound(skillName);
  const skillHandler = getSkillHandler(skillName);
  skillHandler(skill);
}

function updateSkillActivation(skill) {
  skill.lastUsed = frameCount;
  skill.active = true;
  skill.endTime = frameCount + skill.activeDuration;
  setTimeout(() => {
    skill.active = false;
  }, (skill.activeDuration * 1000) / 60);
}

/**
 * Activates the Apocalyptic Devastation skill (Skill 8)
 * This is a radically optimized ultimate weapon that drops a powerful atomic bomb
 * causing massive damage to enemies in a large area
 */
function activateAtomicBombSkill(skill) {
  updateSkillActivation(skill);

  // Get bomb drop point - farther ahead of the player for better visibility
  let bombCenter = { x: 0, y: 0, z: 0 };
  if (squad.length > 0) {
    bombCenter = {
      x: squad[0].x,
      y: squad[0].y - 1200, // Drop far ahead of the squad
      z: squad[0].z,
    };
  }

  // RADICAL OPTIMIZATION: Reduced fall duration for faster effect
  const OPTIMIZED_FALL_DURATION = 90; // 1.5 seconds at 60fps
  const OPTIMIZED_FALL_DURATION_MS = OPTIMIZED_FALL_DURATION * (1000 / 60);

  // Add warning siren effect - single global effect instead of multiple
  effects.push({
    type: "globalWarning",
    life: OPTIMIZED_FALL_DURATION,
    intensity: 0.5,
    forceRenderDetail: true,
  });

  // Add screen shake for dramatic effect
  cameraShake = 3; // Initial shake when launching

  // RADICAL OPTIMIZATION: Single targeting reticle instead of multiple
  effects.push({
    x: bombCenter.x,
    y: bombCenter.y,
    z: 0, // At ground level
    type: "targetingReticle",
    size: 200,
    life: OPTIMIZED_FALL_DURATION,
    color: [255, 50, 50, 150],
    pulseRate: 0.1,
    forceRenderDetail: true,
  });

  // Create initial bomb drop effect (small object falling from sky)
  effects.push({
    x: bombCenter.x,
    y: bombCenter.y,
    z: 1000, // Start high in the sky
    type: "atomicBomb",
    size: 40,
    life: OPTIMIZED_FALL_DURATION,
    endPos: { ...bombCenter, z: bombCenter.z },
    fallStartTime: frameCount,
    forceRenderDetail: true,
  });

  // RADICAL OPTIMIZATION: Skip atmospheric distortion effect
  // Create atomic explosion after delay (when bomb hits ground)
  setTimeout(() => {
    // Massive camera shake when bomb hits
    cameraShake = 20;

    // Enhanced damage based on accumulated damage boost - extremely powerful
    let atomicDamage = 3000 + damageBoost * 150;

    // RADICAL OPTIMIZATION: Single explosion layer with shader-based rendering
    // Create one main explosion effect that uses efficient rendering techniques
    effects.push({
      x: bombCenter.x,
      y: bombCenter.y,
      z: bombCenter.z,
      type: "atomicExplosion",
      size: 1000, // Single large explosion
      life: 120,
      color: [255, 200, 50], // Orange fire color
      layer: 0,
      forceRenderDetail: true,
      radicallyOptimized: true, // Flag for new optimized rendering
    });

    // Add bright flash during explosion - single flash only
    effects.push({
      x: bombCenter.x,
      y: bombCenter.y,
      z: bombCenter.z,
      type: "atomicFlash",
      size: 6000,
      life: 45,
      color: [255, 255, 255],
      forceRenderDetail: true,
    });

    // RADICAL OPTIMIZATION: Single shockwave instead of multiple
    effects.push({
      x: bombCenter.x,
      y: bombCenter.y,
      z: 0, // At ground level
      type: "shockwave",
      size: 1200,
      life: 90,
      color: [255, 150, 50],
      layer: 0,
      forceRenderDetail: true,
    });

    // Apply damage to enemies in batches for better performance
    applyApocalypticDamage(bombCenter, atomicDamage);

    // Apply radiation damage after a short delay
    setTimeout(() => {
      applyRadiationDamage(bombCenter);
    }, 300);
  }, OPTIMIZED_FALL_DURATION_MS);
}

/**
 * Applies the main explosion damage to enemies in batches
 * @param {Object} bombCenter - The center point of the explosion
 * @param {number} atomicDamage - The base damage amount
 */
/**
 * Activates the Barrier skill (Skill 9)
 * Places a wall that enemies target first, protecting the squad
 */
function activateBarrierSkill(skill) {
  updateSkillActivation(skill);

  // Check if maximum number of barriers has been reached
  if (skill.activeBarriers >= skill.maxBarriers) {
    // Play error sound and show error message
    playUISound("error");
    return; // Exit the function without creating a barrier
  }

  // Calculate barrier parameters based on player stats
  const barrierHealth = skill.health + damageBoost * 20; // Barrier health enhanced by damage boost
  const barrierWidth = BRIDGE_WIDTH * 0.8 + aoeBoost * 10; // Barrier width enhanced by AOE boost
  const barrierHeight = WALL_HEIGHT * 0.8 + aoeBoost * 5; // Barrier height enhanced by AOE boost

  // Calculate barrier position - 200 units in front of the squad
  let barrierPosition = { x: 0, y: 0, z: 0 };
  if (squad.length > 0) {
    barrierPosition = {
      x: squad[0].x,
      y: squad[0].y - 200, // 200 units in front of the squad
      z: squad[0].z,
    };
  }

  // Increment active barriers count
  skill.activeBarriers++;

  // Create a barrier effect with no lifetime (will exist until destroyed)
  const barrier = {
    x: barrierPosition.x,
    y: barrierPosition.y,
    z: barrierPosition.z,
    type: "barrier", // New effect type for the barrier
    width: barrierWidth,
    height: barrierHeight,
    thickness: WALL_THICKNESS,
    life: Infinity, // No lifetime - will exist until destroyed
    health: barrierHealth,
    maxHealth: barrierHealth, // Store max health for health bar display
    color: [230, 180, 60, 200], // Yellow brick color for the barrier
    forceRenderDetail: true,
    // Add a callback for when the barrier is destroyed
    onDestroy: function () {
      skill.activeBarriers--; // Decrement active barriers count
      createBarrierCollapseEffect(barrierPosition, barrierWidth, barrierHeight);
    },
  };

  // Add the barrier to effects
  effects.push(barrier);

  // Create deployment effect
  createBarrierDeploymentEffect(barrierPosition, barrierWidth, barrierHeight);
}

/**
 * Creates visual effects for barrier deployment
 */
function createBarrierDeploymentEffect(position, width, height) {
  // Create a shockwave effect at the barrier position
  effects.push({
    x: position.x,
    y: position.y,
    z: position.z,
    type: "shockwave",
    size: width * 0.5,
    life: 30,
    color: [230, 180, 60],
    forceRenderDetail: true,
  });

  // Create particle effects along the barrier
  const particleCount = Math.min(20, Math.floor(width / 20)); // 1 particle per 20 units of width, max 20

  for (let i = 0; i < particleCount; i++) {
    const offsetX = (i / (particleCount - 1) - 0.5) * width;

    effects.push({
      x: position.x + offsetX,
      y: position.y,
      z: position.z + random(-10, 10),
      type: "energyBurst",
      size: 30,
      life: 20 + random(0, 10),
      color: [230, 180, 60, 150],
      forceRenderDetail: false,
    });
  }
}

/**
 * Creates visual effects for barrier collapse
 */
function createBarrierCollapseEffect(position, width, height) {
  // Create a shockwave effect at the barrier position
  effects.push({
    x: position.x,
    y: position.y,
    z: position.z,
    type: "shockwave",
    size: width * 0.4,
    life: 20,
    color: [230, 180, 60, 150],
    forceRenderDetail: false,
  });

  // Create particle effects for the collapse
  const particleCount = Math.min(15, Math.floor(width / 30)); // 1 particle per 30 units of width, max 15

  for (let i = 0; i < particleCount; i++) {
    const offsetX = (i / (particleCount - 1) - 0.5) * width;
    const offsetZ = random(-height / 4, height / 4);

    effects.push({
      x: position.x + offsetX,
      y: position.y,
      z: position.z + offsetZ,
      type: "debris",
      size: 20,
      life: 30 + random(0, 15),
      color: [230, 180, 60, 200],
      velocity: { x: random(-2, 2), y: random(-2, 2), z: random(-1, 1) },
      forceRenderDetail: false,
    });
  }
}

function applyApocalypticDamage(bombCenter, atomicDamage) {
  // RADICAL OPTIMIZATION: Process enemies in batches for damage calculation
  // This reduces the number of distance calculations and improves performance
  const BATCH_SIZE = 20; // Process enemies in batches
  const totalBatches = Math.ceil(enemies.length / BATCH_SIZE);

  for (let batch = 0; batch < totalBatches; batch++) {
    const startIdx = batch * BATCH_SIZE;
    const endIdx = Math.min(startIdx + BATCH_SIZE, enemies.length);

    // Process this batch of enemies
    for (let i = startIdx; i < endIdx; i++) {
      const enemy = enemies[i];
      if (!enemy) continue; // Skip if enemy doesn't exist

      // Calculate distance from explosion center
      const dx = enemy.x - bombCenter.x;
      const dy = enemy.y - bombCenter.y;
      const dz = enemy.z - bombCenter.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Apply damage with distance falloff
      // Enormous blast radius of 6000 units
      const damageMultiplier = Math.max(0.8, 1 - distance / 6000);
      const damage = atomicDamage * damageMultiplier;

      // Apply damage to enemy
      enemy.health -= damage;

      // RADICAL OPTIMIZATION: Create visual effects only for nearby enemies
      // and with much lower probability
      if (distance < 1500 && random() > 0.8) {
        createExplosion(enemy.x, enemy.y, enemy.z, [255, 200, 50]);
      }
    }
  }
}

/**
 * Applies radiation damage to enemies near the explosion center
 * @param {Object} bombCenter - The center point of the explosion
 */
function applyRadiationDamage(bombCenter) {
  // Apply one final wave of radiation damage
  for (let enemy of enemies) {
    const dx = enemy.x - bombCenter.x;
    const dy = enemy.y - bombCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 800) {
      // Apply radiation damage
      const radiationDamage = 50 + damageBoost * 5;
      enemy.health -= radiationDamage;

      // Create a single visual indicator at random positions in the radiation field
      // instead of on each enemy
      if (random() > 0.95) {
        const angle = random(TWO_PI);
        const radius = random(800);
        effects.push({
          x: bombCenter.x + cos(angle) * radius,
          y: bombCenter.y + sin(angle) * radius,
          z: 20,
          type: "radiationBurst",
          size: random(20, 30),
          life: random(20, 30),
          color: [100, 255, 100],
        });
      }
    }
  }
}

function getNextItem(list, currentIndex) {
  // Ensure the list is not empty
  if (list.length === 0) {
    throw new Error("The list is empty.");
  }

  // Calculate the next index using modulo to loop back to the start
  const nextIndex = (currentIndex + 1) % list.length;

  // Return the item at the next index
  return list[nextIndex];
}

function drawMenu() {
  gameState == "menu" ? menuContainer.show() : menuContainer.hide();
}

function drawPauseContainer() {
  // This function is no longer needed as we handle visibility in pauseGame/resumeGame
  // But we keep it for backward compatibility
}

// Global variables for pause/resume containers
let pauseContainer;
let resumeContainer;

function pauseGame() {
  gameState = GameState.PAUSED;

  // Stop all sounds when game is paused
  if (typeof stopAllSounds === "function") {
    stopAllSounds();
  }

  // The pause/resume button will be updated in updatePauseResumeButton
  // which is called from updatePerformanceMetrics in the draw loop

  // For backward compatibility, also update the old UI elements if they exist
  try {
    // Show/hide the appropriate buttons
    if (pauseContainer) {
      pauseContainer.style("display", "none");
    }
    if (resumeContainer) {
      resumeContainer.style("display", "flex");
    }
  } catch (e) {
    console.warn("Error updating legacy UI elements:", e);
  }
}

// Draw resume button in top right corner
function drawResumeContainer() {
  // This function is no longer needed as we handle visibility in pauseGame/resumeGame
  // But we keep it for backward compatibility
}

function resumeGame() {
  gameState = GameState.PLAYING;

  // The pause/resume button will be updated in updatePauseResumeButton
  // which is called from updatePerformanceMetrics in the draw loop

  // For backward compatibility, also update the old UI elements if they exist
  try {
    // Show/hide the appropriate buttons
    if (resumeContainer) {
      resumeContainer.style("display", "none");
    }
    if (pauseContainer) {
      pauseContainer.style("display", "flex");
    }
  } catch (e) {
    console.warn("Error updating legacy UI elements:", e);
  }
}

function drawGameOverContainer() {
  // Set the HTML content of the game over screen
  gameState == "gameOver" ? gameOverContainer.show() : gameOverContainer.hide();
}

// Create DOM elements for HUD - optimized with update frequency control
let lastStatusUpdateTime = 0;
const STATUS_UPDATE_INTERVAL = 5; // Update every 5 frames instead of every frame

function createStatusBoardElements() {
  // Create status board element
  statusBoard = createDiv("");
  statusBoard.id("status-board");
  statusBoard.position(10, 10);
  statusBoard.style("background-color", "rgba(0, 0, 0, 0.27)"); // Reduced opacity to 1/3 of 0.8
  statusBoard.style("color", "white");
  statusBoard.style("border-radius", "5px");
  statusBoard.style("font-family", "monospace");
  statusBoard.style("z-index", "1000");
  statusBoard.style("use-select", "none");
}

function updateStatusBoard() {
  // Only update DOM elements every few frames for better performance
  if (frameCount - lastStatusUpdateTime < STATUS_UPDATE_INTERVAL) {
    return;
  }

  lastStatusUpdateTime = frameCount;

  // Calculate time elapsed
  const elapsedSeconds = Math.floor((millis() - startTime) / 1000);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  // Calculate average health
  const avgHealth =
    squad.length > 0
      ? squad.reduce((sum, member) => sum + member.health, 0) / squad.length
      : 0;
  const healthColor =
    avgHealth > 50 ? "lime" : avgHealth > 25 ? "yellow" : "red";

  // Update status board with HTML content
  statusBoard.style("padding", "10px");
  statusBoard.html(`
    <h3 style="margin: 0 0 10px 0;">STATUS BOARD</h3>
    <div>Time: ${minutes}m ${seconds}s</div>
    <div>Wave: ${currentWave}</div>
    <!-- <div>Score: ${score}</div> -->
    <div>Squad: ${squad.length}/${SQUAD_SIZE}</div>
    <!-- <div>Total Kills: ${totalEnemiesKilled}</div> -->
    <div>Wave Kills: ${waveEnemiesKilled}/${ENEMIES_TO_KILL_FOR_NEXT_WAVE}</div>
    <div>Weapon: ${currentWeapon}</div>
    <div style="color: ${healthColor};">Health: ${Math.floor(avgHealth)}%</div>
  `);
}

let lastTechUpdateTime = 0;
const TECH_UPDATE_INTERVAL = 15; // Update tech stats less frequently (every 15 frames)

function createTechnicalBoardElements() {
  // if (!DEBUG_MODE) {
  //   return;
  // }
  // Create technical board element
  techBoard = createDiv("");
  techBoard.id("tech-board");
  techBoard.position(windowWidth - 270, 10);
  techBoard.style("background-color", "rgba(0, 0, 0, 0.27)"); // Reduced opacity to 1/3 of 0.8
  techBoard.style("color", "white");
  techBoard.style("border-radius", "5px");
  techBoard.style("width", "250px");
  techBoard.style("font-family", "monospace");
  techBoard.style("z-index", "1000");
  techBoard.style("text-align", "right");
  techBoard.style("use-select", "none");

  // Set initial visibility based on techBoardVisible flag
  if (!techBoardVisible) {
    techBoard.style("display", "none");
  }
}

// FPS smoothing for more stable display
// fpsHistory is already declared at the top of the file
const FPS_HISTORY_LENGTH = 10;

// Track actual memory usage over time
let memoryUsageSamples = [];
const MAX_MEMORY_SAMPLES = 5;
let peakMemoryUsage = 0;

function updateTechnicalBoard() {
  // if (!DEBUG_MODE) {
  //   return;
  // }

  // Only update DOM elements every few frames for better performance
  if (frameCount - lastTechUpdateTime < TECH_UPDATE_INTERVAL) {
    return;
  }

  lastTechUpdateTime = frameCount;

  // Get current FPS using p5.js built-in function for averaging
  fpsHistory.push(frameRate());
  if (fpsHistory.length > FPS_HISTORY_LENGTH) {
    fpsHistory.shift(); // Remove oldest value
  }

  // Calculate average FPS for smoother display
  const avgFPS =
    fpsHistory.reduce((sum, fps) => sum + fps, 0) / fpsHistory.length;

  // Calculate time elapsed
  const elapsedSeconds = Math.floor((millis() - startTime) / 1000);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  // Calculate total objects (game complexity metric)
  const objectCount =
    squad.length +
    enemies.length +
    projectiles.length +
    powerUps.length +
    effects.length;

  // Memory usage tracking - attempt to get actual heap size if available
  let memoryUsage = 0;

  // Try to get accurate memory usage if performance.memory is available
  if (window.performance && window.performance.memory) {
    memoryUsage = window.performance.memory.usedJSHeapSize / (1024 * 1024);
    memoryUsageSamples.push(memoryUsage);

    // Keep a rolling window of samples
    if (memoryUsageSamples.length > MAX_MEMORY_SAMPLES) {
      memoryUsageSamples.shift();
    }

    // Track peak memory
    if (memoryUsage > peakMemoryUsage) {
      peakMemoryUsage = memoryUsage;
    }
  } else {
    // Fallback to estimation
    memoryUsage = (objectCount * 0.5).toFixed(1);
  }

  // Calculate average memory usage for smoother display
  const avgMemory =
    memoryUsageSamples.length > 0
      ? memoryUsageSamples.reduce((sum, mem) => sum + mem, 0) /
        memoryUsageSamples.length
      : memoryUsage;

  // Memory usage warning
  const memoryColor =
    avgMemory > 500 ? "red" : avgMemory > 200 ? "yellow" : "white";

  // Add debug mode indicator if needed
  const debugModeText = DEBUG_MODE
    ? '<div style="color: cyan;">⚡ DEBUG MODE ACTIVE</div>'
    : "";

  // Add GPU acceleration indicator
  const gpuEnabled = PerformanceManager.canUseAdvancedFeatures();
  const gpuStatusText = gpuEnabled
    ? '<div style="color: lime;">🚀 GPU ACCELERATION ENABLED</div>'
    : '<div style="color: orange;">⚠️ GPU ACCELERATION DISABLED</div>';

  // Get basic GPU info for technical board
  let gpuInfoText = "";
  // Get detailed GPU info for the breakdown section
  let gpuBreakdownText = "";

  if (PerformanceManager.gpuInfo) {
    // Format the renderer string to be more readable
    const renderer = PerformanceManager.gpuInfo.renderer;
    // Get vendor information
    const vendor = PerformanceManager.gpuInfo.vendor || "Unknown Vendor";

    // Create detailed GPU breakdown for the separate section
    gpuBreakdownText = `<div id="gpu-breakdown" style="background-color: rgba(0, 0, 0, 0.25); color: white; padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 12px; max-width: 300px;">`;
    gpuBreakdownText += `<h4 style="margin: 0 0 5px 0; color: #4CAF50;">GPU BREAKDOWN</h4>`;
    gpuBreakdownText += `<div>GPU: ${renderer} (Tier ${PerformanceManager.gpuTier})</div>`;
    gpuBreakdownText += `<div>Vendor: ${vendor}</div>`;

    // Add texture size info if available
    if (PerformanceManager.gpuInfo.maxTextureSize) {
      const maxTextureSizeMB = (
        (PerformanceManager.gpuInfo.maxTextureSize *
          PerformanceManager.gpuInfo.maxTextureSize *
          4) /
        (1024 * 1024)
      ).toFixed(0);
      gpuBreakdownText += `<div>Max Texture: ${PerformanceManager.gpuInfo.maxTextureSize}px (${maxTextureSizeMB}MB)</div>`;
    }

    // Add key extension support information
    if (PerformanceManager.gpuInfo.extensions) {
      // Check for important extensions
      const hasInstancedArrays = PerformanceManager.gpuInfo.extensions.includes(
        "ANGLE_instanced_arrays"
      );
      const hasFloatTextures =
        PerformanceManager.gpuInfo.extensions.includes("OES_texture_float");
      const hasHalfFloatTextures =
        PerformanceManager.gpuInfo.extensions.includes(
          "OES_texture_half_float"
        );
      const hasDepthTextures = PerformanceManager.gpuInfo.extensions.includes(
        "WEBGL_depth_texture"
      );

      // Create a summary of key capabilities
      gpuBreakdownText += "<div>Features: ";
      gpuBreakdownText += hasInstancedArrays ? "✓Instancing " : "✗Instancing ";
      gpuBreakdownText += hasFloatTextures ? "✓Float " : "✗Float ";
      gpuBreakdownText += hasHalfFloatTextures
        ? "✓Half-Float "
        : "✗Half-Float ";
      gpuBreakdownText += hasDepthTextures ? "✓Depth" : "✗Depth";
      gpuBreakdownText += "</div>";
    }

    gpuBreakdownText += `</div>`;
  }

  // Update technical board with HTML content
  techBoard.style("padding", "10px");
  techBoard.html(`
    <h3 style="margin: 0 0 10px 0;">TECHNICAL BOARD</h3>
    ${debugModeText}
    ${gpuStatusText}
    ${gpuInfoText}
    <div>FPS: ${Math.floor(avgFPS)}</div>
    <div>Objects: ${objectCount}</div>
    <div style="color: ${memoryColor};">Memory: ~${avgMemory.toFixed(
    1
  )} MB</div>
    <div>Peak Mem: ${peakMemoryUsage.toFixed(1)} MB</div>
    <div>Time: ${minutes}m ${seconds}s</div>
    <div>Camera: x=${Math.floor(cameraOffsetX)}, y=${Math.floor(
    cameraOffsetY
  )}, z=${Math.floor(cameraZoom)}</div>
    <div>Squad: x=${Math.floor(squadLeader.x)}, y=${Math.floor(
    squadLeader.y
  )}, z=${Math.floor(squadLeader.z)}</div>
    ${gpuBreakdownText}
  `);

  // Force garbage collection attempt (not guaranteed to work, but might help signal)
  if (frameCount % 600 === 0) {
    // Every 10 seconds
    if (window.gc) {
      try {
        window.gc();
      } catch (e) {
        // Ignore if gc is not available
      }
    }
  }
}

function createMenuElement() {
  // Create menu container element
  menuContainer = createDiv("");
  menuContainer.id("menu-container");
  menuContainer.position(width / 2 - 175, height / 2 - 170); // Center the menu, slightly larger
  menuContainer.style("background-color", "rgba(0, 0, 0, 0.7)");
  menuContainer.style("color", "white");
  menuContainer.style("padding", "20px");
  menuContainer.style("border-radius", "10px");
  menuContainer.style("width", "350px");
  menuContainer.style("height", "360px");
  menuContainer.style("box-sizing", "border-box");
  menuContainer.style("font-family", "monospace");
  menuContainer.style("text-align", "center");
  menuContainer.style("z-index", "1000");
  menuContainer.style("cursor", "pointer"); // Add pointer cursor

  // Add a start button for touch devices
  const startButtonDiv = createDiv("TAP TO START");
  startButtonDiv.style("background-color", "rgba(0, 200, 0, 0.7)");
  startButtonDiv.style("color", "white");
  startButtonDiv.style("font-size", "24px");
  startButtonDiv.style("padding", "15px");
  startButtonDiv.style("margin", "10px auto 20px auto");
  startButtonDiv.style("border-radius", "10px");
  startButtonDiv.style("width", "80%");
  startButtonDiv.style("text-align", "center");
  startButtonDiv.style("cursor", "pointer");
  startButtonDiv.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)");
  startButtonDiv.style("user-select", "none");
  startButtonDiv.style("-webkit-tap-highlight-color", "transparent");

  // Add event handlers to start the game
  startButtonDiv.mousePressed(startGame);
  startButtonDiv.touchStarted(startGame);

  menuContainer.html(`
    <h2 style="margin: 0 0 20px 0;">SQUAD SURVIVAL</h2>
    <p style="font-size: 24px; margin: 0 0 20px 0;">Press ENTER or</p>
  `);

  // Add the start button to the menu
  menuContainer.child(startButtonDiv);

  // Add the rest of the menu content
  const controlsDiv = createDiv(`
    <h3 style="margin: 10px 0; color: #aaffaa;">KEYBOARD CONTROLS</h3>
    <p style="font-size: 16px; margin: 0 0 5px 0;">Arrow Keys: Move Squad</p>
    <p style="font-size: 16px; margin: 0 0 5px 0;">A/S/D/F/Q/W/E/R: Activate Skills</p>

    <h3 style="margin: 10px 0; color: #aaffaa;">TOUCH CONTROLS</h3>
    <p style="font-size: 16px; margin: 0 0 5px 0;">D-Pad: Move Squad</p>
    <p style="font-size: 16px; margin: 0 0 5px 0;">Touch Skills: Activate Skills</p>
  `);

  menuContainer.child(controlsDiv);

  // Add click/touch event to the entire menu to start the game
  menuContainer.mousePressed(startGame);
  menuContainer.touchStarted(startGame);
}

// Function to start the game
function startGame() {
  if (gameState === "menu" || gameState === "gameOver") {
    // Reset game state
    gameState = "playing";
    currentWave = 1;
    score = 0;
    gameStartTime = frameCount;
    startTime = millis();
    totalEnemiesKilled = 0;
    waveEnemiesKilled = 0;

    // Reset squad leader's health
    squadLeader = {
      x: SQUAD_X,
      y: SQUAD_Y,
      z: SQUAD_Z,
      size: HUMAN_SIZE,
      health: SQUAD_HEALTH, // Reset health to full
      weapon: currentWeapon,
      id: Date.now(), // Unique ID for reference
    };

    // Reset squad
    squad = [];
    squad.push(squadLeader);

    // Reset enemies
    enemies = [];

    // Reset projectiles
    projectiles = [];

    // Reset effects
    effects = [];

    // Reset power-ups
    powerUps = [];

    // Reset weapons
    weapons = {
      thunderbolt: true,
      blaster: false,
      inferno: false,
      frostbite: false,
      vortex: false,
      plasma: false,
      photon: false,
    };

    // Reset current weapon
    currentWeapon = WEAPON_TYPES[0];

    // Reset skill upgrades
    fireRateBoost = DEBUG_MODE ? 10 : 0;
    damageBoost = DEBUG_MODE ? 10 : 0;
    aoeBoost = DEBUG_MODE ? 10 : 0;

    // Reset skills cooldowns and make all skills ready
    const currentTime = frameCount;
    for (let skillName in skills) {
      // Set lastUsed to a time that makes the skill ready immediately
      skills[skillName].lastUsed = currentTime - skills[skillName].cooldown - 1;
      if (skills[skillName].active) {
        skills[skillName].active = false;
      }
    }

    // Reset camera
    cameraOffsetX = CAMERA_OFFSET_X;
    cameraOffsetY = CAMERA_OFFSET_Y;
    cameraZoom = calculateDynamicCameraZoom();

    // Hide menu
    menuContainer.style("display", "none");

    // Hide game over screen
    gameOverContainer.style("display", "none");

    // Show controls container with skill bar and D-pad
    if (controlsContainer) {
      controlsContainer.style("display", "flex");
      controlsContainer.style("visibility", "visible");
      controlsContainer.style("opacity", "1");
      controlsContainer.style("margin", "0 auto");

      // Make sure D-pad is visible
      if (dPad) {
        dPad.style("visibility", "visible");
        dPad.style("display", "block");
        dPad.style("opacity", "1");
      }

      // Reset all direction states
      activeDirections.up = false;
      activeDirections.down = false;
      activeDirections.left = false;
      activeDirections.right = false;

      // Log to console for debugging
      console.log("Game started, controls container should be visible");
    }

    // Reset memory warning
    MemoryManager.warningShown = false;
    if (MemoryManager.warningOverlay) {
      MemoryManager.warningOverlay.style("display", "none");
    }

    // Make sure sound toggle button is visible
    if (soundToggleButton) {
      soundToggleButton.style("display", "block");
      soundToggleButton.style("visibility", "visible");
    }

    // Initialize sound system and play music when game starts
    // This is the perfect time to initialize audio since it's after user interaction
    try {
      // Initialize the sound system if not already done
      if (typeof initSounds === "function") {
        initSounds();
      }

      // Resume AudioContext if it exists
      if (typeof getAudioContext === "function") {
        try {
          const audioContext = getAudioContext();
          if (audioContext && audioContext.state !== "running") {
            audioContext.resume().then(() => {
              console.log("AudioContext resumed successfully");
              // Play music after AudioContext is resumed
              playMusic("main");
            });
          } else {
            // AudioContext already running, play music directly
            playMusic("main");
          }
        } catch (e) {
          console.warn("Error accessing AudioContext:", e);
        }
      } else {
        // No AudioContext function available, try playing music directly
        playMusic("main");
      }

      console.log("Sound system initialized and main theme music started");
    } catch (e) {
      console.warn("Error initializing sound system or playing music:", e);
    }

    return false; // Prevent default behavior
  }
}

function createPauseElement() {
  pauseContainer = createDiv("");
  pauseContainer.id("pause-button");
  pauseContainer.class("control-button");
  pauseContainer.style("background-color", "rgba(50, 50, 50, 0.27)");
  pauseContainer.style("border-radius", "5px");
  pauseContainer.style("padding", "10px");
  pauseContainer.style("width", "40px");
  pauseContainer.style("height", "40px");
  pauseContainer.style("cursor", "pointer");
  pauseContainer.style("display", "flex");
  pauseContainer.style("align-items", "center");
  pauseContainer.style("justify-content", "center");
  pauseContainer.html(`
    <div style="display: flex; gap: 4px; align-items: center; justify-content: center">
      <div style="background-color: white; width: 5px; height: 20px;"></div>
      <div style="background-color: white; width: 5px; height: 20px;"></div>
    </div>
  `);
  pauseContainer.mousePressed(pauseGame);

  // Add to controls container
  controlsContainer.child(pauseContainer);
}

function createResumeElement() {
  // Create resume button element
  resumeContainer = createDiv("");
  resumeContainer.id("resume-button");
  resumeContainer.class("control-button");
  resumeContainer.style("background-color", "rgba(50, 50, 50, 0.27)");
  resumeContainer.style("border-radius", "5px");
  resumeContainer.style("padding", "10px");
  resumeContainer.style("width", "40px");
  resumeContainer.style("height", "40px");
  resumeContainer.style("cursor", "pointer");
  resumeContainer.style("display", "none"); // Initially hidden
  resumeContainer.style("align-items", "center");
  resumeContainer.style("justify-content", "center");
  resumeContainer.html(`
    <div style="width: 0; height: 0; border-left: 15px solid white; border-top: 10px solid transparent; border-bottom: 10px solid transparent;"></div>
  `);
  resumeContainer.mousePressed(resumeGame);

  // Add to controls container
  controlsContainer.child(resumeContainer);
}

function createSoundElement() {
  soundContainer = createDiv("");
  soundContainer.id("sound-button");
  soundContainer.class("control-button");
  soundContainer.style("background-color", "rgba(50, 50, 50, 0.27)");
  soundContainer.style("border-radius", "5px");
  soundContainer.style("padding", "10px");
  soundContainer.style("width", "40px");
  soundContainer.style("height", "40px");
  soundContainer.style("cursor", "pointer");
  soundContainer.style("display", "flex");
  soundContainer.style("align-items", "center");
  soundContainer.style("justify-content", "center");

  // Check if sound is muted
  const isMuted =
    typeof soundSettings !== "undefined" ? soundSettings.muted : true;

  // Sound icon based on mute state
  if (isMuted) {
    // Muted icon (speaker with X)
    soundContainer.html(`
      <div style="color: white; font-size: 20px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="23" y1="9" x2="17" y2="15" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <line x1="17" y1="9" x2="23" y2="15" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
    `);
  } else {
    // Unmuted icon (speaker with waves)
    soundContainer.html(`
      <div style="color: white; font-size: 20px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 11.995C17.004 13.3208 16.4774 14.5924 15.54 15.53" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M19.07 4.93C20.9447 6.80528 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9447 17.1947 19.07 19.07" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    `);
  }

  soundContainer.mousePressed(toggleSound);

  // Add to controls container
  controlsContainer.child(soundContainer);
}

function toggleSound() {
  if (typeof soundSettings !== "undefined") {
    // Toggle mute state
    soundSettings.muted = !soundSettings.muted;

    // Update the sound icon based on mute state
    if (soundContainer) {
      if (soundSettings.muted) {
        // Muted icon (speaker with X)
        soundContainer.html(`
          <div style="color: white; font-size: 20px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="23" y1="9" x2="17" y2="15" stroke="white" stroke-width="2" stroke-linecap="round"/>
              <line x1="17" y1="9" x2="23" y2="15" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
        `);
      } else {
        // Unmuted icon (speaker with waves)
        soundContainer.html(`
          <div style="color: white; font-size: 20px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 11.995C17.004 13.3208 16.4774 14.5924 15.54 15.53" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19.07 4.93C20.9447 6.80528 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9447 17.1947 19.07 19.07" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        `);
      }
    }

    // Stop all sounds if muted
    if (soundSettings.muted) {
      stopAllSounds();
    }

    console.log("Sound toggled:", soundSettings.muted ? "Muted" : "Unmuted");
  } else {
    console.log("Sound settings not available");
  }
}

// Open settings function (placeholder - implement your settings logic)
function openSettings() {
  // Implement your settings opening logic here
  console.log("Settings opened");
}

function createGameOverElement() {
  // Create game over screen element
  gameOverContainer = createDiv("");
  gameOverContainer.id("game-over-screen");
  gameOverContainer.position(width / 2 - 150, height / 2 - 100); // Center the screen
  gameOverContainer.style("background-color", "rgba(0, 0, 0, 0.8)");
  gameOverContainer.style("color", "white");
  gameOverContainer.style("padding", "20px");
  gameOverContainer.style("border-radius", "10px");
  gameOverContainer.style("width", "300px");
  gameOverContainer.style("text-align", "center");
  gameOverContainer.style("font-family", "monospace");
  gameOverContainer.style("z-index", "1000");
  gameOverContainer.style("cursor", "pointer"); // Add pointer cursor

  // Create HTML content
  gameOverContainer.html(`
    <h2 style="color: red; margin: 0;">GAME OVER</h2>
    <div style="margin-top: 20px;">Wave Reached: <span id="wave-reached">0</span></div>
    <div>Final Score: <span id="final-score">0</span></div>
  `);

  // Add a restart button for touch devices
  const restartButtonDiv = createDiv("TAP TO RESTART");
  restartButtonDiv.style("background-color", "rgba(200, 0, 0, 0.7)");
  restartButtonDiv.style("color", "white");
  restartButtonDiv.style("font-size", "20px");
  restartButtonDiv.style("padding", "15px");
  restartButtonDiv.style("margin", "20px auto 10px auto");
  restartButtonDiv.style("border-radius", "10px");
  restartButtonDiv.style("width", "80%");
  restartButtonDiv.style("text-align", "center");
  restartButtonDiv.style("cursor", "pointer");
  restartButtonDiv.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)");
  restartButtonDiv.style("user-select", "none");
  restartButtonDiv.style("-webkit-tap-highlight-color", "transparent");

  // Add event handlers to restart the game
  restartButtonDiv.mousePressed(startGame);
  restartButtonDiv.touchStarted(startGame);

  // Add the restart button to the game over screen
  gameOverContainer.child(restartButtonDiv);

  // Add click/touch event to the entire game over screen to restart the game
  gameOverContainer.mousePressed(startGame);
  gameOverContainer.touchStarted(startGame);
}

function createSkillBarElement() {
  // Determine if we're on a mobile device
  const isMobile = windowWidth < 768;

  // Adjust sizes based on screen size
  const skillBarHeight = isMobile ? 180 : 220;
  const skillButtonSize = isMobile ? 50 : 60;
  const skillFontSize = isMobile ? "1.8rem" : "2.2rem";
  const skillNameFontSize = isMobile ? "0.7rem" : "0.8rem";
  const skillMargin = isMobile ? "0 2px" : "0 5px";
  const rowSpacing = isMobile ? "10px" : "20px";

  // Create skill bar container
  skillBar = createDiv("");
  skillBar.id("skill-bar");
  skillBar.style("background", "transparent"); // Reduced opacity to 1/3 of 0.8
  skillBar.style("color", "white");
  skillBar.style("height", skillBarHeight + "px");
  skillBar.style("display", "flex");
  skillBar.style("flex-direction", "column");
  skillBar.style("justify-content", "center");
  skillBar.style("font-family", "monospace");
  skillBar.style("box-sizing", "border-box");
  skillBar.style("margin-left", isMobile ? "5px" : "10px");
  skillBar.style("margin-right", isMobile ? "5px" : "10px");
  skillBar.style("max-width", "500px"); // Ensure it doesn't overlap with d-pad

  // Add skill bar to the controls container
  controlsContainer.child(skillBar);

  // Create row (Q, W, E, R), row (A, S, D, F) containers
  const firstRow = createDiv("");
  firstRow.style("display", "flex");
  firstRow.style("justify-content", "space-around");
  firstRow.style("margin-bottom", rowSpacing);
  firstRow.style("width", "100%");

  const secondRow = createDiv("");
  secondRow.style("display", "flex");
  secondRow.style("justify-content", "space-around");
  secondRow.style("margin-bottom", rowSpacing);
  secondRow.style("width", "100%");

  const thirdRow = createDiv("");
  thirdRow.style("display", "flex");
  thirdRow.style("justify-content", "space-around");
  thirdRow.style("width", "100%");

  // Add rows to skill bar
  skillBar.child(firstRow);
  skillBar.child(secondRow);
  skillBar.child(thirdRow);

  // Create individual skill elements
  // Iterate through the skillUIOrder array to create skill buttons
  skillUIOrder.forEach((skillName, index) => {
    // Skip if skill name is not defined or is a placeholder
    if (!skillName || skillName === "-") return;

    // Get the skill number for backward compatibility with UI
    const skillNumber = skillNameToNumber[skillName];

    const skillDiv = createDiv("");
    skillDiv.id(`skill-${skillName}`); // Use skill name in ID for better semantics
    skillDiv.addClass(`skill-number-${skillNumber}`); // Add class with number for backward compatibility
    skillDiv.style("text-align", "center");
    skillDiv.style("margin", skillMargin);
    skillDiv.style("position", "relative");
    skillDiv.style("height", skillButtonSize + "px");
    skillDiv.style("width", skillButtonSize + "px");
    skillDiv.style("background-color", "rgba(50, 50, 50, 0.27)");
    skillDiv.style("border-radius", "10px");
    skillDiv.style("cursor", "pointer");
    skillDiv.style("transition", "transform 0.1s, background-color 0.2s");
    skillDiv.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)");
    skillDiv.style("user-select", "none");
    skillDiv.style("-webkit-tap-highlight-color", "transparent");
    skillDiv.style("flex", "1"); // Allow buttons to grow to fill available space
    skillDiv.style("min-width", skillButtonSize + "px"); // Set minimum width
    skillDiv.style("max-width", skillButtonSize * 1.2 + "px"); // Set maximum width

    skillDiv.html(`
      <div id="skillName-${skillName}" style="width: ${skillButtonSize}px; overflow: hidden; text-overflow: ellipsis; font-size: ${skillNameFontSize}; font-weight: bold; position: absolute; top: -15px; left: 50%; transform: translateX(-50%); z-index: 1; white-space: nowrap;">${getSkillName(
      skillName
    )}</div>
      <div id="skillKey-${skillName}" style="font-size: ${skillFontSize}; font-weight: bold; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1;">${getSkillKey(
      skillName
    )}</div>
      <div id="needle-${skillName}" style="position: absolute; top: 50%; left: 50%; width: 2px; height: ${skillButtonSize}px; background-color: transparent; transform-origin: bottom center; transform: translate(-50%, -100%) rotate(0deg); z-index: 2;"></div>
      <div id="overlay-${skillName}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: conic-gradient(rgba(0, 0, 0, 0.5) 0deg, rgba(0, 0, 0, 0.5) 0deg, transparent 0deg, transparent 360deg); z-index: 0; border-radius: 10px;"></div>
    `);

    // Add click/touch event handler to activate the skill
    // Use the skill name directly
    const skillNameForButton = skillName;

    // Visual feedback on mouse/touch down
    skillDiv.mousePressed(function () {
      if (gameState === "playing") {
        // Visual feedback - scale down slightly and change background
        this.style("transform", "scale(0.95)");
        this.style("background-color", "rgba(80, 80, 80, 0.9)");

        // Activate the skill
        activateSkill(skillNameForButton);

        // Reset visual state after a short delay
        setTimeout(() => {
          this.style("transform", "scale(1.0)");
          this.style("background-color", "rgba(50, 50, 50, 0.27)");
        }, 150);
      }
    });

    // Add touch event handler for mobile devices
    skillDiv.touchStarted(function () {
      if (gameState === "playing") {
        // Visual feedback - scale down slightly and change background
        this.style("transform", "scale(0.95)");
        this.style("background-color", "rgba(80, 80, 80, 0.9)");

        // Activate the skill
        activateSkill(skillNameForButton);

        // Reset visual state after a short delay
        setTimeout(() => {
          this.style("transform", "scale(1.0)");
          this.style("background-color", "rgba(50, 50, 50, 0.27)");
        }, 150);

        return false; // Prevent default touch behavior
      }
    });

    // Add to the appropriate row based on skill type
    // Organize skills into rows based on their function
    if (
      skillName === SkillName.STAR_BLAST ||
      skillName === SkillName.MACHINE_GUN ||
      skillName === SkillName.SHIELD ||
      skillName === SkillName.FREEZE
    ) {
      // First row: Basic combat skills
      firstRow.child(skillDiv);
    } else if (
      skillName === SkillName.REJUVENATION ||
      skillName === SkillName.INFERNAL_RAGE ||
      skillName === SkillName.QUANTUM_ACCELERATION ||
      skillName === SkillName.ATOMIC_BOMB
    ) {
      // Second row: Advanced combat skills
      secondRow.child(skillDiv);
    } else {
      // Third row: Utility skills (like Barrier)
      thirdRow.child(skillDiv);
    }
  });
  skillBar.style("visibility", "hidden");
}

function updateSkillBar() {
  if (gameState != "playing") {
    return;
  }

  skillBar.style("visibility", "visible");

  // Iterate through all skill names in the UI order
  skillUIOrder.forEach((skillName) => {
    // Skip if skill name is not defined or is a placeholder
    if (!skillName || skillName === "-") return;

    const skill = skills[skillName];
    if (!skill) {
      // console.log(`Skill ${skillName} not defined`);
      return;
    }

    const skillDiv = select(`#skill-${skillName}`);
    if (!skillDiv) {
      console.log(`skillDiv for ${skillName} not found`);
      return;
    }

    // Get the skill number for backward compatibility with UI logic
    const skillNumber = skillNameToNumber[skillName];

    // Check if skills are active
    const cooldownRemaining = skill.cooldown - (frameCount - skill.lastUsed);
    const cooldownPercent = max(0, cooldownRemaining) / skill.cooldown;
    const isApocalypticDevastationSkill = skillName === SkillName.ATOMIC_BOMB;
    const isSkillActive = !isApocalypticDevastationSkill && skill.active;
    const isAtomicBombActive =
      isApocalypticDevastationSkill &&
      frameCount - skill.lastUsed < skill.activeDuration;

    if (cooldownPercent <= 0) {
      skillDiv.style("box-shadow", "0 4px 12px rgba(100, 255, 100, 0.4)");
    }

    if (cooldownPercent > 0) {
      skillDiv.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)");
      select(`#skillName-${skillName}`).html(
        `(${Math.ceil(cooldownRemaining / 60)}s)`
      );
    } else {
      // Reset the skill name to normal
      select(`#skillName-${skillName}`).html(getSkillName(skillName));

      // Reset key display for Apocalyptic Devastation
      if (isApocalypticDevastationSkill) {
        select(`#skillKey-${skillName}`).html("R");
      }
    }

    if (isSkillActive) {
      // Get colors for current skill
      const colors = generateSkillColors(skillNumber);

      // Pulsing background effect
      const pulseIntensity = frameCount % 20 < 10 ? 1.0 : 0.7;
      const [r, g, b] = colors.primary;

      // Apply visual effects
      skillDiv.style(
        "background-color",
        `rgba(${r}, ${g}, ${b}, ${pulseIntensity})`
      );
      skillDiv.style("box-shadow", `0 0 10px rgba(${r}, ${g}, ${b}, 0.8)`);
      select(`#skillKey-${skillName}`).style("color", colors.keyColor);
    } else if (isAtomicBombActive) {
      // Atomic bomb explosion effect in skill bar
      // Rapidly flashing red/orange/yellow background
      const explosionPhase = frameCount % 6; // Create a rapid flashing effect
      let bgColor;

      // Cycle through explosion colors
      if (explosionPhase < 2) {
        bgColor = "rgba(255, 255, 220, 0.9)"; // Bright flash
      } else if (explosionPhase < 4) {
        bgColor = "rgba(255, 150, 50, 0.8)"; // Orange fire
      } else {
        bgColor = "rgba(150, 50, 0, 0.7)"; // Dark red/brown
      }

      // Apply explosion styles
      skillDiv.style("background-color", bgColor);
      skillDiv.style("box-shadow", "0 0 20px rgba(255, 100, 0, 0.9)");

      // Create pulsing size effect
      const pulseScale = 1.0 + 0.1 * Math.sin(frameCount * 0.5);
      skillDiv.style("transform", `scale(${pulseScale})`);

      // Mushroom cloud icon on the skill
      select(`#skillKey-${skillName}`).html("☢");
      select(`#skillKey-${skillName}`).style("color", "rgba(255, 50, 0, 1.0)");
      select(`#skillKey-${skillName}`).style("text-shadow", "0 0 10px white");

      // Add explosion text effect
      select(`#skillName-${skillName}`).html("☢ BOOM! ☢");
      select(`#skillName-${skillName}`).style("color", "rgba(255, 50, 0, 1.0)");
    } else {
      // Reset to normal appearance
      skillDiv.style("background-color", "rgba(50, 50, 50, 0.27)");
      skillDiv.style("box-shadow", "none");
      skillDiv.style("transform", "scale(1.0)");

      select(`#skillName-${skillName}`).style("color", "white");

      // Reset key color
      select(`#skillKey-${skillName}`).style("color", "white");
      select(`#skillKey-${skillName}`).style("text-shadow", "none");
    }

    // Update needle rotation
    const needleDiv = select(`#needle-${skillName}`);
    const overlayDiv = select(`#overlay-${skillName}`);
    if (!needleDiv || !overlayDiv) {
      console.log(`needleDiv/overlayDiv for ${skillName} not found`);
      return;
    }

    const rotationDegree = 360 * (1 - cooldownPercent); // Counterclockwise rotation
    needleDiv.style(
      "transform",
      `translate(-50%, -100%) rotate(${rotationDegree}deg)`
    );
    needleDiv.style("opacity", cooldownPercent > 0 ? 1 : 0); // Hide needle when cooldown is complete

    // Update overlay gradient - special color for active skills
    if (isSkillActive) {
      // Get colors for current skill
      const colors = generateSkillColors(skillNumber);
      const [r, g, b] = colors.primary;

      // Apply overlay with the appropriate color
      overlayDiv.style(
        "background",
        `conic-gradient(rgba(${r}, ${g}, ${b}, 0.3) ${rotationDegree}deg, rgba(${r}, ${g}, ${b}, 0.3) ${rotationDegree}deg, transparent ${rotationDegree}deg, transparent 360deg)`
      );
      overlayDiv.style("border-radius", "10px"); // Maintain border radius
    } else if (isAtomicBombActive) {
      // Atomic bomb gets a red/orange overlay with animated effect
      const explosionPhase = frameCount % 6; // Match the flash effect
      let overlayColor;

      if (explosionPhase < 2) {
        overlayColor = "rgba(255, 255, 50, 0.4)"; // Bright yellow
      } else if (explosionPhase < 4) {
        overlayColor = "rgba(255, 100, 0, 0.4)"; // Orange
      } else {
        overlayColor = "rgba(255, 0, 0, 0.3)"; // Red
      }

      overlayDiv.style(
        "background",
        `conic-gradient(${overlayColor} ${rotationDegree}deg, ${overlayColor} ${rotationDegree}deg, transparent ${rotationDegree}deg, transparent 360deg)`
      );
      overlayDiv.style("border-radius", "10px"); // Maintain border radius
    } else {
      // Normal overlay for other skills or inactive skills
      overlayDiv.style(
        "background",
        `conic-gradient(rgba(0, 0, 0, 0.5) ${rotationDegree}deg, rgba(0, 0, 0, 0.5) ${rotationDegree}deg, transparent ${rotationDegree}deg, transparent 360deg)`
      );
      overlayDiv.style("border-radius", "10px"); // Maintain border radius
    }
  });
}

// Create directional pad for touch/click movement
function createDirectionalPadElement() {
  // Determine if we're on a mobile device
  const isMobile = windowWidth < 768;

  // Adjust sizes based on screen size
  const dPadSize = isMobile ? 160 : 220;
  const buttonSize = isMobile ? 50 : 60;
  const fontSize = isMobile ? 24 : 28;
  const centerOffset = dPadSize / 2 - buttonSize / 2;
  const edgeOffset = isMobile ? 15 : 20;

  // Define larger touch area size (invisible hit area)
  const touchAreaSize = isMobile ? 80 : 90; // Much larger touch area for mobile
  const touchAreaOffset = dPadSize / 2 - touchAreaSize / 2;

  // Create main d-pad container
  dPad = createDiv("");
  dPad.id("d-pad-container");
  dPad.style("width", dPadSize + "px");
  dPad.style("height", dPadSize + "px");
  dPad.style("position", "relative");
  dPad.style("background-color", "rgba(30, 30, 30, 0.27)"); // Reduced opacity to 1/3 of 0.8
  dPad.style("border-radius", dPadSize / 2 + "px");
  dPad.style("flex-shrink", "0"); // Prevent d-pad from shrinking
  dPad.style("border", "3px solid rgba(200, 200, 200, 0.23)"); // Reduced opacity to 1/3 of 0.7
  dPad.style("z-index", "1600");
  dPad.style("box-shadow", "0 0 15px rgba(0, 0, 0, 0.5)");
  dPad.style("margin-left", isMobile ? "5px" : "10px"); // Add margin on the left

  // Add d-pad to the controls container
  controlsContainer.child(dPad);

  dPad.style("display", "block");
  dPad.style("pointer-events", "auto");

  // Create invisible touch areas first (they'll be below the visible buttons)

  // Up touch area
  const upTouchArea = createDiv("");
  upTouchArea.id("up-touch-area");
  upTouchArea.style("position", "absolute");
  upTouchArea.style("top", "0px");
  upTouchArea.style("left", touchAreaOffset + "px");
  upTouchArea.style("width", touchAreaSize + "px");
  upTouchArea.style("height", dPadSize / 2 + "px"); // Top half of d-pad
  upTouchArea.style("background-color", "rgba(255, 255, 255, 0)"); // Completely transparent
  upTouchArea.style("cursor", "pointer");
  upTouchArea.style("z-index", "1601"); // Above the d-pad background but below the buttons

  // Down touch area
  const downTouchArea = createDiv("");
  downTouchArea.id("down-touch-area");
  downTouchArea.style("position", "absolute");
  downTouchArea.style("bottom", "0px");
  downTouchArea.style("left", touchAreaOffset + "px");
  downTouchArea.style("width", touchAreaSize + "px");
  downTouchArea.style("height", dPadSize / 2 + "px"); // Bottom half of d-pad
  downTouchArea.style("background-color", "rgba(255, 255, 255, 0)");
  downTouchArea.style("cursor", "pointer");
  downTouchArea.style("z-index", "1601");

  // Left touch area
  const leftTouchArea = createDiv("");
  leftTouchArea.id("left-touch-area");
  leftTouchArea.style("position", "absolute");
  leftTouchArea.style("top", touchAreaOffset + "px");
  leftTouchArea.style("left", "0px");
  leftTouchArea.style("width", dPadSize / 2 + "px"); // Left half of d-pad
  leftTouchArea.style("height", touchAreaSize + "px");
  leftTouchArea.style("background-color", "rgba(255, 255, 255, 0)");
  leftTouchArea.style("cursor", "pointer");
  leftTouchArea.style("z-index", "1601");

  // Right touch area
  const rightTouchArea = createDiv("");
  rightTouchArea.id("right-touch-area");
  rightTouchArea.style("position", "absolute");
  rightTouchArea.style("top", touchAreaOffset + "px");
  rightTouchArea.style("right", "0px");
  rightTouchArea.style("width", dPadSize / 2 + "px"); // Right half of d-pad
  rightTouchArea.style("height", touchAreaSize + "px");
  rightTouchArea.style("background-color", "rgba(255, 255, 255, 0)");
  rightTouchArea.style("cursor", "pointer");
  rightTouchArea.style("z-index", "1601");

  // Create visible buttons (these will be on top of the touch areas)

  // Create up button
  upButton = createDiv("▲");
  upButton.id("up-button");
  upButton.style("position", "absolute");
  upButton.style("top", edgeOffset + "px");
  upButton.style("left", centerOffset + "px");
  upButton.style("width", buttonSize + "px");
  upButton.style("height", buttonSize + "px");
  upButton.style("background-color", "rgba(50, 50, 50, 0.27)");
  upButton.style("color", "white");
  upButton.style("font-size", fontSize + "px");
  upButton.style("display", "flex");
  upButton.style("align-items", "center");
  upButton.style("justify-content", "center");
  upButton.style("border-radius", "15px");
  upButton.style("cursor", "pointer");
  upButton.style("user-select", "none");
  upButton.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)");
  upButton.style("transition", "transform 0.1s, background-color 0.2s");
  upButton.style("-webkit-tap-highlight-color", "transparent");
  upButton.style("z-index", "1602"); // Above the touch areas

  // Create down button
  downButton = createDiv("▼");
  downButton.id("down-button");
  downButton.style("position", "absolute");
  downButton.style("bottom", edgeOffset + "px");
  downButton.style("left", centerOffset + "px");
  downButton.style("width", buttonSize + "px");
  downButton.style("height", buttonSize + "px");
  downButton.style("background-color", "rgba(50, 50, 50, 0.27)");
  downButton.style("color", "white");
  downButton.style("font-size", fontSize + "px");
  downButton.style("display", "flex");
  downButton.style("align-items", "center");
  downButton.style("justify-content", "center");
  downButton.style("border-radius", "15px");
  downButton.style("cursor", "pointer");
  downButton.style("user-select", "none");
  downButton.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)");
  downButton.style("transition", "transform 0.1s, background-color 0.2s");
  downButton.style("-webkit-tap-highlight-color", "transparent");
  downButton.style("z-index", "1602");

  // Create left button
  leftButton = createDiv("◀");
  leftButton.id("left-button");
  leftButton.style("position", "absolute");
  leftButton.style("top", centerOffset + "px");
  leftButton.style("left", edgeOffset + "px");
  leftButton.style("width", buttonSize + "px");
  leftButton.style("height", buttonSize + "px");
  leftButton.style("background-color", "rgba(50, 50, 50, 0.27)");
  leftButton.style("color", "white");
  leftButton.style("font-size", fontSize + "px");
  leftButton.style("display", "flex");
  leftButton.style("align-items", "center");
  leftButton.style("justify-content", "center");
  leftButton.style("border-radius", "15px");
  leftButton.style("cursor", "pointer");
  leftButton.style("user-select", "none");
  leftButton.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)");
  leftButton.style("transition", "transform 0.1s, background-color 0.2s");
  leftButton.style("-webkit-tap-highlight-color", "transparent");
  leftButton.style("z-index", "1602");

  // Create right button
  rightButton = createDiv("▶");
  rightButton.id("right-button");
  rightButton.style("position", "absolute");
  rightButton.style("top", centerOffset + "px");
  rightButton.style("right", edgeOffset + "px");
  rightButton.style("width", buttonSize + "px");
  rightButton.style("height", buttonSize + "px");
  rightButton.style("background-color", "rgba(50, 50, 50, 0.27)");
  rightButton.style("color", "white");
  rightButton.style("font-size", fontSize + "px");
  rightButton.style("display", "flex");
  rightButton.style("align-items", "center");
  rightButton.style("justify-content", "center");
  rightButton.style("border-radius", "15px");
  rightButton.style("cursor", "pointer");
  rightButton.style("user-select", "none");
  rightButton.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)");
  rightButton.style("transition", "transform 0.1s, background-color 0.2s");
  rightButton.style("-webkit-tap-highlight-color", "transparent");
  rightButton.style("z-index", "1602");

  // Create center button (optional - can be used for special actions)
  const centerButton = createDiv("•");
  centerButton.id("center-button");
  centerButton.style("position", "absolute");
  centerButton.style("top", centerOffset + "px");
  centerButton.style("left", centerOffset + "px");
  centerButton.style("width", buttonSize + "px");
  centerButton.style("height", buttonSize + "px");
  centerButton.style("background-color", "rgba(70, 70, 70, 0.8)");
  centerButton.style("color", "white");
  centerButton.style("font-size", fontSize + 4 + "px");
  centerButton.style("display", "flex");
  centerButton.style("align-items", "center");
  centerButton.style("justify-content", "center");
  centerButton.style("border-radius", "15px");
  centerButton.style("cursor", "pointer");
  centerButton.style("user-select", "none");
  centerButton.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)");
  centerButton.style("transition", "transform 0.1s, background-color 0.2s");
  centerButton.style("-webkit-tap-highlight-color", "transparent");
  centerButton.style("z-index", "1602");

  // Add touch areas to the d-pad first (lower z-index)
  dPad.child(upTouchArea);
  dPad.child(downTouchArea);
  dPad.child(leftTouchArea);
  dPad.child(rightTouchArea);

  // Add visible buttons to the d-pad (higher z-index)
  dPad.child(upButton);
  dPad.child(downButton);
  dPad.child(leftButton);
  dPad.child(rightButton);
  dPad.child(centerButton);

  // Add event handlers for visible buttons
  setupDirectionalButton(upButton, "up");
  setupDirectionalButton(downButton, "down");
  setupDirectionalButton(leftButton, "left");
  setupDirectionalButton(rightButton, "right");

  // Add event handlers for the larger touch areas
  // These will trigger the same actions but provide a larger hit area
  setupDirectionalButton(upTouchArea, "up", upButton);
  setupDirectionalButton(downTouchArea, "down", downButton);
  setupDirectionalButton(leftTouchArea, "left", leftButton);
  setupDirectionalButton(rightTouchArea, "right", rightButton);

  // Initially hide the d-pad
  dPad.style("visibility", "hidden");
}

// Update the content of DOM HUD elements - with optimized drawing
function updateHUD() {
  // Only update if in playing state to avoid unnecessary DOM operations
  if (gameState === "playing") {
    updateStatusBoard();
    updateTechnicalBoard();
    updateSkillBar();

    // Always update the tech board button to show current FPS
    // even if the technical board is hidden
    updateTechBoardButton();
  } else if (gameState === "paused") {
    // Update FPS display even when paused
    updateTechBoardButton();
  }
}

// Input handlers
function keyPressed() {
  if (keyCode === ENTER) {
    if (gameState === "menu" || gameState === "gameOver") {
      startGame();
    }
  }

  // Toggle pause with P key
  if (key === "p" || key === "P") {
    if (gameState === GameState.PLAYING) {
      pauseGame();
      gameStartTime = frameCount;
    } else if (gameState === GameState.PAUSED) {
      resumeGame();
    }
  }

  // Only process skill keys during gameplay
  if (gameState === GameState.PLAYING) {
    // Bottom row skills (A, S, D, F)
    if (key === "a" || key === "A") {
      activateSkill(SkillName.STAR_BLAST);
    } else if (key === "s" || key === "S") {
      activateSkill(SkillName.MACHINE_GUN);
    } else if (key === "d" || key === "D") {
      activateSkill(SkillName.SHIELD);
    } else if (key === "f" || key === "F") {
      activateSkill(SkillName.FREEZE);
    }

    // Top row skills (Q, W, E, R)
    if (key === "q" || key === "Q") {
      activateSkill(SkillName.REJUVENATION);
    } else if (key === "w" || key === "W") {
      activateSkill(SkillName.INFERNAL_RAGE);
    } else if (key === "e" || key === "E") {
      activateSkill(SkillName.QUANTUM_ACCELERATION);
    } else if (key === "r" || key === "R") {
      activateSkill(SkillName.ATOMIC_BOMB);
    } else if (key === "b" || key === "B") {
      activateSkill(SkillName.BARRIER);
    }
  }
}

function mousePressed() {
  if (mouseButton === CENTER) {
    isDragging = true;
    prevMouseX = mouseX;
    prevMouseY = mouseY;
  }
}

function mouseReleased() {
  if (mouseButton === CENTER) {
    isDragging = false;
  }
}

function mouseDragged() {
  if (isDragging) {
    cameraOffsetX += mouseX - prevMouseX;
    cameraOffsetY += mouseY - prevMouseY;
    prevMouseX = mouseX;
    prevMouseY = mouseY;
  }
}

function mouseWheel(event) {
  // Zoom in/out with mouse wheel
  cameraZoom = constrain(cameraZoom + event.delta, MIN_ZOOM, MAX_ZOOM);
  return false; // Prevent default scrolling
}

// Reset game to initial state
function resetGame() {
  currentWave = 1;
  score = 0;
  waveEnemiesKilled = 0;
  startTime = millis();

  // Reset squad - position near the wall
  squad = [
    {
      x: 0,
      y: BRIDGE_LENGTH / 2 - WALL_THICKNESS - 800, // Position extremely far from the wall to be clearly visible at the bottom of the screen
      z: 0,
      size: HUMAN_SIZE,
      health: SQUAD_HEALTH,
      weapon: "blaster",
    },
  ];

  // Reset enemies and projectiles
  enemies = [];
  projectiles = [];
  powerUps = [];

  // Reset weapons
  weapons = {
    blaster: true,
    thunderbolt: false,
    inferno: false,
    frostbite: false,
    vortex: false,
    plasma: false,
    photon: false,
  };

  // Reset skills
  // Use the skill name constants instead of numeric references
  Object.values(SkillName).forEach((skillName) => {
    if (skills[skillName]) {
      skills[skillName].lastUsed = 0;
    }
  });

  // Reset camera to show the entire bridge
  cameraOffsetX = CAMERA_OFFSET_X;
  cameraOffsetY = CAMERA_OFFSET_Y;
  cameraZoom = calculateDynamicCameraZoom();
}

function applyEffects() {
  // Update effects lifetimes and remove dead effects
  for (let i = effects.length - 1; i >= 0; i--) {
    effects[i].life--;

    // Special handling for machine gun effects
    if (effects[i].type === "machineGun") {
      // Check if the machine gun skill is still active
      if (!skills[SkillName.MACHINE_GUN].active) {
        effects[i].life = 0; // Force effect to end if skill is no longer active
      }

      // Update position to follow the squad member
      if (effects[i].member) {
        effects[i].x = effects[i].member.x;
        effects[i].y = effects[i].member.y;
        effects[i].z = effects[i].member.z;
      }
    }

    // Special handling for effects that follow the squad
    if (
      (effects[i].type === "shield" || effects[i].type === "areaBarrier") &&
      squad.length > 0
    ) {
      // Calculate the new center point of the squad
      let totalX = 0,
        totalY = 0,
        totalZ = 0;
      for (let member of squad) {
        totalX += member.x;
        totalY += member.y;
        totalZ += member.z;
      }
      effects[i].x = totalX / squad.length;
      effects[i].y = totalY / squad.length;
      effects[i].z = totalZ / squad.length;
    }

    // Special handling for ice crystals attached to enemies
    if (effects[i].type === "iceCrystal" && effects[i].enemy) {
      // Update position to follow the enemy
      if (effects[i].enemy) {
        effects[i].x = effects[i].enemy.x + (effects[i].offsetX || 0);
        effects[i].y = effects[i].enemy.y + (effects[i].offsetY || 0);
        effects[i].z = effects[i].enemy.z + (effects[i].offsetZ || 0);
      }
    }

    if (effects[i].life <= 0) {
      // Remove but don't create new objects
      effects.splice(i, 1);
    }
  }

  // Limit total effects to prevent memory issues
  const maxEffectsBasedOnMemory =
    memoryUsageSamples.length > 0 &&
    memoryUsageSamples[memoryUsageSamples.length - 1] > 300
      ? 30
      : MAX_EFFECTS;

  // If memory usage is high, be more aggressive with cleanup
  if (effects.length > maxEffectsBasedOnMemory) {
    // Sort effects by importance (shields and machine gun effects are most important)
    effects.sort((a, b) => {
      // Shield effects have highest priority
      if (a.type === "shield" && b.type !== "shield") return 1;
      if (b.type === "shield" && a.type !== "shield") return -1;

      // Machine gun effects have second highest priority
      if (a.type === "machineGun" && b.type !== "machineGun") return 1;
      if (b.type === "machineGun" && a.type !== "machineGun") return -1;

      // Sort by remaining life (keep ones with most life left)
      return a.life - b.life;
    });

    // Remove excess effects
    effects.splice(0, effects.length - maxEffectsBasedOnMemory);
  }
}

function applyEnemyEffects() {
  // Apply ongoing effects to enemies
  for (let enemy of enemies) {
    if (enemy.effects) {
      // Apply burning damage over time
      if (enemy.effects.burning) {
        enemy.effects.burning.duration--;
        enemy.health -= enemy.effects.burning.damage;

        // Create fire effect occasionally
        if (frameCount % 20 === 0) {
          createFireEffect(enemy.x, enemy.y, enemy.z);
        }

        if (enemy.effects.burning.duration <= 0) {
          delete enemy.effects.burning;
        }
      }

      // Update frozen effect
      if (enemy.effects.frozen) {
        enemy.effects.frozen.duration--;

        // OPTIMIZATION: Create ice effects based on the configured interval
        // This allows for different frequencies on different performance levels
        if (
          enemy.effects.frozen.iceEffectInterval > 0 &&
          frameCount >= enemy.effects.frozen.nextIceEffectFrame
        ) {
          // Create a simplified ice effect (just one crystal instead of many)
          effects.push({
            x: enemy.x,
            y: enemy.y,
            z: enemy.z,
            type: "iceCrystal",
            size: 15,
            life: 30,
            color: [200, 240, 255],
            growthTime: 5,
          });

          // Schedule next ice effect
          enemy.effects.frozen.nextIceEffectFrame =
            frameCount + enemy.effects.frozen.iceEffectInterval;
        }

        if (enemy.effects.frozen.duration <= 0) {
          // Reset speed when effect expires
          enemy.speed = enemy.effects.frozen.originalSpeed;
          delete enemy.effects.frozen;
        }
      }
    }

    // Check if enemy has died from effects
    if (enemy.health <= 0) {
      // Add score based on enemy type
      if (enemy.type === "standard") score += 10;
      else if (enemy.type === "elite") score += 25;
      else if (enemy.type === "boss1") score += 100;
      else if (enemy.type === "boss2") score += 250;
      else if (enemy.type === "boss3") score += 500;

      // Increment enemies killed counter
      waveEnemiesKilled++;

      // Create explosion effect
      createExplosion(enemy.x, enemy.y, enemy.z, ENEMY_COLORS[enemy.type]);

      // Remove the enemy
      const index = enemies.indexOf(enemy);
      if (index > -1) {
        enemies.splice(index, 1);
      }
    }
  }
}

// Helper function to get enemy max health for health bar calculation
function getEnemyMaxHealth(enemyType) {
  let baseHealth = 30;

  if (enemyType === "elite") {
    baseHealth = 60;
  } else if (enemyType === "boss1") {
    baseHealth = 150;
  } else if (enemyType === "boss2") {
    baseHealth = 300;
  } else if (enemyType === "boss3") {
    baseHealth = 500;
  }

  return Math.floor(baseHealth * (1 + currentWave * 0.1));
}

// Create the effect or reuse an existing one from the pool
function createEffect(type, x, y, z, color, size) {
  // Check if we've reached the effect limit - if so, look for an expired effect to reuse
  if (effects.length >= MAX_EFFECTS) {
    // Find the effect with the lowest remaining life to replace
    let lowestLifeIndex = 0;
    let lowestLife = Infinity;

    for (let i = 0; i < effects.length; i++) {
      if (effects[i].life < lowestLife) {
        lowestLife = effects[i].life;
        lowestLifeIndex = i;
      }
    }

    // Update the properties of the reused effect
    effects[lowestLifeIndex] = {
      x: x,
      y: y,
      z: z,
      type: type,
      color: color || [255, 255, 255],
      size: size || 15,
      life: EFFECT_DURATION,
    };

    return;
  }

  // Otherwise create a new effect if we haven't reached the limit
  effects.push({
    x: x,
    y: y,
    z: z,
    type: type,
    color: color || [255, 255, 255],
    size: size || 15,
    life: EFFECT_DURATION,
  });
}

// Simplified effect functions that use the centralized createEffect function
function createExplosion(x, y, z, color) {
  createEffect("explosion", x, y, z, color, 30);
}

function createHitEffect(x, y, z, color, customSize) {
  // Use custom size if provided, otherwise use default size of 15
  const size = customSize || 15;
  createEffect("hit", x, y, z, color, size, EFFECT_DURATION / 2);
}

function createFireEffect(x, y, z) {
  createEffect("fire", x, y, z, null, 20);
}

function createIceEffect(x, y, z) {
  createEffect("ice", x, y, z, null, 20);
}

function createThunderEffect(x, y, z) {
  createEffect("thunder", x, y, z, null, 20);
}

function createVortexEffect(x, y, z) {
  createEffect("vortex", x, y, z, null, 20);
}

function createPlasmaEffect(x, y, z) {
  createEffect("plasma", x, y, z, null, 20);
}

// Calculate dynamic camera zoom based on screen dimensions
function calculateDynamicCameraZoom() {
  // Base the zoom on the screen height to ensure the wall is visible
  const baseZoom = CAMERA_OFFSET_Z;
  const minHeight = 500; // Minimum height reference
  const idealRatio = 16 / 9; // Ideal aspect ratio

  // Get current aspect ratio and orientation
  const currentRatio = windowWidth / windowHeight;
  const isLandscape = windowWidth > windowHeight;

  // Calculate zoom based on screen height and orientation
  let dynamicZoom;

  // For landscape orientation on mobile, use a more aggressive zoom factor
  if (isLandscape && isMobileDevice) {
    // For landscape mobile, we need a much higher zoom factor to see the bridge
    // Start with a base factor that's significantly higher
    const landscapeFactor = 2.2; // Very high zoom for landscape mobile

    // Calculate zoom based on height - shorter heights need more zoom
    if (windowHeight < 400) {
      // Extremely short height (like iPhone SE in landscape)
      dynamicZoom = baseZoom * (landscapeFactor * 1.6);
    } else if (windowHeight < 500) {
      // Very short height (most phones in landscape)
      dynamicZoom = baseZoom * (landscapeFactor * 1.4);
    } else if (windowHeight < 600) {
      // Moderately short height (larger phones in landscape)
      dynamicZoom = baseZoom * (landscapeFactor * 1.2);
    } else {
      // Taller height (tablets in landscape)
      dynamicZoom = baseZoom * landscapeFactor;
    }

    // Additional adjustment for very wide screens
    if (currentRatio > 2.0) {
      // Extra wide screen, increase zoom further
      dynamicZoom *= 1.2;
    }
  }
  // For portrait orientation on mobile
  else if (!isLandscape && isMobileDevice) {
    // For portrait mobile, calculate based on height
    if (windowHeight < minHeight) {
      // Very small heights (unlikely in portrait)
      const heightFactor = minHeight / windowHeight;
      dynamicZoom = baseZoom * heightFactor;
    } else {
      // Normal portrait mode - use height ratio with a minimum
      dynamicZoom = Math.max(baseZoom, windowHeight * CAMERA_ZOOM_HEIGHT_RATIO);

      // For very tall and narrow screens, reduce zoom slightly
      if (currentRatio < 0.5) {
        dynamicZoom *= 0.9;
      }
    }
  }
  // For desktop/non-mobile devices
  else {
    if (windowHeight < minHeight) {
      // Small desktop window
      const heightFactor = minHeight / windowHeight;
      dynamicZoom = baseZoom * heightFactor;
    } else {
      // Normal desktop window
      dynamicZoom = Math.max(baseZoom, windowHeight * CAMERA_ZOOM_HEIGHT_RATIO);

      // Adjust for extreme aspect ratios on desktop
      if (currentRatio > idealRatio * 1.5) {
        // Very wide screen - increase zoom
        dynamicZoom *= 1.2;
      } else if (currentRatio < idealRatio * 0.6) {
        // Very tall screen - decrease zoom slightly
        dynamicZoom *= 0.9;
      }
    }
  }

  // Ensure we have a minimum zoom level to always see the bridge
  const minimumRequiredZoom = 400; // Absolute minimum zoom to see the bridge
  dynamicZoom = Math.max(dynamicZoom, minimumRequiredZoom);

  console.log(
    `Screen: ${windowWidth}x${windowHeight}, Ratio: ${currentRatio.toFixed(
      2
    )}, Landscape: ${isLandscape}, Zoom: ${dynamicZoom.toFixed(2)}`
  );

  return dynamicZoom;
}

// Window resize handling
function windowResized() {
  try {
    // Detect orientation change
    const wasLandscape = width > height;
    const isNowLandscape = windowWidth > windowHeight;
    const orientationChanged = wasLandscape !== isNowLandscape;

    // If this is a mobile device and orientation is changing to landscape,
    // we need special handling to prevent WebGL context issues
    if (isMobileDevice && orientationChanged && isNowLandscape) {
      console.log(
        "Orientation changing to landscape on mobile - using special handling"
      );
    }

    // Resize the canvas
    resizeCanvas(windowWidth, windowHeight);

    // Update perspective for the new aspect ratio - wrap in try/catch to handle WebGL errors
    try {
      perspective(PI / 4, width / height, 0.1, 5000);
    } catch (e) {
      console.warn("Error updating perspective:", e);
    }

    // Update camera zoom based on new dimensions
    cameraZoom = calculateDynamicCameraZoom();

    // If orientation changed on mobile, force a WebGL context reset
    if (isMobileDevice && orientationChanged) {
      // Add a small delay to allow the browser to complete the resize
      setTimeout(() => {
        try {
          // Force WebGL context refresh
          resetMatrix();

          // Re-apply perspective
          try {
            perspective(PI / 4, width / height, 0.1, 5000);
          } catch (e) {
            console.warn(
              "Error re-applying perspective after orientation change:",
              e
            );
          }

          console.log("WebGL context reset after orientation change");
        } catch (e) {
          console.error("Error resetting WebGL context:", e);
        }
      }, 300);
    }

    // Remove existing UI elements to prevent duplicates
    if (controlsContainer) controlsContainer.remove();
    if (skillBar) skillBar.remove();
    if (dPad) dPad.remove();
    if (statusBoard) statusBoard.remove();
    if (techBoard) techBoard.remove();
    if (menuContainer) menuContainer.remove();
    if (pauseContainer) pauseContainer.remove();
    if (resumeContainer) resumeContainer.remove();
    if (gameOverContainer) gameOverContainer.remove();
    if (soundToggleButton) soundToggleButton.remove();
  } catch (e) {
    console.error("Error in windowResized:", e);
  }

  // Recreate all UI elements with the new window dimensions
  createUiUsingDomElements();

  // If the game is playing, make sure controls are visible
  if (gameState === "playing") {
    controlsContainer.style("visibility", "visible");
    controlsContainer.style("opacity", "1");
    skillBar.style("visibility", "visible");
    dPad.style("visibility", "visible");
  }

  // Log resize event for debugging
  console.log("Window resized to: " + windowWidth + "x" + windowHeight);
}

// Directional pad variables
let dPad;
let upButton, downButton, leftButton, rightButton;
let activeDirections = {
  up: false,
  down: false,
  left: false,
  right: false,
};

// Controls container for bottom row layout
let controlsContainer;

// Create container for controls (d-pad and skill bar)
function createControlsContainer() {
  // Create main container
  controlsContainer = createDiv("");
  controlsContainer.id("controls-container");

  const isMobile = windowWidth < 768;

  controlsContainer.style("width", "100%");
  controlsContainer.style("margin", "0 auto"); // Center horizontally
  controlsContainer.style("display", "flex");
  controlsContainer.style("flex-direction", "row");
  controlsContainer.style("align-items", "center");
  controlsContainer.style("justify-content", "space-between"); // Space between d-pad and skill bar
  controlsContainer.style("padding", isMobile ? "5px 0px" : "10px 20px"); // Less padding on mobile
  controlsContainer.style("box-sizing", "border-box");
  controlsContainer.style("z-index", "1500"); // Higher z-index

  // Make sure it's fixed at the bottom of the screen for mobile
  controlsContainer.style("position", "fixed");
  controlsContainer.style("bottom", "0");
  controlsContainer.style("left", "0");

  // Initially hide the container, but make it ready to be shown
  controlsContainer.style("visibility", "hidden");
  controlsContainer.style("opacity", "0");
  controlsContainer.style("transition", "opacity 0.3s ease-in-out");
}

// Helper function to set up event handlers for directional buttons
function setupDirectionalButton(button, direction, visualButton = null) {
  // If visualButton is null, this is a regular button that handles both input and visual feedback
  // If visualButton is provided, this is a touch area that triggers actions on the visual button
  const targetButton = visualButton || button;

  // Mouse down event - start moving in that direction
  button.mousePressed(function () {
    if (gameState === "playing") {
      activeDirections[direction] = true;

      // Visual feedback - only apply to the visual button
      if (visualButton) {
        // If this is a touch area, update the visual button
        visualButton.style("transform", "scale(0.95)");
        visualButton.style("background-color", "rgba(100, 100, 255, 0.9)");
      } else {
        // This is a regular button, update itself
        this.style("transform", "scale(0.95)");
        this.style("background-color", "rgba(100, 100, 255, 0.9)");
      }
    }
  });

  // Mouse up event - stop moving in that direction
  button.mouseReleased(function () {
    activeDirections[direction] = false;

    // Reset visual state
    if (visualButton) {
      visualButton.style("transform", "scale(1.0)");
      visualButton.style("background-color", "rgba(50, 50, 50, 0.27)");
    } else {
      this.style("transform", "scale(1.0)");
      this.style("background-color", "rgba(50, 50, 50, 0.27)");
    }
  });

  // Touch events for mobile
  button.touchStarted(function () {
    if (gameState === "playing") {
      activeDirections[direction] = true;

      // Visual feedback
      if (visualButton) {
        visualButton.style("transform", "scale(0.95)");
        visualButton.style("background-color", "rgba(100, 100, 255, 0.9)");
      } else {
        this.style("transform", "scale(0.95)");
        this.style("background-color", "rgba(100, 100, 255, 0.9)");
      }

      return false; // Prevent default
    }
  });

  button.touchEnded(function () {
    activeDirections[direction] = false;

    // Reset visual state
    if (visualButton) {
      visualButton.style("transform", "scale(1.0)");
      visualButton.style("background-color", "rgba(50, 50, 50, 0.27)");
    } else {
      this.style("transform", "scale(1.0)");
      this.style("background-color", "rgba(50, 50, 50, 0.27)");
    }

    return false; // Prevent default
  });
}

// Update directional pad visibility and apply movement
function updateDirectionalPad() {
  // Show/hide based on game state
  if (gameState === "playing") {
    // Make sure the controls container is visible
    controlsContainer.style("display", "flex");
    controlsContainer.style("visibility", "visible");
    controlsContainer.style("opacity", "1");
    controlsContainer.style("margin", "0 auto");

    // Make sure the D-pad is visible
    dPad.style("visibility", "visible");
    dPad.style("display", "block");

    // Apply movement based on active directions
    if (activeDirections.up) {
      moveSquad(0, -squadSpeed);
    }
    if (activeDirections.down) {
      moveSquad(0, squadSpeed);
    }
    if (activeDirections.left) {
      moveSquad(-squadSpeed, 0);
    }
    if (activeDirections.right) {
      moveSquad(squadSpeed, 0);
    }

    // Debug - log to console once to confirm the function is running
    if (frameCount % 300 === 0) {
      console.log("D-pad should be visible, gameState:", gameState);
    }
  } else {
    controlsContainer.style("visibility", "hidden");
    controlsContainer.style("display", "none");

    // Reset all directions when not playing
    activeDirections.up = false;
    activeDirections.down = false;
    activeDirections.left = false;
    activeDirections.right = false;
  }
}

// Handle window resizing
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Reposition UI elements
  if (controlsContainer) {
    controlsContainer.style("width", "100%");
    controlsContainer.style("margin", "0 auto");
  }

  // Force controls container to be visible if in playing state
  if (gameState === "playing" && controlsContainer) {
    controlsContainer.style("display", "flex");
    controlsContainer.style("visibility", "visible");
    controlsContainer.style("opacity", "1");

    // Log to console for debugging
    console.log("Window resized, controls container repositioned");
  }
}

// Global touch handler to prevent default touch behavior on skill buttons and d-pad
function touchStarted() {
  // Check if the touch is on a skill button or d-pad
  if (gameState === "playing") {
    // Get touch position
    const touchX = touches[0]?.x || mouseX;
    const touchY = touches[0]?.y || mouseY;

    // Check if touch is within skillbar area
    if (skillBar) {
      const skillBarRect = skillBar.elt.getBoundingClientRect();
      if (
        touchX >= skillBarRect.left &&
        touchX <= skillBarRect.right &&
        touchY >= skillBarRect.top &&
        touchY <= skillBarRect.bottom
      ) {
        // Prevent default touch behavior (scrolling, zooming)
        return false;
      }
    }

    // Check if touch is within d-pad area
    if (dPad) {
      const dPadRect = dPad.elt.getBoundingClientRect();
      if (
        touchX >= dPadRect.left &&
        touchX <= dPadRect.right &&
        touchY >= dPadRect.top &&
        touchY <= dPadRect.bottom
      ) {
        // Prevent default touch behavior (scrolling, zooming)
        return false;
      }
    }
  }

  // Allow default touch behavior for other areas
  return true;
}

// Draw a recursive ice pattern (fractal-like)
function drawIcePattern(x, y, size, angle, depth, alpha, color) {
  if (depth <= 0 || size < 5) return;

  // Draw the main branch
  push();
  translate(x, y, 0);
  rotate(angle);

  // Draw the main line
  stroke(color[0], color[1], color[2], alpha);
  line(0, 0, 0, size);

  // Draw branches
  const branchSize = size * 0.6;
  const branchAngle1 = PI / 4; // 45 degrees
  const branchAngle2 = -PI / 4; // -45 degrees

  // Recursive branches
  translate(0, size * 0.7, 0);

  // Right branch
  drawIcePattern(0, 0, branchSize, branchAngle1, depth - 1, alpha * 0.9, color);

  // Left branch
  drawIcePattern(0, 0, branchSize, branchAngle2, depth - 1, alpha * 0.9, color);

  // Optional middle branch (smaller)
  if (random() > 0.5) {
    drawIcePattern(0, 0, branchSize * 0.7, 0, depth - 1, alpha * 0.8, color);
  }

  pop();
}

/**
 * Determines the directions for star blast based on performance level
 * @returns {Array} Array of direction indices
 */
function getStarBlastDirections() {
  const isLowPerformance =
    isMobileDevice || currentPerformanceLevel === PerformanceLevel.LOW;
  const isMediumPerformance =
    currentPerformanceLevel === PerformanceLevel.MEDIUM;

  // 0: right, 1: up-right, 2: up, 3: up-left, 4: left, 5: down-left, 6: down, 7: down-right
  if (isLowPerformance) {
    return [0, 2, 4, 6]; // Only 4 cardinal directions on low performance
  } else if (isMediumPerformance) {
    return [0, 2, 4, 6, 1, 5]; // 6 directions on medium performance
  } else {
    return [0, 1, 2, 3, 4, 5, 6, 7]; // All 8 directions on high performance
  }
}

/**
 * Activates the Star Blast skill
 * Damages enemies in all directions simultaneously for a duration
 */
function activateStarBlastSkill(skill) {
  updateSkillActivation(skill);

  // Performance check
  const isLowPerformance =
    isMobileDevice || currentPerformanceLevel === PerformanceLevel.LOW;
  const isMediumPerformance =
    currentPerformanceLevel === PerformanceLevel.MEDIUM;

  // Calculate damage parameters based on player stats
  const areaDamageRadius = 400 + aoeBoost * 20; // Base radius + bonus from AOE boost
  const areaDamageAmount = 100 + damageBoost * 15; // Base damage + bonus from damage boost
  const starBlastDuration = skill.activeDuration + fireRateBoost * 15; // Duration enhanced by fire rate boost

  // Get squad center position
  const squadCenter = calculateSquadCenter();

  // Get directions based on performance level
  const directions = getStarBlastDirections();

  // Initial star blast
  fireStarBlast(squadCenter, directions, areaDamageRadius, areaDamageAmount);

  // Create initial explosion effect
  createCombatHitEffect(squadCenter, 50, 30, [255, 100, 0]);

  // Calculate periodic blast parameters based on performance
  const blastInterval = isLowPerformance ? 90 : isMediumPerformance ? 60 : 45;
  const maxIntervals = isLowPerformance ? 2 : isMediumPerformance ? 3 : 5;
  const totalIntervals = Math.min(
    maxIntervals,
    Math.floor(starBlastDuration / blastInterval)
  );

  // Store the squad center reference to avoid recalculating in each timeout
  let lastCenter = { ...squadCenter };

  // Schedule periodic star blasts
  for (let i = 1; i <= totalIntervals; i++) {
    setTimeout(() => {
      // Only continue if the skill is still active
      if (skill.active && frameCount < skill.endTime) {
        // Determine whether to recalculate center position
        let currentCenter;

        if (i % 2 === 0 || !isLowPerformance) {
          // Get updated squad center position
          currentCenter = calculateSquadCenter();
          lastCenter = { ...currentCenter };
        } else {
          // Use the last calculated center to save performance
          currentCenter = lastCenter;
        }

        // Fire another star blast with reduced damage
        const reducedDamage = areaDamageAmount * 0.6; // 60% of initial damage
        fireStarBlast(
          currentCenter,
          directions,
          areaDamageRadius,
          reducedDamage
        );

        // Create a smaller explosion effect
        createCombatHitEffect(currentCenter, 30, 20, [255, 100, 0]);
      }
    }, i * blastInterval * (1000 / 60)); // Convert frames to ms
  }

  // Schedule deactivation after duration
  setTimeout(() => {
    // Final star blast when the skill ends
    if (squad.length > 0) {
      // Fire a final star blast with increased damage
      const finalDamage = areaDamageAmount * 1.2; // 120% of initial damage
      fireStarBlast(
        lastCenter,
        directions,
        areaDamageRadius * 1.2,
        finalDamage
      );

      // Create final explosion effect
      createCombatHitEffect(lastCenter, 70, 45, [255, 150, 0]);
    }
  }, starBlastDuration * (1000 / 60)); // Convert frames to ms
}

// Fire a star blast in all 8 directions
function fireStarBlast(center, directions, radius, damageAmount) {
  // Create visual shockwave effects for all 8 directions
  for (let direction of directions) {
    const centerAngle = direction * (Math.PI / 4); // Convert direction to radians
    const angleStart = centerAngle - Math.PI / 8; // 45 degrees to the left of center
    const angleEnd = centerAngle + Math.PI / 8; // 45 degrees to the right of center

    // Create multiple expanding rings for each direction
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        effects.push({
          x: center.x,
          y: center.y,
          z: center.z,
          type: "directionalShockwave",
          size: radius * (0.5 + i * 0.25), // Expanding size for each ring
          life: 60 - i * 15, // Shorter life for later rings
          color: [255, 100, 0], // Red/orange for damage
          layer: i,
          angleStart: angleStart,
          angleEnd: angleEnd,
          direction: direction,
          forceRenderDetail: true,
        });
      }, i * 100 + direction * 50); // Stagger the rings and directions for visual effect
    }
  }

  // Apply damage to enemies in each direction
  let totalEnemiesHit = 0;
  let enemiesHitByDirection = Array(8).fill(0); // Track hits in each direction

  for (let enemy of enemies) {
    // Calculate distance and angle from center to enemy
    const dx = enemy.x - center.x;
    const dy = enemy.y - center.y;
    const dz = enemy.z - center.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Calculate angle to enemy (in radians)
    const angleToEnemy = Math.atan2(dy, dx);

    // Convert angle to 0-2PI range
    const normalizedAngle =
      angleToEnemy < 0 ? angleToEnemy + 2 * Math.PI : angleToEnemy;

    // Find the closest direction (0-7)
    const directionIndex = Math.round(normalizedAngle / (Math.PI / 4)) % 8;

    // Calculate the angular difference between enemy and the closest direction
    const directionAngle = directionIndex * (Math.PI / 4);
    let angleDiff = Math.abs(normalizedAngle - directionAngle);
    if (angleDiff > Math.PI) {
      angleDiff = 2 * Math.PI - angleDiff; // Handle wrap-around
    }

    // Only hit enemies that are within the radius AND within the angular spread of a direction
    // This creates 8 distinct directional blasts rather than a circular area effect
    if (distance < radius && angleDiff < Math.PI / 6) {
      // PI/6 = 30 degrees on each side
      // More damage to closer enemies and those more directly in the path
      const distanceMultiplier = 1 - distance / radius;
      const angleMultiplier = 1 - angleDiff / (Math.PI / 6);
      const damage = damageAmount * distanceMultiplier * angleMultiplier;

      // Apply damage to enemy
      enemy.health -= damage;

      // Create hit effect on enemy
      createHitEffect(enemy.x, enemy.y, enemy.z, [255, 100, 0]);

      // Push enemy away from the center along the direction of the blast
      const pushForce = 25 * distanceMultiplier; // Stronger push for directional effect
      const pushX = Math.cos(directionAngle) * pushForce;
      const pushY = Math.sin(directionAngle) * pushForce;

      enemy.x += pushX;
      enemy.y += pushY;

      totalEnemiesHit++;
      enemiesHitByDirection[directionIndex]++;
    }
  }

  // Add visual feedback based on number of enemies hit in each direction
  for (let i = 0; i < 8; i++) {
    if (enemiesHitByDirection[i] > 0) {
      const directionAngle = i * (Math.PI / 4);

      // Add hit effects in the direction where enemies were hit
      for (let j = 0; j < Math.min(enemiesHitByDirection[i], 3); j++) {
        // Calculate a position along the direction ray
        const distance = radius * (0.3 + j * 0.2); // Space out the hits along the ray
        const hitX = center.x + Math.cos(directionAngle) * distance;
        const hitY = center.y + Math.sin(directionAngle) * distance;

        effects.push({
          x: hitX,
          y: hitY,
          z: center.z + random(30, 70),
          type: "hit",
          size: 15 + j * 5,
          life: 30,
          color: [255, 100, 0],
        });
      }
    }
  }

  return totalEnemiesHit;
}

// Create ice effect on a target
function createIceEffect(x, y, z) {
  // Create ice crystals around the target
  const iceColor = [200, 240, 255];

  // Create a main ice crystal
  effects.push({
    x: x,
    y: y,
    z: z,
    type: "iceCrystal",
    size: 25,
    life: 120,
    color: iceColor,
    growthTime: 10, // Frames to reach full size
    rotationSpeed: random(-0.05, 0.05),
  });

  // Create smaller ice crystals around the main one
  for (let i = 0; i < 5; i++) {
    effects.push({
      x: x + random(-15, 15),
      y: y + random(-15, 15),
      z: z + random(0, 20),
      type: "iceCrystal",
      size: random(5, 15),
      life: random(60, 100),
      color: iceColor,
      growthTime: random(5, 15),
      rotationSpeed: random(-0.1, 0.1),
    });
  }

  // Create a frost burst effect
  effects.push({
    x: x,
    y: y,
    z: z,
    type: "frostBurst",
    size: 30,
    life: 20,
    color: iceColor,
  });
}

/**
 * Activates the Machine Gun skill (Skill 2)
 * Optimized implementation with reduced complexity and improved performance
 */
function activateMachineGunSkill(skill) {
  updateSkillActivation(skill);
  // Store the normal fire rate to restore later
  const normalFireRate = squadFireRate;

  // Set the much faster fire rate (machine gun speed)
  squadFireRate = 5; // Fire every 5 frames instead of 30 (6x faster)

  // Apply visual effects based on performance level
  const isLowPerformance =
    isMobileDevice || currentPerformanceLevel === PerformanceLevel.LOW;
  const maxMembersWithEffects = isLowPerformance
    ? Math.min(3, squad.length)
    : squad.length;

  // Apply effects to limited number of squad members for better performance
  for (let i = 0; i < maxMembersWithEffects; i++) {
    const member = squad[i];
    createHitEffect(member.x, member.y, member.z, [255, 255, 0]);

    // Create persistent effect around each squad member to show machine gun mode
    effects.push({
      x: member.x,
      y: member.y,
      z: member.z,
      type: "machineGun",
      size: member.size * 1.2,
      life: skill.activeDuration,
      member: member, // reference to follow the member
      color: [255, 255, 0], // Yellow for machine gun mode
    });
  }

  // Schedule deactivation after duration
  setTimeout(() => {
    // Only restore fire rate if machine gun mode is still active
    // (prevents conflicts with other skills that might have changed fire rate)
    squadFireRate = normalFireRate;
  }, skill.activeDuration * (1000 / 60)); // Convert frames to ms
}

/**
 * Activates the Shield skill (Skill 3)
 * Optimized implementation with reduced complexity and improved performance
 */
function activateShieldSkill(skill) {
  updateSkillActivation(skill);

  // Calculate shield parameters based on player stats
  const shieldStrength = 100 + damageBoost * 10; // Shield strength enhanced by damage boost
  const shieldDuration = skill.activeDuration + fireRateBoost * 30; // Duration enhanced by fire rate boost
  const shieldRadius = 200 + aoeBoost * 10; // Shield radius enhanced by AOE boost

  // Calculate the center point of the squad for the shield (optimized)
  const shieldCenter = calculateSquadCenter();

  // Create a protective barrier effect that stays around the squad
  effects.push({
    x: shieldCenter.x,
    y: shieldCenter.y,
    z: shieldCenter.z,
    type: "shield", // Changed to "shield" type for consistency with updateEnemies
    size: shieldRadius,
    life: shieldDuration,
    color: [0, 200, 255, 100],
    strength: shieldStrength, // Store shield strength for enemy repulsion
    forceRenderDetail: true,
  });

  // Schedule deactivation after duration
  setTimeout(() => {
    // Final shield collapse effect when the skill ends
    if (squad.length > 0) {
      const finalCenter = calculateSquadCenter();

      // Create shield collapse effect
      effects.push({
        x: finalCenter.x,
        y: finalCenter.y,
        z: finalCenter.z,
        type: "shockwave",
        size: shieldRadius * 0.8,
        life: 45,
        color: [0, 200, 255],
        forceRenderDetail: true,
      });
    }
  }, shieldDuration * (1000 / 60)); // Convert frames to ms
}

/**
 * Activates the Freeze skill (Skill 4)
 * Optimized implementation with reduced complexity and improved performance
 */
function activateFreezeSkill(skill) {
  updateSkillActivation(skill);

  // OPTIMIZATION: Check device performance
  const freezeIsLowPerformance =
    isMobileDevice || currentPerformanceLevel === PerformanceLevel.LOW;
  const freezeIsMediumPerformance =
    currentPerformanceLevel === PerformanceLevel.MEDIUM;

  // Visual effect lasts 2 seconds, enemy freeze effect lasts 5 seconds
  const visualEffectDuration = skill.activeDuration; // 2 seconds (120 frames)
  const enemyFreezeEffectDuration = 300; // 5 seconds (300 frames)
  const freezeStrength = 0.1 - aoeBoost * 0.01; // More slowdown with AOE boost (slower movement, lower is slower)
  // OPTIMIZATION: Reduce radius on low performance devices
  const freezeRadius = freezeIsLowPerformance
    ? 1000
    : freezeIsMediumPerformance
    ? 1250
    : 1500;

  // Calculate the center point of the squad for the freeze effect
  const freezeCenter = calculateSquadCenter();

  // Create visual effects based on performance level
  createFreezeVisualEffects(
    freezeCenter,
    freezeRadius,
    visualEffectDuration,
    freezeIsLowPerformance,
    freezeIsMediumPerformance
  );

  // Apply freeze effect to enemies
  applyFreezeEffectToEnemies(
    freezeCenter,
    freezeRadius,
    enemyFreezeEffectDuration,
    freezeStrength,
    freezeIsLowPerformance,
    freezeIsMediumPerformance
  );

  // OPTIMIZATION: Use frameCount-based deactivation instead of setTimeout
  // This avoids potential issues with setTimeout in p5.js
  // The actual deactivation will happen in the draw loop when frameCount >= skills.skill4.endTime
}

/**
 * Helper function to create freeze visual effects
 */
function createFreezeVisualEffects(
  freezeCenter,
  freezeRadius,
  visualEffectDuration,
  isLowPerformance,
  isMediumPerformance
) {
  // OPTIMIZATION: Limit the number of effects based on performance level

  // 1. Create a single shockwave - essential for visual feedback
  effects.push({
    x: freezeCenter.x,
    y: freezeCenter.y,
    z: freezeCenter.z,
    type: "shockwave",
    size: freezeRadius * 0.5,
    life: 60,
    color: [100, 200, 255], // Ice blue color
    layer: 0,
    forceRenderDetail: true, // Force render this important effect
  });

  // Add additional shockwaves only for medium/high performance
  // OPTIMIZATION: Store delayed effects in an array with their spawn time instead of using setTimeout
  if (!isLowPerformance) {
    // Second shockwave with delay
    effects.push({
      x: freezeCenter.x,
      y: freezeCenter.y,
      z: freezeCenter.z,
      type: "shockwave",
      size: freezeRadius * 0.7,
      life: 50,
      color: [100, 200, 255],
      layer: 1,
      forceRenderDetail: false,
      delayFrames: 6, // Approximately 100ms at 60fps
    });

    // Third shockwave only for high performance
    if (!isMediumPerformance) {
      effects.push({
        x: freezeCenter.x,
        y: freezeCenter.y,
        z: freezeCenter.z,
        type: "shockwave",
        size: freezeRadius * 0.9,
        life: 40,
        color: [100, 200, 255],
        layer: 2,
        forceRenderDetail: false,
        delayFrames: 12, // Approximately 200ms at 60fps
      });
    }
  }

  // 2. Create a single bridge frost effect - always include this as it's the main visual
  effects.push({
    x: freezeCenter.x,
    y: freezeCenter.y,
    z: 0, // At bridge level
    type: "bridgeFrost",
    size: freezeRadius,
    life: visualEffectDuration,
    color: [200, 240, 255, 150], // Light blue with transparency
    forceRenderDetail: true, // Force render this important effect
  });

  // 3. OPTIMIZATION: Skip ice crystal formations on low performance devices
  if (!isLowPerformance) {
    // Create just a few ice crystals on medium performance
    const crystalCount = isMediumPerformance ? 1 : 2; // Reduced count

    for (let i = 0; i < crystalCount; i++) {
      const angle = random(TWO_PI);
      const dist = random(100, 300);
      const x = freezeCenter.x + cos(angle) * dist;
      const y = freezeCenter.y + sin(angle) * dist;

      effects.push({
        x: x,
        y: y,
        z: 0, // At bridge level
        type: "iceCrystal",
        size: random(40, 80),
        life: visualEffectDuration - random(0, 30),
        color: [200, 240, 255, 200],
        growthTime: random(5, 15),
        forceRenderDetail: false,
      });
    }
  }

  // Create a global frost effect (blue tint to the scene) - keep this as it's important for feedback
  effects.push({
    type: "globalFrost",
    life: visualEffectDuration,
    intensity: 0.6 + aoeBoost * 0.03,
    forceRenderDetail: true, // Force render this important effect
  });

  // Add a small screen shake effect for impact (reduced on low performance)
  cameraShake = isLowPerformance ? 1 : isMediumPerformance ? 2 : 3; // Reduced shake intensity
}

/**
 * Helper function to apply freeze effect to enemies
 */
function applyFreezeEffectToEnemies(
  freezeCenter,
  freezeRadius,
  duration,
  freezeStrength,
  isLowPerformance,
  isMediumPerformance
) {
  // OPTIMIZATION: Only affect enemies within the freeze radius
  const freezeRadiusSquared = freezeRadius * freezeRadius;

  // Filter enemies that are within the freeze radius
  const enemiesInRange = enemies.filter((enemy) => {
    const dx = enemy.x - freezeCenter.x;
    const dy = enemy.y - freezeCenter.y;
    const distSquared = dx * dx + dy * dy;
    return distSquared <= freezeRadiusSquared;
  });

  // Sort enemies by distance to prioritize closest ones for visual effects
  const sortedEnemies = [...enemiesInRange].sort((a, b) => {
    const dxA = a.x - freezeCenter.x;
    const dyA = a.y - freezeCenter.y;
    const distA = dxA * dxA + dyA * dyA;

    const dxB = b.x - freezeCenter.x;
    const dyB = b.y - freezeCenter.y;
    const distB = dxB * dxB + dyB * dyB;

    return distA - distB; // Sort by closest first
  });

  // OPTIMIZATION: Limit visual effects to just a few enemies
  const maxEnemiesWithVisuals = isLowPerformance
    ? Math.min(2, sortedEnemies.length) // Only 2 enemies get visuals on low performance
    : isMediumPerformance
    ? Math.min(3, sortedEnemies.length) // Only 3 enemies get visuals on medium performance
    : Math.min(5, sortedEnemies.length); // Only 5 enemies get visuals on high performance

  // OPTIMIZATION: Apply gameplay effect to all enemies at once
  // No batching or timeouts - process all enemies immediately
  for (let i = 0; i < sortedEnemies.length; i++) {
    const enemy = sortedEnemies[i];

    // Store original speed for restoration
    if (!enemy.originalSpeed) {
      enemy.originalSpeed = enemy.speed;
    }

    // Apply freeze effect to enemy
    if (!enemy.effects) enemy.effects = {};
    enemy.effects.frozen = {
      duration: duration,
      slowFactor: max(0.05, freezeStrength),
      originalSpeed: enemy.originalSpeed || enemy.speed,
      // OPTIMIZATION: Flag to control periodic ice effects
      nextIceEffectFrame: frameCount + 60, // First ice effect after 1 second
      iceEffectInterval: isLowPerformance ? 0 : isMediumPerformance ? 90 : 60, // No/less frequent ice effects on low/medium performance
    };

    // Apply slowdown
    enemy.speed =
      enemy.effects.frozen.originalSpeed * enemy.effects.frozen.slowFactor;

    // Only create visual effects for a limited number of enemies
    if (i < maxEnemiesWithVisuals) {
      // Create a single visual effect for each visible enemy
      // OPTIMIZATION: Simplified ice effect for performance
      effects.push({
        x: enemy.x,
        y: enemy.y,
        z: enemy.z,
        type: "iceCrystal",
        size: 25,
        life: 120,
        color: [200, 240, 255],
        growthTime: 10,
      });

      // Add a frost burst effect only for the closest enemies
      if (i < maxEnemiesWithVisuals / 2) {
        effects.push({
          x: enemy.x,
          y: enemy.y,
          z: enemy.z + 20,
          type: "frostBurst",
          size: 30,
          life: 20,
          color: [200, 240, 255],
        });
      }
    }
  }

  // OPTIMIZATION: Skip additional visual effects on low performance devices
  if (!isLowPerformance) {
    // Create a central ice explosion
    effects.push({
      x: freezeCenter.x,
      y: freezeCenter.y,
      z: freezeCenter.z + 50,
      type: "frostBurst",
      size: 80,
      life: 40,
      color: [200, 240, 255],
    });
  }
}

/**
 * Activates the Rejuvenation Field skill (Skill 5)
 * Optimized implementation with reduced complexity and improved performance
 */
function activateRejuvenationSkill(skill) {
  updateSkillActivation(skill);

  // Calculate healing parameters based on player stats
  const initialHealAmount = 30 + damageBoost * 3; // Immediate healing
  const regenAmount = 2 + Math.floor(damageBoost * 0.5); // Health regenerated per tick
  const regenDuration = 60 * 3 + fireRateBoost * 30; // 5 seconds + 0.5s per fire rate boost
  const regenInterval = 30; // Regenerate every 0.5 seconds
  const healRadius = 150 + aoeBoost * 10; // Healing field radius

  // Calculate the center of the squad
  const healCenter = calculateSquadCenter();

  // Create healing field effect
  createHealingFieldEffect(healCenter, healRadius, regenDuration);

  // Apply initial healing and visual effects
  applyInitialHealing(initialHealAmount);

  // Setup regeneration over time
  setupRegenerationOverTime(regenDuration, regenInterval, regenAmount);

  // Create healing shockwaves
  createHealingShockwaves(healCenter, healRadius);
}

/**
 * Helper function to create healing field effect
 */
function createHealingFieldEffect(center, radius, duration) {
  effects.push({
    x: center.x,
    y: center.y,
    z: center.z,
    type: "healingField",
    size: radius,
    life: duration,
    color: [100, 255, 100, 150],
    pulseRate: 0.05,
    forceRenderDetail: true,
  });

  // Create healing particles
  const particleCount = isMobileDevice ? 10 : 20;
  for (let i = 0; i < particleCount; i++) {
    const angle = random(TWO_PI);
    const dist = random(50, radius);
    effects.push({
      x: center.x + cos(angle) * dist,
      y: center.y + sin(angle) * dist,
      z: random(20, 100),
      type: "healParticle",
      size: random(5, 15),
      life: random(60, 120),
      color: [100, 255, 150, 200],
      velocity: { x: random(-1, 1), y: random(-1, 1), z: random(0.5, 2) },
    });
  }
}

/**
 * Helper function to apply initial healing to squad members
 */
function applyInitialHealing(healAmount) {
  for (let member of squad) {
    member.health = min(SQUAD_HEALTH, member.health + healAmount);

    // Create healing effect on each squad member
    effects.push({
      x: member.x,
      y: member.y,
      z: member.z + 20,
      type: "healBurst",
      size: 30,
      life: 45,
      color: [100, 255, 150],
    });
  }
}

/**
 * Helper function to setup regeneration over time
 */
function setupRegenerationOverTime(duration, interval, amount) {
  const totalTicks = Math.floor(duration / interval);
  const isLowPerformance =
    isMobileDevice || currentPerformanceLevel === PerformanceLevel.LOW;

  for (let i = 1; i <= totalTicks; i++) {
    setTimeout(() => {
      // Apply regeneration to all squad members
      for (let member of squad) {
        member.health = min(SQUAD_HEALTH, member.health + amount);

        // Small visual effect for each regen tick - reduced on low performance devices
        if (!isLowPerformance && random() > 0.7) {
          // Only show effect sometimes to avoid too many particles
          effects.push({
            x: member.x + random(-10, 10),
            y: member.y + random(-10, 10),
            z: member.z + random(10, 30),
            type: "healParticle",
            size: random(3, 8),
            life: 30,
            color: [100, 255, 150, 150],
            velocity: { x: 0, y: 0, z: 1 },
          });
        }
      }
    }, i * interval * (1000 / 60)); // Convert frames to ms
  }
}

/**
 * Helper function to create healing shockwaves
 */
function createHealingShockwaves(center, radius) {
  const isLowPerformance =
    isMobileDevice || currentPerformanceLevel === PerformanceLevel.LOW;
  const shockwaveCount = isLowPerformance ? 1 : 3;

  for (let i = 0; i < shockwaveCount; i++) {
    setTimeout(() => {
      effects.push({
        x: center.x,
        y: center.y,
        z: center.z,
        type: "shockwave",
        size: radius * (0.5 + i * 0.25),
        life: 60 - i * 10,
        color: [100, 255, 150],
        layer: i,
        forceRenderDetail: true,
      });
    }, i * 150);
  }
}

/**
 * Activates the Infernal Rage skill (Skill 6)
 * Optimized implementation with reduced complexity and improved performance
 */
function activateInfernalRageSkill(skill) {
  updateSkillActivation(skill);

  // Calculate damage parameters based on player stats
  const damageBoostBase = 2.5; // 2.5x damage (increased from 2x)
  const damageBoostAdditional = 0.3 * damageBoost; // 30% more per damage boost (increased from 20%)
  const damageBoostTotalMultiplier = damageBoostBase + damageBoostAdditional;
  const damageBoostDuration = 60 + fireRateBoost * 60;

  // Count active skills to adjust visual effects
  const rageActiveSkillCount = Object.values(skills).filter(
    (skill) => skill.active
  ).length;

  // Dynamically reduce effects when multiple skills are active
  const rageEffectReduction = Math.max(0.3, 1 - rageActiveSkillCount * 0.25); // Reduce by 25% per active skill, min 30%

  // Calculate the center of the squad
  const infernoSquadCenter = calculateSquadCenter();

  // Create inferno center ahead of the squad (on enemy side)
  const infernoDistance = 800; // Distance ahead of squad
  const infernoRadius = 400 + aoeBoost * 20; // Size of the inferno area
  const infernoCenter = {
    x: infernoSquadCenter.x,
    y: infernoSquadCenter.y - infernoDistance, // Negative Y is forward (toward enemies)
    z: infernoSquadCenter.z,
  };

  // Apply damage boost to squad members
  const originalDamageMultiplier = applyDamageBoostToSquad(
    damageBoostTotalMultiplier
  );

  // Create visual effects for the inferno
  createInfernoVisualEffects(
    infernoCenter,
    infernoRadius,
    damageBoostDuration,
    rageActiveSkillCount,
    rageEffectReduction
  );

  // Setup damage over time to enemies in the inferno area
  const burnInterval = setupInfernoDamageOverTime(
    infernoCenter,
    infernoRadius,
    damageBoostDuration,
    rageActiveSkillCount
  );

  // Reset after duration
  setTimeout(() => {
    // Clear interval (redundant safety check)
    clearInterval(burnInterval);

    // Reset damage multipliers and create end effects
    resetDamageBoostAndCreateEndEffects(
      originalDamageMultiplier,
      infernoCenter,
      infernoRadius
    );
  }, damageBoostDuration * (1000 / 60)); // Convert frames to ms
}

/**
 * Helper function to apply damage boost to squad members
 */
function applyDamageBoostToSquad(multiplier) {
  const originalDamageMultiplier = {};

  // Apply damage boost to each squad member (gameplay effect)
  for (let member of squad) {
    originalDamageMultiplier[member.id] = member.damageBoost || 1;
    member.damageBoost = multiplier;

    // Enhanced bullet damage effect
    member.bulletEffect = "fire";

    // Just a small visual indicator on squad members (minimal)
    effects.push({
      x: member.x,
      y: member.y,
      z: member.z + 20,
      type: "flameBurst",
      size: 30,
      life: 45,
      color: [255, 100, 0],
    });
  }

  return originalDamageMultiplier;
}

/**
 * Helper function to create visual effects for the inferno
 */
function createInfernoVisualEffects(
  center,
  radius,
  duration,
  activeSkillCount,
  effectReduction
) {
  // Create initial massive explosion at inferno center - always include this as it's the main visual
  effects.push({
    x: center.x,
    y: center.y,
    z: center.z,
    type: "rageExplosion",
    size: 200,
    life: 90,
    color: [255, 50, 0],
    forceRenderDetail: false, // Never force render when optimizing
  });

  // Create expanding fire shockwaves - reduce count when multiple skills active
  const shockwaveCount = activeSkillCount > 1 ? 2 : 5; // Fewer shockwaves when skills active
  for (let i = 0; i < shockwaveCount; i++) {
    setTimeout(() => {
      effects.push({
        x: center.x,
        y: center.y,
        z: center.z,
        type: "shockwave",
        size: radius * (0.5 + i * 0.2),
        life: 60 - i * 5,
        color: [255, 50, 0],
        layer: i,
        forceRenderDetail: false, // Never force render when optimizing
      });
    }, i * 150);
  }

  // Create persistent inferno field effect - always include this as it's the main visual
  effects.push({
    x: center.x,
    y: center.y,
    z: 0, // At ground level
    type: "infernoField",
    size: radius,
    life: duration,
    color: [255, 50, 0, 150],
    pulseRate: 0.05,
    forceRenderDetail: false, // Never force render when optimizing
  });

  // Create burning bridge effect - multiple fire patches on the bridge
  // Reduce count when multiple skills active
  const firePatchCount = Math.floor(
    (15 + Math.floor(aoeBoost / 2)) * effectReduction
  );
  for (let i = 0; i < firePatchCount; i++) {
    const angle = random(TWO_PI);
    const dist = random(50, radius * 0.9);
    const x = center.x + cos(angle) * dist;
    const y = center.y + sin(angle) * dist;

    effects.push({
      x: x,
      y: y,
      z: 0, // At bridge level
      type: "firePatch",
      size: random(50, 100),
      life: duration,
      color: [255, 50, 0, 200],
      pulseRate: random(0.03, 0.08),
      forceRenderDetail: false, // Never force render when optimizing
    });
  }

  // Create a global fire effect (red tint to the scene) - always include this as it's important
  effects.push({
    type: "globalFire",
    life: duration,
    intensity: 0.3 + damageBoost * 0.02, // Stronger effect with damage boost
    forceRenderDetail: false, // Never force render when optimizing
  });

  // Add screen shake for impact
  cameraShake = 8;
}

/**
 * Helper function to setup damage over time to enemies in the inferno area
 */
function setupInfernoDamageOverTime(
  center,
  radius,
  duration,
  activeSkillCount
) {
  const burnDamage = 5 + damageBoost * 2; // Base damage per tick

  // Create interval to damage enemies in the inferno area
  const burnInterval = setInterval(() => {
    // Check if effect is still active
    if (frameCount > skills[SkillName.INFERNAL_RAGE].lastUsed + duration) {
      clearInterval(burnInterval);
      return;
    }

    // Apply damage to enemies in the inferno area
    // Sort enemies by distance to prioritize closest ones for visual effects
    const enemiesInRange = enemies
      .filter((enemy) => {
        const dx = enemy.x - center.x;
        const dy = enemy.y - center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < radius;
      })
      .sort((a, b) => {
        const dxA = a.x - center.x;
        const dyA = a.y - center.y;
        const distA = dxA * dxA + dyA * dyA;

        const dxB = b.x - center.x;
        const dyB = b.y - center.y;
        const distB = dxB * dxB + dyB * dyB;

        return distA - distB; // Sort by closest first
      });

    // Limit visual effects when multiple skills active
    const maxEnemiesWithVisuals =
      activeSkillCount > 1
        ? Math.floor(enemiesInRange.length * 0.3) // Only 30% of enemies get visuals when multiple skills active
        : enemiesInRange.length;

    for (let i = 0; i < enemiesInRange.length; i++) {
      const enemy = enemiesInRange[i];
      const dx = enemy.x - center.x;
      const dy = enemy.y - center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Apply burn damage with falloff based on distance
      const damageMultiplier = 1 - (distance / radius) * 0.7; // At least 30% damage at edges
      enemy.health -= burnDamage * damageMultiplier;

      // Create burn effect on enemy - only for closest enemies when multiple skills active
      if (
        i < maxEnemiesWithVisuals &&
        random() > (activeSkillCount > 1 ? 0.7 : 0.5)
      ) {
        effects.push({
          x: enemy.x,
          y: enemy.y,
          z: enemy.z + random(10, 30),
          type: "flameBurst",
          size: random(15, 25),
          life: random(20, 40),
          color: [255, 50 + random(0, 50), 0],
        });
      }
    }
  }, 500); // Check every 0.5 seconds

  // Add periodic flame bursts throughout the duration - reduce frequency when multiple skills active
  const burstInterval = activeSkillCount > 1 ? 120 : 60; // Every 1-2 seconds depending on active skills
  const totalBursts = Math.floor(duration / burstInterval);

  for (let i = 1; i <= totalBursts; i++) {
    setTimeout(() => {
      // Only create effects if skill is still active
      if (frameCount < skills[SkillName.INFERNAL_RAGE].lastUsed + duration) {
        // Create fewer flame eruptions when multiple skills active
        const eruptions =
          activeSkillCount > 1
            ? Math.floor(random(1, 3)) // 1-2 eruptions when multiple skills active
            : Math.floor(random(3, 6)); // 3-5 eruptions normally

        for (let j = 0; j < eruptions; j++) {
          const angle = random(TWO_PI);
          const dist = random(0, radius * 0.9);
          const x = center.x + cos(angle) * dist;
          const y = center.y + sin(angle) * dist;

          // Create flame eruption
          effects.push({
            x: x,
            y: y,
            z: 0, // Start at ground level
            type: "flameEruption",
            size: random(40, 80),
            life: random(45, 75),
            color: [255, 50 + random(0, 50), 0],
            velocity: { x: 0, y: 0, z: random(2, 5) },
          });

          // Add floating damage symbols - only if not too many skills active
          if (activeSkillCount < 2 && random() > 0.7) {
            effects.push({
              x: x + random(-20, 20),
              y: y + random(-20, 20),
              z: random(30, 70),
              type: "damageSymbol",
              size: random(15, 25),
              life: random(60, 90),
              color: [255, 50, 0, 200],
              velocity: {
                x: random(-0.5, 0.5),
                y: random(-0.5, 0.5),
                z: random(1, 2),
              },
            });
          }
        }
      }
    }, i * burstInterval * (1000 / 60)); // Convert frames to ms
  }

  return burnInterval;
}

/**
 * Helper function to reset damage boost and create end effects
 */
function resetDamageBoostAndCreateEndEffects(
  originalMultipliers,
  center,
  radius
) {
  // Reset damage multipliers
  for (let member of squad) {
    if (member && originalMultipliers[member.id]) {
      member.damageBoost = originalMultipliers[member.id];
    } else if (member) {
      member.damageBoost = 1;
    }

    // Remove bullet effect
    member.bulletEffect = null;
  }

  // Create final explosion when inferno dissipates
  effects.push({
    x: center.x,
    y: center.y,
    z: center.z,
    type: "rageExplosion",
    size: 150,
    life: 60,
    color: [255, 100, 0],
    forceRenderDetail: true,
  });

  // Add smoke aftermath
  const smokeCount = isMobileDevice ? 5 : 10;
  for (let i = 0; i < smokeCount; i++) {
    const angle = random(TWO_PI);
    const dist = random(50, radius * 0.8);
    const x = center.x + cos(angle) * dist;
    const y = center.y + sin(angle) * dist;

    effects.push({
      x: x,
      y: y,
      z: random(10, 50),
      type: "smoke",
      size: random(50, 100),
      life: random(120, 240),
      color: [100, 100, 100, 150],
      velocity: {
        x: random(-0.2, 0.2),
        y: random(-0.2, 0.2),
        z: random(0.5, 1),
      },
    });
  }
}

/**
 * Activates the Quantum Acceleration skill (Skill 7)
 * Optimized implementation with reduced complexity and improved performance
 */
function activateQuantumAccelerationSkill(skill) {
  updateSkillActivation(skill);
  // Calculate speed parameters based on player stats
  const baseSpeedBoost = 1.8; // 80% faster
  const additionalSpeedBoost = 0.15 * fireRateBoost; // 15% more per fire rate boost
  const totalSpeedMultiplier = baseSpeedBoost + additionalSpeedBoost;
  const speedBoostDuration = 480 + fireRateBoost * 30; // 8s + 0.5s per fire rate

  // Calculate the center of the squad (only once)
  const accelCenter = calculateSquadCenter();

  // OPTIMIZATION: Reduce visual effects based on device
  const isLowPerformance =
    isMobileDevice || currentPerformanceLevel === PerformanceLevel.LOW;
  const isMediumPerformance =
    currentPerformanceLevel === PerformanceLevel.MEDIUM;

  // Create visual effects
  createAccelerationVisualEffects(
    accelCenter,
    speedBoostDuration,
    isLowPerformance,
    isMediumPerformance
  );

  // Store old speed and apply speed boost
  const oldSpeed = squadSpeed;
  squadSpeed *= totalSpeedMultiplier;

  // Reset after duration
  setTimeout(() => {
    squadSpeed = oldSpeed;

    // OPTIMIZATION: Create just one final effect at squad center
    effects.push({
      x: accelCenter.x,
      y: accelCenter.y,
      z: accelCenter.z + 20,
      type: "speedBurst",
      size: 40,
      life: 30,
      color: [0, 200, 255],
    });
  }, speedBoostDuration * (1000 / 60)); // Convert frames to ms
}

/**
 * Helper function to create visual effects for acceleration
 */
function createAccelerationVisualEffects(
  center,
  duration,
  isLowPerformance,
  isMediumPerformance
) {
  // Create a single initial effect instead of multiple
  effects.push({
    x: center.x,
    y: center.y,
    z: center.z,
    type: "accelerationBurst",
    size: 120,
    life: 60,
    color: [0, 200, 255],
    forceRenderDetail: false, // OPTIMIZATION: Remove forced detail
  });

  // Create simplified shockwave (no setTimeout for better performance)
  effects.push({
    x: center.x,
    y: center.y,
    z: center.z,
    type: "shockwave",
    size: 200,
    life: 45,
    color: [0, 200, 255],
    layer: 0,
    forceRenderDetail: false, // OPTIMIZATION: Remove forced detail
  });

  // OPTIMIZATION: Apply visual effects to limited number of squad members
  const maxMembersWithEffects = isLowPerformance
    ? 3
    : isMediumPerformance
    ? 5
    : squad.length;
  const membersToShow = squad.slice(0, maxMembersWithEffects);

  // Apply effect to limited number of squad members
  for (let member of membersToShow) {
    // OPTIMIZATION: Only create one effect per member
    effects.push({
      x: member.x,
      y: member.y,
      z: member.z,
      type: "speedAura",
      size: 30,
      life: duration,
      color: [0, 200, 255],
      member: member, // Reference to follow the member
      forceRenderDetail: false, // OPTIMIZATION: Remove forced detail
    });
  }

  // OPTIMIZATION: Remove periodic bursts on mobile, reduce on medium
  if (!isLowPerformance) {
    // Add just a few periodic bursts (not every second)
    const burstCount = isMediumPerformance ? 2 : 4;
    const interval = duration / burstCount;

    for (let i = 1; i <= burstCount; i++) {
      setTimeout(() => {
        if (
          frameCount <
          skills[SkillName.QUANTUM_ACCELERATION].lastUsed + duration
        ) {
          // Create just one burst at squad center instead of for each member
          effects.push({
            x: center.x,
            y: center.y,
            z: center.z + 10,
            type: "speedBurst",
            size: 25,
            life: 30,
            color: [0, 200, 255],
          });
        }
      }, i * interval * (1000 / 60));
    }
  }

  // Create a global time dilation effect (cyan tint to the scene)
  // Keep this as it's an important visual indicator of the skill
  effects.push({
    type: "globalTimeDilation",
    life: duration,
    intensity: 0.2 + fireRateBoost * 0.01,
    forceRenderDetail: false, // OPTIMIZATION: Remove forced detail
  });

  // Add screen shake for impact (reduced)
  cameraShake = isLowPerformance ? 2 : 4;
}

/**
 * Helper function to calculate the center point of the squad
 * Used by multiple skills to avoid code duplication
 */
function calculateSquadCenter() {
  const center = { x: 0, y: 0, z: 0 };
  if (squad.length > 0) {
    let totalX = 0,
      totalY = 0,
      totalZ = 0;
    for (let member of squad) {
      totalX += member.x;
      totalY += member.y;
      totalZ += member.z;
    }
    center.x = totalX / squad.length;
    center.y = totalY / squad.length;
    center.z = totalZ / squad.length;
  }
  return center;
}

// Define color palette based on skill index
function generateSkillColors(index) {
  // Use the golden ratio to create visually distinct colors
  const hue = ((index * 137.5) % 360) / 360;

  // Convert HSV to RGB for primary color (more saturated)
  const primary = hsvToRgb(hue, 0.7, 0.85);

  // Secondary color is brighter version of primary
  const secondary = hsvToRgb(hue, 0.6, 1.0);

  // Key color is a light pastel version for UI highlights
  const keyR = Math.round(secondary[0] * 0.3 + 180);
  const keyG = Math.round(secondary[1] * 0.3 + 180);
  const keyB = Math.round(secondary[2] * 0.3 + 180);

  return {
    primary,
    secondary,
    keyColor: `rgba(${keyR}, ${keyG}, ${keyB}, 1.0)`,
  };
}

// Helper function to convert HSV to RGB
function hsvToRgb(h, s, v) {
  let r, g, b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
