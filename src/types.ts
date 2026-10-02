export type UserRole = 'myself' | 'caregiver' | 'family_caregiver' | 'dual' | 'patient' | 'both';
export type UserMode = 'myself' | 'family_caregiver' | 'dual';
export type AppLanguage = 'en' | 'hi' | 'gu';

export type DoseStatus =
  | 'Scheduled'
  | 'Pending'
  | 'Taken'
  | 'Missed'
  | 'Skipped'
  | 'scheduled'
  | 'pending'
  | 'taken'
  | 'upcoming'
  | 'missed'
  | 'skipped';

export interface UserProfile {
  id?: string;
  name: string;
  mobile: string;
  email?: string;
  bloodGroup?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isLoggedIn: boolean;
  avatarId?: number;
  preferredLanguage?: AppLanguage;
  language?: AppLanguage;
  role?: UserRole;
  mode?: UserMode;
  reminderGracePeriodMinutes?: 15 | 30 | 60;
  timezone?: string;
  plan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionExpiry?: number | null;
}

export interface ReminderDoseLog {
  date: string; // YYYY-MM-DD in local timezone
  time: string; // HH:mm
  status: 'taken' | 'skipped' | 'snoozed';
  timestamp: number;
}

export interface MedicineReminder {
  id: string;
  userId?: string;
  ownerUserId?: string;
  medicineName: string;
  genericName?: string;
  dosage: string;
  frequency: 'Once Daily' | 'Twice Daily' | 'Three Times Daily' | 'Every 8 Hours' | 'As Needed' | 'Weekly';
  times: string[]; // 24h format HH:mm
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  instructions: 'Before Food' | 'After Food' | 'With Food' | 'Anytime';
  active: boolean;
  notes?: string;
  colorTag: string;
  doseLogs: ReminderDoseLog[];
  createdAt: number;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  dosageForm: string;
  strength: string;
  uses: string[];
  dosageGuidelines: string;
  sideEffects: string[];
  precautions: string[];
  storage: string;
  prescriptionRequired: boolean;
  manufacturer?: string;
  userId?: string;
  isCustom?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface Prescription {
  id: string;
  userId?: string;
  patientName: string;
  doctorName: string;
  clinicName?: string;
  date: string;
  fileDataUrl: string; // Compressed data URL or object URL
  fileName: string;
  fileType: 'image' | 'pdf';
  fileSize: string;
  status: 'Uploaded' | 'Under Review' | 'Verified' | 'Medicines Prepared' | 'Completed';
  notes: string;
  extractedMedicines?: string[];
  uploadedAt: number;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  phone: string;
  isOpen24Hours: boolean;
  openingHours: string;
  services: string[];
  lat: number;
  lng: number;
  hasDelivery: boolean;
  hasDriveThru: boolean;
  calculatedDistance?: string;
  city?: string;
}

export interface HealthTip {
  id: string;
  title: string;
  category: 'Medicine Safety' | 'General Health' | 'Nutrition' | 'Emergency' | 'Wellness';
  readTime: string;
  summary: string;
  content: string[];
  keyTakeaways: string[];
  isBookmarked?: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  qualification: string;
  experienceYears: number;
  location: string;
  city: string;
  hospitalClinic: string;
  consultationFee: number;
  availableDays: string[];
  timings: string;
  contactPhone: string;
  languages: string[];
  rating: number;
  reviewsCount: number;
  about: string;
  registrationNumber: string;
  isAvailableToday?: boolean;
  isCustom?: boolean;
  email?: string;
  address?: string;
  notes?: string;
  photoUrl?: string;
}

export interface Appointment {
  id: string;
  bookingRef: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  hospitalClinic: string;
  patientName: string;
  patientPhone: string;
  day: string;
  timeSlot: string;
  consultationFee: number;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
  createdAt: number;
}

export interface CaregiverPermissions {
  reminderStatus: boolean;
  unconfirmedAlerts: boolean;
  medicineName: boolean;
  scheduledTime: boolean;
  reminderHistory: boolean;
  viewDoseLogs?: boolean;
  receiveMissedAlerts?: boolean;
}

export interface CaregiverConnection {
  id: string;
  connectionId?: string; // alias
  patientUserId?: string;
  familyMemberUserId?: string;
  ownerUserId?: string;
  caregiverUserId?: string;
  connectionCode?: string;
  patientPhone: string;
  patientName: string;
  caregiverPhone: string;
  caregiverName: string;
  status: 'pending' | 'active' | 'rejected' | 'disconnected';
  permissions: CaregiverPermissions;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
}

export interface ConnectedFamilyMemberInfo {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  email?: string;
  bloodGroup?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  status: string;
  deviceInfo?: string;
  isOnline?: boolean;
}

export interface CaregiverAlert {
  id: string;
  connectionId: string;
  patientPhone: string;
  patientName: string;
  caregiverPhone: string;
  reminderId: string;
  medicineName: string;
  dosage: string;
  scheduledTime: string;
  date: string;
  status: 'dose_not_confirmed' | 'taken' | 'skipped' | 'snoozed';
  alertGeneratedAt: number;
  confirmedLater: boolean;
  confirmedAt?: number;
  notificationDelivered: boolean;
}

export interface CaregiverMemberDoseStatus {
  time: string;
  status: DoseStatus;
}

export interface CaregiverMemberMedSchedule {
  medicineName: string;
  dosage: string;
  instructions: string;
  doses: CaregiverMemberDoseStatus[];
}

export interface CaregiverDashboardMember {
  connectionId: string;
  patientUserId?: string;
  familyMemberUserId?: string;
  ownerUserId?: string;
  caregiverUserId?: string;
  patientName: string;
  patientPhone: string;
  connectedFamilyMember?: ConnectedFamilyMemberInfo;
  status: 'active' | 'pending';
  permissions: CaregiverPermissions;
  stats: {
    taken: number;
    upcoming: number;
    unconfirmed: number;
  };
  schedule: CaregiverMemberMedSchedule[];
}

export interface CaregiverDashboardData {
  members: CaregiverDashboardMember[];
  alerts: CaregiverAlert[];
  alertLog: CaregiverAlert[];
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'error' | 'warning';
  title: string;
  message: string;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
}

export interface ConnectedDevice {
  deviceId: string;
  userPhone: string;
  userName: string;
  role: 'myself' | 'caregiver' | 'dual' | 'patient';
  deviceName: string;
  platform: 'android' | 'web' | 'ios';
  appVersion?: string;
  isOnline: boolean;
  lastSeen: number;
}

export interface DeviceNudge {
  id: string;
  fromPhone: string;
  fromName: string;
  toPhone: string;
  toName: string;
  message: string;
  medicineName?: string;
  timestamp: number;
  read: boolean;
}

export interface CrossConnectedDevicesResult {
  myDevices: ConnectedDevice[];
  connectedMembers: {
    connectionId: string;
    patientName: string;
    patientPhone: string;
    caregiverName: string;
    caregiverPhone: string;
    status: string;
    devices: ConnectedDevice[];
  }[];
}

export type MedicineItem = Medicine;
export type PharmacyItem = Pharmacy;
export type HealthTipItem = HealthTip;

// Subscription & Premium Plan Types
export type SubscriptionPlan = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'expired' | 'none' | 'cancelled';
export type BillingCycle = 'monthly' | 'yearly';

export interface UserSubscription {
  userId: string;
  phone: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: number | null;
  expiryDate: number | null;
  billingCycle: BillingCycle | null;
  paymentStatus: 'active' | 'pending' | 'none';
  autoRenew?: boolean;
  updatedAt: number;
}

export interface PlanLimits {
  reminders: {
    max: number | null; // null means unlimited
    current: number;
    canAdd: boolean;
  };
  prescriptions: {
    max: number | null; // null means unlimited
    current: number;
    canAdd: boolean;
  };
  caregivers: {
    max: number | null; // null means unlimited
    current: number;
    canAdd: boolean;
  };
}

export interface SubscriptionStatusResponse {
  success: boolean;
  subscription: UserSubscription;
  plan: SubscriptionPlan;
  isPremium: boolean;
  limits: PlanLimits;
}

