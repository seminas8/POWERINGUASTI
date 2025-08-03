import { useEffect, useState } from 'react';
import { X, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationToastProps {
  notifications: string[];
  onClear: () => void;
}

export function NotificationToast({ notifications, onClear }: NotificationToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      setVisible(true);
    }
  }, [notifications]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClear, 300); // Attende la fine dell'animazione
  };

  if (!visible || !notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[10001] max-w-sm space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={index}
          className={`
            bg-red-50 dark:bg-red-950/90 border border-red-200 dark:border-red-800 
            rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-out
            ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            backdrop-blur-sm
          `}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <Zap className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-grow">
              <div className="flex items-center space-x-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">
                  Nuovo Guasto - Calabria
                </h4>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                {notification}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-red-500 dark:text-red-400">
                  {new Date().toLocaleTimeString('it-IT', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="p-1 h-6 w-6 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}