import React, { useState } from 'react';
import { Languages, Check, ArrowRight, X } from 'lucide-react';
import { AppLanguage } from '../../types';
import { storage } from '../../services/storage';

interface LanguageSelectScreenProps {
  currentLanguage: AppLanguage;
  isFromProfile?: boolean;
  onLanguageChange: (lang: AppLanguage) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  showToast: (type: 'success' | 'info' | 'error' | 'warning', title: string, message: string) => void;
}

export const LanguageSelectScreen: React.FC<LanguageSelectScreenProps> = ({
  currentLanguage,
  isFromProfile = false,
  onLanguageChange,
  onConfirm,
  onCancel,
  showToast,
}) => {
  const [selected, setSelected] = useState<AppLanguage>(currentLanguage);

  const languages = [
    {
      id: 'en' as AppLanguage,
      code: 'EN',
      name: 'English',
      nativeName: 'English (United States)',
      greeting: 'Welcome to PharmaCare',
      tag: 'Default',
    },
    {
      id: 'hi' as AppLanguage,
      code: 'HI',
      name: 'Hindi',
      nativeName: 'हिंदी (भारत)',
      greeting: 'फार्माकेयर में आपका स्वागत है',
      tag: 'हिंदी',
    },
    {
      id: 'gu' as AppLanguage,
      code: 'GU',
      name: 'Gujarati',
      nativeName: 'ગુજરાતી (ગુજરાત)',
      greeting: 'ફાર્માકેરમાં આપનું સ્વાગત છે',
      tag: 'ગુજરાતી',
    },
  ];

  const handleSelect = (lang: AppLanguage) => {
    setSelected(lang);
    storage.setLanguage(lang);
    onLanguageChange(lang);
  };

  const handleConfirm = () => {
    storage.setLanguage(selected);
    showToast('success', 'Language saved', `Language updated to ${selected.toUpperCase()}`);
    onConfirm();
  };

  return (
    <div className="min-h-screen bg-[#F5FAFF] flex flex-col justify-between p-6 max-w-md mx-auto select-none">
      {/* Top Banner */}
      <div className="pt-2">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0F4C81] flex items-center justify-center font-bold">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#0F4C81]">Choose Language</h1>
              <p className="text-xs font-semibold text-slate-500">ભાષા પસંદ કરો / भाषा चुनें</p>
            </div>
          </div>
          {isFromProfile && onCancel && (
            <button
              onClick={onCancel}
              id="btn-cancel-language"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Language cards */}
      <div className="my-auto py-6">
        <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight mb-1">
          Select Preferred Language
        </h2>
        <p className="text-xs font-medium text-slate-500 mb-5">
          The selected language applies instantly across all navigation, reminders, and medical labels.
        </p>

        <div className="space-y-3">
          {languages.map((item) => {
            const isSelected = selected === item.id;

            return (
              <button
                key={item.id}
                id={`btn-lang-${item.id}`}
                onClick={() => handleSelect(item.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-white border-[#0EA5E9] shadow-md ring-2 ring-[#0EA5E9]/20'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl font-black text-xs flex items-center justify-center ${
                      isSelected ? 'bg-[#0F4C81] text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.code}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-[#0F172A]">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {item.nativeName}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-0.5 italic">
                      "{item.greeting}"
                    </p>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-[#0EA5E9] bg-[#0EA5E9] text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer controls */}
      <div className="pb-4">
        <button
          onClick={handleConfirm}
          id="btn-confirm-language"
          className="w-full py-3.5 px-6 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-[0.99] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
        >
          <span>{isFromProfile ? 'Save Language' : 'Continue to Home'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[11px] text-center text-slate-400 mt-3 font-medium">
          PharmaCare Multi-language Engine • English • हिंदी • ગુજરાતી
        </p>
      </div>
    </div>
  );
};
