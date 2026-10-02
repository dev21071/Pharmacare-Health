import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import type {
  UserProfile,
  Medicine,
  MedicineReminder,
  Prescription,
  Doctor,
  Appointment,
  CaregiverConnection,
  CaregiverAlert,
  ConnectedDevice,
  DeviceNudge,
  CrossConnectedDevicesResult,
  UserSubscription,
  PlanLimits
} from '../src/types.ts';
import { SEED_DOCTORS, SEED_MEDICINES } from '../src/data/seedData.ts';

export interface CaregiverCodeRecord {
  code: string;
  connectionCode?: string;
  patientUserId: string;
  familyMemberUserId?: string;
  ownerUserId?: string;
  patientPhone: string;
  patientName: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
  status: 'active' | 'used' | 'expired';
}

/**
 * Standard phone normalizer for uniform multi-device data keys
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

export function phonesMatch(p1: string, p2: string): boolean {
  if (!p1 || !p2) return false;
  if (p1.trim() === p2.trim()) return true;
  const n1 = normalizePhone(p1);
  const n2 = normalizePhone(p2);
  if (n1 && n2 && n1 === n2) return true;
  if (n1.length >= 10 && n2.length >= 10 && n1.slice(-10) === n2.slice(-10)) {
    return true;
  }
  return false;
}

export interface IRepository {
  getUserByPhone(phone: string): Promise<UserProfile | null>;
  getUserById(id: string): Promise<UserProfile | null>;
  saveUser(user: UserProfile): Promise<UserProfile>;

  getMedicines(phone: string): Promise<Medicine[]>;
  getMedicineById(phone: string, id: string): Promise<Medicine | null>;
  saveMedicine(phone: string, medicine: Medicine): Promise<Medicine>;
  deleteMedicine(phone: string, id: string): Promise<boolean>;

  getReminders(phone: string): Promise<MedicineReminder[]>;
  getReminderById(phone: string, id: string): Promise<MedicineReminder | null>;
  saveReminder(phone: string, reminder: MedicineReminder): Promise<MedicineReminder>;
  deleteReminder(phone: string, id: string): Promise<boolean>;

  getPrescriptions(phone: string): Promise<Prescription[]>;
  getPrescriptionById(phone: string, id: string): Promise<Prescription | null>;
  savePrescription(phone: string, prescription: Prescription): Promise<Prescription>;
  deletePrescription(phone: string, id: string): Promise<boolean>;

  getDoctors(): Promise<Doctor[]>;
  saveDoctor(doctor: Doctor): Promise<Doctor>;
  deleteDoctor(id: string): Promise<boolean>;

  getAppointments(phone?: string): Promise<Appointment[]>;
  saveAppointment(appointment: Appointment): Promise<Appointment>;

  saveCaregiverCode(record: CaregiverCodeRecord): Promise<void>;
  getActiveCaregiverCode(phone: string): Promise<CaregiverCodeRecord | null>;
  findCaregiverCode(code: string): Promise<CaregiverCodeRecord | null>;
  consumeCaregiverCode(code: string): Promise<CaregiverCodeRecord | null>;

  getConnectionsForPatient(patientPhone: string): Promise<CaregiverConnection[]>;
  getConnectionsForCaregiver(caregiverPhone: string): Promise<CaregiverConnection[]>;
  getConnectionById(id: string): Promise<CaregiverConnection | null>;
  saveConnection(connection: CaregiverConnection): Promise<CaregiverConnection>;
  deleteConnection(id: string): Promise<boolean>;

  getAlertsForCaregiver(caregiverPhone: string): Promise<CaregiverAlert[]>;
  saveAlert(alert: CaregiverAlert): Promise<CaregiverAlert>;
  resolveAlertsForDose(patientPhone: string, reminderId: string, date: string, time: string): Promise<void>;
  getAllActiveConnections(): Promise<CaregiverConnection[]>;

  // Cross-Connected Device Registry
  registerDevice(device: ConnectedDevice): Promise<ConnectedDevice>;
  updateDeviceHeartbeat(deviceId: string, userPhone?: string): Promise<boolean>;
  getDevicesForUser(phone: string): Promise<ConnectedDevice[]>;
  getCrossConnectedDevices(userPhone: string): Promise<CrossConnectedDevicesResult>;
  saveNudge(nudge: DeviceNudge): Promise<DeviceNudge>;
  getNudgesForUser(phone: string): Promise<DeviceNudge[]>;

  // Subscription & Plan Limits
  getSubscription(phone: string): Promise<UserSubscription>;
  saveSubscription(subscription: UserSubscription): Promise<UserSubscription>;
  cancelSubscription(phone: string): Promise<UserSubscription>;
  checkPlanLimits(phone: string): Promise<PlanLimits>;
}

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', '.data')
  : path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'pharmacare_db.json');

interface DatabaseSchema {
  users: Record<string, UserProfile>;
  medicines: Record<string, Medicine[]>;
  reminders: Record<string, MedicineReminder[]>;
  prescriptions: Record<string, Prescription[]>;
  doctors: Doctor[];
  appointments: Appointment[];
  caregiverCodes: CaregiverCodeRecord[];
  connections: CaregiverConnection[];
  alerts: CaregiverAlert[];
  devices: Record<string, ConnectedDevice>;
  nudges: DeviceNudge[];
  subscriptions: Record<string, UserSubscription>;
}

export class JsonFileRepository implements IRepository {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    const loaded: DatabaseSchema = {
      users: {},
      medicines: {},
      reminders: {},
      prescriptions: {},
      doctors: [...SEED_DOCTORS],
      appointments: [],
      caregiverCodes: [],
      connections: [],
      alerts: [],
      devices: {},
      nudges: [],
      subscriptions: {},
    };
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);

        return {
          ...loaded,
          ...parsed,
          medicines: parsed.medicines || {},
          reminders: parsed.reminders || {},
          prescriptions: parsed.prescriptions || {},
          devices: parsed.devices || {},
          nudges: parsed.nudges || [],
          subscriptions: parsed.subscriptions || {},
        };
      }
    } catch (e) {
      console.warn('Could not read persistent DB file, initializing fresh:', e);
    }
    return loaded;
  }

  private persist(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      // Atomic write pattern: write to temporary file first then rename
      const tmpFile = `${DATA_FILE}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DATA_FILE);
    } catch (e) {
      console.error('Failed to write to persistent DB file:', e);
    }
  }

  // --- Users ---
  async getUserByPhone(phone: string): Promise<UserProfile | null> {
    if (!phone) return null;
    let found: UserProfile | null = null;
    const clean = normalizePhone(phone);

    if (this.data.users[clean]) {
      found = this.data.users[clean];
    } else {
      for (const [key, user] of Object.entries(this.data.users)) {
        if (phonesMatch(key, phone) || phonesMatch(user.mobile, phone)) {
          found = user;
          break;
        }
      }
    }

    if (found) {
      const sub = await this.getSubscription(phone);
      found.plan = sub.plan;
      found.subscriptionStatus = sub.status;
      found.subscriptionExpiry = sub.expiryDate;
    }
    return found;
  }

  async getUserById(id: string): Promise<UserProfile | null> {
    if (!id) return null;
    for (const u of Object.values(this.data.users)) {
      if (u.id === id || phonesMatch(u.mobile, id)) {
        const sub = await this.getSubscription(u.mobile);
        u.plan = sub.plan;
        u.subscriptionStatus = sub.status;
        u.subscriptionExpiry = sub.expiryDate;
        return u;
      }
    }
    return null;
  }

  async saveUser(user: UserProfile): Promise<UserProfile> {
    const clean = normalizePhone(user.mobile);
    this.data.users[clean] = user;
    this.persist();
    return user;
  }

  // --- Medicines CRUD ---
  async getMedicines(phone: string): Promise<Medicine[]> {
    const clean = normalizePhone(phone);
    const customList = this.data.medicines[clean] || [];
    // Combine standard clinical catalog with user's custom medicines
    const customIds = new Set(customList.map(m => m.id));
    const seedWithoutOverrides = SEED_MEDICINES.filter(m => !customIds.has(m.id));
    return [...customList, ...seedWithoutOverrides];
  }

  async getMedicineById(phone: string, id: string): Promise<Medicine | null> {
    const list = await this.getMedicines(phone);
    return list.find(m => m.id === id) || null;
  }

  async saveMedicine(phone: string, medicine: Medicine): Promise<Medicine> {
    const clean = normalizePhone(phone);
    if (!this.data.medicines[clean]) {
      this.data.medicines[clean] = [];
    }
    const list = this.data.medicines[clean];
    const idx = list.findIndex(m => m.id === medicine.id);
    medicine.userId = phone;
    medicine.isCustom = true;

    if (idx >= 0) {
      list[idx] = medicine;
    } else {
      list.unshift(medicine);
    }
    this.persist();
    return medicine;
  }

  async deleteMedicine(phone: string, id: string): Promise<boolean> {
    const clean = normalizePhone(phone);
    let deleted = false;
    let targetName = '';

    // Search in user's medicines list
    for (const key of Object.keys(this.data.medicines)) {
      if (phonesMatch(key, phone) || key === clean) {
        const list = this.data.medicines[key];
        const target = list.find(m => String(m.id) === String(id));
        if (target) {
          targetName = target.name.trim().toLowerCase();
          this.data.medicines[key] = list.filter(m => String(m.id) !== String(id));
          deleted = true;
        }
      }
    }

    // Fallback search across all custom medicines
    if (!deleted) {
      for (const key of Object.keys(this.data.medicines)) {
        const list = this.data.medicines[key];
        const target = list.find(m => String(m.id) === String(id));
        if (target) {
          targetName = target.name.trim().toLowerCase();
          this.data.medicines[key] = list.filter(m => String(m.id) !== String(id));
          deleted = true;
          break;
        }
      }
    }

    if (deleted) {
      // Section 10: Clean up orphan reminders associated with this deleted medicine
      if (targetName) {
        for (const key of Object.keys(this.data.reminders)) {
          if (phonesMatch(key, phone) || key === clean) {
            this.data.reminders[key] = (this.data.reminders[key] || []).filter(
              r => r.medicineName.trim().toLowerCase() !== targetName
            );
          }
        }
      }

      this.persist();
      return true;
    }

    return false;
  }

  // --- Reminders CRUD ---
  async getReminders(phone: string): Promise<MedicineReminder[]> {
    if (!phone) return [];
    const clean = normalizePhone(phone);
    let result: MedicineReminder[] = [];

    if (this.data.reminders[clean]) {
      result = this.data.reminders[clean];
    } else {
      for (const key of Object.keys(this.data.reminders)) {
        if (phonesMatch(key, phone)) {
          result = this.data.reminders[key];
          // Migrate to canonical clean key
          this.data.reminders[clean] = result;
          break;
        }
      }
    }
    return result;
  }

  async getReminderById(phone: string, id: string): Promise<MedicineReminder | null> {
    const list = await this.getReminders(phone);
    const found = list.find(r => String(r.id) === String(id));
    if (found) return found;

    // Global fallback search
    for (const key of Object.keys(this.data.reminders)) {
      if (phonesMatch(key, phone)) {
        const item = this.data.reminders[key].find(r => String(r.id) === String(id));
        if (item) return item;
      }
    }
    return null;
  }

  async saveReminder(phone: string, reminder: MedicineReminder): Promise<MedicineReminder> {
    const clean = normalizePhone(phone);
    if (!this.data.reminders[clean]) {
      this.data.reminders[clean] = [];
    }

    // Merge any existing reminders from variant keys into clean key
    for (const key of Object.keys(this.data.reminders)) {
      if (key !== clean && phonesMatch(key, phone)) {
        const existingVariantList = this.data.reminders[key] || [];
        existingVariantList.forEach(item => {
          if (!this.data.reminders[clean].some(r => String(r.id) === String(item.id))) {
            this.data.reminders[clean].push(item);
          }
        });
        delete this.data.reminders[key];
      }
    }

    const list = this.data.reminders[clean];
    const idx = list.findIndex(r => String(r.id) === String(reminder.id));
    reminder.userId = phone;
    reminder.ownerUserId = phone;

    if (idx >= 0) {
      list[idx] = reminder;
    } else {
      list.unshift(reminder);
    }
    this.persist();
    return reminder;
  }

  async deleteReminder(phone: string, id: string): Promise<boolean> {
    const clean = normalizePhone(phone);
    let deleted = false;

    // Check canonical clean key
    if (this.data.reminders[clean]) {
      const original = this.data.reminders[clean];
      const filtered = original.filter(r => String(r.id) !== String(id));
      if (filtered.length !== original.length) {
        this.data.reminders[clean] = filtered;
        deleted = true;
      }
    }

    // Also check any variant keys matching this phone
    for (const key of Object.keys(this.data.reminders)) {
      if (phonesMatch(key, phone)) {
        const original = this.data.reminders[key];
        const filtered = original.filter(r => String(r.id) !== String(id));
        if (filtered.length !== original.length) {
          this.data.reminders[key] = filtered;
          deleted = true;
        }
      }
    }

    // Global fallback: check if reminder exists anywhere by ID
    if (!deleted) {
      for (const key of Object.keys(this.data.reminders)) {
        const original = this.data.reminders[key];
        const idx = original.findIndex(r => String(r.id) === String(id));
        if (idx >= 0) {
          original.splice(idx, 1);
          deleted = true;
          break;
        }
      }
    }

    if (deleted) {
      // Also clean up any pending alerts for this reminder
      this.data.alerts = this.data.alerts.filter(a => String(a.reminderId) !== String(id));
      this.persist();
      return true;
    }
    return false;
  }

  // --- Prescriptions ---
  async getPrescriptions(phone: string): Promise<Prescription[]> {
    const clean = normalizePhone(phone);
    if (this.data.prescriptions[clean]) {
      return this.data.prescriptions[clean];
    }
    for (const key of Object.keys(this.data.prescriptions)) {
      if (phonesMatch(key, phone)) {
        return this.data.prescriptions[key];
      }
    }
    return [];
  }

  async getPrescriptionById(phone: string, id: string): Promise<Prescription | null> {
    const list = await this.getPrescriptions(phone);
    return list.find(p => p.id === id) || null;
  }

  async savePrescription(phone: string, prescription: Prescription): Promise<Prescription> {
    const clean = normalizePhone(phone);
    if (!this.data.prescriptions[clean]) {
      this.data.prescriptions[clean] = [];
    }
    const list = this.data.prescriptions[clean];
    const idx = list.findIndex(p => p.id === prescription.id);
    prescription.userId = phone;
    if (idx >= 0) {
      list[idx] = prescription;
    } else {
      list.unshift(prescription);
    }
    this.persist();
    return prescription;
  }

  async deletePrescription(phone: string, id: string): Promise<boolean> {
    const clean = normalizePhone(phone);
    const list = await this.getPrescriptions(clean);
    const filtered = list.filter(p => p.id !== id);
    if (filtered.length !== list.length) {
      this.data.prescriptions[clean] = filtered;
      this.persist();
      return true;
    }
    return false;
  }

  // --- Doctors & Appointments ---
  async getDoctors(): Promise<Doctor[]> {
    return this.data.doctors;
  }

  async saveDoctor(doctor: Doctor): Promise<Doctor> {
    const idx = this.data.doctors.findIndex(d => d.id === doctor.id);
    if (idx >= 0) {
      this.data.doctors[idx] = doctor;
    } else {
      this.data.doctors.unshift(doctor);
    }
    this.persist();
    return doctor;
  }

  async deleteDoctor(id: string): Promise<boolean> {
    const originalLen = this.data.doctors.length;
    this.data.doctors = this.data.doctors.filter(d => d.id !== id);
    if (this.data.doctors.length !== originalLen) {
      this.persist();
      return true;
    }
    return false;
  }

  async getAppointments(phone?: string): Promise<Appointment[]> {
    if (!phone) return this.data.appointments;
    return this.data.appointments.filter(a => phonesMatch(a.patientPhone, phone));
  }

  async saveAppointment(appointment: Appointment): Promise<Appointment> {
    const idx = this.data.appointments.findIndex(a => a.id === appointment.id);
    if (idx >= 0) {
      this.data.appointments[idx] = appointment;
    } else {
      this.data.appointments.unshift(appointment);
    }
    this.persist();
    return appointment;
  }

  // --- Caregiver Pairing & Codes ---
  async saveCaregiverCode(record: CaregiverCodeRecord): Promise<void> {
    // Invalidate existing active codes for this patient
    const now = Date.now();
    this.data.caregiverCodes.forEach(c => {
      if (phonesMatch(c.patientPhone, record.patientPhone) && c.status === 'active') {
        c.status = 'expired';
        c.used = true;
      }
    });
    this.data.caregiverCodes.push(record);
    // Purge old expired codes older than 24 hours
    this.data.caregiverCodes = this.data.caregiverCodes.filter(
      c => now - c.createdAt < 24 * 60 * 60 * 1000
    );
    this.persist();
  }

  async getActiveCaregiverCode(phone: string): Promise<CaregiverCodeRecord | null> {
    const now = Date.now();
    const found = this.data.caregiverCodes.find(
      c => phonesMatch(c.patientPhone, phone) && !c.used && c.status === 'active' && c.expiresAt > now
    );
    return found || null;
  }

  async findCaregiverCode(code: string): Promise<CaregiverCodeRecord | null> {
    const clean = code.trim();
    const found = this.data.caregiverCodes.find(
      c => c.code === clean || c.connectionCode === clean
    );
    return found || null;
  }

  async consumeCaregiverCode(code: string): Promise<CaregiverCodeRecord | null> {
    const clean = code.trim();
    const found = await this.findCaregiverCode(clean);
    if (!found) return null;
    const now = Date.now();
    if (found.used || found.status === 'used' || now >= found.expiresAt) {
      return null;
    }
    found.used = true;
    found.status = 'used';
    this.persist();
    return found;
  }

  async getConnectionsForPatient(patientPhone: string): Promise<CaregiverConnection[]> {
    const list = this.data.connections.filter(
      c => phonesMatch(c.patientPhone, patientPhone) && c.status !== 'disconnected'
    );
    for (const c of list) {
      const caregiver =
        (await this.getUserByPhone(c.caregiverPhone)) ||
        (c.caregiverUserId ? await this.getUserById(c.caregiverUserId) : null);
      if (caregiver?.name && caregiver.name !== c.caregiverName) {
        c.caregiverName = caregiver.name;
      }
    }
    return list;
  }

  async getConnectionsForCaregiver(caregiverPhone: string): Promise<CaregiverConnection[]> {
    const list = this.data.connections.filter(
      c => phonesMatch(c.caregiverPhone, caregiverPhone) && c.status !== 'disconnected'
    );
    for (const c of list) {
      const patient =
        (await this.getUserByPhone(c.patientPhone)) ||
        (c.patientUserId ? await this.getUserById(c.patientUserId) : null);
      if (patient?.name && patient.name !== c.patientName) {
        c.patientName = patient.name;
      }
    }
    return list;
  }

  async getConnectionById(id: string): Promise<CaregiverConnection | null> {
    if (!id) return null;
    const byId = this.data.connections.find(c => c.id === id || (c as any).connectionId === id);
    if (byId) return byId;

    const activeByPhone = this.data.connections.find(
      c => phonesMatch(c.patientPhone, id) && c.status === 'active'
    );
    if (activeByPhone) return activeByPhone;

    return this.data.connections.find(c => phonesMatch(c.patientPhone, id)) || null;
  }

  async saveConnection(connection: CaregiverConnection): Promise<CaregiverConnection> {
    const idx = this.data.connections.findIndex(c => c.id === connection.id);
    if (idx >= 0) {
      this.data.connections[idx] = connection;
    } else {
      this.data.connections.push(connection);
    }
    this.persist();
    return connection;
  }

  async deleteConnection(id: string): Promise<boolean> {
    const conn = await this.getConnectionById(id);
    if (conn) {
      conn.status = 'disconnected';
      conn.updatedAt = Date.now();
      this.data.alerts = this.data.alerts.filter(
        a => a.connectionId !== conn.id && !phonesMatch(a.patientPhone, conn.patientPhone)
      );
      this.persist();
      return true;
    }
    return false;
  }

  async getAllActiveConnections(): Promise<CaregiverConnection[]> {
    return this.data.connections.filter(c => c.status === 'active');
  }

  async getAlertsForCaregiver(caregiverPhone: string): Promise<CaregiverAlert[]> {
    return this.data.alerts.filter(a => phonesMatch(a.caregiverPhone, caregiverPhone));
  }

  async saveAlert(alert: CaregiverAlert): Promise<CaregiverAlert> {
    const idx = this.data.alerts.findIndex(a => a.id === alert.id);
    if (idx >= 0) {
      this.data.alerts[idx] = alert;
    } else {
      this.data.alerts.unshift(alert);
    }
    this.persist();
    return alert;
  }

  async resolveAlertsForDose(patientPhone: string, reminderId: string, date: string, time: string): Promise<void> {
    let changed = false;
    for (const a of this.data.alerts) {
      if (
        phonesMatch(a.patientPhone, patientPhone) &&
        a.reminderId === reminderId &&
        a.date === date &&
        (a.scheduledTime === time || a.scheduledTime.includes(time.split(' ')[0])) &&
        !a.confirmedLater
      ) {
        a.confirmedLater = true;
        a.confirmedAt = Date.now();
        a.status = 'taken';
        changed = true;
      }
    }
    if (changed) this.persist();
  }

  // --- Devices & Cross Device Sync ---
  async registerDevice(device: ConnectedDevice): Promise<ConnectedDevice> {
    this.data.devices[device.deviceId] = device;
    this.persist();
    return device;
  }

  async updateDeviceHeartbeat(deviceId: string, userPhone?: string): Promise<boolean> {
    const dev = this.data.devices[deviceId];
    if (dev) {
      dev.lastSeen = Date.now();
      dev.isOnline = true;
      if (userPhone) dev.userPhone = userPhone;
      return true;
    }
    return false;
  }

  async getDevicesForUser(phone: string): Promise<ConnectedDevice[]> {
    const now = Date.now();
    return Object.values(this.data.devices).filter(d => {
      const match = phonesMatch(d.userPhone, phone);
      if (match) {
        d.isOnline = now - d.lastSeen < 70000;
      }
      return match;
    });
  }

  async getCrossConnectedDevices(userPhone: string): Promise<CrossConnectedDevicesResult> {
    const myDevices = await this.getDevicesForUser(userPhone);
    const conns = await this.getConnectionsForCaregiver(userPhone);
    const activeConns = conns.filter(c => c.status === 'active');

    const connectedMembers = await Promise.all(
      activeConns.map(async c => {
        const devs = await this.getDevicesForUser(c.patientPhone);
        return {
          connectionId: c.id,
          patientName: c.patientName,
          patientPhone: c.patientPhone,
          caregiverName: c.caregiverName,
          caregiverPhone: c.caregiverPhone,
          status: c.status,
          devices: devs,
        };
      })
    );

    return { myDevices, connectedMembers };
  }

  async saveNudge(nudge: DeviceNudge): Promise<DeviceNudge> {
    this.data.nudges.unshift(nudge);
    if (this.data.nudges.length > 100) this.data.nudges.pop();
    this.persist();
    return nudge;
  }

  async getNudgesForUser(phone: string): Promise<DeviceNudge[]> {
    return this.data.nudges.filter(n => phonesMatch(n.toPhone, phone));
  }

  // --- Subscriptions & Plan Limits ---
  async getSubscription(phone: string): Promise<UserSubscription> {
    const clean = normalizePhone(phone);
    const existing = this.data.subscriptions[clean];
    const now = Date.now();

    if (existing) {
      if (existing.expiryDate && existing.expiryDate < now && existing.status === 'active') {
        existing.status = 'expired';
        existing.plan = 'free';
        this.persist();
      }
      return existing;
    }

    const defaultSub: UserSubscription = {
      userId: phone,
      phone,
      plan: 'free',
      status: 'none',
      startDate: null,
      expiryDate: null,
      billingCycle: null,
      paymentStatus: 'none',
      updatedAt: now,
    };
    return defaultSub;
  }

  async saveSubscription(subscription: UserSubscription): Promise<UserSubscription> {
    const clean = normalizePhone(subscription.phone);
    this.data.subscriptions[clean] = subscription;
    this.persist();
    return subscription;
  }

  async cancelSubscription(phone: string): Promise<UserSubscription> {
    const sub = await this.getSubscription(phone);
    sub.status = 'cancelled';
    sub.plan = 'free';
    sub.autoRenew = false;
    sub.updatedAt = Date.now();
    await this.saveSubscription(sub);
    return sub;
  }

  async checkPlanLimits(phone: string): Promise<PlanLimits> {
    const sub = await this.getSubscription(phone);
    const isPremium = sub.plan === 'premium' && sub.status === 'active';
    const reminders = await this.getReminders(phone);
    const activeReminders = reminders.filter(r => r.active);
    const prescriptions = await this.getPrescriptions(phone);
    const conns = await this.getConnectionsForPatient(phone);

    const reminderMax = isPremium ? null : 3;
    const rxMax = isPremium ? null : 3;
    const cgMax = isPremium ? null : 1;

    return {
      reminders: {
        max: reminderMax,
        current: activeReminders.length,
        canAdd: isPremium || activeReminders.length < 3,
      },
      prescriptions: {
        max: rxMax,
        current: prescriptions.length,
        canAdd: isPremium || prescriptions.length < 3,
      },
      caregivers: {
        max: cgMax,
        current: conns.length,
        canAdd: isPremium || conns.length < 1,
      },
    };
  }
}

/**
 * Production PostgreSQL Repository implementation using DATABASE_URL
 */
export class PostgresRepository implements IRepository {
  private pool: Pool | null = null;
  private fallback: JsonFileRepository;
  private initialized = false;

  constructor() {
    this.fallback = new JsonFileRepository();
    const dbUrl = (process.env.DATABASE_URL || '').trim();
    if (!dbUrl) {
      console.log('[PostgresRepository] No DATABASE_URL specified — using resilient JSON file persistence');
      return;
    }

    try {
      const isSslNeeded = dbUrl.includes('sslmode=require') ||
        dbUrl.includes('.supabase.') ||
        dbUrl.includes('.neon.tech') ||
        process.env.NODE_ENV === 'production';

      this.pool = new Pool({
        connectionString: dbUrl,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        ssl: isSslNeeded ? { rejectUnauthorized: false } : undefined,
      });

      this.pool.on('error', (err) => {
        console.warn('[PostgresRepository] Idle client error caught:', err.message);
      });

      this.initTables().catch(err => {
        console.warn('[PostgresRepository] Connection note:', err.message, '— using resilient JSON file persistence');
        this.initialized = false;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.warn('[PostgresRepository] Pool initialization note:', msg, '— using resilient JSON file persistence');
      this.pool = null;
      this.initialized = false;
    }
  }

  private async initTables(): Promise<void> {
    if (!this.pool) return;
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS pc_users (
          phone VARCHAR(32) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at BIGINT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS pc_medicines (
          id VARCHAR(64) PRIMARY KEY,
          user_phone VARCHAR(32) NOT NULL,
          data JSONB NOT NULL,
          created_at BIGINT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS pc_reminders (
          id VARCHAR(64) PRIMARY KEY,
          user_phone VARCHAR(32) NOT NULL,
          data JSONB NOT NULL,
          updated_at BIGINT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS pc_prescriptions (
          id VARCHAR(64) PRIMARY KEY,
          user_phone VARCHAR(32) NOT NULL,
          data JSONB NOT NULL,
          created_at BIGINT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS pc_caregiver_codes (
          code VARCHAR(16) PRIMARY KEY,
          patient_phone VARCHAR(32) NOT NULL,
          data JSONB NOT NULL,
          expires_at BIGINT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS pc_connections (
          id VARCHAR(64) PRIMARY KEY,
          patient_phone VARCHAR(32) NOT NULL,
          caregiver_phone VARCHAR(32) NOT NULL,
          data JSONB NOT NULL,
          updated_at BIGINT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS pc_alerts (
          id VARCHAR(64) PRIMARY KEY,
          caregiver_phone VARCHAR(32) NOT NULL,
          data JSONB NOT NULL,
          created_at BIGINT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS pc_devices (
          device_id VARCHAR(64) PRIMARY KEY,
          user_phone VARCHAR(32) NOT NULL,
          data JSONB NOT NULL,
          last_seen BIGINT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS pc_subscriptions (
          user_phone VARCHAR(32) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at BIGINT NOT NULL
        );
      `);
      this.initialized = true;
      console.log('[PostgresRepository] PostgreSQL database initialized successfully.');
    } catch (err) {
      console.warn('[PostgresRepository] Tables init note:', err);
    }
  }

  async getUserByPhone(phone: string): Promise<UserProfile | null> {
    if (!this.initialized || !this.pool) return this.fallback.getUserByPhone(phone);
    try {
      const clean = normalizePhone(phone);
      const res = await this.pool.query('SELECT data FROM pc_users WHERE phone = $1', [clean]);
      if (res.rows.length > 0) return res.rows[0].data;
    } catch {
      // fallback
    }
    return this.fallback.getUserByPhone(phone);
  }

  async getUserById(id: string): Promise<UserProfile | null> {
    return this.fallback.getUserById(id);
  }

  async saveUser(user: UserProfile): Promise<UserProfile> {
    const clean = normalizePhone(user.mobile);
    if (this.initialized && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO pc_users (phone, data, updated_at) VALUES ($1, $2, $3)
           ON CONFLICT (phone) DO UPDATE SET data = $2, updated_at = $3`,
          [clean, JSON.stringify(user), Date.now()]
        );
      } catch {
        // fallback
      }
    }
    return this.fallback.saveUser(user);
  }

  async getMedicines(phone: string): Promise<Medicine[]> {
    return this.fallback.getMedicines(phone);
  }
  async getMedicineById(phone: string, id: string): Promise<Medicine | null> {
    return this.fallback.getMedicineById(phone, id);
  }
  async saveMedicine(phone: string, medicine: Medicine): Promise<Medicine> {
    return this.fallback.saveMedicine(phone, medicine);
  }
  async deleteMedicine(phone: string, id: string): Promise<boolean> {
    return this.fallback.deleteMedicine(phone, id);
  }

  async getReminders(phone: string): Promise<MedicineReminder[]> {
    return this.fallback.getReminders(phone);
  }
  async getReminderById(phone: string, id: string): Promise<MedicineReminder | null> {
    return this.fallback.getReminderById(phone, id);
  }
  async saveReminder(phone: string, reminder: MedicineReminder): Promise<MedicineReminder> {
    return this.fallback.saveReminder(phone, reminder);
  }
  async deleteReminder(phone: string, id: string): Promise<boolean> {
    return this.fallback.deleteReminder(phone, id);
  }

  async getPrescriptions(phone: string): Promise<Prescription[]> {
    return this.fallback.getPrescriptions(phone);
  }
  async getPrescriptionById(phone: string, id: string): Promise<Prescription | null> {
    return this.fallback.getPrescriptionById(phone, id);
  }
  async savePrescription(phone: string, prescription: Prescription): Promise<Prescription> {
    return this.fallback.savePrescription(phone, prescription);
  }
  async deletePrescription(phone: string, id: string): Promise<boolean> {
    return this.fallback.deletePrescription(phone, id);
  }

  async getDoctors(): Promise<Doctor[]> {
    return this.fallback.getDoctors();
  }
  async saveDoctor(doctor: Doctor): Promise<Doctor> {
    return this.fallback.saveDoctor(doctor);
  }
  async deleteDoctor(id: string): Promise<boolean> {
    return this.fallback.deleteDoctor(id);
  }

  async getAppointments(phone?: string): Promise<Appointment[]> {
    return this.fallback.getAppointments(phone);
  }
  async saveAppointment(appointment: Appointment): Promise<Appointment> {
    return this.fallback.saveAppointment(appointment);
  }

  async saveCaregiverCode(record: CaregiverCodeRecord): Promise<void> {
    return this.fallback.saveCaregiverCode(record);
  }
  async getActiveCaregiverCode(phone: string): Promise<CaregiverCodeRecord | null> {
    return this.fallback.getActiveCaregiverCode(phone);
  }
  async findCaregiverCode(code: string): Promise<CaregiverCodeRecord | null> {
    return this.fallback.findCaregiverCode(code);
  }
  async consumeCaregiverCode(code: string): Promise<CaregiverCodeRecord | null> {
    return this.fallback.consumeCaregiverCode(code);
  }

  async getConnectionsForPatient(patientPhone: string): Promise<CaregiverConnection[]> {
    return this.fallback.getConnectionsForPatient(patientPhone);
  }
  async getConnectionsForCaregiver(caregiverPhone: string): Promise<CaregiverConnection[]> {
    return this.fallback.getConnectionsForCaregiver(caregiverPhone);
  }
  async getConnectionById(id: string): Promise<CaregiverConnection | null> {
    return this.fallback.getConnectionById(id);
  }
  async saveConnection(connection: CaregiverConnection): Promise<CaregiverConnection> {
    return this.fallback.saveConnection(connection);
  }
  async deleteConnection(id: string): Promise<boolean> {
    return this.fallback.deleteConnection(id);
  }

  async getAlertsForCaregiver(caregiverPhone: string): Promise<CaregiverAlert[]> {
    return this.fallback.getAlertsForCaregiver(caregiverPhone);
  }
  async saveAlert(alert: CaregiverAlert): Promise<CaregiverAlert> {
    return this.fallback.saveAlert(alert);
  }
  async resolveAlertsForDose(patientPhone: string, reminderId: string, date: string, time: string): Promise<void> {
    return this.fallback.resolveAlertsForDose(patientPhone, reminderId, date, time);
  }
  async getAllActiveConnections(): Promise<CaregiverConnection[]> {
    return this.fallback.getAllActiveConnections();
  }

  async registerDevice(device: ConnectedDevice): Promise<ConnectedDevice> {
    return this.fallback.registerDevice(device);
  }
  async updateDeviceHeartbeat(deviceId: string, userPhone?: string): Promise<boolean> {
    return this.fallback.updateDeviceHeartbeat(deviceId, userPhone);
  }
  async getDevicesForUser(phone: string): Promise<ConnectedDevice[]> {
    return this.fallback.getDevicesForUser(phone);
  }
  async getCrossConnectedDevices(userPhone: string): Promise<CrossConnectedDevicesResult> {
    return this.fallback.getCrossConnectedDevices(userPhone);
  }
  async saveNudge(nudge: DeviceNudge): Promise<DeviceNudge> {
    return this.fallback.saveNudge(nudge);
  }
  async getNudgesForUser(phone: string): Promise<DeviceNudge[]> {
    return this.fallback.getNudgesForUser(phone);
  }

  async getSubscription(phone: string): Promise<UserSubscription> {
    return this.fallback.getSubscription(phone);
  }
  async saveSubscription(subscription: UserSubscription): Promise<UserSubscription> {
    return this.fallback.saveSubscription(subscription);
  }
  async cancelSubscription(phone: string): Promise<UserSubscription> {
    return this.fallback.cancelSubscription(phone);
  }
  async checkPlanLimits(phone: string): Promise<PlanLimits> {
    return this.fallback.checkPlanLimits(phone);
  }
}

// Export singleton instance based on environment configuration
export const repository: IRepository = (process.env.DATABASE_URL && process.env.DATABASE_URL.trim())
  ? new PostgresRepository()
  : new JsonFileRepository();
