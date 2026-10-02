import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  UserProfile,
  MedicineReminder,
  Prescription,
  Doctor,
  MedicineItem,
  AppLanguage,
  ToastNotification,
  UserRole,
  UserMode
} from './types';
import { authService } from './services/auth';
import { api } from './services/api';
import { storage } from './services/storage';
import { notificationEngine } from './services/notifications';
import { crossDeviceSync } from './services/crossDeviceSync';

// Common Components
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { Toast } from './components/common/Toast';
import { APKInfoModal } from './components/common/APKInfoModal';
import { BackendStatusModal } from './components/common/BackendStatusModal';
import { useAndroidBackHandler } from './hooks/useAndroidBackHandler';

// Auth / Onboarding Screens
import { SplashScreen } from './components/screens/SplashScreen';
import { OnboardingScreen } from './components/screens/OnboardingScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { ModeSelectScreen } from './components/screens/ModeSelectScreen';
import { RoleSelectScreen } from './components/screens/RoleSelectScreen';
import { LanguageSelectScreen } from './components/screens/LanguageSelectScreen';

// Main App Screens
import { HomeScreen } from './components/screens/HomeScreen';
import { MedicinesScreen } from './components/screens/MedicinesScreen';
import { RemindersScreen } from './components/screens/RemindersScreen';
import { PrescriptionsScreen } from './components/screens/PrescriptionsScreen';
import { PharmaciesScreen } from './components/screens/PharmaciesScreen';
import { DoctorsScreen } from './components/screens/DoctorsScreen';
import { DoctorDetailsScreen } from './components/screens/DoctorDetailsScreen';
import { HealthTipsScreen } from './components/screens/HealthTipsScreen';
import { FamilyCaregiverLinkScreen } from './components/screens/FamilyCaregiverLinkScreen';
import { CaregiverHubScreen } from './components/screens/CaregiverHubScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { SubscriptionScreen } from './components/screens/SubscriptionScreen';

type AuthStage = 'splash' | 'onboarding' | 'login' | 'mode_select' | 'role_select' | 'language_select' | 'authenticated';

export default function App() {
  const [authStage, setAuthStage] = useState<AuthStage>('splash');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [navigationStack, setNavigationStack] = useState<string[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [lang, setLang] = useState<AppLanguage>('en');

  // Multi-step back handler registry for the currently active screen
  const activeScreenBackHandlerRef = useRef<(() => boolean) | null>(null);
  const registerBackHandler = useCallback((handler: () => boolean) => {
    activeScreenBackHandlerRef.current = handler;
    return () => {
      if (activeScreenBackHandlerRef.current === handler) {
        activeScreenBackHandlerRef.current = null;
      }
    };
  }, []);

  // Application Data States
  const [reminders, setReminders] = useState<MedicineReminder[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Navigation Detail Sub-views
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineItem | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [reminderAddPreset, setReminderAddPreset] = useState<{
    name: string;
    generic: string;
    dosage: string;
  } | null>(null);

  // Toast System
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [showApkModal, setShowApkModal] = useState<boolean>(false);
  const [showBackendModal, setShowBackendModal] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = (
    type: 'success' | 'info' | 'error' | 'warning',
    title: string,
    message: string
  ) => {
    const newToast: ToastNotification = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      title,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Initial Session Load
  useEffect(() => {
    const session = authService.getSession();
    if (session) {
      const userKey = session.user.mobile || session.user.id || session.user.name;
      const savedMode = storage.getUserMode(userKey);
      const effectiveMode: UserMode =
        savedMode ||
        session.user.mode ||
        (session.user.role === 'caregiver' || session.user.role === 'family_caregiver'
          ? 'family_caregiver'
          : session.user.role === 'dual' || session.user.role === 'both'
          ? 'dual'
          : 'myself');
      const effectiveRole: UserRole = effectiveMode === 'family_caregiver' ? 'caregiver' : effectiveMode;

      const updatedUser: UserProfile = {
        ...session.user,
        mode: effectiveMode,
        role: effectiveRole,
      };

      setUser(updatedUser);
      setLang(session.user.language || 'en');
      loadAppData();

      if (effectiveMode === 'family_caregiver') {
        setActiveTab('caregiver_hub');
      } else {
        setActiveTab('home');
      }

      setAuthStage('authenticated');
    }
  }, []);

  // Real-time cross-device synchronization connection & event dispatcher
  useEffect(() => {
    if (!user || !user.isLoggedIn || !user.mobile) return;

    crossDeviceSync.connect();

    const unsubscribe = crossDeviceSync.subscribe({
      onDoseLogged: (data) => {
        setReminders((prev) =>
          prev.map((r) => {
            if (r.id === data.reminderId) {
              const existingIdx = r.doseLogs.findIndex(
                (l) => l.time === data.time && l.date === new Date().toISOString().split('T')[0]
              );
              const newLogs = [...r.doseLogs];
              const logEntry = {
                date: new Date().toISOString().split('T')[0],
                time: data.time,
                status: data.status as 'taken' | 'skipped' | 'snoozed',
                timestamp: data.timestamp,
              };
              if (existingIdx >= 0) newLogs[existingIdx] = logEntry;
              else newLogs.push(logEntry);
              return { ...r, doseLogs: newLogs };
            }
            return r;
          })
        );
      },
      onRemindersUpdated: (data) => {
        if (data.reminders) {
          setReminders(data.reminders);
          notificationEngine.syncActiveReminders(data.reminders);
        }
      },
      onDeviceNudge: (nudge) => {
        showToast('info', `Reminder from ${nudge.fromName}`, nudge.message);
      },
      onEmergencySos: (sos) => {
        showToast('warning', 'Emergency SOS Alert', `${sos.patientName} triggered an urgent medical alert!`);
      },
      onDeviceLinked: (conn) => {
        showToast('success', 'Device Connected', `Cross-device sync active with ${conn.caregiverName || conn.patientName}.`);
      },
      onDeviceUnlinked: () => {
        showToast('info', 'Device Unlinked', 'Cross-device pairing was disconnected.');
      },
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const loadAppData = async () => {
    try {
      const [rems, rxs, docs, subRes] = await Promise.all([
        api.getReminders(),
        api.getPrescriptions(),
        api.getDoctors(),
        api.getSubscriptionStatus().catch(() => null),
      ]);
      setReminders(rems);
      setPrescriptions(rxs);
      setDoctors(docs);
      notificationEngine.syncActiveReminders(rems);

      if (subRes && subRes.subscription) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                plan: subRes.plan,
                subscriptionStatus: subRes.subscription.status,
                subscriptionExpiry: subRes.subscription.expiryDate,
              }
            : null
        );
      }
    } catch (err) {
      console.warn('Initial data load warning:', err);
    }
  };

  // 2. Auth Flow Handlers
  const handleSplashFinish = () => {
    const session = authService.getSession();
    if (session) {
      setAuthStage('authenticated');
    } else {
      setAuthStage('onboarding');
    }
  };

  const handleLoginSuccess = async (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    setLang(loggedInUser.language || 'en');
    await loadAppData();
    // After successful login + demo OTP verification, show Mode Selection screen
    setAuthStage('mode_select');
  };

  const handleModeSelect = (mode: UserMode) => {
    const role: UserRole = mode === 'family_caregiver' ? 'caregiver' : mode;
    const userKey = user?.mobile || user?.id || user?.name || 'default';
    storage.setUserMode(mode, userKey);

    if (user) {
      const updated: UserProfile = { ...user, mode, role };
      setUser(updated);
      storage.saveProfile(updated);
      authService.updateProfile({ mode, role });
    }

    if (mode === 'family_caregiver') {
      setActiveTab('caregiver_hub');
    } else {
      setActiveTab('home');
    }

    setAuthStage('authenticated');
    showToast(
      'success',
      'Mode Selected',
      mode === 'family_caregiver'
        ? 'Family Caregiver mode active.'
        : mode === 'dual'
        ? 'Dual Mode active.'
        : 'For Myself mode active.'
    );
  };

  const handleRoleSelect = (role: UserRole) => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      authService.updateProfile({ role });
    }
    if (role === 'caregiver') {
      setActiveTab('caregiver_hub');
    } else {
      setActiveTab('home');
    }
    setAuthStage('language_select');
  };

  const handleLanguageSelect = (selectedLang: AppLanguage) => {
    setLang(selectedLang);
    if (user) {
      const updated = { ...user, language: selectedLang };
      setUser(updated);
      authService.updateProfile({ language: selectedLang });
    }
    setAuthStage('authenticated');
    showToast('info', 'Language Configured', 'App preferences updated.');
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setReminders([]);
    setPrescriptions([]);
    setDoctors([]);
    setAuthStage('login');
    setActiveTab('home');
    showToast('info', 'Logged Out', 'You have been signed out safely.');
  };

  // 3. Data Handlers
  const handleSaveReminder = async (reminderData: Partial<MedicineReminder>) => {
    try {
      const saved = await api.saveReminder(reminderData);
      setReminders((prev) => {
        const exists = prev.some((r) => r.id === saved.id);
        const updated = exists
          ? prev.map((r) => (r.id === saved.id ? saved : r))
          : [saved, ...prev];
        notificationEngine.syncActiveReminders(updated);
        return updated;
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not save medication alarm.';
      showToast('error', 'Save Reminder Failed', msg);
      throw e;
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await api.deleteReminder(id);
      setReminders((prev) => {
        const updated = prev.filter((r) => r.id !== id);
        notificationEngine.syncActiveReminders(updated);
        return updated;
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not remove reminder.';
      showToast('error', 'Delete Failed', msg);
      throw e;
    }
  };

  const handleLogDose = async (
    reminderId: string,
    time: string,
    status: 'taken' | 'skipped' | 'snoozed'
  ) => {
    try {
      const updatedReminder = await api.logDose(reminderId, time, status);
      setReminders((prev) =>
        prev.map((r) => (r.id === updatedReminder.id ? updatedReminder : r))
      );
    } catch (e) {
      showToast('error', 'Log Dose Failed', 'Could not record medication status.');
    }
  };

  const handleUploadPrescription = async (payload: {
    patientName: string;
    doctorName: string;
    clinicName?: string;
    fileDataUrl: string;
    fileName: string;
    fileType: 'image' | 'pdf';
    fileSize: string;
    notes: string;
  }) => {
    const rx = await api.uploadPrescription(payload);
    setPrescriptions((prev) => [rx, ...prev]);
  };

  const handleDeletePrescription = async (id: string) => {
    await api.deletePrescription(id);
    setPrescriptions((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaveCustomDoctor = async (docData: Partial<Doctor>) => {
    const saved = await api.saveCustomDoctor(docData);
    setDoctors((prev) => {
      const exists = prev.some((d) => d.id === saved.id);
      return exists ? prev.map((d) => (d.id === saved.id ? saved : d)) : [saved, ...prev];
    });
  };

  const handleDeleteCustomDoctor = async (id: string) => {
    await api.deleteCustomDoctor(id);
    setDoctors((prev) => prev.filter((d) => d.id !== id));
  };

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    if (!user) return;
    const merged = { ...user, ...updated };
    setUser(merged);
    authService.updateProfile(updated);
  };

  // 4. Navigation Handlers with History Stack
  const handleNavigate = (tab: string) => {
    setSelectedMedicine(null);
    setSelectedDoctor(null);
    let target = tab;
    if (target === 'caregiver_dashboard') target = 'caregiver_hub';
    if (target === 'family_care') target = 'caregiver_link';
    if (target === 'health_tips') target = 'tips';

    if (target === activeTab) return;

    // Push previous screen to navigation history stack
    setNavigationStack((prev) => [...prev, activeTab]);
    setActiveTab(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectMedicine = (med: MedicineItem) => {
    setSelectedMedicine(med);
    setNavigationStack((prev) => [...prev, activeTab]);
    setActiveTab('medicine_details');
  };

  const handleSelectDoctor = (doc: Doctor) => {
    setSelectedDoctor(doc);
    setNavigationStack((prev) => [...prev, activeTab]);
    setActiveTab('doctor_details');
  };

  const handleAddReminderForMedicine = (med: MedicineItem) => {
    setReminderAddPreset({
      name: med.name,
      generic: med.genericName,
      dosage: med.strength,
    });
    setSelectedMedicine(null);
    setNavigationStack((prev) => [...prev, activeTab]);
    setActiveTab('reminders');
  };

  const handleGoBack = useCallback((): boolean => {
    // 1. Check if the active child screen has an internal modal/sub-step to handle
    if (activeScreenBackHandlerRef.current) {
      const handled = activeScreenBackHandlerRef.current();
      if (handled) {
        return true;
      }
    }

    // 2. Global modal (APK info modal)
    if (showApkModal) {
      setShowApkModal(false);
      return true;
    }

    // 3. Clear sub-screen detail view selections
    if (activeTab === 'doctor_details') {
      setSelectedDoctor(null);
    }
    if (activeTab === 'medicine_details') {
      setSelectedMedicine(null);
    }

    // 4. Determine root screen
    const rootScreen =
      user?.role === 'caregiver' || user?.role === 'family_caregiver'
        ? 'caregiver_hub'
        : 'home';

    // 5. Pop previous screen from navigation stack
    if (navigationStack.length > 0) {
      const prevStack = [...navigationStack];
      let previousScreen = prevStack.pop();
      while (previousScreen === activeTab && prevStack.length > 0) {
        previousScreen = prevStack.pop();
      }
      setNavigationStack(prevStack);
      const targetScreen = previousScreen && previousScreen !== activeTab ? previousScreen : rootScreen;
      setActiveTab(targetScreen);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }

    // 6. Fallback if navigationStack is empty but user is not at their root screen
    if (activeTab !== rootScreen) {
      setActiveTab(rootScreen);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }

    // 7. User is at root screen with no further history
    return false;
  }, [navigationStack, showApkModal, activeTab, user]);

  // Android Hardware / Gesture Back Handling
  useAndroidBackHandler({
    currentScreen: activeTab,
    onGoBack: handleGoBack,
    showToast,
  });

  // 5. Render Early Auth Stages
  if (authStage === 'splash') {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (authStage === 'onboarding') {
    return (
      <OnboardingScreen
        onComplete={() => setAuthStage('login')}
      />
    );
  }

  if (authStage === 'login') {
    return (
      <>
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          showToast={showToast}
        />
        <Toast toast={toasts[0] || null} onClose={() => removeToast(toasts[0]?.id || '')} />
      </>
    );
  }

  if (authStage === 'mode_select') {
    return (
      <>
        <ModeSelectScreen
          currentMode={user?.mode || null}
          userName={user?.name}
          onSelectMode={handleModeSelect}
          showToast={showToast}
        />
        <Toast toast={toasts[0] || null} onClose={() => removeToast(toasts[0]?.id || '')} />
      </>
    );
  }

  if (authStage === 'role_select') {
    return (
      <RoleSelectScreen
        onComplete={handleRoleSelect}
        showToast={showToast}
      />
    );
  }

  if (authStage === 'language_select') {
    return (
      <LanguageSelectScreen
        currentLanguage={lang}
        onLanguageChange={(l) => setLang(l)}
        onConfirm={() => setAuthStage('authenticated')}
        showToast={showToast}
      />
    );
  }

  // Safe fallback user if null
  const currentUser: UserProfile = user || {
    id: 'user_default',
    name: 'Patient User',
    mobile: '+91 98765 43210',
    role: 'patient',
    isLoggedIn: true,
    language: lang,
  };

  // 6. Authenticated App Screen View
  const isSubScreen =
    activeTab === 'doctor_details' ||
    activeTab === 'caregiver_link' ||
    activeTab === 'caregiver_hub' ||
    activeTab === 'tips' ||
    activeTab === 'subscription';

  return (
    <div className="min-h-screen bg-[#F5FAFF] text-[#0F172A] flex flex-col selection:bg-sky-200">
      {/* Toast Alert Portal */}
      <Toast toast={toasts[0] || null} onClose={() => removeToast(toasts[0]?.id || '')} />

      {/* Persistent App Header */}
      <Header
        titleKey={`nav.${activeTab}`}
        canGoBack={
          navigationStack.length > 0 ||
          activeTab !==
            (currentUser.role === 'caregiver' || currentUser.role === 'family_caregiver'
              ? 'caregiver_hub'
              : 'home') ||
          isSubScreen
        }
        onBack={handleGoBack}
        lang={lang}
        currentScreen={activeTab}
        onNavigate={handleNavigate}
        onOpenBackendModal={() => setShowBackendModal(true)}
        onOpenGuideModal={() => setActiveTab('health_tips')}
        onOpenApkModal={() => setShowApkModal(true)}
        isOnline={isOnline}
        isPremium={currentUser.plan === 'premium' && currentUser.subscriptionStatus === 'active'}
      />

      {/* Main Screen Content View */}
      <main className={`flex-1 w-full mx-auto pb-20 ${activeTab === 'subscription' ? 'max-w-4xl' : 'max-w-md'}`}>
        {activeTab === 'home' && (
          <HomeScreen
            user={currentUser}
            lang={lang}
            reminders={reminders}
            prescriptions={prescriptions}
            onNavigate={handleNavigate}
            onTakeDose={(reminderId, time) => handleLogDose(reminderId, time, 'taken')}
            showToast={showToast}
          />
        )}

        {activeTab === 'medicines' && (
          <MedicinesScreen
            lang={lang}
            onSelectForReminder={(preset) => {
              setReminderAddPreset(preset);
              setActiveTab('reminders');
            }}
            onRegisterBackHandler={registerBackHandler}
            showToast={showToast}
          />
        )}

        {activeTab === 'reminders' && (
          <RemindersScreen
            reminders={reminders}
            lang={lang}
            user={currentUser}
            onNavigate={handleNavigate}
            onSaveReminder={handleSaveReminder}
            onDeleteReminder={handleDeleteReminder}
            onLogDose={handleLogDose}
            initialAddData={reminderAddPreset}
            onClearInitialAddData={() => setReminderAddPreset(null)}
            onRegisterBackHandler={registerBackHandler}
            showToast={showToast}
          />
        )}

        {activeTab === 'prescriptions' && (
          <PrescriptionsScreen
            prescriptions={prescriptions}
            lang={lang}
            user={currentUser}
            onNavigate={handleNavigate}
            userName={user?.name}
            onUploadPrescription={handleUploadPrescription}
            onDeletePrescription={handleDeletePrescription}
            onRegisterBackHandler={registerBackHandler}
            showToast={showToast}
          />
        )}

        {activeTab === 'pharmacies' && (
          <PharmaciesScreen lang={lang} showToast={showToast} />
        )}

        {activeTab === 'doctors' && (
          <DoctorsScreen
            doctors={doctors}
            lang={lang}
            onSelectDoctor={handleSelectDoctor}
            onSaveCustomDoctor={handleSaveCustomDoctor}
            onDeleteCustomDoctor={handleDeleteCustomDoctor}
            onRegisterBackHandler={registerBackHandler}
            showToast={showToast}
          />
        )}

        {activeTab === 'doctor_details' && selectedDoctor && (
          <DoctorDetailsScreen
            doctor={selectedDoctor}
            lang={lang}
            onBack={handleGoBack}
            showToast={showToast}
          />
        )}

        {activeTab === 'tips' && (
          <HealthTipsScreen lang={lang} showToast={showToast} />
        )}

        {activeTab === 'caregiver_link' && user && (
          <FamilyCaregiverLinkScreen
            user={user}
            lang={lang}
            onUpdateProfile={handleUpdateProfile}
            onRegisterBackHandler={registerBackHandler}
            showToast={showToast}
          />
        )}

        {activeTab === 'caregiver_hub' && (
          <CaregiverHubScreen
            lang={lang}
            user={currentUser}
            myReminders={reminders}
            onTakeDose={(reminderId, time) => handleLogDose(reminderId, time, 'taken')}
            onNavigate={handleNavigate}
            onRegisterBackHandler={registerBackHandler}
            showToast={showToast}
          />
        )}

        {activeTab === 'profile' && user && (
          <ProfileScreen
            user={user}
            lang={lang}
            reminders={reminders}
            prescriptions={prescriptions}
            onUpdateProfile={handleUpdateProfile}
            onChangeLanguage={(l) => {
              setLang(l);
              handleUpdateProfile({ language: l });
            }}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            onOpenApkModal={() => setShowApkModal(true)}
            showToast={showToast}
          />
        )}

        {activeTab === 'subscription' && (
          <SubscriptionScreen
            user={currentUser}
            lang={lang}
            onBack={handleGoBack}
            onSubscriptionUpdated={(newPlan, sub) => {
              setUser((prev) =>
                prev
                  ? {
                      ...prev,
                      plan: newPlan,
                      subscriptionStatus: sub.status,
                      subscriptionExpiry: sub.expiryDate,
                    }
                  : null
              );
            }}
            onRegisterBackHandler={registerBackHandler}
            showToast={showToast}
          />
        )}
      </main>

      {/* APK & App Installation Modal */}
      <APKInfoModal
        isOpen={showApkModal}
        onClose={() => setShowApkModal(false)}
        isOnline={isOnline}
      />

      {/* Backend Status & API Configuration Modal */}
      <BackendStatusModal
        isOpen={showBackendModal}
        onClose={() => setShowBackendModal(false)}
        showToast={showToast}
        onBackendUrlChanged={() => {
          loadAppData();
        }}
      />

      {/* Persistent Bottom Navigation Bar */}
      <BottomNav
        currentScreen={activeTab}
        onNavigate={handleNavigate}
        lang={lang}
        userRole={currentUser.role}
        activeRemindersCount={reminders.filter((r) => r.active).length}
        prescriptionsCount={prescriptions.length}
      />
    </div>
  );
}
