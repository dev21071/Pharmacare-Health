import { MedicineReminder, CaregiverConnection, Medicine } from '../types.ts';
import { INITIAL_SAMPLE_REMINDERS, SEED_MEDICINES } from '../data/seedData.ts';
import { storage } from './storage.ts';

/**
 * Isolated Offline Demo API Helpers
 * Used only when explicitly in demo / mock mode.
 * Real backend database operations remain primary.
 */
export const demoApi = {
  isDemo(): boolean {
    const env = import.meta.env?.VITE_DEMO_MODE;
    return env === 'true' || env === true || env === '1';
  },

  async getReminders(): Promise<MedicineReminder[]> {
    return storage.getReminders().length > 0 ? storage.getReminders() : INITIAL_SAMPLE_REMINDERS;
  },

  async saveReminder(reminder: Partial<MedicineReminder>): Promise<MedicineReminder> {
    const id = reminder.id || `demo_rem_${Date.now()}`;
    const full: MedicineReminder = {
      id,
      medicineName: reminder.medicineName || 'Medicine',
      genericName: reminder.genericName || '',
      dosage: reminder.dosage || '1 Tablet',
      frequency: reminder.frequency || 'Once Daily',
      times: reminder.times || ['09:00'],
      startDate: reminder.startDate || new Date().toISOString().split('T')[0],
      endDate: reminder.endDate,
      instructions: reminder.instructions || 'After Food',
      active: reminder.active !== false,
      notes: reminder.notes || '',
      colorTag: reminder.colorTag || '#0EA5E9',
      doseLogs: reminder.doseLogs || [],
      createdAt: reminder.createdAt || Date.now(),
    };
    const all = storage.getReminders();
    const idx = all.findIndex(r => r.id === full.id);
    if (idx >= 0) all[idx] = full;
    else all.unshift(full);
    storage.saveReminders(all);
    return full;
  },

  async deleteReminder(id: string): Promise<boolean> {
    const all = storage.getReminders().filter(r => r.id !== id);
    storage.saveReminders(all);
    return true;
  },

  async generateCode(): Promise<{ success: boolean; code: string; expiresAt: number; secondsRemaining: number }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000;
    return {
      success: true,
      code,
      expiresAt,
      secondsRemaining: 900,
    };
  },
};

export default demoApi;
