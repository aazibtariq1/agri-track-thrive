import { useState, useEffect, useCallback } from "react";
import { syncQueue, getQueueCount } from "@/lib/offline-queue";
import { toast } from "@/hooks/use-toast";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(getQueueCount());

  const refreshPendingCount = useCallback(() => {
    setPendingCount(getQueueCount());
  }, []);

  useEffect(() => {
    const onOnline = async () => {
      setIsOnline(true);
      const count = getQueueCount();
      if (count > 0) {
        const { synced, failed } = await syncQueue();
        refreshPendingCount();
        if (synced > 0) {
          toast({
            title: "Data synced",
            description: `${synced} offline ${synced === 1 ? 'entry' : 'entries'} synced successfully.${failed > 0 ? ` ${failed} failed.` : ''}`,
          });
        }
      }
    };

    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [refreshPendingCount]);

  return { isOnline, pendingCount, refreshPendingCount };
}
