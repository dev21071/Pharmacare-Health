import React, { useState } from 'react';
import { Pill, Users, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { UserRole, UserProfile, UserMode } from '../../types';
import { api } from '../../services/api';
import { storage } from '../../services/storage';

interface RoleSelectScreenProps {
  initialRole?: UserRole;
  isFromProfile?: boolean;
  onComplete: (role: UserRole) => void;
  showToast: (type: 'success' | 'info' | 'error' | 'warning', title: string, message: string) => void;
}

export const RoleSelectScreen: React.FC<RoleSelectScreenProps> = ({
  initialRole = 'myself',
  isFromProfile = false,
  onComplete,
  showToast,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      id: 'myself' as UserRole,
      title: 'Myself',
      emoji: '💊',
      badge: 'Personal',
      description: 'Use PharmaCare strictly for personal medicine management, reminders, and prescriptions.',
      features: ['Personal medicine schedule & alarms', 'Connect family member with 6-digit code'],
    },
    {
      id: 'caregiver' as UserRole,
      title: 'Family Caregiver',
      emoji: '👨‍👩‍👧',
      badge: 'Caregiver',
      description: 'Monitor connected family members, view real-time doses, and receive instant missed-dose alerts.',
      features: ['Link patient with 6-digit code', 'Live missed-dose alerts & 1-tap WhatsApp/call'],
    },
    {
      id: 'dual' as UserRole,
      title: 'Dual Mode',
      emoji: '🔄',
      badge: 'All-In-One',
      description: 'Manage your own medications while simultaneously monitoring connected family members.',
      features: ['Full personal medicine tracker', 'Simultaneous family caregiver dashboard'],
    },
  ];

  const handleContinue = async () => {
    setLoading(true);
    try {
      const currentProfile = storage.getProfile() || ({} as UserProfile);
      const mode: UserMode =
        selectedRole === 'caregiver' || selectedRole === 'family_caregiver'
          ? 'family_caregiver'
          : selectedRole === 'dual' || selectedRole === 'both'
          ? 'dual'
          : 'myself';
      const updatedProfile: UserProfile = {
        ...currentProfile,
        role: selectedRole,
        mode,
      };
      storage.saveProfile(updatedProfile);
      storage.setUserMode(mode, currentProfile.mobile || currentProfile.id || currentProfile.name);

      // Background sync to server
      api.updateProfile({ role: selectedRole, mode }).catch((e) => {
        console.warn('Background role sync note:', e);
      });

      showToast('success', 'Role Configured', `Active profile set to ${selectedRole.toUpperCase()}`);
      onComplete(selectedRole);
    } catch {
      onComplete(selectedRole);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF5FF] flex flex-col justify-between p-6 max-w-md mx-auto select-none">
      {/* Top Banner */}
      <div className="pt-2">
        <div className="bg-white rounded-2xl p-4 border border-[#E9D5FF] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F3E8FF] text-[#6B21A8]">
              {isFromProfile ? 'Settings' : 'Step 2 of 2: Role Selection'}
            </span>
            <Users className="w-4 h-4 text-[#6B21A8]" />
          </div>
          <h1 className="text-lg font-extrabold text-[#3B0764] leading-tight">
            PharmaCare Care Network
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Personalized Experience Setup
          </p>
        </div>
      </div>

      {/* Main Role Options */}
      <div className="my-auto py-6">
        <h2 className="text-xl font-extrabold text-[#3B0764] tracking-tight mb-2">
          How will you use PharmaCare?
        </h2>
        <p className="text-xs font-medium text-slate-500 mb-5">
          Select your primary mode. You can switch this at any time in Profile & Settings.
        </p>

        <div className="space-y-3.5">
          {roles.map((role) => {
            const isSelected = selectedRole === role.id;

            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-white border-[#6B21A8] shadow-md ring-2 ring-[#6B21A8]/20'
                    : 'bg-white/80 border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{role.emoji}</span>
                    <span className="text-sm font-extrabold text-[#0F172A]">
                      {role.title}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F3E8FF] text-[#6B21A8]">
                      {role.badge}
                    </span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-[#6B21A8] bg-[#6B21A8] text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>

                <p className="text-xs font-medium text-slate-600 mb-3 leading-relaxed">
                  {role.description}
                </p>

                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  {role.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#6B21A8] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Button */}
      <div className="pb-4">
        <button
          onClick={handleContinue}
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-xl bg-[#6B21A8] hover:bg-[#581C87] active:scale-[0.99] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span>{isFromProfile ? 'Save Role Setting' : 'Continue to PharmaCare'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
        <p className="text-[11px] text-center text-slate-400 mt-2">
          Roles can be modified anytime in Profile & Settings.
        </p>
      </div>
    </div>
  );
};
