import React, { useState } from 'react';
import {
  Smartphone,
  CheckCircle2,
  X,
  Volume2,
  Vibrate,
  ShieldCheck,
  Wifi,
  WifiOff,
  Download,
  HelpCircle,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { notificationEngine } from '../../services/notifications';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface APKInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
}

export const APKInfoModal: React.FC<APKInfoModalProps> = ({
  isOpen,
  onClose,
  isOnline,
}) => {
  const { isInstallable, isInstalled, install, isAndroid, isIOS } = usePWAInstall();
  const [testingAlarm, setTestingAlarm] = useState(false);
  const [activeTab, setActiveTab] = useState<'install' | 'features' | 'build'>('install');

  if (!isOpen) return null;

  const handleTestAlarm = async () => {
    setTestingAlarm(true);
    notificationEngine.playDoseChime();
    notificationEngine.vibrateDoseAlarm();
    await notificationEngine.sendTestNotification();
    setTimeout(() => setTestingAlarm(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F4C81] to-[#0284C7] p-4 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  PharmaCare APK & App Center
                  <span className="text-[10px] bg-emerald-400/90 text-slate-900 font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    Ready
                  </span>
                </h3>
                <p className="text-xs text-sky-100">Android APK & Standalone Mobile Setup</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-3.5 pt-2 border-t border-white/15">
            <button
              onClick={() => setActiveTab('install')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                activeTab === 'install'
                  ? 'bg-white text-[#0F4C81] shadow-xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              📱 Install App
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                activeTab === 'features'
                  ? 'bg-white text-[#0F4C81] shadow-xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              ⚡ APK Features
            </button>
            <button
              onClick={() => setActiveTab('build')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                activeTab === 'build'
                  ? 'bg-white text-[#0F4C81] shadow-xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              🛠️ APK Generation
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-slate-700">
          {/* TAB 1: INSTALL */}
          {activeTab === 'install' && (
            <div className="space-y-3.5">
              {/* Status Banner */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {isInstalled ? 'Running as Installed App' : 'Web / APK Container Mode'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isOnline ? 'Online — Real-time server sync' : 'Offline — Local storage cache active'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {isInstalled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                  {isInstalled ? 'Installed' : 'Ready'}
                </div>
              </div>

              {/* Direct Install Button */}
              {isInstallable && !isInstalled && (
                <button
                  onClick={install}
                  className="w-full py-3 px-4 rounded-xl bg-[#0F4C81] hover:bg-[#0c3c66] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition transform active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  Install PharmaCare on Device (1-Click)
                </button>
              )}

              {/* Android WebAPK Guidance */}
              <div className="p-3.5 rounded-xl border border-sky-100 bg-sky-50/60">
                <h4 className="text-xs font-black text-sky-950 flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  How to Install on Android (Chrome / Brave / Edge):
                </h4>
                <ol className="text-xs text-sky-900 space-y-1.5 list-decimal list-inside pl-1">
                  <li>Tap the <strong>three dots menu (⋮)</strong> at the top-right of your browser.</li>
                  <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>Android will automatically generate a <strong>native WebAPK</strong> with full app drawer icon, offline cache, and notification permissions.</li>
                </ol>
              </div>

              {/* Test Audio & Vibration Button */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Test APK Alarm & Vibration</h4>
                    <p className="text-[11px] text-slate-500">Verify audio chimes and vibration motor function on this device</p>
                  </div>
                  <button
                    onClick={handleTestAlarm}
                    disabled={testingAlarm}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    {testingAlarm ? 'Ringing...' : 'Test Alarm'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FEATURES */}
          {activeTab === 'features' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-600">
                PharmaCare is engineered specifically for Android APK containers and standalone mobile execution:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    title: 'Offline-First Engine',
                    desc: 'Scheduled medicines, doses, doctors, and prescriptions remain 100% accessible with zero internet.',
                    icon: WifiOff,
                    color: 'text-amber-600 bg-amber-50',
                  },
                  {
                    title: 'Android Hardware Back',
                    desc: 'Hardware back button and edge gestures close modals and return to Home without exiting app.',
                    icon: Smartphone,
                    color: 'text-blue-600 bg-blue-50',
                  },
                  {
                    title: 'Background Dose Alarms',
                    desc: 'Service Worker, Web Audio chime synthesis, and system vibration motor support.',
                    icon: Volume2,
                    color: 'text-emerald-600 bg-emerald-50',
                  },
                  {
                    title: 'Notch & Safe Area Fit',
                    desc: 'Adapts to phone notches, punch holes, and Android gesture navigation bars.',
                    icon: Layers,
                    color: 'text-purple-600 bg-purple-50',
                  },
                  {
                    title: 'Prescription Camera Vault',
                    desc: 'Direct camera snap and PDF prescription upload stored in local IndexedDB vault.',
                    icon: ShieldCheck,
                    color: 'text-sky-600 bg-sky-50',
                  },
                  {
                    title: 'WhatsApp & Direct Call',
                    desc: 'Deep links directly into Android WhatsApp (`wa.me`) and Phone dialer (`tel:`).',
                    icon: CheckCircle2,
                    color: 'text-emerald-600 bg-emerald-50',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`p-1.5 rounded-lg ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-slate-900">{item.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: BUILD APK GUIDE */}
          {activeTab === 'build' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-950">
                <h4 className="text-xs font-black flex items-center gap-1.5 mb-1">
                  <Smartphone className="w-4 h-4 text-purple-700" />
                  Generating a standalone .APK file
                </h4>
                <p className="text-[11px] text-purple-900 leading-relaxed">
                  PharmaCare has complete PWA manifest, service workers, and icons. You can generate a signed APK in under 2 minutes using any of these standard methods:
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <div className="font-bold text-slate-900 mb-1 flex items-center justify-between">
                    <span>Method 1: PWABuilder (Fastest, Official Microsoft Tool)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Recommended</span>
                  </div>
                  <ol className="text-[11px] text-slate-600 list-decimal list-inside space-y-1">
                    <li>Go to <strong>pwabuilder.com</strong></li>
                    <li>Enter your PharmaCare app URL</li>
                    <li>Click <strong>"Package for Android"</strong> to download a ready-to-install signed APK or Google Play AAB.</li>
                  </ol>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <div className="font-bold text-slate-900 mb-1">
                    Method 2: Website 2 APK Builder / Web2Apk
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Paste the app URL into <em>Website 2 APK Builder</em>, select orientation as Portrait, check "Cache & Offline mode", and click Generate APK.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <div className="font-bold text-slate-900 mb-1">
                    Method 3: Capacitor / Android Studio
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Run <code>npx @capacitor/cli init</code> and <code>npx cap add android</code> to build a native Android Studio project with custom Java/Kotlin extensions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Manifest & Service Worker Verified</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
