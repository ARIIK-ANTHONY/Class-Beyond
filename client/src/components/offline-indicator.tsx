import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <Alert className="fixed top-0 left-0 right-0 z-50 rounded-none border-l-0 border-r-0 border-t-0 bg-destructive text-destructive-foreground">
      <span className="material-icons mr-2">cloud_off</span>
      <AlertDescription data-testid="offline-indicator">
        You are offline. Your progress will sync when connection is restored.
      </AlertDescription>
    </Alert>
  );
}
