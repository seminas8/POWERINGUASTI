import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import NotificationManager, { NotificationPermission } from '@/lib/notificationManager';

interface NotificationPermissionCardProps {
  onPermissionChange?: (granted: boolean) => void;
}

export default function NotificationPermissionCard({ onPermissionChange }: NotificationPermissionCardProps) {
  const [permission, setPermission] = useState<NotificationPermission>(NotificationPermission.DEFAULT);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check initial state
    setIsSupported(NotificationManager.isNotificationSupported());
    setPermission(NotificationManager.getPermissionStatus());
  }, []);

  const handleRequestPermission = async () => {
    if (!isSupported) return;

    setIsRequesting(true);
    setError(null);

    try {
      const result = await NotificationManager.requestPermission();
      setPermission(result);
      onPermissionChange?.(result === NotificationPermission.GRANTED);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsRequesting(false);
    }
  };

  const getStatusInfo = () => {
    switch (permission) {
      case NotificationPermission.GRANTED:
        return {
          icon: CheckCircle,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          badge: 'Attive',
          badgeVariant: 'default' as const,
          title: 'Notifiche Attivate',
          description: 'Riceverai notifiche per i nuovi guasti elettrici in Calabria'
        };
      case NotificationPermission.DENIED:
        return {
          icon: XCircle,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          badge: 'Bloccate',
          badgeVariant: 'destructive' as const,
          title: 'Notifiche Bloccate',
          description: 'Le notifiche sono state bloccate. Segui le istruzioni per sbloccarle.'
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          badge: 'Da Attivare',
          badgeVariant: 'secondary' as const,
          title: 'Notifiche Non Attive',
          description: 'Attiva le notifiche per essere avvisato dei nuovi guasti in Calabria'
        };
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-gray-500" />
            <span>Notifiche Non Supportate</span>
          </CardTitle>
          <CardDescription>
            Il tuo browser non supporta le notifiche web
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className={`${statusInfo.bgColor} ${statusInfo.borderColor}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
            <span>{statusInfo.title}</span>
          </div>
          <Badge variant={statusInfo.badgeVariant}>
            {statusInfo.badge}
          </Badge>
        </CardTitle>
        <CardDescription>
          {statusInfo.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {permission === NotificationPermission.DEFAULT && (
          <Button
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="w-full"
          >
            <Bell className="w-4 h-4 mr-2" />
            {isRequesting ? 'Attivazione...' : 'Attiva Notifiche'}
          </Button>
        )}

        {permission === NotificationPermission.DENIED && (
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Come sbloccare le notifiche:</p>
                <p className="text-sm">{NotificationManager.getBrowserInstructions()}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                  className="mt-2"
                >
                  Ricarica per Verificare
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {permission === NotificationPermission.GRANTED && (
          <Alert>
            <CheckCircle className="w-4 h-4" />
            <AlertDescription>
              Sistema di notifiche configurato correttamente. Riceverai avvisi solo per guasti attivi in Calabria.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}