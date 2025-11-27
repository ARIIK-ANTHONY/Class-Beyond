// Service Worker Registration and Management

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('✅ Service Worker registered:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          console.log('🔄 New version available! Refresh to update.');
          
          // Optionally show update notification
          if (confirm('A new version of ClassBeyond is available. Refresh to update?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      });
    });

    // Auto-update on page reload
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
};

export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const success = await registration.unregister();
      console.log('Service Worker unregistered:', success);
      return success;
    }
    return false;
  } catch (error) {
    console.error('Failed to unregister Service Worker:', error);
    return false;
  }
};

// Check if app is installed as PWA
export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};

// Show notification
export const showNotification = async (
  title: string,
  options?: NotificationOptions
): Promise<void> => {
  const permission = await requestNotificationPermission();
  
  if (permission !== 'granted') {
    console.warn('Notification permission denied');
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    registration.showNotification(title, {
      icon: '/favicon.png',
      badge: '/favicon.png',
      ...options,
    });
  }
};

// Cache lessons for offline use
export const cacheLessonsForOffline = async (lessons: any[]): Promise<void> => {
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration && registration.active) {
    registration.active.postMessage({
      type: 'CACHE_LESSONS',
      lessons,
    });
  }
};

// Sync data when back online
export const requestBackgroundSync = async (tag: string): Promise<void> => {
  const registration = await navigator.serviceWorker.ready;
  
  if ('sync' in registration) {
    try {
      await (registration as any).sync.register(tag);
      console.log(`Background sync registered: ${tag}`);
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  } else {
    console.warn('Background Sync not supported');
  }
};

// Check online status
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Listen for online/offline events
export const onConnectionChange = (callback: (online: boolean) => void): (() => void) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Get service worker status
export const getServiceWorkerStatus = async (): Promise<string> => {
  if (!('serviceWorker' in navigator)) {
    return 'not-supported';
  }

  const registration = await navigator.serviceWorker.getRegistration();
  
  if (!registration) {
    return 'not-registered';
  }

  if (registration.active) {
    return 'active';
  }

  if (registration.installing) {
    return 'installing';
  }

  if (registration.waiting) {
    return 'waiting';
  }

  return 'unknown';
};
