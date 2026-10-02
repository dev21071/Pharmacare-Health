// Offline Synchronization Queue for Android APK & Mobile Web
import { MedicineReminder } from '../types';
import { storage } from './storage';

interface QueuedDoseLog {
  id: string;
  reminderId: string;
  time: string;
  status: 'taken' | 'skipped' | 'snoozed';
  date: string;
  createdAt: number;
}

const OFFLINE_DOSES_KEY = 'pharmacare_offline_doses_queue';

class OfflineSyncManager {
  private isOnlineStatus: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  public isOnline(): boolean {
    return this.isOnlineStatus;
  }

  public subscribe(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    callback(this.isOnlineStatus);
    return () => this.listeners.delete(callback);
  }

  private handleNetworkChange(online: boolean) {
    this.isOnlineStatus = online;
    this.listeners.forEach((cb) => cb(online));

    if (online) {
      console.log('App is back online. Flushing offline queue...');
      this.flushQueue();
    }
  }

  public queueDoseLog(
    reminderId: string,
    time: string,
    status: 'taken' | 'skipped' | 'snoozed',
    date: string
  ) {
    const queue = this.getQueuedDoses();
    queue.push({
      id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reminderId,
      time,
      status,
      date,
      createdAt: Date.now(),
    });
    try {
      localStorage.setItem(OFFLINE_DOSES_KEY, JSON.stringify(queue));
    } catch {
      // quota limit
    }
  }

  public getQueuedDoses(): QueuedDoseLog[] {
    try {
      const raw = localStorage.getItem(OFFLINE_DOSES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public async flushQueue() {
    const queue = this.getQueuedDoses();
    if (queue.length === 0) return;

    const remaining: QueuedDoseLog[] = [];
    const token = storage.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    for (const item of queue) {
      try {
        const res = await fetch(`/api/reminders/${item.reminderId}/dose`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            date: item.date,
            time: item.time,
            status: item.status,
          }),
        });
        if (!res.ok) {
          remaining.push(item);
        }
      } catch {
        remaining.push(item);
      }
    }

    try {
      localStorage.setItem(OFFLINE_DOSES_KEY, JSON.stringify(remaining));
    } catch {
      // quota limit
    }
  }
}

export const offlineSync = new OfflineSyncManager();
