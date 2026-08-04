import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

export default function SystemSettings() {
  const [collegeName, setCollegeName] = useState('Modern Institute College');
  const [collegeLogo, setCollegeLogo] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  
  // Chip input lists
  const [depts, setDepts] = useState(['CSE', 'ECE', 'Mechanical', 'Civil', 'MBA']);
  const [newDept, setNewDept] = useState('');
  
  const [categories, setCategories] = useState(['Late-comer', 'Non-uniform', 'Indiscipline', 'Others']);
  const [newCategory, setNewCategory] = useState('');

  // Password Policy
  const [minLength, setMinLength] = useState(6);
  const [requireSpecial, setRequireSpecial] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      const data = res.data;
      if (data) {
        setCollegeName(data.college_name || 'Modern Institute College');
        setCollegeLogo(data.college_logo || '');
        setAcademicYear(data.academic_year || '2025-2026');
        
        if (data.remark_categories) {
          setCategories(data.remark_categories.split(',').map(s => s.trim()).filter(Boolean));
        }

        const policy = typeof data.password_policy === 'string' ? JSON.parse(data.password_policy) : data.password_policy;
        if (policy) {
          setMinLength(policy.minLength || 6);
          setRequireSpecial(policy.requireSpecial || false);
        }
      }
      
      // Also get departments list
      const deptRes = await api.get('/admin/departments');
      if (deptRes.data && deptRes.data.length > 0) {
        setDepts(deptRes.data.map(d => d.name));
      }
    } catch (err) {
      console.warn('Backend settings query failed, rendering fallbacks:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAddDept = async (e) => {
    e.preventDefault();
    if (!newDept.trim()) return;
    const name = newDept.trim().toUpperCase();
    if (depts.includes(name)) {
      toast.error('Branch already exists.');
      return;
    }
    
    try {
      await api.post('/admin/departments', { name });
      setDepts([...depts, name]);
      setNewDept('');
      toast.success(`Department ${name} added.`);
    } catch (_) {
      // Offline fallback
      setDepts([...depts, name]);
      setNewDept('');
      toast.success(`Department ${name} added (Local mode).`);
    }
  };

  const handleRemoveDept = async (name) => {
    if (!window.confirm(`Are you sure you want to remove ${name}?`)) return;
    try {
      // Find id of dept
      const res = await api.get('/admin/departments');
      const dept = res.data.find(d => d.name === name);
      if (dept) {
        await api.delete(`/admin/departments/${dept.id}`);
      }
      setDepts(depts.filter(d => d !== name));
      toast.success(`Department ${name} removed.`);
    } catch (_) {
      setDepts(depts.filter(d => d !== name));
      toast.success(`Department ${name} removed (Local mode).`);
    }
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    const name = newCategory.trim();
    if (categories.includes(name)) {
      toast.error('Category already exists.');
      return;
    }
    setCategories([...categories, name]);
    setNewCategory('');
  };

  const handleRemoveCategory = (name) => {
    setCategories(categories.filter(c => c !== name));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/settings', {
        college_name: collegeName,
        college_logo: collegeLogo,
        academic_year: academicYear,
        remark_categories: categories.join(','),
        password_policy: { minLength, requireSpecial }
      });
      toast.success('Configuration parameters saved successfully!');
    } catch (err) {
      toast.error('Failed to update system configurations.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-outline">
        <span className="material-symbols-outlined text-4xl animate-spin mb-3">sync</span>
        <p className="font-label text-sm">Querying college parameters…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full overflow-y-auto p-5 md:p-8 xl:p-10 bg-surface">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header row */}
        <div className="border-b border-outline-variant/15 pb-5 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]">settings</span>
              System Settings
            </h1>
            <p className="font-body text-xs text-on-surface-variant mt-1">
              Adjust institution name, active academic years, remark definitions, and password requirements.
            </p>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl brand-gradient text-white text-sm font-label font-bold shadow-brand-sm hover:shadow-brand transition-all flex items-center gap-2 active:scale-[.98]"
          >
            {saving ? (
              <><span className="material-symbols-outlined animate-spin text-[16px]">sync</span> Saving...</>
            ) : (
              <><span className="material-symbols-outlined text-[16px]">save</span> Save Changes</>
            )}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Left / Main form */}
          <div className="md:col-span-2 space-y-6">
            
            {/* General Institution configurations */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-card space-y-4">
              <h3 className="font-display font-bold text-sm text-on-surface flex items-center gap-2 border-b border-outline-variant/10 pb-3">
                <span className="material-symbols-outlined text-primary">school</span>
                Institution Configurations
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">College Name</label>
                  <input
                    type="text"
                    value={collegeName}
                    onChange={e => setCollegeName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Academic Year</label>
                    <input
                      type="text"
                      value={academicYear}
                      onChange={e => setAcademicYear(e.target.value)}
                      placeholder="e.g. 2025-2026"
                      className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">College Logo Url</label>
                    <input
                      type="text"
                      value={collegeLogo}
                      onChange={e => setCollegeLogo(e.target.value)}
                      placeholder="e.g. https://path-to-logo.png"
                      className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Remark Categories customization */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-card space-y-4">
              <h3 className="font-display font-bold text-sm text-on-surface flex items-center gap-2 border-b border-outline-variant/10 pb-3">
                <span className="material-symbols-outlined text-primary">rate_review</span>
                Customize Remark Categories
              </h3>
              
              {/* Category chips list */}
              <div className="flex flex-wrap gap-2 py-1">
                {categories.map(cat => (
                  <span key={cat} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/40 text-indigo-700 dark:text-indigo-400 font-label font-bold text-xs">
                    {cat}
                    <button type="button" onClick={() => handleRemoveCategory(cat)} className="hover:text-red-500 font-bold ml-1 text-[14px] leading-none">×</button>
                  </span>
                ))}
              </div>

              {/* Add form */}
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add custom remark category (e.g. Non-uniform)"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-xs focus:outline-none"
                />
                <button type="submit" className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-label font-bold text-xs rounded-xl shadow-brand-sm">Add</button>
              </form>
            </div>

          </div>

          {/* Right sidebar form */}
          <div className="space-y-6">
            
            {/* Password security policies */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-card space-y-4">
              <h3 className="font-display font-bold text-sm text-on-surface flex items-center gap-2 border-b border-outline-variant/10 pb-3">
                <span className="material-symbols-outlined text-primary">security</span>
                Password Policies
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Minimum Password Length</label>
                  <input
                    type="number"
                    min={4}
                    max={20}
                    value={minLength}
                    onChange={e => setMinLength(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between p-1">
                  <div className="leading-tight">
                    <span className="font-display font-bold text-xs text-on-surface block">Require Special Character</span>
                    <span className="font-body text-[10px] text-on-surface-variant block mt-0.5">Force usage of symbols (@, #, $)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireSpecial}
                    onChange={e => setRequireSpecial(e.target.checked)}
                    className="w-4 h-4 text-primary rounded"
                  />
                </div>
              </div>
            </div>

            {/* Quick Departments lists */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-card space-y-4">
              <h3 className="font-display font-bold text-sm text-on-surface flex items-center gap-2 border-b border-outline-variant/10 pb-3">
                <span className="material-symbols-outlined text-primary">corporate_fare</span>
                Active Branches ({depts.length})
              </h3>
              
              <div className="flex flex-wrap gap-2 py-1 max-h-[120px] overflow-y-auto pr-1">
                {depts.map(d => (
                  <span key={d} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200/40 text-teal-700 dark:text-teal-400 font-label font-bold text-[11px]">
                    {d}
                    <button type="button" onClick={() => handleRemoveDept(d)} className="hover:text-red-500 font-bold ml-1">×</button>
                  </span>
                ))}
              </div>

              {/* Add form */}
              <form onSubmit={handleAddDept} className="flex gap-2 border-t border-outline-variant/15 pt-3">
                <input
                  type="text"
                  placeholder="e.g. Civil"
                  value={newDept}
                  onChange={e => setNewDept(e.target.value)}
                  className="flex-1 px-3 py-2 bg-surface-container border border-outline-variant/40 rounded-xl text-xs focus:outline-none"
                />
                <button type="submit" className="px-3 py-2 bg-primary hover:bg-primary/95 text-white font-label font-bold text-xs rounded-xl shadow-brand-sm">Add</button>
              </form>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
