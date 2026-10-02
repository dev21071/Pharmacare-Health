import { UserProfile, MedicineReminder, Prescription, Doctor, Appointment, AppLanguage, UserMode, UserRole, CaregiverConnection, CaregiverDashboardData, Medicine } from '../types';
import { INITIAL_SAMPLE_REMINDERS, SEED_HEALTH_TIPS } from '../data/seedData';
import { getResolvedApiBaseUrl } from '../config/api';

const PREFIX = 'pharmacare_';
const DB_NAME = 'pharmacare_vault_db';
const STORE_NAME = 'rx_files';

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storePrescriptionFile(id: string, fileDataUrl: string, fileName: string, fileType: string): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ id, fileDataUrl, fileName, fileType, timestamp: Date.now() });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to store in IndexedDB, saving to localStorage fallback:', err);
    try {
      localStorage.setItem(`${PREFIX}rx_file_${id}`, fileDataUrl);
    } catch {
      // quota limit
    }
  }
}

export async function getPrescriptionFile(id: string): Promise<string | null> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result && request.result.fileDataUrl) {
          resolve(request.result.fileDataUrl);
        } else {
          const fallback = localStorage.getItem(`${PREFIX}rx_file_${id}`);
          resolve(fallback);
        }
      };
      request.onerror = () => {
        const fallback = localStorage.getItem(`${PREFIX}rx_file_${id}`);
        resolve(fallback);
      };
    });
  } catch {
    return localStorage.getItem(`${PREFIX}rx_file_${id}`);
  }
}

export async function deletePrescriptionFile(id: string): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
  } catch {
    // ignore
  }
  localStorage.removeItem(`${PREFIX}rx_file_${id}`);
}

// Local Storage Helpers
export const storage = {
  getToken(): string | null {
    return localStorage.getItem(`${PREFIX}token`);
  },
  setToken(token: string) {
    localStorage.setItem(`${PREFIX}token`, token);
  },
  removeToken() {
    localStorage.removeItem(`${PREFIX}token`);
  },

  getProfile(): UserProfile | null {
    const data = localStorage.getItem(`${PREFIX}profile`);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },
  saveProfile(profile: UserProfile) {
    localStorage.setItem(`${PREFIX}profile`, JSON.stringify(profile));
  },

  getUserMode(userKey?: string): UserMode | null {
    if (userKey) {
      const sanitized = userKey.replace(/[^a-zA-Z0-9]/g, '_');
      const specific = localStorage.getItem(`${PREFIX}mode_${sanitized}`) as UserMode | null;
      if (specific === 'myself' || specific === 'family_caregiver' || specific === 'dual') {
        return specific;
      }
    }
    const profile = this.getProfile();
    if (profile?.mode) return profile.mode;
    if (profile?.role === 'caregiver' || profile?.role === 'family_caregiver') return 'family_caregiver';
    if (profile?.role === 'dual' || profile?.role === 'both') return 'dual';
    if (profile?.role === 'myself' || profile?.role === 'patient') return 'myself';
    return null;
  },

  setUserMode(mode: UserMode, userKey?: string) {
    if (userKey) {
      const sanitized = userKey.replace(/[^a-zA-Z0-9]/g, '_');
      localStorage.setItem(`${PREFIX}mode_${sanitized}`, mode);
    }
    const profile = this.getProfile();
    if (profile) {
      const role: UserRole = mode === 'family_caregiver' ? 'caregiver' : mode;
      const updated: UserProfile = { ...profile, mode, role };
      this.saveProfile(updated);
    }
  },

  getOnboardingDone(): boolean {
    return localStorage.getItem(`${PREFIX}onboarding_done`) === 'true';
  },
  setOnboardingDone(done: boolean = true) {
    localStorage.setItem(`${PREFIX}onboarding_done`, done ? 'true' : 'false');
  },

  getLanguage(): AppLanguage {
    const lang = localStorage.getItem(`${PREFIX}language`) as AppLanguage;
    return lang === 'hi' || lang === 'gu' ? lang : 'en';
  },
  setLanguage(lang: AppLanguage) {
    localStorage.setItem(`${PREFIX}language`, lang);
  },

  getNotificationsEnabled(): boolean {
    return localStorage.getItem(`${PREFIX}notifications_enabled`) === 'true';
  },
  setNotificationsEnabled(enabled: boolean) {
    localStorage.setItem(`${PREFIX}notifications_enabled`, enabled ? 'true' : 'false');
  },

  getReminders(): MedicineReminder[] {
    const data = localStorage.getItem(`${PREFIX}reminders`);
    if (!data) {
      return [];
    }
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter((r: MedicineReminder) => r.id !== 'rem-sample-1' && r.id !== 'rem-sample-2');
      }
      return [];
    } catch {
      return [];
    }
  },
  saveReminders(reminders: MedicineReminder[]) {
    localStorage.setItem(`${PREFIX}reminders`, JSON.stringify(reminders));
  },

  getPrescriptions(): Prescription[] {
    const data = localStorage.getItem(`${PREFIX}prescriptions_meta`);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },
  savePrescriptions(prescriptions: Prescription[]) {
    localStorage.setItem(`${PREFIX}prescriptions_meta`, JSON.stringify(prescriptions));
  },

  getBookmarks(): string[] {
    const data = localStorage.getItem(`${PREFIX}health_tips_bookmarks`);
    if (!data) {
      const initial = SEED_HEALTH_TIPS.filter(t => t.isBookmarked).map(t => t.id);
      this.saveBookmarks(initial);
      return initial;
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },
  saveBookmarks(bookmarks: string[]) {
    localStorage.setItem(`${PREFIX}health_tips_bookmarks`, JSON.stringify(bookmarks));
  },

  getCustomDoctors(): Doctor[] {
    const data = localStorage.getItem(`${PREFIX}custom_doctors`);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },
  saveCustomDoctors(doctors: Doctor[]) {
    localStorage.setItem(`${PREFIX}custom_doctors`, JSON.stringify(doctors));
  },
  saveCustomDoctor(doctor: Doctor) {
    const list = this.getCustomDoctors();
    const idx = list.findIndex((d) => d.id === doctor.id);
    if (idx >= 0) list[idx] = doctor;
    else list.unshift(doctor);
    this.saveCustomDoctors(list);
  },
  deleteCustomDoctor(id: string) {
    const list = this.getCustomDoctors().filter((d) => d.id !== id);
    this.saveCustomDoctors(list);
  },

  getAppointments(): Appointment[] {
    const data = localStorage.getItem(`${PREFIX}appointments`);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },
  saveAppointments(appointments: Appointment[]) {
    localStorage.setItem(`${PREFIX}appointments`, JSON.stringify(appointments));
  },

  getCaregiverConnections(): CaregiverConnection[] {
    const data = localStorage.getItem(`${PREFIX}caregiver_connections`);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },
  saveCaregiverConnections(connections: CaregiverConnection[]) {
    localStorage.setItem(`${PREFIX}caregiver_connections`, JSON.stringify(connections));
  },

  getCaregiverDashboardCache(): any | null {
    const data = localStorage.getItem(`${PREFIX}caregiver_dashboard_cache`);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },
  saveCaregiverDashboardCache(dashboard: any) {
    localStorage.setItem(`${PREFIX}caregiver_dashboard_cache`, JSON.stringify(dashboard));
  },

  getPatientRemindersCache(patientPhone: string): MedicineReminder[] | null {
    const clean = patientPhone.replace(/\D/g, '');
    const data = localStorage.getItem(`${PREFIX}patient_reminders_${clean}`);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },
  savePatientRemindersCache(patientPhone: string, reminders: MedicineReminder[]) {
    const clean = patientPhone.replace(/\D/g, '');
    localStorage.setItem(`${PREFIX}patient_reminders_${clean}`, JSON.stringify(reminders));
  },

  getCustomMedicines(): Medicine[] {
    const data = localStorage.getItem(`${PREFIX}custom_medicines`);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },
  saveCustomMedicines(meds: Medicine[]) {
    localStorage.setItem(`${PREFIX}custom_medicines`, JSON.stringify(meds));
  },
  saveCustomMedicine(medicine: Medicine) {
    const list = this.getCustomMedicines();
    const idx = list.findIndex((m) => m.id === medicine.id);
    if (idx >= 0) list[idx] = medicine;
    else list.unshift(medicine);
    this.saveCustomMedicines(list);
  },
  deleteCustomMedicine(id: string) {
    const list = this.getCustomMedicines().filter((m) => m.id !== id);
    this.saveCustomMedicines(list);
  },

  getActiveCaregiverCode(): { code: string; expiresAt: number; patientName: string; patientPhone?: string } | null {
    const data = localStorage.getItem(`${PREFIX}active_caregiver_code`);
    if (!data) return null;
    try {
      const parsed = JSON.parse(data);
      if (parsed && parsed.code && parsed.expiresAt > Date.now()) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  },
  saveActiveCaregiverCode(codeData: { code: string; expiresAt: number; patientName: string; patientPhone?: string }) {
    localStorage.setItem(`${PREFIX}active_caregiver_code`, JSON.stringify(codeData));
  },
  clearActiveCaregiverCode() {
    localStorage.removeItem(`${PREFIX}active_caregiver_code`);
  },

  getApiBaseUrl(): string {
    return getResolvedApiBaseUrl(localStorage.getItem(`${PREFIX}api_url`) || '');
  },
  setApiBaseUrl(url: string) {
    if (!url) {
      localStorage.removeItem(`${PREFIX}api_url`);
    } else {
      localStorage.setItem(`${PREFIX}api_url`, url);
    }
  },

  exportBackup(): string {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile: this.getProfile(),
      reminders: this.getReminders(),
      prescriptions: this.getPrescriptions(),
      customDoctors: this.getCustomDoctors(),
      appointments: this.getAppointments(),
      bookmarks: this.getBookmarks(),
      language: this.getLanguage(),
    };
    return JSON.stringify(backupData, null, 2);
  },

  async clearLocalData(): Promise<void> {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    try {
      const db = await openIndexedDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
    } catch {
      // ignore
    }
  }
};
