/**
 * views/Login.tsx
 * ---------------
 * - OTP login (dev OTP: 000000)
 * - Super Admin -> /admin, others -> /landing
 * - "Remember me" checkbox:
 *     • If checked at successful login, store username in localStorage list (MRU).
 *     • If unchecked, do NOT remove anything previously saved.
 * - Suggestions list:
 *     • Shows remembered usernames when the username input is focused.
 *     • Click to fill. Filtered by typed text.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { endpoints } from '../api/endpoints';

type Step = 'enter' | 'otp';

// ---- Helpers: JWT decode + saved logins list (MRU) ----
function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    const json = atob(b64 + pad);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const SAVED_LOGINS_KEY = 'savedLogins'; // JSON string string[]
function readSavedLogins(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_LOGINS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}
function writeSavedLogins(arr: string[]) {
  try {
    localStorage.setItem(SAVED_LOGINS_KEY, JSON.stringify(arr));
  } catch {}
}
function addSavedLogin(login: string) {
  const trimmed = (login || '').trim();
  if (!trimmed) return;
  const current = readSavedLogins();
  // MRU: move to front if exists, else unshift
  const idx = current.findIndex((v) => v.toLowerCase() === trimmed.toLowerCase());
  if (idx >= 0) current.splice(idx, 1);
  current.unshift(trimmed);
  // Keep only the last N remembered (e.g., 8)
  writeSavedLogins(current.slice(0, 8));
}

export default function Login() {
  // Prefill with last remembered, if any
  const initialLogin = (() => {
    const saved = readSavedLogins();
    return saved.length ? saved[0] : '';
  })();

  // ---- State ----
  const [login, setLogin] = useState<string>(initialLogin);
  const [step, setStep] = useState<Step>('enter');
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Remember-me flag (default unchecked). We DO NOT erase saved users when unchecked.
  const [remember, setRemember] = useState<boolean>(false);

  // Suggestions state
  const [savedLogins, setSavedLogins] = useState<string[]>(() => readSavedLogins());
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const inputWrapRef = useRef<HTMLDivElement | null>(null);

  // Cosmetic prefs (unchanged)
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

  // Click outside to close suggestions
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!inputWrapRef.current) return;
      if (!inputWrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Filter suggestions by typed text
  const filteredSuggestions = useMemo(() => {
    const q = login.trim().toLowerCase();
    if (!q) return savedLogins;
    return savedLogins.filter((s) => s.toLowerCase().includes(q));
  }, [login, savedLogins]);

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
      if (!data?.ok) {
        setErr(data?.error || 'Invalid OTP');
        return;
      }

      // Persist session
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // If remember is checked, add login to saved list (MRU)
      if (remember) {
        addSavedLogin(login);
        setSavedLogins(readSavedLogins()); // refresh list in state
      }

      // Route by JWT payload (source of truth), fallback to user object
      const payload = decodeJwtPayload(data.token);
      const isAdmin = !!(payload && payload.isSuperAdmin);
      if (isAdmin || data.user?.isSuperAdmin) {
        nav('/admin', { replace: true });
      } else {
        nav('/landing', { replace: true });
      }
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Failed to verify OTP');
    } finally {
      setBusy(false);
    }
  };

  // ---- UI helpers ----
  const inputBase =
    'border rounded w-full p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500';
  const btnPrimary =
    'w-full py-3 rounded bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 disabled:cursor-not-allowed';
  const btnSecondary = 'w-full py-3 rounded border hover:bg-gray-50';
  const onEnterLogin = (e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && sendOtp();
  const onEnterOtp = (e: React.KeyboardEvent<HTMLInputElement>) =>
    e.key === 'Enter' && code.trim().length >= 6 && verify();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-yellow-50 dark:from-neutral-900 dark:to-neutral-950">
      {/* Top header (brand + prefs) */}
      <header className="w-full px-4 sm:px-6 lg:px-10 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            {/* Brand */}
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

            {/* Prefs */}
            <div className="flex items-center gap-3">
              <select
                className="border rounded px-3 py-2 text-sm bg-white dark:bg-neutral-800 dark:text-white"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                aria-label="Select language"
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
            <div className="h-1 w-24 rounded-full bg-emerald-500/80" />
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
                {/* Username input with suggestions */}
                <div ref={inputWrapRef} className="relative">
                  <input
                    className={inputBase}
                    placeholder="Email or phone"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    onKeyDown={onEnterLogin}
                    onFocus={() => setShowSuggestions(true)}
                    autoFocus
                    autoComplete="off"
                  />
                  {/* Suggestions dropdown */}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 z-10 mt-1 rounded-md border bg-white dark:bg-neutral-800 dark:text-white shadow">
                      <ul className="max-h-56 overflow-auto text-sm">
                        {filteredSuggestions.map((s, i) => (
                          <li key={s + i}>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setLogin(s);
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-emerald-50 dark:hover:bg-neutral-700"
                            >
                              {s}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <button
                  onClick={sendOtp}
                  className={btnPrimary}
                  disabled={busy || !login.trim()}
                >
                  {busy ? 'Sending…' : 'Send OTP'}
                </button>

                {/* Remember me (does NOT erase saved names when unchecked) */}
                <label className="mt-2 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Remember me on this device
                </label>

                {/* Legal text */}
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div>
                    Pre-registered users only. Need Access? Contact admin at{' '}
                    <a className="text-emerald-700 hover:underline" href="mailto:admin@trinity-pms.example">
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
                  className={`${inputBase} tracking-widest`}
                  placeholder="Enter OTP (000000)"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={onEnterOtp}
                  maxLength={6}
                  autoFocus
                />
                <button
                  onClick={verify}
                  className={btnPrimary}
                  disabled={busy || code.trim().length < 6}
                >
                  {busy ? 'Verifying…' : 'Verify & Continue'}
                </button>
                <button onClick={() => setStep('enter')} className={btnSecondary}>
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
