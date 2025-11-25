/**
 * Sound Effects Manager
 * Uses Web Audio API to generate synthetic game sounds
 */

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.volume = 0.3;
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this;
  }

  ensureContext() {
    if (!this.audioContext) {
      this.init();
    }
    // Resume context if suspended (browsers require user interaction)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Play a clear/pop sound
   * @param {number} pitch - Pitch multiplier (higher = higher pitch)
   */
  playClear(pitch = 1) {
    if (!this.enabled) return;
    this.ensureContext();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440 * pitch, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880 * pitch, this.audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(this.volume * 0.5, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  /**
   * Play combo sound (rising tone based on combo level)
   * @param {number} comboLevel - Current combo multiplier
   */
  playCombo(comboLevel) {
    if (!this.enabled) return;
    this.ensureContext();

    const baseFreq = 300 + (comboLevel * 100);

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  /**
   * Play critical clear sound (special effect)
   */
  playCritical() {
    if (!this.enabled) return;
    this.ensureContext();

    // Layer multiple oscillators for a richer sound
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 (C major chord)

    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(freq * 2, this.audioContext.currentTime + 0.3);

      const delay = index * 0.05;
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, this.audioContext.currentTime + delay + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

      oscillator.start(this.audioContext.currentTime + delay);
      oscillator.stop(this.audioContext.currentTime + 0.4);
    });
  }

  /**
   * Play spawn sound (subtle whoosh)
   */
  playSpawn() {
    if (!this.enabled) return;
    this.ensureContext();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(this.volume * 0.15, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  /**
   * Play near miss warning sound
   */
  playNearMiss() {
    if (!this.enabled) return;
    this.ensureContext();

    // Two-tone warning sound
    [0, 0.15].forEach((delay, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(index === 0 ? 440 : 330, this.audioContext.currentTime + delay);

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + delay + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + 0.12);

      oscillator.start(this.audioContext.currentTime + delay);
      oscillator.stop(this.audioContext.currentTime + delay + 0.12);
    });
  }

  /**
   * Play big clear sound (match 4+)
   */
  playBigClear() {
    if (!this.enabled) return;
    this.ensureContext();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(330, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(660, this.audioContext.currentTime + 0.15);
    oscillator.frequency.exponentialRampToValueAtTime(990, this.audioContext.currentTime + 0.25);

    gainNode.gain.setValueAtTime(this.volume * 0.5, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }
}

// Export singleton instance
export const soundManager = new SoundManager();
