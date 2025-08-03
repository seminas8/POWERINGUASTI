import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Settings as SettingsIcon, Moon, Sun, Bell, Zap } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/hooks/useNotifications';
import { Link } from 'wouter';
import NotificationPermissionCard from '@/components/NotificationPermissionCard';
import SoundSettings from '@/components/SoundSettings';

export default function Settings() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { settings, updateSettings, canShowNotifications, isAudioSupported } = useNotifications();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna alla Mappa
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <SettingsIcon className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Impostazioni</h1>
          </div>
        </div>

        {/* Notification Permission */}
        <NotificationPermissionCard
          onPermissionChange={(granted) => {
            updateSettings({ desktop: granted });
          }}
        />

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Impostazioni Notifiche</span>
            </CardTitle>
            <CardDescription>
              Personalizza quando e come ricevere notifiche sui guasti elettrici
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Enable Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notifications-enabled">Abilita Notifiche</Label>
                <p className="text-sm text-muted-foreground">
                  Ricevi notifiche per nuovi guasti elettrici
                </p>
              </div>
              <Switch
                id="notifications-enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => updateSettings({ enabled: checked })}
              />
            </div>

            {settings.enabled && (
              <>
                {/* Calabria Only Filter */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="calabria-only">Solo Calabria</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostra notifiche solo per guasti in Calabria (CS, RC, CZ, VV, KR)
                    </p>
                  </div>
                  <Switch
                    id="calabria-only"
                    checked={settings.calabriaOnly}
                    onCheckedChange={(checked) => updateSettings({ calabriaOnly: checked })}
                  />
                </div>

                {/* Desktop Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="desktop-notifications">Notifiche Desktop</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostra popup di notifica dal sistema operativo
                    </p>
                  </div>
                  <Switch
                    id="desktop-notifications"
                    checked={settings.desktop && canShowNotifications}
                    onCheckedChange={(checked) => updateSettings({ desktop: checked })}
                    disabled={!canShowNotifications}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sound Settings */}
        {settings.enabled && (
          <SoundSettings
            settings={settings}
            onUpdateSettings={updateSettings}
            isAudioSupported={isAudioSupported}
          />
        )}

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <span>Aspetto</span>
            </CardTitle>
            <CardDescription>
              Personalizza l'aspetto dell'interfaccia
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="dark-mode">Modalità Scura</Label>
                <p className="text-sm text-muted-foreground">
                  Usa un tema scuro per ridurre l'affaticamento degli occhi
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={isDarkMode}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Status Info */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
              <Zap className="w-5 h-5" />
              <span>Stato Sistema</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Notifiche Desktop:</span>
              <span className={canShowNotifications ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                {canShowNotifications ? "Attive" : "Non Attive"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Audio:</span>
              <span className={isAudioSupported ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                {isAudioSupported ? "Supportato" : "Non Supportato"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Filtro Calabria:</span>
              <span className={settings.calabriaOnly ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}>
                {settings.calabriaOnly ? "Attivo" : "Disattivo"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Monitora i guasti elettrici in tempo reale • Aggiornato automaticamente ogni minuto
          </p>
          <div className="pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground opacity-75">
              Sviluppato da <span className="font-medium text-primary">Younes El Mabtouti</span>
            </p>
            <p className="text-xs text-muted-foreground opacity-60 mt-1">
              Ottimizzato per prestazioni e compatibilità mobile/APK
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}