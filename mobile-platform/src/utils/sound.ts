/**
 * Omni Foundation Console Audio Engine
 * Exact replication of the antislop sound architecture (PS5 UI audio cues)
 * Uses high-fidelity sampled audio buffers decoded in-memory via Web Audio API,
 * with zero-latency buffer playback and Audio element fallbacks.
 */

import {
  SOUND_B64_NAV,
  SOUND_B64_ENTER,
  SOUND_B64_BACK,
  SOUND_B64_HUB,
  SOUND_B64_BADGE,
  SOUND_B64_COPY,
} from './sound-data';

class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private soundBuffers: Record<string, AudioBuffer> = {};
  private isPreloading: boolean = false;
  private unlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('omni_sound_enabled');
      this.soundEnabled = saved !== null ? saved === 'true' : true;
      this.initUnlockAndWarmup();
    }
  }

  private initUnlockAndWarmup() {
    if (typeof window === 'undefined') return;

    const unlockTriggers = ['click', 'keydown', 'touchstart', 'pointerdown'];
    const unlocker = () => {
      if (this.unlocked) return;
      this.unlocked = true;
      const ctx = this.getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        this.preloadAllSounds(ctx);
      }
      unlockTriggers.forEach((evt) => {
        window.removeEventListener(evt, unlocker);
        document.removeEventListener(evt, unlocker);
      });
    };

    unlockTriggers.forEach((evt) => {
      window.addEventListener(evt, unlocker, { passive: true, once: true });
      document.addEventListener(evt, unlocker, { passive: true, once: true });
    });

    const warmup = () => {
      try {
        const ctx = this.getAudioContext();
        if (ctx) {
          this.preloadAllSounds(ctx);
        }
      } catch (_) {}
    };

    if ('requestIdleCallback' in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void, opts: { timeout: number }) => void })
        .requestIdleCallback(warmup, { timeout: 2500 });
    } else {
      setTimeout(warmup, 1200);
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.audioCtx = new AudioCtx();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    } catch {
      // AudioContext unavailable in current environment
    }
    return this.audioCtx;
  }

  private preloadAllSounds(ctx: AudioContext) {
    if (!ctx || this.isPreloading) return;
    this.isPreloading = true;

    const decode = (name: string, b64: string) => {
      if (this.soundBuffers[name]) return;
      try {
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) {
          bytes[i] = bin.charCodeAt(i);
        }
        ctx.decodeAudioData(
          bytes.buffer.slice(0),
          (buf) => {
            this.soundBuffers[name] = buf;
          },
          () => {}
        );
      } catch {}
    };

    decode('nav', SOUND_B64_NAV);
    decode('enter', SOUND_B64_ENTER);
    decode('back', SOUND_B64_BACK);
    decode('hub', SOUND_B64_HUB);
    decode('badge', SOUND_B64_BADGE);
    decode('copy', SOUND_B64_COPY);
  }

  private playSfx(name: string, volume: number, fallbackPath?: string) {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (ctx && this.soundBuffers[name]) {
        const src = ctx.createBufferSource();
        src.buffer = this.soundBuffers[name];
        const gain = ctx.createGain();
        gain.gain.value = volume;
        src.connect(gain);
        gain.connect(ctx.destination);
        src.start(0);
        return;
      }
      if (fallbackPath && typeof window !== 'undefined') {
        const audio = new Audio(fallbackPath);
        audio.volume = volume;
        audio.play().catch(() => {});
      }
    } catch {}
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('omni_sound_enabled', String(this.soundEnabled));
    }
    if (this.soundEnabled) {
      this.playEnter();
    }
    return this.soundEnabled;
  }

  /**
   * 1. Navigation / Logo / Carousel Hover (Authentic PS5 Nav Tick)
   */
  public playNavTick() {
    this.playSfx('nav', 0.72, '/assets/sounds/nav.mp3');
  }

  public playNav() {
    this.playNavTick();
  }

  /**
   * 2. Navigation Enter / Action Confirm (Authentic PS5 Enter Chime)
   */
  public playEnter() {
    this.playSfx('enter', 0.78, '/assets/sounds/enter.mp3');
  }

  /**
   * 3. Navigation Back / Cancel (Authentic PS5 Back Sound)
   */
  public playBack() {
    this.playSfx('back', 0.78, '/assets/sounds/back.mp3');
  }

  /**
   * 4. Hub Tab Switch (Authentic PS5 Hub Tab Sweep)
   */
  public playHubTab() {
    this.playSfx('hub', 0.72, '/assets/sounds/tab_hub.mp3');
  }

  /**
   * 5. Sub-tab / Badge (Original 740Hz to 520Hz soft sweep or buffer)
   */
  public playBadge() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(740, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  /**
   * 6. Copy Button (Custom Click Clipboard Sound)
   */
  public playCopy() {
    this.playSfx('copy', 0.85, '/assets/sounds/click-clipboard.mp3');
  }

  /**
   * 7. PS5 Authentic Startup Chime
   */
  public playStartup() {
    if (!this.soundEnabled || typeof window === 'undefined') return;
    try {
      const audio = new Audio('/assets/sounds/ps5-startup.mp3');
      audio.volume = 0.8;
      audio.play().catch(() => {});
    } catch {}
  }
}

export const sound = new SoundEngine();
