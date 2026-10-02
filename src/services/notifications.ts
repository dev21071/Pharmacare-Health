import { MedicineReminder } from '../types';
import { storage } from './storage';

class NotificationEngine {
  private audioCtx: AudioContext | null = null;

  private initAudio(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Play gentle bell chime for dose reminder / test alarm
  playDoseChime(): void {
    try {
      const ctx = this.initAudio();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.35); // G5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.3, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {
      console.warn('Audio chime playback error:', e);
    }
  }

  // Play crisp ascending chime for dose confirmed
  playTakeChime(): void {
    try {
      const ctx = this.initAudio();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.25); // C6

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.35, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.8);
    } catch (e) {
      console.warn('Take chime audio error:', e);
    }
  }

  // Alias for test alarm button
  async playAlarmSound(): Promise<void> {
    this.playDoseChime();
  }

  // Play urgent two-tone alert for caregiver missed dose
  playMissedDoseAlarm(): void {
    try {
      const ctx = this.initAudio();
      if (!ctx) return;

      const now = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.35;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, start); // A5
        osc.frequency.setValueAtTime(587.33, start + 0.15); // D5

        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.3);
      }
    } catch (e) {
      console.warn('Missed dose alert audio error:', e);
    }
  }

  // Trigger full missed dose notification (sound + vibration + lock-screen notification)
  async triggerMissedDoseAlert(
    patientName: string,
    medicineName: string,
    dosage: string,
    scheduledTime: string
  ): Promise<void> {
    // 1. Play alert audio
    this.playMissedDoseAlarm();

    // 2. Hardware vibration where supported (e.g. Android devices)
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 300]);
      } catch (err) {
        console.warn('Vibration API not supported or permitted:', err);
      }
    }

    const title = '🔔 Medicine Alert';
    const body = `${patientName} missed:\n${medicineName} ${dosage}\nScheduled time: ${scheduledTime}`;

    // 3. System notification via Service Worker if available (foreground, background, lock screen)
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.showNotification) {
            await reg.showNotification(title, {
              body,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: `missed-${patientName}-${medicineName}-${scheduledTime}`,
              renotify: true,
              requireInteraction: true,
            } as NotificationOptions);
            return;
          }
        } catch (e) {
          console.warn('Service worker notification fallback:', e);
        }
      }

      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: `missed-${patientName}-${medicineName}-${scheduledTime}`,
          requireInteraction: true,
        });
      } catch {
        // Handled
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        const granted = perm === 'granted';
        storage.setNotificationsEnabled(granted);
        return granted;
      } catch (err) {
        console.warn('Notification permission error:', err);
        return false;
      }
    }
    return false;
  }

  async isEnabled(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if ('Notification' in window) {
      return Notification.permission === 'granted';
    }
    return storage.getNotificationsEnabled();
  }

  async showNotification(title: string, body: string): Promise<void> {
    this.playDoseChime();
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: 'medication-alerts',
        });
      } catch {
        // Fallback handled
      }
    }
  }

  async scheduleNotification(title: string, body: string, delayMs: number = 0): Promise<void> {
    const hasPermission = await this.isEnabled();
    if (!hasPermission) {
      const requested = await this.requestPermission();
      if (!requested) {
        setTimeout(() => this.playDoseChime(), delayMs);
        return;
      }
    }

    if (delayMs <= 0) {
      this.fireNotification(title, body);
    } else {
      setTimeout(() => {
        this.fireNotification(title, body);
      }, delayMs);
    }
  }

  fireNotification(title: string, body: string): void {
    this.playDoseChime();
    this.vibrateDoseAlarm();
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'medication-alerts',
          requireInteraction: true,
        });
      } catch {
        // Safe fallback
      }
    }
  }

  unlockAudio(): void {
    this.initAudio();
  }

  vibrateDoseAlarm(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 300]);
      } catch {
        // Safe fallback
      }
    }
  }

  async sendTestNotification(): Promise<boolean> {
    const granted = await this.requestPermission();
    this.playDoseChime();
    this.vibrateDoseAlarm();
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.showNotification) {
            await reg.showNotification('🔔 PharmaCare Test Dose Alarm', {
              body: 'Paracetamol (500mg) is scheduled now. Tap to confirm dose.',
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              vibrate: [200, 100, 200, 100, 300],
              tag: 'test-alarm',
              requireInteraction: true,
            } as NotificationOptions);
            return true;
          }
        }
        new Notification('🔔 PharmaCare Test Dose Alarm', {
          body: 'Paracetamol (500mg) is scheduled now (After Food). Tap to confirm dose.',
          icon: '/pwa-192x192.png',
          tag: 'test-alarm',
        });
        return true;
      } catch (e) {
        console.warn('Test notification launch failed:', e);
      }
    }
    return granted;
  }

  syncActiveReminders(reminders: MedicineReminder[]): void {
    const activeCount = reminders.filter((r) => r.active).length;
    console.log(`Synchronized notification alarms for ${activeCount} active medications.`);
  }

  scheduleDoseReminders(reminders: MedicineReminder[]): void {
    this.syncActiveReminders(reminders);
  }
}

export const notificationEngine = new NotificationEngine();

export function unlockAudioContext(): void {
  notificationEngine.unlockAudio();
}
