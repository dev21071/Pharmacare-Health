import React, { useState, useEffect, useRef } from 'react';
import { Phone, ShieldCheck, ArrowRight, RefreshCw, Sparkles, Pill, AlertCircle, Zap, Users } from 'lucide-react';
import { authProvider, authService, DEMO_OTP_CODE } from '../../services/auth';
import { UserProfile } from '../../types';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  showToast: (type: 'success' | 'info' | 'error' | 'warning', title: string, message: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, showToast }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testOtp, setTestOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(45);

  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const fullPhoneNumber = `${countryCode} ${phone.trim()}`;

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanNumber = phone.replace(/\D/g, '');
    if (cleanNumber.length < 7 || cleanNumber.length > 15) {
      setError('Please enter a valid mobile number (at least 7 digits).');
      return;
    }

    setLoading(true);
    const res = await authProvider.sendOtp(fullPhoneNumber);
    setLoading(false);

    if (res.success) {
      setStep('otp');
      setCountdown(45);
      setTestOtp(res.testOtp || DEMO_OTP_CODE);
      showToast('info', 'Verification Code Ready', `Use demo code ${res.testOtp || DEMO_OTP_CODE} or tap Auto-Fill`);
      setTimeout(() => {
        otpInputs.current[0]?.focus();
      }, 100);
    } else {
      // Even if backend fails, fall into demo flow smoothly
      setStep('otp');
      setCountdown(45);
      setTestOtp(DEMO_OTP_CODE);
      showToast('info', 'Demo Mode Activated', `Verification code: ${DEMO_OTP_CODE}`);
      setTimeout(() => {
        otpInputs.current[0]?.focus();
      }, 100);
    }
  };

  const handleQuickDemoLogin = async (role: 'patient' | 'caregiver' = 'patient') => {
    setLoading(true);
    setError(null);
    try {
      const session = await authService.loginAsDemo(role);
      showToast(
        'success',
        role === 'caregiver' ? 'Caregiver Demo Active' : 'Demo Account Ready',
        `Logged in as ${session.user.name}. All features available!`
      );
      onLoginSuccess(session.user);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Demo login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(digits.length, 5);
      otpInputs.current[nextFocus]?.focus();
      return;
    }

    const char = value.slice(-1).replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[idx] = char;
    setOtp(newOtp);

    if (char && idx < 5) {
      otpInputs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpInputs.current[idx - 1]?.focus();
    }
  };

  const handleAutofillOtp = () => {
    if (testOtp) {
      const chars = testOtp.split('').slice(0, 6);
      setOtp(chars);
      otpInputs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const completeOtp = otp.join('');
    if (completeOtp.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    const res = await authProvider.verifyOtp(fullPhoneNumber, completeOtp, name);
    setLoading(false);

    if (res.success && res.session) {
      showToast('success', 'Authentication Verified', `Welcome, ${res.session.user.name || 'Friend'}!`);
      onLoginSuccess(res.session.user);
    } else {
      setError(res.message || 'Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5FAFF] flex flex-col justify-between p-6 max-w-md mx-auto select-none">
      {/* Brand Header */}
      <div className="pt-2">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0EA5E9] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Pill className="w-6 h-6 -rotate-45" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-[#0F4C81] leading-tight">PharmaCare</h1>
              <p className="text-xs font-semibold text-slate-500">Smart Healthcare & Pharmacy</p>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
        </div>
      </div>

      {/* Main Form Container */}
      <div className="my-auto py-6">
        {step === 'phone' ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight mb-1">
              Sign In / Register
            </h2>
            <p className="text-xs font-medium text-slate-500 mb-5">
              Enter your mobile number to access medicines and emergency reminders.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs font-semibold leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSendOtp} className="space-y-4">
              {/* Optional Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Full Name (Optional)
                </label>
                <input
                  id="full-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] focus:bg-white transition-all"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-24 px-2 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9]"
                  >
                    <option value="+91">+91 (IN)</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+61">+61 (AU)</option>
                    <option value="+49">+49 (DE)</option>
                    <option value="+971">+971 (AE)</option>
                  </select>

                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      id="phone-input"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98765 43210"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Security info box */}
              <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100 flex items-start gap-2.5 text-xs text-[#0F4C81]">
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#0EA5E9] mt-0.5" />
                <span className="leading-relaxed">
                  Secure Mobile Authentication. No password required — verified via temporary SMS code.
                </span>
              </div>

              {/* Send Button */}
              <button
                type="submit"
                id="btn-send-otp"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-[0.99] disabled:opacity-60 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Verification Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Instant Demo Access Divider & Buttons */}
              <div className="pt-2">
                <div className="relative flex py-2 items-center">
                  <div className="grow border-t border-slate-200"></div>
                  <span className="shrink mx-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Instant Demo Mode
                  </span>
                  <div className="grow border-t border-slate-200"></div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('patient')}
                    disabled={loading}
                    id="btn-quick-patient-demo"
                    className="py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0F4C81] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#0EA5E9]" />
                    <span>Patient Demo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('caregiver')}
                    disabled={loading}
                    id="btn-quick-caregiver-demo"
                    className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Caregiver Demo</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          /* OTP Step */
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight mb-1">
              Verify Mobile OTP
            </h2>
            <p className="text-xs font-medium text-slate-500 mb-4">
              Enter the 6-digit verification code sent to{' '}
              <span className="font-bold text-slate-800">{fullPhoneNumber}</span>
            </p>

            {/* Demo OTP Banner */}
            {testOtp && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Demo OTP Code: {testOtp}</span>
                </div>
                <button
                  type="button"
                  onClick={handleAutofillOtp}
                  id="btn-autofill-otp"
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold active:scale-95 transition-all"
                >
                  Auto-Fill
                </button>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs font-semibold leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {/* 6 OTP boxes */}
              <div className="flex justify-between gap-1.5 sm:gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputs.current[idx] = el;
                    }}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 sm:w-12 h-12 text-center text-lg font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] focus:bg-white transition-all shadow-xs"
                  />
                ))}
              </div>

              {/* Change number + Resend */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-slate-500 hover:text-[#0F4C81] underline"
                >
                  Change Number
                </button>

                {countdown > 0 ? (
                  <span className="text-slate-400">Resend in ({countdown}s)</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    id="btn-resend-otp"
                    className="text-[#0EA5E9] hover:underline flex items-center gap-1 font-bold"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend OTP</span>
                  </button>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                id="btn-verify-otp"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-[0.99] disabled:opacity-60 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify OTP & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer disclaimer */}
      <div className="pb-4 text-center">
        <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
          By proceeding, you agree to PharmaCare's Medical Terms of Service & Privacy Policy.
        </p>
      </div>
    </div>
  );
};
