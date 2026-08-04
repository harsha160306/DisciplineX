import { useState, useEffect } from 'react';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import { useAppContext } from '../context/AppContext';

/* ── Mock fallback helpers ──────────────────────────────────────────── */
const MOCK_NAMES = [
  'Rahul Sharma', 'Priya Patel', 'Sneha Reddy', 'Karan Malhotra',
  'Anjali Verma', 'Arjun Rao', 'Divya Nair', 'Vikram Singh',
];
const REMARK_TYPES = ['Non-uniform', 'Late-comer', 'Indiscipline', 'Others'];
const INCHARGE_NAMES = {
  CSE: ['Mr. A. Senthil', 'Ms. B. Divya'],
  ECE: ['Mr. C. Rajan'],
  Mechanical: ['Mr. D. Kumar'],
};

function buildMock(dept) {
  const prefix = dept ? dept.substring(0, 2).toUpperCase() : 'CS';
  const count = 15 + Math.floor(Math.random() * 10);
  const incharges = INCHARGE_NAMES[dept] || ['Incharge Staff'];
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * 7));
    return {
      id: 100 + i,
      student_id: i + 1,
      name: MOCK_NAMES[i % MOCK_NAMES.length],
      registerNumber: `2024${prefix}${String(i + 1).padStart(3, '0')}`,
      register_number: `2024${prefix}${String(i + 1).padStart(3, '0')}`,
      remark: REMARK_TYPES[i % REMARK_TYPES.length],
      remark_text: REMARK_TYPES[i % REMARK_TYPES.length],
      department: dept,
      academic_year: ['1st Year', '2nd Year', '3rd Year', '4th Year'][i % 4],
      semester: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'][i % 8],
      section: ['A', 'B', 'C'][i % 3],
      incharge_name: incharges[i % incharges.length],
      created_at: d.toISOString(),
    };
  });
}

/* ── Badge styling ──────────────────────────────────────────────────── */
const REMARK_BADGE = {
  'Non-uniform':  { bg: 'bg-amber-100 dark:bg-amber-900/30',  text: 'text-amber-700 dark:text-amber-300',  icon: 'checkroom' },
  'Late-comer':   { bg: 'bg-rose-100 dark:bg-rose-900/30',    text: 'text-rose-700 dark:text-rose-300',    icon: 'schedule' },
  'Indiscipline': { bg: 'bg-violet-100 dark:bg-violet-900/30',text: 'text-violet-700 dark:text-violet-300',icon: 'gavel' },
  'Others':       { bg: 'bg-slate-100 dark:bg-slate-900/30',  text: 'text-slate-700 dark:text-slate-300',  icon: 'edit_note' },
};

const DEPT_COLORS = {
  'CSE':        { from: '#3730a3', to: '#6366f1' },
  'ECE':        { from: '#0e7490', to: '#22d3ee' },
  'Mechanical': { from: '#92400e', to: '#f59e0b' },
  'Civil':      { from: '#064e3b', to: '#10b981' },
  'MBA':        { from: '#4c1d95', to: '#a78bfa' },
};

export default function History() {
  const { user } = useAppContext();
  const userRole = user?.role || localStorage.getItem('userRole') || 'Staff';
  const userDept = user?.department || localStorage.getItem('userDepartment') || '';
  const isHOD    = userRole === 'HOD';

  const deptColor = DEPT_COLORS[userDept] || { from: '#1e3a5f', to: '#3d5af1' };

  const [remarkList,    setRemarkList]    = useState([]);
  const [dataLoaded,    setDataLoaded]    = useState(false);
  const [showRemarks,   setShowRemarks]  = useState(true);
  const [isFetching,    setIsFetching]   = useState(false);
  const [isGenerating,  setIsGenerating] = useState(false);
  
  // Search & Filters
  const [searchFilter,  setSearchFilter] = useState('');
  const [activeRemarkFilter, setActiveRemarkFilter] = useState('All');
  
  // API Filters
  const [apiFilters, setApiFilters] = useState({
    year: '',
    department: isHOD ? userDept : '',
    semester: '',
    month: '',
  });

  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const getCustomFormattedDate = (dateObj) => {
    const d = dateObj ? new Date(dateObj) : new Date();
    const day = d.getDate();
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const getSuffix = n => n>=11&&n<=13?'th':[,'st','nd','rd'][n%10]||'th';
    const year = d.getFullYear().toString().slice(2);
    return `${day}${getSuffix(day)} ${monthNames[d.getMonth()]} '${year}`;
  };

  const getDateCollectionTitle = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const dStr = d.toISOString().slice(0, 10);
    const tStr = today.toISOString().slice(0, 10);
    const yStr = yesterday.toISOString().slice(0, 10);

    const formattedDate = getCustomFormattedDate(d);
    
    if (dStr === tStr) return `${formattedDate} · Today's Collection`;
    if (dStr === yStr) return `${formattedDate} · Yesterday's Collection`;
    return `${formattedDate} · Collection`;
  };

  const now = new Date();
  const hour = now.getHours();
  const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';

  const fetchRemarks = async () => {
    setIsFetching(true);
    try {
      let startDateStr = null;
      let endDateStr = null;
      
      if (apiFilters.month) {
        const [yyyy, mm] = apiFilters.month.split('-');
        const sd = new Date(yyyy, mm - 1, 1);
        const ed = new Date(yyyy, mm, 0); // last day of month
        startDateStr = sd.toISOString().slice(0, 10);
        endDateStr = ed.toISOString().slice(0, 10);
      } else {
        // Default to last 7 days if no month is selected
        const todayObj = new Date();
        endDateStr = todayObj.toISOString().slice(0, 10);
        const startDateObj = new Date();
        startDateObj.setDate(startDateObj.getDate() - 6);
        startDateStr = startDateObj.toISOString().slice(0, 10);
      }

      const queryParams = { 
        startDate: startDateStr, 
        endDate: endDateStr,
        ...apiFilters,
      };

      const response = await api.get('/remarks/history', { params: queryParams });

      if (response.data?.records) {
        const mapped = response.data.records.map(r => ({
          id: r.id,
          student_id: r.student_id,
          name: r.name,
          registerNumber: r.register_number,
          register_number: r.register_number,
          remark: r.remark_text || r.remark,
          remark_text: r.remark_text || r.remark,
          department: r.department,
          academic_year: r.academic_year,
          semester: r.semester,
          section: r.section,
          incharge_name: r.incharge_name || '—',
          created_at: r.created_at,
        }));
        setRemarkList(mapped);
        setDataLoaded(true);
      } else {
        throw new Error('Empty dataset');
      }
    } catch (err) {
      console.warn('API fetch failed, using fallback mock…', err);
      setRemarkList(buildMock(apiFilters.department || userDept));
      setDataLoaded(true);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => { fetchRemarks(); }, [apiFilters]);

  /* ── Filtered list ────────────────────────────────────────────── */
  const filteredList = remarkList.filter(r => {
    const matchSearch = !searchFilter || 
      r.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (r.registerNumber || r.register_number || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (r.incharge_name || '').toLowerCase().includes(searchFilter.toLowerCase());
    const matchRemark = activeRemarkFilter === 'All' || (r.remark || r.remark_text) === activeRemarkFilter;
    return matchSearch && matchRemark;
  });

  /* ── Grouped list ────────────────────────────────────────────── */
  const groupedRemarks = filteredList.reduce((acc, r) => {
    const dateStr = new Date(r.created_at).toISOString().slice(0, 10);
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(r);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedRemarks)
    .filter(dateStr => new Date(dateStr).getDay() !== 0) // Exclude Sundays
    .sort((a, b) => b.localeCompare(a));

  /* ── Counts ─────────────────────────────────────────────────── */
  const remarkCounts = remarkList.reduce((acc, r) => {
    const k = r.remark || r.remark_text || 'Others';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const inchargeCounts = remarkList.reduce((acc, r) => {
    const k = r.incharge_name || 'Unknown';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  /* ── EXPORT FUNCTIONS ───────────────────────────────────────── */
  
  const getExportData = () => {
    const columns = isHOD
      ? ['#', 'Student Name', 'Register No', 'Department', 'Year', 'Semester', 'Remark', 'Date', 'Incharge']
      : ['#', 'Student Name', 'Register No', 'Department', 'Year', 'Semester', 'Remark', 'Date'];
      
    const rows = filteredList.map((r, i) => isHOD
      ? [i+1, r.name, r.registerNumber||r.register_number, r.department, r.academic_year||'-', r.semester||'-', r.remark||r.remark_text, new Date(r.created_at).toLocaleDateString(), r.incharge_name||'—']
      : [i+1, r.name, r.registerNumber||r.register_number, r.department, r.academic_year||'-', r.semester||'-', r.remark||r.remark_text, new Date(r.created_at).toLocaleDateString()]
    );
    return { columns, rows };
  };

  const handleDownloadDocx = async () => {
    if (!dataLoaded || filteredList.length === 0) {
      toast.error('No remarks available to export.');
      return;
    }
    setIsGenerating(true);
    try {
      const { columns, rows } = getExportData();
      const userName = localStorage.getItem('userName') || 'HOD';
      
      const makeTable = (rowsData, headers) => new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: headers.map(h => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })], shading: { fill: 'E8EDF9' } })) }),
          ...rowsData.map(r => new TableRow({ children: r.map(cell => new TableCell({ children: [new Paragraph({ text: String(cell) })] })) })),
        ],
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({ text: 'MODERN INSTITUTE COLLEGE', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: `${isHOD ? userDept + ' Department — ' : ''}Disciplinary Remarks Report`, heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: '' }),
            new Paragraph({ children: [new TextRun({ text: 'Report Date: ', bold: true }), new TextRun(todayLabel)] }),
            ...(isHOD ? [new Paragraph({ children: [new TextRun({ text: 'Department: ', bold: true }), new TextRun(userDept)] })] : []),
            new Paragraph({ text: '' }),
            new Paragraph({ text: `Remarks Log (${filteredList.length} Records)`, heading: HeadingLevel.HEADING_3 }),
            makeTable(rows, columns),
            new Paragraph({ text: '' }),
            new Paragraph({ children: [new TextRun({ text: 'Generated By: ', bold: true }), new TextRun(userName)] }),
            new Paragraph({ children: [new TextRun({ text: 'Generated At: ', bold: true }), new TextRun(new Date().toLocaleString('en-IN'))] }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${isHOD ? userDept + '_' : ''}Remarks_Report_${new Date().toISOString().slice(0,10)}.docx`);
      toast.success('Word report downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate Word report.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!dataLoaded || filteredList.length === 0) {
      toast.error('No remarks available to export.');
      return;
    }
    setIsGenerating(true);
    try {
      const { columns, rows } = getExportData();
      const doc = new jsPDF('landscape');
      
      doc.setFontSize(18);
      doc.text('MODERN INSTITUTE COLLEGE', doc.internal.pageSize.getWidth()/2, 15, { align: 'center' });
      doc.setFontSize(14);
      doc.text(`${isHOD ? userDept + ' Department — ' : ''}Disciplinary Remarks Report`, doc.internal.pageSize.getWidth()/2, 25, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Report Date: ${todayLabel}`, 15, 35);
      doc.text(`Generated At: ${new Date().toLocaleString('en-IN')}`, 15, 42);

      doc.autoTable({
        startY: 50,
        head: [columns],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [44, 62, 80] },
      });

      doc.save(`${isHOD ? userDept + '_' : ''}Remarks_Report_${new Date().toISOString().slice(0,10)}.pdf`);
      toast.success('PDF report downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF report.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadExcel = () => {
    if (!dataLoaded || filteredList.length === 0) {
      toast.error('No remarks available to export.');
      return;
    }
    setIsGenerating(true);
    try {
      const { columns, rows } = getExportData();
      const data = [columns, ...rows];
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Remarks');
      
      XLSX.writeFile(workbook, `${isHOD ? userDept + '_' : ''}Remarks_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
      toast.success('Excel report downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate Excel report.');
    } finally {
      setIsGenerating(false);
    }
  };

  const initials = name => name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className="flex-1 w-full overflow-y-auto bg-surface-container-lowest">

      {/* ── Hero Header ── */}
      <div
        className="relative overflow-hidden px-6 md:px-12 py-10 md:py-14"
        style={{ background: isHOD ? `linear-gradient(135deg, ${deptColor.from} 0%, ${deptColor.to} 100%)` : 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' }}
      >
        <div className="absolute inset-0 dot-grid opacity-[0.08] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white/80 text-xs font-label font-semibold uppercase tracking-wider mb-4">
              <span className="material-symbols-outlined text-[14px]">history</span>
              {isHOD ? `${userDept} Dept — Remarks Report` : "Activity Log"}
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-2">
              {isHOD ? `${userDept} Remarks History` : 'Evaluation History'}
            </h1>
            <p className="font-body text-white/60 text-sm md:text-base">
              {todayLabel} · Good {timeOfDay}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">

        {/* ── History Module & Reports (HOD only) ── */}
        {isHOD && (
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-card border border-outline-variant/30 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500 text-[20px]">summarize</span>
                History Module &amp; Reports
              </h3>
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[11px] font-label font-bold uppercase tracking-wide border border-blue-100 dark:border-blue-900/30">
                <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
                HOD Access
              </span>
            </div>
            <p className="text-sm text-on-surface-variant font-body mb-5 max-w-2xl">
              Generate filtered reports by <strong>Academic Year</strong>, <strong>Department</strong>, <strong>Semester</strong>, or <strong>Month</strong>.
              Use the filters below and export to <strong>Word</strong>, <strong>PDF</strong>, or <strong>Excel</strong>.
            </p>

            {/* Filter shortcuts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { icon: 'calendar_today', label: 'By Academic Year', color: 'indigo', filter: 'year' },
                { icon: 'corporate_fare', label: 'By Department',    color: 'violet', filter: 'department' },
                { icon: 'school',         label: 'By Semester',      color: 'teal',   filter: 'semester' },
                { icon: 'date_range',     label: 'By Month',         color: 'amber',  filter: 'month' },
              ].map(f => (
                <div key={f.label}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border border-${f.color}-200 dark:border-${f.color}-900/30 bg-${f.color}-50 dark:bg-${f.color}-900/10 cursor-default select-none`}>
                  <span className={`material-symbols-outlined text-[20px] text-${f.color}-600 dark:text-${f.color}-400`}>{f.icon}</span>
                  <span className={`font-label font-semibold text-xs text-${f.color}-700 dark:text-${f.color}-300`}>{f.label}</span>
                </div>
              ))}
            </div>

            {/* Export buttons */}
            <div className="flex flex-wrap gap-3">
              <button onClick={handleDownloadDocx} disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-label font-semibold text-sm transition-all shadow-sm active:scale-95">
                <span className="material-symbols-outlined text-[18px]">description</span>
                Export Word
              </button>
              <button onClick={handleDownloadPDF} disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-label font-semibold text-sm transition-all shadow-sm active:scale-95">
                <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                Export PDF
              </button>
              <button onClick={handleDownloadExcel} disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-label font-semibold text-sm transition-all shadow-sm active:scale-95">
                <span className="material-symbols-outlined text-[18px]">table_chart</span>
                Export Excel
              </button>
              {isGenerating && (
                <div className="flex items-center gap-2 px-4 py-2.5 text-sm font-label text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                  Generating…
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Advanced Filters Row ── */}
        <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant/30 p-5 flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-[11px] font-label font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Month</label>
            <input 
              type="month" 
              className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
              value={apiFilters.month}
              onChange={(e) => setApiFilters({...apiFilters, month: e.target.value})}
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-[11px] font-label font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Academic Year</label>
            <select 
              className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none appearance-none"
              value={apiFilters.year}
              onChange={(e) => setApiFilters({...apiFilters, year: e.target.value})}
            >
              <option value="">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-[11px] font-label font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Semester</label>
            <select 
              className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none appearance-none"
              value={apiFilters.semester}
              onChange={(e) => setApiFilters({...apiFilters, semester: e.target.value})}
            >
              <option value="">All Semesters</option>
              <option value="1st">1st Semester</option>
              <option value="2nd">2nd Semester</option>
              <option value="3rd">3rd Semester</option>
              <option value="4th">4th Semester</option>
              <option value="5th">5th Semester</option>
              <option value="6th">6th Semester</option>
              <option value="7th">7th Semester</option>
              <option value="8th">8th Semester</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-[11px] font-label font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Department</label>
            <select 
              className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none appearance-none"
              value={apiFilters.department}
              onChange={(e) => setApiFilters({...apiFilters, department: e.target.value})}
            >
              <option value="">All Depts</option>
              {Object.keys(DEPT_COLORS).map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
          </div>
        </div>

        {/* Loading */}
        {isFetching && (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-surface rounded-2xl border border-outline-variant/10 shadow-card min-h-[200px]">
            <span className="material-symbols-outlined text-4xl text-outline animate-spin mb-3">sync</span>
            <p className="font-label text-on-surface-variant text-sm">Fetching records based on filters…</p>
          </div>
        )}

        {dataLoaded && !isFetching && (
          <div className="animate-fade-in space-y-6">

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Remarks', value: remarkList.length,                  icon: 'assignment', color: 'text-indigo-600 dark:text-indigo-400',  bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
                { label: 'Non-uniform',   value: remarkCounts['Non-uniform']  || 0,  icon: 'checkroom',  color: 'text-amber-600 dark:text-amber-400',    bg: 'bg-amber-50 dark:bg-amber-950/20' },
                { label: 'Late-comer',    value: remarkCounts['Late-comer']   || 0,  icon: 'schedule',   color: 'text-rose-600 dark:text-rose-400',      bg: 'bg-rose-50 dark:bg-rose-950/20' },
                { label: 'Indiscipline',  value: remarkCounts['Indiscipline'] || 0,  icon: 'gavel',      color: 'text-violet-600 dark:text-violet-400',  bg: 'bg-violet-50 dark:bg-violet-950/20' },
              ].map(stat => (
                <div key={stat.label} className="bg-surface rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <span className={`material-symbols-outlined text-[24px] ${stat.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                  </div>
                  <div>
                    <div className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold mb-0.5">{stat.label}</div>
                    <div className="font-display font-bold text-2xl text-on-surface">{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Remarks Card */}
            <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 border-b border-outline-variant/20 bg-surface-container-lowest">
                <div>
                  <h3 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">dataset</span>
                    Remarks Data
                  </h3>
                </div>
              </div>

              {/* Expandable list */}
              <div className="max-h-[600px] overflow-hidden flex flex-col">
                {/* Search + filter bar */}
                <div className="px-6 py-4 border-b border-outline-variant/20 flex flex-col sm:flex-row gap-3 bg-surface">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[16px]">search</span>
                    <input
                      type="text"
                      placeholder={`Search name, reg.no${isHOD ? ', incharge' : ''}…`}
                      value={searchFilter}
                      onChange={e => setSearchFilter(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-sm font-body text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {['All', 'Non-uniform', 'Late-comer', 'Indiscipline', 'Others'].map(f => (
                      <button
                        key={f}
                        onClick={() => setActiveRemarkFilter(f)}
                        className={`px-4 py-2 rounded-xl text-[12px] font-label font-semibold transition-all shadow-sm ${activeRemarkFilter === f ? 'brand-gradient text-white shadow-brand-sm' : 'bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container'}`}
                      >
                        {f}{f !== 'All' && remarkCounts[f] ? ` (${remarkCounts[f]})` : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1">
                  {sortedDates.length > 0 ? sortedDates.map(dateStr => (
                    <div key={dateStr} className="mb-0">
                      <div className="px-6 py-2.5 bg-surface-container-low border-b border-outline-variant/20 font-label text-[12px] font-bold text-on-surface sticky top-0 z-10 shadow-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
                        {getDateCollectionTitle(dateStr)}
                      </div>
                      <div className="divide-y divide-outline-variant/10">
                        {groupedRemarks[dateStr].map((r, idx) => {
                          const badge = REMARK_BADGE[r.remark || r.remark_text] || REMARK_BADGE['Others'];
                          const time = new Date(r.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                          return (
                            <div key={r.id || idx} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container/30 transition-colors">
                              <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 text-xs font-display font-bold text-on-surface-variant">
                                {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-body font-semibold text-[14px] text-on-surface truncate">{r.name}</div>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="px-2 py-0.5 bg-surface-container rounded-md font-label font-bold text-[10px] text-on-surface-variant uppercase">{r.registerNumber || r.register_number}</span>
                                  {r.academic_year && <span className="font-label text-[11px] text-on-surface-variant">· {r.academic_year}</span>}
                                  {r.semester && <span className="font-label text-[11px] text-on-surface-variant">· {r.semester} Sem</span>}
                                </div>
                                {isHOD && r.incharge_name && r.incharge_name !== '—' && (
                                  <div className="flex items-center gap-1 mt-1 text-primary/80">
                                    <span className="material-symbols-outlined text-[12px]">person</span>
                                    <span className="font-label text-[11px] font-semibold">{r.incharge_name}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-label font-bold ${badge.bg} ${badge.text}`}>
                                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{badge.icon}</span>
                                  {r.remark || r.remark_text}
                                </div>
                                <span className="font-label text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">{time}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )) : (
                    <div className="px-6 py-16 text-center">
                      <span className="material-symbols-outlined text-4xl text-outline mb-2">search_off</span>
                      <p className="font-body text-on-surface-variant text-sm">No results found for your filters.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Row - Exporting */}
            {remarkList.length > 0 && (
              <div className="bg-surface rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-[15px] text-on-surface mb-0.5">Export Report</h3>
                  <p className="font-label text-xs text-on-surface-variant">Download the current filtered view ({filteredList.length} records)</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleDownloadDocx}
                    disabled={isGenerating}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#2b579a] hover:bg-[#1e3f72] text-white py-2.5 px-5 rounded-xl font-label font-bold text-xs shadow-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">description</span> Word
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#d32f2f] hover:bg-[#b71c1c] text-white py-2.5 px-5 rounded-xl font-label font-bold text-xs shadow-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span> PDF
                  </button>
                  <button
                    onClick={handleDownloadExcel}
                    disabled={isGenerating}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#1d6f42] hover:bg-[#144f2f] text-white py-2.5 px-5 rounded-xl font-label font-bold text-xs shadow-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">table_chart</span> Excel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!dataLoaded && !isFetching && (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-surface rounded-2xl border border-outline-variant/30 shadow-sm min-h-[300px]">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl text-outline">history</span>
            </div>
            <h3 className="font-display font-semibold text-lg text-on-surface mb-1">No Data Loaded</h3>
            <p className="font-body text-on-surface-variant text-sm max-w-xs leading-relaxed mb-4">Could not load records.</p>
            <button onClick={fetchRemarks} className="flex items-center gap-2 px-5 py-2.5 rounded-xl brand-gradient text-white font-label font-semibold text-sm shadow-brand-sm hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-[16px]">refresh</span> Try Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
