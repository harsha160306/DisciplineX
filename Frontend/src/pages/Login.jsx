import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';

const CREDENTIALS = {
  Admin: [
    { name: 'System Admin', username: 'admin', password: 'Admin@123', dept: 'ALL', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200/60 dark:border-emerald-800/30' }
  ],
  HOD: [
    { name: 'Dr. R. Kavitha',  username: 'hod_cse',  password: 'HOD@cse123',  dept: 'CSE',        color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-200/60 dark:border-indigo-800/30' },
    { name: 'Dr. S. Rajkumar', username: 'hod_ece',  password: 'HOD@ece123',  dept: 'ECE',        color: 'text-teal-600',   bg: 'bg-teal-50 dark:bg-teal-950/40',     border: 'border-teal-200/60 dark:border-teal-800/30' },
    { name: 'Dr. M. Priya',    username: 'hod_mech', password: 'HOD@mech123', dept: 'Mechanical', color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950/40',   border: 'border-amber-200/60 dark:border-amber-800/30' },
  ],
  Incharge: [
    { name: 'Mr. A. Senthil', username: 'incharge_cse1', password: 'Inc@cse1', dept: 'CSE', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-200/60 dark:border-indigo-800/30' },
    { name: 'Ms. B. Divya',   username: 'incharge_cse2', password: 'Inc@cse2', dept: 'CSE', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/40', border: 'border-violet-200/60 dark:border-violet-800/30' },
    { name: 'Mr. C. Rajan',   username: 'incharge_ece1', password: 'Inc@ece1', dept: 'ECE', color: 'text-teal-600',   bg: 'bg-teal-50 dark:bg-teal-950/40',     border: 'border-teal-200/60 dark:border-teal-800/30' },
  ],
};

export default function Login() {
  const [role,         setRole        ] = useState('');
  const [username,     setUsername    ] = useState('');
  const [password,     setPassword    ] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading   ] = useState(false);
  const [error,        setError       ] = useState(false);
  const [showCreds,    setShowCreds   ] = useState(false);
  const navigate = useNavigate();
  const { login } = useAppContext();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(false);
    setIsLoading(true);
    try {
      const safeRole = role?.trim();
      const safeUsername = username?.trim();
      const response = await api.post('/auth/login', { role: safeRole, username: safeUsername, password });
      const { user, token } = response.data;
      login(user, token);
      toast.success(`Welcome, ${user.name}!`);
      if (user.role === 'Admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/home');
      }
    } catch (err) {
      console.error(err);
      setError(true);
      toast.error(err.response?.data?.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickFill = (cred, credRole) => {
    setRole(credRole);
    setUsername(cred.username);
    setPassword(cred.password);
  };

  return (
    <div className="min-h-screen w-full flex bg-surface">

      {/* ── Left panel ──────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[42%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(155deg, #0f1535 0%, #1a1f4e 45%, #0f2027 100%)' }}
      >
        <div className="absolute inset-0 dot-grid opacity-[0.06] pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 right-0 w-72 h-72 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="flex-1 flex flex-col items-center justify-center p-12 relative z-10">
          <div className="w-full max-w-sm">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl brand-gradient flex items-center justify-center mx-auto mb-8 shadow-brand">
              <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
            </div>

            <h1 className="font-display text-3xl font-bold text-white mb-3 tracking-tight text-center">
              DisciplineX
            </h1>
            <p className="font-body text-white/50 text-[14px] leading-relaxed mb-10 text-center">
              A modern portal for managing student discipline, daily attendance, and academic remarks.
            </p>

            {/* Features */}
            {[
              { icon: 'manage_search',  text: 'Student search by register number' },
              { icon: 'rate_review',    text: 'Disciplinary remark logging' },
              { icon: 'monitoring',     text: 'Department-wise HOD dashboard' },
              { icon: 'manage_accounts',text: 'HOD incharge management' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white/70 text-[16px]">{f.icon}</span>
                </div>
                <span className="font-label text-[13px] text-white/50 font-medium">{f.text}</span>
              </div>
            ))}

            {/* Quick Credentials Box */}
            <div className="mt-8 p-4 rounded-2xl bg-white/[0.06] border border-white/10">
              <button
                onClick={() => setShowCreds(!showCreds)}
                className="w-full flex items-center justify-between text-white/60 hover:text-white/80 transition-colors"
              >
                <span className="font-label text-[12px] font-semibold uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">key</span>
                  Test Credentials
                </span>
                <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${showCreds ? 'rotate-180' : ''}`}>expand_more</span>
              </button>

              <div className={`overflow-hidden transition-all duration-400 ${showCreds ? 'max-h-[600px] mt-4' : 'max-h-0'}`}>
                {/* Admin */}
                <p className="font-label text-[10px] text-white/40 uppercase tracking-widest mb-2">Admin Account</p>
                <div className="space-y-1.5 mb-4">
                  {CREDENTIALS.Admin.map(c => (
                    <button
                      key={c.username}
                      onClick={() => quickFill(c, 'Admin')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] transition-all text-left"
                    >
                      <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center font-display font-bold text-white text-[10px] shrink-0">
                        A
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-label font-semibold text-[11px] text-white/80 truncate">{c.name}</div>
                        <div className="font-label text-[10px] text-white/40">{c.dept} · {c.username}</div>
                      </div>
                      <span className="material-symbols-outlined text-white/30 text-[14px]">arrow_forward</span>
                    </button>
                  ))}
                </div>
                {/* HOD */}
                <p className="font-label text-[10px] text-white/40 uppercase tracking-widest mb-2">HOD Accounts</p>
                <div className="space-y-1.5 mb-4">
                  {CREDENTIALS.HOD.map(c => (
                    <button
                      key={c.username}
                      onClick={() => quickFill(c, 'HOD')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] transition-all text-left"
                    >
                      <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center font-display font-bold text-white text-[10px] shrink-0">
                        {c.dept.slice(0,1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-label font-semibold text-[11px] text-white/80 truncate">{c.name}</div>
                        <div className="font-label text-[10px] text-white/40">{c.dept} · {c.username}</div>
                      </div>
                      <span className="material-symbols-outlined text-white/30 text-[14px]">arrow_forward</span>
                    </button>
                  ))}
                </div>
                {/* Incharge */}
                <p className="font-label text-[10px] text-white/40 uppercase tracking-widest mb-2">Incharge Accounts</p>
                <div className="space-y-1.5">
                  {CREDENTIALS.Incharge.map(c => (
                    <button
                      key={c.username}
                      onClick={() => quickFill(c, 'Incharge')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] transition-all text-left"
                    >
                      <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center font-display font-bold text-white text-[10px] shrink-0">
                        {c.dept.slice(0,1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-label font-semibold text-[11px] text-white/80 truncate">{c.name}</div>
                        <div className="font-label text-[10px] text-white/40">{c.dept} · {c.username}</div>
                      </div>
                      <span className="material-symbols-outlined text-white/30 text-[14px]">arrow_forward</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="px-12 py-5 border-t border-white/[0.06]">
          <p className="font-label text-[11px] text-white/20 uppercase tracking-widest text-center">
            © {new Date().getFullYear()} DisciplineX
          </p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-14 relative bg-surface">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl brand-gradient flex items-center justify-center mx-auto mb-4 shadow-brand">
            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-on-surface">DisciplineX</h1>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-on-surface mb-1.5 tracking-tight">Sign in to your account</h2>
            <p className="font-body text-on-surface-variant text-sm">Enter your credentials to access the staff portal.</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-6 px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 flex items-center gap-3 animate-shake">
              <span className="material-symbols-outlined text-red-500 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              <span className="font-label text-[13px] font-medium text-red-700 dark:text-red-400">
                Invalid role, username, or password.
              </span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">

            {/* Role */}
            <div>
              <label className="block font-label text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5" htmlFor="role">Role</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">badge</span>
                <select
                  id="role" name="role" required
                  value={role} onChange={e => setRole(e.target.value)}
                  className="w-full pl-11 pr-10 py-3.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-on-surface font-body text-sm appearance-none focus:outline-none transition-all"
                >
                  <option value="" disabled>Select your role</option>
                  <option value="Admin">Admin</option>
                  <option value="HOD">HOD</option>
                  <option value="Incharge">Incharge</option>
                </select>
                <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block font-label text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5" htmlFor="username">Username</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">person</span>
                <input
                  id="username" name="username" type="text" required
                  placeholder="Enter your username"
                  value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-on-surface font-body text-sm placeholder:text-outline focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-label text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5" htmlFor="password">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">lock</span>
                <input
                  id="password" name="password" required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-on-surface font-body text-sm placeholder:text-outline focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 brand-gradient text-white font-label font-bold text-sm rounded-xl shadow-brand-sm hover:shadow-brand hover:opacity-95 transition-all active:scale-[.98] flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <><span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Signing in…</>
              ) : (
                <><span className="material-symbols-outlined text-[18px]">login</span> Sign In</>
              )}
            </button>
          </form>

          {/* Mobile creds panel */}
          <div className="lg:hidden mt-8 p-4 rounded-2xl bg-surface-container border border-outline-variant/20">
            <button
              onClick={() => setShowCreds(!showCreds)}
              className="w-full flex items-center justify-between text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="font-label text-[12px] font-semibold uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">key</span>
                Test Credentials
              </span>
              <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${showCreds ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            <div className={`overflow-hidden transition-all duration-400 ${showCreds ? 'max-h-[400px] mt-4' : 'max-h-0'}`}>
              {['Admin', 'HOD', 'Incharge'].map(credRole => (
                <div key={credRole} className="mb-4">
                  <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest mb-2">{credRole}</p>
                  <div className="space-y-1.5">
                    {CREDENTIALS[credRole].map(c => (
                      <button
                        key={c.username}
                        onClick={() => { quickFill(c, credRole); setShowCreds(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border ${c.bg} ${c.border} hover:opacity-90 transition-all text-left`}
                      >
                        <div className={`font-label font-bold text-[10px] ${c.color} min-w-0 flex-1`}>
                          <div className="truncate font-semibold text-[11px]">{c.name} · {c.dept}</div>
                          <div className="text-on-surface-variant">{c.username}</div>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant text-[14px]">arrow_forward</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center font-label text-[11px] text-outline uppercase tracking-widest">
            © {new Date().getFullYear()} DisciplineX · Secure Portal
          </p>
        </div>
      </div>
    </div>
  );
}
