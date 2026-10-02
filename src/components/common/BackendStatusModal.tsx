import React, { useState, useEffect } from 'react';
import {
  Server,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Globe,
  Smartphone,
  Save,
  Activity,
  Layers,
  ExternalLink,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { storage } from '../../services/storage';
import { api } from '../../services/api';
import { isNativePlatform, isVercelDeployment, DEFAULT_PRODUCTION_BACKEND_URL } from '../../config/api';

interface BackendStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (type: 'success' | 'info' | 'error' | 'warning', title: string, message: string) => void;
  onBackendUrlChanged?: () => void;
}

export const BackendStatusModal: React.FC<BackendStatusModalProps> = ({
  isOpen,
  onClose,
  showToast,
  onBackendUrlChanged,
}) => {
  const [customUrl, setCustomUrl] = useState('');
  const [activeUrl, setActiveUrl] = useState('');
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<'online' | 'offline' | 'error' | 'idle'>('idle');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [details, setDetails] = useState<{
    database?: string;
    version?: string;
    remindersCount?: number;
    activeCaregiverConnections?: number;
    errorMsg?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = api.getBaseUrl();
      setActiveUrl(current || (typeof window !== 'undefined' ? window.location.origin : ''));
      setCustomUrl(storage.getApiBaseUrl() || '');
      runHealthCheck(current);
    }
  }, [isOpen]);

  const runHealthCheck = async (urlToCheck?: string) => {
    setChecking(true);
    setStatus('idle');
    setLatencyMs(null);
    setDetails(null);

    const startTime = performance.now();
    try {
      const healthData = await api.health();
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      if (healthData && healthData.status === 'ok') {
        setStatus('online');
        setLatencyMs(duration);
        // Also fetch detailed backend status
        const sysStatus = await api.getBackendStatus();
        setDetails({
          database: sysStatus.database || 'File-Backed JSON Repository',
          version: sysStatus.version || '1.0.0',
          remindersCount: sysStatus.remindersCount,
          activeCaregiverConnections: sysStatus.activeCaregiverConnections,
        });
      } else {
        setStatus('offline');
        setLatencyMs(duration);
        setDetails({
          errorMsg: 'Server returned offline status or unexpected response.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setStatus('error');
      setDetails({
        errorMsg: msg,
      });
    } finally {
      setChecking(false);
    }
  };

  const handleSaveCustomUrl = async (urlToSave: string) => {
    const trimmed = urlToSave.trim().replace(/\/+$/, '');
    storage.setApiBaseUrl(trimmed);
    const resolved = api.getBaseUrl();
    setActiveUrl(resolved || (typeof window !== 'undefined' ? window.location.origin : ''));
    showToast('info', 'Backend URL Updated', trimmed ? `Routing API to: ${trimmed}` : 'Reset to automatic default base URL.');
    if (onBackendUrlChanged) {
      onBackendUrlChanged();
    }
    await runHealthCheck(resolved);
  };

  const handleResetDefault = async () => {
    storage.setApiBaseUrl('');
    setCustomUrl('');
    const resolved = api.getBaseUrl();
    setActiveUrl(resolved || (typeof window !== 'undefined' ? window.location.origin : ''));
    showToast('success', 'Reset to Default', 'Using default production backend URL.');
    if (onBackendUrlChanged) {
      onBackendUrlChanged();
    }
    await runHealthCheck(resolved);
  };

  if (!isOpen) return null;

  const isNative = isNativePlatform();
  const isVercel = isVercelDeployment();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F4C81] to-[#0284C7] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                Backend Server & API Status
              </h3>
              <p className="text-xs text-sky-100">Live source-of-truth connectivity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-slate-800 text-xs sm:text-sm">
          {/* Active Status Card */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Server Health:</span>
                {checking ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking...
                  </span>
                ) : status === 'online' ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Online ({latencyMs}ms)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Offline / Error
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-mono break-all">
                {activeUrl || '(Relative same-origin /api)'}
              </p>
            </div>

            <button
              onClick={() => runHealthCheck()}
              disabled={checking}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              Ping
            </button>
          </div>

          {/* Diagnostic Warnings */}
          {details?.errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                Connection Failure
              </div>
              <p className="text-[11px] leading-relaxed text-rose-700">
                {details.errorMsg}
              </p>
            </div>
          )}

          {/* Environment Detection Badge */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                {isNative ? <Smartphone className="w-3.5 h-3.5 text-[#0F4C81]" /> : <Globe className="w-3.5 h-3.5 text-[#0F4C81]" />}
                Platform
              </div>
              <div className="font-bold text-slate-800 mt-0.5">
                {isNative ? 'Android APK (Native)' : isVercel ? 'Vercel Web App' : 'Web Browser'}
              </div>
            </div>

            <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Layers className="w-3.5 h-3.5 text-[#0F4C81]" />
                Data Source
              </div>
              <div className="font-bold text-slate-800 mt-0.5">
                {status === 'online' ? 'Express + Repository' : 'Local SQLite Cache'}
              </div>
            </div>
          </div>

          {/* URL Configuration Form */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700">
              Custom Backend API Base URL
            </label>
            <p className="text-[11px] text-slate-500">
              Change the target backend if you have a private server, Cloud Run, Render, or LAN address:
            </p>

            <div className="flex gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://your-backend.example.com"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-[#0F4C81]/30 focus:border-[#0F4C81]"
              />
              <button
                type="button"
                onClick={() => handleSaveCustomUrl(customUrl)}
                className="px-3 py-2 bg-[#0F4C81] hover:bg-[#0c3c66] text-white rounded-xl font-bold text-xs flex items-center gap-1 shrink-0 shadow-xs active:scale-95 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                Apply
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setCustomUrl(DEFAULT_PRODUCTION_BACKEND_URL);
                  handleSaveCustomUrl(DEFAULT_PRODUCTION_BACKEND_URL);
                }}
                className="text-[10px] font-semibold px-2 py-1 bg-sky-50 text-[#0F4C81] border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
              >
                Set Production Cloud Run
              </button>
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-[10px] font-semibold px-2 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Reset Auto
              </button>
            </div>
          </div>

          {/* Connected Details */}
          {status === 'online' && details && (
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs">
              <div className="font-bold text-slate-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Backend Node Server Verified
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                <div>Reminders: <strong>{details.remindersCount ?? 0}</strong></div>
                <div>Connections: <strong>{details.activeCaregiverConnections ?? 0}</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
