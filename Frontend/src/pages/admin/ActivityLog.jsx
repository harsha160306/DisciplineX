import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/logs');
      setLogs(res.data);
    } catch (err) {
      console.warn('Backend offline, loading mock activity logs:', err.message);
      setLogs([
        { user: 'System Admin', role: 'Admin', action: 'System Initialized and mock seeds verified', date: '19-Jul-2026', time: '08:30 AM' },
        { user: 'System Admin', role: 'Admin', action: 'Added HOD account: Dr. R. Kavitha (CSE)', date: '19-Jul-2026', time: '08:32 AM' },
        { user: 'System Admin', role: 'Admin', action: 'Added HOD account: Dr. S. Rajkumar (ECE)', date: '19-Jul-2026', time: '08:33 AM' },
        { user: 'Dr. R. Kavitha', role: 'HOD', action: 'Added Discipline Incharge: Ms. B. Divya', date: '19-Jul-2026', time: '08:42 AM' },
        { user: 'Ms. B. Divya', role: 'Incharge', action: 'Student registered: Rahul Sharma (2024CS101)', date: '19-Jul-2026', time: '08:50 AM' },
        { user: 'Ms. B. Divya', role: 'Incharge', action: 'Discipline remark logged: Late-comer for 2024CS101', date: '19-Jul-2026', time: '09:00 AM' },
        { user: 'System Admin', role: 'Admin', action: 'Exported department report list to PDF', date: '19-Jul-2026', time: '09:12 AM' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === '' || log.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex-1 w-full overflow-y-auto p-5 md:p-8 xl:p-10 bg-surface">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header row */}
        <div className="border-b border-outline-variant/15 pb-5">
          <h1 className="font-display font-bold text-2xl text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">list_alt</span>
            System Activity Log
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Auditing records of user registrations, generated reports, changed parameters, and system login entries.
          </p>
        </div>

        {/* Filter panel */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search by action description or user name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-on-surface font-body text-sm placeholder:text-outline focus:outline-none"
            />
          </div>
          <div className="relative min-w-[180px]">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">admin_panel_settings</span>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-on-surface font-body text-sm appearance-none focus:outline-none"
            >
              <option value="">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="HOD">HOD</option>
              <option value="Incharge">Incharge</option>
            </select>
            <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">expand_more</span>
          </div>
        </div>

        {/* Log grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-outline">
            <span className="material-symbols-outlined text-4xl animate-spin mb-3">sync</span>
            <p className="font-label text-sm">Querying audit logs trail…</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-12 text-center text-outline">
            <span className="material-symbols-outlined text-5xl mb-3">list_alt</span>
            <p className="font-label font-semibold text-base text-on-surface mb-1">No Activity Logs Found</p>
            <p className="font-body text-sm text-on-surface-variant">Perform some edits or update settings to log actions.</p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/30 font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 font-body text-sm">
                  {filteredLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-4 font-semibold text-on-surface">{log.user}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          log.role === 'Admin' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' :
                          log.role === 'HOD' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' :
                          'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400'
                        }`}>
                          <span className="material-symbols-outlined text-[14px]">
                            {log.role === 'Admin' ? 'admin_panel_settings' : log.role === 'HOD' ? 'supervisor_account' : 'badge'}
                          </span>
                          {log.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-on-surface font-medium leading-relaxed max-w-md">{log.action}</td>
                      <td className="px-6 py-4 text-on-surface-variant font-mono text-xs">{log.date}</td>
                      <td className="px-6 py-4 text-on-surface-variant font-mono text-xs">{log.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
