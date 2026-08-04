import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import { exportToExcel, exportToPDF, exportToWord } from '../../utils/exporter';

const DEPT_OPTIONS = ['CSE', 'ECE', 'Mechanical', 'Civil', 'MBA'];

export default function AdminReports() {
  const [depts, setDepts] = useState(DEPT_OPTIONS);
  
  // Form states
  const [reportType, setReportType] = useState('department');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [studentSearch, setStudentSearch] = useState('');
  const [exportFormat, setExportFormat] = useState('excel');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/departments');
        if (res.data && res.data.length > 0) {
          setDepts(res.data.map(d => d.name));
        }
      } catch (_) {}
    })();
  }, []);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      let title = '';
      let headers = [];
      let rows = [];
      let fileName = `${reportType}_report`;

      if (reportType === 'department') {
        const res = await api.get('/admin/departments');
        title = 'Departments Configuration Report';
        headers = ['Department Name', 'Department HOD', 'Total Students', 'Total Incharges'];
        rows = res.data.map(d => [d.name, d.hod, d.totalStudents, d.totalIncharges]);
      } 
      
      else if (reportType === 'student') {
        const res = await api.get('/admin/students', { params: { search: studentSearch, department: selectedDept } });
        title = 'Registered Students Directory';
        headers = ['Register Number', 'Student Name', 'Department', 'Academic Year', 'Semester', 'Section', 'Email', 'Phone'];
        rows = res.data.map(s => [s.register_number, s.name, s.department, s.academic_year, s.semester || '-', s.section || '-', s.email || '-', s.phone || '-']);
      } 
      
      else if (reportType === 'remarks') {
        const res = await api.get('/admin/remarks', { params: { department: selectedDept, month: selectedMonth } });
        title = `Discipline Remarks Report - ${selectedMonth || 'All Months'}`;
        headers = ['Date', 'Register Number', 'Student Name', 'Department', 'Remark Category', 'Recorded By'];
        rows = res.data.map(r => [
          new Date(r.created_at).toLocaleDateString('en-IN'),
          r.register_number,
          r.student_name,
          r.department,
          r.remark_text,
          `${r.recorder_name} (${r.recorder_role})`
        ]);
      } 
      
      else if (reportType === 'hod') {
        const res = await api.get('/admin/hods');
        title = 'HOD Directory Report';
        headers = ['HOD Name', 'Employee ID', 'Department', 'Email', 'Phone Number', 'Status'];
        rows = res.data.map(h => [h.name, h.employee_id || '-', h.department, h.email || '-', h.phone || '-', h.status]);
      } 
      
      else if (reportType === 'incharge') {
        const res = await api.get('/admin/incharges');
        title = 'Discipline Incharges Directory Report';
        headers = ['Incharge Name', 'Employee ID', 'Department', 'Designation', 'Email', 'Mobile Number', 'Status'];
        rows = res.data.map(i => [i.name, i.employee_id || '-', i.department, i.designation || 'Incharge', i.email || '-', i.phone || '-', i.status]);
      }

      // Trigger actual export helper
      if (exportFormat === 'excel') {
        exportToExcel(headers, rows, fileName);
      } else if (exportFormat === 'pdf') {
        exportToPDF(title, headers, rows, fileName);
      } else if (exportFormat === 'word') {
        exportToWord(title, headers, rows, fileName);
      }

      // Log activity
      await api.post('/admin/logs', { action: `Generated and exported ${reportType} report as ${exportFormat.toUpperCase()}` });
      toast.success('Report generated and downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate report data. Backend may be offline.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex-1 w-full overflow-y-auto p-5 md:p-8 xl:p-10 bg-surface">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header row */}
        <div className="border-b border-outline-variant/15 pb-5">
          <h1 className="font-display font-bold text-2xl text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">summarize</span>
            Generate Reports
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Build custom reports for departments, students, remarks, HODs, or incharges and download as PDF, Word, or Excel.
          </p>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleGenerateReport} className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-card space-y-5">
          
          {/* 1. Report Type */}
          <div>
            <label className="block font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">1. Select Report Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { type: 'department', icon: 'corporate_fare', label: 'Department Report' },
                { type: 'student', icon: 'school', label: 'Student Report' },
                { type: 'remarks', icon: 'rate_review', label: 'Monthly Remarks' },
                { type: 'hod', icon: 'supervisor_account', label: 'HOD Report' },
                { type: 'incharge', icon: 'badge', label: 'Incharge Report' },
              ].map(item => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setReportType(item.type)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
                    reportType === item.type
                      ? 'border-primary bg-primary/5 text-primary shadow-brand-sm'
                      : 'border-outline-variant/40 bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    reportType === item.type ? 'bg-primary text-white' : 'bg-surface-container text-outline'
                  }`}>
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  </div>
                  <span className="font-display font-bold text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Report Filters */}
          <div className="border-t border-outline-variant/15 pt-5">
            <label className="block font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">2. Configure Report Filters</label>
            
            <div className="bg-surface-container-low/50 border border-outline-variant/15 p-4 rounded-2xl space-y-4">
              
              {reportType === 'department' && (
                <p className="font-body text-xs text-on-surface-variant flex items-center gap-1.5 p-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                  This report registers all branch directories, showing incharge and student index sums. No filters required.
                </p>
              )}

              {reportType === 'hod' && (
                <p className="font-body text-xs text-on-surface-variant flex items-center gap-1.5 p-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                  Downloads a directory profile of all Heads of Departments (Name, Branch, Employee ID, Email, Phone, Status).
                </p>
              )}

              {reportType === 'incharge' && (
                <p className="font-body text-xs text-on-surface-variant flex items-center gap-1.5 p-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                  Downloads a comprehensive directory profile of all Discipline Incharges.
                </p>
              )}

              {reportType === 'student' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block font-label text-[10px] uppercase font-bold text-on-surface-variant mb-1">Branch Filter</label>
                    <select
                      value={selectedDept}
                      onChange={e => setSelectedDept(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs focus:outline-none"
                    >
                      <option value="">All Branches</option>
                      {depts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-label text-[10px] uppercase font-bold text-on-surface-variant mb-1">Student Register / Name Search</label>
                    <input
                      type="text"
                      placeholder="e.g. 2024CS101"
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {reportType === 'remarks' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block font-label text-[10px] uppercase font-bold text-on-surface-variant mb-1">Branch Filter</label>
                    <select
                      value={selectedDept}
                      onChange={e => setSelectedDept(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs focus:outline-none"
                    >
                      <option value="">All Branches</option>
                      {depts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-label text-[10px] uppercase font-bold text-on-surface-variant mb-1">Select Month</label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* 3. Export Format */}
          <div className="border-t border-outline-variant/15 pt-5">
            <label className="block font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">3. Choose File Export Format</label>
            <div className="flex gap-4">
              {[
                { format: 'excel', label: 'Excel Sheet (.xlsx)', icon: 'grid_on', color: 'text-emerald-500' },
                { format: 'pdf', label: 'PDF Document (.pdf)', icon: 'picture_as_pdf', color: 'text-red-500' },
                { format: 'word', label: 'Word Document (.docx)', icon: 'description', color: 'text-blue-500' }
              ].map(f => (
                <button
                  key={f.format}
                  type="button"
                  onClick={() => setExportFormat(f.format)}
                  className={`flex-1 p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    exportFormat === f.format
                      ? 'border-primary bg-primary/5 text-primary shadow-brand-sm'
                      : 'border-outline-variant/40 bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[24px] ${f.color}`}>{f.icon}</span>
                  <span className="font-label text-xs font-bold">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="border-t border-outline-variant/15 pt-5 flex justify-end">
            <button
              type="submit"
              disabled={generating}
              className="px-6 py-3 brand-gradient text-white font-label font-bold text-sm rounded-xl shadow-brand-sm hover:shadow-brand transition-all flex items-center justify-center gap-2 active:scale-[.98]"
            >
              {generating ? (
                <><span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Exporting…</>
              ) : (
                <><span className="material-symbols-outlined text-[18px]">download_for_offline</span> Generate & Export</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
