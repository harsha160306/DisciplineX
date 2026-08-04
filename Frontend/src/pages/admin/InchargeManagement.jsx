import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const DEPT_OPTIONS = ['CSE', 'ECE', 'Mechanical', 'Civil', 'MBA'];

export default function InchargeManagement() {
  const [incharges, setIncharges] = useState([]);
  const [depts, setDepts] = useState(DEPT_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [activeIncharge, setActiveIncharge] = useState(null);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const fetchIncharges = async () => {
    try {
      const res = await api.get('/admin/incharges');
      setIncharges(res.data);
    } catch (err) {
      console.warn('Backend offline, using fallback mock data:', err.message);
      setIncharges([
        { id: 4, name: 'Mr. A. Senthil', employee_id: 'INC001', department: 'CSE', email: 'incharge_cse1@mic.edu', phone: '9500012001', status: 'Active', designation: 'Assistant Professor' },
        { id: 5, name: 'Ms. B. Divya', employee_id: 'INC002', department: 'CSE', email: 'incharge_cse2@mic.edu', phone: '9500012002', status: 'Active', designation: 'Assistant Professor' },
        { id: 6, name: 'Mr. C. Rajan', employee_id: 'INC003', department: 'ECE', email: 'incharge_ece1@mic.edu', phone: '9500012003', status: 'Inactive', designation: 'Associate Professor' }
      ]);
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

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchIncharges(), fetchDepartments()]);
      setLoading(false);
    })();
  }, []);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setName('');
    setDepartment('');
    setEmployeeId('');
    setEmail('');
    setPhone('');
    setDesignation('');
    setNewPassword('');
    setActiveIncharge(null);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/incharges', { username, password, name, department, phone, employee_id: employeeId, email, designation });
      toast.success('Incharge account created successfully.');
      setIsAddOpen(false);
      resetForm();
      fetchIncharges();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create Incharge.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/incharges/${activeIncharge.id}`, { name, department, phone, employee_id: employeeId, email, designation });
      toast.success('Incharge details updated.');
      setIsEditOpen(false);
      resetForm();
      fetchIncharges();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update Incharge details.');
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/incharges/${activeIncharge.id}/reset-password`, { password: newPassword });
      toast.success('Password updated successfully.');
      setIsResetOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete Incharge ${name}?`)) return;
    try {
      await api.delete(`/admin/incharges/${id}`);
      toast.success('Incharge account deleted.');
      fetchIncharges();
    } catch (err) {
      toast.error('Failed to delete account.');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await api.put(`/admin/incharges/${id}/status`, { status: nextStatus });
      toast.success(`Incharge status updated to ${nextStatus}.`);
      fetchIncharges();
    } catch (err) {
      toast.error('Failed to change status.');
    }
  };

  const openEdit = (inc) => {
    setActiveIncharge(inc);
    setName(inc.name);
    setDepartment(inc.department);
    setEmployeeId(inc.employee_id || '');
    setEmail(inc.email || '');
    setPhone(inc.phone || '');
    setDesignation(inc.designation || '');
    setIsEditOpen(true);
  };

  const openReset = (inc) => {
    setActiveIncharge(inc);
    setIsResetOpen(true);
  };

  const filteredIncharges = incharges.filter(inc =>
    inc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inc.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inc.employee_id && inc.employee_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 w-full overflow-y-auto p-5 md:p-8 xl:p-10 bg-surface">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/15 pb-5">
          <div>
            <h1 className="font-display font-bold text-2xl text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]">badge</span>
              Discipline Incharge Management
            </h1>
            <p className="font-body text-xs text-on-surface-variant mt-1">
              Add, edit, assign departments, and reset credentials for college discipline officers.
            </p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-5 py-2.5 rounded-xl brand-gradient text-white text-sm font-label font-semibold shadow-brand-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-[.98]"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add Incharge
          </button>
        </div>

        {/* Search bar */}
        <div className="flex max-w-md relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search by name, employee ID, department..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-on-surface font-body text-sm placeholder:text-outline focus:outline-none transition-all"
          />
        </div>

        {/* Incharge List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-outline">
            <span className="material-symbols-outlined text-4xl animate-spin mb-3">sync</span>
            <p className="font-label text-sm">Loading Incharge accounts…</p>
          </div>
        ) : filteredIncharges.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-12 text-center text-outline">
            <span className="material-symbols-outlined text-5xl mb-3">badge</span>
            <p className="font-label font-semibold text-base text-on-surface mb-1">No Incharge Accounts Found</p>
            <p className="font-body text-sm text-on-surface-variant">Create a new Incharge account to get started.</p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/30 font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Employee ID</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Designation</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Mobile Number</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 font-body text-sm">
                  {filteredIncharges.map(inc => (
                    <tr key={inc.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-4 font-semibold text-on-surface">{inc.name}</td>
                      <td className="px-6 py-4 font-mono text-xs">{inc.employee_id || 'N/A'}</td>
                      <td className="px-6 py-4"><span className="px-2.5 py-1 text-xs rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 font-semibold">{inc.department}</span></td>
                      <td className="px-6 py-4 text-on-surface-variant">{inc.designation || 'Discipline Incharge'}</td>
                      <td className="px-6 py-4 text-on-surface-variant">{inc.email || 'N/A'}</td>
                      <td className="px-6 py-4 text-on-surface-variant">{inc.phone || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(inc.id, inc.status)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                            inc.status === 'Active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${inc.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {inc.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openReset(inc)}
                            className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-all"
                            title="Reset Credentials"
                          >
                            <span className="material-symbols-outlined text-[18px]">key</span>
                          </button>
                          <button
                            onClick={() => openEdit(inc)}
                            className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-all"
                            title="Edit Details"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(inc.id, inc.name)}
                            className="p-1.5 rounded-lg text-outline hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                            title="Delete Incharge"
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

      {/* ─── ADD INCHARGE MODAL ─── */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/15 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person_add</span>
                Add Discipline Incharge
              </h3>
              <button onClick={() => { setIsAddOpen(false); resetForm(); }} className="text-outline hover:text-on-surface p-1 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Username</label>
                  <input type="text" required value={username} onChange={e => setUsername(e.target.value)} placeholder="incharge_cse1"
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Password</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>
              
              <div>
                <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Full Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Mr. A. Senthil"
                  className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Department</label>
                  <select required value={department} onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none appearance-none">
                    <option value="" disabled>Select Department</option>
                    {depts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Employee ID</label>
                  <input type="text" value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="INC001"
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Designation</label>
                <input type="text" value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Assistant Professor / Physical Director"
                  className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="incharge@mic.edu"
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Mobile Number</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9500012001"
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/15">
                <button type="button" onClick={() => { setIsAddOpen(false); resetForm(); }}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant/50 hover:bg-surface-container font-label text-sm text-on-surface transition-all">Cancel</button>
                <button type="submit"
                  className="px-5 py-2.5 rounded-xl brand-gradient text-white font-label text-sm font-semibold transition-all">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT INCHARGE MODAL ─── */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/15 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit</span>
                Edit Incharge Details
              </h3>
              <button onClick={() => { setIsEditOpen(false); resetForm(); }} className="text-outline hover:text-on-surface p-1 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Full Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Mr. A. Senthil"
                  className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Department</label>
                  <select required value={department} onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none appearance-none">
                    {depts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Employee ID</label>
                  <input type="text" value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="INC001"
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Designation</label>
                <input type="text" value={designation} onChange={e => setDesignation(e.target.value)} placeholder="Assistant Professor"
                  className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="incharge@mic.edu"
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Mobile Number</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9500012001"
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/15">
                <button type="button" onClick={() => { setIsEditOpen(false); resetForm(); }}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant/50 hover:bg-surface-container font-label text-sm text-on-surface transition-all">Cancel</button>
                <button type="submit"
                  className="px-5 py-2.5 rounded-xl brand-gradient text-white font-label text-sm font-semibold transition-all">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── RESET PASSWORD MODAL ─── */}
      {isResetOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/15 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">key</span>
                Reset Credentials
              </h3>
              <button onClick={() => { setIsResetOpen(false); resetForm(); }} className="text-outline hover:text-on-surface p-1 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
              <p className="font-body text-xs text-on-surface-variant">
                You are updating the credentials for <span className="font-semibold text-on-surface">{activeIncharge?.name}</span>.
              </p>
              <div>
                <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">New Password</label>
                <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/15">
                <button type="button" onClick={() => { setIsResetOpen(false); resetForm(); }}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant/50 hover:bg-surface-container font-label text-sm text-on-surface transition-all">Cancel</button>
                <button type="submit"
                  className="px-5 py-2.5 rounded-xl brand-gradient text-white font-label text-sm font-semibold transition-all">Update Credentials</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
