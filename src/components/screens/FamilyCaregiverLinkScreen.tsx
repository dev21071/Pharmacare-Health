import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  QrCode,
  ShieldCheck,
  RefreshCw,
  Share2,
  Copy,
  Lock,
  Clock,
  Check,
  X,
  Trash2,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import QRCode from 'qrcode';
import { CaregiverConnection, CaregiverPermissions, UserProfile, AppLanguage } from '../../types';
import { api } from '../../services/api';
import { crossDeviceSync } from '../../services/crossDeviceSync';

interface FamilyCaregiverLinkScreenProps {
  user: UserProfile;
  lang: AppLanguage;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  onRegisterBackHandler?: (handler: () => boolean) => () => void;
  showToast: (type: 'success' | 'info' | 'error' | 'warning', title: string, message: string) => void;
}

export const FamilyCaregiverLinkScreen: React.FC<FamilyCaregiverLinkScreenProps> = ({
  user,
  lang,
  onUpdateProfile,
  onRegisterBackHandler,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'connect' | 'caregivers' | 'rules'>('connect');
  const [code, setCode] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [remainingSecs, setRemainingSecs] = useState<number>(0);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loadingCode, setLoadingCode] = useState(false);

  // Caregivers
  const [connections, setConnections] = useState<CaregiverConnection[]>([]);
  const [editingPermissionsConn, setEditingPermissionsConn] = useState<CaregiverConnection | null>(null);
  const [permissionsState, setPermissionsState] = useState<CaregiverPermissions>({
    reminderStatus: true,
    unconfirmedAlerts: true,
    medicineName: true,
    scheduledTime: true,
    reminderHistory: true,
  });
  const [disconnectConfirmId, setDisconnectConfirmId] = useState<string | null>(null);

  // Grace period rule
  const [gracePeriod, setGracePeriod] = useState<15 | 30 | 60>(
    (user.reminderGracePeriodMinutes as 15 | 30 | 60) || 30
  );

  // Load active code without automatically generating a new one
  const loadCode = async () => {
    setLoadingCode(true);
    try {
      const active = await api.getActiveCaregiverCode();
      if (active && active.expiresAt > Date.now()) {
        setCode(active.code);
        setExpiresAt(active.expiresAt);
        generateQr(active.code, user.name || 'Patient');
      } else {
        setCode('');
        setExpiresAt(0);
        setQrDataUrl('');
      }
    } catch {
      setCode('');
      setExpiresAt(0);
      setQrDataUrl('');
    } finally {
      setLoadingCode(false);
    }
  };

  const generateQr = async (pairingCode: string, patientName: string) => {
    try {
      const payload = JSON.stringify({
        action: 'pharmacare_caregiver_connect',
        code: pairingCode,
        patientName,
      });
      const dataUrl = await QRCode.toDataURL(payload, {
        color: {
          dark: '#6B21A8',
          light: '#FFFFFF',
        },
        margin: 2,
        width: 200,
      });
      setQrDataUrl(dataUrl);
    } catch (e) {
      console.error('QR generation error:', e);
    }
  };

  const loadConnections = async () => {
    try {
      const list = await api.getCaregiverConnections();
      const userPhoneClean = (user.mobile || '').replace(/\D/g, '');
      setConnections(
        list.filter(
          (c) =>
            (c.patientUserId && user.id && c.patientUserId === user.id) ||
            c.patientPhone === user.mobile ||
            (userPhoneClean && (c.patientPhone || '').replace(/\D/g, '').endsWith(userPhoneClean.slice(-10)))
        )
      );
    } catch (e) {
      console.warn('Failed to load connections:', e);
    }
  };

  useEffect(() => {
    loadCode();
    loadConnections();

    // Real-time synchronization when a caregiver connects or disconnects
    const unsubscribe = crossDeviceSync.subscribe({
      onDeviceLinked: (conn) => {
        loadConnections();
        setCode('');
        setExpiresAt(0);
        setQrDataUrl('');
        showToast(
          'success',
          'Caregiver Connected',
          `${conn.caregiverName || 'Family caregiver'} is now securely linked with your device.`
        );
      },
      onDeviceUnlinked: () => {
        loadConnections();
        showToast('info', 'Caregiver Unlinked', 'A family caregiver connection was removed.');
      },
    });

    const pollInterval = setInterval(() => {
      loadConnections();
    }, 12000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  // Multi-step back handler for Family Care Hub
  useEffect(() => {
    if (!onRegisterBackHandler) return;
    return onRegisterBackHandler(() => {
      if (disconnectConfirmId) {
        setDisconnectConfirmId(null);
        return true;
      }
      if (editingPermissionsConn) {
        setEditingPermissionsConn(null);
        return true;
      }
      if (code) {
        setCode('');
        setExpiresAt(0);
        setQrDataUrl('');
        return true;
      }
      if (activeTab !== 'connect') {
        setActiveTab('connect');
        return true;
      }
      return false;
    });
  }, [onRegisterBackHandler, disconnectConfirmId, editingPermissionsConn, code, activeTab]);

  // Countdown timer for code expiry
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setRemainingSecs(diff);
      if (diff === 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleGenerateCode = async () => {
    // Caregiver-only mode restriction
    if (user.role === 'caregiver' || user.mode === 'family_caregiver') {
      if (user.mode !== 'dual' && user.role !== 'dual') {
        showToast(
          'error',
          'Caregiver Mode Active',
          'Generating connection codes is restricted in Caregiver-only mode. Switch to Personal or Dual mode to invite caregivers.'
        );
        return;
      }
    }

    setLoadingCode(true);
    try {
      const gen = await api.generateConnectionCode();
      if (!gen || !gen.code) {
        throw new Error('Server returned an empty or invalid pairing code.');
      }
      setCode(gen.code);
      setExpiresAt(gen.expiresAt);
      setRemainingSecs(gen.secondsRemaining || 900);
      generateQr(gen.code, user.name || gen.patientName || 'Patient');
      showToast('success', 'Connection Code Generated', `Secure 6-digit code: ${gen.code}. Valid for 15 minutes.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate code';
      showToast('error', 'Code Generation Failed', msg);
    } finally {
      setLoadingCode(false);
    }
  };

  const handleRefreshCode = handleGenerateCode;

  const handleCopyCode = async () => {
    if (!code) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showToast('info', 'Code Copied', `Pairing code ${code} copied to clipboard.`);
    } catch {
      showToast('error', 'Copy Failed', `Pairing code: ${code}`);
    }
  };

  const handleShareCode = () => {
    const text = `Connect with me on PharmaCare! Enter my 6-digit family pairing code: ${code} in your Caregiver Hub to receive my medication safety alerts.`;
    if (navigator.share) {
      navigator.share({ title: 'PharmaCare Caregiver Code', text }).catch(() => {});
    } else {
      handleCopyCode();
    }
  };

  const handleSavePermissions = async () => {
    if (!editingPermissionsConn) return;
    try {
      const updated = await api.updateCaregiverPermissions(
        editingPermissionsConn.id,
        permissionsState
      );
      setConnections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingPermissionsConn(null);
      showToast('success', 'Permissions Updated', 'Privacy access rules saved.');
    } catch {
      showToast('error', 'Update Failed', 'Could not update permissions.');
    }
  };

  const handleConfirmConnection = async (connId: string) => {
    try {
      const confirmed = await api.confirmCaregiverConnection(connId);
      setConnections((prev) => prev.map((c) => (c.id === confirmed.id ? confirmed : c)));
      showToast('success', 'Caregiver Linked', 'Family caregiver is now active.');
    } catch {
      showToast('error', 'Confirm Failed', 'Failed to link caregiver.');
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectConfirmId) return;
    try {
      await api.deleteCaregiverConnection(disconnectConfirmId);
      setConnections((prev) => prev.filter((c) => c.id !== disconnectConfirmId));
      setDisconnectConfirmId(null);
      showToast('info', 'Caregiver Disconnected', 'Connection revoked.');
    } catch {
      showToast('error', 'Disconnect Failed', 'Could not revoke connection.');
    }
  };

  const handleSaveGracePeriod = () => {
    onUpdateProfile({ reminderGracePeriodMinutes: gracePeriod });
    showToast('success', 'Rules Saved', `Missed-dose grace threshold updated to ${gracePeriod} minutes.`);
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-24">
      {/* 1. Purple Header Banner */}
      <div className="bg-[#FAF5FF] rounded-2xl p-4 border border-[#E9D5FF] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#6B21A8] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-extrabold text-[#3B0764]">Family Caregiver Link</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                connections.length > 0
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-purple-100 text-[#6B21A8]'
              }`}>
                {connections.length > 0 ? 'Connected' : 'Not Connected'}
              </span>
              {connections.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDisconnectConfirmId(connections[0].id)}
                  title="Disconnect Family Member"
                  aria-label="Disconnect Family Member"
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500">
              {connections.length > 0
                ? `${connections.length} caregiver(s) linked with your account`
                : 'Share real-time medication safety with trusted family'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Top Tabs */}
      <div className="flex bg-purple-50/70 p-1 rounded-xl border border-purple-100">
        <button
          onClick={() => setActiveTab('connect')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'connect'
              ? 'bg-[#6B21A8] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Connect
        </button>
        <button
          onClick={() => setActiveTab('caregivers')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'caregivers'
              ? 'bg-[#6B21A8] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Caregivers ({connections.length})
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'rules'
              ? 'bg-[#6B21A8] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Alert Rules
        </button>
      </div>

      {/* 3. Connect Tab */}
      {activeTab === 'connect' && (
        <div className="space-y-4">
          {code ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Your 6-Digit Pairing Code
              </span>

              {/* Code Box */}
              <div className="my-3 py-3 px-4 rounded-2xl bg-purple-50/70 border border-purple-200 inline-flex items-center gap-2 sm:gap-3">
                {code.split('').map((char, idx) => (
                  <span
                    key={idx}
                    className="w-9 h-11 rounded-xl bg-white border border-purple-300 text-purple-950 text-xl font-black flex items-center justify-center shadow-xs"
                  >
                    {char}
                  </span>
                ))}
              </div>

              {/* Expiry countdown */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-semibold mb-4">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>
                  {remainingSecs > 0
                    ? `Valid for ${Math.floor(remainingSecs / 60)}m ${remainingSecs % 60}s`
                    : 'Code expired'}
                </span>
                <button
                  onClick={handleRefreshCode}
                  id="btn-refresh-caregiver-code"
                  disabled={loadingCode}
                  className="ml-2 text-[#6B21A8] hover:underline flex items-center gap-1 font-bold"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingCode ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>
              </div>

              {/* QR Code */}
              {qrDataUrl && (
                <div className="p-3 bg-white border border-purple-100 rounded-2xl inline-block shadow-xs mb-3">
                  <img src={qrDataUrl} alt="Pairing QR Code" className="w-44 h-44 mx-auto" />
                  <p className="text-[11px] font-medium text-slate-500 mt-2">
                    Scan with family member's phone camera
                  </p>
                </div>
              )}

              {/* Copy & Share Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  id="btn-copy-connection-code"
                  className="flex-1 py-3 px-4 rounded-xl bg-purple-100 hover:bg-purple-200 active:scale-[0.99] text-[#6B21A8] font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Code</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareCode}
                  id="btn-share-caregiver-code"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#6B21A8] hover:bg-[#581C87] active:scale-[0.99] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Invitation</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-purple-200/80 p-6 shadow-xs text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#6B21A8] flex items-center justify-center mx-auto shadow-2xs">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide inline-block mb-1.5">
                  Initial Status: Not Connected
                </span>
                <h3 className="text-base font-extrabold text-[#3B0764]">
                  Family Connection Code
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  No connection code has been generated yet. Tap below to generate a secure 6-digit code for your family caregiver.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateCode}
                id="btn-generate-caregiver-code"
                disabled={loadingCode}
                className="w-full py-3 px-4 rounded-xl bg-[#6B21A8] hover:bg-[#581C87] active:scale-[0.99] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingCode ? 'animate-spin' : ''}`} />
                <span>{loadingCode ? 'Generating Code...' : 'Generate 6-Digit Connection Code'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. Caregivers List Tab */}
      {activeTab === 'caregivers' && (
        <div className="space-y-3">
          {connections.map((conn) => {
            const isActive = conn.status === 'active';

            return (
              <div
                key={conn.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-[#0F172A]">{conn.caregiverName}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                            : 'bg-amber-50 text-amber-800 border border-amber-100'
                        }`}
                      >
                        {isActive ? 'Active Caregiver' : 'Pending Confirmation'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{conn.caregiverPhone}</p>
                  </div>

                  <button
                    onClick={() => setDisconnectConfirmId(conn.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Disconnect"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Permissions summary */}
                <div className="my-2.5 p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 text-xs text-slate-700 flex flex-wrap gap-1.5">
                  {conn.permissions.reminderStatus && (
                    <span className="px-2 py-0.5 rounded-md bg-white border border-purple-200 text-[10px] font-bold text-purple-900">
                      Schedules
                    </span>
                  )}
                  {conn.permissions.unconfirmedAlerts && (
                    <span className="px-2 py-0.5 rounded-md bg-white border border-purple-200 text-[10px] font-bold text-purple-900">
                      Missed Alerts
                    </span>
                  )}
                  {conn.permissions.medicineName && (
                    <span className="px-2 py-0.5 rounded-md bg-white border border-purple-200 text-[10px] font-bold text-purple-900">
                      Medicine Names
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setEditingPermissionsConn(conn);
                      setPermissionsState(conn.permissions);
                    }}
                    id={`btn-caregiver-perms-${conn.id}`}
                    className="text-xs font-bold text-[#6B21A8] hover:underline flex items-center gap-1"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Manage Permissions</span>
                  </button>

                  {!isActive && (
                    <button
                      onClick={() => handleConfirmConnection(conn.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                    >
                      Confirm Link
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {connections.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">No Caregivers Linked</h4>
              <p className="text-xs text-slate-400 mt-1">
                Share your pairing code to link family members who can monitor your medication safety.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 5. Alert Rules Tab */}
      {activeTab === 'rules' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-[#0F172A]">Missed-Dose Grace Period</h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Define how long after a scheduled dose time before caregivers receive an alert if the dose
              remains unconfirmed.
            </p>
          </div>

          <div className="space-y-2.5">
            {([
              { val: 15 as const, label: '15 Minutes', sub: 'Best for critical medications (e.g. cardiac, insulin)' },
              { val: 30 as const, label: '30 Minutes (Recommended)', sub: 'Balanced buffer for daily lifestyle' },
              { val: 60 as const, label: '60 Minutes', sub: 'Extended buffer for flexible vitamins and supplements' },
            ]).map((opt) => (
              <label
                key={opt.val}
                onClick={() => setGracePeriod(opt.val)}
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  gracePeriod === opt.val
                    ? 'border-[#6B21A8] bg-purple-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="grace"
                  checked={gracePeriod === opt.val}
                  onChange={() => setGracePeriod(opt.val)}
                  className="accent-[#6B21A8]"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">{opt.label}</div>
                  <div className="text-[11px] text-slate-500">{opt.sub}</div>
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={handleSaveGracePeriod}
            className="w-full py-2.5 px-4 rounded-xl bg-[#6B21A8] text-white text-xs font-bold shadow-xs hover:bg-[#581C87]"
          >
            Save Grace Period Setting
          </button>
        </div>
      )}

      {/* Permissions Modal */}
      {editingPermissionsConn && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-[#0F172A]">
                Caregiver Privacy Permissions
              </h3>
              <button
                onClick={() => setEditingPermissionsConn(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Select what {editingPermissionsConn.caregiverName} is allowed to see:
            </p>

            <div className="space-y-3 mb-5">
              {[
                {
                  key: 'reminderStatus' as keyof CaregiverPermissions,
                  label: "Today's Schedule & Status",
                  desc: 'Allow viewing dose schedule for today',
                },
                {
                  key: 'unconfirmedAlerts' as keyof CaregiverPermissions,
                  label: 'Missed-Dose Alerts',
                  desc: 'Notify caregiver when a dose is missed',
                },
                {
                  key: 'medicineName' as keyof CaregiverPermissions,
                  label: 'Specific Medicine Names',
                  desc: 'Hide to show "Scheduled Medication" instead',
                },
                {
                  key: 'scheduledTime' as keyof CaregiverPermissions,
                  label: 'Exact Dose Times',
                  desc: 'Show scheduled hour and minute',
                },
                {
                  key: 'reminderHistory' as keyof CaregiverPermissions,
                  label: 'Adherence History',
                  desc: 'View weekly taken/missed logs',
                },
              ].map((perm) => (
                <label key={perm.key} className="flex items-start justify-between gap-3 text-xs cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-800 block">{perm.label}</span>
                    <span className="text-[11px] text-slate-400">{perm.desc}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissionsState[perm.key]}
                    onChange={(e) =>
                      setPermissionsState({ ...permissionsState, [perm.key]: e.target.checked })
                    }
                    className="w-4 h-4 rounded-md accent-[#6B21A8] mt-1"
                  />
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingPermissionsConn(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                className="flex-1 py-2 px-3 rounded-xl bg-[#6B21A8] text-white text-xs font-bold hover:bg-[#581C87]"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect confirm */}
      {disconnectConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h4 className="text-sm font-extrabold text-[#0F172A]">Disconnect Caregiver?</h4>
            </div>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              This family member will no longer receive alerts or be able to view your medication status.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDisconnectConfirmId(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
