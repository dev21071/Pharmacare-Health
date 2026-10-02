import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  AlertCircle,
  Phone,
  MessageSquare,
  Plus,
  CheckCircle2,
  Clock,
  RefreshCw,
  X,
  Volume2,
  Copy,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Pill,
  Trash2,
  Smartphone,
  BellRing,
  Radio
} from 'lucide-react';
import {
  CaregiverDashboardData,
  CaregiverDashboardMember,
  CaregiverAlert,
  AppLanguage,
  UserProfile,
  MedicineReminder,
  CrossConnectedDevicesResult
} from '../../types';
import { api } from '../../services/api';
import { notificationEngine } from '../../services/notifications';
import { crossDeviceSync } from '../../services/crossDeviceSync';

// Robust phone normalizers for cross-platform deep links
export function normalizePhoneForWhatsApp(phone?: string): string {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  // If standard 10 digits without country code (common in India), prefix 91
  if (clean.length === 10) {
    clean = `91${clean}`;
  }
  return clean;
}

export function normalizePhoneForTel(phone?: string): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) {
    return `+${trimmed.replace(/[^\d]/g, '')}`;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  return digits ? `+${digits}` : '';
}

interface CaregiverHubScreenProps {
  lang: AppLanguage;
  user?: UserProfile;
  myReminders?: MedicineReminder[];
  onTakeDose?: (reminderId: string, time: string) => void;
  onNavigate?: (screen: string) => void;
  onRegisterBackHandler?: (handler: () => boolean) => () => void;
  showToast: (type: 'success' | 'info' | 'error' | 'warning', title: string, message: string) => void;
}

export const CaregiverHubScreen: React.FC<CaregiverHubScreenProps> = ({
  lang,
  user,
  myReminders = [],
  onTakeDose,
  onNavigate,
  onRegisterBackHandler,
  showToast,
}) => {
  const [data, setData] = useState<CaregiverDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'alerts'>('overview');

  // Connect Member state
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [pairingCodeInput, setPairingCodeInput] = useState('');
  const [connecting, setConnecting] = useState(false);

  // Cross-Connected Devices state
  const [crossDevices, setCrossDevices] = useState<CrossConnectedDevicesResult | null>(null);
  const [nudgeSending, setNudgeSending] = useState<string | null>(null);

  // Disconnect / Delete Member state
  const [disconnectMemberTarget, setDisconnectMemberTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  // Track alerts that have already triggered sound/notification to avoid repeating
  const alertedIdsRef = useRef<Set<string>>(new Set());

  const isDualMode = user?.role === 'dual' || user?.role === 'both' || user?.mode === 'dual';

  const fetchDevices = async () => {
    try {
      const devs = await crossDeviceSync.getCrossConnectedDevices();
      setCrossDevices(devs);
    } catch {
      // offline
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await api.getCaregiverDashboard();
      setData(res);

      // Check for any new unconfirmed missed alerts
      if (res.alerts && res.alerts.length > 0) {
        res.alerts.forEach((alert) => {
          if (!alertedIdsRef.current.has(alert.id)) {
            alertedIdsRef.current.add(alert.id);
            // Trigger alert sound, vibration, and persistent notification
            notificationEngine.triggerMissedDoseAlert(
              alert.patientName,
              alert.medicineName,
              alert.dosage,
              alert.scheduledTime
            );
          }
        });
      }
    } catch (e) {
      console.warn('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchDevices();

    // Subscribe to real-time events from cross-connected patient devices
    const unsubscribe = crossDeviceSync.subscribe({
      onDoseLogged: (data) => {
        fetchDashboard();
        fetchDevices();
        showToast('info', 'Patient Dose Update', `${data.medicineName} was marked as ${data.status} by patient.`);
      },
      onRemindersUpdated: () => {
        fetchDashboard();
      },
      onDeviceLinked: (conn) => {
        fetchDashboard();
        fetchDevices();
        showToast('success', 'Device Connected', `Cross-device sync active with ${conn.patientName}.`);
      },
      onDeviceUnlinked: () => {
        fetchDashboard();
        fetchDevices();
        showToast('info', 'Device Unlinked', 'A family member connection was removed.');
      },
      onMissedDoseAlert: () => {
        fetchDashboard();
      },
    });

    const interval = setInterval(() => {
      fetchDashboard();
      fetchDevices();
    }, 15000); // 15s auto-poll fallback

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleSendNudge = async (patientPhone: string, patientName: string) => {
    setNudgeSending(patientPhone);
    try {
      await crossDeviceSync.sendNudge(
        patientPhone,
        `Gentle reminder from ${user?.name || 'Caregiver'}: Please remember to take your scheduled medicines!`,
        undefined,
        patientName
      );
      showToast('success', 'Reminder Ping Dispatched', `Real-time chime sent to ${patientName}'s device.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send ping';
      showToast('error', 'Ping Failed', msg);
    } finally {
      setNudgeSending(null);
    }
  };

  // Multi-step back handler for Caregiver Hub
  useEffect(() => {
    if (!onRegisterBackHandler) return;
    return onRegisterBackHandler(() => {
      if (disconnectMemberTarget) {
        setDisconnectMemberTarget(null);
        return true;
      }
      if (showConnectModal) {
        setShowConnectModal(false);
        return true;
      }
      if (activeTab !== 'overview') {
        setActiveTab('overview');
        return true;
      }
      return false;
    });
  }, [onRegisterBackHandler, disconnectMemberTarget, showConnectModal, activeTab]);

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = pairingCodeInput.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      showToast('error', 'Invalid Code', 'Please enter the 6-digit code shared by your family member.');
      return;
    }

    setConnecting(true);
    try {
      const res = await api.connectCaregiver(cleanCode);
      const connectedName = res.connection?.patientName || res.patientName || 'Family Member';
      showToast(
        'success',
        'Connected Successfully',
        `Linked with ${connectedName}! Monitoring real-time medication safety.`
      );
      setPairingCodeInput('');
      setShowConnectModal(false);
      await fetchDashboard();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      showToast('error', 'Connection Error', msg);
    } finally {
      setConnecting(false);
    }
  };

  const handleConfirmDeleteMember = async () => {
    if (!disconnectMemberTarget) return;
    setIsDeletingMember(true);
    try {
      await api.deleteCaregiverConnection(disconnectMemberTarget.id);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members.filter((m) => m.connectionId !== disconnectMemberTarget.id),
        };
      });
      showToast('info', 'Member Disconnected', `${disconnectMemberTarget.name} has been removed from monitored family members.`);
      setDisconnectMemberTarget(null);
      await fetchDashboard();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not remove connected member';
      showToast('error', 'Removal Failed', msg);
    } finally {
      setIsDeletingMember(false);
    }
  };

  // Call helper with validation
  const handleCallMember = (
    e: React.MouseEvent,
    targetName: string,
    targetPhone?: string
  ) => {
    if (!targetPhone || !targetPhone.trim()) {
      e.preventDefault();
      showToast('error', 'Contact Unavailable', `No phone number configured for ${targetName}.`);
      return;
    }
  };

  // WhatsApp helper with graceful fallback
  const handleSendWhatsAppReminder = (
    patientName: string,
    patientPhone: string,
    medicineName: string,
    dosage: string,
    time: string
  ) => {
    if (!patientPhone || !patientPhone.trim()) {
      showToast('error', 'Contact Unavailable', `No phone number configured for ${patientName}.`);
      return;
    }
    const cleanPhone = normalizePhoneForWhatsApp(patientPhone);
    const message = `Hello ${patientName}, this is a gentle reminder from your caregiver to take your scheduled ${medicineName} (${dosage}) at ${time}.`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    try {
      const win = window.open(url, '_blank');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        navigator.clipboard.writeText(message);
        showToast('info', 'Message Copied', `Reminder message for ${patientName} copied to clipboard.`);
      } else {
        showToast('success', 'Opening WhatsApp', `Sending reminder to ${patientName} (${patientPhone})...`);
      }
    } catch {
      navigator.clipboard.writeText(message);
      showToast('info', 'Message Copied', `Reminder message for ${patientName} copied to clipboard.`);
    }
  };

  // Test missed dose alert (sound, vibration, notification)
  const handleTestMissedAlert = async () => {
    await notificationEngine.triggerMissedDoseAlert(
      'Rahul Kumar',
      'Paracetamol 500 mg',
      '500 mg',
      '8:00 PM'
    );
    showToast('info', 'Missed-Dose Alert Fired', 'Sound, vibration and notification triggered.');
  };

  const members: CaregiverDashboardMember[] = data?.members || [];
  const activeAlerts: CaregiverAlert[] = data?.alerts || [];
  const alertLogs: CaregiverAlert[] = data?.alertLog || [];

  // Compute today's doses for user's own medicines (used in Dual Mode)
  const todayDateStr = new Date().toISOString().split('T')[0];
  interface MyDoseItem {
    reminder: MedicineReminder;
    time: string;
    status: 'Scheduled' | 'Pending' | 'Taken' | 'Missed';
  }

  const myTodayDoses: MyDoseItem[] = [];
  if (isDualMode && myReminders) {
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    myReminders
      .filter((r) => r.active)
      .forEach((rem) => {
        rem.times.forEach((t) => {
          const log = rem.doseLogs.find((l) => l.date === todayDateStr && l.time === t);
          const [h, m] = t.split(':').map(Number);
          const schedMin = h * 60 + m;

          let status: 'Scheduled' | 'Pending' | 'Taken' | 'Missed' = 'Scheduled';
          if (log && log.status === 'taken') {
            status = 'Taken';
          } else if (log && log.status === 'skipped') {
            status = 'Taken';
          } else {
            if (nowMinutes < schedMin) {
              status = 'Scheduled';
            } else if (nowMinutes <= schedMin + 30) {
              status = 'Pending';
            } else {
              status = 'Missed';
            }
          }

          myTodayDoses.push({
            reminder: rem,
            time: t,
            status,
          });
        });
      });
  }

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-24">
      {/* 1. Header Banner */}
      <div className="bg-[#FAF5FF] rounded-2xl p-4 border border-[#E9D5FF] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#6B21A8] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-extrabold text-[#3B0764]">
                {isDualMode ? 'Dual Mode Hub' : 'Caregiver Hub'}
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                members.length > 0
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-purple-100 text-[#6B21A8]'
              }`}>
                {members.length > 0 ? 'Connected' : 'Not Connected'}
              </span>
              {members.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDisconnectMemberTarget({ id: members[0].connectionId, name: members[0].connectedFamilyMember?.name || members[0].patientName })}
                  id="btn-delete-member-top-banner"
                  title={`Delete ${members[0].connectedFamilyMember?.name || members[0].patientName}`}
                  aria-label={`Delete connected member ${members[0].connectedFamilyMember?.name || members[0].patientName}`}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500">
              {isDualMode
                ? 'My Medicines + Family Member Monitoring'
                : members.length > 0
                ? `Monitoring ${members.length} family member(s)`
                : 'No connected member yet. Enter 6-digit code.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowConnectModal(true)}
          id="btn-open-connect-patient-modal"
          className="px-3 py-2 rounded-xl bg-[#6B21A8] hover:bg-[#581C87] active:scale-95 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Link Member</span>
        </button>
      </div>

      {/* 2. Top Tabs */}
      <div className="flex bg-purple-50/70 p-1 rounded-xl border border-purple-100">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-[#6B21A8] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'members'
              ? 'bg-[#6B21A8] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Family ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'alerts'
              ? 'bg-[#6B21A8] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Alerts Log ({alertLogs.length})
        </button>
      </div>

      {/* 3. Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Urgent Missed Dose Alerts */}
          {activeAlerts.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5 px-1">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Urgent Missed-Dose Alerts</span>
              </span>

              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-rose-50/90 border border-rose-200 rounded-2xl p-4 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-rose-950">{alert.patientName}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 uppercase tracking-wider">
                          Missed
                        </span>
                      </div>
                      <p className="text-xs font-bold text-rose-700 mt-1">
                        {alert.medicineName} • {alert.scheduledTime}
                      </p>
                      <p className="text-[11px] text-rose-600 mt-0.5">
                        Overdue by &gt;30 minutes
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-rose-200/60 mt-3">
                    <a
                      href={alert.patientPhone ? `tel:${normalizePhoneForTel(alert.patientPhone)}` : '#'}
                      onClick={(e) => handleCallMember(e, alert.patientName, alert.patientPhone)}
                      id="btn-call-patient"
                      className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-rose-100 text-rose-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-rose-200 shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call {alert.patientName}</span>
                    </a>
                    <button
                      onClick={() =>
                        handleSendWhatsAppReminder(
                          alert.patientName,
                          alert.patientPhone,
                          alert.medicineName,
                          alert.dosage || '',
                          alert.scheduledTime
                        )
                      }
                      id="btn-whatsapp-patient"
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DUAL MODE: SECTION A - MY MEDICINES */}
          {isDualMode && (
            <div className="bg-white rounded-2xl border border-sky-200 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-[#0F4C81] uppercase tracking-wider">
                      Section A: My Medicines
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">Personal medication tracker</p>
                  </div>
                </div>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('reminders')}
                    className="text-xs font-bold text-[#0EA5E9] hover:underline flex items-center gap-0.5"
                  >
                    <span>Manage</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {myTodayDoses.length > 0 ? (
                  myTodayDoses.slice(0, 4).map((d, dIdx) => (
                    <div
                      key={dIdx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{d.reminder.medicineName}</span>
                        <span className="text-[11px] text-slate-500 block">
                          {d.reminder.dosage} • {d.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            d.status === 'Taken'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.status === 'Missed'
                              ? 'bg-rose-100 text-rose-800'
                              : d.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {d.status}
                        </span>
                        {d.status !== 'Taken' && onTakeDose && (
                          <button
                            onClick={() => onTakeDose(d.reminder.id, d.time)}
                            className="px-2 py-1 rounded-lg bg-[#0EA5E9] text-white text-[10px] font-bold hover:bg-[#0284C7]"
                          >
                            Take
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-1">No personal medicines added for today.</p>
                )}
              </div>
            </div>
          )}

          {/* DUAL MODE OR CAREGIVER MODE: SECTION B / CONNECTED FAMILY MEMBERS */}
          {members.length > 0 ? (
            <div className="space-y-4">
              {isDualMode && (
                <div className="flex items-center gap-2 px-1 pt-1">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-purple-900 uppercase tracking-wider">
                      Section B: Family Member Monitoring
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">Real-time synchronized records</p>
                  </div>
                </div>
              )}

              {members.map((mem) => {
                const familyMember = mem.connectedFamilyMember;
                const patientDisplayName = familyMember?.name || mem.patientName || 'Family Member';
                const patientDisplayPhone = familyMember?.phone || mem.patientPhone || '';
                const patientTelHref = normalizePhoneForTel(patientDisplayPhone);

                return (
                <div
                  key={mem.connectionId}
                  className="bg-white rounded-2xl border border-purple-200/80 p-4 shadow-xs space-y-3"
                >
                  {/* Connected Patient Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Connected Family Member
                      </span>
                      <h3 className="text-base font-extrabold text-[#0F172A]">{patientDisplayName}</h3>
                      <p className="text-xs text-slate-500 font-medium">{patientDisplayPhone}</p>
                      {/* Real-time Cross-Connected Device Badge */}
                      {(() => {
                        const memberInfo = crossDevices?.connectedMembers?.find(
                          (cm) => cm.connectionId === mem.connectionId || cm.patientPhone === mem.patientPhone || cm.patientPhone === patientDisplayPhone
                        );
                        const dev = memberInfo?.devices?.[0];
                        return (
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600 font-semibold">
                            <Smartphone className="w-3 h-3 text-[#6B21A8]" />
                            <span>{dev?.deviceName || 'Connected Device'}</span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  dev?.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                                }`}
                              />
                              <span>{dev?.isOnline ? 'Live Online' : 'Sync Active'}</span>
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Connected</span>
                      </span>
                      <a
                        href={patientTelHref ? `tel:${patientTelHref}` : '#'}
                        onClick={(e) => handleCallMember(e, patientDisplayName, patientDisplayPhone)}
                        title={`Call ${patientDisplayName}`}
                        aria-label={`Call ${patientDisplayName}`}
                        className={`p-1 rounded-md text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors ${!patientDisplayPhone ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          handleSendWhatsAppReminder(
                            patientDisplayName,
                            patientDisplayPhone,
                            'Daily Medications',
                            'scheduled dose',
                            'today'
                          )
                        }
                        title={`WhatsApp ${patientDisplayName}`}
                        aria-label={`WhatsApp ${patientDisplayName}`}
                        className={`p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors ${!patientDisplayPhone ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDisconnectMemberTarget({ id: mem.connectionId, name: patientDisplayName })}
                        id={`btn-delete-member-${mem.connectionId}`}
                        title="Remove / Unlink Family Member"
                        aria-label={`Remove / Unlink ${patientDisplayName}`}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Adherence Mini-Stats */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 text-center">
                    <div>
                      <span className="text-base font-black text-emerald-700">{mem.stats.taken}</span>
                      <span className="block text-[10px] font-bold text-slate-500">Taken</span>
                    </div>
                    <div>
                      <span className="text-base font-black text-[#0EA5E9]">{mem.stats.upcoming}</span>
                      <span className="block text-[10px] font-bold text-slate-500">Pending</span>
                    </div>
                    <div>
                      <span className="text-base font-black text-rose-600">{mem.stats.unconfirmed}</span>
                      <span className="block text-[10px] font-bold text-slate-500">Missed</span>
                    </div>
                  </div>

                  {/* Real Medicine Reminders Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Medicine Reminders
                      </h4>
                      <span className="text-[10px] text-slate-400">Live Sync</span>
                    </div>

                    <div className="space-y-2">
                      {mem.schedule && mem.schedule.length > 0 ? (
                        mem.schedule.map((item, itemIdx) => (
                          <div
                            key={itemIdx}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-extrabold text-sm text-slate-900 block">
                                  {item.medicineName}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {item.dosage} {item.instructions ? `• ${item.instructions}` : ''}
                                </span>
                              </div>

                              <div className="flex flex-col items-end gap-1">
                                {item.doses.map((d, dIdx) => {
                                  const s = (d.status || '').toLowerCase();
                                  const isTaken = s === 'taken';
                                  const isMissed = s === 'missed';
                                  const displayStatus = isTaken ? 'Taken' : isMissed ? 'Missed' : 'Pending';

                                  return (
                                    <div key={dIdx} className="flex items-center gap-1.5">
                                      <span className="text-xs font-bold text-slate-700">{d.time}</span>
                                      <span
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                          isTaken
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : isMissed
                                            ? 'bg-rose-100 text-rose-800'
                                            : 'bg-amber-100 text-amber-800'
                                        }`}
                                      >
                                        Status: {displayStatus}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Direct reminder contact for this specific medicine */}
                            <div className="flex gap-2 pt-1 border-t border-slate-200/60 text-xs">
                              <button
                                onClick={() =>
                                  handleSendWhatsAppReminder(
                                    patientDisplayName,
                                    patientDisplayPhone,
                                    item.medicineName,
                                    item.dosage,
                                    item.doses[0]?.time || 'scheduled time'
                                  )
                                }
                                className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center gap-1 transition-colors"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                                <span>WhatsApp Reminder</span>
                              </button>
                              <a
                                href={patientTelHref ? `tel:${patientTelHref}` : '#'}
                                onClick={(e) => handleCallMember(e, patientDisplayName, patientDisplayPhone)}
                                className="py-1.5 px-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#6B21A8] font-bold flex items-center justify-center gap-1 transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>Call</span>
                              </a>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-400">
                          No medicine reminders currently active for {patientDisplayName}.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connected Member Actions footer with Call, WhatsApp and Remove / Unlink */}
                  <div className="flex items-center justify-between pt-2 border-t border-purple-100/80">
                    <div className="flex items-center gap-2">
                      <a
                        href={patientTelHref ? `tel:${patientTelHref}` : '#'}
                        onClick={(e) => handleCallMember(e, patientDisplayName, patientDisplayPhone)}
                        className="py-1.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#6B21A8] text-xs font-bold flex items-center gap-1.5 transition-colors"
                        title={`Call ${patientDisplayName}`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          handleSendWhatsAppReminder(
                            patientDisplayName,
                            patientDisplayPhone,
                            'Daily Medications',
                            'scheduled dose',
                            'today'
                          )
                        }
                        className="py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        title={`WhatsApp ${patientDisplayName}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendNudge(patientDisplayPhone, patientDisplayName)}
                        disabled={nudgeSending === patientDisplayPhone || !patientDisplayPhone}
                        className="py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        title={`Ping ${patientDisplayName}'s device with a live reminder chime`}
                      >
                        <BellRing className={`w-3.5 h-3.5 text-amber-600 ${nudgeSending === patientDisplayPhone ? 'animate-spin' : ''}`} />
                        <span>{nudgeSending === patientDisplayPhone ? 'Pinging...' : 'Ping Phone'}</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDisconnectMemberTarget({ id: mem.connectionId, name: patientDisplayName })}
                      id={`btn-unlink-member-footer-${mem.connectionId}`}
                      title="Remove / Unlink Family Member"
                      aria-label={`Remove / Unlink ${patientDisplayName}`}
                      className="py-1.5 px-3 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200/80 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          ) : (
            /* Primary Action for Family Caregiver Mode when not yet connected: CONNECT TO FAMILY MEMBER */
            <div className="bg-white rounded-2xl border border-purple-200 p-6 shadow-xs text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#6B21A8] flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-[#3B0764]">
                  Connect to Family Member
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Enter the 6-digit code shared by your family member to monitor their medicine reminders and receive missed-dose safety alerts.
                </p>
              </div>

              <form onSubmit={handleConnectSubmit} className="space-y-3 max-w-xs mx-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 text-left">
                    Enter Family Connection Code
                  </label>
                  <input
                    id="input-inline-caregiver-code"
                    type="text"
                    maxLength={6}
                    value={pairingCodeInput}
                    onChange={(e) => setPairingCodeInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 482731"
                    className="w-full text-center tracking-widest text-2xl font-black py-2.5 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-950 focus:outline-hidden focus:ring-2 focus:ring-[#6B21A8]"
                  />
                </div>

                <button
                  type="submit"
                  id="btn-inline-link-member"
                  disabled={connecting || pairingCodeInput.trim().length !== 6}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#6B21A8] hover:bg-[#581C87] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  {connecting ? 'Linking...' : 'Link Member'}
                </button>
              </form>
            </div>
          )}

          {/* Alert Watchdog & Sound Test Tool */}
          <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#6B21A8]" />
              <div>
                <span className="font-bold text-purple-950 block">Live Missed-Dose Watchdog</span>
                <span className="text-[11px] text-slate-500">Checks every 30s • 30m grace window</span>
              </div>
            </div>
            <button
              onClick={handleTestMissedAlert}
              id="btn-test-missed-alert"
              className="px-2.5 py-1.5 rounded-xl bg-white border border-purple-200 text-[#6B21A8] font-bold text-[11px] hover:bg-purple-100 flex items-center gap-1 shadow-2xs"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Test Alert</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Family Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-3">
          {members.length > 0 ? (
            members.map((mem) => {
              const familyMember = mem.connectedFamilyMember;
              const memName = familyMember?.name || mem.patientName || 'Family Member';
              const memPhone = familyMember?.phone || mem.patientPhone || '';
              const memTel = normalizePhoneForTel(memPhone);

              return (
              <div
                key={mem.connectionId}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-extrabold text-[#0F172A]">{memName}</h4>
                  <p className="text-xs text-slate-500">{memPhone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={memTel ? `tel:${memTel}` : '#'}
                    onClick={(e) => handleCallMember(e, memName, memPhone)}
                    className={`px-3 py-1.5 rounded-xl bg-purple-50 text-[#6B21A8] text-xs font-bold flex items-center gap-1 hover:bg-purple-100 ${!memPhone ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                  <button
                    onClick={() =>
                      handleSendWhatsAppReminder(
                        memName,
                        memPhone,
                        'Daily Medications',
                        'scheduled dose',
                        'today'
                      )
                    }
                    className={`px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-1 hover:bg-emerald-100 ${!memPhone ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisconnectMemberTarget({ id: mem.connectionId, name: memName })}
                    id={`btn-delete-member-tab-${mem.connectionId}`}
                    title={`Delete ${memName}`}
                    aria-label={`Delete connected member ${memName}`}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-xs text-slate-400">
              No connected members yet. Use the Link Member button to connect with family.
            </div>
          )}
        </div>
      )}

      {/* 5. Alerts Log Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {alertLogs.length > 0 ? (
            alertLogs.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-extrabold text-[#0F172A]">{a.patientName}</span>
                  <span className="text-slate-400">
                    {new Date(a.alertGeneratedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-rose-600 font-semibold">
                  Missed {a.medicineName} ({a.scheduledTime})
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Status: {a.confirmedLater ? 'Confirmed Later' : 'Unconfirmed'}
                </p>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <span>All clear! No missed dose alerts logged.</span>
            </div>
          )}
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-[#0F172A]">Connect to Family Member</h3>
              <button
                onClick={() => setShowConnectModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Enter the 6-digit code shared by your family member from their PharmaCare app.
            </p>

            <form onSubmit={handleConnectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter Family Connection Code
                </label>
                <input
                  id="input-caregiver-code"
                  type="text"
                  maxLength={6}
                  value={pairingCodeInput}
                  onChange={(e) => setPairingCodeInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 482731"
                  className="w-full text-center tracking-widest text-xl font-black py-2.5 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-950 focus:outline-hidden focus:ring-2 focus:ring-[#6B21A8]"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-connect-patient-submit"
                  disabled={connecting || pairingCodeInput.trim().length !== 6}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#6B21A8] hover:bg-[#581C87] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  {connecting ? 'Linking...' : 'Link Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disconnect / Delete Member Confirmation Modal */}
      {disconnectMemberTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#0F172A] mb-1">
              Remove this linked family member?
            </h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to disconnect <span className="font-bold text-slate-800">{disconnectMemberTarget.name}</span>? You will no longer monitor their medicine schedule or receive missed-dose safety alerts.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isDeletingMember}
                onClick={() => setDisconnectMemberTarget(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingMember}
                onClick={handleConfirmDeleteMember}
                id="btn-confirm-delete-member"
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                {isDeletingMember ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
