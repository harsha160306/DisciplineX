import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import api from '../utils/api';

/* ─── Dept colours ─────────────────────────────────────────────── */
const DEPT_COLORS = {
  'CSE':        { from: '#3730a3', to: '#6366f1', icon: 'computer' },
  'ECE':        { from: '#0e7490', to: '#22d3ee', icon: 'electrical_services' },
  'Mechanical': { from: '#92400e', to: '#f59e0b', icon: 'settings' },
  'Civil':      { from: '#064e3b', to: '#10b981', icon: 'architecture' },
  'MBA':        { from: '#4c1d95', to: '#a78bfa', icon: 'business_center' },
};
const PIE_COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#64748b'];

/* ─── Rich example / fallback data ────────────────────────────── */
function buildFallback(dept, hodName) {
  const prefix = dept ? dept.substring(0, 2).toUpperCase() : 'CS';
  return {
    departmentInfo: {
      name: dept || 'CSE',
      academicYear: '2025-2026',
      facultyCount: 4,
      sections: 'A, B, C',
    },
    studentStats: {
      total: 320,
      thisMonth: 12,
      latest: { name: 'Aditya Krishnan', register_number: `2025${prefix}001` },
      byYear: { 'Year I': 80, 'Year II': 85, 'Year III': 78, 'Year IV': 77 },
    },
    remarkStats: {
      total: 51,
      today: 3,
      categories: { 'Non-uniform': 18, 'Late-comer': 26, 'Indiscipline': 5, 'Others': 2 },
    },
    remarkCategories: [
      { name: 'Late-comer',   value: 26 },
      { name: 'Non-uniform',  value: 18 },
      { name: 'Indiscipline', value: 5 },
      { name: 'Others',       value: 2 },
    ],
    monthlyRemarks: [
      { month: 'Jan', remarks: 8 },
      { month: 'Feb', remarks: 14 },
      { month: 'Mar', remarks: 10 },
      { month: 'Apr', remarks: 7 },
      { month: 'May', remarks: 5 },
      { month: 'Jun', remarks: 7 },
    ],
    deptWiseRemarks: [
      { name: dept || 'CSE', remarks: 51 },
      { name: 'ECE',         remarks: 38 },
      { name: 'Mechanical',  remarks: 22 },
      { name: 'Civil',       remarks: 17 },
      { name: 'MBA',         remarks: 9  },
    ],
  };
}

/* ─── Helpers ──────────────────────────────────────────────────── */
const initials = (name = '') => name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();

/* ─── Incharge cards (for non-HOD) ────────────────────────────── */
const INCHARGE_CARDS = [
  { to: '/remark-scanner', icon: 'qr_code_scanner', title: 'Remark Scanner', description: 'Scan a student\'s barcode to record a disciplinary remark instantly.', cta: 'Open Scanner', grad: 'from-indigo-500 to-indigo-700' },
  { to: '/history',        icon: 'monitoring',       title: 'Remarks History', description: "View all the disciplinary remarks you've recorded with detailed history.", cta: 'View History', grad: 'from-teal-500 to-teal-700' },
  { to: '/registration',   icon: 'person_add',       title: 'Enroll Student', description: 'Register a new student by filling in their ID card and academic details.', cta: 'Enroll Now', grad: 'from-emerald-500 to-emerald-700' },
];

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
export default function Home() {
  const { user } = useAppContext();
  const userName  = user?.name       || localStorage.getItem('userName')       || 'User';
  const userRole  = user?.role       || localStorage.getItem('userRole')       || 'Staff';
  const userDept  = user?.department || localStorage.getItem('userDepartment') || '';
  const userEmail = user?.email      || `hod.${(userDept || 'admin').toLowerCase()}@mic.edu`;
  const userPhone = user?.phone      || '+91 98765 43210';
  const lastLogin = user?.lastLogin  || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const isHOD     = userRole?.toLowerCase() === 'hod';

  const deptColor = DEPT_COLORS[userDept] || { from: '#1a1f4e', to: '#3d5af1', icon: 'school' };

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading]             = useState(isHOD);

  const now     = new Date();
  const hour    = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr  = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    if (!isHOD) return;
    (async () => {
      try {
        const res = await api.get('/dashboard/hod');
        const d   = res.data;
        const fb = buildFallback(userDept, userName);
        setDashboardData({
          departmentInfo: {
            name:         d.departmentInfo?.name         || fb.departmentInfo.name,
            academicYear: d.departmentInfo?.academicYear || fb.departmentInfo.academicYear,
            facultyCount: d.departmentInfo?.facultyCount || fb.departmentInfo.facultyCount,
            sections:     d.departmentInfo?.sections     || fb.departmentInfo.sections,
          },
          studentStats: {
            total:     d.studentStats?.total     || fb.studentStats.total,
            thisMonth: d.studentStats?.thisMonth || fb.studentStats.thisMonth,
            latest:    d.studentStats?.latest    || fb.studentStats.latest,
            byYear: {
              'Year I':   d.studentStats?.byYear?.['Year I']   || fb.studentStats.byYear['Year I'],
              'Year II':  d.studentStats?.byYear?.['Year II']  || fb.studentStats.byYear['Year II'],
              'Year III': d.studentStats?.byYear?.['Year III'] || fb.studentStats.byYear['Year III'],
              'Year IV':  d.studentStats?.byYear?.['Year IV']  || fb.studentStats.byYear['Year IV'],
            },
          },
          remarkStats: {
            total:  d.remarkStats?.total  || fb.remarkStats.total,
            today:  d.remarkStats?.today  || fb.remarkStats.today,
            categories: {
              'Non-uniform':  d.remarkStats?.categories?.['Non-uniform']  || fb.remarkStats.categories['Non-uniform'],
              'Late-comer':   d.remarkStats?.categories?.['Late-comer']   || fb.remarkStats.categories['Late-comer'],
              'Indiscipline': d.remarkStats?.categories?.['Indiscipline'] || fb.remarkStats.categories['Indiscipline'],
              'Others':       d.remarkStats?.categories?.['Others']       || fb.remarkStats.categories['Others'],
            },
          },
          remarkCategories: (d.remarkCategories?.length  ? d.remarkCategories  : fb.remarkCategories),
          monthlyRemarks:   (d.monthlyRemarks?.length    ? d.monthlyRemarks    : fb.monthlyRemarks),
          deptWiseRemarks:  (d.deptWiseRemarks?.length   ? d.deptWiseRemarks   : fb.deptWiseRemarks),
        });
      } catch {
        setDashboardData(buildFallback(userDept, userName));
      } finally {
        setLoading(false);
      }
    })();
  }, [isHOD, userDept, userName]);

  /* ── Loading spinner ── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center text-outline">
        <span className="material-symbols-outlined text-4xl animate-spin mb-3">sync</span>
        <p className="font-label text-sm">Loading comprehensive dashboard…</p>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════
     INCHARGE VIEW
  ════════════════════════════════════════════════════════════════ */
  if (!isHOD) {
    return (
      <div className="flex-1 w-full overflow-y-auto">
        <div className="relative overflow-hidden px-6 md:px-12 py-10 md:py-16"
          style={{ background: `linear-gradient(135deg, ${deptColor.from} 0%, ${deptColor.to} 100%)` }}>
          <div className="absolute inset-0 dot-grid opacity-[0.07] pointer-events-none" />
          <div className="relative z-10 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white/80 text-xs font-label font-semibold uppercase tracking-wider mb-4">
              <span className="material-symbols-outlined text-[14px]">{deptColor.icon}</span>
              {userDept || 'Incharge'} Dashboard
            </div>
            <p className="font-label text-white/40 text-xs mb-2 uppercase tracking-widest">{dateStr}</p>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-1.5">
              {greeting}, <span className="text-white/80">{userName}</span> 👋
            </h1>
          </div>
        </div>
        <div className="p-5 md:p-8 xl:p-12">
          <div className="max-w-5xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {INCHARGE_CARDS.map((card) => (
                <div key={card.title} className="group relative bg-surface-container-lowest rounded-2xl overflow-hidden shadow-card hover:-translate-y-1.5 transition-all duration-300 flex flex-col">
                  <div className={`h-1 w-full bg-gradient-to-r ${card.grad}`} />
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[22px] text-primary">{card.icon}</span>
                      </div>
                      <h2 className="font-display font-bold text-[15px] text-on-surface">{card.title}</h2>
                    </div>
                    <p className="font-body text-[13px] text-on-surface-variant flex-1 mb-5">{card.description}</p>
                    <Link to={card.to} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-label font-semibold text-[13px] bg-gradient-to-r ${card.grad} text-white`}>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span> {card.cta}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════
     HOD DASHBOARD
  ════════════════════════════════════════════════════════════════ */
  const stats = dashboardData || buildFallback(userDept, userName);

  /* ── Custom tooltip ── */
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-2.5 shadow-lg text-xs font-label">
          <p className="font-bold text-on-surface mb-1">{label}</p>
          <p className="text-primary font-semibold">{payload[0].value} remarks</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 w-full overflow-y-auto bg-surface">

      {/* ══ Hero Header ══ */}
      <div className="relative overflow-hidden px-6 md:px-10 py-10"
        style={{ background: `linear-gradient(135deg, ${deptColor.from} 0%, ${deptColor.to} 100%)` }}>
        <div className="absolute inset-0 dot-grid opacity-[0.05] pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          {/* Profile */}
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-white/20 p-1 shadow-2xl backdrop-blur-md relative shrink-0">
              <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
                <span className="font-display font-extrabold text-3xl" style={{ color: deptColor.to }}>
                  {initials(userName)}
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 border-4 border-white/10 shadow-lg" title="Online" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white/90 text-xs font-label font-semibold uppercase tracking-wider mb-3">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{deptColor.icon}</span>
                {userDept} · Head of Department
              </div>
              <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-2">
                {greeting}, <span className="text-white/80">{userName}</span> 👤
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/60 text-xs font-label">
                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">email</span>{userEmail}</span>
                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">phone</span>{userPhone}</span>
                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">history</span>Last login: {lastLogin}</span>
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            <p className="font-label text-white/50 text-xs uppercase tracking-widest">{dateStr}</p>
            <div className="flex gap-2 flex-wrap justify-end">
              <Link to="/history"
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-label font-semibold transition-all backdrop-blur-md flex items-center gap-2 border border-white/20">
                <span className="material-symbols-outlined text-[18px]">summarize</span>
                Generate Report
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-8 xl:p-10 max-w-7xl mx-auto space-y-7 pb-12">

        {/* ══ Quick Stats Strip ══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Students',    value: stats.studentStats.total,       icon: 'groups',          color: 'indigo', sub: `${stats.studentStats.thisMonth} this month` },
            { label: 'Total Remarks',     value: stats.remarkStats.total,        icon: 'gavel',           color: 'rose',   sub: `${stats.remarkStats.today} today` },
            { label: 'Incharges',         value: stats.departmentInfo.facultyCount, icon: 'badge',        color: 'violet', sub: 'Discipline faculty' },
            { label: 'Sections',          value: stats.departmentInfo.sections,  icon: 'meeting_room',    color: 'teal',   sub: 'Active sections' },
          ].map(s => (
            <div key={s.label}
              className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-card group hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-label text-[11px] text-on-surface-variant uppercase tracking-widest font-semibold">{s.label}</span>
                <span className={`material-symbols-outlined text-[18px] text-${s.color}-500`}
                  style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              </div>
              <div className="font-display font-extrabold text-2xl text-on-surface">{s.value}</div>
              <div className="font-label text-[11px] text-on-surface-variant">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ══ Row 1: Dept Overview | Student Stats | Remark Stats ══ */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Department Overview */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-card border border-outline-variant/30 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-4 opacity-[0.04] text-on-surface pointer-events-none select-none">
              <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>{deptColor.icon}</span>
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-on-surface mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">corporate_fare</span>
                Department Overview
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Department',       value: stats.departmentInfo.name },
                  { label: 'Academic Year',    value: stats.departmentInfo.academicYear },
                  { label: 'Total Students',   value: stats.studentStats.total },
                  { label: 'Faculty / Incharges', value: stats.departmentInfo.facultyCount },
                  { label: 'Sections',         value: stats.departmentInfo.sections },
                  { label: 'HOD',              value: userName },
                ].map((row, i, arr) => (
                  <div key={row.label}
                    className={`flex justify-between items-center py-2.5 ${i < arr.length - 1 ? 'border-b border-outline-variant/20' : ''}`}>
                    <span className="font-label text-xs text-on-surface-variant">{row.label}</span>
                    <span className="font-display font-semibold text-sm text-on-surface text-right max-w-[55%] truncate">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Student Statistics by Year */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-card border border-outline-variant/30 flex flex-col">
            <h3 className="font-display font-bold text-base text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-500 text-[20px]">groups</span>
              Student Statistics
            </h3>
            <div className="grid grid-cols-1 gap-3 flex-1">
              {[
                { label: 'Year I',   count: stats.studentStats.byYear['Year I'],   icon: 'looks_one',  pct: Math.round(stats.studentStats.byYear['Year I']   / stats.studentStats.total * 100) },
                { label: 'Year II',  count: stats.studentStats.byYear['Year II'],  icon: 'looks_two',  pct: Math.round(stats.studentStats.byYear['Year II']  / stats.studentStats.total * 100) },
                { label: 'Year III', count: stats.studentStats.byYear['Year III'], icon: 'looks_3',    pct: Math.round(stats.studentStats.byYear['Year III'] / stats.studentStats.total * 100) },
                { label: 'Year IV',  count: stats.studentStats.byYear['Year IV'],  icon: 'looks_4',    pct: Math.round(stats.studentStats.byYear['Year IV']  / stats.studentStats.total * 100) },
              ].map(yr => (
                <div key={yr.label}
                  className="flex items-center gap-3 p-3 bg-surface-container rounded-xl border border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">{yr.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-display font-semibold text-sm text-on-surface">{yr.label}</span>
                      <span className="font-label text-xs text-on-surface-variant font-bold">{yr.count} Students</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-700"
                        style={{ width: `${yr.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Remark Statistics */}
          <div className="flex flex-col gap-4">
            <h3 className="font-display font-bold text-base text-on-surface flex items-center gap-2 ml-1">
              <span className="material-symbols-outlined text-rose-500 text-[20px]">gavel</span>
              Remark Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4 flex-1">
              {[
                { label: 'Non-uniform',  count: stats.remarkStats.categories['Non-uniform'],  icon: 'checkroom',  bgCls: 'bg-amber-50 dark:bg-amber-900/20',  iconCls: 'text-amber-600 dark:text-amber-400',  numCls: 'text-amber-700 dark:text-amber-300' },
                { label: 'Late-comer',   count: stats.remarkStats.categories['Late-comer'],   icon: 'schedule',   bgCls: 'bg-rose-50 dark:bg-rose-900/20',    iconCls: 'text-rose-600 dark:text-rose-400',    numCls: 'text-rose-700 dark:text-rose-300' },
                { label: 'Indiscipline', count: stats.remarkStats.categories['Indiscipline'], icon: 'gavel',      bgCls: 'bg-violet-50 dark:bg-violet-900/20', iconCls: 'text-violet-600 dark:text-violet-400', numCls: 'text-violet-700 dark:text-violet-300' },
                { label: 'Others',       count: stats.remarkStats.categories['Others'],       icon: 'more_horiz', bgCls: 'bg-slate-50 dark:bg-slate-800/30',  iconCls: 'text-slate-600 dark:text-slate-400',  numCls: 'text-slate-700 dark:text-slate-300' },
              ].map(stat => (
                <div key={stat.label}
                  className="bg-surface-container-lowest rounded-2xl p-5 shadow-card border border-outline-variant/30 flex flex-col items-center justify-center text-center hover:-translate-y-0.5 transition-all duration-200">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bgCls} ${stat.iconCls} flex items-center justify-center mb-3`}>
                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                  </div>
                  <div className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold mb-1">{stat.label}</div>
                  <div className={`font-display font-extrabold text-2xl ${stat.numCls}`}>{stat.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ Row 2: Charts ══ */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Monthly Remarks Bar Chart */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-card border border-outline-variant/30 flex flex-col min-h-[320px]">
            <h3 className="font-display font-bold text-base text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">bar_chart</span>
              Monthly Remarks
            </h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.monthlyRemarks} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-outline-variant)" strokeOpacity={0.4} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }} dx={-5} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-container-low)', radius: 8 }} />
                  <Bar dataKey="remarks" fill={deptColor.to} radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Remark Categories Pie Chart */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-card border border-outline-variant/30 flex flex-col min-h-[320px]">
            <h3 className="font-display font-bold text-base text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">pie_chart</span>
              Remark Categories
            </h3>
            <div className="flex-1 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.remarkCategories} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                    {stats.remarkCategories.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department-wise Comparison */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-card border border-outline-variant/30 flex flex-col min-h-[320px]">
            <h3 className="font-display font-bold text-base text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500 text-[20px]">compare_arrows</span>
              Department-wise Remarks
            </h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.deptWiseRemarks} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-outline-variant)" strokeOpacity={0.4} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }} width={70} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: 12 }} />
                  <Bar dataKey="remarks" radius={[0, 6, 6, 0]} maxBarSize={18}>
                    {stats.deptWiseRemarks.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === userDept ? deptColor.to : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
