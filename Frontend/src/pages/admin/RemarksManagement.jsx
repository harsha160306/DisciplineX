import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import { exportToExcel, exportToPDF, exportToWord } from '../../utils/exporter';

const DEPT_OPTIONS = ['CSE', 'ECE', 'Mechanical', 'Civil', 'MBA'];
const CATEGORY_OPTIONS = ['Late-comer', 'Non-uniform', 'Indiscipline', 'Others'];

export default function RemarksManagement() {
  const [remarks, setRemarks] = useState([]);
  const [depts, setDepts] = useState(DEPT_OPTIONS);
  const [categories, setCategories] = useState(CATEGORY_OPTIONS);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDept, setFilterDept] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const fetchRemarks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/remarks', {
        params: {
          department: filterDept,
          academic_year: filterYear,
          month: filterMonth,
          student: filterStudent,
          remark_category: filterCategory
        }
      });
      setRemarks(res.data);
    } catch (err) {
      console.warn('Backend offline, using fallback remarks mock data:', err.message);
      // Seed default remarks
      setRemarks([
        { id: 1, student_id: 1, remark_text: 'Late-comer', recorded_by: 4, created_at: '2026-07-19T09:00:00.000Z', student_name: 'Rahul Sharma', register_number: '2024CS101', department: 'CSE', academic_year: '3rd Year', recorder_name: 'Mr. A. Senthil', recorder_role: 'Incharge' },
        { id: 2, student_id: 2, remark_text: 'Non-uniform', recorded_by: 5, created_at: '2026-07-18T10:15:00.000Z', student_name: 'Anjali Verma', register_number: '2024ME045', department: 'Mechanical', academic_year: '2nd Year', recorder_name: 'Ms. B. Divya', recorder_role: 'Incharge' },
        { id: 3, student_id: 1, remark_text: 'Late-comer', recorded_by: 4, created_at: '2026-07-17T09:05:00.000Z', student_name: 'Rahul Sharma', register_number: '2024CS101', department: 'CSE', academic_year: '3rd Year', recorder_name: 'Mr. A. Senthil', recorder_role: 'Incharge' },
        { id: 4, student_id: 3, remark_text: 'Indiscipline', recorded_by: 2, created_at: '2026-07-15T11:30:00.000Z', student_name: 'Priya Patel', register_number: '2024CS102', department: 'CSE', academic_year: '1st Year', recorder_name: 'Dr. S. Rajkumar', recorder_role: 'HOD' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/admin/departments');
      if (res.data && res.data.length > 0) {
        setDepts(res.data.map(d => d.name));
      }
    } catch (_) {}
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      if (res.data?.remark_categories) {
        setCategories(res.data.remark_categories.split(',').map(s => s.trim()));
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchRemarks();
  }, [filterDept, filterYear, filterMonth, filterStudent, filterCategory]);

  useEffect(() => {
    fetchDepartments();
    fetchSettings();
  }, []);

  const handleDeleteRemark = async (id) => {
    if (!window.confirm('Are you sure you want to delete this remark? This action is permanent.')) return;
    try {
      await api.delete(`/admin/remarks/${id}`);
      toast.success('Remark deleted successfully.');
      fetchRemarks();
    } catch (err) {
      toast.error('Failed to delete remark.');
    }
  };

  const clearFilters = () => {
    setFilterDept('');
    setFilterYear('');
    setFilterMonth('');
    setFilterStudent('');
    setFilterCategory('');
  };

  // Export handlers
  const getExportData = () => {
    const headers = ['Register Number', 'Student Name', 'Department', 'Academic Year', 'Remark Category', 'Recorded By', 'Date'];
    const rows = remarks.map(r => [
      r.register_number,
      r.student_name,
      r.department,
      r.academic_year,
      r.remark_text,
      `${r.recorder_name} (${r.recorder_role || 'Staff'})`,
      new Date(r.created_at).toLocaleDateString('en-IN')
    ]);
    return { headers, rows };
  };

  const handleExport = (format) => {
    const { headers, rows } = getExportData();
    const title = 'Student Disciplinary Remarks Report';
    const name = `remarks_report_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'excel') exportToExcel(headers, rows, name);
    if (format === 'pdf') exportToPDF(title, headers, rows, name);
    if (format === 'word') exportToWord(title, headers, rows, name);
    
    // Log log trigger
    api.post('/admin/logs', { action: `Exported filtered remarks list to ${format.toUpperCase()}` }).catch(() => {});
    toast.success(`Exported list in ${format.toUpperCase()} format.`);
  };

  return (
    <div className="flex-1 w-full overflow-y-auto p-5 md:p-8 xl:p-10 bg-surface">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/15 pb-5">
          <div>
            <h1 className="font-display font-bold text-2xl text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]">rate_review</span>
              Remarks Management
            </h1>
            <p className="font-body text-xs text-on-surface-variant mt-1">
              Audit recorded discipline remarks, filter by multiple criteria, and export lists to external files.
            </p>
          </div>
          
          {/* Quick Exports */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => handleExport('excel')} className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-label font-bold text-xs rounded-xl flex items-center gap-1 border border-emerald-200/40 hover:opacity-90">
              <span className="material-symbols-outlined text-[15px]">grid_on</span> Excel
            </button>
            <button onClick={() => handleExport('pdf')} className="px-4 py-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-label font-bold text-xs rounded-xl flex items-center gap-1 border border-red-200/40 hover:opacity-90">
              <span className="material-symbols-outlined text-[15px]">picture_as_pdf</span> PDF
            </button>
            <button onClick={() => handleExport('word')} className="px-4 py-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-label font-bold text-xs rounded-xl flex items-center gap-1 border border-blue-200/40 hover:opacity-90">
              <span className="material-symbols-outlined text-[15px]">description</span> Word
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-on-surface flex items-center gap-1">
              <span className="material-symbols-outlined text-primary text-[18px]">filter_list</span>
              Search Filters
            </h3>
            <button onClick={clearFilters} className="font-label text-xs text-outline hover:text-primary hover:underline">
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Student search */}
            <div>
              <label className="block font-label text-[10px] uppercase font-bold text-on-surface-variant mb-1">Student</label>
              <input
                type="text"
                placeholder="Name / Reg No."
                value={filterStudent}
                onChange={e => setFilterStudent(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-outline-variant/40 rounded-xl text-xs focus:outline-none"
              />
            </div>
            {/* Department */}
            <div>
              <label className="block font-label text-[10px] uppercase font-bold text-on-surface-variant mb-1">Department</label>
              <select
                value={filterDept}
                onChange={e => setFilterDept(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-outline-variant/40 rounded-xl text-xs focus:outline-none appearance-none"
              >
                <option value="">All</option>
                {depts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {/* Academic Year */}
            <div>
              <label className="block font-label text-[10px] uppercase font-bold text-on-surface-variant mb-1">Academic Year</label>
              <select
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-outline-variant/40 rounded-xl text-xs focus:outline-none appearance-none"
              >
                <option value="">All</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
            {/* Category */}
            <div>
              <label className="block font-label text-[10px] uppercase font-bold text-on-surface-variant mb-1">Category</label>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-outline-variant/40 rounded-xl text-xs focus:outline-none appearance-none"
              >
                <option value="">All</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* Month */}
            <div>
              <label className="block font-label text-[10px] uppercase font-bold text-on-surface-variant mb-1">Month</label>
              <input
                type="month"
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-outline-variant/40 rounded-xl text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Remarks Grid/Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-outline">
            <span className="material-symbols-outlined text-4xl animate-spin mb-3">sync</span>
            <p className="font-label text-sm">Auditing remarks database…</p>
          </div>
        ) : remarks.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-12 text-center text-outline">
            <span className="material-symbols-outlined text-5xl mb-3">rate_review</span>
            <p className="font-label font-semibold text-base text-on-surface mb-1">No Remarks Found</p>
            <p className="font-body text-sm text-on-surface-variant">Adjust your filter options or wait for staff updates.</p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/30 font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Register Number</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Remark Category</th>
                    <th className="px-6 py-4">Recorded By</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 font-body text-sm">
                  {remarks.map(rem => (
                    <tr key={rem.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {rem.photo_url ? (
                            <img src={rem.photo_url} alt={rem.student_name} className="w-8 h-8 rounded-lg object-cover border" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg brand-gradient text-white flex items-center justify-center font-display font-black text-xs">
                              {rem.student_name.slice(0, 1)}
                            </div>
                          )}
                          <span className="font-semibold text-on-surface">{rem.student_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs uppercase text-on-surface">{rem.register_number}</td>
                      <td className="px-6 py-4"><span className="px-2.5 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">{rem.department}</span></td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs rounded-full font-bold uppercase text-[10px] ${
                          rem.remark_text === 'Late-comer' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600' :
                          rem.remark_text === 'Non-uniform' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600' :
                          rem.remark_text === 'Indiscipline' ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600' :
                          'bg-slate-50 dark:bg-slate-800 text-slate-600'
                        }`}>
                          {rem.remark_text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="leading-tight">
                          <div className="font-semibold text-on-surface">{rem.recorder_name}</div>
                          <div className="text-[10px] text-on-surface-variant font-label uppercase tracking-wider">{rem.recorder_role || 'Staff'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant font-mono text-xs">{new Date(rem.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteRemark(rem.id)}
                          className="p-1.5 rounded-lg text-outline hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                          title="Delete Incorrect Remark"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
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
