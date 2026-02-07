import { WifiOff, CloudOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineIndicator() {
  const { isOnline, pendingCount } = useOnlineStatus();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2 flex items-center gap-2 text-sm">
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4 text-destructive" />
          <span className="text-destructive font-medium">You're offline</span>
          <span className="text-muted-foreground">— data will sync when connected</span>
        </>
      ) : (
        <>
          <CloudOff className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Syncing pending data...</span>
        </>
      )}
      {pendingCount > 0 && (
        <Badge variant="destructive" className="ml-auto">
          {pendingCount} pending
        </Badge>
      )}
    </div>
  );
}
