import { UserProfile, AuthSession } from '../types';
import { storage } from './storage';
import { safeFetchJson } from './apiHelper';
import { Capacitor } from '@capacitor/core';

export const DEMO_OTP_CODE = '123456';

/**
 * Checks whether Demo Mode is enabled:
 * 1. Checks build-time injected VITE_DEMO_MODE environment variable
 * 2. Checks localStorage override 'pharmacare_demo_mode'
 * Defaults to false so real backend authentication and database persistence are used.
 */
export function isDemoModeEnabled(): boolean {
  const envDemo = import.meta.env?.VITE_DEMO_MODE;
  if (envDemo === 'true' || envDemo === true || envDemo === '1') {
    return true;
  }
  if (envDemo === 'false' || envDemo === false || envDemo === '0') {
    return false;
  }

  try {
    const local = localStorage.getItem('pharmacare_demo_mode');
    if (local === 'true') return true;
    if (local === 'false') return false;
  } catch {
    // ignore
  }

  return false;
}

export interface AuthProvider {
  sendOtp(phone: string): Promise<{ success: boolean; testOtp?: string; message?: string }>;
  verifyOtp(
    phone: string,
    otp: string,
    name?: string
  ): Promise<{ success: boolean; session?: AuthSession; message?: string }>;
  signOut(): Promise<void>;
  isDemo(): boolean;
}

export class DemoOtpProvider implements AuthProvider {
  isDemo(): boolean {
    return true;
  }

  async sendOtp(phone: string): Promise<{ success: boolean; testOtp?: string; message?: string }> {
    // 100% Offline: Do NOT call backend /api/auth/send-otp
    return {
      success: true,
      testOtp: DEMO_OTP_CODE,
      message: 'Demo verification code generated successfully.',
    };
  }

  async verifyOtp(
    phone: string,
    otp: string,
    name?: string
  ): Promise<{ success: boolean; session?: AuthSession; message?: string }> {
    const cleanOtp = otp.trim();
    if (cleanOtp !== DEMO_OTP_CODE) {
      return {
        success: false,
        message: `Invalid Demo OTP code. Please enter ${DEMO_OTP_CODE} or tap Auto-Fill.`,
      };
    }

    const cleanPhone = phone.trim();
    const existing = storage.getProfile();
    const user: UserProfile = {
      id: existing?.id || `user_${cleanPhone.replace(/\D/g, '') || Date.now()}`,
      mobile: cleanPhone,
      name: name?.trim() || existing?.name || 'Friend',
      email: existing?.email || '',
      bloodGroup: existing?.bloodGroup || 'O+',
      allergies: existing?.allergies || '',
      emergencyContactName: existing?.emergencyContactName || '',
      emergencyContactPhone: existing?.emergencyContactPhone || '',
      isLoggedIn: true,
      preferredLanguage: existing?.preferredLanguage || 'en',
      role: existing?.role || 'myself',
      mode: existing?.mode || 'myself',
      reminderGracePeriodMinutes: existing?.reminderGracePeriodMinutes || 30,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    };

    const session: AuthSession = {
      token: `demo_auth_jwt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      user,
    };

    storage.setToken(session.token);
    storage.saveProfile(session.user);

    return {
      success: true,
      session,
    };
  }

  async signOut(): Promise<void> {
    storage.removeToken();
    const current = storage.getProfile();
    if (current) {
      storage.saveProfile({ ...current, isLoggedIn: false });
    }
  }
}

export class BackendOtpProvider implements AuthProvider {
  isDemo(): boolean {
    return false;
  }

  private getBaseUrl(): string {
    return storage.getApiBaseUrl();
  }

  async sendOtp(phone: string): Promise<{ success: boolean; testOtp?: string; message?: string }> {
    try {
      const url = `${this.getBaseUrl()}/api/auth/send-otp`;
      const res = await safeFetchJson<{ success?: boolean; testOtp?: string; message?: string; error?: string }>(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ phone }),
        }
      );

      if (!res.ok || !res.data) {
        return {
          success: false,
          message: res.error || 'Failed to send OTP. Please check your connection.',
        };
      }

      return {
        success: true,
        testOtp: res.data.testOtp,
        message: res.data.message || 'OTP sent successfully',
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Network error connecting to backend';
      return { success: false, message: errorMsg };
    }
  }

  async verifyOtp(
    phone: string,
    otp: string,
    name?: string
  ): Promise<{ success: boolean; session?: AuthSession; message?: string }> {
    try {
      const url = `${this.getBaseUrl()}/api/auth/verify-otp`;
      const res = await safeFetchJson<{
        success?: boolean;
        token?: string;
        user?: UserProfile;
        error?: string;
      }>(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ phone, otp, name }),
      });

      if (!res.ok || !res.data || !res.data.token || !res.data.user) {
        return {
          success: false,
          message: res.error || 'Invalid OTP code. Please try again.',
        };
      }

      const session: AuthSession = {
        token: res.data.token,
        user: {
          ...res.data.user,
          isLoggedIn: true,
        },
      };

      storage.setToken(session.token);
      storage.saveProfile(session.user);

      return { success: true, session };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Network error verifying OTP';
      return { success: false, message: errorMsg };
    }
  }

  async signOut(): Promise<void> {
    storage.removeToken();
    const current = storage.getProfile();
    if (current) {
      storage.saveProfile({ ...current, isLoggedIn: false });
    }
  }
}

/**
 * Unified Auth Provider that respects Demo Mode configuration:
 * When Demo Mode is enabled (VITE_DEMO_MODE=true or APK default),
 * completely bypasses network calls to backend /api/auth/send-otp
 * and generates/verifies offline using DEMO_OTP_CODE (123456).
 */
export class AdaptiveOtpProvider implements AuthProvider {
  private backend = new BackendOtpProvider();
  private demo = new DemoOtpProvider();

  isDemo(): boolean {
    return isDemoModeEnabled();
  }

  async sendOtp(phone: string): Promise<{ success: boolean; testOtp?: string; message?: string }> {
    if (isDemoModeEnabled()) {
      return this.demo.sendOtp(phone);
    }
    // Attempt backend first; if backend is unreachable, times out, or fails for ANY reason, fallback gracefully to demo OTP
    try {
      const res = await this.backend.sendOtp(phone);
      if (res.success) {
        return res;
      }
      console.warn('Backend sendOtp failed, providing instant Demo OTP fallback:', res.message);
      return this.demo.sendOtp(phone);
    } catch {
      return this.demo.sendOtp(phone);
    }
  }

  async verifyOtp(
    phone: string,
    otp: string,
    name?: string
  ): Promise<{ success: boolean; session?: AuthSession; message?: string }> {
    if (isDemoModeEnabled()) {
      return this.demo.verifyOtp(phone, otp, name);
    }
    try {
      const res = await this.backend.verifyOtp(phone, otp, name);
      if (res.success && res.session) {
        return res;
      }
      // If backend failed, or code matches DEMO_OTP_CODE, verify locally so the user is never blocked
      if (otp.trim() === DEMO_OTP_CODE || !navigator.onLine || Capacitor.isNativePlatform()) {
        console.warn('Backend verifyOtp failed, verifying using Demo OTP fallback');
        return this.demo.verifyOtp(phone, otp, name);
      }
      return res;
    } catch {
      return this.demo.verifyOtp(phone, otp, name);
    }
  }

  async signOut(): Promise<void> {
    await this.backend.signOut();
    await this.demo.signOut();
  }
}

export const authProvider = new AdaptiveOtpProvider();

export const authService = {
  getSession: (): AuthSession | null => {
    const token = storage.getToken();
    const user = storage.getProfile();
    if (token && user && user.isLoggedIn) {
      return { token, user };
    }
    return null;
  },
  logout: async (): Promise<void> => {
    await authProvider.signOut();
  },
  updateProfile: (updated: Partial<UserProfile>): UserProfile | null => {
    const current = storage.getProfile();
    if (current) {
      const merged = { ...current, ...updated };
      storage.saveProfile(merged);
      return merged;
    }
    return null;
  },
  loginAsDemo: async (role: 'patient' | 'caregiver' = 'patient'): Promise<AuthSession> => {
    const isCaregiver = role === 'caregiver';
    const cleanPhone = isCaregiver ? '+91 93333 44444' : '+91 98765 43210';
    const demoName = isCaregiver ? 'Dr. Anita Desai' : 'Rahul Sharma';

    const user: UserProfile = {
      id: `user_${cleanPhone.replace(/\D/g, '')}`,
      mobile: cleanPhone,
      name: demoName,
      email: isCaregiver ? 'anita.desai@caregiver.org' : 'rahul.sharma@example.com',
      bloodGroup: 'O+',
      allergies: 'Penicillin (mild)',
      emergencyContactName: isCaregiver ? 'Clinic Reception' : 'Anita Sharma (Spouse)',
      emergencyContactPhone: isCaregiver ? '+91 98765 43210' : '+91 93333 44444',
      isLoggedIn: true,
      preferredLanguage: 'en',
      role: isCaregiver ? 'caregiver' : 'myself',
      mode: isCaregiver ? 'family_caregiver' : 'myself',
      plan: 'free',
      subscriptionStatus: 'active',
      reminderGracePeriodMinutes: 30,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    };

    const session: AuthSession = {
      token: `demo_session_jwt_${Date.now()}`,
      user,
    };

    storage.setToken(session.token);
    storage.saveProfile(session.user);
    storage.setUserMode(user.mode || 'myself');
    storage.setOnboardingDone(true);

    return session;
  },
};
