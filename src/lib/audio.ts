// src/lib/audio.ts

// Define your sound registry here. 
// You will place the actual .mp3 or .wav files in your public/sounds/ directory.
const SOUND_REGISTRY = {
  // UI Interactions
  hover: '/sounds/glass-hover.mp3',
  click: '/sounds/tech-click.mp3',
  toggle: '/sounds/soft-switch.mp3',
  
  // Challenge Rarities (Scaling in intensity)
  common: '/sounds/pop-light.mp3',
  rare: '/sounds/synth-swell.mp3',
  epic: '/sounds/deep-bass-impact.mp3',
  divine: '/sounds/cinematic-choir-drop.mp3',
  
  // System Events
  levelUp: '/sounds/level-up-chime.mp3',
  error: '/sounds/error-beep.mp3',
} as const;

export type SoundEffect = keyof typeof SOUND_REGISTRY;

class AudioManager {
  private cache: Map<SoundEffect, HTMLAudioElement> = new Map();
  private isMuted: boolean = false;
  private globalVolume: number = 0.5;

  constructor() {
    // Only preload on the client side
    if (typeof window !== 'undefined') {
      Object.entries(SOUND_REGISTRY).forEach(([key, url]) => {
        const audio = new Audio(url);
        audio.preload = 'auto'; // Force browser to download the file in the background
        this.cache.set(key as SoundEffect, audio);
      });
      
      // Respect user's saved preferences if they disabled sounds previously
      const savedMute = localStorage.getItem('outstand-muted');
      if (savedMute === 'true') this.isMuted = true;
    }
  }

  /**
   * Plays a sound effect from the registry.
   * Clones the audio node to allow overlapping sounds (e.g., rapid clicking).
   */
  play(effect: SoundEffect, localVolume?: number) {
    if (this.isMuted) return;

    const baseAudio = this.cache.get(effect);
    if (!baseAudio) return;

    // Clone node allows the same sound to overlap itself perfectly
    const soundClone = baseAudio.cloneNode() as HTMLAudioElement;
    soundClone.volume = localVolume ?? this.globalVolume;
    
    // Play and catch any browser autoplay block policies silently
    soundClone.play().catch((err) => {
      console.warn(`[Audio Manager] Blocked from playing ${effect}:`, err);
    });
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('outstand-muted', String(muted));
  }

  setVolume(volume: number) {
    this.globalVolume = Math.max(0, Math.min(1, volume));
  }
}

// Export a single instance to be used application-wide
export const audio = new AudioManager();
