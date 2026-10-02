import type { Response } from 'express';
import { EventEmitter } from 'events';
import { phonesMatch } from './repository.ts';
import type { ConnectedDevice, DeviceNudge, MedicineReminder, CaregiverAlert, CaregiverConnection } from '../src/types.ts';

export type CrossDeviceEventType =
  | 'init'
  | 'heartbeat'
  | 'device_registered'
  | 'dose_logged'
  | 'reminders_updated'
  | 'missed_dose_alert'
  | 'device_linked'
  | 'device_unlinked'
  | 'device_nudge'
  | 'emergency_sos';

export interface CrossDeviceMessage<T = unknown> {
  type: CrossDeviceEventType;
  payload: T;
  timestamp: number;
}

interface SseClient {
  id: string;
  userPhone: string;
  deviceId?: string;
  res: Response;
  connectedAt: number;
}

export class CrossDeviceHub extends EventEmitter {
  private clients: Map<string, SseClient> = new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startHeartbeat();
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    // Ping every 25 seconds to keep SSE connections alive across proxies & Cloud Run
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      for (const client of this.clients.values()) {
        try {
          client.res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: now })}\n\n`);
        } catch {
          this.removeClient(client.id);
        }
      }
    }, 25000);
    if (this.heartbeatTimer && typeof this.heartbeatTimer.unref === 'function') {
      this.heartbeatTimer.unref();
    }
  }

  addClient(id: string, userPhone: string, deviceId: string | undefined, res: Response): void {
    // Set proper SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const client: SseClient = {
      id,
      userPhone,
      deviceId,
      res,
      connectedAt: Date.now(),
    };

    this.clients.set(id, client);

    // Initial connection confirmation
    res.write(`event: init\ndata: ${JSON.stringify({ status: 'connected', clientId: id, timestamp: Date.now() })}\n\n`);

    res.on('close', () => {
      this.removeClient(id);
    });
  }

  removeClient(id: string): void {
    this.clients.delete(id);
  }

  getClientsForPhone(phone: string): SseClient[] {
    const list: SseClient[] = [];
    for (const client of this.clients.values()) {
      if (phonesMatch(client.userPhone, phone)) {
        list.push(client);
      }
    }
    return list;
  }

  /**
   * Broadcast an event to all connected devices for a specific phone number
   */
  sendToPhone<T>(targetPhone: string, type: CrossDeviceEventType, payload: T): void {
    const targets = this.getClientsForPhone(targetPhone);
    const data = JSON.stringify({ type, payload, timestamp: Date.now() });
    for (const client of targets) {
      try {
        client.res.write(`event: ${type}\ndata: ${data}\n\n`);
      } catch {
        this.removeClient(client.id);
      }
    }
  }

  /**
   * Broadcast to both parties of a cross-device connection (e.g. Patient & Caregiver)
   */
  broadcastToPartners<T>(phones: string[], type: CrossDeviceEventType, payload: T): void {
    phones.forEach((phone) => this.sendToPhone(phone, type, payload));
  }

  /**
   * Notify caregiver devices that a dose was taken / skipped by the patient
   */
  notifyDoseLogged(patientPhone: string, caregiverPhones: string[], reminder: MedicineReminder, doseTime: string, status: string): void {
    const payload = {
      patientPhone,
      reminderId: reminder.id,
      medicineName: reminder.medicineName,
      time: doseTime,
      status,
      timestamp: Date.now(),
      reminder,
    };
    caregiverPhones.forEach((cgPhone) => this.sendToPhone(cgPhone, 'dose_logged', payload));
  }

  /**
   * Notify caregiver devices that patient updated their reminder schedules
   */
  notifyRemindersUpdated(patientPhone: string, caregiverPhones: string[], reminders: MedicineReminder[]): void {
    const payload = {
      patientPhone,
      reminders,
      timestamp: Date.now(),
    };
    caregiverPhones.forEach((cgPhone) => this.sendToPhone(cgPhone, 'reminders_updated', payload));
  }

  /**
   * Notify caregiver devices of a missed dose alert
   */
  notifyMissedDoseAlert(caregiverPhone: string, alert: CaregiverAlert): void {
    this.sendToPhone(caregiverPhone, 'missed_dose_alert', alert);
  }

  /**
   * Notify patient device of a gentle reminder nudge sent by a caregiver
   */
  notifyCaregiverNudge(patientPhone: string, nudge: DeviceNudge): void {
    this.sendToPhone(patientPhone, 'device_nudge', nudge);
  }

  /**
   * Notify both devices that pairing succeeded
   */
  notifyConnectionEstablished(conn: CaregiverConnection): void {
    this.sendToPhone(conn.patientPhone, 'device_linked', conn);
    this.sendToPhone(conn.caregiverPhone, 'device_linked', conn);
  }

  /**
   * Notify both devices that pairing was revoked
   */
  notifyConnectionRevoked(patientPhone: string, caregiverPhone: string, connectionId: string): void {
    const payload = { connectionId, timestamp: Date.now() };
    this.sendToPhone(patientPhone, 'device_unlinked', payload);
    this.sendToPhone(caregiverPhone, 'device_unlinked', payload);
  }

  /**
   * Emergency SOS from patient to all caregivers
   */
  notifyEmergencySos(patientPhone: string, patientName: string, caregiverPhones: string[], location?: string): void {
    const payload = {
      patientPhone,
      patientName,
      location,
      timestamp: Date.now(),
    };
    caregiverPhones.forEach((cgPhone) => this.sendToPhone(cgPhone, 'emergency_sos', payload));
  }
}

export const crossDeviceHub = new CrossDeviceHub();
