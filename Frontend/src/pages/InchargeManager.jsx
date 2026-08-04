import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import { useAppContext } from '../context/AppContext';

const DEPT_ACCENT = {
  'CSE':        { from: '#3730a3', to: '#6366f1', icon: 'computer', label: 'Computer Science & Engineering' },
  'ECE':        { from: '#0e7490', to: '#22d3ee', icon: 'electrical_services', label: 'Electronics & Communication' },
  'Mechanical': { from: '#92400e', to: '#f59e0b', icon: 'settings', label: 'Mechanical Engineering' },
  'Civil':      { from: '#064e3b', to: '#10b981', icon: 'architecture', label: 'Civil Engineering' },
  'MBA':        { from: '#4c1d95', to: '#a78bfa', icon: 'business_center', label: 'Master of Business Admin.' },
};

export default function InchargeManager() {
  const { user } = useAppContext();
  const department = user?.department || localStorage.getItem('userDepartment') || '';
  const accent = DEPT_ACCENT[department] || { from: '#1e3a5f', to: '#3d5af1', icon: 'group', label: department };

  const [incharges, setIncharges] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState({
    name: '', username: '', password: '', phone: '', employee_id: ''
  });
  const [errors, setErrors] = useState({});

  // ── Fallback incharge list if API is unavailable ─────────────────────────
  const FALLBACK_INCHARGES = {
    'CSE': [
      { id: 4, name: 'Mr. A. Senthil',  username: 'incharge_cse1', department: 'CSE', phone: '9500012001', employee_id: 'INC001' },
      { id: 5, name: 'Ms. B. Divya',    username: 'incharge_cse2', department: 'CSE', phone: '9500012002', employee_id: 'INC002' },
    ],
    'ECE': [
      { id: 6, name: 'Mr. C. Rajan',    username: 'incharge_ece1', department: 'ECE', phone: '9500012003', employee_id: 'INC003' },
    ],
  };

  const fetchIncharges = async () => {
    setIsFetching(true);
    try {
      const res = await api.get('/auth/incharges');
      setIncharges(res.data.incharges || []);
    } catch (err) {
      console.warn('API error, using fallback incharges');
      setIncharges(FALLBACK_INCHARGES[department] || []);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => { fetchIncharges(); }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = 'Full name is required';
    if (!form.username.trim()) e.username = 'Username is required';
    if (!form.password.trim()) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.phone && !/^\d{10}$/.test(form.phone)) e.phone = 'Enter valid 10-digit phone';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await api.post('/auth/incharge', form);
      toast.success(`Incharge "${form.name}" added to ${department} department!`);
      setForm({ name: '', username: '', password: '', phone: '', employee_id: '' });
      setShowModal(false);
      fetchIncharges();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create incharge.';
      if (msg.includes('already')) toast.error('Username already exists. Try a different one.');
      else toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const initials = (name) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex-1 w-full overflow-y-auto">

      {/* ── Premium Hero Header ─────────────────────────────────── */}
      <div
        className="relative overflow-hidden px-6 md:px-12 py-10 md:py-14"
        style={{ background: `linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 100%)` }}
      >
        <div className="absolute inset-0 dot-grid opacity-[0.08] pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white/80 text-xs font-label font-semibold uppercase tracking-wider mb-4">
                <span className="material-symbols-outlined text-[14px]">group</span>
                {department} Department
              </div>
              <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-2">
                Incharge Management
              </h1>
              <p className="font-body text-white/60 text-sm md:text-base">
                {accent.label} · Manage incharge staff accounts
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="self-start md:self-auto flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white text-gray-900 font-label font-bold text-sm hover:bg-white/90 transition-all shadow-lg shrink-0 active:scale-[.97]"
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
              Add Incharge
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-10 space-y-8">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Incharges', value: incharges.length,                  icon: 'group',         color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
            { label: 'Department',      value: department,                         icon: 'domain',        color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40' },
            { label: 'Active Today',    value: incharges.length > 0 ? 'Yes' : '—',icon: 'verified',      color: 'text-emerald-600 dark:text-emerald-400',bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
          ].map(stat => (
            <div key={stat.label} className="bg-surface-container-lowest rounded-2xl p-4 shadow-card border border-outline-variant/10 flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined text-[20px] ${stat.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
              </div>
              <div className="min-w-0">
                <div className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">{stat.label}</div>
                <div className="font-display font-bold text-[16px] text-on-surface truncate">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Incharge List */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl brand-gradient flex items-center justify-center shadow-brand-sm">
                <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
              </div>
              <div>
                <h2 className="font-display font-bold text-[15px] text-on-surface">Incharges — {department}</h2>
                <p className="font-label text-[11px] text-on-surface-variant">{incharges.length} staff member{incharges.length !== 1 ? 's' : ''} assigned</p>
              </div>
            </div>
            <button
              onClick={fetchIncharges}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-label font-semibold text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container transition-all"
            >
              <span className={`material-symbols-outlined text-[14px] ${isFetching ? 'animate-spin' : ''}`}>refresh</span>
              Refresh
            </button>
          </div>

          {isFetching ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-4xl text-outline animate-spin">sync</span>
                <p className="font-label text-sm text-on-surface-variant">Loading incharges…</p>
              </div>
            </div>
          ) : incharges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950/40 dark:to-violet-950/40 flex items-center justify-center mb-4 mx-auto">
                <span className="material-symbols-outlined text-4xl text-indigo-500" style={{ fontVariationSettings: "'FILL' 1" }}>group_add</span>
              </div>
              <h3 className="font-display font-bold text-lg text-on-surface mb-1">No Incharges Yet</h3>
              <p className="font-body text-on-surface-variant text-sm max-w-xs leading-relaxed mb-5">
                No incharge staff have been assigned to the {department} department yet.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl brand-gradient text-white font-label font-semibold text-sm shadow-brand-sm hover:opacity-90 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                Add First Incharge
              </button>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/10">
              {incharges.map((inc, idx) => (
                <div
                  key={inc.id || idx}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container/40 transition-colors group"
                >
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-display font-bold text-sm text-white shrink-0 shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}
                  >
                    {initials(inc.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-[14px] text-on-surface truncate">{inc.name}</div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      <span className="font-label text-[11px] text-on-surface-variant">@{inc.username}</span>
                      {inc.employee_id && (
                        <span className="font-label text-[11px] text-on-surface-variant">#{inc.employee_id}</span>
                      )}
                    </div>
                  </div>

                  {/* Meta badges */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    {inc.phone && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/20 text-[11px] font-label text-on-surface-variant">
                        <span className="material-symbols-outlined text-[13px]">phone</span>
                        {inc.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30 text-[11px] font-label text-emerald-700 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Add Incharge Modal ─────────────────────────────────────────── */}
      <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300 p-4 ${showModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`bg-surface-container-lowest rounded-3xl w-full max-w-md shadow-2xl border border-outline-variant/20 transform transition-all duration-300 overflow-hidden ${showModal ? 'scale-100 translate-y-0' : 'scale-95 translate-y-6'}`}>

          {/* Modal Header */}
          <div
            className="px-6 py-5 flex items-center justify-between"
            style={{ background: `linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 100%)` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
              </div>
              <div>
                <h3 className="font-display font-bold text-[16px] text-white">Add New Incharge</h3>
                <p className="font-label text-[11px] text-white/60">{department} Department</p>
              </div>
            </div>
            <button
              onClick={() => { setShowModal(false); setForm({ name: '', username: '', password: '', phone: '', employee_id: '' }); setErrors({}); }}
              className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Modal Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {/* Name */}
            <div>
              <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Full Name *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">person</span>
                <input
                  type="text"
                  placeholder="e.g. Mr. A. Kumar"
                  value={form.name}
                  onChange={e => handleFieldChange('name', e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 bg-surface border rounded-xl font-body text-on-surface text-sm placeholder:text-outline focus:outline-none transition-all ${errors.name ? 'border-red-400 focus:ring-red-400/20' : 'border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/15'}`}
                />
              </div>
              {errors.name && <p className="mt-1 text-[11px] text-red-500 font-label">{errors.name}</p>}
            </div>

            {/* Username */}
            <div>
              <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Username *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">alternate_email</span>
                <input
                  type="text"
                  placeholder="e.g. incharge_cse3"
                  value={form.username}
                  onChange={e => handleFieldChange('username', e.target.value.toLowerCase().replace(/\s/g, '_'))}
                  className={`w-full pl-11 pr-4 py-3 bg-surface border rounded-xl font-body text-on-surface text-sm placeholder:text-outline focus:outline-none transition-all ${errors.username ? 'border-red-400' : 'border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/15'}`}
                />
              </div>
              {errors.username && <p className="mt-1 text-[11px] text-red-500 font-label">{errors.username}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Password *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">lock</span>
                <input
                  type="text"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={e => handleFieldChange('password', e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 bg-surface border rounded-xl font-body text-on-surface text-sm placeholder:text-outline focus:outline-none transition-all ${errors.password ? 'border-red-400' : 'border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/15'}`}
                />
              </div>
              {errors.password && <p className="mt-1 text-[11px] text-red-500 font-label">{errors.password}</p>}
            </div>

            {/* Phone + Employee ID (2 cols) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Phone</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">phone</span>
                  <input
                    type="tel"
                    placeholder="10-digit"
                    value={form.phone}
                    onChange={e => handleFieldChange('phone', e.target.value)}
                    className={`w-full pl-10 pr-3 py-3 bg-surface border rounded-xl font-body text-on-surface text-sm placeholder:text-outline focus:outline-none transition-all ${errors.phone ? 'border-red-400' : 'border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/15'}`}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-[11px] text-red-500 font-label">{errors.phone}</p>}
              </div>
              <div>
                <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Employee ID</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">badge</span>
                  <input
                    type="text"
                    placeholder="e.g. INC004"
                    value={form.employee_id}
                    onChange={e => handleFieldChange('employee_id', e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-3 py-3 bg-surface border border-outline-variant/30 rounded-xl font-body text-on-surface text-sm placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Department note */}
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/30">
              <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
              <span className="font-label text-xs text-indigo-700 dark:text-indigo-300">
                This incharge will be assigned to the <strong>{department}</strong> department automatically.
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setShowModal(false); setErrors({}); setForm({ name: '', username: '', password: '', phone: '', employee_id: '' }); }}
                className="flex-1 py-3 rounded-xl border border-outline-variant/30 font-label font-semibold text-sm text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl brand-gradient text-white font-label font-bold text-sm shadow-brand-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-[.97]"
              >
                {isSubmitting ? (
                  <><span className="material-symbols-outlined animate-spin text-[16px]">sync</span> Adding…</>
                ) : (
                  <><span className="material-symbols-outlined text-[16px]">person_add</span> Add Incharge</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
