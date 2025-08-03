/**
 * Professional Sound Manager for Notifications
 */

export enum SoundType {
  BEEP = 'beep',
  ALERT = 'alert', 
  CHIME = 'chime',
  URGENT = 'urgent',
  NONE = 'none'
}

export interface SoundConfig {
  type: SoundType;
  volume: number;
  duration: number;
}

export class SoundManager {
  private static instance: SoundManager;
  private audioContext: AudioContext | null = null;
  private isSupported: boolean;

  private constructor() {
    this.isSupported = 'AudioContext' in window || 'webkitAudioContext' in window;
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private async getAudioContext(): Promise<AudioContext> {
    if (!this.audioContext && this.isSupported) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended (required for mobile)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    }
    return this.audioContext!;
  }

  public async playSound(config: SoundConfig): Promise<void> {
    if (!this.isSupported || config.type === SoundType.NONE) {
      return;
    }

    try {
      const audioContext = await this.getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure sound based on type
      this.configureSoundType(oscillator, gainNode, audioContext, config);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + config.duration);
      
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  }

  private configureSoundType(
    oscillator: OscillatorNode, 
    gainNode: GainNode, 
    audioContext: AudioContext, 
    config: SoundConfig
  ): void {
    const { type, volume, duration } = config;
    const startTime = audioContext.currentTime;
    
    // Set volume envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    switch (type) {
      case SoundType.BEEP:
        oscillator.frequency.setValueAtTime(800, startTime);
        break;
        
      case SoundType.ALERT:
        oscillator.frequency.setValueAtTime(1000, startTime);
        oscillator.frequency.setValueAtTime(800, startTime + 0.1);
        oscillator.frequency.setValueAtTime(1200, startTime + 0.2);
        break;
        
      case SoundType.CHIME:
        oscillator.frequency.setValueAtTime(523.25, startTime); // C5
        oscillator.frequency.setValueAtTime(659.25, startTime + 0.2); // E5
        oscillator.frequency.setValueAtTime(783.99, startTime + 0.4); // G5
        break;
        
      case SoundType.URGENT:
        // Rapid beeping pattern
        for (let i = 0; i < 3; i++) {
          oscillator.frequency.setValueAtTime(1200, startTime + i * 0.15);
          oscillator.frequency.setValueAtTime(800, startTime + i * 0.15 + 0.075);
        }
        break;
    }
  }

  public getSoundTypes(): { value: SoundType; label: string }[] {
    return [
      { value: SoundType.NONE, label: 'Nessun Suono' },
      { value: SoundType.BEEP, label: 'Beep Standard' },
      { value: SoundType.ALERT, label: 'Allarme' },  
      { value: SoundType.CHIME, label: 'Campanello' },
      { value: SoundType.URGENT, label: 'Urgente' }
    ];
  }

  public async testSound(type: SoundType): Promise<void> {
    await this.playSound({
      type,
      volume: 0.3,
      duration: 0.6
    });
  }

  public isAudioSupported(): boolean {
    return this.isSupported;
  }
}

export default SoundManager.getInstance();