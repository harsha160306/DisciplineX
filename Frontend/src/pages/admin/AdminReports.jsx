import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart, Bar, Cell,
  PieChart, Pie, Legend,
  LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const DEPT_OPTIONS = ['CSE', 'ECE', 'Mechanical', 'Civil', 'MBA'];
const PIE_COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981'];

export default function AdminReports() {
  const [depts, setDepts] = useState(DEPT_OPTIONS);
  
  // Form states
  const [reportType, setReportType] = useState('department');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [generating, setGenerating] = useState(false);

  // Viewer states
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);

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
      let chartData = {};

      if (reportType === 'department') {
        const [deptRes, remarkRes] = await Promise.all([
          api.get('/admin/departments'),
          api.get('/admin/remarks')
        ]);
        
        const deptsData = deptRes.data;
        const remarksData = remarkRes.data;
        
        const deptStats = {};
        deptsData.forEach(d => {
           deptStats[d.name] = { total: 0, 'Late-comer': 0, 'Non-uniform': 0, 'Indiscipline': 0, 'Others': 0 };
        });
        
        remarksData.forEach(r => {
           const dept = r.department;
           if (deptStats[dept]) {
             deptStats[dept].total++;
             const cat = r.remark_text;
             if (deptStats[dept][cat] !== undefined) {
               deptStats[dept][cat]++;
             } else {
               deptStats[dept]['Others']++;
             }
           }
        });

        title = 'Departments Configuration & Remarks Analysis Report';
        headers = [
          'Department Name', 'HOD', 'Total Students', 'Total Incharges', 
          'Total Remarks', 'Late-comer', 'Non-uniform', 'Indiscipline', 'Others'
        ];
        
        rows = deptsData.map(d => [
          d.name, d.hod, d.totalStudents, d.totalIncharges,
          deptStats[d.name].total, deptStats[d.name]['Late-comer'],
          deptStats[d.name]['Non-uniform'], deptStats[d.name]['Indiscipline'], deptStats[d.name]['Others']
        ]);

        const remarksByDept = deptsData.map(d => ({ name: d.name, remarks: deptStats[d.name].total }));
        const cats = { 'Late-comer': 0, 'Non-uniform': 0, 'Indiscipline': 0, 'Others': 0 };
        deptsData.forEach(d => {
          cats['Late-comer'] += deptStats[d.name]['Late-comer'];
          cats['Non-uniform'] += deptStats[d.name]['Non-uniform'];
          cats['Indiscipline'] += deptStats[d.name]['Indiscipline'];
          cats['Others'] += deptStats[d.name]['Others'];
        });
        const remarkCategories = Object.keys(cats).map(k => ({ name: k, value: cats[k] })).filter(c => c.value > 0);
        
        chartData = { remarksByDept, remarkCategories };

      } else if (reportType === 'remarks') {
        const params = { month: selectedMonth };
        if (selectedDept) params.department = selectedDept;
        
        const res = await api.get('/admin/remarks', { params });
        const remarksData = res.data;
        
        const [yyyy, mm] = selectedMonth.split('-');
        const monthName = new Date(yyyy, mm - 1).toLocaleString('default', { month: 'long' });
        const branchDisplay = selectedDept ? selectedDept : 'All Branches';
        
        title = `Monthly Remarks Report - ${monthName} ${yyyy} (${branchDisplay})`;
        headers = ['Date', 'Student Name', 'Register No', 'Department', 'Year', 'Remark Category', 'Recorded By'];
        
        rows = remarksData.map(r => [
          new Date(r.created_at).toLocaleDateString('en-IN'),
          r.student_name, r.register_number, r.department, r.academic_year, r.remark_text, r.recorder_name
        ]);
        
        if (rows.length === 0) {
          toast.error('No remarks found for the selected month and branch.');
          setGenerating(false);
          return;
        }

        const cats = { 'Late-comer': 0, 'Non-uniform': 0, 'Indiscipline': 0, 'Others': 0 };
        const trend = {};
        const daysInMonth = new Date(yyyy, mm, 0).getDate();
        for(let i=1; i<=daysInMonth; i++) {
          trend[String(i).padStart(2, '0')] = 0;
        }

        remarksData.forEach(r => {
          if (cats[r.remark_text] !== undefined) cats[r.remark_text]++;
          else cats['Others']++;
          
          const day = new Date(r.created_at).getDate();
          const dayStr = String(day).padStart(2, '0');
          if (trend[dayStr] !== undefined) trend[dayStr]++;
        });

        const remarkCategories = Object.keys(cats).map(k => ({ name: k, value: cats[k] })).filter(c => c.value > 0);
        const monthlyRemarksTrend = Object.keys(trend).map(k => ({ day: k, remarks: trend[k] }));

        chartData = { remarkCategories, monthlyRemarksTrend };
      }

      setReportData({ title, headers, rows, chartData, reportType });
      setShowReport(true);
      await api.post('/admin/logs', { action: `Generated ${reportType} graphical report` });
      toast.success('Report generated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate report data. Backend may be offline.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    const toastId = toast.loading('Generating professional PDF document...');
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // 1. Native PDF Header - Optimized spacing
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(59, 130, 246);
      pdf.text('Modern Institute College', pageWidth / 2, 16, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setTextColor(55, 65, 81);
      pdf.text(reportData.title, pageWidth / 2, 24, { align: 'center' });
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, 30, { align: 'center' });

      let currentY = 36;

      // 2. Snapshot Charts Only
      const chartsElement = document.querySelector('.chart-grid');
      if (chartsElement) {
        const imgData = await toPng(chartsElement, { backgroundColor: '#ffffff', pixelRatio: 2 });
        const imgProps = pdf.getImageProperties(imgData);
        
        const margin = 15;
        const availableWidth = pageWidth - (margin * 2);
        let imgWidth = availableWidth;
        let imgHeight = (imgProps.height * availableWidth) / imgProps.width;
        
        // Constrain height tightly to ensure table fits on the same page
        const maxHeight = 70;
        let xOffset = margin;
        
        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = (imgProps.width * maxHeight) / imgProps.height;
          xOffset = margin + (availableWidth - imgWidth) / 2; // Center horizontally
        }
        
        pdf.addImage(imgData, 'PNG', xOffset, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 8; // tighter gap
      }

      // 3. Native Data Table with tighter padding
      autoTable(pdf, {
        startY: currentY,
        head: [reportData.headers],
        body: reportData.rows.map(row => row.map(cell => cell === 0 ? '-' : cell)),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', fontSize: 9, halign: 'center' },
        bodyStyles: { fontSize: 8, textColor: 60, halign: 'center' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 15, right: 15, bottom: 10 },
        styles: { cellPadding: 3, overflow: 'linebreak' }
      });

      pdf.save(`${reportData.reportType}_report.pdf`);
      toast.success('Professional PDF downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF', { id: toastId });
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-outline-variant/30 rounded-lg px-3 py-2 shadow-sm text-xs font-label">
          <p className="font-bold text-gray-800 mb-1">{label}</p>
          <p className="text-primary font-semibold">{payload[0].value} Remarks</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 w-full overflow-y-auto p-5 md:p-8 xl:p-10 bg-surface">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header row (hide on print) */}
        <div className="border-b border-outline-variant/15 pb-5 no-print">
          <h1 className="font-display font-bold text-2xl text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">summarize</span>
            Generate Reports
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Build custom graphical reports for departments and remarks, and download as PDF.
          </p>
        </div>

        {showReport && reportData ? (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 md:p-10 shadow-card printable-report">
            {/* Header & Print Button */}
            <div className="flex justify-between items-center mb-8 border-b border-outline-variant/20 pb-4 no-print">
              <button type="button" onClick={() => setShowReport(false)} className="flex items-center gap-2 text-sm font-label font-semibold text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back to Filters
              </button>
              <div className="flex items-center gap-3">
                <button type="button" onClick={handleDownloadPDF} className="px-5 py-2.5 brand-gradient text-white font-label font-bold text-sm rounded-xl shadow-brand-sm hover:shadow-brand transition-all flex items-center gap-2 active:scale-95">
                  <span className="material-symbols-outlined text-[18px]">download</span> Download PDF
                </button>
              </div>
            </div>

            {/* Report Content */}
            <div id="report-content-to-download" className="report-content bg-white p-4">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-display font-extrabold text-primary mb-2">Modern Institute College</h2>
                <h3 className="text-lg md:text-xl font-display font-bold text-gray-700">{reportData.title}</h3>
                <p className="text-xs font-label text-gray-500 mt-2">Generated on: {new Date().toLocaleString('en-IN')}</p>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 chart-grid break-inside-avoid">
                {reportData.reportType === 'department' && (
                  <div className="border border-outline-variant/20 bg-gray-50/30 rounded-2xl p-6 shadow-sm">
                    <h4 className="font-display font-bold text-base text-center mb-6 text-gray-800">Remarks by Department</h4>
                    <ResponsiveContainer width="100%" height={260}>
                       <BarChart data={reportData.chartData.remarksByDept} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={8} />
                         <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-5} />
                         <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', radius: 8 }} />
                         <Bar dataKey="remarks" fill="#3d5af1" radius={[6, 6, 0, 0]} maxBarSize={48}>
                           {reportData.chartData.remarksByDept.map((entry, idx) => (
                             <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                           ))}
                         </Bar>
                       </BarChart>
                     </ResponsiveContainer>
                  </div>
                )}
                
                {reportData.reportType === 'remarks' && (
                  <div className="border border-outline-variant/20 bg-gray-50/30 rounded-2xl p-6 shadow-sm">
                    <h4 className="font-display font-bold text-base text-center mb-6 text-gray-800">Daily Remarks Trend</h4>
                    <ResponsiveContainer width="100%" height={260}>
                       <LineChart data={reportData.chartData.monthlyRemarksTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                         <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={8} />
                         <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-5} allowDecimals={false} />
                         <Tooltip content={<CustomTooltip />} />
                         <Line type="monotone" dataKey="remarks" stroke="#10b981" strokeWidth={3.5} activeDot={{ r: 6 }} dot={false} />
                       </LineChart>
                     </ResponsiveContainer>
                  </div>
                )}

                <div className="border border-outline-variant/20 bg-gray-50/30 rounded-2xl p-6 shadow-sm">
                  <h4 className="font-display font-bold text-base text-center mb-6 text-gray-800">Remark Categories</h4>
                  <ResponsiveContainer width="100%" height={260}>
                     <PieChart>
                       <Pie data={reportData.chartData.remarkCategories} cx="50%" cy="45%" innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value">
                         {reportData.chartData.remarkCategories.map((_, index) => (
                           <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                         ))}
                       </Pie>
                       <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 11 }} />
                       <Legend iconType="circle" layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: '11.5px', paddingTop: '15px' }} />
                     </PieChart>
                   </ResponsiveContainer>
                </div>
              </div>

              {/* Data Table */}
              <div className="break-inside-avoid">
                <h4 className="font-display font-bold text-base mb-4 text-gray-800">Detailed Data Records</h4>
                <div className="overflow-x-auto rounded-xl border border-outline-variant/30 shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-primary/5">
                        {reportData.headers.map((h, i) => (
                          <th key={i} className="p-3.5 font-label text-xs font-extrabold text-gray-700 uppercase tracking-wider border-b border-outline-variant/20 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-surface-container-lowest/50">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-3 font-body text-xs text-gray-600 border-b border-outline-variant/10 whitespace-nowrap">
                              {cell === 0 ? <span className="text-gray-300">-</span> : cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerateReport} className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 md:p-8 shadow-card space-y-7 no-print max-w-3xl">
            
            {/* 1. Report Type */}
            <div>
              <label className="block font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">1. Select Report Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { type: 'department', icon: 'corporate_fare', label: 'Department Report' },
                  { type: 'remarks', icon: 'rate_review', label: 'Monthly Remarks' },
                ].map(item => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setReportType(item.type)}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-4 ${
                      reportType === item.type
                        ? 'border-primary bg-primary/5 text-primary shadow-brand-sm'
                        : 'border-outline-variant/40 bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      reportType === item.type ? 'bg-primary text-white' : 'bg-surface-container text-outline'
                    }`}>
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    </div>
                    <span className="font-display font-bold text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Report Filters */}
            <div className="border-t border-outline-variant/15 pt-6">
              <label className="block font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">2. Configure Report Filters</label>
              
              <div className="bg-surface-container-low/30 border border-outline-variant/15 p-5 rounded-2xl space-y-4">
                
                {reportType === 'department' && (
                  <p className="font-body text-sm text-on-surface-variant flex items-center gap-2 p-1">
                    <span className="material-symbols-outlined text-[18px] text-primary">info</span>
                    This report compiles analysis across all branch directories. No additional filters are required.
                  </p>
                )}

                {reportType === 'remarks' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="relative">
                      <label className="block font-label text-[11px] uppercase font-bold text-on-surface-variant mb-2">Branch Filter</label>
                      <select
                        value={selectedDept}
                        onChange={e => setSelectedDept(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-outline-variant/40 rounded-xl text-sm font-body focus:outline-none focus:border-primary transition-colors"
                      >
                        <option value="">All Branches</option>
                        {depts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-label text-[11px] uppercase font-bold text-on-surface-variant mb-2">Select Month</label>
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-outline-variant/40 rounded-xl text-sm font-body focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="border-t border-outline-variant/15 pt-6 flex justify-end">
              <button
                type="submit"
                disabled={generating}
                className="px-8 py-3.5 brand-gradient text-white font-label font-bold text-sm rounded-xl shadow-brand-sm hover:shadow-brand transition-all flex items-center justify-center gap-2 active:scale-[.98]"
              >
                {generating ? (
                  <><span className="material-symbols-outlined animate-spin text-[20px]">sync</span> Generating Report…</>
                ) : (
                  <><span className="material-symbols-outlined text-[20px]">analytics</span> Generate Report</>
                )}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
