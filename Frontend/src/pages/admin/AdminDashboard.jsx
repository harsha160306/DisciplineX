import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import {
  BarChart, Bar, Cell,
  PieChart, Pie, Legend,
  LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import api from '../../utils/api';

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

const FALLBACK_ACTIVITIES = [
  { user: 'System Admin', role: 'Admin', action: 'HOD Dr. R. Kavitha added to system', date: '19-Jul-2026', time: '08:30 AM' },
  { user: 'System Admin', role: 'Admin', action: 'Incharge Ms. B. Divya added to CSE', date: '19-Jul-2026', time: '08:32 AM' },
  { user: 'Dr. R. Kavitha', role: 'HOD', action: 'Generated Monthly remarks report', date: '19-Jul-2026', time: '08:45 AM' },
  { user: 'Mr. A. Senthil', role: 'Incharge', action: 'Student registered: Rahul Sharma', date: '19-Jul-2026', time: '08:50 AM' },
];

export default function AdminDashboard() {
  const { user } = useAppContext();
  const [analytics, setAnalytics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    (async () => {
      try {
        const [analyticsRes, logsRes] = await Promise.all([
          api.get('/admin/analytics'),
          api.get('/admin/logs')
        ]);
        setAnalytics(analyticsRes.data);
        setActivities(logsRes.data.slice(0, 5));
      } catch (err) {
        console.warn('Backend unavailable, rendering premium fallback analytics data:', err.message);
        setAnalytics(FALLBACK_ANALYTICS);
        setActivities(FALLBACK_ACTIVITIES);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-outline">
        <span className="material-symbols-outlined text-4xl animate-spin mb-3">sync</span>
        <p className="font-label text-sm">Loading admin dashboard analytics…</p>
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
    <div className="flex-1 w-full overflow-y-auto bg-surface">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-6 md:px-10 py-10"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #022c22 100%)' }}>
        <div className="absolute inset-0 dot-grid opacity-[0.05] pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white/90 text-xs font-label font-semibold uppercase tracking-wider mb-3">
              <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
              System Administrator Portal
            </div>
            <p className="font-label text-white/50 text-xs mb-2 uppercase tracking-widest">{dateStr}</p>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-2">
              {greeting}, <span className="text-white/80">{user?.name || 'Admin'}</span> 👋
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-white/60 text-xs font-label mt-3">
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">email</span>{user?.email || 'admin@mic.edu'}</span>
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">badge</span>ID: {user?.employee_id || 'ADM001'}</span>
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">network_ping</span>Status: Active</span>
            </div>
          </div>
          <div className="shrink-0 flex gap-2.5">
            <Link to="/admin/reports" className="px-5 py-2.5 rounded-xl brand-gradient text-white text-sm font-label font-semibold shadow-brand-sm hover:shadow-brand transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">summarize</span>
              Generate Reports
            </Link>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-8 xl:p-10 max-w-7xl mx-auto space-y-8 pb-12">
        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total HODs', value: summary.totalHODs, icon: 'supervisor_account', color: 'indigo', path: '/admin/hods' },
            { label: 'Total Incharges', value: summary.totalIncharges, icon: 'badge', color: 'teal', path: '/admin/incharges' },
            { label: 'Departments', value: summary.totalDepartments, icon: 'corporate_fare', color: 'amber', path: '/admin/departments' },
            { label: 'Total Students', value: summary.totalStudents, icon: 'school', color: 'violet', path: '/admin/students' },
            { label: 'Total Remarks', value: summary.totalRemarks, icon: 'rate_review', color: 'rose', path: '/admin/remarks' },
          ].map(s => (
            <Link key={s.label} to={s.path}
              className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-card hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-2 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="font-label text-[11px] text-on-surface-variant uppercase tracking-widest font-semibold">{s.label}</span>
                <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>{s.icon}</span>
              </div>
              <div className="font-display font-extrabold text-3xl text-on-surface">{s.value}</div>
              <div className="font-label text-[10px] text-primary group-hover:underline flex items-center gap-1 mt-1">
                Manage <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Remarks by Department */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-card border border-outline-variant/30 flex flex-col min-h-[320px]">
            <h3 className="font-display font-bold text-base text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">bar_chart</span>
              Remarks by Department
            </h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.remarksByDept} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-outline-variant)" strokeOpacity={0.4} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }} dx={-5} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-container-low)', radius: 8 }} />
                  <Bar dataKey="remarks" fill="#3d5af1" radius={[6, 6, 0, 0]} maxBarSize={36}>
                    {charts.remarksByDept.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Remark Categories */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-card border border-outline-variant/30 flex flex-col min-h-[320px]">
            <h3 className="font-display font-bold text-base text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">pie_chart</span>
              Remark Categories
            </h3>
            <div className="flex-1 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={charts.remarkCategories} cx="50%" cy="40%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
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

          {/* Monthly Remarks */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-card border border-outline-variant/30 flex flex-col min-h-[320px]">
            <h3 className="font-display font-bold text-base text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">show_chart</span>
              Monthly Remarks Trend
            </h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={charts.monthlyRemarks} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" strokeOpacity={0.3} vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }} dx={-5} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="remarks" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Section: Recent Activity & Notifications */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-3xl p-6 shadow-card border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-display font-bold text-base text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">list_alt</span>
                  Recent System Activities
                </h3>
                <Link to="/admin/activity-log" className="font-label text-xs text-primary font-bold hover:underline flex items-center gap-0.5">
                  View Full Log <span className="material-symbols-outlined text-[14px]">arrow_right_alt</span>
                </Link>
              </div>
              <div className="space-y-3.5">
                {activities.map((act, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-surface-container-low hover:bg-surface-container transition-colors rounded-xl border border-outline-variant/10">
                    <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center text-white shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-[16px]">
                        {act.role === 'Admin' ? 'admin_panel_settings' : act.role === 'HOD' ? 'supervisor_account' : 'badge'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[13px] text-on-surface leading-tight">{act.action}</p>
                      <div className="flex gap-2 items-center text-[10px] text-on-surface-variant mt-1.5 font-label">
                        <span className="font-semibold text-primary">{act.user} ({act.role})</span>
                        <span>·</span>
                        <span>{act.date} at {act.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Notifications */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-card border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-on-surface mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">notifications</span>
                System Notifications
              </h3>
              <div className="space-y-4">
                {[
                  { text: 'New HOD added: Dr. M. Priya (Mechanical)', type: 'success', time: '10 mins ago', icon: 'person_add' },
                  { text: 'Discipline remark logged by Mr. A. Senthil', type: 'info', time: '25 mins ago', icon: 'rate_review' },
                  { text: 'System settings updated by Admin', type: 'warning', time: '1 hour ago', icon: 'settings' },
                  { text: 'New Incharge registered for ECE department', type: 'success', time: '3 hours ago', icon: 'badge' },
                  { text: 'PDF reports downloaded successfully', type: 'info', time: 'Yesterday', icon: 'file_download' },
                ].map((notif, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      notif.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' :
                      notif.type === 'warning' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600' :
                      'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600'
                    }`}>
                      <span className="material-symbols-outlined text-[16px]">{notif.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[13px] text-on-surface leading-snug">{notif.text}</p>
                      <span className="font-label text-[10px] text-on-surface-variant block mt-0.5">{notif.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
