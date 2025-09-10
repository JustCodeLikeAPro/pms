import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { endpoints } from '../api/endpoints';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [login, setLogin] = useState('');
  const [step, setStep] = useState<'enter' | 'otp'>('enter');
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);

  // UI controls
  const [language, setLanguage] = useState('en');
  const [dark, setDark] = useState(false);

  const nav = useNavigate();

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [dark]);

  const sendOtp = async () => {
    setErr(null);
    if (!login.trim()) return setErr('Enter email or phone');
    try {
      await api.post(endpoints.otpRequest, { login });
      setStep('otp');
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Failed to request OTP');
    }
  };

  const verify = async () => {
    setErr(null);
    try {
      const { data } = await api.post(endpoints.otpVerify, { login, code });
      if (!data.ok) return setErr(data.error || 'Invalid OTP');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      nav('/landing');
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Failed to verify OTP');
    }
  };

  const card = dark ? 'bg-gray-900 text-gray-100 border-gray-700' : 'bg-white text-gray-900 border-gray-200';
  const input = dark
    ? 'bg-gray-800 border-gray-700 placeholder-gray-400 text-gray-100'
    : 'bg-white border-gray-300 placeholder-gray-500 text-gray-900';
  const subtle = dark ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className={dark
      ? 'min-h-screen bg-gray-950'
      : 'min-h-screen bg-gradient-to-br from-lime-100 via-yellow-50 to-emerald-100'}>
      
      {/* Header + hero (TOP) */}
      <header className="w-full">
        <div className="mx-auto max-w-6xl px-6 pt-8 pb-6">
          {/* Brand row + controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <AvaLogo />
              <div>
                <div className="text-2xl font-bold tracking-tight">Trinity PMS</div>
                <div className={`text-sm ${subtle}`}>Empowering Projects</div>
              </div>
            </div>

            {/* Language + mode */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <label className={`text-sm ${subtle}`}>Language</label>
              <select
                className={`text-sm rounded-md px-2 py-1 border ${input}`}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                aria-label="Select language"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="ta">தமிழ் (Tamil)</option>
              </select>

              <button
                type="button"
                onClick={() => setDark((d) => !d)}
                className={`text-sm rounded-md px-3 py-1.5 border transition ${
                  dark ? 'bg-gray-800 border-gray-700' : 'bg-white/70 border-gray-300'
                }`}
                aria-label="Toggle color mode"
                title="Toggle light/dark mode"
              >
                {dark ? 'Dark' : 'Light'} Mode
              </button>
            </div>
          </div>

          {/* Hero text */}
          <div className="mt-8 max-w-3xl space-y-3">
            <h1 className="text-3xl font-semibold leading-snug">
              Experience Next-Level Project Management
              <br />
              Powered by <span className="text-emerald-600 font-bold">Artificial Intelligence</span>
            </h1>
            <p className={`text-base ${subtle}`}>
              Uniting <b>Vision</b>, <b>Design</b> and <b>Execution</b>.
            </p>
            <div className="h-1 w-24 rounded-full bg-emerald-500/80" />
          </div>
        </div>
      </header>

      {/* Auth card */}
      <main className="px-6 pb-12">
        <div className="mx-auto max-w-md">
          <div className={`rounded-2xl border shadow-sm p-6 sm:p-8 space-y-6 ${card}`}>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Sign in</h2>
              <p className={`text-sm ${subtle}`}>Use your registered email or phone number</p>
            </div>

            {step === 'enter' && (
              <div className="space-y-4">
                <label className="block text-sm font-medium">
                  Email or phone
                  <input
                    className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${input}`}
                    placeholder="e.g. pmc@demo.local"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                  />
                </label>

                <button
                  onClick={sendOtp}
                  className="w-full py-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition"
                >
                  Send OTP
                </button>

                <div className="text-xs leading-relaxed">
                  <p className={subtle}>
                    Pre-registered users only. Need Access? Contact admin at{' '}
                    <a className="text-emerald-600 hover:underline" href="mailto:admin@trinity-pms.example">
                      admin@trinity-pms.example
                    </a>
                  </p>
                  <p className={subtle}>
                    By continuing, you agree to our{' '}
                    <a className="text-emerald-600 hover:underline" href="/terms" target="_blank" rel="noreferrer">
                      Terms
                    </a>{' '}
                    and{' '}
                    <a className="text-emerald-600 hover:underline" href="/privacy" target="_blank" rel="noreferrer">
                      Privacy Policy
                    </a>
                    .
                  </p>
                  <p className="text-[11px] mt-2">
                    Dev OTP: <b>000000</b>
                  </p>
                </div>
              </div>
            )}

            {step === 'otp' && (
              <div className="space-y-4">
                <label className="block text-sm font-medium">
                  Enter OTP
                  <input
                    className={`mt-1 block w-full rounded-md border px-3 py-2 tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500 ${input}`}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </label>

                <button
                  onClick={verify}
                  className="w-full py-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition"
                >
                  Verify & Continue
                </button>

                <button
                  onClick={() => setStep('enter')}
                  className={`w-full py-3 rounded-md border font-medium transition ${
                    dark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Back
                </button>

                <div className="text-xs">
                  <p className={subtle}>
                    Didn’t get it? For the demo, OTP is <b>000000</b>.
                  </p>
                </div>
              </div>
            )}

            {err && <div className="text-red-600 text-sm">{err}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

function AvaLogo() {
  return (
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
  );
}
