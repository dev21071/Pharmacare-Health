import { Capacitor } from '@capacitor/core';

/**
 * Default production backend URL placeholder (if a user deploys custom backend)
 */
export const DEFAULT_PRODUCTION_BACKEND_URL = '';

/**
 * Detect whether app is executing inside native Capacitor container (Android / iOS)
 */
export function isNativePlatform(): boolean {
  try {
    if (Capacitor.isNativePlatform()) return true;
    if (typeof window !== 'undefined') {
      const proto = window.location.protocol;
      if (proto === 'capacitor:' || proto === 'ionic:') return true;
      if (window.location.hostname === 'localhost' && !window.location.port) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Detect whether app is hosted on Vercel
 */
export function isVercelDeployment(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname.endsWith('.vercel.app') ||
    window.location.hostname.includes('vercel')
  );
}

/**
 * Centralized API Base URL from environment variables
 */
const RAW_VITE_API = (
  (import.meta.env?.VITE_API_BASE_URL as string) ||
  (import.meta.env?.VITE_API_URL as string) ||
  (import.meta.env?.VITE_APP_URL as string) ||
  ''
).trim().replace(/\/+$/, '');

// Filter out known unreachable preview sandbox URLs
export const API_BASE_URL: string =
  RAW_VITE_API.includes('ais-pre-zantkqu2k2mm4gv4fk55iw') ? '' : RAW_VITE_API;

/**
 * Resolve the effective API Base URL taking into account user settings,
 * native environment, Vercel deployments, and default environment variables.
 */
export function getResolvedApiBaseUrl(savedUrl?: string): string {
  // 1. Explicitly passed user custom URL
  if (savedUrl && typeof savedUrl === 'string' && savedUrl.trim()) {
    const trimmed = savedUrl.trim().replace(/\/+$/, '');
    if (!trimmed.includes('ais-pre-zantkqu2k2mm4gv4fk55iw')) {
      return trimmed;
    }
  }

  // 2. Local storage check
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('pharmacare_api_url');
      if (local && typeof local === 'string' && local.trim()) {
        const trimmed = local.trim().replace(/\/+$/, '');
        if (trimmed.includes('ais-pre-zantkqu2k2mm4gv4fk55iw')) {
          localStorage.removeItem('pharmacare_api_url');
        } else {
          return trimmed;
        }
      }
    } catch {
      // Ignore local storage error
    }
  }

  // 3. Centralized environment base URL
  if (API_BASE_URL) {
    return API_BASE_URL;
  }

  // 4. Default: empty string for same-origin relative /api calls in web,
  // and local-first fallback in native APK mode
  return '';
}
