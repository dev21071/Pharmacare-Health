import React, { useState, useEffect } from 'react';
import {
  FileText,
  UploadCloud,
  Plus,
  Eye,
  Trash2,
  X,
  FileCheck,
  Download,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Prescription, AppLanguage, UserProfile } from '../../types';
import { SAMPLE_PRESCRIPTION_BASE64 } from '../../data/seedData';
import { getTranslation } from '../../i18n/translations';

interface PrescriptionsScreenProps {
  prescriptions: Prescription[];
  lang: AppLanguage;
  user?: UserProfile;
  onNavigate?: (screen: string) => void;
  onUploadPrescription: (payload: {
    patientName: string;
    doctorName: string;
    clinicName?: string;
    fileDataUrl: string;
    fileName: string;
    fileType: 'image' | 'pdf';
    fileSize: string;
    notes: string;
  }) => Promise<void>;
  onDeletePrescription: (id: string) => Promise<void>;
  userName?: string;
  onRegisterBackHandler?: (handler: () => boolean) => () => void;
  showToast: (type: 'success' | 'info' | 'error' | 'warning', title: string, message: string) => void;
}

export const PrescriptionsScreen: React.FC<PrescriptionsScreenProps> = ({
  prescriptions,
  lang,
  user,
  onNavigate,
  onUploadPrescription,
  onDeletePrescription,
  userName = 'Patient',
  onRegisterBackHandler,
  showToast,
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [viewingRx, setViewingRx] = useState<Prescription | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isPremiumUser = user?.plan === 'premium' && user?.subscriptionStatus === 'active';

  const handleOpenUpload = () => {
    if (!isPremiumUser && prescriptions.length >= 3) {
      setShowLimitModal(true);
      return;
    }
    setShowUploadModal(true);
  };

  // Multi-step back handler: close upload modal, prescription viewer, or delete dialog
  useEffect(() => {
    if (!onRegisterBackHandler) return;
    return onRegisterBackHandler(() => {
      if (showLimitModal) {
        setShowLimitModal(false);
        return true;
      }
      if (deleteConfirmId) {
        setDeleteConfirmId(null);
        return true;
      }
      if (viewingRx) {
        setViewingRx(null);
        return true;
      }
      if (showUploadModal) {
        setShowUploadModal(false);
        return true;
      }
      return false;
    });
  }, [onRegisterBackHandler, deleteConfirmId, viewingRx, showUploadModal]);

  // Form
  const [patientName, setPatientName] = useState(userName);
  const [doctorName, setDoctorName] = useState('Dr. Amit Patel');
  const [clinicName, setClinicName] = useState('Apollo Clinic');
  const [notes, setNotes] = useState('5-day course. Review after 1 week.');
  const [fileDataUrl, setFileDataUrl] = useState<string>(SAMPLE_PRESCRIPTION_BASE64);
  const [fileName, setFileName] = useState('Prescription_Amit_Patel.png');
  const [fileType, setFileType] = useState<'image' | 'pdf'>('image');
  const [fileSize, setFileSize] = useState('420 KB');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('error', 'File Too Large', 'Maximum allowed document size is 15 MB.');
      return;
    }

    const isPdf = file.type === 'application/pdf';
    setFileType(isPdf ? 'pdf' : 'image');
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(0)} KB`);

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      if (loadEvt.target?.result) {
        setFileDataUrl(loadEvt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUseDemo = () => {
    setFileDataUrl(SAMPLE_PRESCRIPTION_BASE64);
    setFileName('Apollo_Clinic_Rx_Sample.png');
    setFileType('image');
    setFileSize('350 KB');
    setDoctorName('Dr. Amit Patel');
    setClinicName('Apollo Clinic, Ahmedabad');
    setNotes('Amoxicillin 500mg (1 tid) + Paracetamol (1 prn)');
    showToast('info', 'Demo Rx Loaded', 'Sample medical prescription populated.');
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim() || !patientName.trim()) {
      showToast('error', 'Missing Information', 'Doctor name and Patient name are required.');
      return;
    }

    setLoading(true);
    try {
      await onUploadPrescription({
        patientName: patientName.trim(),
        doctorName: doctorName.trim(),
        clinicName: clinicName.trim(),
        fileDataUrl,
        fileName,
        fileType,
        fileSize,
        notes: notes.trim(),
      });
      showToast('success', 'Prescription Stored', 'Document securely saved to your digital vault.');
      setShowUploadModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      showToast('error', 'Upload Error', msg);
      if (
        msg.includes('limit reached') ||
        msg.includes('PLAN_LIMIT_REACHED') ||
        msg.includes('Upgrade to Premium')
      ) {
        setShowLimitModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-24">
      {/* 1. Header with Upload Rx button */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-[#0F4C81]">Prescription Vault</h2>
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-xs font-medium text-slate-500">
            Encrypted personal health record repository
          </p>
        </div>

        <button
          onClick={handleOpenUpload}
          id="btn-open-upload-modal"
          className="px-3.5 py-2 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-95 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Rx</span>
        </button>
      </div>

      {/* Plan Usage & Limit Badge for Free Users */}
      {!isPremiumUser && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 flex items-center justify-between text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-800">Free Vault: </span>
              <span className="text-slate-600">
                {prescriptions.length} of 3 prescriptions stored
              </span>
            </div>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('subscription')}
              className="text-[#0F4C81] hover:underline font-bold text-xs shrink-0 flex items-center gap-0.5"
            >
              <span>Upgrade</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* 2. List of Saved Prescriptions */}
      <div className="space-y-3">
        {prescriptions.map((rx) => (
          <div
            key={rx.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-sky-300 transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {rx.fileDataUrl.startsWith('data:image') ? (
                    <img
                      src={rx.fileDataUrl}
                      alt={rx.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText className="w-6 h-6 text-[#0EA5E9]" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0F172A]">{rx.doctorName}</h3>
                  <p className="text-xs font-semibold text-slate-500">
                    {rx.clinicName || 'Medical Center'} • {rx.date}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Patient: {rx.patientName} • {rx.fileSize}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1 shrink-0">
                <FileCheck className="w-3 h-3" />
                <span>Verified</span>
              </span>
            </div>

            {rx.notes && (
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                "{rx.notes}"
              </p>
            )}

            {/* Bottom buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => setViewingRx(rx)}
                id={`btn-view-rx-${rx.id}`}
                className="text-xs font-bold text-[#0EA5E9] hover:underline flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Document</span>
              </button>

              <button
                onClick={() => setDeleteConfirmId(rx.id)}
                id={`btn-delete-rx-${rx.id}`}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                aria-label="Delete prescription"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {prescriptions.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
            <UploadCloud className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No prescriptions stored yet</h4>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Capture or upload prescription slips for instant reference, doctor review, and chemist orders.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 rounded-xl bg-[#0EA5E9] text-white text-xs font-bold"
            >
              Upload First Prescription
            </button>
          </div>
        )}
      </div>

      {/* 3. Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <h3 className="text-base font-extrabold text-[#0F172A]">Upload New Prescription</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4 overflow-y-auto">
              {/* File upload zone */}
              <div className="border-2 border-dashed border-sky-200 hover:border-sky-400 rounded-2xl p-4 text-center bg-sky-50/40 transition-colors">
                <UploadCloud className="w-8 h-8 text-[#0EA5E9] mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700 mb-1">
                  Upload Prescription Slip (JPG, PNG, PDF)
                </p>
                <p className="text-[11px] text-slate-400 mb-3">Up to 15 MB file size</p>

                <div className="flex justify-center gap-2">
                  <label
                    id="btn-choose-file"
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-xs cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <span>Choose File</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleUseDemo}
                    id="btn-demo-rx"
                    className="px-3 py-1.5 rounded-xl bg-[#E0F2FE] hover:bg-sky-200 text-[#0F4C81] text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Use Demo Rx</span>
                  </button>
                </div>

                {fileName && (
                  <div className="mt-3 p-2 bg-white rounded-xl border border-sky-100 flex items-center justify-between text-xs font-medium text-slate-700">
                    <span className="truncate">{fileName}</span>
                    <span className="text-slate-400 shrink-0">{fileSize}</span>
                  </div>
                )}
              </div>

              {/* Patient Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Patient Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800"
                  required
                />
              </div>

              {/* Doctor Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Doctor Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800"
                  required
                />
              </div>

              {/* Clinic Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hospital / Clinic Name
                </label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instructions / Doctor Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-upload-prescription-submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-[0.99] disabled:opacity-60 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving to Secure Vault...</span>
                    </>
                  ) : (
                    <span>Save to Vault</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Viewer Modal */}
      {viewingRx && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="text-sm font-extrabold text-[#0F172A]">{viewingRx.doctorName}</h3>
                <p className="text-xs text-slate-500">
                  {viewingRx.clinicName} • {viewingRx.date}
                </p>
              </div>
              <button
                onClick={() => setViewingRx(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3">
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center min-h-[220px]">
                {viewingRx.fileDataUrl.startsWith('data:image') ? (
                  <img
                    src={viewingRx.fileDataUrl}
                    alt={viewingRx.fileName}
                    className="max-h-[360px] w-auto object-contain mx-auto"
                  />
                ) : (
                  <div className="text-center p-8">
                    <FileText className="w-16 h-16 text-[#0EA5E9] mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">{viewingRx.fileName}</p>
                    <p className="text-[11px] text-slate-400">PDF Document ({viewingRx.fileSize})</p>
                  </div>
                )}
              </div>

              {viewingRx.notes && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-100">
                  <strong>Notes:</strong> {viewingRx.notes}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex justify-between gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Prescription from ${viewingRx.doctorName} (${viewingRx.clinicName}) for ${viewingRx.patientName}. Notes: ${viewingRx.notes}`
                  );
                  showToast('success', 'Details Copied', 'Prescription info copied to clipboard.');
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Copy Details</span>
              </button>

              <button
                onClick={() => {
                  setDeleteConfirmId(viewingRx.id);
                  setViewingRx(null);
                }}
                className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h4 className="text-sm font-extrabold text-[#0F172A]">Delete Prescription?</h4>
            </div>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to delete this prescription from your vault? This document cannot
              be restored.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDeletePrescription(deleteConfirmId);
                  setDeleteConfirmId(null);
                  showToast('info', 'Document Removed', 'Prescription deleted from vault.');
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Free Plan Limit Modal for Prescriptions */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-slate-200 shadow-xl space-y-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto shadow-2xs">
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-900">
                Free Plan Limit Reached
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Free plan limit reached. Upgrade to Premium for unlimited prescriptions.
              </p>
              <div className="mt-3 py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex justify-between">
                <span>Stored Prescriptions:</span>
                <span className="font-bold text-slate-900">{prescriptions.length} / 3 (Free Max)</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                id="btn-limit-modal-upgrade-rx"
                onClick={() => {
                  setShowLimitModal(false);
                  if (onNavigate) onNavigate('subscription');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0F4C81] hover:bg-[#0c3c66] text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Upgrade to Premium</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLimitModal(false)}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
