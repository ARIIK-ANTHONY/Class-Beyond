/*
  Simple IndexedDB wrapper for offline lesson storage.
  - DB name: classbeyond-offline-v1
  - Stores: lessons (keyPath: id)

  Exports promise-based helpers:
    openDB(), saveLesson(), saveLessons(), getLesson(), getAllLessons(), deleteLesson(), clearLessons(), hasLesson()

  Uses the `Lesson` type from @shared/schema if available.
*/

import type { Lesson } from "@shared/schema";

const DB_NAME = "classbeyond-offline-v1";
const DB_VERSION = 1;
const STORE_LESSONS = "lessons";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (ev) => {
      const db = (ev.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_LESSONS)) {
        db.createObjectStore(STORE_LESSONS, { keyPath: "id" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function promisifyRequest<T = any>(request: IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLesson(lesson: Lesson): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_LESSONS, "readwrite");
  const store = tx.objectStore(STORE_LESSONS);
  store.put(lesson as any);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function saveLessons(lessons: Lesson[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_LESSONS, "readwrite");
  const store = tx.objectStore(STORE_LESSONS);
  for (const lesson of lessons) {
    store.put(lesson as any);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function getLesson(id: string): Promise<Lesson | undefined> {
  const db = await openDB();
  const tx = db.transaction(STORE_LESSONS, "readonly");
  const store = tx.objectStore(STORE_LESSONS);
  const req = store.get(id);
  return promisifyRequest<Lesson | undefined>(req);
}

export async function getAllLessons(): Promise<Lesson[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_LESSONS, "readonly");
  const store = tx.objectStore(STORE_LESSONS);
  const req = store.getAll();
  return promisifyRequest<Lesson[]>(req).then((r) => r || []);
}

export async function deleteLesson(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_LESSONS, "readwrite");
  const store = tx.objectStore(STORE_LESSONS);
  store.delete(id as any);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function clearLessons(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_LESSONS, "readwrite");
  const store = tx.objectStore(STORE_LESSONS);
  store.clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function hasLesson(id: string): Promise<boolean> {
  const lesson = await getLesson(id);
  return !!lesson;
}

// Utility: attempt to fetch lesson from network, fall back to indexedDB
export async function fetchLessonWithOfflineFallback(lessonId: string, fetchFn: () => Promise<Lesson>): Promise<Lesson> {
  try {
    const lesson = await fetchFn();
    // save to IDB for offline access
    try {
      await saveLesson(lesson);
    } catch (e) {
      // silently ignore IDB save errors
      console.debug("offlineDB: failed to save lesson", e);
    }
    return lesson;
  } catch (err) {
    // network failed -> try IDB
    const cached = await getLesson(lessonId);
    if (cached) return cached;
    throw err;
  }
}

export default {
  openDB,
  saveLesson,
  saveLessons,
  getLesson,
  getAllLessons,
  deleteLesson,
  clearLessons,
  hasLesson,
  fetchLessonWithOfflineFallback,
};
