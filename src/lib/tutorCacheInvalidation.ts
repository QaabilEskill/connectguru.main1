import { TUTOR_AUDIO_VERSION, TUTOR_BUILD_ID, TUTOR_CACHE_VERSION } from '@/lib/tutorBuild';

export type TutorCacheStatus = {
  buildId: string;
  audioVersion: string;
  cacheVersion: string;
  route: string;
  checkedAt: number;
  reason: string;
  isTutorRoute: boolean;
  previousBuildId: string | null;
  latestLoaded: boolean;
  cacheStorageSupported: boolean;
  deletedCacheNames: string[];
  serviceWorkerSupported: boolean;
  serviceWorkersFound: number;
  serviceWorkersUnregistered: number;
  scriptUrls: string[];
  tutorScriptUrls: string[];
  reloadScheduled: boolean;
  error?: string;
};

const STORAGE_KEY = 'connectguru:tutor-build-id';
const RELOAD_KEY = `connectguru:tutor-reloaded:${TUTOR_BUILD_ID}`;
const listeners = new Set<(status: TutorCacheStatus) => void>();

let status: TutorCacheStatus = {
  buildId: TUTOR_BUILD_ID,
  audioVersion: TUTOR_AUDIO_VERSION,
  cacheVersion: TUTOR_CACHE_VERSION,
  route: typeof window === 'undefined' ? '' : `${window.location.pathname}${window.location.search}`,
  checkedAt: Date.now(),
  reason: 'initial',
  isTutorRoute: false,
  previousBuildId: null,
  latestLoaded: true,
  cacheStorageSupported: typeof window !== 'undefined' && 'caches' in window,
  deletedCacheNames: [],
  serviceWorkerSupported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
  serviceWorkersFound: 0,
  serviceWorkersUnregistered: 0,
  scriptUrls: [],
  tutorScriptUrls: [],
  reloadScheduled: false,
};

export function isTutorRoute(pathname = typeof window === 'undefined' ? '' : window.location.pathname) {
  return /^\/(?:tutor(?:\/|$)|admin\/tutor(?:\/|$))/.test(pathname);
}

function publish(next: TutorCacheStatus) {
  status = next;
  if (typeof window !== 'undefined') {
    (window as unknown as { __tutorCacheStatus: () => TutorCacheStatus }).__tutorCacheStatus = getTutorCacheStatus;
    console.log('[TUTOR-CACHE]', next);
  }
  listeners.forEach((listener) => listener(next));
}

function readScriptUrls() {
  if (typeof document === 'undefined') return [];
  return Array.from(document.scripts).map((script) => script.src).filter(Boolean);
}

function isTutorCacheName(name: string) {
  return /tutor|tts|audio|vite|workbox|assets|lovable|supabase/i.test(name);
}

export function getTutorCacheStatus() {
  return { ...status, deletedCacheNames: status.deletedCacheNames.slice(), scriptUrls: status.scriptUrls.slice(), tutorScriptUrls: status.tutorScriptUrls.slice() };
}

export function subscribeTutorCacheStatus(listener: (status: TutorCacheStatus) => void) {
  listeners.add(listener);
  listener(getTutorCacheStatus());
  return () => { listeners.delete(listener); };
}

export async function invalidateTutorCaches(reason = 'manual') {
  if (typeof window === 'undefined') return getTutorCacheStatus();

  const route = `${window.location.pathname}${window.location.search}`;
  const previousBuildId = window.localStorage.getItem(STORAGE_KEY);
  const scriptUrls = readScriptUrls();
  const tutorScriptUrls = scriptUrls.filter((url) => /tutor|assets\/(?:index|entry|main)-/i.test(url));
  const deletedCacheNames: string[] = [];
  let serviceWorkersFound = 0;
  let serviceWorkersUnregistered = 0;
  let error: string | undefined;

  try {
    if ('caches' in window) {
      const names = await window.caches.keys();
      await Promise.all(names.filter(isTutorCacheName).map(async (name) => {
        if (await window.caches.delete(name)) deletedCacheNames.push(name);
      }));
    }

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      serviceWorkersFound = registrations.length;
      const results = await Promise.all(registrations.map((registration) => registration.unregister()));
      serviceWorkersUnregistered = results.filter(Boolean).length;
    }

    window.localStorage.setItem(STORAGE_KEY, TUTOR_BUILD_ID);
  } catch (e) {
    error = String((e as Error)?.message ?? e);
  }

  const next: TutorCacheStatus = {
    buildId: TUTOR_BUILD_ID,
    audioVersion: TUTOR_AUDIO_VERSION,
    cacheVersion: TUTOR_CACHE_VERSION,
    route,
    checkedAt: Date.now(),
    reason,
    isTutorRoute: isTutorRoute(),
    previousBuildId,
    latestLoaded: true,
    cacheStorageSupported: 'caches' in window,
    deletedCacheNames,
    serviceWorkerSupported: 'serviceWorker' in navigator,
    serviceWorkersFound,
    serviceWorkersUnregistered,
    scriptUrls,
    tutorScriptUrls,
    reloadScheduled: false,
    error,
  };

  const buildChanged = Boolean(previousBuildId && previousBuildId !== TUTOR_BUILD_ID);
  if (next.isTutorRoute && buildChanged && !window.sessionStorage.getItem(RELOAD_KEY)) {
    next.reloadScheduled = true;
    publish(next);
    window.sessionStorage.setItem(RELOAD_KEY, '1');
    const url = new URL(window.location.href);
    url.searchParams.set('tutor_v', TUTOR_BUILD_ID);
    window.setTimeout(() => window.location.replace(url.toString()), 50);
    return next;
  }

  publish(next);
  return next;
}