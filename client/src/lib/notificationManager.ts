/**
 * Professional Notification Manager
 * Handles all notification logic with proper error handling and browser compatibility
 */

export enum NotificationPermission {
  GRANTED = 'granted',
  DENIED = 'denied',
  DEFAULT = 'default'
}

export interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  badge?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: any;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private isSupported: boolean;
  private permission: NotificationPermission;

  private constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.permission = this.isSupported ? 
      (Notification.permission as NotificationPermission) : 
      NotificationPermission.DENIED;
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Check if notifications are supported by the browser
   */
  public isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get current notification permission status
   */
  public getPermissionStatus(): NotificationPermission {
    if (!this.isSupported) return NotificationPermission.DENIED;
    this.permission = Notification.permission as NotificationPermission;
    return this.permission;
  }

  /**
   * Request notification permission with proper user interaction handling
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Notifications not supported in this browser');
    }

    if (this.permission === NotificationPermission.GRANTED) {
      return this.permission;
    }

    try {
      const result = await Notification.requestPermission();
      this.permission = result as NotificationPermission;
      
      // Test notification on successful permission
      if (this.permission === NotificationPermission.GRANTED) {
        await this.showNotification({
          title: 'Notifiche Attivate',
          body: 'Riceverai ora notifiche per i guasti elettrici in Calabria',
          tag: 'permission-test'
        });
      }
      
      return this.permission;
    } catch (error) {
      console.error('Permission request failed:', error);
      throw new Error('Failed to request notification permission');
    }
  }

  /**
   * Show a notification with the given configuration
   */
  public async showNotification(config: NotificationConfig): Promise<void> {
    if (!this.isSupported) {
      throw new Error('Notifications not supported');
    }

    if (this.permission !== NotificationPermission.GRANTED) {
      throw new Error('Notification permission not granted');
    }

    try {
      const notification = new Notification(config.title, {
        body: config.body,
        icon: config.icon || '/favicon.ico',
        badge: config.badge,
        tag: config.tag,
        requireInteraction: config.requireInteraction || false,
        silent: config.silent || false,
        data: config.data
      });

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!config.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      return new Promise((resolve) => {
        notification.onshow = () => resolve();
        notification.onerror = () => {
          console.error('Notification display failed');
          resolve();
        };
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
      throw error;
    }
  }

  /**
   * Get browser-specific setup instructions
   */
  public getBrowserInstructions(): string {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    if (isMobile) {
      if (/Chrome/i.test(userAgent)) {
        return 'Chrome Mobile: Menu (⋮) → Impostazioni → Impostazioni sito → Notifiche → Consenti per questo sito';
      } else if (/Firefox/i.test(userAgent)) {
        return 'Firefox Mobile: Menu → Impostazioni → Siti e privacy → Notifiche → Consenti';
      } else if (/Safari/i.test(userAgent)) {
        return 'Safari iOS: Impostazioni → Safari → Notifiche → Consenti per questo sito';
      } else {
        return 'Browser Mobile: Vai nelle impostazioni → Notifiche → Consenti per questo sito';
      }
    } else {
      if (/Chrome/i.test(userAgent)) {
        return 'Chrome: Clicca sull\'icona lucchetto nella barra indirizzi → Notifiche → Consenti';
      } else if (/Firefox/i.test(userAgent)) {
        return 'Firefox: Clicca sull\'icona scudo → Pannello di controllo contenuti → Notifiche → Consenti';
      } else if (/Safari/i.test(userAgent)) {
        return 'Safari: Safari → Preferenze → Siti web → Notifiche → Consenti';
      } else {
        return 'Browser: Cerca l\'icona delle notifiche nella barra indirizzi e clicca Consenti';
      }
    }
  }

  /**
   * Check if we can show notifications for outages
   */
  public canShowNotifications(): boolean {
    return this.isSupported && this.permission === NotificationPermission.GRANTED;
  }
}

export default NotificationManager.getInstance();