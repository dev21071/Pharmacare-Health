import {
  UserProfile,
  MedicineReminder,
  Prescription,
  Doctor,
  Appointment,
  CaregiverConnection,
  CaregiverDashboardData,
  CaregiverDashboardMember,
  CaregiverAlert,
  CaregiverPermissions,
  SubscriptionStatusResponse,
  SubscriptionPlan,
  PlanLimits,
  Medicine
} from '../types';
import { storage } from './storage';
import { offlineSync } from './offlineSync';
import { SEED_DOCTORS, SEED_MEDICINES } from '../data/seedData';
import { safeFetchJson } from './apiHelper';
import { getResolvedApiBaseUrl } from '../config/api';

class ApiClient {
  public getBaseUrl(): string {
    return getResolvedApiBaseUrl(storage.getApiBaseUrl());
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
    return headers;
  }

  async health(): Promise<{ status: string; timestamp: number }> {
    try {
      const res = await safeFetchJson<{ status: string; timestamp: number }>(`${this.getBaseUrl()}/api/health`);
      if (res.ok && res.data) return res.data;
      throw new Error(res.error || 'Backend health check failed');
    } catch {
      return { status: 'offline', timestamp: Date.now() };
    }
  }

  async getBackendStatus(): Promise<{
    status: string;
    version: string;
    database: string;
    remindersCount: number;
    prescriptionsCount: number;
    appointmentsCount: number;
    doctorsCount: number;
    activeCaregiverConnections: number;
    testOtpAllowed: boolean;
  }> {
    try {
      const res = await safeFetchJson<any>(`${this.getBaseUrl()}/api/backend/status`, {
        headers: this.getHeaders(),
      });
      if (res.ok && res.data) return res.data;
    } catch {
      // offline fallback
    }
    return {
      status: 'offline-mode',
      version: '1.0.0-apk',
      database: 'local-sqlite-cache',
      remindersCount: storage.getReminders().length,
      prescriptionsCount: storage.getPrescriptions().length,
      appointmentsCount: storage.getAppointments().length,
      doctorsCount: SEED_DOCTORS.length + storage.getCustomDoctors().length,
      activeCaregiverConnections: 0,
      testOtpAllowed: true,
    };
  }

  // Profile
  async getProfile(): Promise<UserProfile> {
    try {
      const res = await safeFetchJson<UserProfile>(`${this.getBaseUrl()}/api/user/profile`, {
        headers: this.getHeaders(),
      });
      if (res.ok && res.data) {
        storage.saveProfile(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('Network unavailable, using local profile:', e);
    }
    const cached = storage.getProfile();
    if (cached) return cached;
    return {
      id: 'local_user',
      name: 'User',
      mobile: '9876543210',
      role: 'patient',
      language: 'en',
      isLoggedIn: true,
      timezone: 'Asia/Kolkata',
    };
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const res = await safeFetchJson<UserProfile>(`${this.getBaseUrl()}/api/user/profile`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(profile),
      });
      if (res.ok && res.data) {
        storage.saveProfile(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('Network unavailable, updating profile locally:', e);
    }
    const curr = storage.getProfile() || {
      id: 'local_user',
      name: 'User',
      mobile: '9876543210',
      role: 'patient' as const,
      language: 'en' as const,
      isLoggedIn: true,
    };
    const updated: UserProfile = {
      ...curr,
      ...profile,
      mobile: profile.mobile || curr.mobile || '9876543210',
      isLoggedIn: true,
    };
    storage.saveProfile(updated);
    return updated;
  }

  // Medicines (Section 8)
  async getMedicines(): Promise<Medicine[]> {
    try {
      const res = await safeFetchJson<Medicine[]>(`${this.getBaseUrl()}/api/medicines`, {
        headers: this.getHeaders(),
      });
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (e) {
      console.warn('Network unavailable, serving local medicines cache:', e);
    }
    const custom = storage.getCustomMedicines();
    const combined = [...custom];
    SEED_MEDICINES.forEach((s) => {
      if (!combined.some((c) => c.id === s.id || c.name.toLowerCase() === s.name.toLowerCase())) {
        combined.push(s);
      }
    });
    return combined;
  }

  async saveMedicine(medicine: Partial<Medicine>): Promise<Medicine> {
    const isEdit = !!medicine.id && !medicine.id.startsWith('temp_') && !medicine.id.startsWith('seed_');
    const assignedId = medicine.id || `med_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const fullMed: Medicine = {
      id: assignedId,
      name: medicine.name || 'Medicine',
      genericName: medicine.genericName || medicine.name || '',
      category: medicine.category || 'General Health',
      dosageForm: medicine.dosageForm || 'Tablet',
      strength: medicine.strength || '500mg',
      uses: medicine.uses || ['General relief'],
      dosageGuidelines: medicine.dosageGuidelines || 'As directed',
      sideEffects: medicine.sideEffects || [],
      precautions: medicine.precautions || [],
      storage: medicine.storage || 'Store in cool place',
      prescriptionRequired: !!medicine.prescriptionRequired,
      isCustom: true,
      createdAt: medicine.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    // Always persist locally first so user action never fails
    storage.saveCustomMedicine(fullMed);

    // Try backend if available
    try {
      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit
        ? `${this.getBaseUrl()}/api/medicines/${encodeURIComponent(assignedId)}`
        : `${this.getBaseUrl()}/api/medicines`;

      const res = await safeFetchJson<{ success?: boolean; medicine?: Medicine; data?: Medicine }>(url, {
        method,
        headers: this.getHeaders(),
        body: JSON.stringify(fullMed),
      });

      if (res.ok && res.data) {
        const saved = res.data.medicine || res.data.data || (res.data as any);
        if (saved && saved.id) {
          storage.saveCustomMedicine(saved);
          return saved;
        }
      }
    } catch (e) {
      console.warn('Backend unavailable, saved medicine locally:', e);
    }

    return fullMed;
  }

  async deleteMedicine(id: string): Promise<void> {
    // 1. Delete locally from custom medicines
    storage.deleteCustomMedicine(id);

    // 2. Also remove any associated reminders locally
    const allReminders = storage.getReminders();
    const updatedReminders = allReminders.filter(
      (r) => (r as any).medicineId !== id && r.id !== id
    );
    if (updatedReminders.length !== allReminders.length) {
      storage.saveReminders(updatedReminders);
    }

    // 3. Try backend if available
    try {
      await safeFetchJson(`${this.getBaseUrl()}/api/medicines/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
    } catch (e) {
      console.warn('Backend unavailable, deleted medicine locally:', e);
    }
  }

  // Reminders
  async getReminders(): Promise<MedicineReminder[]> {
    try {
      const res = await safeFetchJson<MedicineReminder[]>(`${this.getBaseUrl()}/api/reminders`, {
        headers: this.getHeaders(),
      });
      if (res.ok && Array.isArray(res.data)) {
        storage.saveReminders(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('Network unavailable, serving local reminders cache:', e);
    }
    return storage.getReminders();
  }

  async createReminder(reminder: Partial<MedicineReminder>): Promise<MedicineReminder> {
    if (!reminder.medicineName || !reminder.medicineName.trim()) {
      throw new Error('Medicine name is required.');
    }
    if (!reminder.dosage || !reminder.dosage.trim()) {
      throw new Error('Dosage is required (e.g. 1 Tablet, 500mg).');
    }
    if (!Array.isArray(reminder.times) || reminder.times.length === 0 || !reminder.times.some((t: any) => typeof t === 'string' && t.trim())) {
      throw new Error('At least one reminder time must be selected.');
    }

    const payload = {
      medicineName: reminder.medicineName.trim(),
      genericName: reminder.genericName?.trim() || '',
      dosage: reminder.dosage.trim(),
      frequency: reminder.frequency || 'Once Daily',
      times: reminder.times.filter((t: any) => typeof t === 'string' && t.trim()),
      startDate: reminder.startDate || new Date().toISOString().split('T')[0],
      endDate: reminder.endDate,
      instructions: reminder.instructions || 'After Food',
      active: reminder.active !== false,
      notes: reminder.notes || '',
      colorTag: reminder.colorTag || '#0EA5E9',
      doseLogs: reminder.doseLogs || [],
    };

    const url = `${this.getBaseUrl()}/api/reminders`;
    const res = await safeFetchJson<{ success?: boolean; reminder?: MedicineReminder; error?: string; message?: string }>(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorMsg = res.error || (res.data as any)?.message || 'Failed to save reminder on server.';
      throw new Error(errorMsg);
    }

    const saved: MedicineReminder = (res.data as any)?.reminder || res.data;
    if (!saved || !saved.id) {
      throw new Error('Server returned an invalid reminder response.');
    }

    // Update local storage only after confirmed success
    const currentList = storage.getReminders();
    const idx = currentList.findIndex((r) => r.id === saved.id);
    if (idx >= 0) currentList[idx] = saved;
    else currentList.unshift(saved);
    storage.saveReminders(currentList);

    return saved;
  }

  async saveReminder(reminder: Partial<MedicineReminder>): Promise<MedicineReminder> {
    if (!reminder.id) {
      return this.createReminder(reminder);
    }

    if (!reminder.medicineName || !reminder.medicineName.trim()) {
      throw new Error('Medicine name is required.');
    }
    if (!reminder.dosage || !reminder.dosage.trim()) {
      throw new Error('Dosage is required.');
    }
    if (!Array.isArray(reminder.times) || reminder.times.length === 0 || !reminder.times.some((t: any) => typeof t === 'string' && t.trim())) {
      throw new Error('At least one reminder time must be selected.');
    }

    const url = `${this.getBaseUrl()}/api/reminders/${encodeURIComponent(reminder.id)}`;
    const res = await safeFetchJson<{ success?: boolean; reminder?: MedicineReminder; error?: string; message?: string }>(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(reminder),
    });

    if (!res.ok) {
      const errorMsg = res.error || (res.data as any)?.message || 'Failed to update reminder on server.';
      throw new Error(errorMsg);
    }

    const saved: MedicineReminder = (res.data as any)?.reminder || res.data;
    const currentList = storage.getReminders();
    const idx = currentList.findIndex((r) => r.id === saved.id);
    if (idx >= 0) currentList[idx] = saved;
    else currentList.unshift(saved);
    storage.saveReminders(currentList);

    return saved;
  }

  async deleteReminder(id: string): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid reminder ID required for deletion.');
    }

    const url = `${this.getBaseUrl()}/api/reminders/${encodeURIComponent(id)}`;
    const res = await safeFetchJson<{ success?: boolean; message?: string; error?: string }>(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      const errorMsg = res.error || (res.data as any)?.message || 'Failed to delete reminder from server.';
      throw new Error(errorMsg);
    }

    // Only remove from local storage after confirmed success!
    const all = storage.getReminders().filter((r) => r.id !== id);
    storage.saveReminders(all);
  }

  async logDose(
    reminderId: string,
    time: string,
    status: 'taken' | 'skipped' | 'snoozed',
    date?: string
  ): Promise<MedicineReminder> {
    const today = date || new Date().toISOString().split('T')[0];
    const url = `${this.getBaseUrl()}/api/reminders/${encodeURIComponent(reminderId)}/dose`;
    const res = await safeFetchJson<any>(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ date: today, time, status }),
    });

    if (res.ok && res.data) {
      const updated: MedicineReminder = res.data.reminder || res.data;
      const all = storage.getReminders().map((r) => (r.id === updated.id ? updated : r));
      storage.saveReminders(all);
      return updated;
    }

    const all = storage.getReminders();
    const target = all.find((r) => r.id === reminderId);
    if (target) {
      const newLog = {
        id: `log_${Date.now()}`,
        reminderId,
        date: today,
        time,
        status,
        timestamp: Date.now(),
      };
      target.doseLogs = [
        ...(target.doseLogs || []).filter((l) => !(l.date === today && l.time === time)),
        newLog,
      ];
      storage.saveReminders(all);
      offlineSync.queueDoseLog(reminderId, time, status, today);
      return target;
    }
    throw new Error(res.error || 'Reminder not found');
  }

  // Prescriptions
  async getPrescriptions(): Promise<Prescription[]> {
    try {
      const res = await safeFetchJson<Prescription[]>(`${this.getBaseUrl()}/api/prescriptions`, {
        headers: this.getHeaders(),
      });
      if (res.ok && Array.isArray(res.data)) {
        storage.savePrescriptions(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('Network unavailable, serving local prescriptions:', e);
    }
    return storage.getPrescriptions();
  }

  async uploadPrescription(payload: {
    patientName: string;
    doctorName: string;
    clinicName?: string;
    fileDataUrl: string;
    fileName: string;
    fileType: 'image' | 'pdf';
    fileSize: string;
    notes: string;
  }): Promise<Prescription> {
    const res = await safeFetchJson<Prescription>(`${this.getBaseUrl()}/api/upload`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (res.ok && res.data) {
      const all = storage.getPrescriptions();
      all.unshift(res.data);
      storage.savePrescriptions(all);
      return res.data;
    }

    if (res.error && (res.error.includes('limit reached') || res.error.includes('PLAN_LIMIT_REACHED') || res.error.includes('Upgrade to Premium'))) {
      throw new Error(res.error);
    }

    // Local fallback if offline
    const localPrescription: Prescription = {
      id: `rx_${Date.now()}`,
      patientName: payload.patientName,
      doctorName: payload.doctorName,
      clinicName: payload.clinicName,
      date: new Date().toISOString().split('T')[0],
      fileDataUrl: payload.fileDataUrl,
      fileName: payload.fileName,
      fileType: payload.fileType,
      fileSize: payload.fileSize,
      status: 'Uploaded',
      notes: payload.notes,
      uploadedAt: Date.now(),
    };
    const all = storage.getPrescriptions();
    all.unshift(localPrescription);
    storage.savePrescriptions(all);
    return localPrescription;
  }

  async deletePrescription(id: string): Promise<void> {
    try {
      await fetch(`${this.getBaseUrl()}/api/prescriptions/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
    } catch (e) {
      console.warn('Network unavailable, deleting prescription locally:', e);
    }
    const all = storage.getPrescriptions().filter((p) => p.id !== id);
    storage.savePrescriptions(all);
  }

  // Doctors & Appointments
  async getDoctors(): Promise<Doctor[]> {
    try {
      const res = await safeFetchJson<Doctor[]>(`${this.getBaseUrl()}/api/doctors`, {
        headers: this.getHeaders(),
      });
      if (res.ok && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (e) {
      console.warn('Network unavailable, serving seed + custom doctors:', e);
    }
    const custom = storage.getCustomDoctors();
    return [...SEED_DOCTORS, ...custom];
  }

  async saveCustomDoctor(doctor: Partial<Doctor>): Promise<Doctor> {
    try {
      const res = await safeFetchJson<Doctor>(`${this.getBaseUrl()}/api/doctors`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(doctor),
      });
      if (res.ok && res.data) return res.data;
    } catch (e) {
      console.warn('Network unavailable, saving doctor locally:', e);
    }
    const fullDoctor: Doctor = {
      id: doctor.id || `doc_${Date.now()}`,
      name: doctor.name || 'Dr. Specialist',
      specialty: doctor.specialty || 'General Physician',
      qualification: doctor.qualification || 'MBBS, MD',
      experienceYears: doctor.experienceYears || 5,
      rating: doctor.rating || 4.8,
      reviewsCount: doctor.reviewsCount || 10,
      hospitalClinic: doctor.hospitalClinic || 'City Clinic',
      availableDays: doctor.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      timings: doctor.timings || '10:00 AM - 01:00 PM, 05:00 PM - 08:00 PM',
      consultationFee: doctor.consultationFee || 500,
      contactPhone: doctor.contactPhone || '+91 98765 43210',
      location: doctor.location || 'Central Clinic, MG Road',
      city: doctor.city || 'Ahmedabad',
      languages: doctor.languages || ['English', 'Hindi', 'Gujarati'],
      about: doctor.about || 'Experienced medical professional committed to holistic healthcare.',
      registrationNumber: doctor.registrationNumber || `MCI-${Date.now().toString().slice(-5)}`,
      isCustom: true,
    };
    const custom = storage.getCustomDoctors();
    custom.unshift(fullDoctor);
    storage.saveCustomDoctors(custom);
    return fullDoctor;
  }

  async deleteCustomDoctor(id: string): Promise<void> {
    try {
      await safeFetchJson(`${this.getBaseUrl()}/api/doctors/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
    } catch (e) {
      console.warn('Network unavailable, deleting doctor locally:', e);
    }
    const custom = storage.getCustomDoctors().filter((d) => d.id !== id);
    storage.saveCustomDoctors(custom);
  }

  async bookAppointment(data: {
    doctorId: string;
    doctorName: string;
    doctorSpecialty: string;
    hospitalClinic: string;
    day: string;
    timeSlot: string;
    consultationFee: number;
  }): Promise<Appointment> {
    try {
      const res = await safeFetchJson<Appointment>(`${this.getBaseUrl()}/api/appointments`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok && res.data) {
        const all = storage.getAppointments();
        all.unshift(res.data);
        storage.saveAppointments(all);
        return res.data;
      }
    } catch (e) {
      console.warn('Network unavailable, saving appointment locally:', e);
    }
    const profile = storage.getProfile();
    const appt: Appointment = {
      id: `appt_${Date.now()}`,
      bookingRef: `BK-${Date.now().toString().slice(-6)}`,
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      doctorSpecialty: data.doctorSpecialty,
      hospitalClinic: data.hospitalClinic,
      patientName: profile?.name || 'Self',
      patientPhone: profile?.mobile || '+91 98765 43210',
      day: data.day,
      timeSlot: data.timeSlot,
      consultationFee: data.consultationFee,
      status: 'Confirmed',
      createdAt: Date.now(),
    };
    const all = storage.getAppointments();
    all.unshift(appt);
    storage.saveAppointments(all);
    return appt;
  }

  // Caregiver Connection Code System
  async generateConnectionCode(): Promise<{
    success: boolean;
    code: string;
    expiresAt: number;
    secondsRemaining: number;
    patientName: string;
    patientPhone?: string;
  }> {
    const profile = storage.getProfile();
    const patientName = profile?.name || 'Family Member';
    const patientPhone = profile?.mobile || '';

    // First try the primary POST /api/connections/generate-code endpoint
    let res = await safeFetchJson<{
      success: boolean;
      code: string;
      expiresAt: number;
      secondsRemaining?: number;
      patientName: string;
      patientPhone?: string;
      error?: string;
      message?: string;
    }>(`${this.getBaseUrl()}/api/connections/generate-code`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ role: profile?.role || 'myself', name: patientName }),
    });

    // If 404, fallback to /api/caregiver/code/generate
    if (!res.ok && res.status === 404) {
      res = await safeFetchJson<{
        success: boolean;
        code: string;
        expiresAt: number;
        secondsRemaining?: number;
        patientName: string;
        patientPhone?: string;
        error?: string;
        message?: string;
      }>(`${this.getBaseUrl()}/api/caregiver/code/generate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ role: profile?.role || 'myself', name: patientName }),
      });
    }

    if (!res.ok) {
      const errorMsg = res.error || (res.data as any)?.message || 'Failed to generate connection code on server.';
      throw new Error(errorMsg);
    }

    if (!res.data || !res.data.code) {
      throw new Error('Server returned an empty or invalid connection code.');
    }

    const result = {
      success: true,
      code: res.data.code,
      expiresAt: res.data.expiresAt,
      secondsRemaining: res.data.secondsRemaining ?? Math.max(0, Math.floor((res.data.expiresAt - Date.now()) / 1000)),
      patientName: res.data.patientName || patientName,
      patientPhone: res.data.patientPhone || patientPhone,
    };

    storage.saveActiveCaregiverCode(result);
    return result;
  }

  async generateCaregiverCode(): Promise<{
    success: boolean;
    code: string;
    expiresAt: number;
    secondsRemaining: number;
    patientName: string;
    patientPhone?: string;
  }> {
    return this.generateConnectionCode();
  }

  async getActiveConnectionCode(): Promise<{
    code: string;
    expiresAt: number;
    secondsRemaining?: number;
    patientName: string;
    patientPhone?: string;
  } | null> {
    try {
      const res = await safeFetchJson<{
        code: string;
        expiresAt: number;
        secondsRemaining?: number;
        patientName: string;
        patientPhone?: string;
      }>(`${this.getBaseUrl()}/api/connections/code/active`, {
        headers: this.getHeaders(),
      });
      if (res.ok && res.data && res.data.code) {
        storage.saveActiveCaregiverCode(res.data);
        return res.data;
      }
    } catch {
      // ignore
    }

    try {
      const res = await safeFetchJson<{
        code: string;
        expiresAt: number;
        secondsRemaining?: number;
        patientName: string;
        patientPhone?: string;
      }>(`${this.getBaseUrl()}/api/caregiver/code/active`, {
        headers: this.getHeaders(),
      });
      if (res.ok && res.data && res.data.code) {
        storage.saveActiveCaregiverCode(res.data);
        return res.data;
      }
    } catch {
      // ignore
    }

    return storage.getActiveCaregiverCode();
  }

  async getActiveCaregiverCode(): Promise<{
    code: string;
    expiresAt: number;
    secondsRemaining?: number;
    patientName: string;
    patientPhone?: string;
  } | null> {
    return this.getActiveConnectionCode();
  }

  async connectCaregiver(code: string): Promise<{
    connection: CaregiverConnection;
    patientName: string;
    patientPhone?: string;
    patient?: { name: string; phone: string; status: string };
    connectedFamilyMember?: any;
    reminders?: MedicineReminder[];
    success?: boolean;
  }> {
    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      throw new Error('Please enter a valid 6-digit connection code.');
    }

    try {
      const res = await safeFetchJson<{
        connection: CaregiverConnection;
        patientName: string;
        patientPhone?: string;
        patient?: { name: string; phone: string; status: string };
        connectedFamilyMember?: any;
        reminders?: MedicineReminder[];
        success?: boolean;
      }>(`${this.getBaseUrl()}/api/caregiver/connect`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ code: cleanCode }),
      });

      if (res.ok && res.data && res.data.success !== false) {
        const conn = res.data.connection;
        if (conn) {
          const conns = storage.getCaregiverConnections().filter((c) => c.id !== conn.id && c.patientPhone !== conn.patientPhone);
          conns.unshift(conn);
          storage.saveCaregiverConnections(conns);
        }
        const targetPhone = res.data.patientPhone || conn?.patientPhone;
        if (targetPhone) {
          storage.savePatientRemindersCache(targetPhone, res.data.reminders || []);
        }
        return res.data;
      }
    } catch (e) {
      console.warn('Backend unavailable for connectCaregiver, connecting locally:', e);
    }

    // Offline / Standalone APK local connection fallback
    const active = storage.getActiveCaregiverCode();
    const profile = storage.getProfile();
    const patientName = active?.patientName || 'Family Member';
    const patientPhone = active?.patientPhone || '+91 98765 43210';

    const localConn: CaregiverConnection = {
      id: `conn_${Date.now()}`,
      patientPhone,
      caregiverPhone: profile?.mobile || '+91 98765 43210',
      patientName,
      caregiverName: profile?.name || 'Caregiver',
      status: 'active',
      permissions: {
        reminderStatus: true,
        unconfirmedAlerts: true,
        medicineName: true,
        scheduledTime: true,
        reminderHistory: true,
        viewDoseLogs: true,
        receiveMissedAlerts: true,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const conns = storage.getCaregiverConnections().filter((c) => c.id !== localConn.id);
    conns.unshift(localConn);
    storage.saveCaregiverConnections(conns);

    return {
      success: true,
      connection: localConn,
      patientName,
      patientPhone,
      reminders: storage.getReminders(),
    };
  }

  async confirmCaregiverConnection(id: string): Promise<CaregiverConnection> {
    const res = await safeFetchJson<CaregiverConnection>(
      `${this.getBaseUrl()}/api/caregiver/connections/${id}/confirm`,
      {
        method: 'POST',
        headers: this.getHeaders(),
      }
    );
    if (res.ok && res.data) {
      const conns = storage.getCaregiverConnections();
      const idx = conns.findIndex(c => c.id === id);
      if (idx >= 0) conns[idx] = res.data;
      else conns.unshift(res.data);
      storage.saveCaregiverConnections(conns);
      return res.data;
    }

    const conns = storage.getCaregiverConnections();
    const match = conns.find((c) => c.id === id);
    if (match) {
      match.status = 'active';
      match.updatedAt = Date.now();
      storage.saveCaregiverConnections(conns);
      return match;
    }
    throw new Error(res.error || 'Failed to confirm connection on backend.');
  }

  async getCaregiverConnections(): Promise<CaregiverConnection[]> {
    try {
      const res = await safeFetchJson<CaregiverConnection[]>(
        `${this.getBaseUrl()}/api/caregiver/connections`,
        {
          headers: this.getHeaders(),
        }
      );
      if (res.ok && res.data) {
        storage.saveCaregiverConnections(res.data);
        return res.data;
      }
    } catch {
      // fallback
    }
    return storage.getCaregiverConnections();
  }

  async updateCaregiverPermissions(id: string, permissions: CaregiverPermissions): Promise<CaregiverConnection> {
    const res = await safeFetchJson<CaregiverConnection>(
      `${this.getBaseUrl()}/api/caregiver/connections/${id}/permissions`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ permissions }),
      }
    );
    if (res.ok && res.data) {
      const conns = storage.getCaregiverConnections();
      const idx = conns.findIndex(c => c.id === id);
      if (idx >= 0) conns[idx] = res.data;
      storage.saveCaregiverConnections(conns);
      return res.data;
    }

    const conns = storage.getCaregiverConnections();
    const item = conns.find((c) => c.id === id);
    if (item) {
      item.permissions = permissions;
      item.updatedAt = Date.now();
      storage.saveCaregiverConnections(conns);
      return item;
    }
    throw new Error(res.error || 'Failed to update caregiver permissions.');
  }

  async deleteCaregiverConnection(id: string): Promise<void> {
    try {
      await safeFetchJson(`${this.getBaseUrl()}/api/caregiver/connections/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
    } catch {
      // fallback
    }
    const conns = storage.getCaregiverConnections().filter((c) => c.id !== id);
    storage.saveCaregiverConnections(conns);
  }

  async getCaregiverDashboard(): Promise<CaregiverDashboardData> {
    try {
      const res = await safeFetchJson<CaregiverDashboardData>(
        `${this.getBaseUrl()}/api/caregiver/dashboard`,
        {
          headers: this.getHeaders(),
        }
      );
      if (res.ok && res.data) {
        storage.saveCaregiverDashboardCache(res.data);
        return res.data;
      }
    } catch {
      // fallback
    }

    // 1. Try cached dashboard from prior successful fetch
    const cached = storage.getCaregiverDashboardCache();
    if (cached && cached.members && cached.members.length > 0) {
      return cached;
    }

    // 2. Build from stored connections with patient-specific reminders
    const conns = storage.getCaregiverConnections();
    const members: CaregiverDashboardMember[] = conns.map((c) => {
      const patientPhone = c.patientPhone;
      const patientName = c.patientName;
      const familyMemberUserId = c.familyMemberUserId || c.patientUserId || patientPhone;
      const patientReminders = storage.getPatientRemindersCache(patientPhone) || [];

      return {
        connectionId: c.id,
        patientUserId: familyMemberUserId,
        familyMemberUserId: familyMemberUserId,
        ownerUserId: familyMemberUserId,
        caregiverUserId: c.caregiverUserId,
        patientPhone,
        patientName,
        connectedFamilyMember: {
          id: familyMemberUserId,
          userId: familyMemberUserId,
          name: patientName,
          phone: patientPhone,
          status: 'connected',
        },
        status: 'active' as const,
        permissions: c.permissions,
        stats: {
          taken: patientReminders.filter((r) => r.active).length,
          upcoming: patientReminders.length,
          unconfirmed: 0,
        },
        schedule: patientReminders.map((r) => ({
          medicineName: r.medicineName,
          dosage: r.dosage,
          instructions: r.instructions || '',
          doses: (r.times || []).map((t) => ({ time: t, status: 'upcoming' as const })),
        })),
      };
    });

    return {
      members,
      alerts: [],
      alertLog: [],
    };
  }

  async getCaregiverAlerts(): Promise<CaregiverAlert[]> {
    try {
      const res = await safeFetchJson<CaregiverAlert[]>(
        `${this.getBaseUrl()}/api/caregiver/alerts`,
        {
          headers: this.getHeaders(),
        }
      );
      if (res.ok && res.data) return res.data;
    } catch {
      // fallback
    }
    return [];
  }

  async getConnectedMemberReminders(patientPhone: string): Promise<{
    patientName: string;
    patientPhone: string;
    reminders: MedicineReminder[];
  }> {
    try {
      const res = await safeFetchJson<{
        patientName: string;
        patientPhone: string;
        reminders: MedicineReminder[];
      }>(`${this.getBaseUrl()}/api/caregiver/member/${encodeURIComponent(patientPhone)}/reminders`, {
        headers: this.getHeaders(),
      });
      if (res.ok && res.data) {
        storage.savePatientRemindersCache(patientPhone, res.data.reminders || []);
        return res.data;
      }
    } catch {
      // fallback
    }

    const conns = storage.getCaregiverConnections();
    const match = conns.find((c) => c.patientPhone === patientPhone);
    const cached = storage.getPatientRemindersCache(patientPhone) || [];
    return {
      patientName: match?.patientName || 'Family Member',
      patientPhone,
      reminders: cached,
    };
  }

  // Backup & Restore
  async syncBackup(data: unknown): Promise<{ success: boolean; syncedAt: number }> {
    try {
      const res = await safeFetchJson<{ success: boolean; syncedAt: number }>(`${this.getBaseUrl()}/api/sync/backup`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok && res.data) return res.data;
    } catch {
      // fallback
    }
    return { success: true, syncedAt: Date.now() };
  }

  async restoreSync(): Promise<unknown> {
    try {
      const res = await safeFetchJson<unknown>(`${this.getBaseUrl()}/api/sync/restore`, {
        headers: this.getHeaders(),
      });
      if (res.ok && res.data) return res.data;
    } catch {
      // fallback
    }
    return null;
  }

  // Subscription & Plan Management
  async getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
    try {
      const res = await safeFetchJson<SubscriptionStatusResponse>(
        `${this.getBaseUrl()}/api/subscription/status`,
        {
          headers: this.getHeaders(),
        }
      );
      if (res.ok && res.data) {
        return res.data;
      }
    } catch {
      // fallback
    }

    const profile = storage.getProfile();
    const reminders = storage.getReminders();
    const prescriptions = storage.getPrescriptions();
    const conns = storage.getCaregiverConnections();
    const isPremium = profile?.plan === 'premium' && profile?.subscriptionStatus === 'active';
    const plan: SubscriptionPlan = isPremium ? 'premium' : 'free';

    return {
      success: true,
      plan,
      isPremium,
      subscription: {
        userId: profile?.id || 'demo_user',
        phone: profile?.mobile || '+91 98765 43210',
        plan,
        status: isPremium ? 'active' : 'none',
        startDate: profile?.subscriptionExpiry ? profile.subscriptionExpiry - 30 * 86400000 : null,
        expiryDate: profile?.subscriptionExpiry || null,
        billingCycle: 'monthly',
        paymentStatus: isPremium ? 'active' : 'none',
        updatedAt: Date.now(),
      },
      limits: {
        reminders: { max: isPremium ? 9999 : 3, current: reminders.length, canAdd: isPremium || reminders.length < 3 },
        prescriptions: { max: isPremium ? 9999 : 3, current: prescriptions.length, canAdd: isPremium || prescriptions.length < 3 },
        caregivers: { max: isPremium ? 9999 : 1, current: conns.length, canAdd: isPremium || conns.length < 1 },
      },
    };
  }

  async getSubscriptionLimits(): Promise<{ success: boolean; plan: SubscriptionPlan; isPremium: boolean; limits: PlanLimits }> {
    try {
      const res = await safeFetchJson<{ success: boolean; plan: SubscriptionPlan; isPremium: boolean; limits: PlanLimits }>(
        `${this.getBaseUrl()}/api/subscription/limits`,
        {
          headers: this.getHeaders(),
        }
      );
      if (res.ok && res.data) {
        return res.data;
      }
    } catch {
      // fallback
    }

    const sub = await this.getSubscriptionStatus();
    return {
      success: true,
      plan: sub.plan,
      isPremium: sub.isPremium,
      limits: sub.limits,
    };
  }

  async upgradeSubscription(billingCycle: 'monthly' | 'yearly' = 'monthly'): Promise<SubscriptionStatusResponse> {
    try {
      const res = await safeFetchJson<SubscriptionStatusResponse>(
        `${this.getBaseUrl()}/api/subscription/upgrade`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ billingCycle, paymentMethod: 'payment_ready' }),
        }
      );
      if (res.ok && res.data) {
        return res.data;
      }
    } catch {
      // fallback
    }

    const profile = storage.getProfile() || {
      id: 'demo_user',
      name: 'User',
      mobile: '+91 98765 43210',
      role: 'patient' as const,
      language: 'en' as const,
      isLoggedIn: true,
    };
    const durationDays = billingCycle === 'yearly' ? 365 : 30;
    const expiry = Date.now() + durationDays * 24 * 60 * 60 * 1000;
    const updated: UserProfile = {
      ...profile,
      plan: 'premium',
      subscriptionStatus: 'active',
      subscriptionExpiry: expiry,
    };
    storage.saveProfile(updated);

    const reminders = storage.getReminders();
    const prescriptions = storage.getPrescriptions();
    const conns = storage.getCaregiverConnections();

    return {
      success: true,
      plan: 'premium',
      isPremium: true,
      subscription: {
        userId: updated.id || 'demo_user',
        phone: updated.mobile,
        plan: 'premium',
        status: 'active',
        startDate: Date.now(),
        expiryDate: expiry,
        billingCycle,
        paymentStatus: 'active',
        updatedAt: Date.now(),
      },
      limits: {
        reminders: { max: 9999, current: reminders.length, canAdd: true },
        prescriptions: { max: 9999, current: prescriptions.length, canAdd: true },
        caregivers: { max: 9999, current: conns.length, canAdd: true },
      },
    };
  }

  async cancelSubscription(): Promise<SubscriptionStatusResponse> {
    try {
      const res = await safeFetchJson<SubscriptionStatusResponse>(
        `${this.getBaseUrl()}/api/subscription/cancel`,
        {
          method: 'POST',
          headers: this.getHeaders(),
        }
      );
      if (res.ok && res.data) {
        return res.data;
      }
    } catch {
      // fallback
    }

    const profile = storage.getProfile();
    if (profile) {
      const updated: UserProfile = {
        ...profile,
        plan: 'free',
        subscriptionStatus: 'cancelled',
      };
      storage.saveProfile(updated);
    }

    const reminders = storage.getReminders();
    const prescriptions = storage.getPrescriptions();
    const conns = storage.getCaregiverConnections();

    return {
      success: true,
      plan: 'free',
      isPremium: false,
      subscription: {
        userId: profile?.id || 'demo_user',
        phone: profile?.mobile || '+91 98765 43210',
        plan: 'free',
        status: 'cancelled',
        startDate: null,
        expiryDate: null,
        billingCycle: null,
        paymentStatus: 'none',
        updatedAt: Date.now(),
      },
      limits: {
        reminders: { max: 3, current: reminders.length, canAdd: reminders.length < 3 },
        prescriptions: { max: 3, current: prescriptions.length, canAdd: prescriptions.length < 3 },
        caregivers: { max: 1, current: conns.length, canAdd: conns.length < 1 },
      },
    };
  }
}

export const api = new ApiClient();
