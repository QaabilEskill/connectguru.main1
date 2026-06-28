declare const __TUTOR_BUILD_ID__: string;
declare const __TUTOR_CACHE_VERSION__: string;

export const TUTOR_BUILD_ID =
  typeof __TUTOR_BUILD_ID__ !== 'undefined' ? __TUTOR_BUILD_ID__ : `dev-${Date.now()}`;

export const TUTOR_CACHE_VERSION =
  typeof __TUTOR_CACHE_VERSION__ !== 'undefined' ? __TUTOR_CACHE_VERSION__ : `tutor-${TUTOR_BUILD_ID}`;

export const TUTOR_AUDIO_VERSION = `audio-${TUTOR_BUILD_ID}`;

declare global {
  interface Window {
    __tutorBuildId?: string;
    __tutorAudioVersion?: string;
  }
}

if (typeof window !== 'undefined') {
  window.__tutorBuildId = TUTOR_BUILD_ID;
  window.__tutorAudioVersion = TUTOR_AUDIO_VERSION;
}