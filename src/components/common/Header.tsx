import React from 'react';
import { ArrowLeft, Users, BookOpen, Server, FileCode2, Smartphone, WifiOff } from 'lucide-react';
import { AppLanguage } from '../../types';
import { getTranslation } from '../../i18n/translations';

interface HeaderProps {
  titleKey: string;
  canGoBack: boolean;
  onBack: () => void;
  lang: AppLanguage;
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onOpenBackendModal: () => void;
  onOpenGuideModal: () => void;
  onOpenApkModal?: () => void;
  isOnline?: boolean;
  activeAlertsCount?: number;
  isPremium?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  titleKey,
  canGoBack,
  onBack,
  lang,
  currentScreen,
  onNavigate,
  onOpenBackendModal,
  onOpenGuideModal,
  onOpenApkModal,
  isOnline = true,
  activeAlertsCount = 0,
  isPremium = false,
}) => {
  const isCaregiverActive = currentScreen === 'family_care' || currentScreen === 'caregiver_dashboard';
  const isTipsActive = currentScreen === 'health_tips';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-3 py-2.5 flex items-center justify-between shadow-xs pt-[max(0.625rem,env(safe-area-inset-top))]">
      {/* Left side: Back + Title */}
      <div className="flex items-center gap-2 min-w-0">
        {canGoBack && (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-navy hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-1.5 truncate">
          <h1 className="text-base font-bold text-[#0F4C81] truncate tracking-tight">
            {getTranslation(lang, titleKey)}
          </h1>
          {isPremium ? (
            <button
              onClick={() => onNavigate('subscription')}
              title="PharmaCare Premium Plan Active"
              className="px-1.5 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-black tracking-wider uppercase shrink-0 hover:bg-amber-200 transition-colors"
            >
              PRO
            </button>
          ) : (
            <button
              onClick={() => onNavigate('subscription')}
              title="Upgrade to Premium"
              className="hidden sm:inline-flex px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[10px] font-bold shrink-0 transition-colors"
            >
              FREE
            </button>
          )}
          {!isOnline && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold shrink-0">
              <WifiOff className="w-3 h-3 text-amber-700" />
              Offline
            </span>
          )}
        </div>
      </div>

      {/* Right side icons */}
      <div className="flex items-center gap-1 shrink-0">
        {/* 0. APK / Install App Button */}
        {onOpenApkModal && (
          <button
            onClick={onOpenApkModal}
            id="btn-header-apk-info"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#0F4C81] hover:bg-sky-50 relative active:scale-95 transition-all"
            title="Install App & APK Setup"
            aria-label="Install App"
          >
            <Smartphone className="w-4 h-4 text-[#0F4C81]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-500" />
          </button>
        )}

        {/* 1. Build Guide */}
        <button
          onClick={onOpenGuideModal}
          id="btn-header-build-guide"
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-navy hover:bg-slate-100 rounded-lg transition-all"
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span>{getTranslation(lang, 'header.guide')}</span>
        </button>

        {/* 2. Backend status */}
        <button
          onClick={onOpenBackendModal}
          id="btn-header-backend-status"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 relative active:scale-95 transition-all"
          title="Backend Server Status"
          aria-label="Backend status"
        >
          <Server className="w-4 h-4 text-slate-600" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>

        {/* 3. Family Caregiver */}
        <button
          onClick={() => onNavigate('caregiver_dashboard')}
          id="btn-header-caregiver"
          className={`w-9 h-9 rounded-xl flex items-center justify-center relative active:scale-95 transition-all ${
            isCaregiverActive
              ? 'bg-[#6B21A8] text-white shadow-xs'
              : 'text-[#6B21A8] hover:bg-purple-50'
          }`}
          title="Family Caregiver"
          aria-label="Caregiver"
        >
          <Users className="w-4 h-4" />
          {activeAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
              {activeAlertsCount}
            </span>
          )}
        </button>

        {/* 4. Health Tips */}
        <button
          onClick={() => onNavigate('health_tips')}
          id="btn-header-tips"
          className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
            isTipsActive
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Health & Safety Tips"
          aria-label="Health Tips"
        >
          <BookOpen className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
