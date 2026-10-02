import { Router, type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { repository, phonesMatch, normalizePhone, type CaregiverCodeRecord } from './repository.ts';
import { crossDeviceHub } from './crossDeviceHub.ts';
import type {
  UserProfile,
  Medicine,
  MedicineReminder,
  Prescription,
  Doctor,
  Appointment,
  CaregiverConnection,
  CaregiverDashboardMember,
  CaregiverDashboardData,
  ConnectedDevice,
  DeviceNudge,
  UserSubscription,
} from '../src/types.ts';

const SESSION_SECRET = process.env.SESSION_SECRET || 'pharmacare_super_secure_jwt_secret_key_2026';
const ALLOW_TEST_OTP = process.env.ALLOW_TEST_OTP !== 'false';

interface AuthTokenPayload {
  phone: string;
  name?: string;
}

declare global {
  namespace Express {
    interface Request {
      userPhone?: string;
      userName?: string;
    }
  }
}

// In-memory OTP storage with expiration and rate-limiting
interface OtpStoreItem {
  code: string;
  expiresAt: number;
  attempts: number;
}
const otpStore = new Map<string, OtpStoreItem>();
const otpRateLimit = new Map<string, { count: number; resetAt: number }>();

// Connection code rate-limiting: max 5 generates per 5 minutes per user
const connectionCodeRateLimit = new Map<string, { count: number; resetAt: number }>();

function generateRandom6Digits(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function parseTimeToMinutes(t: string): number {
  if (!t) return 0;
  const match = t.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && h < 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

function formatTimeDisplay(t: string): string {
  if (!t) return '';
  const match = t.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return t;
  let h = parseInt(match[1], 10);
  const m = match[2];
  let meridiem = match[3]?.toUpperCase();
  if (!meridiem) {
    meridiem = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
  }
  return `${h}:${m} ${meridiem}`;
}

// Authentication Middleware
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

  if (token) {
    try {
      const decoded = jwt.verify(token, SESSION_SECRET) as AuthTokenPayload;
      if (decoded?.phone) {
        req.userPhone = decoded.phone;
        req.userName = decoded.name || 'User';
        return next();
      }
    } catch {
      // Fall through to check custom headers
    }
  }

  // Fallback X-User-Phone / X-User-Name headers (essential for APK reliability, demo transition, or network sync)
  const phoneHeader =
    (req.headers['x-user-phone'] as string) ||
    (req.headers['x-phone'] as string) ||
    (req.body?.patientPhone as string) ||
    (req.body?.phone as string);
  const nameHeader =
    (req.headers['x-user-name'] as string) ||
    (req.headers['x-name'] as string) ||
    (req.body?.patientName as string) ||
    (req.body?.name as string);

  if (phoneHeader && typeof phoneHeader === 'string' && phoneHeader.trim()) {
    const cleanPhone = phoneHeader.trim();
    req.userPhone = cleanPhone;
    req.userName = nameHeader && typeof nameHeader === 'string' ? nameHeader.trim() : 'User';
    return next();
  }

  res.status(401).json({
    success: false,
    error: 'UNAUTHORIZED',
    message: 'Authentication required. Please sign in again.',
  });
};

export const router = Router();

// 1. Health & Status
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'pharmacare-api',
    database: 'connected',
    timestamp: Date.now(),
  });
});

router.get('/backend/status', async (_req: Request, res: Response) => {
  try {
    const doctors = await repository.getDoctors();
    const conns = await repository.getAllActiveConnections();
    res.json({
      status: 'healthy',
      version: '1.0.0',
      database: 'Persistent Repository Layer (JSON / PostgreSQL)',
      remindersCount: 0,
      prescriptionsCount: 0,
      appointmentsCount: (await repository.getAppointments()).length,
      doctorsCount: doctors.length,
      activeCaregiverConnections: conns.length,
      testOtpAllowed: ALLOW_TEST_OTP,
    });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Status check failed' });
  }
});

// 2. Auth Endpoints
router.post('/auth/send-otp', (req: Request, res: Response) => {
  const phone = req.body.phone || req.body.mobile;
  if (!phone || typeof phone !== 'string' || phone.replace(/\D/g, '').length < 7) {
    res.status(400).json({ error: 'Please provide a valid mobile number (at least 7 digits).' });
    return;
  }

  const cleanPhone = phone.trim();
  const now = Date.now();

  const rate = otpRateLimit.get(cleanPhone) || { count: 0, resetAt: now + 600000 };
  if (now > rate.resetAt) {
    rate.count = 0;
    rate.resetAt = now + 600000;
  }
  if (rate.count >= 5) {
    res.status(429).json({ error: 'Too many OTP requests. Please wait a few minutes before trying again.' });
    return;
  }
  rate.count++;
  otpRateLimit.set(cleanPhone, rate);

  const otpCode = generateRandom6Digits();
  otpStore.set(cleanPhone, {
    code: otpCode,
    expiresAt: now + 5 * 60 * 1000,
    attempts: 0,
  });

  res.json({
    success: true,
    message: 'OTP sent successfully',
    testOtp: ALLOW_TEST_OTP ? '123456' : undefined,
  });
});

router.post('/auth/verify-otp', async (req: Request, res: Response) => {
  const phone = req.body.phone || req.body.mobile;
  const otp = req.body.otp || req.body.code;
  const { name } = req.body;
  if (!phone || !otp) {
    res.status(400).json({ error: 'Phone and OTP are required' });
    return;
  }

  const cleanPhone = phone.trim();
  const cleanOtp = String(otp).trim();
  const now = Date.now();

  const stored = otpStore.get(cleanPhone);
  const isTestOtpValid = ALLOW_TEST_OTP && cleanOtp === '123456';
  const isRealOtpValid = stored && stored.code === cleanOtp && stored.expiresAt > now;

  if (!isTestOtpValid && !isRealOtpValid) {
    if (stored) stored.attempts++;
    res.status(400).json({ error: 'Invalid or expired OTP code. Please try again.' });
    return;
  }

  otpStore.delete(cleanPhone);

  let user = await repository.getUserByPhone(cleanPhone);
  if (!user) {
    user = {
      mobile: cleanPhone,
      name: name?.trim() || 'Friend',
      email: '',
      bloodGroup: 'O+',
      allergies: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      isLoggedIn: true,
      preferredLanguage: 'en',
      role: 'myself',
      reminderGracePeriodMinutes: 30,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    };
    await repository.saveUser(user);
  } else if (name && name.trim()) {
    user.name = name.trim();
    await repository.saveUser(user);
  }

  const token = jwt.sign(
    { phone: user.mobile, name: user.name },
    SESSION_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    success: true,
    token,
    user,
  });
});

// 3. User Profile
router.get('/user/profile', requireAuth, async (req: Request, res: Response) => {
  const user = await repository.getUserByPhone(req.userPhone!);
  if (!user) {
    res.status(404).json({ error: 'User profile not found' });
    return;
  }
  res.json(user);
});

router.put('/user/profile', requireAuth, async (req: Request, res: Response) => {
  const existing = await repository.getUserByPhone(req.userPhone!);
  const updated: UserProfile = {
    ...existing,
    ...req.body,
    mobile: req.userPhone!,
    isLoggedIn: true,
  };
  await repository.saveUser(updated);
  res.json(updated);
});

// 4. Medicines CRUD
router.get('/medicines', requireAuth, async (req: Request, res: Response) => {
  try {
    const list = await repository.getMedicines(req.userPhone!);
    res.json(list);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch medicines';
    res.status(500).json({ success: false, error: 'MEDICINES_FETCH_ERROR', message: msg });
  }
});

router.get('/medicines/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const med = await repository.getMedicineById(req.userPhone!, req.params.id);
    if (!med) {
      res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Medicine not found' });
      return;
    }
    res.json(med);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch medicine';
    res.status(500).json({ success: false, error: 'MEDICINE_FETCH_ERROR', message: msg });
  }
});

router.post('/medicines', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, genericName, category, dosageForm, strength, uses, dosageGuidelines, sideEffects, precautions, storage: medStorage, prescriptionRequired, manufacturer } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Medicine name is required.' });
      return;
    }

    const medicine: Medicine = {
      id: req.body.id || `med_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      genericName: (genericName || '').trim(),
      category: category || 'General Health',
      dosageForm: dosageForm || 'Tablet',
      strength: (strength || '500mg').trim(),
      uses: Array.isArray(uses) ? uses : (uses ? String(uses).split(',').map(s => s.trim()) : ['General therapeutic treatment']),
      dosageGuidelines: dosageGuidelines || 'As prescribed by physician',
      sideEffects: Array.isArray(sideEffects) ? sideEffects : ['Mild discomfort (rare)'],
      precautions: Array.isArray(precautions) ? precautions : ['Keep out of reach of children'],
      storage: medStorage || 'Store in cool and dry place',
      prescriptionRequired: !!prescriptionRequired,
      manufacturer: manufacturer || 'PharmaCare Formulation',
      userId: req.userPhone!,
      isCustom: true,
    };

    const saved = await repository.saveMedicine(req.userPhone!, medicine);
    res.status(201).json({ success: true, medicine: saved, data: saved });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save medicine';
    res.status(500).json({ success: false, error: 'MEDICINE_SAVE_ERROR', message: msg });
  }
});

router.put('/medicines/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const existing = await repository.getMedicineById(req.userPhone!, req.params.id);
    const updated: Medicine = {
      ...(existing || {}),
      ...req.body,
      id: req.params.id,
      name: req.body.name?.trim() || existing?.name || 'Custom Medicine',
      genericName: req.body.genericName?.trim() || existing?.genericName || '',
      category: req.body.category || existing?.category || 'General Health',
      strength: req.body.strength || existing?.strength || '500mg',
      dosageForm: req.body.dosageForm || existing?.dosageForm || 'Tablet',
      uses: Array.isArray(req.body.uses) ? req.body.uses : (existing?.uses || ['General therapeutic treatment']),
      dosageGuidelines: req.body.dosageGuidelines || existing?.dosageGuidelines || 'As prescribed by physician',
      sideEffects: Array.isArray(req.body.sideEffects) ? req.body.sideEffects : (existing?.sideEffects || ['Mild discomfort (rare)']),
      precautions: Array.isArray(req.body.precautions) ? req.body.precautions : (existing?.precautions || ['Keep out of reach of children']),
      storage: req.body.storage || existing?.storage || 'Store in cool and dry place',
      prescriptionRequired: req.body.prescriptionRequired !== undefined ? !!req.body.prescriptionRequired : (existing?.prescriptionRequired || false),
      userId: req.userPhone!,
      isCustom: true,
    };

    const saved = await repository.saveMedicine(req.userPhone!, updated);
    res.json({ success: true, medicine: saved, data: saved });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update medicine';
    res.status(500).json({ success: false, error: 'MEDICINE_UPDATE_ERROR', message: msg });
  }
});

router.delete('/medicines/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const success = await repository.deleteMedicine(req.userPhone!, req.params.id);
    if (!success) {
      res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Custom medicine not found or cannot be deleted' });
      return;
    }

    const activeConns = await repository.getConnectionsForPatient(req.userPhone!);
    const caregiverPhones = activeConns.filter(c => c.status === 'active').map(c => c.caregiverPhone);
    if (caregiverPhones.length > 0) {
      const allReminders = await repository.getReminders(req.userPhone!);
      crossDeviceHub.notifyRemindersUpdated(req.userPhone!, caregiverPhones, allReminders);
    }

    res.json({ success: true, message: 'Medicine and associated reminders removed successfully.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete medicine';
    res.status(500).json({ success: false, error: 'MEDICINE_DELETE_ERROR', message: msg });
  }
});

// 5. Reminders System (Step 2 & Step 3)
const createReminderHandler = async (req: Request, res: Response) => {
  try {
    if (!req.body.medicineName || typeof req.body.medicineName !== 'string' || !req.body.medicineName.trim()) {
      res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Medicine name is required.' });
      return;
    }

    if (!req.body.dosage || typeof req.body.dosage !== 'string' || !req.body.dosage.trim()) {
      res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Dosage is required (e.g. 1 Tablet, 500mg).' });
      return;
    }

    if (!Array.isArray(req.body.times) || req.body.times.length === 0 || !req.body.times.some((t: any) => typeof t === 'string' && t.trim())) {
      res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'At least one valid reminder time is required.' });
      return;
    }

    // Caregiver-only restriction: Preserve this permission rule
    const callerUser = await repository.getUserByPhone(req.userPhone!);
    if (callerUser && (callerUser.role === 'caregiver' || callerUser.mode === 'family_caregiver') && callerUser.mode !== 'dual' && callerUser.role !== 'dual') {
      res.status(403).json({
        success: false,
        error: 'CAREGIVER_MODE_RESTRICTION',
        message: 'Creating personal reminders is restricted in Caregiver-only mode. Switch to Personal or Dual mode to manage reminders.',
      });
      return;
    }

    // Plan limits check for free users
    if (!req.body.id) {
      const limits = await repository.checkPlanLimits(req.userPhone!);
      if (!limits.reminders.canAdd) {
        res.status(403).json({
          success: false,
          error: 'PLAN_LIMIT_REACHED',
          message: 'Free plan limit reached. Upgrade to Premium for unlimited medicine reminders.',
          limit: limits.reminders.max,
          currentCount: limits.reminders.current,
          feature: 'reminders',
        });
        return;
      }
    }

    const reminder: MedicineReminder = {
      id: req.body.id || `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: req.userPhone,
      ownerUserId: req.userPhone,
      medicineName: req.body.medicineName.trim(),
      genericName: req.body.genericName?.trim() || '',
      dosage: req.body.dosage.trim(),
      frequency: req.body.frequency || 'Once Daily',
      times: req.body.times.filter((t: any) => typeof t === 'string' && t.trim()),
      startDate: req.body.startDate || new Date().toISOString().split('T')[0],
      endDate: req.body.endDate,
      instructions: req.body.instructions || 'After Food',
      active: req.body.active !== false,
      notes: req.body.notes || '',
      colorTag: req.body.colorTag || '#0EA5E9',
      doseLogs: req.body.doseLogs || [],
      createdAt: req.body.createdAt || Date.now(),
    };
    await repository.saveReminder(req.userPhone!, reminder);

    // Notify connected caregivers
    const activeConns = await repository.getConnectionsForPatient(req.userPhone!);
    const caregiverPhones = activeConns.filter(c => c.status === 'active').map(c => c.caregiverPhone);
    if (caregiverPhones.length > 0) {
      const allReminders = await repository.getReminders(req.userPhone!);
      crossDeviceHub.notifyRemindersUpdated(req.userPhone!, caregiverPhones, allReminders);
    }

    res.status(201).json({
      success: true,
      reminder,
      ...reminder,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save reminder';
    res.status(500).json({ success: false, error: 'REMINDER_SAVE_ERROR', message: msg });
  }
};

const updateReminderHandler = async (req: Request, res: Response) => {
  try {
    const existing = await repository.getReminderById(req.userPhone!, req.params.id);

    const updated: MedicineReminder = {
      id: req.params.id,
      userId: req.userPhone,
      ownerUserId: req.userPhone,
      medicineName: req.body.medicineName?.trim() || existing?.medicineName || 'Medicine',
      genericName: req.body.genericName !== undefined ? req.body.genericName : (existing?.genericName || ''),
      dosage: req.body.dosage?.trim() || existing?.dosage || '1 Tablet',
      frequency: req.body.frequency || existing?.frequency || 'Once Daily',
      times: Array.isArray(req.body.times) && req.body.times.length > 0 ? req.body.times : (existing?.times || ['09:00']),
      startDate: req.body.startDate || existing?.startDate || new Date().toISOString().split('T')[0],
      endDate: req.body.endDate !== undefined ? req.body.endDate : existing?.endDate,
      instructions: req.body.instructions || existing?.instructions || 'After Food',
      active: req.body.active !== undefined ? req.body.active : (existing ? existing.active : true),
      notes: req.body.notes !== undefined ? req.body.notes : (existing?.notes || ''),
      colorTag: req.body.colorTag || existing?.colorTag || '#0EA5E9',
      doseLogs: req.body.doseLogs || existing?.doseLogs || [],
      createdAt: existing?.createdAt || Date.now(),
    };
    await repository.saveReminder(req.userPhone!, updated);

    const activeConns = await repository.getConnectionsForPatient(req.userPhone!);
    const caregiverPhones = activeConns.filter(c => c.status === 'active').map(c => c.caregiverPhone);
    if (caregiverPhones.length > 0) {
      const allReminders = await repository.getReminders(req.userPhone!);
      crossDeviceHub.notifyRemindersUpdated(req.userPhone!, caregiverPhones, allReminders);
    }

    res.json({
      success: true,
      reminder: updated,
      ...updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update reminder';
    res.status(500).json({ success: false, error: 'REMINDER_UPDATE_ERROR', message: msg });
  }
};

const deleteReminderHandler = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'Valid reminder ID required.' });
      return;
    }

    // Verify record exists and check ownership or caregiver permissions
    const existing = await repository.getReminderById(req.userPhone!, id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Reminder not found or already deleted.' });
      return;
    }

    const isOwner = phonesMatch(existing.userId || '', req.userPhone!) || phonesMatch(existing.ownerUserId || '', req.userPhone!);
    if (!isOwner) {
      const conns = await repository.getConnectionsForCaregiver(req.userPhone!);
      const hasAccess = conns.some(c => c.status === 'active' && phonesMatch(c.patientPhone, existing.userId || ''));
      if (!hasAccess) {
        res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'You do not have permission to delete this reminder.' });
        return;
      }
    }

    const success = await repository.deleteReminder(req.userPhone!, id);
    if (!success) {
      res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Reminder not found' });
      return;
    }

    // Notify connected caregivers
    const activeConns = await repository.getConnectionsForPatient(req.userPhone!);
    const caregiverPhones = activeConns.filter(c => c.status === 'active').map(c => c.caregiverPhone);
    if (caregiverPhones.length > 0) {
      const allReminders = await repository.getReminders(req.userPhone!);
      crossDeviceHub.notifyRemindersUpdated(req.userPhone!, caregiverPhones, allReminders);
    }

    res.json({ success: true, message: 'Reminder deleted successfully.', id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete reminder';
    res.status(500).json({ success: false, error: 'REMINDER_DELETE_ERROR', message: msg });
  }
};

router.get('/reminders', requireAuth, async (req: Request, res: Response) => {
  try {
    const list = await repository.getReminders(req.userPhone!);
    res.json(list);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch reminders';
    res.status(500).json({ success: false, error: 'REMINDERS_FETCH_ERROR', message: msg });
  }
});

router.get('/reminders/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const rem = await repository.getReminderById(req.userPhone!, req.params.id);
    if (!rem) {
      res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Reminder not found' });
      return;
    }
    res.json(rem);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch reminder';
    res.status(500).json({ success: false, error: 'REMINDER_FETCH_ERROR', message: msg });
  }
});

router.post('/reminders', requireAuth, createReminderHandler);
router.put('/reminders/:id', requireAuth, updateReminderHandler);
router.delete('/reminders/:id', requireAuth, deleteReminderHandler);

router.post('/reminders/:id/dose', requireAuth, async (req: Request, res: Response) => {
  try {
    const { date, time, status } = req.body;
    const reminder = await repository.getReminderById(req.userPhone!, req.params.id);
    if (!reminder) {
      res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Reminder not found' });
      return;
    }

    const logIdx = reminder.doseLogs.findIndex(l => l.date === date && l.time === time);
    const newLog = { date, time, status, timestamp: Date.now() };
    if (logIdx >= 0) {
      reminder.doseLogs[logIdx] = newLog;
    } else {
      reminder.doseLogs.push(newLog);
    }
    await repository.saveReminder(req.userPhone!, reminder);

    if (status === 'taken') {
      await repository.resolveAlertsForDose(req.userPhone!, reminder.id, date, time);
    }

    const activeConns = await repository.getConnectionsForPatient(req.userPhone!);
    const caregiverPhones = activeConns.filter(c => c.status === 'active').map(c => c.caregiverPhone);
    if (caregiverPhones.length > 0) {
      crossDeviceHub.notifyDoseLogged(req.userPhone!, caregiverPhones, reminder, time, status);
    }

    res.json({ success: true, ...reminder, reminder });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to log dose';
    res.status(500).json({ success: false, error: 'DOSE_LOG_ERROR', message: msg });
  }
});

// 6. Caregiver Connection Code Generation (Step 4)
const generateConnectionCodeHandler = async (req: Request, res: Response) => {
  try {
    const phone = req.userPhone;
    if (!phone) {
      res.status(400).json({ success: false, error: 'User phone is required to generate connection code.' });
      return;
    }

    let user = await repository.getUserByPhone(phone);
    if (!user) {
      user = {
        id: `user_${phone.replace(/\D/g, '') || Date.now()}`,
        mobile: phone,
        name: req.userName || 'Family Member',
        email: '',
        bloodGroup: 'O+',
        allergies: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        isLoggedIn: true,
        preferredLanguage: 'en',
        role: 'myself',
        mode: 'myself',
        reminderGracePeriodMinutes: 30,
        timezone: 'Asia/Kolkata',
      };
      await repository.saveUser(user);
    }

    // Caregiver-only restriction: Generating a code must remain restricted to patient or dual mode
    if (user.role === 'caregiver' || user.mode === 'family_caregiver') {
      if (user.mode !== 'dual' && user.role !== 'dual') {
        res.status(403).json({
          success: false,
          error: 'CAREGIVER_MODE_RESTRICTION',
          message: 'Generating connection codes is restricted in Caregiver-only mode. Only patients or dual-mode users can invite caregivers.',
        });
        return;
      }
    }

    // Rate limiting: max 5 code generations per 5 minutes per user
    const now = Date.now();
    const cleanPhone = phone.trim();
    const rate = connectionCodeRateLimit.get(cleanPhone) || { count: 0, resetAt: now + 5 * 60 * 1000 };
    if (now > rate.resetAt) {
      rate.count = 0;
      rate.resetAt = now + 5 * 60 * 1000;
    }
    if (rate.count >= 5) {
      res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many connection codes generated recently. Please wait a few minutes.',
      });
      return;
    }
    rate.count++;
    connectionCodeRateLimit.set(cleanPhone, rate);

    const specifiedName =
      req.body?.patientName ||
      req.body?.name ||
      (req.userName && req.userName !== 'User' && req.userName !== 'Friend' ? req.userName : undefined);
    if (specifiedName && user.name !== specifiedName) {
      user.name = specifiedName;
      await repository.saveUser(user);
    }

    const patientName = user.name || specifiedName || 'Family Member';
    const patientUserId = user.id || `user_${phone.replace(/\D/g, '') || Date.now()}`;

    // Generate secure 6-digit numeric code
    let code = generateRandom6Digits();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await repository.findCaregiverCode(code);
      if (!existing || existing.used || existing.status !== 'active' || existing.expiresAt <= Date.now()) {
        break;
      }
      code = generateRandom6Digits();
      attempts++;
    }

    // 15-minute expiry policy as mandated
    const EXPIRES_IN_MS = 15 * 60 * 1000;
    const expiresAt = now + EXPIRES_IN_MS;
    const secondsRemaining = 900; // 15 * 60

    const record: CaregiverCodeRecord = {
      code,
      connectionCode: code,
      patientPhone: phone,
      patientName,
      patientUserId,
      familyMemberUserId: patientUserId,
      ownerUserId: patientUserId,
      createdAt: now,
      expiresAt,
      used: false,
      status: 'active',
    };

    await repository.saveCaregiverCode(record);

    res.json({
      success: true,
      code,
      expiresAt,
      secondsRemaining,
      patientName,
      patientPhone: phone,
      patientUserId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate connection code';
    res.status(500).json({ success: false, error: msg });
  }
};

// Register at BOTH /connections/generate-code and /caregiver/code/generate
router.post('/connections/generate-code', requireAuth, generateConnectionCodeHandler);
router.post('/caregiver/code/generate', requireAuth, generateConnectionCodeHandler);

// Active Code Retrieval
const getActiveCodeHandler = async (req: Request, res: Response) => {
  try {
    const phone = req.userPhone;
    if (!phone) {
      res.status(400).json({ success: false, error: 'User phone required' });
      return;
    }
    const active = await repository.getActiveCaregiverCode(phone);
    if (!active) {
      res.status(404).json({ success: false, error: 'No active caregiver code found' });
      return;
    }
    const now = Date.now();
    const secondsRemaining = Math.max(0, Math.floor((active.expiresAt - now) / 1000));
    res.json({
      success: true,
      code: active.code,
      expiresAt: active.expiresAt,
      secondsRemaining,
      patientName: active.patientName,
      patientPhone: active.patientPhone,
      patientUserId: active.patientUserId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve code';
    res.status(500).json({ success: false, error: msg });
  }
};

router.get('/connections/code/active', requireAuth, getActiveCodeHandler);
router.get('/caregiver/code/active', requireAuth, getActiveCodeHandler);

// Connect with code
const connectCaregiverHandler = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const cleanCode = String(code || '').trim();
    if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      res.status(400).json({
        success: false,
        error: 'INVALID_CODE',
        message: 'Please enter a complete 6-digit family connection code.',
      });
      return;
    }

    const record = await repository.findCaregiverCode(cleanCode);
    if (!record) {
      res.status(400).json({
        success: false,
        error: 'INVALID_CODE',
        message: 'Invalid connection code. Please check with your family member.',
      });
      return;
    }

    const now = Date.now();
    if (now >= record.expiresAt || record.status === 'expired') {
      record.status = 'expired';
      await repository.saveCaregiverCode(record);
      res.status(400).json({
        success: false,
        error: 'CODE_EXPIRED',
        message: 'Connection code expired. Please ask your family member to generate a new code.',
      });
      return;
    }

    if (record.used || record.status === 'used') {
      res.status(400).json({
        success: false,
        error: 'CODE_ALREADY_USED',
        message: 'This connection code has already been used. Please generate a new code.',
      });
      return;
    }

    let caregiverUser = await repository.getUserByPhone(req.userPhone!);
    if (!caregiverUser) {
      caregiverUser = {
        id: `user_${req.userPhone!.replace(/\D/g, '') || Date.now()}`,
        mobile: req.userPhone!,
        name: req.userName || 'Caregiver',
        email: '',
        bloodGroup: 'O+',
        allergies: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        isLoggedIn: true,
        preferredLanguage: 'en',
        role: 'caregiver',
        mode: 'family_caregiver',
        reminderGracePeriodMinutes: 30,
        timezone: 'Asia/Kolkata',
      };
      await repository.saveUser(caregiverUser);
    }

    // Check self-connection
    const isCrossDeviceOrTesting =
      ALLOW_TEST_OTP ||
      Boolean(req.headers['x-device-id']) ||
      Boolean(req.body?.deviceId) ||
      caregiverUser?.role === 'caregiver' ||
      caregiverUser?.mode === 'family_caregiver' ||
      caregiverUser?.mode === 'dual';

    if (
      (phonesMatch(record.patientPhone, req.userPhone!) ||
      (record.patientUserId && caregiverUser?.id && record.patientUserId === caregiverUser.id)) &&
      !isCrossDeviceOrTesting
    ) {
      res.status(400).json({
        success: false,
        error: 'CANNOT_CONNECT_SELF',
        message: 'You cannot connect to yourself as a caregiver. Connect from another phone or account.',
      });
      return;
    }

    record.used = true;
    record.status = 'used';
    await repository.saveCaregiverCode(record);

    const patientPhone = record.patientPhone;
    let patientUser = await repository.getUserByPhone(patientPhone);
    if (!patientUser && record.patientUserId) {
      patientUser = await repository.getUserById(record.patientUserId);
    }
    const patientName = patientUser?.name || record.patientName || 'Family Member';
    const patientUserId = patientUser?.id || record.patientUserId || patientPhone;
    const caregiverUserId = caregiverUser?.id || `user_${req.userPhone!.replace(/\D/g, '') || Date.now()}`;
    const caregiverName = caregiverUser?.name || req.userName || 'Caregiver';
    const isSamePhonePairing = phonesMatch(record.patientPhone, req.userPhone!);
    const effectiveCaregiverPhone = isSamePhonePairing ? `${req.userPhone!}_caregiver` : req.userPhone!;

    const existingConns = await repository.getConnectionsForCaregiver(req.userPhone!);
    let connection = existingConns.find(c => phonesMatch(c.patientPhone, patientPhone));

    if (connection) {
      connection.status = 'active';
      connection.patientName = patientName;
      connection.patientPhone = patientPhone;
      connection.caregiverName = caregiverName;
      connection.caregiverPhone = effectiveCaregiverPhone;
      connection.patientUserId = patientUserId;
      connection.familyMemberUserId = patientUserId;
      connection.ownerUserId = patientUserId;
      connection.caregiverUserId = caregiverUserId;
      connection.connectionCode = record.code;
      connection.updatedAt = now;
      await repository.saveConnection(connection);
    } else {
      connection = {
        id: `conn-${now}-${Math.random().toString(36).slice(2, 6)}`,
        patientUserId,
        familyMemberUserId: patientUserId,
        ownerUserId: patientUserId,
        caregiverUserId,
        connectionCode: record.code,
        patientPhone,
        patientName,
        caregiverPhone: effectiveCaregiverPhone,
        caregiverName,
        status: 'active',
        permissions: {
          reminderStatus: true,
          unconfirmedAlerts: true,
          medicineName: true,
          scheduledTime: true,
          reminderHistory: true,
        },
        createdAt: now,
        updatedAt: now,
      };
      await repository.saveConnection(connection);
    }

    crossDeviceHub.notifyConnectionEstablished(connection);

    const patientReminders = await repository.getReminders(patientPhone);
    const connectedFamilyMember = {
      id: patientUserId,
      userId: patientUserId,
      name: patientName,
      phone: patientPhone,
      email: patientUser?.email || '',
      bloodGroup: patientUser?.bloodGroup || '',
      allergies: patientUser?.allergies || '',
      status: 'connected',
    };

    res.json({
      success: true,
      connection,
      connectedFamilyMember,
      patient: connectedFamilyMember,
      patientName,
      patientPhone,
      reminders: patientReminders.filter(r => r.active),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to connect caregiver';
    res.status(500).json({ success: false, error: msg });
  }
};

router.post('/connections/connect', requireAuth, connectCaregiverHandler);
router.post('/caregiver/connect', requireAuth, connectCaregiverHandler);

router.get('/connections', requireAuth, async (req: Request, res: Response) => {
  const asPatient = await repository.getConnectionsForPatient(req.userPhone!);
  const asCaregiver = await repository.getConnectionsForCaregiver(req.userPhone!);
  const map = new Map<string, CaregiverConnection>();
  [...asPatient, ...asCaregiver].forEach(c => map.set(c.id, c));
  res.json(Array.from(map.values()));
});

router.get('/caregiver/connections', requireAuth, async (req: Request, res: Response) => {
  const asPatient = await repository.getConnectionsForPatient(req.userPhone!);
  const asCaregiver = await repository.getConnectionsForCaregiver(req.userPhone!);
  const map = new Map<string, CaregiverConnection>();
  [...asPatient, ...asCaregiver].forEach(c => map.set(c.id, c));
  res.json(Array.from(map.values()));
});

router.delete('/caregiver/connections/:id', requireAuth, async (req: Request, res: Response) => {
  const connId = req.params.id;
  const conn = await repository.getConnectionById(connId);
  const success = await repository.deleteConnection(connId);
  if (!success) {
    res.status(404).json({ success: false, error: 'Connection not found' });
    return;
  }
  if (conn) {
    crossDeviceHub.notifyConnectionRevoked(conn.patientPhone, conn.caregiverPhone, conn.id);
  }
  res.json({ success: true, message: 'Connection deleted successfully' });
});

router.put('/caregiver/connections/:id/permissions', requireAuth, async (req: Request, res: Response) => {
  const conn = await repository.getConnectionById(req.params.id);
  if (!conn) {
    res.status(404).json({ error: 'Connection not found' });
    return;
  }
  if (conn.patientPhone !== req.userPhone) {
    res.status(403).json({ error: 'Only the patient can update caregiver permissions' });
    return;
  }
  conn.permissions = { ...conn.permissions, ...req.body.permissions };
  conn.updatedAt = Date.now();
  await repository.saveConnection(conn);
  res.json(conn);
});

router.get('/caregiver/dashboard', requireAuth, async (req: Request, res: Response) => {
  try {
    const caregiverPhone = req.userPhone!;
    const conns = await repository.getConnectionsForCaregiver(caregiverPhone);
    const activeConns = conns.filter(c => c.status === 'active');
    const members: CaregiverDashboardMember[] = [];
    const todayDateStr = new Date().toISOString().split('T')[0];

    for (const c of activeConns) {
      const patientReminders = await repository.getReminders(c.patientPhone);
      const perms = c.permissions || {
        reminderStatus: true,
        unconfirmedAlerts: true,
        medicineName: true,
        scheduledTime: true,
        reminderHistory: true,
      };

      let takenCount = 0;
      let upcomingCount = 0;
      let unconfirmedCount = 0;

      const patient = (await repository.getUserByPhone(c.patientPhone)) || (c.patientUserId ? await repository.getUserById(c.patientUserId) : null);
      const familyMemberUserId = patient?.id || c.familyMemberUserId || c.patientUserId || c.patientPhone;
      const patientName = patient?.name || c.patientName || 'Family Member';
      const patientPhone = patient?.mobile || c.patientPhone;
      const gracePeriod = patient?.reminderGracePeriodMinutes || 30;

      const connectedFamilyMember = {
        id: familyMemberUserId,
        userId: familyMemberUserId,
        name: patientName,
        phone: patientPhone,
        email: patient?.email || '',
        bloodGroup: patient?.bloodGroup || '',
        allergies: patient?.allergies || '',
        emergencyContactName: patient?.emergencyContactName || '',
        emergencyContactPhone: patient?.emergencyContactPhone || '',
        status: 'connected',
      };

      const schedule = patientReminders
        .filter(r => r.active)
        .map(r => {
          const doses = r.times.map(t => {
            const formattedTime = formatTimeDisplay(t);
            const log = r.doseLogs.find(l => l.date === todayDateStr && (l.time === t || formatTimeDisplay(l.time) === formattedTime));
            let doseStatus: 'Scheduled' | 'Pending' | 'Taken' | 'Missed' | 'Skipped' = 'Scheduled';
            if (log) {
              if (log.status === 'taken') doseStatus = 'Taken';
              else if (log.status === 'skipped') doseStatus = 'Skipped';
            } else {
              const scheduledMinutes = parseTimeToMinutes(t);
              const nowTotal = new Date().getHours() * 60 + new Date().getMinutes();
              if (nowTotal < scheduledMinutes) {
                doseStatus = 'Scheduled';
              } else if (nowTotal <= scheduledMinutes + gracePeriod) {
                doseStatus = 'Pending';
              } else {
                doseStatus = 'Missed';
              }
            }

            if (doseStatus === 'Taken') takenCount++;
            else if (doseStatus === 'Missed') unconfirmedCount++;
            else upcomingCount++;

            return {
              time: perms.scheduledTime !== false ? formattedTime : 'Scheduled Time',
              status: doseStatus,
            };
          });

          return {
            medicineName: perms.medicineName !== false ? r.medicineName : 'Scheduled Medication',
            dosage: perms.medicineName !== false ? r.dosage : 'Standard Dose',
            instructions: r.instructions,
            doses: perms.reminderStatus !== false ? doses : [],
          };
        });

      members.push({
        connectionId: c.id,
        patientUserId: familyMemberUserId,
        familyMemberUserId: familyMemberUserId,
        ownerUserId: familyMemberUserId,
        caregiverUserId: c.caregiverUserId,
        patientName,
        patientPhone,
        connectedFamilyMember,
        status: 'active',
        permissions: perms,
        stats: {
          taken: takenCount,
          upcoming: upcomingCount,
          unconfirmed: unconfirmedCount,
        },
        schedule: perms.reminderStatus !== false ? schedule : [],
      });
    }

    const allAlerts = await repository.getAlertsForCaregiver(caregiverPhone);
    const activeAlerts = allAlerts.filter(a => !a.confirmedLater && a.status === 'dose_not_confirmed');

    const dashboardData: CaregiverDashboardData = {
      members,
      alerts: activeAlerts,
      alertLog: allAlerts,
    };

    res.json(dashboardData);
  } catch (err: unknown) {
    res.status(500).json({ error: 'Failed to build caregiver dashboard data' });
  }
});

router.get('/caregiver/alerts', requireAuth, async (req: Request, res: Response) => {
  const alerts = await repository.getAlertsForCaregiver(req.userPhone!);
  res.json(alerts);
});

router.get('/caregiver/member/:patientPhone/reminders', requireAuth, async (req: Request, res: Response) => {
  const caregiverPhone = req.userPhone!;
  const targetPatientPhone = req.params.patientPhone;
  const conns = await repository.getConnectionsForCaregiver(caregiverPhone);
  const activeConn = conns.find(c => phonesMatch(c.patientPhone, targetPatientPhone) && c.status === 'active');

  if (!activeConn) {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'No active caregiver connection found for this member.',
    });
    return;
  }

  const patientReminders = await repository.getReminders(targetPatientPhone);
  const patientUser = await repository.getUserByPhone(targetPatientPhone);

  res.json({
    success: true,
    patientName: activeConn.patientName || patientUser?.name || 'Patient',
    patientPhone: targetPatientPhone,
    reminders: patientReminders.filter(r => r.active),
  });
});

// 7. Prescriptions
router.get('/prescriptions', requireAuth, async (req: Request, res: Response) => {
  const list = await repository.getPrescriptions(req.userPhone!);
  res.json(list);
});

router.post('/upload', requireAuth, async (req: Request, res: Response) => {
  const limits = await repository.checkPlanLimits(req.userPhone!);
  if (!limits.prescriptions.canAdd) {
    res.status(403).json({
      success: false,
      error: 'PLAN_LIMIT_REACHED',
      message: 'Free plan limit reached. Upgrade to Premium for unlimited prescriptions.',
      limit: limits.prescriptions.max,
      currentCount: limits.prescriptions.current,
      feature: 'prescriptions',
    });
    return;
  }

  const { patientName, doctorName, clinicName, fileDataUrl, fileName, fileType, fileSize, notes } = req.body;
  if (!patientName || !doctorName) {
    res.status(400).json({ error: 'Patient name and Doctor name are required.' });
    return;
  }
  if (!fileDataUrl) {
    res.status(400).json({ error: 'Prescription document is required.' });
    return;
  }

  const prescription: Prescription = {
    id: `rx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: req.userPhone,
    patientName,
    doctorName,
    clinicName,
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    fileDataUrl,
    fileName: fileName || 'Prescription_Document.pdf',
    fileType: fileType || 'image',
    fileSize: fileSize || '350 KB',
    status: 'Uploaded',
    notes: notes || '',
    uploadedAt: Date.now(),
  };

  await repository.savePrescription(req.userPhone!, prescription);
  res.json(prescription);
});

router.delete('/prescriptions/:id', requireAuth, async (req: Request, res: Response) => {
  const success = await repository.deletePrescription(req.userPhone!, req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Prescription not found' });
    return;
  }
  res.json({ success: true });
});

// 8. Doctors & Appointments
router.get('/doctors', async (_req: Request, res: Response) => {
  const docs = await repository.getDoctors();
  res.json(docs);
});

router.post('/doctors', requireAuth, async (req: Request, res: Response) => {
  const doctor: Doctor = {
    id: `doc-custom-${Date.now()}`,
    name: req.body.name,
    specialty: req.body.specialty || 'General Physician',
    qualification: req.body.qualification || 'MBBS',
    experienceYears: Number(req.body.experienceYears) || 5,
    location: req.body.location || 'Ahmedabad',
    city: req.body.city || 'Ahmedabad',
    hospitalClinic: req.body.hospitalClinic || 'Private Clinic',
    consultationFee: Number(req.body.consultationFee) || 500,
    availableDays: req.body.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    timings: req.body.timings || '10:00 AM – 2:00 PM, 5:00 PM – 8:00 PM',
    contactPhone: req.body.contactPhone || '',
    languages: req.body.languages || ['English', 'Hindi', 'Gujarati'],
    rating: 5.0,
    reviewsCount: 1,
    about: req.body.about || 'Consultant Specialist',
    registrationNumber: req.body.registrationNumber || 'GMC-Registered',
    isAvailableToday: true,
    isCustom: true,
    email: req.body.email,
    address: req.body.address,
    notes: req.body.notes,
    photoUrl: req.body.photoUrl,
  };
  await repository.saveDoctor(doctor);
  res.json(doctor);
});

router.delete('/doctors/:id', requireAuth, async (req: Request, res: Response) => {
  const success = await repository.deleteDoctor(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Doctor not found' });
    return;
  }
  res.json({ success: true });
});

router.get('/appointments', requireAuth, async (req: Request, res: Response) => {
  const list = await repository.getAppointments(req.userPhone);
  res.json(list);
});

router.post('/appointments', requireAuth, async (req: Request, res: Response) => {
  const user = await repository.getUserByPhone(req.userPhone!);
  const appointment: Appointment = {
    id: `apt-${Date.now()}`,
    bookingRef: `PC-${Math.floor(100000 + Math.random() * 900000)}`,
    doctorId: req.body.doctorId,
    doctorName: req.body.doctorName,
    doctorSpecialty: req.body.doctorSpecialty,
    hospitalClinic: req.body.hospitalClinic,
    patientName: user?.name || req.body.patientName || 'Patient',
    patientPhone: req.userPhone!,
    day: req.body.day || 'Today',
    timeSlot: req.body.timeSlot || '11:00 AM',
    consultationFee: Number(req.body.consultationFee) || 500,
    status: 'Confirmed',
    createdAt: Date.now(),
  };
  await repository.saveAppointment(appointment);
  res.json(appointment);
});

// 9. Sync & Devices
router.post('/sync/backup', requireAuth, (_req: Request, res: Response) => {
  res.json({ success: true, syncedAt: Date.now() });
});

router.get('/sync/restore', requireAuth, async (req: Request, res: Response) => {
  const reminders = await repository.getReminders(req.userPhone!);
  const prescriptions = await repository.getPrescriptions(req.userPhone!);
  const user = await repository.getUserByPhone(req.userPhone!);
  res.json({ reminders, prescriptions, profile: user });
});

router.get('/devices/stream', async (req: Request, res: Response) => {
  const token = (req.query.token as string) || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : '');
  const headerPhone = (req.headers['x-user-phone'] as string) || (req.query.phone as string);
  const deviceId = (req.query.deviceId as string) || (req.headers['x-device-id'] as string);

  let phone = '';
  if (token) {
    try {
      const decoded = jwt.verify(token, SESSION_SECRET) as AuthTokenPayload;
      if (decoded?.phone) phone = decoded.phone;
    } catch {
      // Fall back
    }
  }
  if (!phone && headerPhone) phone = headerPhone.trim();

  if (!phone) {
    res.status(401).json({ error: 'Authentication required for real-time device stream' });
    return;
  }

  const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  crossDeviceHub.addClient(clientId, phone, deviceId, res);

  if (deviceId) {
    await repository.updateDeviceHeartbeat(deviceId, phone);
  }
});

router.post('/devices/register', requireAuth, async (req: Request, res: Response) => {
  try {
    const { deviceId, deviceName, platform, appVersion, role } = req.body;
    if (!deviceId) {
      res.status(400).json({ success: false, error: 'Device ID is required' });
      return;
    }
    const device: ConnectedDevice = {
      deviceId: String(deviceId).trim(),
      userPhone: req.userPhone!,
      userName: req.userName || 'User',
      role: role || 'myself',
      deviceName: deviceName || (platform === 'android' ? 'Android Phone' : 'Web Device'),
      platform: platform === 'android' ? 'android' : platform === 'ios' ? 'ios' : 'web',
      appVersion: appVersion || '1.0.0',
      isOnline: true,
      lastSeen: Date.now(),
    };
    const saved = await repository.registerDevice(device);
    res.json({ success: true, device: saved });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to register device';
    res.status(500).json({ success: false, error: msg });
  }
});

router.post('/devices/heartbeat', requireAuth, async (req: Request, res: Response) => {
  const { deviceId } = req.body;
  if (deviceId) {
    await repository.updateDeviceHeartbeat(String(deviceId), req.userPhone);
  }
  res.json({ success: true, timestamp: Date.now() });
});

router.get('/devices/cross-connected', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await repository.getCrossConnectedDevices(req.userPhone!);
    res.json({ success: true, ...result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch cross-connected devices';
    res.status(500).json({ success: false, error: msg });
  }
});

router.post('/devices/nudge', requireAuth, async (req: Request, res: Response) => {
  try {
    const { toPhone, message, medicineName, toName } = req.body;
    if (!toPhone) {
      res.status(400).json({ success: false, error: 'Recipient phone number is required' });
      return;
    }
    const nudge: DeviceNudge = {
      id: `nudge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      fromPhone: req.userPhone!,
      fromName: req.userName || 'Family Caregiver',
      toPhone: String(toPhone).trim(),
      toName: toName || 'Family Member',
      message: message || 'Gentle reminder from your family: Please take your scheduled medicine!',
      medicineName,
      timestamp: Date.now(),
      read: false,
    };

    await repository.saveNudge(nudge);
    crossDeviceHub.notifyCaregiverNudge(nudge.toPhone, nudge);
    res.json({ success: true, nudge });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to send nudge';
    res.status(500).json({ success: false, error: msg });
  }
});

router.get('/devices/nudges', requireAuth, async (req: Request, res: Response) => {
  const nudges = await repository.getNudgesForUser(req.userPhone!);
  res.json(nudges);
});

router.post('/devices/sos', requireAuth, async (req: Request, res: Response) => {
  try {
    const { location } = req.body;
    const user = await repository.getUserByPhone(req.userPhone!);
    const patientName = user?.name || req.userName || 'Patient';
    const conns = await repository.getConnectionsForPatient(req.userPhone!);
    const caregiverPhones = conns.filter(c => c.status === 'active').map(c => c.caregiverPhone);

    crossDeviceHub.notifyEmergencySos(req.userPhone!, patientName, caregiverPhones, location);
    res.json({ success: true, alertedCaregiversCount: caregiverPhones.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to trigger SOS';
    res.status(500).json({ success: false, error: msg });
  }
});

// 10. Subscription
router.get('/subscription/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const phone = req.userPhone!;
    const subscription = await repository.getSubscription(phone);
    const isPremium =
      subscription.plan === 'premium' &&
      subscription.status === 'active' &&
      (!subscription.expiryDate || subscription.expiryDate > Date.now());
    const limits = await repository.checkPlanLimits(phone);

    res.json({
      success: true,
      plan: isPremium ? 'premium' : 'free',
      isPremium,
      subscription,
      limits,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to retrieve subscription status';
    res.status(500).json({ success: false, error: msg });
  }
});

router.get('/subscription/limits', requireAuth, async (req: Request, res: Response) => {
  try {
    const phone = req.userPhone!;
    const subscription = await repository.getSubscription(phone);
    const isPremium =
      subscription.plan === 'premium' &&
      subscription.status === 'active' &&
      (!subscription.expiryDate || subscription.expiryDate > Date.now());
    const limits = await repository.checkPlanLimits(phone);

    res.json({
      success: true,
      plan: isPremium ? 'premium' : 'free',
      isPremium,
      limits,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to retrieve subscription limits';
    res.status(500).json({ success: false, error: msg });
  }
});

router.post('/subscription/upgrade', requireAuth, async (req: Request, res: Response) => {
  try {
    const phone = req.userPhone!;
    const { billingCycle = 'monthly' } = req.body;
    const cycle = billingCycle === 'yearly' ? 'yearly' : 'monthly';
    const now = Date.now();
    const durationMs = cycle === 'yearly' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const expiryDate = now + durationMs;

    const sub: UserSubscription = {
      userId: phone,
      phone,
      plan: 'premium',
      status: 'active',
      startDate: now,
      expiryDate,
      billingCycle: cycle,
      paymentStatus: 'active',
      autoRenew: true,
      updatedAt: now,
    };

    await repository.saveSubscription(sub);
    const limits = await repository.checkPlanLimits(phone);

    res.json({
      success: true,
      message: 'Successfully upgraded to PharmaCare Premium!',
      plan: 'premium',
      isPremium: true,
      subscription: sub,
      limits,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Upgrade failed';
    res.status(500).json({ success: false, error: msg });
  }
});

router.post('/subscription/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const phone = req.userPhone!;
    const sub = await repository.cancelSubscription(phone);
    const limits = await repository.checkPlanLimits(phone);

    res.json({
      success: true,
      message: 'Subscription cancelled. Your plan has reverted to Free.',
      plan: 'free',
      isPremium: false,
      subscription: sub,
      limits,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Cancellation failed';
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;
