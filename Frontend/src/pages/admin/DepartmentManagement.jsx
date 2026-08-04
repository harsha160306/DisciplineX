import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeDept, setActiveDept] = useState(null);

  // Form states
  const [name, setName] = useState('');

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/admin/departments');
      setDepartments(res.data);
    } catch (err) {
      console.warn('Backend offline, using fallback department mock data:', err.message);
      // Seed default departments
      setDepartments([
        { id: 1, name: 'CSE', hod: 'Dr. R. Kavitha', totalStudents: 120, totalIncharges: 2 },
        { id: 2, name: 'ECE', hod: 'Dr. S. Rajkumar', totalStudents: 85, totalIncharges: 1 },
        { id: 3, name: 'Mechanical', hod: 'Dr. M. Priya', totalStudents: 110, totalIncharges: 0 },
        { id: 4, name: 'Civil', hod: 'Not Assigned', totalStudents: 0, totalIncharges: 0 },
        { id: 5, name: 'MBA', hod: 'Not Assigned', totalStudents: 0, totalIncharges: 0 }
      ]);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchDepartments();
      setLoading(false);
    })();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/departments', { name });
      toast.success('Department created successfully.');
      setIsAddOpen(false);
      setName('');
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create department.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/departments/${activeDept.id}`, { name });
      toast.success('Department name updated.');
      setIsEditOpen(false);
      setName('');
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update department.');
    }
  };

  const handleDelete = async (id, deptName) => {
    if (!window.confirm(`Are you sure you want to delete department ${deptName}? All associated configurations may be affected.`)) return;
    try {
      await api.delete(`/admin/departments/${id}`);
      toast.success('Department deleted successfully.');
      fetchDepartments();
    } catch (err) {
      toast.error('Failed to delete department.');
    }
  };

  const openEdit = (dept) => {
    setActiveDept(dept);
    setName(dept.name);
    setIsEditOpen(true);
  };

  return (
    <div className="flex-1 w-full overflow-y-auto p-5 md:p-8 xl:p-10 bg-surface">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/15 pb-5">
          <div>
            <h1 className="font-display font-bold text-2xl text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]">corporate_fare</span>
              Department Management
            </h1>
            <p className="font-body text-xs text-on-surface-variant mt-1">
              Configure and modify academic branches, showing HOD assignments and student distributions.
            </p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-5 py-2.5 rounded-xl brand-gradient text-white text-sm font-label font-semibold shadow-brand-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-[.98]"
          >
            <span className="material-symbols-outlined text-[18px]">add_home</span>
            Add Department
          </button>
        </div>

        {/* Department Grid/Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-outline">
            <span className="material-symbols-outlined text-4xl animate-spin mb-3">sync</span>
            <p className="font-label text-sm">Loading departments list…</p>
          </div>
        ) : departments.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-12 text-center text-outline">
            <span className="material-symbols-outlined text-5xl mb-3">corporate_fare</span>
            <p className="font-label font-semibold text-base text-on-surface mb-1">No Departments Registered</p>
            <p className="font-body text-sm text-on-surface-variant">Configure a new department to get started.</p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/30 font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    <th className="px-6 py-4">Department Name</th>
                    <th className="px-6 py-4">Department HOD</th>
                    <th className="px-6 py-4">Total Students</th>
                    <th className="px-6 py-4">Total Incharges</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 font-body text-sm">
                  {departments.map(dept => (
                    <tr key={dept.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-4 font-semibold text-on-surface text-base">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                          {dept.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          dept.hod === 'Not Assigned'
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400'
                            : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                        }`}>
                          <span className="material-symbols-outlined text-[14px]">
                            {dept.hod === 'Not Assigned' ? 'person_off' : 'account_box'}
                          </span>
                          {dept.hod}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-on-surface-variant">{dept.totalStudents} Students</td>
                      <td className="px-6 py-4 text-on-surface-variant">{dept.totalIncharges} Incharges</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2.5">
                          <button
                            onClick={() => openEdit(dept)}
                            className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-all animate-pulse-slow"
                            title="Edit Name"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(dept.id, dept.name)}
                            disabled={dept.totalStudents > 0 || dept.totalIncharges > 0}
                            className={`p-1.5 rounded-lg transition-all ${
                              dept.totalStudents > 0 || dept.totalIncharges > 0
                                ? 'text-outline/30 cursor-not-allowed'
                                : 'text-outline hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
                            }`}
                            title={dept.totalStudents > 0 || dept.totalIncharges > 0 ? "Cannot delete department with active data" : "Delete Department"}
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ─── ADD DEPT MODAL ─── */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/15 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_home</span>
                Add Department
              </h3>
              <button onClick={() => { setIsAddOpen(false); setName(''); }} className="text-outline hover:text-on-surface p-1 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Department Name (Code)</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. CSE / ECE / EEE"
                  className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/15">
                <button type="button" onClick={() => { setIsAddOpen(false); setName(''); }}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant/50 hover:bg-surface-container font-label text-sm text-on-surface transition-all">Cancel</button>
                <button type="submit"
                  className="px-5 py-2.5 rounded-xl brand-gradient text-white font-label text-sm font-semibold transition-all">Create Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT DEPT MODAL ─── */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/15 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit</span>
                Edit Department
              </h3>
              <button onClick={() => { setIsEditOpen(false); setName(''); }} className="text-outline hover:text-on-surface p-1 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Department Name (Code)</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. CSE"
                  className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/15">
                <button type="button" onClick={() => { setIsEditOpen(false); setName(''); }}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant/50 hover:bg-surface-container font-label text-sm text-on-surface transition-all">Cancel</button>
                <button type="submit"
                  className="px-5 py-2.5 rounded-xl brand-gradient text-white font-label text-sm font-semibold transition-all">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
