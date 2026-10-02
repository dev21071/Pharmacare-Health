import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  CheckCircle2,
  Clock,
  Volume2,
  Trash2,
  Edit2,
  Power,
  X,
  Calendar,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MedicineReminder, AppLanguage, UserProfile } from '../../types';
import { getTranslation } from '../../i18n/translations';
import { notificationEngine } from '../../services/notifications';

interface RemindersScreenProps {
  reminders: MedicineReminder[];
  lang: AppLanguage;
  user?: UserProfile;
  onNavigate?: (screen: string) => void;
  onSaveReminder: (reminder: Partial<MedicineReminder>) => void;
  onDeleteReminder: (id: string) => void;
  onLogDose: (reminderId: string, time: string, status: 'taken' | 'skipped' | 'snoozed') => void;
  initialAddData?: { name: string; generic: string; dosage: string } | null;
  onClearInitialAddData?: () => void;
  onRegisterBackHandler?: (handler: () => boolean) => () => void;
  showToast: (type: 'success' | 'info' | 'error' | 'warning', title: string, message: string) => void;
}

export const RemindersScreen: React.FC<RemindersScreenProps> = ({
  reminders,
  lang,
  user,
  onNavigate,
  onSaveReminder,
  onDeleteReminder,
  onLogDose,
  initialAddData,
  onClearInitialAddData,
  onRegisterBackHandler,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');
  const [showAddModal, setShowAddModal] = useState<boolean>(!!initialAddData);
  const [addStep, setAddStep] = useState<1 | 2>(initialAddData ? 2 : 1);
  const [editingReminder, setEditingReminder] = useState<MedicineReminder | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isPremiumUser = user?.plan === 'premium' && user?.subscriptionStatus === 'active';
  const activeRemindersCount = reminders.filter((r) => r.active).length;

  // Form states
  const [medName, setMedName] = useState(initialAddData?.name || '');
  const [genericName, setGenericName] = useState(initialAddData?.generic || '');
  const [dosage, setDosage] = useState(initialAddData?.dosage || '1 Tablet');
  const [frequency, setFrequency] = useState<
    'Once Daily' | 'Twice Daily' | 'Three Times Daily' | 'Every 8 Hours' | 'As Needed' | 'Weekly'
  >('Once Daily');
  const [times, setTimes] = useState<string[]>(['09:00']);
  const [instructions, setInstructions] = useState<
    'Before Food' | 'After Food' | 'With Food' | 'Anytime'
  >('After Food');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [colorTag, setColorTag] = useState('#0EA5E9');

  const todayDateStr = new Date().toISOString().split('T')[0];

  const quickMeds = [
    'Paracetamol 650',
    'Metformin 500mg',
    'Pantoprazole 40mg',
    'Amoxicillin 500mg',
    'Amlodipine 5mg',
    'Cetirizine 10mg',
  ];

  const handleOpenAdd = (preset?: MedicineReminder) => {
    // If not editing and user on Free plan has reached limit of 3 active medicines:
    if (!preset && !isPremiumUser && activeRemindersCount >= 3) {
      setShowLimitModal(true);
      return;
    }

    if (preset) {
      setEditingReminder(preset);
      setMedName(preset.medicineName);
      setGenericName(preset.genericName || '');
      setDosage(preset.dosage);
      setFrequency(preset.frequency);
      setTimes(preset.times);
      setInstructions(preset.instructions);
      setStartDate(preset.startDate);
      setEndDate(preset.endDate || '');
      setNotes(preset.notes || '');
      setColorTag(preset.colorTag || '#0EA5E9');
    } else {
      setEditingReminder(null);
      setMedName(initialAddData?.name || '');
      setGenericName(initialAddData?.generic || '');
      setDosage(initialAddData?.dosage || '1 Tablet');
      setFrequency('Once Daily');
      setTimes(['09:00']);
      setInstructions('After Food');
      setStartDate(todayDateStr);
      setEndDate('');
      setNotes('');
      setColorTag('#0EA5E9');
    }
    setShowAddModal(true);
    setAddStep(preset || initialAddData ? 2 : 1);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingReminder(null);
    setAddStep(1);
    if (onClearInitialAddData) onClearInitialAddData();
  };

  // Register multi-step back handler with App navigation
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
      if (showAddModal) {
        if (addStep === 2 && !editingReminder) {
          setAddStep(1);
          return true;
        }
        handleCloseModal();
        return true;
      }
      return false;
    });
  }, [onRegisterBackHandler, showLimitModal, deleteConfirmId, showAddModal, addStep, editingReminder]);

  const handleFrequencyChange = (
    freq: 'Once Daily' | 'Twice Daily' | 'Three Times Daily' | 'Every 8 Hours' | 'As Needed' | 'Weekly'
  ) => {
    setFrequency(freq);
    if (freq === 'Once Daily') setTimes(['09:00']);
    else if (freq === 'Twice Daily') setTimes(['09:00', '21:00']);
    else if (freq === 'Three Times Daily') setTimes(['08:00', '14:00', '20:00']);
    else if (freq === 'Every 8 Hours') setTimes(['06:00', '14:00', '22:00']);
  };

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSaving) return;

    if (!medName.trim()) {
      showToast('error', 'Validation Error', 'Please enter medicine name');
      return;
    }

    if (addStep === 1 && !editingReminder) {
      setAddStep(2);
      return;
    }

    if (!dosage.trim()) {
      showToast('error', 'Validation Error', 'Please enter dosage (e.g. 1 Tablet, 500mg)');
      return;
    }

    if (!Array.isArray(times) || times.length === 0 || !times.some((t) => t && t.trim())) {
      showToast('error', 'Validation Error', 'Please select at least one reminder time');
      return;
    }

    const payload: Partial<MedicineReminder> = {
      id: editingReminder?.id,
      medicineName: medName.trim(),
      genericName: genericName.trim(),
      dosage: dosage.trim() || '1 Tablet',
      frequency,
      times: times.filter((t) => t && t.trim()),
      startDate,
      endDate: endDate || undefined,
      instructions,
      notes,
      colorTag,
      active: editingReminder ? editingReminder.active : true,
      doseLogs: editingReminder ? editingReminder.doseLogs : [],
    };

    setIsSaving(true);
    try {
      await onSaveReminder(payload);
      showToast(
        'success',
        editingReminder ? 'Reminder Updated' : 'Reminder Created',
        `${medName} alarm set for ${times.join(', ')}`
      );
      handleCloseModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save reminder';
      if (
        msg.includes('limit reached') ||
        msg.includes('PLAN_LIMIT_REACHED') ||
        msg.includes('Upgrade to Premium')
      ) {
        setShowLimitModal(true);
      } else {
        showToast('error', 'Save Reminder Failed', msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSubmit = handleFormSubmit;

  const handleDeleteReminder = async (idToDelete?: string) => {
    const targetId = idToDelete || deleteConfirmId;
    if (!targetId) return;
    setIsDeleting(true);
    try {
      await onDeleteReminder(targetId);
      showToast('info', 'Reminder Removed', 'Medication reminder was deleted.');
      setDeleteConfirmId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not delete reminder';
      showToast('error', 'Delete Failed', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTestAlarm = async () => {
    await notificationEngine.playAlarmSound();
    await notificationEngine.showNotification(
      'PharmaCare Dose Alarm',
      'Test Alarm: Time to take your scheduled dose of Paracetamol 650!'
    );
    showToast('info', 'Alarm Test', 'Web Audio synthesized chime and browser alarm triggered.');
  };

  const handleTakeDoseAction = (reminderId: string, time: string, medicineName: string) => {
    notificationEngine.playTakeChime();
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.65 },
    });
    onLogDose(reminderId, time, 'taken');
    showToast('success', getTranslation(lang, 'reminders.doseTaken'), `${medicineName} (${time}) confirmed!`);
  };

  // Compile today's schedule items with exact real-time dose status
  interface TodayDoseItem {
    reminder: MedicineReminder;
    time: string;
    status: 'Scheduled' | 'Pending' | 'Taken' | 'Missed' | 'Skipped';
    logTimestamp?: number;
  }

  const todayDoses: TodayDoseItem[] = [];
  reminders
    .filter((r) => r.active)
    .forEach((rem) => {
      rem.times.forEach((t) => {
        const log = rem.doseLogs.find((l) => l.date === todayDateStr && l.time === t);
        const [h, m] = t.split(':').map(Number);
        const scheduledMinutes = h * 60 + m;
        const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
        const gracePeriod = 30; // 30-minute grace window

        let status: 'Scheduled' | 'Pending' | 'Taken' | 'Missed' | 'Skipped' = 'Scheduled';
        if (log) {
          if (log.status === 'taken') status = 'Taken';
          else if (log.status === 'skipped') status = 'Skipped';
          else if (log.status === 'snoozed') status = 'Pending';
        } else {
          if (nowMinutes < scheduledMinutes) {
            status = 'Scheduled';
          } else if (nowMinutes <= scheduledMinutes + gracePeriod) {
            status = 'Pending';
          } else {
            status = 'Missed';
          }
        }

        todayDoses.push({
          reminder: rem,
          time: t,
          status,
          logTimestamp: log?.timestamp,
        });
      });
    });

  // Sort today's doses by time
  todayDoses.sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-24">
      {/* 1. Alarm test & permissions banner */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] text-[#0EA5E9] flex items-center justify-center">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Dose Alarm & Audio</h4>
            <p className="text-[11px] text-slate-500">Synthesized offline chime</p>
          </div>
        </div>
        <button
          onClick={handleTestAlarm}
          id="btn-test-notification"
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs font-bold text-[#0F4C81] transition-all"
        >
          Test Alarm
        </button>
      </div>

      {/* Plan Usage & Limit Badge for Free Users */}
      {!isPremiumUser && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 flex items-center justify-between text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-800">Free Plan: </span>
              <span className="text-slate-600">
                {activeRemindersCount} of 3 active medicines used
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

      {/* 2. Top Tabs & Add button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'today'
                ? 'bg-white text-[#0F4C81] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Today's Schedule
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-white text-[#0F4C81] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Reminders ({reminders.length})
          </button>
        </div>

        <button
          onClick={() => handleOpenAdd()}
          id="btn-open-add-reminder"
          className="px-3 py-2 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-95 text-white text-xs font-bold shadow-xs flex items-center gap-1 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      {/* 3. Today's Schedule Tab */}
      {activeTab === 'today' && (
        <div className="space-y-3">
          {todayDoses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">No doses scheduled today</h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Add your prescriptions to activate timely sound alarms and caregiver tracking.
              </p>
              <button
                onClick={() => handleOpenAdd()}
                className="px-4 py-2 rounded-xl bg-[#0EA5E9] text-white text-xs font-bold"
              >
                Create Medicine Reminder
              </button>
            </div>
          ) : (
            todayDoses.map((item, idx) => {
              const isTaken = item.status === 'Taken';
              const isPending = item.status === 'Pending';
              const isMissed = item.status === 'Missed';
              const isScheduled = item.status === 'Scheduled';
              const isSkipped = item.status === 'Skipped';

              return (
                <div
                  key={`${item.reminder.id}-${item.time}-${idx}`}
                  className={`rounded-2xl border p-4 shadow-xs transition-all ${
                    isTaken
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isMissed
                      ? 'bg-rose-50/50 border-rose-200'
                      : isPending
                      ? 'bg-amber-50/40 border-amber-200'
                      : isSkipped
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200/80 hover:border-sky-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-10 rounded-full shrink-0"
                        style={{ backgroundColor: item.reminder.colorTag || '#0EA5E9' }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-[#0F172A]">
                            {item.reminder.medicineName}
                          </h4>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">
                          {item.reminder.dosage} • {item.reminder.instructions}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isTaken && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Taken</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1 shrink-0 animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending</span>
                        </span>
                      )}
                      {isMissed && (
                        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1 shrink-0">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Missed</span>
                        </span>
                      )}
                      {isScheduled && (
                        <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-xs font-semibold shrink-0">
                          Scheduled
                        </span>
                      )}
                      {isSkipped && (
                        <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold shrink-0">
                          Skipped
                        </span>
                      )}

                      <button
                        onClick={() => handleOpenAdd(item.reminder)}
                        id={`btn-edit-today-reminder-${item.reminder.id}`}
                        title="Edit Reminder"
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(item.reminder.id)}
                        id={`btn-delete-today-reminder-${item.reminder.id}`}
                        title="Delete Reminder"
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Actions for untaken doses */}
                  {!isTaken && !isSkipped && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 mt-2">
                      <button
                        onClick={() =>
                          handleTakeDoseAction(item.reminder.id, item.time, item.reminder.medicineName)
                        }
                        id={`btn-take-${item.reminder.id}-${idx}`}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Take Now</span>
                      </button>

                      <button
                        onClick={() => onLogDose(item.reminder.id, item.time, 'snoozed')}
                        id={`btn-snooze-${item.reminder.id}-${idx}`}
                        className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all"
                      >
                        Snooze 15m
                      </button>

                      <button
                        onClick={() => onLogDose(item.reminder.id, item.time, 'skipped')}
                        id={`btn-skip-${item.reminder.id}-${idx}`}
                        className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 4. All Reminders Tab */}
      {activeTab === 'all' && (
        <div className="space-y-3">
          {reminders.map((rem) => (
            <div
              key={rem.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs transition-all ${
                rem.active ? 'border-slate-200/80' : 'border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: rem.colorTag || '#0EA5E9' }}
                  />
                  <div>
                    <h4 className="text-sm font-extrabold text-[#0F172A]">{rem.medicineName}</h4>
                    <p className="text-xs font-medium text-slate-500">
                      {rem.dosage} • {rem.frequency}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSaveReminder({ ...rem, active: !rem.active })}
                    className={`p-1.5 rounded-lg transition-colors ${
                      rem.active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
                    }`}
                    title={rem.active ? 'Active' : 'Inactive'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenAdd(rem)}
                    id={`btn-edit-reminder-${rem.id}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(rem.id)}
                    id={`btn-delete-reminder-${rem.id}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Times badges */}
              <div className="flex flex-wrap gap-1.5 my-2">
                {rem.times.map((t, tIdx) => (
                  <span
                    key={tIdx}
                    className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1"
                  >
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{t}</span>
                  </span>
                ))}
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-sky-50 text-[#0F4C81]">
                  {rem.instructions}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                {addStep === 2 && !editingReminder && (
                  <button
                    type="button"
                    onClick={() => setAddStep(1)}
                    id="btn-back-step"
                    aria-label="Back to Medicine Name"
                    className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <h3 className="text-base font-extrabold text-[#0F172A]">
                    {editingReminder
                      ? 'Edit Medicine Reminder'
                      : addStep === 1
                      ? 'Add Medicine'
                      : 'Medicine Details'}
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    {editingReminder
                      ? 'Update schedule & dosage'
                      : addStep === 1
                      ? 'Step 1 of 2: Select or enter medicine'
                      : `Step 2 of 2: Schedule & dosage for ${medName}`}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveSubmit} className="p-5 space-y-4 overflow-y-auto">
              {/* STEP 1: ADD MEDICINE (Name & Suggestions) */}
              {addStep === 1 && (
                <div className="space-y-4">
                  {/* Medicine Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Medicine Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-reminder-name"
                      type="text"
                      value={medName}
                      onChange={(e) => setMedName(e.target.value)}
                      placeholder="e.g. Paracetamol"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9]"
                      required
                      autoFocus
                    />
                  </div>

                  {/* Generic Name (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Generic Name (Optional)
                    </label>
                    <input
                      id="input-reminder-generic"
                      type="text"
                      value={genericName}
                      onChange={(e) => setGenericName(e.target.value)}
                      placeholder="e.g. Acetaminophen"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9]"
                    />
                  </div>

                  {/* Quick suggestions */}
                  {!editingReminder && (
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Quick suggestions:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {quickMeds.map((qm) => (
                          <button
                            type="button"
                            key={qm}
                            onClick={() => {
                              setMedName(qm);
                              setDosage('1 Tablet');
                            }}
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                              medName === qm
                                ? 'bg-[#0EA5E9] text-white'
                                : 'bg-slate-100 hover:bg-sky-100 hover:text-[#0F4C81] text-slate-600'
                            }`}
                          >
                            {qm}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Step Button */}
                  <div className="pt-3">
                    <button
                      type="button"
                      id="btn-next-step-details"
                      onClick={() => {
                        if (!medName.trim()) {
                          showToast('error', 'Validation Error', 'Please enter medicine name');
                          return;
                        }
                        setAddStep(2);
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-[0.99] text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      <span>Enter Medicine Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: MEDICINE DETAILS */}
              {addStep === 2 && (
                <div className="space-y-4">
                  {/* Selected Medicine Pill Badge */}
                  <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">
                        Selected Medicine
                      </span>
                      <span className="font-extrabold text-[#0F4C81]">{medName}</span>
                    </div>
                    {!editingReminder && (
                      <button
                        type="button"
                        onClick={() => setAddStep(1)}
                        className="text-xs font-bold text-[#0EA5E9] hover:underline"
                      >
                        Change
                      </button>
                    )}
                  </div>

                  {/* Dosage */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dosage / Strength
                    </label>
                    <input
                      id="input-reminder-dosage"
                      type="text"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      placeholder="e.g. 500 mg (1 tablet)"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9]"
                    />
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) =>
                        handleFrequencyChange(
                          e.target.value as
                            | 'Once Daily'
                            | 'Twice Daily'
                            | 'Three Times Daily'
                            | 'Every 8 Hours'
                            | 'As Needed'
                            | 'Weekly'
                        )
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9]"
                    >
                      <option value="Once Daily">Once Daily</option>
                      <option value="Twice Daily">Twice Daily</option>
                      <option value="Three Times Daily">Three Times Daily</option>
                      <option value="Every 8 Hours">Every 8 Hours</option>
                      <option value="Weekly">Weekly</option>
                      <option value="As Needed">As Needed (SOS)</option>
                    </select>
                  </div>

                  {/* Times */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Scheduled Dose Time(s)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {times.map((t, idx) => (
                        <input
                          key={idx}
                          type="time"
                          value={t}
                          onChange={(e) => {
                            const newTimes = [...times];
                            newTimes[idx] = e.target.value;
                            setTimes(newTimes);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Food Instruction */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Meal / Food Instruction
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(['After Food', 'Before Food', 'With Food', 'Anytime'] as const).map(
                        (inst) => (
                          <button
                            type="button"
                            key={inst}
                            onClick={() => setInstructions(inst)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                              instructions === inst
                                ? 'bg-[#0F4C81] text-white border-[#0F4C81]'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {inst}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Doctor Notes / Instructions
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Drink full glass of water, complete 5-day course"
                      rows={2}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9]"
                    />
                  </div>

                  {/* Action Buttons: Back + Submit */}
                  <div className="flex gap-2 pt-2">
                    {!editingReminder && (
                      <button
                        type="button"
                        id="btn-back-to-step1"
                        onClick={() => setAddStep(1)}
                        className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>
                    )}
                    <button
                      type="submit"
                      id="btn-save-reminder-submit"
                      disabled={isSaving}
                      className="flex-1 py-3 px-4 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-[0.99] text-white font-bold text-sm shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Saving...' : (editingReminder ? 'Update Reminder' : 'Set Alarm & Save')}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h4 className="text-sm font-extrabold text-[#0F172A]">Delete Reminder?</h4>
            </div>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to remove this medication alarm? Any past dose confirmation logs
              will also be removed.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-reminder"
                disabled={isDeleting}
                onClick={() => handleDeleteReminder()}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-60 transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Free Plan Limit Modal */}
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
                Free plan limit reached. Upgrade to Premium for unlimited medicine reminders.
              </p>
              <div className="mt-3 py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex justify-between">
                <span>Active Medicines:</span>
                <span className="font-bold text-slate-900">{activeRemindersCount} / 3 (Free Max)</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                id="btn-limit-modal-upgrade"
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
