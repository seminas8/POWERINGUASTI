import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Volume2, Play } from 'lucide-react';
import SoundManager, { SoundType } from '@/lib/soundManager';
import { NotificationSettings } from '@/hooks/useNotifications';

interface SoundSettingsProps {
  settings: NotificationSettings;
  onUpdateSettings: (settings: Partial<NotificationSettings>) => void;
  isAudioSupported: boolean;
}

export default function SoundSettings({ settings, onUpdateSettings, isAudioSupported }: SoundSettingsProps) {
  const soundTypes = SoundManager.getSoundTypes();

  const handleTestSound = async () => {
    try {
      await SoundManager.testSound(settings.soundType);
    } catch (error) {
      console.warn('Failed to test sound:', error);
    }
  };

  if (!isAudioSupported) {
    return (
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-500">
            <Volume2 className="w-5 h-5" />
            <span>Notifiche Sonore</span>
          </CardTitle>
          <CardDescription>
            L'audio non è supportato su questo dispositivo
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Volume2 className="w-5 h-5" />
          <span>Notifiche Sonore</span>
        </CardTitle>
        <CardDescription>
          Configura i suoni di notifica per i guasti elettrici
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Enable/Disable Sound */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="sound-enabled">Abilita Suoni</Label>
            <p className="text-sm text-muted-foreground">
              Riproduci suono quando viene rilevato un nuovo guasto
            </p>
          </div>
          <Switch
            id="sound-enabled"
            checked={settings.sound}
            onCheckedChange={(checked) => onUpdateSettings({ sound: checked })}
          />
        </div>

        {settings.sound && (
          <>
            {/* Sound Type Selection */}
            <div className="space-y-3">
              <Label>Tipo di Suono</Label>
              <div className="flex space-x-2">
                <Select
                  value={settings.soundType}
                  onValueChange={(value: SoundType) => onUpdateSettings({ soundType: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {soundTypes.map((sound) => (
                      <SelectItem key={sound.value} value={sound.value}>
                        {sound.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleTestSound}
                  disabled={settings.soundType === SoundType.NONE}
                >
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Volume Control */}
            {settings.soundType !== SoundType.NONE && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Volume</Label>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(settings.volume * 100)}%
                  </span>
                </div>
                <Slider
                  value={[settings.volume]}
                  onValueChange={([value]) => onUpdateSettings({ volume: value })}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}