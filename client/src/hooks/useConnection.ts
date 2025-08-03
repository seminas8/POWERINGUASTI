import { useState, useEffect } from "react";

export function useConnection() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also check connection by trying to fetch a small resource
    const checkConnection = async () => {
      try {
        await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-cache' 
        });
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { isOnline };
}
