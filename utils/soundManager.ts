// Web Audio API kullanarak dış dosya bağımlılığı olmayan ses motoru
class SoundManager {
  private audioContext: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
  }

  // Safari/iOS requires user gesture to unlock AudioContext
  public async resumeContext(): Promise<void> {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  // Check if audio is ready to play
  public get isReady(): boolean {
    return this.audioContext !== null && this.audioContext.state === 'running';
  }

  // Yardımcı: Osilatör sesi oluştur
  private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0, vol: number = 0.1) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

    gain.gain.setValueAtTime(vol, ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration);
  }

  public playCorrect() {
    // Ding sesi (Yüksek C ve E notaları)
    this.playTone(523.25, 'sine', 0.1, 0, 0.1); // C5
    this.playTone(659.25, 'sine', 0.4, 0.1, 0.1); // E5
  }

  public playTaboo() {
    // Hatalı/Tabu sesi (Testere dişi dalgası, düşük perde)
    this.playTone(150, 'sawtooth', 0.1, 0, 0.15);
    this.playTone(100, 'sawtooth', 0.3, 0.1, 0.15);
  }

  public playPass() {
    // Hızlı geçiş sesi (Swoosh benzeri)
    this.playTone(400, 'triangle', 0.1, 0, 0.05);
  }

  public playTick() {
    // Saat tik sesi
    this.playTone(800, 'square', 0.03, 0, 0.02);
  }

  public playTimeUp() {
    // Süre bitti (Düdük tarzı)
    this.playTone(880, 'square', 0.1, 0, 0.1);
    this.playTone(880, 'square', 0.4, 0.15, 0.1);
  }

  public playGameOver() {
    // Oyun bitti melodisi (Fanfare benzeri)
    this.playTone(523.25, 'triangle', 0.1, 0, 0.1); // C5
    this.playTone(659.25, 'triangle', 0.1, 0.15, 0.1); // E5
    this.playTone(783.99, 'triangle', 0.1, 0.3, 0.1); // G5
    this.playTone(1046.50, 'triangle', 0.4, 0.45, 0.1); // C6
  }

  public playPowerUp() {
    // Güçlendirme sesi (Yükselen tonlar)
    this.playTone(300, 'sine', 0.1, 0, 0.1);
    this.playTone(450, 'sine', 0.1, 0.1, 0.1);
    this.playTone(600, 'sine', 0.3, 0.2, 0.1);
  }

  public playChallenge() {
    // Meydan okuma/Şans kartı sesi (Gizemli)
    this.playTone(200, 'triangle', 0.5, 0, 0.1);
    this.playTone(300, 'triangle', 0.5, 0.2, 0.1);
    this.playTone(150, 'triangle', 1.0, 0.4, 0.1);
  }
}

export const soundManager = new SoundManager();