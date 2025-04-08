// Sound Manager for Squad Survival
// Handles loading, playing, and managing all game sounds

// Skill name constants (duplicated from squad.js for sound system)
const SkillName = {
  STAR_BLAST: "STAR_BLAST",
  MACHINE_GUN: "MACHINE_GUN",
  SHIELD: "SHIELD",
  FREEZE: "FREEZE",
  REJUVENATION: "REJUVENATION",
  INFERNAL_RAGE: "INFERNAL_RAGE",
  QUANTUM_ACCELERATION: "QUANTUM_ACCELERATION",
  APOCALYPTIC_DEVASTATION: "APOCALYPTIC_DEVASTATION",
  BARRIER: "BARRIER"
};

// Mapping of skill numbers to names for backward compatibility
const skillNumberToName = {
  1: SkillName.STAR_BLAST,
  2: SkillName.MACHINE_GUN,
  3: SkillName.SHIELD,
  4: SkillName.FREEZE,
  5: SkillName.REJUVENATION,
  6: SkillName.INFERNAL_RAGE,
  7: SkillName.QUANTUM_ACCELERATION,
  8: SkillName.APOCALYPTIC_DEVASTATION,
  9: SkillName.BARRIER
};

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
  
  // Skill sounds
  skills: {
    skill1: null, // Rapid Fire
    skill2: null, // Scatter Shot
    skill3: null, // Orbital Strike
    skill4: null, // Cryo Freeze
    skill5: null, // Rejuvenation Field
    skill6: null, // Infernal Rage
    skill7: null, // Quantum Acceleration
    skill8: null, // Apocalyptic Devastation
  },
  
  // Environment sounds
  environment: {
    wind: true,
  },
  
  // Power-up sounds
  powerups: {
    collect: null,
    spawn: null,
  }
};

// Sound settings
let soundSettings = {
  masterVolume: 0.5,
  musicVolume: 0.05, // Reduced background music volume
  sfxVolume: 0.8,
  uiVolume: 0.6,
  combatVolume: {
    shoot: 0.1, // Reduced shoot sound to 1/3 of original volume
    hit: 0.5,
    explosion: 1.0,
    death: 1.0,
    criticalHit: 0.5
  },
  skillVolume: {
    skill1: 0.4, // Auto-fire skill - lower volume
    skill2: 0.8, // Scatter shot - normal volume
    skill3: 0.8, // Orbital strike - normal volume
    skill4: 2.4, // Freeze - much higher volume (3x)
    skill5: 0.8, // Normal volume for other skills
    skill6: 0.8,
    skill7: 0.8,
    skill8: 0.8,
    skill9: 0.8  // Barrier - normal volume
  },
  muted: false, // Sound off by default
  currentMusic: null,
  
  // Sound optimization settings
  maxConcurrentSounds: 8,       // Maximum number of sounds that can play simultaneously
  soundPriority: {              // Priority levels for different sound types (higher = more important)
    ui: 10,                     // UI sounds are highest priority
    skills: 8,                  // Skill sounds are high priority
    death: 7,                   // Death sounds are important
    criticalHit: 6,             // Critical hits are somewhat important
    explosion: 5,               // Explosions are medium priority
    hit: 3,                     // Regular hits are lower priority
    shoot: 2,                   // Shoot sounds are low priority
    environment: 1              // Environment sounds are lowest priority
  },
  soundCooldowns: {             // Minimum time (ms) between playing the same sound type
    shoot: 50,                  // Don't play shoot sounds more than once per 50ms
    hit: 80,                    // Don't play hit sounds more than once per 80ms
    criticalHit: 150            // Don't play critical hit sounds more than once per 150ms
  },
  batchSounds: true,            // Whether to batch similar sounds together
  dynamicCulling: true          // Whether to dynamically reduce sounds based on game performance
};

// Preload all sounds
function preloadSounds() {
  try {
    // Check if p5.sound is available
    if (typeof p5 === 'undefined' || !p5.prototype.hasOwnProperty('loadSound')) {
      console.warn("p5.sound library not available. Sound loading skipped.");
      return;
    }

    // Helper function to safely load sounds
    const safeLoadSound = (path) => {
      try {
        return loadSound(path,
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
    sounds.music.main = safeLoadSound('sounds/music/main_theme.mp3');

    // UI sounds
    sounds.ui.click = safeLoadSound('sounds/ui/click.mp3');
    sounds.ui.hover = safeLoadSound('sounds/ui/hover.mp3');
    sounds.ui.upgrade = safeLoadSound('sounds/ui/upgrade.mp3');
    sounds.ui.error = safeLoadSound('sounds/ui/error.mp3');
    sounds.ui.levelUp = safeLoadSound('sounds/ui/level_up.mp3');

    // Combat sounds
    sounds.combat.shoot = safeLoadSound('sounds/combat/shoot.mp3');
    sounds.combat.hit = safeLoadSound('sounds/combat/hit.mp3');
    sounds.combat.explosion = safeLoadSound('sounds/combat/explosion.mp3');
    sounds.combat.death = safeLoadSound('sounds/combat/death.mp3');
    sounds.combat.criticalHit = safeLoadSound('sounds/combat/critical_hit.mp3');

    // Skill sounds
    sounds.skills.skill1 = safeLoadSound('sounds/skills/rapid_fire.mp3');
    sounds.skills.skill2 = safeLoadSound('sounds/skills/scatter_shot.mp3');
    sounds.skills.skill3 = safeLoadSound('sounds/skills/heavy_strike.mp3');
    sounds.skills.skill4 = safeLoadSound('sounds/skills/cryo_freeze.mp3');
    sounds.skills.skill5 = safeLoadSound('sounds/skills/rejuvenation.mp3');
    sounds.skills.skill6 = safeLoadSound('sounds/skills/infernal_rage.mp3');
    sounds.skills.skill7 = safeLoadSound('sounds/skills/quantum_acceleration.mp3');
    sounds.skills.skill8 = safeLoadSound('sounds/skills/apocalypse.mp3');
    sounds.skills.skill9 = safeLoadSound('sounds/skills/barrier.mp3');

    // Environment sounds
    sounds.environment.wind = safeLoadSound('sounds/environment/wind.mp3');

    // Power-up sounds
    sounds.powerups.collect = safeLoadSound('sounds/powerups/collect.mp3');
    sounds.powerups.spawn = safeLoadSound('sounds/powerups/spawn.mp3');

    console.log("Sound preloading completed");
  } catch (e) {
    console.error("Error in preloadSounds:", e);
  }
}

// Flag to track if sound system has been initialized
let soundSystemInitialized = false;

// Sound manager for tracking and optimizing sound playback
const soundManager = {
  activeSounds: [],           // Currently playing sounds
  lastPlayedTime: {},         // Last time each sound type was played
  soundsThisFrame: {},        // Sounds requested this frame (for batching)
  frameStartTime: 0,          // Start time of current frame
  
  // Initialize the sound manager
  init() {
    this.activeSounds = [];
    this.lastPlayedTime = {};
    this.frameStartTime = millis();
    this.soundsThisFrame = {};
    
    // Set up performance monitoring
    this.frameRates = [];
    this.lastFrameTime = millis();
    this.performanceIssue = false;
  },
  
  // Start a new frame
  startFrame() {
    // Calculate frame rate and detect performance issues
    const currentTime = millis();
    const frameDelta = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    // Track frame rates for the last 10 frames
    if (frameDelta > 0) {
      const fps = 1000 / frameDelta;
      this.frameRates.push(fps);
      if (this.frameRates.length > 10) {
        this.frameRates.shift();
      }
      
      // Check if we're experiencing performance issues
      if (this.frameRates.length >= 5) {
        const avgFps = this.frameRates.reduce((sum, fps) => sum + fps, 0) / this.frameRates.length;
        this.performanceIssue = avgFps < 30; // Consider it a performance issue if below 30 FPS
      }
    }
    
    this.frameStartTime = currentTime;
    this.soundsThisFrame = {};
  },
  
  // End the current frame and process batched sounds
  endFrame() {
    if (!soundSettings.batchSounds) return;
    
    // Process batched sounds
    Object.keys(this.soundsThisFrame).forEach(soundKey => {
      const batch = this.soundsThisFrame[soundKey];
      if (batch.count > 0) {
        // For batched sounds, we play one instance with adjusted volume
        const volumeMultiplier = Math.min(1.5, 1 + Math.log10(batch.count) * 0.3);
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
      soundType
    });
    
    // Clean up finished sounds
    this.cleanupFinishedSounds();
  },
  
  // Request to play a sound (may be batched)
  requestSound(sound, volume, rate, pan, soundType, priority, batchKey) {
    if (!sound || soundSettings.muted) return;
    
    // If batching is enabled and this sound type can be batched
    if (soundSettings.batchSounds && batchKey && 
        (soundType === 'hit' || soundType === 'shoot')) {
      
      // Create or update batch
      if (!this.soundsThisFrame[batchKey]) {
        this.soundsThisFrame[batchKey] = {
          sound,
          volume,
          rate,
          pan,
          count: 0,
          priority
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
    this.activeSounds = this.activeSounds.filter(activeSound => {
      // Remove sounds that have been playing for more than 5 seconds
      if (currentTime - activeSound.startTime > 5000) {
        return false;
      }
      
      // Remove sounds that are no longer playing
      if (activeSound.sound && 
          activeSound.sound.isPlaying && 
          !activeSound.sound.isPlaying()) {
        return false;
      }
      
      return true;
    });
  }
};

// Initialize sound system - only call this after user interaction
function initSounds() {
  // If already initialized, don't do it again
  if (soundSystemInitialized) return;

  try {
    console.log("Initializing sound system after user interaction");

    // Check if p5.sound is available by testing if a sound object has the necessary methods
    const soundAvailable = sounds.music.main &&
                          typeof sounds.music.main.setVolume === 'function' &&
                          typeof sounds.music.main.play === 'function';

    if (soundAvailable) {
      // Resume AudioContext if it exists
      if (typeof getAudioContext === 'function') {
        try {
          const audioContext = getAudioContext();
          if (audioContext && audioContext.state !== 'running') {
            audioContext.resume().then(() => {
              console.log("AudioContext resumed successfully");
            }).catch(err => {
              console.warn("Error resuming AudioContext:", err);
            });
          }
        } catch (e) {
          console.warn("Error accessing AudioContext:", e);
        }
      }

      // Set master volume if the function exists
      if (typeof masterVolume === 'function') {
        masterVolume(soundSettings.masterVolume);
      }

      // Set individual volumes for music
      Object.values(sounds.music).forEach(sound => {
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

// Play a sound with specified volume and optional rate/pan
function playSound(sound, volume = 1.0, rate = 1.0, pan = 0, soundType = 'generic', priority = 1) {
  try {
    // Check if sound is available and not muted
    if (!sound || soundSettings.muted) return;

    // Check if the sound object has the necessary methods
    if (!sound.play || !sound.setVolume) {
      console.warn("Sound object is missing required methods. Skipping playback.");
      return;
    }

    // Calculate final volume based on master volume
    const finalVolume = volume * soundSettings.masterVolume;
    
    // Use the sound manager to handle this sound request
    soundManager.requestSound(sound, finalVolume, rate, pan, soundType, priority);
  } catch (e) {
    console.warn("Error playing sound:", e);
  }
}

// Play UI sound
function playUISound(soundName) {
  if (sounds.ui[soundName]) {
    // UI sounds have high priority
    const priority = soundSettings.soundPriority.ui || 10;
    playSound(sounds.ui[soundName], soundSettings.uiVolume, 1.0, 0, 'ui', priority);
  }
}

// Play combat sound with optional position-based panning
function playCombatSound(soundName, x = 0, y = 0, volume = 1.0) {
  if (sounds.combat[soundName]) {
    // Calculate pan based on x position relative to screen center
    const screenCenterX = width / 2;
    const pan = constrain((x - screenCenterX) / (screenCenterX), -1, 1) * 0.7;

    // Calculate volume falloff based on distance from camera
    const distanceFromCamera = abs(y - cameraOffsetY) / height;
    const distanceVolume = constrain(1 - distanceFromCamera * 0.5, 0.3, 1);

    // Use specific combat volume if available, otherwise use default sfx volume
    const combatVolumeMultiplier = soundSettings.combatVolume && soundSettings.combatVolume[soundName]
      ? soundSettings.combatVolume[soundName]
      : 1.0;
    
    // Get priority for this sound type
    const priority = soundSettings.soundPriority[soundName] || 
                    (soundName === 'criticalHit' ? 6 : 
                     soundName === 'explosion' ? 5 : 
                     soundName === 'hit' ? 3 : 
                     soundName === 'shoot' ? 2 : 4);
    
    // For sounds that can be batched, create a batch key
    const batchKey = (soundName === 'hit' || soundName === 'shoot') ? 
                     `${soundName}_${Math.floor(x/100)}_${Math.floor(y/100)}` : null;
    
    // Calculate final volume
    const finalVolume = soundSettings.sfxVolume * combatVolumeMultiplier * volume * distanceVolume;
    
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

// Play skill sound
function playSkillSound(skillNameOrNumber) {
  let skillNumber;
  
  // Handle different input types
  if (typeof skillNameOrNumber === 'number') {
    // It's already a number
    skillNumber = skillNameOrNumber;
  } else if (typeof skillNameOrNumber === 'string') {
    if (skillNameOrNumber.startsWith('skill')) {
      // It's in the format 'skill1', 'skill2', etc.
      skillNumber = parseInt(skillNameOrNumber.replace('skill', ''));
    } else {
      // It's a skill name constant, find the corresponding number
      for (const [num, name] of Object.entries(skillNumberToName)) {
        if (name === skillNameOrNumber) {
          skillNumber = parseInt(num);
          break;
        }
      }
    }
  }
  
  // If we couldn't determine the skill number, return
  if (!skillNumber) return;
  
  const skillSoundKey = `skill${skillNumber}`;
  if (sounds.skills[skillSoundKey]) {
    // Use specific skill volume if available, otherwise use default sfx volume
    const volume = soundSettings.skillVolume && soundSettings.skillVolume[skillSoundKey]
      ? soundSettings.skillVolume[skillSoundKey]
      : soundSettings.sfxVolume;
    
    // Skills have high priority
    const priority = soundSettings.soundPriority.skills || 8;
    
    playSound(sounds.skills[skillSoundKey], volume, 1.0, 0, 'skill', priority);
  }
}

// Play background music with crossfade
function playMusic(musicName, fadeTime = 2.0) {
  try {
    // Check if sound system is initialized
    if (!soundSystemInitialized) {
      // Just store the music name for later when sound is initialized
      soundSettings.currentMusic = musicName;
      console.log(`Sound system not initialized yet. Storing music name: ${musicName}`);
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
    if (!sounds.music[musicName].isPlaying || !sounds.music[musicName].setVolume || !sounds.music[musicName].loop) {
      console.warn(`Music ${musicName} is missing required methods. Skipping playback.`);
      return;
    }

    // If same music is already playing, do nothing
    if (sounds.music[musicName].isPlaying && sounds.music[musicName].isPlaying()) {
      return;
    }

    // Fade out current music if playing
    if (soundSettings.currentMusic &&
        sounds.music[soundSettings.currentMusic] &&
        sounds.music[soundSettings.currentMusic].isPlaying &&
        sounds.music[soundSettings.currentMusic].isPlaying() &&
        soundSettings.currentMusic !== musicName) {

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
          sounds.music[musicName].setVolume(soundSettings.musicVolume * progress);
        }
      }, 50);
    }

    console.log(`Now playing: ${musicName}`);
  } catch (e) {
    console.error(`Error playing music ${musicName}:`, e);
  }
}

// Stop all sounds
function stopAllSounds() {
  // Stop all music
  Object.values(sounds.music).forEach(sound => {
    if (sound && sound.isPlaying()) sound.stop();
  });

  // Stop all environment sounds
  Object.values(sounds.environment).forEach(sound => {
    if (sound && sound.isPlaying()) sound.stop();
  });

  // Stop all combat sounds
  Object.values(sounds.combat).forEach(sound => {
    if (sound && sound.isPlaying()) sound.stop();
  });

  // Stop all skill sounds
  Object.values(sounds.skills).forEach(sound => {
    if (sound && sound.isPlaying()) sound.stop();
  });

  // Stop all UI sounds
  Object.values(sounds.ui).forEach(sound => {
    if (sound && sound.isPlaying()) sound.stop();
  });

  // Stop all powerup sounds
  Object.values(sounds.powerups).forEach(sound => {
    if (sound && sound.isPlaying()) sound.stop();
  });

  soundSettings.currentMusic = null;
}

// Toggle mute all sounds
function toggleMute() {
  soundSettings.muted = !soundSettings.muted;

  try {
    // Check if p5.sound is available
    if (typeof p5 !== 'undefined' && p5.prototype.hasOwnProperty('masterVolume')) {
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
          playMusic('main', 0.5);
        }
      }
    } else {
      console.warn("p5.sound library not fully loaded. Mute state changed but volume control unavailable.");
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
    if (typeof p5 !== 'undefined' && p5.prototype.hasOwnProperty('masterVolume')) {
      masterVolume(soundSettings.masterVolume);
    } else {
      console.warn("p5.sound library not fully loaded. Volume change requested but unavailable.");
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
    sounds.music[soundSettings.currentMusic].setVolume(soundSettings.musicVolume);
  }
}

// Set SFX volume
function setSFXVolume(volume) {
  soundSettings.sfxVolume = constrain(volume, 0, 1);
}

// Play ambient sounds based on game state
function updateAmbientSounds() {
  // Only play ambient sounds if not muted
  if (soundSettings.muted) {
    // If muted, make sure ambient sounds are paused
    if (sounds.environment.wind && sounds.environment.wind.isPlaying && sounds.environment.wind.isPlaying()) {
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

// Play random hit sound with variation
function playRandomHitSound(x, y, isCritical = false) {
  // Start a new sound frame to track batched sounds
  soundManager.startFrame();
  
  if (isCritical) {
    playCombatSound('criticalHit', x, y, 1.0);
  } else {
    // For regular hits, randomize volume slightly
    const hitVolume = random(0.8, 1.0);
    
    // For regular hits, we'll use the sound manager's batching system
    // The rate will be set in the playCombatSound function
    playCombatSound('hit', x, y, hitVolume);
    
    // We don't need to set the rate directly anymore as the sound manager handles it
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
  const priority = soundSettings.soundPriority.explosion + 
                  (size > 2.0 ? 2 : size > 1.0 ? 1 : 0);
  
  // Use the sound manager to play the explosion sound
  if (sounds.combat.explosion) {
    // Calculate pan based on x position
    const screenCenterX = width / 2;
    const pan = constrain((x - screenCenterX) / (screenCenterX), -1, 1) * 0.7;
    
    // Calculate volume falloff based on distance
    const distanceFromCamera = abs(y - cameraOffsetY) / height;
    const distanceVolume = constrain(1 - distanceFromCamera * 0.5, 0.3, 1);
    
    // Calculate final volume
    const finalVolume = soundSettings.sfxVolume * 
                       (soundSettings.combatVolume.explosion || 1.0) * 
                       volume * distanceVolume;
    
    // Request the sound directly through the sound manager
    soundManager.requestSound(
      sounds.combat.explosion,
      finalVolume,
      rate,
      pan,
      'explosion',
      priority
    );
  }
  
  // Process any batched sounds
  soundManager.endFrame();
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
        isDummy: true
      };
    };

    // Create placeholder sounds for any that failed to load
    Object.keys(sounds).forEach(category => {
      Object.keys(sounds[category]).forEach(soundName => {
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

// Debug function to show sound statistics (can be called from the debug overlay)
function getSoundStats() {
  return {
    activeSounds: soundManager.activeSounds.length,
    maxSounds: soundSettings.maxConcurrentSounds,
    performanceIssue: soundManager.performanceIssue,
    muted: soundSettings.muted,
    currentMusic: soundSettings.currentMusic
  };
}