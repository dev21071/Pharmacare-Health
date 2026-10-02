import React, { useState } from 'react';
import { Pill, Users, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';
import { UserMode } from '../../types';

interface ModeSelectScreenProps {
  currentMode?: UserMode | null;
  userName?: string;
  onSelectMode: (mode: UserMode) => void;
  showToast?: (type: 'success' | 'info' | 'error' | 'warning', title: string, message: string) => void;
}

export const ModeSelectScreen: React.FC<ModeSelectScreenProps> = ({
  currentMode = null,
  userName,
  onSelectMode,
  showToast,
}) => {
  // Do NOT automatically select any mode - the user must explicitly choose one
  const [selectedMode, setSelectedMode] = useState<UserMode | null>(currentMode || null);
  const [isProcessing, setIsProcessing] = useState<UserMode | null>(null);

  const options: {
    mode: UserMode;
    number: string;
    title: string;
    description: string;
    buttonLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    bgAccent: string;
    borderActive: string;
  }[] = [
    {
      mode: 'myself',
      number: '1',
      title: 'FOR MYSELF',
      description: 'Personal medicine-care application. Add medicines, create reminders, manage prescriptions, view doctors, find pharmacies, and personal features.',
      buttonLabel: 'Select FOR MYSELF',
      icon: Pill,
      accentColor: 'text-[#0F4C81]',
      bgAccent: 'bg-sky-50',
      borderActive: 'border-[#0F4C81]',
    },
    {
      mode: 'family_caregiver',
      number: '2',
      title: 'FAMILY CAREGIVER',
      description: "Connect with and help monitor a family member's medicine reminders by entering their 6-digit Family Connection Code.",
      buttonLabel: 'Select FAMILY CAREGIVER',
      icon: Users,
      accentColor: 'text-[#6B21A8]',
      bgAccent: 'bg-purple-50',
      borderActive: 'border-[#6B21A8]',
    },
    {
      mode: 'dual',
      number: '3',
      title: 'DUAL MODE',
      description: 'Manage your own medicines and monitor a connected family member at the same time in a unified hub.',
      buttonLabel: 'Select DUAL MODE',
      icon: Layers,
      accentColor: 'text-[#0284C7]',
      bgAccent: 'bg-sky-50',
      borderActive: 'border-[#0284C7]',
    },
  ];

  const handleConfirmMode = (mode: UserMode) => {
    setIsProcessing(mode);
    setSelectedMode(mode);
    if (showToast) {
      const modeNames: Record<UserMode, string> = {
        myself: 'FOR MYSELF',
        family_caregiver: 'FAMILY CAREGIVER',
        dual: 'DUAL MODE',
      };
      showToast('success', 'Mode Selected', `Continuing in ${modeNames[mode]} mode.`);
    }
    onSelectMode(mode);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto select-none pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      {/* Top Header Section */}
      <div className="pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs mb-4">
          <div className="w-2 h-2 rounded-full bg-[#0F4C81] animate-pulse" />
          <span className="text-xs font-bold text-slate-700 tracking-wide">
            PharmaCare Account Setup
          </span>
          {userName && (
            <span className="text-xs font-semibold text-slate-400">
              • {userName}
            </span>
          )}
        </div>

        <h1 className="text-2xl font-black text-[#0F172A] tracking-tight leading-tight">
          How would you like to use PharmaCare?
        </h1>
        <p className="text-xs font-medium text-slate-500 mt-2 leading-relaxed">
          Choose how you want to use PharmaCare. You can change this later from the appropriate settings/mode option.
        </p>
      </div>

      {/* 3 Interactive Cards / Options */}
      <div className="my-auto py-5 space-y-3.5">
        {options.map((opt) => {
          const isSelected = selectedMode === opt.mode;
          const IconComponent = opt.icon;
          const isCurrentLoading = isProcessing === opt.mode;

          return (
            <div
              key={opt.mode}
              id={`card-mode-${opt.mode}`}
              onClick={() => setSelectedMode(opt.mode)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedMode(opt.mode);
                }
              }}
              className={`w-full p-4 rounded-2xl bg-white border-2 text-left transition-all cursor-pointer shadow-xs relative flex flex-col justify-between gap-3 active:scale-[0.99] ${
                isSelected
                  ? `${opt.borderActive} ring-2 ring-[#0F4C81]/15 shadow-sm`
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${opt.bgAccent} ${opt.accentColor}`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center">
                        {opt.number}
                      </span>
                      <h2 className="text-base font-extrabold text-[#0F172A]">
                        {opt.title}
                      </h2>
                    </div>
                    <p className="text-xs font-medium text-slate-600 mt-1 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 mt-0.5">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-[#0F4C81] bg-[#0F4C81] text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </div>

              {/* Action Button inside card */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  id={`btn-select-mode-${opt.mode}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirmMode(opt.mode);
                  }}
                  disabled={isCurrentLoading}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-[#0F4C81] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{opt.buttonLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Explicit Confirmation Button */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          id="btn-confirm-chosen-mode"
          disabled={!selectedMode || isProcessing !== null}
          onClick={() => {
            if (selectedMode) handleConfirmMode(selectedMode);
          }}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#0F4C81] hover:bg-[#0c3d68] disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
        >
          <span>
            {selectedMode
              ? `Continue with ${options.find((o) => o.mode === selectedMode)?.title}`
              : 'Select one of the 3 options above to continue'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Footer Info */}
        <p className="text-[11px] font-medium text-slate-400 text-center">
          You can change this later anytime from Profile & Settings.
        </p>
      </div>
    </div>
  );
};
