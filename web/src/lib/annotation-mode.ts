import { useSyncExternalStore } from 'react';

/**
 * Tiny global store for the developer "annotation mode" toggle. When on, every
 * InfoDot is emphasised so a developer can spot/annotate boxes at a glance.
 * Persisted in localStorage and shared across components via a subscription.
 */
const KEY = 'p91_annotation_mode';
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function setAnnotationMode(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useAnnotationMode(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
