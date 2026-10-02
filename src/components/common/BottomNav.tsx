import React from 'react';
import { Home, Pill, Bell, FileText, User, Users, BookOpen } from 'lucide-react';
import { AppLanguage, UserRole } from '../../types';
import { getTranslation } from '../../i18n/translations';

interface BottomNavProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  lang: AppLanguage;
  userRole?: UserRole;
  activeRemindersCount?: number;
  prescriptionsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  lang,
  userRole = 'patient',
  activeRemindersCount = 0,
  prescriptionsCount = 0,
}) => {
  const isCaregiverOnly = userRole === 'caregiver' || userRole === 'family_caregiver';
  const isDual = userRole === 'dual' || userRole === 'both';

  let tabs;

  if (isCaregiverOnly) {
    tabs = [
      {
        id: 'caregiver_hub',
        label: 'Family Hub',
        icon: Users,
      },
      {
        id: 'medicines',
        label: getTranslation(lang, 'nav.medicines'),
        icon: Pill,
      },
      {
        id: 'prescriptions',
        label: getTranslation(lang, 'nav.prescriptions'),
        icon: FileText,
        badge: prescriptionsCount > 0 ? prescriptionsCount : undefined,
      },
      {
        id: 'tips',
        label: 'Health Tips',
        icon: BookOpen,
      },
      {
        id: 'profile',
        label: getTranslation(lang, 'nav.profile'),
        icon: User,
      },
    ];
  } else if (isDual) {
    tabs = [
      {
        id: 'home',
        label: getTranslation(lang, 'nav.home'),
        icon: Home,
      },
      {
        id: 'reminders',
        label: 'My Meds',
        icon: Bell,
        badge: activeRemindersCount > 0 ? activeRemindersCount : undefined,
      },
      {
        id: 'caregiver_hub',
        label: 'Family Hub',
        icon: Users,
      },
      {
        id: 'medicines',
        label: getTranslation(lang, 'nav.medicines'),
        icon: Pill,
      },
      {
        id: 'profile',
        label: getTranslation(lang, 'nav.profile'),
        icon: User,
      },
    ];
  } else {
    tabs = [
      {
        id: 'home',
        label: getTranslation(lang, 'nav.home'),
        icon: Home,
      },
      {
        id: 'medicines',
        label: getTranslation(lang, 'nav.medicines'),
        icon: Pill,
      },
      {
        id: 'reminders',
        label: getTranslation(lang, 'nav.reminders'),
        icon: Bell,
        badge: activeRemindersCount > 0 ? activeRemindersCount : undefined,
      },
      {
        id: 'prescriptions',
        label: getTranslation(lang, 'nav.prescriptions'),
        icon: FileText,
        badge: prescriptionsCount > 0 ? prescriptionsCount : undefined,
      },
      {
        id: 'profile',
        label: getTranslation(lang, 'nav.profile'),
        icon: User,
      },
    ];
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-md pb-[max(0.35rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentScreen === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className="flex flex-col items-center justify-center relative py-1 focus:outline-hidden transition-all"
            >
              <div
                className={`w-10 h-7 rounded-xl flex items-center justify-center transition-all relative ${
                  isActive ? 'bg-[#E0F2FE] text-[#0F4C81]' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#0EA5E9] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] font-semibold mt-0.5 tracking-tight truncate max-w-[64px] ${
                  isActive ? 'text-[#0F4C81]' : 'text-slate-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
