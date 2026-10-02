import React from 'react';
import {
  Pill,
  Bell,
  UploadCloud,
  MapPin,
  Users,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  PhoneCall,
  Lightbulb,
  HeartPulse,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, MedicineReminder, Prescription, AppLanguage } from '../../types';
import { getTranslation } from '../../i18n/translations';
import { notificationEngine } from '../../services/notifications';

interface HomeScreenProps {
  user: UserProfile;
  lang: AppLanguage;
  reminders: MedicineReminder[];
  prescriptions?: Prescription[];
  onNavigate: (screen: string) => void;
  onTakeDose: (reminderId: string, time: string) => void;
  activeAlertsCount?: number;
  showToast: (type: 'success' | 'info' | 'error' | 'warning', title: string, message: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  lang,
  reminders,
  prescriptions = [],
  onNavigate,
  onTakeDose,
  activeAlertsCount = 0,
  showToast,
}) => {
  // Compute greeting based on hour
  const currentHour = new Date().getHours();
  let greetingKey = 'home.greeting.morning';
  if (currentHour >= 12 && currentHour < 17) greetingKey = 'home.greeting.afternoon';
  else if (currentHour >= 17) greetingKey = 'home.greeting.evening';

  // Find next untaken dose today
  const todayDateStr = new Date().toISOString().split('T')[0];
  const activeReminders = reminders.filter((r) => r.active);

  interface NextDoseInfo {
    reminder: MedicineReminder;
    time: string;
    totalMinutes: number;
  }
  let nextDose: NextDoseInfo | null = null;
  const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  for (const rem of activeReminders) {
    for (const t of rem.times) {
      const [h, m] = t.split(':').map(Number);
      const doseMinutes = h * 60 + m;
      const isTaken = rem.doseLogs.some(
        (l) => l.date === todayDateStr && l.time === t && (l.status === 'taken' || l.status === 'skipped')
      );

      if (!isTaken) {
        if (!nextDose || doseMinutes < nextDose.totalMinutes) {
          nextDose = { reminder: rem, time: t, totalMinutes: doseMinutes };
        }
      }
    }
  }

  const handleTakeNextDose = () => {
    if (!nextDose) return;
    notificationEngine.playTakeChime();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
    onTakeDose(nextDose.reminder.id, nextDose.time);
    showToast(
      'success',
      getTranslation(lang, 'reminders.doseTaken'),
      `${nextDose.reminder.medicineName} (${nextDose.time}) confirmed!`
    );
  };

  const isCaregiverRole = user.role === 'caregiver' || user.role === 'family_caregiver' || user.role === 'both' || user.mode === 'family_caregiver';

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-24">
      {/* 1. Header Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#0F4C81] text-white flex items-center justify-center shadow-xs">
            <HeartPulse className="w-6 h-6 text-sky-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black text-[#0F4C81] tracking-tight">PharmaCare</h1>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-xs font-semibold text-slate-500">Smart Pharmacy Care</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('reminders')}
            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all relative"
            aria-label="Reminders"
          >
            <Bell className="w-4 h-4" />
            {activeReminders.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#0EA5E9]" />
            )}
          </button>
          <button
            onClick={() => onNavigate('profile')}
            className="w-9 h-9 rounded-xl bg-[#E0F2FE] text-[#0F4C81] font-bold text-xs flex items-center justify-center border border-sky-200 active:scale-95 transition-all"
            aria-label="Profile"
          >
            {user.name ? user.name.slice(0, 2).toUpperCase() : 'ME'}
          </button>
        </div>
      </div>

      {/* 2. Greeting Card */}
      <div className="bg-gradient-to-r from-[#0F4C81] to-[#1E6091] text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold text-sky-100 mb-1.5 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active</span>
            </div>
            <h2 className="text-lg font-extrabold tracking-tight">
              {getTranslation(lang, greetingKey)}, {user.name || 'Friend'}
            </h2>
            <p className="text-xs font-medium text-sky-200/90 mt-0.5">
              {getTranslation(lang, 'home.tagline')}
            </p>
          </div>
          <Pill className="w-14 h-14 text-white/10 -rotate-45" />
        </div>
      </div>

      {/* 2b. Membership / Premium Access Card */}
      <div
        onClick={() => onNavigate('subscription')}
        id="btn-home-subscription-status"
        className={`rounded-2xl p-4 border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
          user.plan === 'premium' && user.subscriptionStatus === 'active'
            ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/60'
            : 'bg-white border-slate-200 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              user.plan === 'premium' && user.subscriptionStatus === 'active'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                {user.plan === 'premium' && user.subscriptionStatus === 'active'
                  ? 'PharmaCare Premium'
                  : 'Free Membership Plan'}
              </h3>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  user.plan === 'premium' && user.subscriptionStatus === 'active'
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {user.plan === 'premium' && user.subscriptionStatus === 'active' ? 'ACTIVE' : 'FREE'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {user.plan === 'premium' && user.subscriptionStatus === 'active'
                ? 'Unlimited reminders, prescription vault & caregiver sync'
                : `${reminders.length}/3 Reminders • ${prescriptions.length}/3 Stored Rx (Tap to upgrade)`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-[#0F4C81]">
          <span>{user.plan === 'premium' && user.subscriptionStatus === 'active' ? 'Manage' : 'Upgrade'}</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* 3. Search Bar Button */}
      <button
        onClick={() => onNavigate('medicines')}
        id="btn-home-search-trigger"
        className="w-full py-3 px-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3 text-slate-400 hover:text-slate-600 hover:border-slate-300 active:scale-[0.99] transition-all text-left"
      >
        <Search className="w-4 h-4 text-[#0EA5E9]" />
        <span className="text-xs font-medium text-slate-500 truncate">
          {getTranslation(lang, 'home.searchPlaceholder')}
        </span>
      </button>

      {/* 4. Doctor Information Card */}
      <button
        onClick={() => onNavigate('doctors')}
        id="btn-home-doctor-info"
        className="w-full p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-sky-300 active:scale-[0.99] transition-all flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] text-[#0EA5E9] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-[#0F172A]">
                {getTranslation(lang, 'home.doctorDirectory')}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified</span>
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Find qualified specialists & schedule visits
            </p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0EA5E9] group-hover:translate-x-0.5 transition-all shrink-0" />
      </button>

      {/* 5. Next Scheduled Dose Card */}
      <div className="bg-[#0F4C81] text-white rounded-2xl p-4 shadow-sm border border-sky-800/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-300" />
            <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
              {getTranslation(lang, 'home.nextDose')}
            </span>
          </div>
          <button
            onClick={() => onNavigate('reminders')}
            className="text-xs font-bold text-sky-200 hover:text-white underline underline-offset-2"
          >
            {getTranslation(lang, 'home.allReminders', { count: String(activeReminders.length) })}
          </button>
        </div>

        {nextDose ? (
          <div className="bg-white/10 rounded-xl p-3.5 border border-white/10 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-extrabold text-white truncate">
                  {nextDose.reminder.medicineName}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/20 text-sky-100 shrink-0">
                  {nextDose.time}
                </span>
              </div>
              <p className="text-xs font-medium text-sky-200 truncate">
                {nextDose.reminder.dosage} • {nextDose.reminder.instructions}
              </p>
            </div>
            <button
              onClick={handleTakeNextDose}
              id="btn-take-next-dose"
              className="px-4 py-2 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-95 text-white text-xs font-bold shadow-xs shrink-0 flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Take</span>
            </button>
          </div>
        ) : (
          <div className="bg-white/10 rounded-xl p-3.5 border border-white/10 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <p className="text-xs font-semibold text-sky-100">
              {activeReminders.length > 0
                ? 'All scheduled doses completed for today. Great job!'
                : 'No active medicine reminders configured.'}
            </p>
          </div>
        )}
      </div>

      {/* 6. Family Caregiver Card */}
      <div className="bg-[#FAF5FF] border border-[#E9D5FF] rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] text-[#6B21A8] flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-[#3B0764] uppercase tracking-wide">
                Family Caregiver Safety
              </h3>
              <p className="text-[11px] font-medium text-slate-500">
                {isCaregiverRole
                  ? 'Active Caregiver Dashboard & Live Watchdog'
                  : 'Pair with family to send missed-dose alerts'}
              </p>
            </div>
          </div>
          {activeAlertsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse">
              {activeAlertsCount} Alert{activeAlertsCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          {isCaregiverRole && (
            <button
              onClick={() => onNavigate('caregiver_dashboard')}
              id="btn-home-caregiver-hub"
              className="flex-1 py-2 px-3 rounded-xl bg-[#6B21A8] hover:bg-[#581C87] active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Open Caregiver Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onNavigate('family_care')}
            id="btn-home-family-link"
            className={`py-2 px-3 rounded-xl border border-purple-300 text-[#6B21A8] hover:bg-purple-100/50 active:scale-95 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              isCaregiverRole ? 'flex-initial' : 'w-full bg-white shadow-xs'
            }`}
          >
            <span>{isCaregiverRole ? 'Link Code' : 'Connect Family Caregiver'}</span>
          </button>
        </div>
      </div>

      {/* 7. Quick-Action Cards (2x2 Grid) */}
      <div>
        <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2.5">
          {getTranslation(lang, 'home.quickActions')}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Search Medicine */}
          <button
            onClick={() => onNavigate('medicines')}
            id="qa-search"
            className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-sky-300 active:scale-95 transition-all text-left flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0EA5E9] flex items-center justify-center shrink-0">
              <Pill className="w-5 h-5 -rotate-45" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-800 leading-tight">Search Medicine</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">500+ items</p>
            </div>
          </button>

          {/* Medicine Alarm */}
          <button
            onClick={() => onNavigate('reminders')}
            id="qa-reminder"
            className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-sky-300 active:scale-95 transition-all text-left flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-800 leading-tight">Medicine Alarm</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Set schedule</p>
            </div>
          </button>

          {/* Upload Prescription */}
          <button
            onClick={() => onNavigate('prescriptions')}
            id="qa-upload"
            className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-sky-300 active:scale-95 transition-all text-left flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-800 leading-tight">Upload Rx</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Secure vault</p>
            </div>
          </button>

          {/* Find Pharmacy */}
          <button
            onClick={() => onNavigate('pharmacies')}
            id="qa-pharmacy"
            className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-sky-300 active:scale-95 transition-all text-left flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6B21A8] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-800 leading-tight">Find Pharmacy</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">24/7 chemist</p>
            </div>
          </button>
        </div>
      </div>

      {/* 8. Daily Safety Tip Card */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-900">Medication Safety Tip</span>
            <button
              onClick={() => onNavigate('health_tips')}
              className="text-[11px] font-bold text-amber-700 hover:underline"
            >
              More Tips
            </button>
          </div>
          <p className="text-xs font-medium text-amber-800/90 mt-1 leading-relaxed">
            Always store antibiotic suspensions and insulin cartridges away from direct sunlight and heat.
          </p>
        </div>
      </div>

      {/* 10. Emergency Help Card */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-extrabold text-rose-900 leading-tight">
              Emergency Medical Service
            </h4>
            <p className="text-[11px] font-medium text-rose-700 mt-0.5 truncate">
              Dial 112 / 108 for acute distress
            </p>
          </div>
        </div>
        <a
          href="tel:112"
          id="btn-home-emergency-call"
          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-xs shrink-0 flex items-center gap-1 transition-all"
        >
          <span>Call 112</span>
        </a>
      </div>
    </div>
  );
};
