/**
 * Mobile-Compatible Notification Manager
 * Sistema di notifiche che funziona anche su APK Android
 */

export interface MobileNotificationConfig {
  title: string;
  body: string;
  duration?: number;
  sound?: boolean;
  vibrate?: boolean;
}

export class MobileNotificationManager {
  private static instance: MobileNotificationManager;
  private isEnabled = false;
  private soundEnabled = true;
  private vibrationEnabled = true;
  private toastContainer: HTMLElement | null = null;

  private constructor() {
    this.initializeToastContainer();
    this.detectMobileCapabilities();
  }

  static getInstance(): MobileNotificationManager {
    if (!MobileNotificationManager.instance) {
      MobileNotificationManager.instance = new MobileNotificationManager();
    }
    return MobileNotificationManager.instance;
  }

  private detectMobileCapabilities(): void {
    // Rileva se siamo su mobile/APK
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isWebView = /wv|webview/i.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Su mobile/APK usiamo sempre il sistema fallback
    if (isMobile || isWebView || isStandalone) {
      this.isEnabled = true;
      console.log('📱 Mobile notification system activated');
    } else {
      // Su desktop proviamo il sistema nativo
      this.tryNativeNotifications();
    }
  }

  private async tryNativeNotifications(): Promise<void> {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          this.isEnabled = true;
          console.log('🔔 Native notifications enabled');
          return;
        }
      } catch (error) {
        console.log('⚠️ Native notifications failed, using fallback');
      }
    }
    
    // Fallback per tutti i casi
    this.isEnabled = true;
    console.log('📋 Using toast notification system');
  }

  private initializeToastContainer(): void {
    // Crea il container per i toast se non esiste
    this.toastContainer = document.getElementById('mobile-toast-container');
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.id = 'mobile-toast-container';
      this.toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 99999;
        pointer-events: none;
        max-width: 350px;
        width: 100%;
      `;
      document.body.appendChild(this.toastContainer);
    }
  }

  async requestPermission(): Promise<boolean> {
    // Su mobile/APK simuliamo sempre il permesso concesso
    return true;
  }

  isSupported(): boolean {
    return true; // Sempre supportato con il sistema fallback
  }

  canShowNotifications(): boolean {
    return this.isEnabled;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  setVibrationEnabled(enabled: boolean): void {
    this.vibrationEnabled = enabled;
  }

  async showNotification(config: MobileNotificationConfig): Promise<void> {
    if (!this.isEnabled) return;

    // Prova prima le notifiche native (se supportate)
    if (await this.tryNativeNotification(config)) {
      return;
    }

    // Fallback: toast notification
    this.showToastNotification(config);
    
    // Effetti feedback
    if (config.sound !== false && this.soundEnabled) {
      this.playNotificationSound();
    }
    
    if (config.vibrate !== false && this.vibrationEnabled) {
      this.vibrate();
    }
  }

  private async tryNativeNotification(config: MobileNotificationConfig): Promise<boolean> {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(config.title, {
          body: config.body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'enel-guasto',
          requireInteraction: false
        });
        return true;
      } catch (error) {
        console.log('Native notification failed:', error);
      }
    }
    return false;
  }

  private showToastNotification(config: MobileNotificationConfig): void {
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    toast.style.cssText = `
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      margin-bottom: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      pointer-events: auto;
      cursor: pointer;
      transform: translateX(400px);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      max-width: 100%;
      word-wrap: break-word;
    `;

    toast.innerHTML = `
      <div style="display: flex; align-items: start; gap: 12px;">
        <div style="font-size: 24px; line-height: 1; margin-top: 2px;">⚡</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 600; font-size: 15px; margin-bottom: 4px; line-height: 1.3;">
            ${this.escapeHtml(config.title)}
          </div>
          <div style="font-size: 13px; opacity: 0.95; line-height: 1.4;">
            ${this.escapeHtml(config.body)}
          </div>
        </div>
        <div style="font-size: 18px; opacity: 0.7; cursor: pointer; padding: 2px;" onclick="this.parentElement.parentElement.remove()">×</div>
      </div>
    `;

    this.toastContainer.appendChild(toast);

    // Animazione di entrata
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
    });

    // Auto-remove dopo durata specificata
    const duration = config.duration || 5000;
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.transform = 'translateX(400px)';
        toast.style.opacity = '0';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 400);
      }
    }, duration);

    // Click per rimuovere
    toast.addEventListener('click', () => {
      toast.style.transform = 'translateX(400px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    });
  }

  private playNotificationSound(): void {
    try {
      // Usa Web Audio API se disponibile
      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Crea un beep semplice
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      }
    } catch (error) {
      console.log('Audio notification failed:', error);
    }
  }

  private vibrate(): void {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch (error) {
        console.log('Vibration failed:', error);
      }
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export singleton instance
export const mobileNotificationManager = MobileNotificationManager.getInstance();