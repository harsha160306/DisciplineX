import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const DEPT_OPTIONS = ['CSE', 'ECE', 'Mechanical', 'Civil', 'MBA'];

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [depts, setDepts] = useState(DEPT_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  
  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState(null);
  const [studentRemarks, setStudentRemarks] = useState([]);

  // Form states
  const [name, setName] = useState('');
  const [course, setCourse] = useState('B.Tech');
  const [department, setDepartment] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [section, setSection] = useState('');
  const [semester, setSemester] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [address, setAddress] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/students', {
        params: { search, department: selectedDept }
      });
      setStudents(res.data);
    } catch (err) {
      console.warn('Backend offline, using fallback student mock data:', err.message);
      // Seed default students
      setStudents([
        { id: 1, register_number: '2024CS101', name: 'Rahul Sharma', course: 'B.Tech', department: 'CSE', academic_year: '3rd Year', section: 'A', semester: 'V', email: 'rahul@gmail.com', phone: '9876543210', dob: '2005-07-22', blood_group: 'B+', address: 'Hyderabad, India', photo_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnM-pyl2GLRMVnjxwsCXyp4bZU_dGsSv6BzQCj0OKi8NlhK2UyNps1HU1jaO-RKjb9B_updyWAjRKfBDg572WWob87YdE1z3TdQcV8a2ef1wKEeFrB9sEdd27i_dIOWCyUVlMu7yFK_wIg3BX_KEVleXsL8hvR0fdmFsvCxZPM2qBBvYkaKN8J6PNGNIJVFnkkqqKKD13x4T5B4-oy5GOfVTfsdQ1i_tgyeDusR7TI6zX1MarWjuJGvuY-hBnEByhJW71sEbmPwDrB' },
        { id: 2, register_number: '2024ME045', name: 'Anjali Verma', course: 'B.Tech', department: 'Mechanical', academic_year: '2nd Year', section: 'B', semester: 'III', email: 'anjali@gmail.com', phone: '9876543211', dob: '2006-03-12', blood_group: 'O+', address: 'Chennai, India', photo_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTuEzyi6BX288E_wzMVHXWMUOfXKPnfoPAH-0dsuJNUGciaHdnYoTT5IyMfM-JJZ7OW1ZV70AIG19OH-9tzOJmQq8qbSS0Xg34ph03JJs5GmH2skFMmBT1Xw7a2IL6TSpY0ftt8RCdDU_LuiAX1WBu9ZPaWZzIH6GwRQIVRSprKZ-2ZlDKud2OZ_VEYon1QNT90Cs_CwlzK6xDNIjcFck0Y3tFfIkkamZS7duB52mqHKmOgPa_uVfZVj72aDAEqz9luXXxnSkVE_YB' },
        { id: 3, register_number: '2024CS102', name: 'Priya Patel', course: 'B.Tech', department: 'CSE', academic_year: '1st Year', section: 'A', semester: 'I', email: 'priya@gmail.com', phone: '9876543212', dob: '2007-09-05', blood_group: 'A+', address: 'Bangalore, India', photo_url: null }
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

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
  }, [search, selectedDept]);

  const resetForm = () => {
    setName('');
    setCourse('B.Tech');
    setDepartment('');
    setAcademicYear('');
    setSection('');
    setSemester('');
    setEmail('');
    setPhone('');
    setDob('');
    setBloodGroup('');
    setAddress('');
    setActiveStudent(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/students/${activeStudent.id}`, { name, course, department, academic_year: academicYear, section, semester, email, phone, dob, blood_group: bloodGroup, address });
      toast.success('Student details updated successfully.');
      setIsEditOpen(false);
      resetForm();
      fetchStudents();
    } catch (err) {
      toast.error('Failed to update student details.');
    }
  };

  const handleDelete = async (id, sName) => {
    if (!window.confirm(`Are you sure you want to permanently delete student ${sName}? This action will cascade delete all associated discipline remarks.`)) return;
    try {
      await api.delete(`/admin/students/${id}`);
      toast.success('Student record deleted successfully.');
      fetchStudents();
    } catch (err) {
      toast.error('Failed to delete student.');
    }
  };

  const openEdit = (s) => {
    setActiveStudent(s);
    setName(s.name);
    setCourse(s.course || 'B.Tech');
    setDepartment(s.department);
    setAcademicYear(s.academic_year);
    setSection(s.section || '');
    setSemester(s.semester || '');
    setEmail(s.email || '');
    setPhone(s.phone || '');
    setDob(s.dob || '');
    setBloodGroup(s.blood_group || '');
    setAddress(s.address || '');
    setIsEditOpen(true);
  };

  const openProfile = async (s) => {
    setActiveStudent(s);
    try {
      // Get student's remarks
      const res = await api.get('/admin/remarks', { params: { student: s.register_number } });
      setStudentRemarks(res.data);
    } catch (_) {
      setStudentRemarks([
        { id: 101, remark_text: 'Late-comer', created_at: '2026-07-18T09:00:00.000Z', recorder_name: 'Mr. A. Senthil' }
      ]);
    }
    setIsProfileOpen(true);
  };

  return (
    <div className="flex-1 w-full overflow-y-auto p-5 md:p-8 xl:p-10 bg-surface">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header row */}
        <div className="border-b border-outline-variant/15 pb-5">
          <h1 className="font-display font-bold text-2xl text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">school</span>
            Student Management
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Search, edit details, and view comprehensive disciplinary profiles of registered students.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search by name or register number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-on-surface font-body text-sm placeholder:text-outline focus:outline-none"
            />
          </div>
          <div className="relative min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">corporate_fare</span>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-on-surface font-body text-sm appearance-none focus:outline-none"
            >
              <option value="">All Departments</option>
              {depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">expand_more</span>
          </div>
        </div>

        {/* Student list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-outline">
            <span className="material-symbols-outlined text-4xl animate-spin mb-3">sync</span>
            <p className="font-label text-sm">Loading student database…</p>
          </div>
        ) : students.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-12 text-center text-outline">
            <span className="material-symbols-outlined text-5xl mb-3">person_search</span>
            <p className="font-label font-semibold text-base text-on-surface mb-1">No Students Found</p>
            <p className="font-body text-sm text-on-surface-variant">Check search filter or register students from HOD/Incharge portal.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {students.map(s => (
              <div key={s.id} className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5 shadow-card hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                <div>
                  {/* Photo & Basic Details */}
                  <div className="flex items-center gap-4 mb-4">
                    {s.photo_url ? (
                      <img src={s.photo_url} alt={s.name} className="w-14 h-14 rounded-2xl object-cover border border-outline-variant/20 shadow-sm shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl brand-gradient text-white flex items-center justify-center font-display font-black text-lg shadow-sm shrink-0">
                        {s.name.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-[15px] text-on-surface truncate">{s.name}</h3>
                      <p className="font-mono text-xs text-on-surface-variant uppercase tracking-tight">{s.register_number}</p>
                    </div>
                  </div>

                  {/* Branch & Year info */}
                  <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-3 rounded-2xl border border-outline-variant/10 text-xs font-label mb-5">
                    <div>
                      <span className="text-on-surface-variant block text-[10px] uppercase font-bold tracking-wider mb-0.5">Department</span>
                      <span className="text-on-surface font-semibold truncate block">{s.department}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block text-[10px] uppercase font-bold tracking-wider mb-0.5">Academic Year</span>
                      <span className="text-on-surface font-semibold truncate block">{s.academic_year}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-2 pt-2 border-t border-outline-variant/10">
                  <button
                    onClick={() => openProfile(s)}
                    className="flex-1 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label font-bold text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">account_circle</span>
                    Profile
                  </button>
                  <button
                    onClick={() => openEdit(s)}
                    className="py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label font-bold text-xs transition-colors flex items-center justify-center"
                    title="Edit Details"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(s.id, s.name)}
                    className="py-2 px-3 rounded-xl bg-surface-container hover:bg-red-50 dark:hover:bg-red-950/20 text-outline hover:text-red-500 transition-colors flex items-center justify-center"
                    title="Delete Student"
                  >
                    <span className="material-symbols-outlined text-[15px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── STUDENT PROFILE MODAL ─── */}
      {isProfileOpen && activeStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-outline-variant/15 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">account_circle</span>
                Student Profile Details
              </h3>
              <button onClick={() => { setIsProfileOpen(false); resetForm(); }} className="text-outline hover:text-on-surface p-1 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Profile Card Summary */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-surface-container rounded-3xl border border-outline-variant/10">
                {activeStudent.photo_url ? (
                  <img src={activeStudent.photo_url} alt={activeStudent.name} className="w-20 h-20 rounded-2xl object-cover border shadow-md shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl brand-gradient text-white flex items-center justify-center font-display font-black text-3xl shadow-md shrink-0">
                    {activeStudent.name.slice(0, 1)}
                  </div>
                )}
                <div className="text-center sm:text-left">
                  <h4 className="font-display font-extrabold text-lg text-on-surface">{activeStudent.name}</h4>
                  <p className="font-mono text-xs text-primary font-bold uppercase mt-0.5">{activeStudent.register_number}</p>
                  <p className="font-body text-xs text-on-surface-variant mt-1.5">{activeStudent.course} · {activeStudent.department} · {activeStudent.academic_year}</p>
                </div>
              </div>

              {/* General details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Academic Year', val: activeStudent.academic_year },
                  { label: 'Semester', val: activeStudent.semester || 'N/A' },
                  { label: 'Section', val: activeStudent.section || 'N/A' },
                  { label: 'Dob', val: activeStudent.dob || 'N/A' },
                  { label: 'Blood Group', val: activeStudent.blood_group || 'N/A' },
                  { label: 'Mobile Number', val: activeStudent.phone || 'N/A' },
                  { label: 'Email', val: activeStudent.email || 'N/A' },
                  { label: 'Course', val: activeStudent.course || 'B.Tech' },
                  { label: 'Address', val: activeStudent.address || 'N/A', span: 'col-span-2 sm:col-span-3' }
                ].map(item => (
                  <div key={item.label} className={`p-3 bg-surface-container-low rounded-xl border border-outline-variant/10 ${item.span || ''}`}>
                    <span className="font-label text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block mb-0.5">{item.label}</span>
                    <span className="font-body text-sm font-semibold text-on-surface block leading-snug">{item.val}</span>
                  </div>
                ))}
              </div>

              {/* Remarks History */}
              <div className="space-y-3">
                <h4 className="font-display font-bold text-sm text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-rose-500 text-[18px]">gavel</span>
                  Discipline Remarks History ({studentRemarks.length})
                </h4>
                {studentRemarks.length === 0 ? (
                  <p className="text-xs text-on-surface-variant bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl border border-emerald-200/30 font-label font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    This student has clean records! No remarks recorded.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {studentRemarks.map((rem, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200/30 rounded-xl text-xs font-body">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-label font-bold uppercase text-[9px] mr-2">{rem.remark_text}</span>
                          <span className="text-on-surface-variant font-medium">Recorded by {rem.recorder_name}</span>
                        </div>
                        <span className="text-on-surface-variant font-mono">{new Date(rem.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className="px-6 py-4 bg-surface-container border-t border-outline-variant/15 flex justify-end">
              <button onClick={() => { setIsProfileOpen(false); resetForm(); }}
                className="px-5 py-2.5 rounded-xl brand-gradient text-white font-label font-bold text-sm shadow-brand-sm hover:opacity-95 transition-all">Close Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT STUDENT DETAILS MODAL ─── */}
      {isEditOpen && activeStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/15 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit</span>
                Edit Student Details
              </h3>
              <button onClick={() => { setIsEditOpen(false); resetForm(); }} className="text-outline hover:text-on-surface p-1 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Student Name</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Register Number</label>
                  <input type="text" disabled value={activeStudent.register_number}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm text-outline cursor-not-allowed" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Department</label>
                  <select required value={department} onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none appearance-none">
                    {depts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Academic Year</label>
                  <select required value={academicYear} onChange={e => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none appearance-none">
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Course</label>
                  <input type="text" required value={course} onChange={e => setCourse(e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Semester</label>
                  <input type="text" required value={semester} onChange={e => setSemester(e.target.value)} placeholder="e.g. V"
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Section</label>
                  <input type="text" required value={section} onChange={e => setSection(e.target.value)} placeholder="e.g. A"
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Date of Birth</label>
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Blood Group</label>
                  <input type="text" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} placeholder="e.g. B+"
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@gmail.com"
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Phone Number</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210"
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Address</label>
                <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Full residence address" rows={2}
                  className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none resize-none" />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/15">
                <button type="button" onClick={() => { setIsEditOpen(false); resetForm(); }}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant/50 hover:bg-surface-container font-label text-sm text-on-surface transition-all">Cancel</button>
                <button type="submit"
                  className="px-5 py-2.5 rounded-xl brand-gradient text-white font-label text-sm font-semibold transition-all">Save Details</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
