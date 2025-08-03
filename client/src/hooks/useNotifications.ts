import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Outage } from '@shared/schema';
import NotificationManager from '@/lib/notificationManager';
import SoundManager, { SoundType } from '@/lib/soundManager';
import { mobileNotificationManager } from '@/lib/mobileNotificationManager';

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  calabriaOnly: boolean;
  soundType: SoundType;
  volume: number;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  sound: true,
  desktop: true,
  calabriaOnly: true,
  soundType: SoundType.BEEP,
  volume: 0.3
};

export function useNotifications() {
  const [lastNotifiedOutages, setLastNotifiedOutages] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    
    const saved = localStorage.getItem('notification-settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const { data: outages } = useQuery({
    queryKey: ['/api/outages'],
  });

  const showNotificationForOutage = async (outage: Outage) => {
    try {
      const title = `🔴 Nuovo Guasto Elettrico`;
      const body = `${outage.municipality} (${outage.province}) - ${outage.affectedUsers} utenti coinvolti`;

      // Prova prima il sistema mobile/APK compatibile
      if (settings.desktop) {
        await mobileNotificationManager.showNotification({
          title,
          body,
          sound: settings.sound,
          vibrate: true,
          duration: 8000
        });
      }

      // Fallback: sistema desktop nativo (se non su mobile)
      if (settings.desktop && NotificationManager.canShowNotifications()) {
        await NotificationManager.showNotification({
          title,
          body,
          tag: `outage-${outage.id}`,
          requireInteraction: false,
          data: { outageId: outage.id }
        });
      }
      
      // Sound notification
      if (settings.sound && SoundManager.isAudioSupported()) {
        await SoundManager.playSound({
          type: settings.soundType,
          volume: settings.volume,
          duration: 0.6
        });
      }
    } catch (error) {
      console.warn('Failed to show notification:', error);
    }
  };

  // Monitor for new outages
  useEffect(() => {
    if (!outages || !settings.enabled) return;

    const calabriaProvinces = ['CS', 'RC', 'CZ', 'VV', 'KR'];
    
    const newOutages = (outages as Outage[]).filter((outage: Outage) => {
      // Filter by Calabria if enabled
      if (settings.calabriaOnly && !calabriaProvinces.includes(outage.province)) {
        return false;
      }
      
      // Only active outages (not planned work)
      if (outage.status !== 'active' || outage.isPlanned) {
        return false;
      }
      
      // Only new outages (not already notified)
      return !lastNotifiedOutages.has(outage.id);
    });

    if (newOutages.length > 0) {
      // Update notified outages list
      setLastNotifiedOutages(prev => {
        const updated = new Set(prev);
        newOutages.forEach((outage: Outage) => updated.add(outage.id));
        return updated;
      });

      // Send notifications for each new outage
      newOutages.forEach((outage: Outage, index: number) => {
        // Stagger notifications to avoid overlap
        setTimeout(() => {
          showNotificationForOutage(outage);
        }, index * 500);
      });
    }
  }, [outages, settings, lastNotifiedOutages]);

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('notification-settings', JSON.stringify(updated));
  };

  return {
    settings,
    updateSettings,
    newOutagesCount: 0,
    canShowNotifications: NotificationManager.canShowNotifications() || mobileNotificationManager.canShowNotifications(),
    isAudioSupported: SoundManager.isAudioSupported()
  };
}