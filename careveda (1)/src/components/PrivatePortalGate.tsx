import { FormEvent, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { AdminAffiliateAccount } from '../types';

interface PrivatePortalGateProps {
  mode: 'creator' | 'admin';
  affiliates: AdminAffiliateAccount[];
  onAuthenticatedCreator: (affiliate: AdminAffiliateAccount) => void;
  onAuthenticatedAdmin: (adminEmail: string) => void;
  onReturnToStore: () => void;
}

const VALID_ADMIN_IDS = new Set([
  'admin@carenest.com.np',
  'admin@carenest.np',
  'cn-admin-hq',
  'carenest-admin',
]);
const DEFAULT_ADMIN_PASSCODE = 'CareNestAdmin#2026';

export function PrivatePortalGate({
  mode,
  affiliates,
  onAuthenticatedCreator,
  onAuthenticatedAdmin,
  onReturnToStore,
}: PrivatePortalGateProps) {
  const [identifier, setIdentifier] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isCreator = mode === 'creator';

  useEffect(() => {
    setIdentifier('');
    setPasscode('');
    setErrorMsg(null);
    setIsSubmitting(false);
    setShowPasscode(false);
  }, [mode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanId = identifier.trim();
    const cleanPass = passcode.trim();
    if (!cleanId || !cleanPass) {
      setErrorMsg(
        isCreator
          ? 'Enter your CareNest-issued Creator Partner ID (or email) and passcode.'
          : 'Enter your CareNest Admin ID/email and passcode.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (isCreator) {
        const normalizedUpper = cleanId.toUpperCase();
        const normalizedLower = cleanId.toLowerCase();

        const localMatch = affiliates.find(
          (a) =>
            a.creatorPartnerId.toUpperCase() === normalizedUpper ||
            (a.email && a.email.toLowerCase() === normalizedLower)
        );

        let apiOk = false;
        let apiData: { affiliate?: AdminAffiliateAccount; error?: string } | null =
          null;
        let apiStatus = 0;

        try {
          const res = await fetch('/api/auth/creator/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creatorPartnerId: cleanId,
              passcode: cleanPass,
            }),
          });
          apiStatus = res.status;
          apiOk = res.ok;
          apiData = await res.json().catch(() => null);
        } catch {
          // Network/static preview fallback handled via localMatch below
        }

        if (localMatch) {
          if (localMatch.status === 'Suspended') {
            setErrorMsg(
              'This Creator Partner ID is currently suspended by CareNest Admin.'
            );
            return;
          }
          if (localMatch.status === 'Pending Review') {
            setErrorMsg(
              'This Creator Partner ID is pending CareNest Admin activation.'
            );
            return;
          }
          if (
            (localMatch.passcode && localMatch.passcode === cleanPass) ||
            (apiOk && apiData?.affiliate)
          ) {
            onAuthenticatedCreator(localMatch);
            return;
          }
          setErrorMsg('Invalid passcode for this Creator Partner ID.');
          return;
        }

        if (apiOk && apiData?.affiliate) {
          onAuthenticatedCreator(apiData.affiliate);
          return;
        }

        setErrorMsg(
          apiStatus >= 400 && apiData?.error
            ? apiData.error
            : 'Creator Partner ID not recognized. Only CareNest Admin can create Creator Partner IDs.'
        );
      } else {
        const normalizedLower = cleanId.toLowerCase();
        let apiOk = false;
        let apiStatus = 0;
        let apiData: { adminEmail?: string; error?: string } | null = null;

        try {
          const res = await fetch('/api/auth/admin/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identifier: cleanId,
              passcode: cleanPass,
            }),
          });
          apiStatus = res.status;
          apiOk = res.ok;
          apiData = await res.json().catch(() => null);
        } catch {
          // Static preview fallback below
        }

        if (apiOk) {
          onAuthenticatedAdmin(apiData?.adminEmail || 'admin@carenest.com.np');
          return;
        }

        // Resilient fallback when server is static/restarting or returned non-JSON 404/502
        const matchesLocalAdmin =
          VALID_ADMIN_IDS.has(normalizedLower) &&
          cleanPass === DEFAULT_ADMIN_PASSCODE;

        if (matchesLocalAdmin && (apiStatus === 0 || apiStatus >= 500 || apiStatus === 404 || !apiData)) {
          onAuthenticatedAdmin('admin@carenest.com.np');
          return;
        }

        setErrorMsg(apiData?.error || 'Invalid CareNest Admin credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF8F5] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-3xl bg-white border border-[#12141C]/15 shadow-xl overflow-hidden">
        <div
          className={`p-6 sm:p-7 text-white space-y-2 ${
            isCreator ? 'bg-[#153B24]' : 'bg-[#12141C]'
          }`}
        >
          <p className="text-[11px] font-medium text-emerald-300 inline-flex items-center gap-1.5">
            {isCreator ? (
              <BadgeCheck className="w-3.5 h-3.5" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            <span>
              {isCreator
                ? 'Private Partner Portal · Skin AID by CareNest'
                : 'Internal Operations · CareNest HQ'}
            </span>
          </p>
          <h1 className="font-display text-2xl font-semibold">
            {isCreator ? 'Creator Partner Sign In' : 'CareNest Admin Sign In'}
          </h1>
          <p className="text-xs text-white/75 leading-relaxed">
            {isCreator
              ? 'Sign in with the official Creator Partner ID (or email) and passcode issued to you by CareNest Admin.'
              : 'Restricted access for CareNest Administrators managing Skin AID inventory, 3P Phytomax Care economics, and Creator Partner IDs.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
          {errorMsg && (
            <div className="rounded-xl bg-[#9E1B24]/8 border border-[#9E1B24]/25 px-4 py-3 text-xs font-medium text-[#9E1B24] flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor="gate-id"
                className="block text-xs font-semibold text-[#12141C]/75"
              >
                {isCreator
                  ? 'Creator Partner ID or Email'
                  : 'CareNest Admin Email or ID'}
              </label>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  if (isCreator) {
                    setIdentifier('CN-CR-1001');
                    setPasscode('Aayu#2026');
                  } else {
                    setIdentifier('admin@carenest.com.np');
                    setPasscode(DEFAULT_ADMIN_PASSCODE);
                  }
                }}
                className="text-[11px] font-medium text-[#153B24] hover:underline cursor-pointer"
              >
                {isCreator ? 'Fill Demo Partner' : 'Fill Demo Admin'}
              </button>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#12141C]/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="gate-id"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={isCreator ? 'CN-CR-1001' : 'admin@carenest.com.np'}
                className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-[#12141C]/15 bg-[#FAF8F5] text-sm text-[#12141C] focus:outline-none focus:border-[#153B24]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="gate-passcode"
              className="block text-xs font-semibold text-[#12141C]/75 mb-1.5"
            >
              Passcode
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#12141C]/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="gate-passcode"
                type={showPasscode ? 'text' : 'password'}
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter issued passcode"
                className="w-full min-h-[44px] pl-10 pr-11 py-2 rounded-xl border border-[#12141C]/15 bg-[#FAF8F5] text-sm text-[#12141C] focus:outline-none focus:border-[#153B24]"
              />
              <button
                type="button"
                onClick={() => setShowPasscode((v) => !v)}
                aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#12141C]/50 hover:text-[#12141C] cursor-pointer"
              >
                {showPasscode ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {isCreator && (
            <div className="rounded-xl bg-[#FAF8F5] border border-[#12141C]/10 p-3.5 text-xs text-[#12141C]/70 leading-relaxed">
              Creator self-registration is disabled. Only <strong>CareNest Admin</strong> can issue a Creator Partner ID and passcode (up to 5% commission cap).
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full min-h-[48px] px-6 py-3 rounded-xl text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 ${
              isCreator
                ? 'bg-[#153B24] hover:bg-[#102E1C]'
                : 'bg-[#9E1B24] hover:bg-[#82141C]'
            }`}
          >
            <span>
              {isSubmitting
                ? 'Verifying Credentials...'
                : isCreator
                ? 'Enter Creator Studio'
                : 'Enter CareNest Admin Console'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onReturnToStore}
            className="w-full min-h-[40px] text-xs font-medium text-[#12141C]/65 hover:text-[#153B24] inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Skin AID Store</span>
          </button>
        </form>
      </div>
    </div>
  );
}
