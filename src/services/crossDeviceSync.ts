import { Capacitor } from '@capacitor/core';
import { storage } from './storage';
import { ConnectedDevice, DeviceNudge, CrossConnectedDevicesResult, CaregiverAlert, MedicineReminder, CaregiverConnection } from '../types';
import { notificationEngine } from './notifications';
import { safeFetchJson } from './apiHelper';

export interface CrossDeviceSyncListeners {
  onDoseLogged?: (data: {
    patientPhone: string;
    reminderId: string;
    medicineName: string;
    time: string;
    status: string;
    timestamp: number;
    reminder: MedicineReminder;
  }) => void;
  onRemindersUpdated?: (data: { patientPhone: string; reminders: MedicineReminder[] }) => void;
  onMissedDoseAlert?: (alert: CaregiverAlert) => void;
  onDeviceLinked?: (conn: CaregiverConnection) => void;
  onDeviceUnlinked?: (data: { connectionId: string }) => void;
  onDeviceNudge?: (nudge: DeviceNudge) => void;
  onEmergencySos?: (data: { patientPhone: string; patientName: string; location?: string }) => void;
  onStatusChange?: (connected: boolean) => void;
}

class CrossDeviceSyncService {
  private eventSource: EventSource | null = null;
  private listeners: Set<CrossDeviceSyncListeners> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;
  private deviceId: string = '';

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }

  getOrCreateDeviceId(): string {
    if (typeof window === 'undefined') return 'device_server';
    let id = localStorage.getItem('pharmacare_device_id');
    if (!id) {
      const platformPrefix = Capacitor.isNativePlatform() ? 'apk' : 'web';
      id = `ph_${platformPrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      localStorage.setItem('pharmacare_device_id', id);
    }
    return id;
  }

  getDeviceModelName(): string {
    if (Capacitor.isNativePlatform()) {
      return 'Android Smartphone';
    }
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent;
      if (/Android/i.test(ua)) return 'Android Device';
      if (/iPhone|iPad/i.test(ua)) return 'Apple iOS Device';
      if (/Mac/i.test(ua)) return 'Mac Computer';
      if (/Win/i.test(ua)) return 'Windows PC';
    }
    return 'Smart Device';
  }

  getPlatform(): 'android' | 'web' | 'ios' {
    if (Capacitor.isNativePlatform()) return 'android';
    if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)) return 'ios';
    if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)) return 'android';
    return 'web';
  }

  private getBaseUrl(): string {
    return storage.getApiBaseUrl() || '';
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    const token = storage.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const profile = storage.getProfile();
    if (profile?.mobile) {
      headers['X-User-Phone'] = profile.mobile;
    }
    if (profile?.name) {
      headers['X-User-Name'] = profile.name;
    }
    headers['X-Device-Id'] = this.deviceId;
    return headers;
  }

  /**
   * Register this physical device on the production cross-connection backend
   */
  async registerCurrentDevice(): Promise<ConnectedDevice | null> {
    const profile = storage.getProfile();
    if (!profile || !profile.mobile) return null;

    try {
      const res = await safeFetchJson<{ device: ConnectedDevice }>(`${this.getBaseUrl()}/api/devices/register`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          deviceId: this.deviceId,
          deviceName: this.getDeviceModelName(),
          platform: this.getPlatform(),
          appVersion: '1.0.0',
          role: profile.mode || profile.role || 'myself',
        }),
      });
      if (res.ok && res.data) {
        return res.data.device;
      }
    } catch (e) {
      console.warn('[CrossDeviceSync] Device registration postponed (offline):', e);
    }
    return null;
  }

  /**
   * Starts periodic device heartbeat
   */
  startHeartbeat(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(async () => {
      try {
        await fetch(`${this.getBaseUrl()}/api/devices/heartbeat`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ deviceId: this.deviceId }),
        });
      } catch {
        // silent
      }
    }, 30000);
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Connect to real-time Server-Sent Events stream from the backend
   */
  connect(): void {
    const profile = storage.getProfile();
    const token = storage.getToken() || '';
    if (!profile || !profile.mobile) return;

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    const query = new URLSearchParams({
      phone: profile.mobile,
      deviceId: this.deviceId,
    });
    if (token) query.append('token', token);

    const streamUrl = `${this.getBaseUrl()}/api/devices/stream?${query.toString()}`;

    try {
      this.eventSource = new EventSource(streamUrl);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.notifyStatus(true);
        this.registerCurrentDevice();
        this.startHeartbeat();
      };

      this.eventSource.addEventListener('init', () => {
        this.isConnected = true;
        this.notifyStatus(true);
      });

      this.eventSource.addEventListener('heartbeat', () => {
        // heartbeat received from server
      });

      this.eventSource.addEventListener('dose_logged', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.listeners.forEach((l) => l.onDoseLogged?.(data.payload));
        } catch (err) {
          console.error('[CrossDeviceSync] Error parsing dose_logged:', err);
        }
      });

      this.eventSource.addEventListener('reminders_updated', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.listeners.forEach((l) => l.onRemindersUpdated?.(data.payload));
        } catch (err) {
          console.error('[CrossDeviceSync] Error parsing reminders_updated:', err);
        }
      });

      this.eventSource.addEventListener('missed_dose_alert', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          const alert = data.payload || data;
          notificationEngine.triggerMissedDoseAlert(
            alert.patientName || 'Family Member',
            alert.medicineName || 'Medication',
            alert.dosage || '',
            alert.scheduledTime || ''
          );
          this.listeners.forEach((l) => l.onMissedDoseAlert?.(alert));
        } catch (err) {
          console.error('[CrossDeviceSync] Error parsing missed_dose_alert:', err);
        }
      });

      this.eventSource.addEventListener('device_linked', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          const conn = data.payload || data;
          this.listeners.forEach((l) => l.onDeviceLinked?.(conn));
        } catch (err) {
          console.error('[CrossDeviceSync] Error parsing device_linked:', err);
        }
      });

      this.eventSource.addEventListener('device_unlinked', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.listeners.forEach((l) => l.onDeviceUnlinked?.(data.payload));
        } catch (err) {
          console.error('[CrossDeviceSync] Error parsing device_unlinked:', err);
        }
      });

      this.eventSource.addEventListener('device_nudge', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          const nudge = data.payload || data;
          notificationEngine.playTakeChime();
          this.listeners.forEach((l) => l.onDeviceNudge?.(nudge));
        } catch (err) {
          console.error('[CrossDeviceSync] Error parsing device_nudge:', err);
        }
      });

      this.eventSource.addEventListener('emergency_sos', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          const sos = data.payload || data;
          notificationEngine.triggerMissedDoseAlert(
            sos.patientName || 'Family Member',
            'EMERGENCY SOS ALERT',
            'Immediate Attention Required',
            new Date().toLocaleTimeString()
          );
          this.listeners.forEach((l) => l.onEmergencySos?.(sos));
        } catch (err) {
          console.error('[CrossDeviceSync] Error parsing emergency_sos:', err);
        }
      });

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.notifyStatus(false);
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        // Auto-reconnect with 5s delay
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => {
          this.connect();
        }, 5000);
      };
    } catch (e) {
      console.warn('[CrossDeviceSync] EventSource setup error:', e);
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.stopHeartbeat();
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
    this.notifyStatus(false);
  }

  private notifyStatus(connected: boolean): void {
    this.listeners.forEach((l) => l.onStatusChange?.(connected));
  }

  subscribe(listener: CrossDeviceSyncListeners): () => void {
    this.listeners.add(listener);
    // Immediately emit current connection status
    listener.onStatusChange?.(this.isConnected);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Send a gentle remote reminder nudge from caregiver to patient device
   */
  async sendNudge(toPhone: string, message?: string, medicineName?: string, toName?: string): Promise<DeviceNudge> {
    const res = await safeFetchJson<{ nudge: DeviceNudge }>(`${this.getBaseUrl()}/api/devices/nudge`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        toPhone,
        toName,
        message,
        medicineName,
      }),
    });
    if (!res.ok || !res.data) {
      throw new Error(res.error || 'Failed to send remote reminder');
    }
    return res.data.nudge;
  }

  /**
   * Send an emergency SOS signal to all connected caregiver devices
   */
  async sendEmergencySos(location?: string): Promise<{ success: boolean; alertedCaregiversCount: number }> {
    const res = await safeFetchJson<{ success: boolean; alertedCaregiversCount: number }>(`${this.getBaseUrl()}/api/devices/sos`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ location }),
    });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to dispatch SOS alert');
    return res.data;
  }

  /**
   * Query cross-connected devices (own devices and partner devices)
   */
  async getCrossConnectedDevices(): Promise<CrossConnectedDevicesResult> {
    try {
      const res = await safeFetchJson<CrossConnectedDevicesResult>(`${this.getBaseUrl()}/api/devices/cross-connected`, {
        headers: this.getHeaders(),
      });
      if (res.ok && res.data) {
        return res.data;
      }
    } catch (e) {
      console.warn('[CrossDeviceSync] Failed to fetch cross-connected devices:', e);
    }
    return {
      myDevices: [],
      connectedMembers: [],
    };
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const crossDeviceSync = new CrossDeviceSyncService();
