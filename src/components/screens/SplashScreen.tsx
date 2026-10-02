import React, { useEffect, useState } from 'react';
import { Pill, Activity, ShieldCheck } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 25;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(onFinish, 300);
          return 100;
        }
        return next;
      });
    }, 350);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div className="min-h-screen bg-[#0F4C81] text-white flex flex-col justify-between p-6 select-none relative overflow-hidden">
      {/* Top right Skip */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onFinish}
          id="btn-skip-splash"
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 active:scale-95 transition-all"
        >
          Skip Intro
        </button>
      </div>

      {/* Center brand presentation */}
      <div className="flex flex-col items-center text-center my-auto">
        {/* Logo Tile */}
        <div className="relative mb-5">
          <div className="w-22 h-22 rounded-3xl bg-white flex items-center justify-center shadow-2xl relative">
            <div className="relative flex items-center justify-center">
              <Pill className="w-11 h-11 text-[#0F4C81] -rotate-45" />
              <Activity className="w-5 h-5 text-rose-500 absolute bottom-0 right-0 animate-pulse" />
            </div>
          </div>
          <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white p-1 rounded-full shadow-md">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          PharmaCare
        </h1>
        <p className="text-sm font-medium text-sky-200/90 max-w-xs leading-relaxed mb-4">
          Your Complete Digital Pharmacy & Smart Medicine Companion
        </p>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-white/90">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Verified Medication Guidance</span>
        </div>
      </div>

      {/* Bottom Progress */}
      <div className="max-w-xs w-full mx-auto pb-4 text-center">
        <div className="w-full bg-sky-950/60 rounded-full h-2 overflow-hidden mb-3 border border-white/10 p-0.5">
          <div
            className="bg-[#0EA5E9] h-full rounded-full transition-all duration-350 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs font-medium text-sky-200/80">
          Loading healthcare services... {progress}%
        </p>
      </div>
    </div>
  );
};
