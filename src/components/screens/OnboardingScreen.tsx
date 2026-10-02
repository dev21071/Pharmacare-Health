import React, { useState } from 'react';
import { Bell, Search, UploadCloud, Check, Pill, ArrowRight } from 'lucide-react';
import { storage } from '../../services/storage';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: Bell,
      badge: 'Smart Reminders',
      title: 'Never Miss Your Medicine Dose',
      description: 'Automated on-device alarms, food guidelines, and real-time family caregiver safety sync.',
      features: [
        'Timely dose alerts with custom sound',
        'Before / After food intake guidance',
        'Track missed, snoozed & taken doses',
      ],
    },
    {
      icon: Search,
      badge: 'Comprehensive Database',
      title: 'Search & Understand Any Medicine',
      description: 'Instant clinical reference covering 500+ verified active molecules, generic brands, and precautions.',
      features: [
        'Over-the-counter & prescription info',
        'Side-effects & precautions guide',
        'One-tap reminder creator',
      ],
    },
    {
      icon: UploadCloud,
      badge: 'Digital Prescriptions & Locator',
      title: 'Upload Prescriptions & Find Pharmacies',
      description: 'Private encrypted record vault with direct 24/7 chemist locator across your immediate area.',
      features: [
        'Camera & PDF prescription storage',
        'Nearby pharmacy locator with calling',
        'Verified healthcare safety tips',
      ],
    },
  ];

  const handleFinish = () => {
    storage.setOnboardingDone(true);
    onComplete();
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleFinish();
    }
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-[#F5FAFF] flex flex-col justify-between p-6 max-w-md mx-auto select-none">
      {/* Top bar: Brand + Skip */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#0F4C81] flex items-center justify-center text-white font-bold text-sm shadow-xs">
            <Pill className="w-4 h-4 -rotate-45" />
          </div>
          <span className="text-base font-extrabold text-[#0F4C81] tracking-tight">PharmaCare</span>
        </div>
        <button
          onClick={handleFinish}
          id="btn-onboarding-skip"
          className="text-xs font-bold text-slate-500 hover:text-[#0F4C81] px-3 py-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Main Slide Card */}
      <div className="my-auto py-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          {/* Icon + Badge */}
          <div className="flex items-center justify-between mb-5">
            <div className="w-14 h-14 rounded-2xl bg-[#E0F2FE] text-[#0EA5E9] flex items-center justify-center shadow-xs">
              <Icon className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-50 text-[#0EA5E9] border border-sky-100">
              {slide.badge}
            </span>
          </div>

          <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight mb-2 leading-snug">
            {slide.title}
          </h2>
          <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
            {slide.description}
          </p>

          {/* Features Checkmark list */}
          <div className="space-y-3">
            {slide.features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span className="text-xs font-semibold text-slate-700">
                  {feat}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom controls: Pagination + Button */}
      <div className="pb-4">
        {/* Pagination dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-200 ${
                currentSlide === idx ? 'w-8 bg-[#0F4C81]' : 'w-2 bg-slate-300'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Next / Get Started Button */}
        <button
          onClick={handleNext}
          id="btn-onboarding-next"
          className="w-full py-3.5 px-6 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-[0.99] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
        >
          <span>{currentSlide === slides.length - 1 ? 'Get Started' : 'Continue'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
