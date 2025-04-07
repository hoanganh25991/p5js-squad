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
  muted: false,
  currentMusic: null,
};

// Preload all sounds
function preloadSounds() {
  // Background music
  sounds.music.main = loadSound('sounds/music/main_theme.mp3');
  sounds.music.battle = loadSound('sounds/music/battle.mp3');
  sounds.music.boss = loadSound('sounds/music/boss_battle.mp3');
  sounds.music.victory = loadSound('sounds/music/victory.mp3');
  
  // UI sounds
  sounds.ui.click = loadSound('sounds/ui/click.mp3');
  sounds.ui.hover = loadSound('sounds/ui/hover.mp3');
  sounds.ui.upgrade = loadSound('sounds/ui/upgrade.mp3');
  sounds.ui.error = loadSound('sounds/ui/error.mp3');
  sounds.ui.levelUp = loadSound('sounds/ui/level_up.mp3');
  
  // Combat sounds
  sounds.combat.shoot = loadSound('sounds/combat/shoot.mp3');
  sounds.combat.hit = loadSound('sounds/combat/hit.mp3');
  sounds.combat.explosion = loadSound('sounds/combat/explosion.mp3');
  sounds.combat.death = loadSound('sounds/combat/death.mp3');
  sounds.combat.criticalHit = loadSound('sounds/combat/critical_hit.mp3');
  
  // Skill sounds
  sounds.skills.skill1 = loadSound('sounds/skills/rapid_fire.mp3');
  sounds.skills.skill2 = loadSound('sounds/skills/scatter_shot.mp3');
  sounds.skills.skill3 = loadSound('sounds/skills/orbital_strike.mp3');
  sounds.skills.skill4 = loadSound('sounds/skills/cryo_freeze.mp3');
  sounds.skills.skill5 = loadSound('sounds/skills/rejuvenation.mp3');
  sounds.skills.skill6 = loadSound('sounds/skills/infernal_rage.mp3');
  sounds.skills.skill7 = loadSound('sounds/skills/quantum_acceleration.mp3');
  sounds.skills.skill8 = loadSound('sounds/skills/apocalypse.mp3');
  
  // Environment sounds
  sounds.environment.wind = loadSound('sounds/environment/wind.mp3');
  sounds.environment.ambient = loadSound('sounds/environment/ambient.mp3');
  
  // Power-up sounds
  sounds.powerups.collect = loadSound('sounds/powerups/collect.mp3');
  sounds.powerups.spawn = loadSound('sounds/powerups/spawn.mp3');
}

// Initialize sound system
function initSounds() {
  // Set master volume
  masterVolume(soundSettings.masterVolume);
  
  // Set individual volumes
  Object.values(sounds.music).forEach(sound => {
    if (sound) sound.setVolume(soundSettings.musicVolume);
  });
  
  // Loop ambient sounds
  if (sounds.environment.ambient) {
    sounds.environment.ambient.setVolume(0.3);
    sounds.environment.ambient.loop();
  }
}

// Play a sound with specified volume and optional rate/pan
function playSound(sound, volume = 1.0, rate = 1.0, pan = 0) {
  if (!sound || soundSettings.muted) return;
  
  // Calculate final volume based on master volume
  const finalVolume = volume * soundSettings.masterVolume;
  
  // Play the sound with specified parameters
  sound.rate(rate);
  sound.pan(pan);
  sound.setVolume(finalVolume);
  sound.play();
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
  if (!sounds.music[musicName] || soundSettings.muted) return;
  
  // If same music is already playing, do nothing
  if (soundSettings.currentMusic === musicName && sounds.music[musicName].isPlaying()) {
    return;
  }
  
  // Fade out current music if playing
  if (soundSettings.currentMusic && sounds.music[soundSettings.currentMusic].isPlaying()) {
    sounds.music[soundSettings.currentMusic].fade(0, fadeTime);
  }
  
  // Set new music and play
  soundSettings.currentMusic = musicName;
  sounds.music[musicName].setVolume(0);
  sounds.music[musicName].loop();
  
  // Fade in new music
  sounds.music[musicName].setVolume(soundSettings.musicVolume, fadeTime);
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
  
  if (soundSettings.muted) {
    masterVolume(0);
  } else {
    masterVolume(soundSettings.masterVolume);
    
    // Resume background music if it was playing
    if (soundSettings.currentMusic) {
      playMusic(soundSettings.currentMusic, 0.5);
    }
  }
  
  return soundSettings.muted;
}

// Set master volume
function setMasterVolume(volume) {
  soundSettings.masterVolume = constrain(volume, 0, 1);
  masterVolume(soundSettings.masterVolume);
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
  // Create placeholder sounds for any that failed to load
  Object.keys(sounds).forEach(category => {
    Object.keys(sounds[category]).forEach(soundName => {
      if (!sounds[category][soundName]) {
        console.warn(`Failed to load sound: ${category}.${soundName}`);
        sounds[category][soundName] = new p5.Oscillator('sine');
      }
    });
  });
}