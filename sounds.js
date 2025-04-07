// Sound Manager for Squad Survival
// Handles loading, playing, and managing all game sounds

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
    wind: null,
    ambient: null,
  },
  
  // Power-up sounds
  powerups: {
    collect: null,
    spawn: null,
  }
};

// Sound settings
let soundSettings = {
  masterVolume: 0.7,
  musicVolume: 0.5,
  sfxVolume: 0.8,
  uiVolume: 0.6,
  muted: true, // Sound off by default
  currentMusic: null,
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
    sounds.music.battle = safeLoadSound('sounds/music/battle.mp3');
    sounds.music.boss = safeLoadSound('sounds/music/boss_battle.mp3');
    sounds.music.victory = safeLoadSound('sounds/music/victory.mp3');

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
    sounds.skills.skill3 = safeLoadSound('sounds/skills/orbital_strike.mp3');
    sounds.skills.skill4 = safeLoadSound('sounds/skills/cryo_freeze.mp3');
    sounds.skills.skill5 = safeLoadSound('sounds/skills/rejuvenation.mp3');
    sounds.skills.skill6 = safeLoadSound('sounds/skills/infernal_rage.mp3');
    sounds.skills.skill7 = safeLoadSound('sounds/skills/quantum_acceleration.mp3');
    sounds.skills.skill8 = safeLoadSound('sounds/skills/apocalypse.mp3');

    // Environment sounds
    sounds.environment.wind = safeLoadSound('sounds/environment/wind.mp3');
    sounds.environment.ambient = safeLoadSound('sounds/environment/ambient.mp3');

    // Power-up sounds
    sounds.powerups.collect = safeLoadSound('sounds/powerups/collect.mp3');
    sounds.powerups.spawn = safeLoadSound('sounds/powerups/spawn.mp3');

    console.log("Sound preloading completed");
  } catch (e) {
    console.error("Error in preloadSounds:", e);
  }
}

// Initialize sound system
function initSounds() {
  try {
    // Check if p5.sound is available
    if (typeof p5 !== 'undefined' && p5.prototype.hasOwnProperty('masterVolume')) {
      // Set master volume using p5.sound
      masterVolume(soundSettings.masterVolume);

      // Set individual volumes
      Object.values(sounds.music).forEach(sound => {
        if (sound && sound.setVolume) sound.setVolume(soundSettings.musicVolume);
      });

      // Loop ambient sounds
      if (sounds.environment.ambient && sounds.environment.ambient.setVolume && sounds.environment.ambient.loop) {
        sounds.environment.ambient.setVolume(0.3);
        sounds.environment.ambient.loop();
      }

      console.log("Sound system initialized successfully");
    } else {
      console.warn("p5.sound library not fully loaded. Sound features may be limited.");
      // Create fallback for sound settings when p5.sound isn't available
      soundSettings.muted = true;
    }
  } catch (e) {
    console.error("Error initializing sound system:", e);
    // Set muted to true as a fallback
    soundSettings.muted = true;
  }
}

// Play a sound with specified volume and optional rate/pan
function playSound(sound, volume = 1.0, rate = 1.0, pan = 0) {
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

    // Play the sound with specified parameters
    if (sound.rate) sound.rate(rate);
    if (sound.pan) sound.pan(pan);
    sound.setVolume(finalVolume);
    sound.play();
  } catch (e) {
    console.warn("Error playing sound:", e);
  }
}

// Play UI sound
function playUISound(soundName) {
  if (sounds.ui[soundName]) {
    playSound(sounds.ui[soundName], soundSettings.uiVolume);
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
    
    playSound(sounds.combat[soundName], soundSettings.sfxVolume * volume * distanceVolume, 1.0, pan);
  }
}

// Play skill sound
function playSkillSound(skillNumber) {
  const skillName = `skill${skillNumber}`;
  if (sounds.skills[skillName]) {
    playSound(sounds.skills[skillName], soundSettings.sfxVolume);
  }
}

// Play background music with crossfade
function playMusic(musicName, fadeTime = 2.0) {
  try {
    // Check if sound is available and not muted
    if (!sounds.music[musicName] || soundSettings.muted) return;

    // Check if the sound object has the necessary methods
    if (!sounds.music[musicName].isPlaying || !sounds.music[musicName].setVolume || !sounds.music[musicName].loop) {
      console.warn(`Music ${musicName} is missing required methods. Skipping playback.`);
      return;
    }

    // If same music is already playing, do nothing
    if (soundSettings.currentMusic === musicName && sounds.music[musicName].isPlaying()) {
      return;
    }

    // Fade out current music if playing
    if (soundSettings.currentMusic &&
        sounds.music[soundSettings.currentMusic] &&
        sounds.music[soundSettings.currentMusic].isPlaying &&
        sounds.music[soundSettings.currentMusic].isPlaying()) {

      if (sounds.music[soundSettings.currentMusic].fade) {
        sounds.music[soundSettings.currentMusic].fade(0, fadeTime);
      } else {
        sounds.music[soundSettings.currentMusic].setVolume(0);
      }
    }

    // Set new music and play
    soundSettings.currentMusic = musicName;
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
  
  soundSettings.currentMusic = null;
}

// Toggle mute all sounds
function toggleMute() {
  soundSettings.muted = !soundSettings.muted;

  try {
    // Check if p5.sound is available
    if (typeof p5 !== 'undefined' && p5.prototype.hasOwnProperty('masterVolume')) {
      if (soundSettings.muted) {
        masterVolume(0);
      } else {
        masterVolume(soundSettings.masterVolume);

        // Resume background music if it was playing
        if (soundSettings.currentMusic) {
          playMusic(soundSettings.currentMusic, 0.5);
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

// Play random hit sound with variation
function playRandomHitSound(x, y, isCritical = false) {
  if (isCritical) {
    playCombatSound('criticalHit', x, y, 1.0);
  } else {
    playCombatSound('hit', x, y, random(0.8, 1.0));
    
    // Randomize pitch slightly
    sounds.combat.hit.rate(random(0.9, 1.1));
  }
}

// Play explosion sound with size-based variations
function playExplosionSound(x, y, size = 1.0) {
  // Larger explosions have lower pitch and higher volume
  const rate = map(size, 0.5, 3, 1.2, 0.7);
  const volume = map(size, 0.5, 3, 0.7, 1.0);
  
  playCombatSound('explosion', x, y, volume);
  sounds.combat.explosion.rate(rate);
}

// Play ambient sounds based on game state
function updateAmbientSounds() {
  // Adjust wind sound based on camera height
  if (sounds.environment.wind) {
    const windVolume = map(cameraZoom, 300, 1000, 0.1, 0.4);
    sounds.environment.wind.setVolume(windVolume * soundSettings.sfxVolume);
    
    if (!sounds.environment.wind.isPlaying()) {
      sounds.environment.wind.loop();
    }
  }
}

// Handle sound fallbacks if files don't load
function handleSoundLoadError() {
  try {
    // Check if p5.sound is available
    if (typeof p5 === 'undefined' || !p5.prototype.hasOwnProperty('Oscillator')) {
      console.warn("p5.sound library not available. Cannot create fallback sounds.");
      return;
    }

    // Create a dummy sound object with all required methods
    const createDummySound = () => {
      // Try to create an oscillator if available
      try {
        const osc = new p5.Oscillator('sine');

        // Add all required methods
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
      } catch (e) {
        console.warn("Failed to create oscillator:", e);

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
      }
    };

    // Create placeholder sounds for any that failed to load
    Object.keys(sounds).forEach(category => {
      Object.keys(sounds[category]).forEach(soundName => {
        if (!sounds[category][soundName]) {
          console.warn(`Creating fallback for sound: ${category}.${soundName}`);
          sounds[category][soundName] = createDummySound();
        }
      });
    });

    console.log("Sound fallbacks created successfully");
  } catch (e) {
    console.error("Error creating sound fallbacks:", e);
  }
}