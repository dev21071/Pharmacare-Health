import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  Sparkles,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Clock,
  Pill,
  FileText,
  Users,
  BellRing,
  RefreshCw,
  CreditCard,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import {
  UserProfile,
  UserSubscription,
  PlanLimits,
  BillingCycle,
  AppLanguage
} from '../../types';
import { api } from '../../services/api';

interface SubscriptionScreenProps {
  user: UserProfile;
  lang: AppLanguage;
  onBack: () => void;
  onSubscriptionUpdated?: (plan: 'free' | 'premium', sub: UserSubscription) => void;
  onRegisterBackHandler?: (handler: () => boolean) => () => void;
  showToast: (type: 'success' | 'info' | 'error' | 'warning', title: string, message: string) => void;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({
  user,
  lang,
  onBack,
  onSubscriptionUpdated,
  onRegisterBackHandler,
  showToast,
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Load current subscription & limit status from persistent backend
  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      const res = await api.getSubscriptionStatus();
      setSubscription(res.subscription);
      setLimits(res.limits);
      if (res.subscription.billingCycle) {
        setBillingCycle(res.subscription.billingCycle);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unable to verify subscription.';
      showToast('error', 'Subscription Check Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  // Multi-step back handler for hardware/browser back and child modals
  useEffect(() => {
    if (!onRegisterBackHandler) return;
    return onRegisterBackHandler(() => {
      if (showCancelConfirm) {
        setShowCancelConfirm(false);
        return true;
      }
      return false; // Allows parent handleGoBack to pop navigationStack and return to previous screen
    });
  }, [onRegisterBackHandler, showCancelConfirm]);

  const handleBack = () => {
    if (showCancelConfirm) {
      setShowCancelConfirm(false);
      return;
    }
    onBack();
  };

  const isPremium =
    subscription?.plan === 'premium' &&
    subscription?.status === 'active' &&
    (!subscription?.expiryDate || subscription.expiryDate > Date.now());

  const handleUpgrade = async () => {
    setActionLoading(true);
    try {
      const res = await api.upgradeSubscription(billingCycle);
      setSubscription(res.subscription);
      setLimits(res.limits);
      if (onSubscriptionUpdated) {
        onSubscriptionUpdated('premium', res.subscription);
      }
      showToast(
        'success',
        'Welcome to PharmaCare Premium!',
        `Your account has been upgraded to Premium (${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}). Unlimited reminders & vaults unlocked.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upgrade could not be processed.';
      showToast('error', 'Upgrade Failed', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setActionLoading(true);
    try {
      const res = await api.cancelSubscription();
      setSubscription(res.subscription);
      setLimits(res.limits);
      setShowCancelConfirm(false);
      if (onSubscriptionUpdated) {
        onSubscriptionUpdated('free', res.subscription);
      }
      showToast('info', 'Subscription Cancelled', 'Your account has reverted to the Free plan.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cancellation could not be completed.';
      showToast('error', 'Cancellation Error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (timestamp: number | null | undefined) => {
    if (!timestamp) return 'Permanent';
    return new Date(timestamp).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto pb-24">
      {/* 1. Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          id="btn-back-from-subscription"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1 text-xs font-bold shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-1.5">
          <span
            className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
              isPremium
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {isPremium ? '★ PREMIUM ACTIVE' : 'FREE PLAN'}
          </span>
        </div>
      </div>

      {/* 2. Main Title Banner */}
      <div className="bg-[#0F4C81] text-white rounded-2xl p-5 border border-sky-800/40 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">PharmaCare Subscription Plans</h1>
            <p className="text-xs text-sky-200 mt-1 leading-relaxed">
              Unlock unlimited medication alarms, document vaults, and advanced real-time caregiver monitoring for your family.
            </p>
          </div>
        </div>

        {/* Live limits summary pill */}
        {limits && (
          <div className="mt-4 pt-3 border-t border-white/15 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white/10 rounded-xl p-2">
              <span className="block text-[11px] text-sky-200">Active Reminders</span>
              <span className="font-extrabold text-white text-sm">
                {limits.reminders.current} / {limits.reminders.max === null ? '∞' : limits.reminders.max}
              </span>
            </div>
            <div className="bg-white/10 rounded-xl p-2">
              <span className="block text-[11px] text-sky-200">Stored Rx Vault</span>
              <span className="font-extrabold text-white text-sm">
                {limits.prescriptions.current} / {limits.prescriptions.max === null ? '∞' : limits.prescriptions.max}
              </span>
            </div>
            <div className="bg-white/10 rounded-xl p-2">
              <span className="block text-[11px] text-sky-200">Caregiver Links</span>
              <span className="font-extrabold text-white text-sm">
                {limits.caregivers.current} / {limits.caregivers.max === null ? '∞' : limits.caregivers.max}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Billing Cycle Selector */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => setBillingCycle('monthly')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            billingCycle === 'monthly'
              ? 'bg-white text-[#0F4C81] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Monthly Billing (₹199 / mo)
        </button>
        <button
          type="button"
          onClick={() => setBillingCycle('yearly')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all relative ${
            billingCycle === 'yearly'
              ? 'bg-[#0F4C81] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Yearly (₹1,499 / yr)</span>
          <span className="ml-1.5 text-[10px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded-full">
            SAVE 37%
          </span>
        </button>
      </div>

      {/* 4. Side-by-Side Plan Cards in One Horizontal Row */}
      <div className="flex flex-row flex-nowrap items-stretch gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin snap-x snap-mandatory">
        {/* FREE PLAN CARD */}
        <div
          className={`flex-1 min-w-[280px] sm:min-w-[320px] flex flex-col justify-between bg-white rounded-2xl p-5 border transition-all snap-start ${
            !isPremium
              ? 'border-[#0F4C81] ring-1 ring-[#0F4C81]/20 shadow-xs'
              : 'border-slate-200 shadow-2xs opacity-90'
          }`}
        >
          <div>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900">FREE PLAN</h2>
                  {!isPremium && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      Current Plan
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Essential baseline medication reminders</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-slate-900">₹0</span>
                <span className="text-[11px] text-slate-500 block">forever free</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Maximum 3 active medicine reminders</strong>
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Maximum 3 saved prescriptions in digital vault</strong>
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Basic single caregiver pairing (1 linked member)</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Audio dose alarms & standard reminders</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-400">
                <X className="w-4 h-4 text-slate-300 shrink-0" />
                <span className="line-through">Unlimited medicine reminders</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-400">
                <X className="w-4 h-4 text-slate-300 shrink-0" />
                <span className="line-through">Unlimited prescription repository</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-400">
                <X className="w-4 h-4 text-slate-300 shrink-0" />
                <span className="line-through">Advanced multi-caregiver real-time sync</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            {!isPremium ? (
              <div className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs text-center">
                Currently Active
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                disabled={actionLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors"
              >
                Downgrade / Revert to Free Plan
              </button>
            )}
          </div>
        </div>

        {/* PREMIUM PLAN CARD */}
        <div
          className={`flex-1 min-w-[280px] sm:min-w-[320px] flex flex-col justify-between bg-white rounded-2xl p-5 border-2 transition-all snap-start ${
            isPremium
              ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
              : 'border-[#0F4C81] shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-[#0F4C81]">PREMIUM PLAN</h2>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>{isPremium ? 'Active' : 'Recommended'}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete health autonomy & unlimited family safety
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-[#0F4C81]">
                  {billingCycle === 'yearly' ? '₹1,499' : '₹199'}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {billingCycle === 'yearly' ? 'per year (₹125/mo)' : 'per month'}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2.5 text-slate-800">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>
                  <strong className="text-emerald-800">Unlimited Medicine Reminders</strong> — Never hit the 3-med limit
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-800">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>
                  <strong className="text-emerald-800">Unlimited Prescription Vault</strong> — Upload all past & present files
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-800">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>
                  <strong>Unlimited Family Caregivers</strong> — Pair children, spouse & doctors
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-800">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>
                  <strong>Priority Missed-Dose Watchdog</strong> — Real-time alerts across devices
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-800">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>
                  <strong>Caregiver Remote Ping & SOS</strong> — Audio chime alerts & instant distress beacon
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-800">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>
                  <strong>Complete Health Archive Export</strong> — Port JSON/PDF records anytime
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100">
            {isPremium ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>You are enjoying PharmaCare Premium</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Valid until: <strong>{formatDate(subscription?.expiryDate)}</strong> (
                  {subscription?.billingCycle === 'yearly' ? 'Annual Plan' : 'Monthly Plan'})
                </p>
              </div>
            ) : (
              <button
                type="button"
                id="btn-upgrade-to-premium"
                onClick={handleUpgrade}
                disabled={actionLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#0F4C81] hover:bg-[#0c3c66] active:scale-[0.99] text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Activating Subscription...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>
                      Upgrade to Premium ({billingCycle === 'yearly' ? '₹1,499 / yr' : '₹199 / mo'})
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Payment-Ready Architecture Information Card */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <CreditCard className="w-4 h-4 text-[#0F4C81]" />
          <span>Payment Provider Ready Architecture</span>
        </div>
        <p className="text-slate-600 leading-relaxed text-[11px]">
          Subscription status and limits are validated through the production backend database. Instant activation mode is available for seamless onboarding, prepared for future direct payment gateway integration (Razorpay, Stripe, Google Play Billing).
        </p>
      </div>

      {/* 6. Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-slate-200 shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 text-center">
              Revert to Free Plan?
            </h3>
            <p className="text-xs text-slate-600 text-center leading-relaxed">
              Your account will revert to Free limits (max 3 reminders, 3 stored prescriptions). Your existing records will not be deleted, but you will not be able to add new ones beyond the limit.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50"
              >
                Keep Premium
              </button>
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={actionLoading}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-xs text-white shadow-2xs"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Revert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
