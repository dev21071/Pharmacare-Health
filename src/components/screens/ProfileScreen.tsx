import React, { useState } from 'react';
import {
  User,
  Phone,
  Globe,
  Bell,
  Volume2,
  Users,
  Download,
  Trash2,
  LogOut,
  ChevronRight,
  Shield,
  Edit2,
  X,
  FileSpreadsheet,
  AlertTriangle,
  Info,
  Heart,
  Layers,
  CheckCircle2,
  Smartphone,
  Sparkles,
  CreditCard
} from 'lucide-react';
import { UserProfile, AppLanguage, MedicineReminder, Prescription, UserRole, UserMode } from '../../types';
import { getTranslation } from '../../i18n/translations';
import { notificationEngine } from '../../services/notifications';
import { storage } from '../../services/storage';

interface ProfileScreenProps {
  user: UserProfile;
  lang: AppLanguage;
  reminders: MedicineReminder[];
  prescriptions: Prescription[];
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onChangeLanguage: (l: AppLanguage) => void;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  onOpenApkModal?: () => void;
  showToast: (type: 'success' | 'info' | 'error' | 'warning', title: string, message: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  lang,
  reminders,
  prescriptions,
  onUpdateProfile,
  onChangeLanguage,
  onNavigate,
  onLogout,
  onOpenApkModal,
  showToast,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Form states
  const [name, setName] = useState(user.name || '');
  const [bloodGroup, setBloodGroup] = useState(user.bloodGroup || 'O+');
  const [emergencyContactName, setEmergencyContactName] = useState(
    user.emergencyContactName || 'Family Member'
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    user.emergencyContactPhone || '+91 98765 00000'
  );

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: name.trim(),
      bloodGroup,
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
    });
    setShowEditModal(false);
    showToast('success', 'Profile Updated', 'Personal information saved.');
  };

  const handleTestAlarm = async () => {
    await notificationEngine.playAlarmSound();
    await notificationEngine.showNotification(
      'PharmaCare Test Dose Reminder',
      'Test notification sound and alert triggered!'
    );
    showToast('info', 'Alarm Sound Test', 'Audio chime and notification fired.');
  };

  const handleExportData = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      user,
      reminders,
      prescriptions: prescriptions.map((p) => ({
        ...p,
        fileDataUrl: '[OMITTED_IN_EXPORT_FOR_PORTABILITY]',
      })),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pharmacare_health_export_${user.mobile}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Health Record Exported', 'Downloaded complete health JSON archive.');
  };

  const handleClearCache = () => {
    localStorage.removeItem('pharmacare_session');
    setShowClearConfirm(false);
    showToast('info', 'Cache Cleared', 'Local session cache reset. Refreshing...');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const isCaregiver = user.role === 'caregiver';

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-24">
      {/* 1. User Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#0F4C81] text-white text-xl font-black flex items-center justify-center shadow-xs">
              {(user.name || 'User').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#0F172A]">
                  {user.name || 'Patient'}
                </h2>
                <button
                  onClick={() => setShowEditModal(true)}
                  id="btn-edit-profile"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{user.mobile}</span>
              </p>
              <div className="flex gap-1.5 mt-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-[#0F4C81] border border-sky-100">
                  {user.mode === 'family_caregiver' || user.role === 'caregiver' || user.role === 'family_caregiver'
                    ? 'Family Caregiver'
                    : user.mode === 'dual' || user.role === 'dual' || user.role === 'both'
                    ? 'Dual Mode'
                    : 'For Myself'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {user.language?.toUpperCase() || 'EN'}
                </span>
                {user.bloodGroup && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-1">
                    <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                    <span>{user.bloodGroup}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Health Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 text-center shadow-2xs">
          <span className="text-lg font-black text-[#0F4C81]">{reminders.length}</span>
          <span className="block text-[11px] font-semibold text-slate-500 mt-0.5">Reminders</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 text-center shadow-2xs">
          <span className="text-lg font-black text-[#0EA5E9]">{prescriptions.length}</span>
          <span className="block text-[11px] font-semibold text-slate-500 mt-0.5">Stored Rx</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 text-center shadow-2xs">
          <span className="text-lg font-black text-emerald-600">94%</span>
          <span className="block text-[11px] font-semibold text-slate-500 mt-0.5">Adherence</span>
        </div>
      </div>

      {/* 3. Caregiver Link Card */}
      <div
        onClick={() => {
          if (user.role === 'caregiver' || user.role === 'dual' || user.role === 'both') {
            onNavigate('caregiver_hub');
          } else {
            onNavigate('caregiver_link');
          }
        }}
        id="btn-profile-caregiver-link"
        className="bg-[#FAF5FF] border border-[#E9D5FF] rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-[#F3E8FF] transition-all shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6B21A8] text-white flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-[#3B0764]">
              {user.role === 'caregiver'
                ? 'Caregiver Hub'
                : user.role === 'dual' || user.role === 'both'
                ? 'Dual Mode Family Hub'
                : 'Connect Family Member'}
            </h4>
            <p className="text-[11px] text-purple-700 mt-0.5">
              {user.role === 'caregiver'
                ? 'View family members & missed dose alerts'
                : user.role === 'dual' || user.role === 'both'
                ? 'My medicines + connected family member'
                : 'Generate 6-digit code for trusted family member'}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-purple-600" />
      </div>

      {/* 4. Settings Menu */}
      <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs overflow-hidden">
        {/* App Mode */}
        <button
          onClick={() => setShowModeModal(true)}
          id="btn-profile-change-mode"
          className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <Layers className="w-4 h-4 text-[#6B21A8]" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">App Operating Mode</span>
              <span className="text-[11px] text-slate-400">
                {user.mode === 'family_caregiver' || user.role === 'caregiver' || user.role === 'family_caregiver'
                  ? 'Family Caregiver'
                  : user.mode === 'dual' || user.role === 'dual' || user.role === 'both'
                  ? 'Dual Mode'
                  : 'For Myself'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#6B21A8]">Switch</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </button>

        {/* APK & App Installation Setup */}
        {onOpenApkModal && (
          <button
            onClick={onOpenApkModal}
            id="btn-profile-apk-setup"
            className="w-full p-3.5 flex items-center justify-between hover:bg-sky-50 transition-colors text-left bg-sky-50/25"
          >
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-[#0F4C81]" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 block">APK & Standalone App Setup</span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                    Ready
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Install on Android, offline cache & APK generation
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#0F4C81]">Open</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </button>
        )}

        {/* Language */}
        <button
          onClick={() => setShowLanguageModal(true)}
          id="btn-profile-change-lang"
          className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-slate-500" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">App Language</span>
              <span className="text-[11px] text-slate-400">
                {user.language === 'hi' ? 'हिंदी (Hindi)' : user.language === 'gu' ? 'ગુજરાતી (Gujarati)' : 'English'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Test Alarm Sound */}
        <button
          onClick={handleTestAlarm}
          id="btn-profile-test-alarm"
          className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-slate-500" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">Test Alarm Sound</span>
              <span className="text-[11px] text-slate-400">Preview Web Audio dose chime</span>
            </div>
          </div>
          <span className="text-xs font-bold text-[#0EA5E9]">Play Chime</span>
        </button>

        {/* Export Data */}
        <button
          onClick={handleExportData}
          id="btn-export-data"
          className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <Download className="w-4 h-4 text-slate-500" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">Export Health Data</span>
              <span className="text-[11px] text-slate-400">Download complete JSON medical archive</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Clear Local Cache */}
        <button
          onClick={() => setShowClearConfirm(true)}
          id="btn-clear-cache"
          className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <Trash2 className="w-4 h-4 text-slate-500" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">Clear Session Cache</span>
              <span className="text-[11px] text-slate-400">Reset local browser state and reload</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* 5. Emergency Helpline card */}
      <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold block">Medical Emergency Helplines</span>
            <span className="text-[11px] text-amber-800">Ambulance: 108 • National Emergency: 112</span>
          </div>
        </div>
        <a
          href="tel:108"
          className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-bold shrink-0"
        >
          Call 108
        </a>
      </div>

      {/* 6. Logout Button */}
      <button
        onClick={onLogout}
        id="btn-logout"
        className="w-full py-3 px-4 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out of PharmaCare</span>
      </button>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-[#0F172A]">Edit Personal Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                >
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-[#0EA5E9] text-white text-xs font-bold hover:bg-[#0284C7]"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Language Switcher Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-[#0F172A]">Select Language</h3>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {[
                { code: 'en' as AppLanguage, label: 'English', native: 'English' },
                { code: 'hi' as AppLanguage, label: 'Hindi', native: 'हिंदी' },
                { code: 'gu' as AppLanguage, label: 'Gujarati', native: 'ગુજરાતી' },
              ].map((item) => (
                <button
                  key={item.code}
                  onClick={() => {
                    onChangeLanguage(item.code);
                    setShowLanguageModal(false);
                    showToast('success', 'Language Changed', `Set to ${item.native}`);
                  }}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                    user.language === item.code
                      ? 'border-[#0F4C81] bg-sky-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-800 block">{item.native}</span>
                    <span className="text-[11px] text-slate-400">{item.label}</span>
                  </div>
                  {user.language === item.code && (
                    <span className="w-2 h-2 rounded-full bg-[#0F4C81]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* App Mode Switcher Modal */}
      {showModeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-extrabold text-[#0F172A]">Switch Operating Mode</h4>
                <p className="text-xs text-slate-500 mt-0.5">Select how you want to use PharmaCare</p>
              </div>
              <button
                onClick={() => setShowModeModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 mb-2">
              {[
                {
                  mode: 'myself' as UserMode,
                  role: 'myself' as UserRole,
                  title: 'FOR MYSELF',
                  desc: 'Manage your own medicines, reminders, prescriptions, and health profile.',
                },
                {
                  mode: 'family_caregiver' as UserMode,
                  role: 'caregiver' as UserRole,
                  title: 'FAMILY CAREGIVER',
                  desc: "Connect with and help monitor a family member's medicine reminders via 6-digit code.",
                },
                {
                  mode: 'dual' as UserMode,
                  role: 'dual' as UserRole,
                  title: 'DUAL MODE',
                  desc: 'Manage your own medicines and monitor a connected family member at the same time.',
                },
              ].map((opt) => {
                const isCurrent =
                  user.mode === opt.mode ||
                  (!user.mode &&
                    ((opt.mode === 'myself' && (user.role === 'myself' || user.role === 'patient')) ||
                     (opt.mode === 'family_caregiver' && (user.role === 'caregiver' || user.role === 'family_caregiver')) ||
                     (opt.mode === 'dual' && (user.role === 'dual' || user.role === 'both'))));

                return (
                  <button
                    key={opt.mode}
                    onClick={() => {
                      const userKey = user.mobile || user.id || user.name;
                      storage.setUserMode(opt.mode, userKey);
                      onUpdateProfile({ role: opt.role, mode: opt.mode });
                      setShowModeModal(false);
                      showToast('success', 'Mode Updated', `Switched to ${opt.title}`);
                      if (opt.mode === 'family_caregiver') {
                        onNavigate('caregiver_hub');
                      } else {
                        onNavigate('home');
                      }
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-start justify-between transition-all ${
                      isCurrent
                        ? 'border-[#6B21A8] bg-purple-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900">{opt.title}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-200 text-purple-900">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{opt.desc}</p>
                    </div>
                    {isCurrent && (
                      <CheckCircle2 className="w-4 h-4 text-[#6B21A8] shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Clear Cache Confirm */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h4 className="text-sm font-extrabold text-[#0F172A]">Clear Local Cache?</h4>
            </div>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              This will clear the cached session in your browser and reload the application. Your server data remains safe.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleClearCache}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Clear & Reload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
