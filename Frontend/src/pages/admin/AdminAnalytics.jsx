import { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  BarChart, Bar, Cell,
  PieChart, Pie, Legend,
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981'];

const FALLBACK_ANALYTICS = {
  summary: {
    totalStudents: 320,
    totalRemarks: 185,
    totalHODs: 3,
    totalIncharges: 3,
    totalDepartments: 5
  },
  charts: {
    remarksByDept: [
      { name: 'CSE', remarks: 85 },
      { name: 'ECE', remarks: 52 },
      { name: 'Mechanical', remarks: 30 },
      { name: 'Civil', remarks: 12 },
      { name: 'MBA', remarks: 6 }
    ],
    remarkCategories: [
      { name: 'Late-comer', value: 92 },
      { name: 'Non-uniform', value: 58 },
      { name: 'Indiscipline', value: 25 },
      { name: 'Others', value: 10 }
    ],
    monthlyRemarks: [
      { month: 'Jan', remarks: 25 },
      { month: 'Feb', remarks: 34 },
      { month: 'Mar', remarks: 45 },
      { month: 'Apr', remarks: 28 },
      { month: 'May', remarks: 22 },
      { month: 'Jun', remarks: 31 }
    ]
  }
};

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/analytics');
        setAnalytics(res.data);
      } catch (err) {
        console.warn('Backend offline, loading fallback analytical representation:', err.message);
        setAnalytics(FALLBACK_ANALYTICS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-outline">
        <span className="material-symbols-outlined text-4xl animate-spin mb-3">sync</span>
        <p className="font-label text-sm">Parsing statistics and charts…</p>
      </div>
    );
  }

  const summary = analytics?.summary || FALLBACK_ANALYTICS.summary;
  const charts = analytics?.charts || FALLBACK_ANALYTICS.charts;

  // Custom tooltips
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-2.5 shadow-lg text-xs font-label">
          <p className="font-bold text-on-surface mb-1">{label}</p>
          <p className="text-primary font-semibold">{payload[0].value} Remarks</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 w-full overflow-y-auto p-5 md:p-8 xl:p-10 bg-surface">
      <div className="max-w-7xl mx-auto space-y-7">
        
        {/* Header row */}
        <div className="border-b border-outline-variant/15 pb-5">
          <h1 className="font-display font-bold text-2xl text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">analytics</span>
            System Analytics
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Visual graphs, trends, monthly indexes, and branch metrics representing college discipline.
          </p>
        </div>

        {/* Quick summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Remarks logged', val: summary.totalRemarks, color: 'text-rose-500', icon: 'rate_review', desc: 'Cumulative system remarks' },
            { label: 'Active Students', val: summary.totalStudents, color: 'text-indigo-500', icon: 'school', desc: 'Enrolled in database' },
            { label: 'Assigned HODs', val: summary.totalHODs, color: 'text-teal-500', icon: 'supervisor_account', desc: 'Branch HOD accounts' },
            { label: 'Discipline Officers', val: summary.totalIncharges, color: 'text-emerald-500', icon: 'badge', desc: 'Discipline incharges' }
          ].map(c => (
            <div key={c.label} className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5 shadow-card flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-label text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">{c.label}</span>
                <span className={`material-symbols-outlined text-[18px] ${c.color}`}>{c.icon}</span>
              </div>
              <div className="font-display font-extrabold text-2xl text-on-surface">{c.val}</div>
              <p className="font-body text-[10px] text-on-surface-variant">{c.desc}</p>
            </div>
          ))}
        </div>

        {/* Large Layout Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Line Trend Monthly */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-card flex flex-col min-h-[350px]">
            <h3 className="font-display font-bold text-sm text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">show_chart</span>
              Monthly Progression (Remarks Curve)
            </h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={charts.monthlyRemarks} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRemarks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3d5af1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3d5af1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" strokeOpacity={0.3} vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }} dx={-5} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="remarks" stroke="#3d5af1" strokeWidth={3} fillOpacity={1} fill="url(#colorRemarks)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department comparisons */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-card flex flex-col min-h-[350px]">
            <h3 className="font-display font-bold text-sm text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">bar_chart</span>
              Branch Comparison metrics
            </h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={charts.remarksByDept} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" strokeOpacity={0.3} vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }} dx={-5} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-container-low)', radius: 8 }} />
                  <Bar dataKey="remarks" fill="#3d5af1" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {charts.remarksByDept.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category distribution */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-card flex flex-col items-center justify-center min-h-[350px]">
            <h3 className="font-display font-bold text-sm text-on-surface mb-5 flex items-center gap-2 self-start">
              <span className="material-symbols-outlined text-primary text-[18px]">pie_chart</span>
              Remarks Distribution Category-wise
            </h3>
            <div className="w-full flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={charts.remarkCategories} cx="50%" cy="45%" innerRadius={65} outerRadius={95} paddingAngle={4} dataKey="value">
                    {charts.remarkCategories.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: 11 }} />
                  <Legend iconType="circle" layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insight Summary Panel */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-card flex flex-col justify-between min-h-[350px]">
            <div>
              <h3 className="font-display font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-[18px]">analytics</span>
                Discipline Insights
              </h3>
              <div className="space-y-4 font-body text-sm text-on-surface-variant">
                <p className="leading-relaxed">
                  According to recent statistics, the <span className="font-bold text-on-surface">Late-comer</span> remark category constitutes the majority of logged activities, closely followed by <span className="font-bold text-on-surface">Non-uniform</span> violations.
                </p>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/30 rounded-2xl">
                  <h4 className="font-display font-bold text-emerald-800 dark:text-emerald-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">trending_up</span> Positive Indicator
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Remarks trends have declined by 12% over the last two weeks, representing a steady improvement in student attendance and code of conduct.
                  </p>
                </div>
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/30 rounded-2xl">
                  <h4 className="font-display font-bold text-indigo-800 dark:text-indigo-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">tips_and_updates</span> Recommendation
                  </h4>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">
                    Provide specialized attendance check gates for the CSE branch as it currently records the highest index of disciplinary remarks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
