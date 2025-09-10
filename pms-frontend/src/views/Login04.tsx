/**
 * views/Login.tsx
 * ---------------
 * Flow:
 *  1) User types email/phone, clicks "Send OTP" -> /auth/otp/request
 *  2) User enters OTP (dev: 000000), clicks Verify -> /auth/otp/verify
 *  3) On success, JWT stored -> navigate:
 *        - Super Admin -> /admin
 *        - Everyone else -> /landing
 *  4) On failure, show backend-provided error (e.g., "User does not exist").
 *
 * UI notes:
 *  - Top header with brand + tagline (green/yellow theme)
 *  - Language dropdown + Mode (Light/Dark) toggle
 *  - Legal text beneath "Send OTP" as requested
 */

import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { endpoints } from '../api/endpoints';
import { useNavigate } from 'react-router-dom';

type Step = 'enter' | 'otp';

export default function Login() {
  // ---- State ----
  // Replace this:
// const [login, setLogin] = useState('');

// With this:
const [login, setLogin] = useState<string>(() => localStorage.getItem('savedLogin') || '');

// Add this new state:
const [remember, setRemember] = useState<boolean>(() => localStorage.getItem('rememberLogin') === '1');

  const [step, setStep] = useState<Step>('enter');
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Preferences (purely cosmetic for now)
  const [lang, setLang] = useState<string>(() => localStorage.getItem('lang') || 'en');
  const [dark, setDark] = useState<boolean>(() => localStorage.getItem('mode') === 'dark');

  const nav = useNavigate();

  // ---- Effects: theme + persist prefs ----
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('mode', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  useEffect(() => {
  if (remember) {
    localStorage.setItem('savedLogin', login);
  } else {
    localStorage.removeItem('savedLogin');
  }
  localStorage.setItem('rememberLogin', remember ? '1' : '0');
}, [remember, login]);


  // ---- Actions ----
  const sendOtp = async () => {
    setErr(null);
    if (!login.trim()) {
      setErr('Enter email or phone');
      return;
    }
    try {
      setBusy(true);
      await api.post(endpoints.otpRequest, { login });
      setStep('otp');
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Failed to request OTP');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setErr(null);
    try {
      setBusy(true);
      const { data } = await api.post(endpoints.otpVerify, { login, code });
      console.log('verify result', data); // <-- check this in the browser Console
      if (!data.ok) {
        setErr(data.error || 'Invalid OTP');
        return;
      }
      // Persist session
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Routing: superadmin -> /admin, others -> /landing
      if (data.user?.isSuperAdmin) nav('/admin', { replace: true });
      else nav('/landing', { replace: true });
      
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Failed to verify OTP');
    } finally {
      setBusy(false);
    }
    
  };

  // ---- UI helpers ----
  const onEnterKeySend = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendOtp();
  };
  const onEnterKeyVerify = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && code.trim().length >= 6) verify();
  };

  // ---- Styles (Tailwind) ----
  const inputCls =
    'border rounded w-full p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500';
  const buttonPrimary =
    'w-full py-3 rounded bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 disabled:cursor-not-allowed';
  const buttonSecondary = 'w-full py-3 rounded border hover:bg-gray-50';

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-yellow-50 dark:from-neutral-900 dark:to-neutral-950">
      {/* Top brand header (kept at top, not on side) */}
      <header className="w-full px-4 sm:px-6 lg:px-10 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            {/* Brand block */}
            <div className="flex items-center gap-3">
              <div
                aria-label="Ava Logo"
                className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 via-lime-400 to-yellow-300 grid place-items-center shadow"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" role="img" aria-hidden="true">
                  <path
                    d="M12 2C9 6 7 8.5 7 11a5 5 0 1 0 10 0c0-2.5-2-5-5-9z"
                    className="fill-white/95"
                  />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight dark:text-white">Trinity PMS</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Empowering Projects</div>
              </div>
            </div>

            {/* Language + Mode */}
            <div className="flex items-center gap-3">
              <select
                className="border rounded px-3 py-2 text-sm bg-white dark:bg-neutral-800 dark:text-white"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                aria-label="Select language"
                title="Select language"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="ta">தமிழ்</option>
              </select>

              <button
                type="button"
                onClick={() => setDark((v) => !v)}
                className="px-3 py-2 rounded border text-sm bg-white dark:bg-neutral-800 dark:text-white"
                title="Toggle Light/Dark"
              >
                {dark ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </div>

          {/* Tagline */}
          <div className="mt-6 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-semibold leading-snug dark:text-white">
              Experience Next-Level Project Management
              <br />
              Powered by <span className="text-emerald-600 font-bold">Artificial Intelligence</span>
            </h1>
            <p className="text-base text-gray-700 dark:text-gray-300">
              Uniting <b>Vision</b>, <b>Design</b> and <b>Execution</b>.
            </p>
            <div className="h-1 w-24 rounded-full bg-emerald-500/80"></div>
          </div>
        </div>
      </header>

      {/* Auth card */}
      <main className="px-4 sm:px-6 lg:px-10 pb-16">
        <div className="mx-auto max-w-md">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border dark:border-neutral-800 p-6 space-y-4">
            <h2 className="text-xl font-semibold dark:text-white">Sign in</h2>

            {step === 'enter' && (
              <>
                <input
                  className={inputCls}
                  placeholder="Email or phone"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  onKeyDown={onEnterKeySend}
                  autoFocus
                />
                <button
                  onClick={sendOtp}
                  className={buttonPrimary}
                  disabled={busy || !login.trim()}
                >
                  {busy ? 'Sending…' : 'Send OTP'}
                </button>
<label className="mt-2 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
  <input
    type="checkbox"
    className="h-4 w-4"
    checked={remember}
    onChange={(e) => setRemember(e.target.checked)}
  />
  Remember me on this device
</label>

                {/* Required text below "Send OTP" */}
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div>
                    Pre-registered users only. Need Access? Contact admin at{' '}
                    <a
                      className="text-emerald-700 hover:underline"
                      href="mailto:admin@trinity-pms.example"
                    >
                      admin@trinity-pms.example
                    </a>
                  </div>
                  <div>
                    By continuing, you agree to our{' '}
                    <a className="text-emerald-700 hover:underline" href="/terms">
                      Terms
                    </a>{' '}
                    and{' '}
                    <a className="text-emerald-700 hover:underline" href="/privacy">
                      Privacy Policy
                    </a>
                    .
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Dev OTP: <b>000000</b> (users must exist)
                </p>
              </>
            )}

            {step === 'otp' && (
              <>
                <input
                  className={`${inputCls} tracking-widest`}
                  placeholder="Enter OTP (000000)"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={onEnterKeyVerify}
                  maxLength={6}
                  autoFocus
                />
                <button
                  onClick={verify}
                  className={buttonPrimary}
                  disabled={busy || code.trim().length < 6}
                >
                  {busy ? 'Verifying…' : 'Verify & Continue'}
                </button>
                <button onClick={() => setStep('enter')} className={buttonSecondary}>
                  Back
                </button>
              </>
            )}

            {err && <div className="text-red-600 text-sm">{err}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
