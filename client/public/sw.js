// ClassBeyond Service Worker
// Version 1.0.0

const CACHE_NAME = 'classbeyond-v1';
const RUNTIME_CACHE = 'classbeyond-runtime-v1';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim()) // Take control immediately
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other schemes
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Strategy: Network First, fallback to Cache (for API calls)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Strategy: Cache First, fallback to Network (for static assets)
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/)
  ) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Strategy: Network First for HTML
  event.respondWith(networkFirstStrategy(request));
});

// Network First Strategy
async function networkFirstStrategy(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, serving from cache:', request.url);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response(
        '<h1>Offline</h1><p>You are currently offline. Please check your connection.</p>',
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
    
    throw error;
  }
}

// Cache First Strategy
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Refresh cache in background
    fetch(request).then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse);
      }
    }).catch(() => {
      // Network failed, but we have cache
    });
    
    return cachedResponse;
  }
  
  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Fetch failed:', error);
    throw error;
  }
}

// Background Sync - Sync data when connection returns
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'sync-quiz-submissions') {
    event.waitUntil(syncQuizSubmissions());
  }
  
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncStudentProgress());
  }
});

// Sync quiz submissions from IndexedDB to server
async function syncQuizSubmissions() {
  try {
    // Get pending submissions from IndexedDB
    const db = await openDatabase();
    const tx = db.transaction('pendingSubmissions', 'readonly');
    const store = tx.objectStore('pendingSubmissions');
    const submissions = await store.getAll();
    
    // Send each submission to server
    for (const submission of submissions) {
      try {
        const response = await fetch('/api/quizzes/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submission.data),
        });
        
        if (response.ok) {
          // Remove from pending queue
          const deleteTx = db.transaction('pendingSubmissions', 'readwrite');
          const deleteStore = deleteTx.objectStore('pendingSubmissions');
          await deleteStore.delete(submission.id);
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync submission:', error);
      }
    }
    
    console.log('[ServiceWorker] Quiz submissions synced');
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
  }
}

// Sync student progress
async function syncStudentProgress() {
  try {
    const db = await openDatabase();
    const tx = db.transaction('pendingProgress', 'readonly');
    const store = tx.objectStore('pendingProgress');
    const progressUpdates = await store.getAll();
    
    for (const update of progressUpdates) {
      try {
        const response = await fetch('/api/student/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update.data),
        });
        
        if (response.ok) {
          const deleteTx = db.transaction('pendingProgress', 'readwrite');
          const deleteStore = deleteTx.objectStore('pendingProgress');
          await deleteStore.delete(update.id);
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync progress:', error);
      }
    }
    
    console.log('[ServiceWorker] Progress synced');
  } catch (error) {
    console.error('[ServiceWorker] Progress sync failed:', error);
  }
}

// Helper to open IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ClassBeyondDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pendingSubmissions')) {
        db.createObjectStore('pendingSubmissions', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('pendingProgress')) {
        db.createObjectStore('pendingProgress', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('cachedLessons')) {
        db.createObjectStore('cachedLessons', { keyPath: 'id' });
      }
    };
  });
}

// Message handler - communicate with main thread
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_LESSONS') {
    cacheUserLessons(event.data.lessons);
  }
});

// Cache specific lessons for offline use
async function cacheUserLessons(lessons) {
  try {
    const db = await openDatabase();
    const tx = db.transaction('cachedLessons', 'readwrite');
    const store = tx.objectStore('cachedLessons');
    
    for (const lesson of lessons) {
      await store.put(lesson);
    }
    
    console.log('[ServiceWorker] Lessons cached for offline use:', lessons.length);
  } catch (error) {
    console.error('[ServiceWorker] Failed to cache lessons:', error);
  }
}
