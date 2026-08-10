import User from '../models/User.js';
import Department from '../models/Department.js';
import Student from '../models/Student.js';
import Remark from '../models/Remark.js';
import ActivityLog from '../models/ActivityLog.js';
import SystemSetting from '../models/SystemSetting.js';

const recordActivity = async (userName, userRole, action) => {
  try {
    const now = new Date();
    const date = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    await ActivityLog.create({
      user_name: userName,
      user_role: userRole,
      action,
      date,
      time
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

// ─── HOD MANAGEMENT ──────────────────────────────────────────────────────────

export const getHODs = async (req, res) => {
  try {
    const hods = await User.find({ role: 'HOD' }).select('-password');
    res.status(200).json(hods.map(h => ({ ...h._doc, id: h._id })));
  } catch (error) {
    console.error('getHODs error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const createHOD = async (req, res) => {
  try {
    const { username, password, name, department, phone, employee_id, email } = req.body;
    if (!username || !password || !name || !department) {
      return res.status(400).json({ message: 'Username, password, name and department are required.' });
    }

    try {
      await User.create({
        username, password, role: 'HOD', name, department, phone: phone || '', employee_id: employee_id || '', email: email || '', status: 'Active', designation: 'HOD'
      });
    } catch (dbErr) {
      if (dbErr.code === 11000) return res.status(409).json({ message: 'Username already exists.' });
      throw dbErr;
    }

    await recordActivity(req.user.name, req.user.role, `Added HOD: ${name} (${department})`);
    res.status(201).json({ message: 'HOD account created successfully.' });
  } catch (error) {
    console.error('createHOD error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updateHOD = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, phone, employee_id, email } = req.body;
    if (!name || !department) return res.status(400).json({ message: 'Name and department are required.' });

    const updated = await User.findOneAndUpdate({ _id: id, role: 'HOD' }, { name, department, phone: phone || '', employee_id: employee_id || '', email: email || '' }, { new: true });
    if (!updated) return res.status(404).json({ message: 'HOD not found.' });

    await recordActivity(req.user.name, req.user.role, `Updated HOD details: ${name}`);
    res.status(200).json({ message: 'HOD details updated successfully.' });
  } catch (error) {
    console.error('updateHOD error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const deleteHOD = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findOneAndDelete({ _id: id, role: 'HOD' });
    if (!deleted) return res.status(404).json({ message: 'HOD not found.' });

    await recordActivity(req.user.name, req.user.role, `Deleted HOD account: ${deleted.name}`);
    res.status(200).json({ message: 'HOD account deleted successfully.' });
  } catch (error) {
    console.error('deleteHOD error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const resetHODPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'New password is required.' });

    const updated = await User.findOneAndUpdate({ _id: id, role: 'HOD' }, { password });
    if (!updated) return res.status(404).json({ message: 'HOD not found.' });

    await recordActivity(req.user.name, req.user.role, `Reset password for HOD: ${updated.name}`);
    res.status(200).json({ message: 'HOD password reset successfully.' });
  } catch (error) {
    console.error('resetHODPassword error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const toggleHODStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required.' });

    const updated = await User.findOneAndUpdate({ _id: id, role: 'HOD' }, { status });
    if (!updated) return res.status(404).json({ message: 'HOD not found.' });

    await recordActivity(req.user.name, req.user.role, `${status === 'Active' ? 'Activated' : 'Deactivated'} HOD account: ${updated.name}`);
    res.status(200).json({ message: `HOD status updated to ${status}.` });
  } catch (error) {
    console.error('toggleHODStatus error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── DISCIPLINE INCHARGE MANAGEMENT ──────────────────────────────────────────

export const getIncharges = async (req, res) => {
  try {
    const incharges = await User.find({ role: 'Incharge' }).select('-password');
    res.status(200).json(incharges.map(i => ({ ...i._doc, id: i._id })));
  } catch (error) {
    console.error('getIncharges error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const createIncharge = async (req, res) => {
  try {
    const { username, password, name, department, phone, employee_id, email, designation } = req.body;
    if (!username || !password || !name || !department) return res.status(400).json({ message: 'Username, password, name and department are required.' });

    try {
      await User.create({
        username, password, role: 'Incharge', name, department, phone: phone || '', employee_id: employee_id || '', email: email || '', status: 'Active', designation: designation || 'Discipline Incharge'
      });
    } catch (dbErr) {
      if (dbErr.code === 11000) return res.status(409).json({ message: 'Username already exists.' });
      throw dbErr;
    }

    await recordActivity(req.user.name, req.user.role, `Added Incharge: ${name} (${department})`);
    res.status(201).json({ message: 'Incharge account created successfully.' });
  } catch (error) {
    console.error('createIncharge error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updateIncharge = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, phone, employee_id, email, designation } = req.body;
    if (!name || !department) return res.status(400).json({ message: 'Name and department are required.' });

    const updated = await User.findOneAndUpdate({ _id: id, role: 'Incharge' }, { name, department, phone: phone || '', employee_id: employee_id || '', email: email || '', designation: designation || 'Discipline Incharge' });
    if (!updated) return res.status(404).json({ message: 'Incharge not found.' });

    await recordActivity(req.user.name, req.user.role, `Updated Incharge details: ${name}`);
    res.status(200).json({ message: 'Incharge details updated successfully.' });
  } catch (error) {
    console.error('updateIncharge error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const deleteIncharge = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findOneAndDelete({ _id: id, role: 'Incharge' });
    if (!deleted) return res.status(404).json({ message: 'Incharge not found.' });

    await recordActivity(req.user.name, req.user.role, `Deleted Incharge account: ${deleted.name}`);
    res.status(200).json({ message: 'Incharge account deleted successfully.' });
  } catch (error) {
    console.error('deleteIncharge error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const resetInchargePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'New password is required.' });

    const updated = await User.findOneAndUpdate({ _id: id, role: 'Incharge' }, { password });
    if (!updated) return res.status(404).json({ message: 'Incharge not found.' });

    await recordActivity(req.user.name, req.user.role, `Reset password for Incharge: ${updated.name}`);
    res.status(200).json({ message: 'Incharge password reset successfully.' });
  } catch (error) {
    console.error('resetInchargePassword error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const toggleInchargeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required.' });

    const updated = await User.findOneAndUpdate({ _id: id, role: 'Incharge' }, { status });
    if (!updated) return res.status(404).json({ message: 'Incharge not found.' });

    await recordActivity(req.user.name, req.user.role, `${status === 'Active' ? 'Activated' : 'Deactivated'} Incharge account: ${updated.name}`);
    res.status(200).json({ message: `Incharge status updated to ${status}.` });
  } catch (error) {
    console.error('toggleInchargeStatus error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── DEPARTMENT MANAGEMENT ───────────────────────────────────────────────────

export const getDepartments = async (req, res) => {
  try {
    const depts = await Department.find();
    const allUsers = await User.find({ role: { $in: ['HOD', 'Incharge'] } });
    const allStudents = await Student.find();

    const detailedDepts = depts.map(d => {
      const hod = allUsers.find(u => u.role === 'HOD' && u.department === d.name);
      const totalIncharges = allUsers.filter(u => u.role === 'Incharge' && u.department === d.name).length;
      const totalStudents = allStudents.filter(s => s.department === d.name).length;
      return { id: d._id, name: d.name, hod: hod ? hod.name : 'Not Assigned', totalStudents, totalIncharges };
    });

    res.status(200).json(detailedDepts);
  } catch (error) {
    console.error('getDepartments error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Department name is required.' });

    try {
      await Department.create({ name });
    } catch (dbErr) {
      if (dbErr.code === 11000) return res.status(409).json({ message: 'Department already exists.' });
      throw dbErr;
    }

    await recordActivity(req.user.name, req.user.role, `Created department: ${name}`);
    res.status(201).json({ message: 'Department created successfully.' });
  } catch (error) {
    console.error('createDepartment error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Department name is required.' });

    const updated = await Department.findByIdAndUpdate(id, { name });
    if (!updated) return res.status(404).json({ message: 'Department not found.' });

    await recordActivity(req.user.name, req.user.role, `Updated department: ${updated.name} to ${name}`);
    res.status(200).json({ message: 'Department updated successfully.' });
  } catch (error) {
    console.error('updateDepartment error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Department.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Department not found.' });

    await recordActivity(req.user.name, req.user.role, `Deleted department: ${deleted.name}`);
    res.status(200).json({ message: 'Department deleted successfully.' });
  } catch (error) {
    console.error('deleteDepartment error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── STUDENT MANAGEMENT ──────────────────────────────────────────────────────

export const getStudents = async (req, res) => {
  try {
    const { search, department } = req.query;
    
    let query = {};
    if (department) query.department = department;
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { register_number: regex }];
    }

    const students = await Student.find(query);
    res.status(200).json(students.map(s => ({ ...s._doc, id: s._id })));
  } catch (error) {
    console.error('getStudents error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, course, department, academic_year, section, semester, email, phone, dob, blood_group, address } = req.body;
    if (!name || !department || !academic_year || !section || !semester) return res.status(400).json({ message: 'Required fields missing.' });

    const updated = await Student.findByIdAndUpdate(id, { name, course: course || 'B.Tech', department, academic_year, section, semester, email: email || '', phone: phone || '', dob: dob || null, blood_group: blood_group || '', address: address || '' });
    if (!updated) return res.status(404).json({ message: 'Student not found.' });

    await recordActivity(req.user.name, req.user.role, `Updated student details: ${name} (${updated.register_number})`);
    res.status(200).json({ message: 'Student details updated successfully.' });
  } catch (error) {
    console.error('updateStudent error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Student.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Student not found.' });

    await recordActivity(req.user.name, req.user.role, `Deleted student: ${deleted.name} (${deleted.register_number})`);
    res.status(200).json({ message: 'Student deleted successfully.' });
  } catch (error) {
    console.error('deleteStudent error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── REMARKS MANAGEMENT ──────────────────────────────────────────────────────

export const getRemarks = async (req, res) => {
  try {
    const { department, academic_year, month, student, remark_category } = req.query;

    let query = {};
    if (remark_category) query.remark_text = { $regex: new RegExp(`^${remark_category}$`, 'i') };
    if (month) {
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      query.created_at = { $gte: startDate, $lte: endDate };
    }

    let remarks = await Remark.find(query).populate('student_id').populate('recorded_by').sort({ created_at: -1 });

    let filtered = remarks.map(r => ({
      id: r._id,
      student_id: r.student_id ? r.student_id._id : null,
      remark_text: r.remark_text,
      recorded_by: r.recorded_by ? r.recorded_by._id : null,
      created_at: r.created_at,
      student_name: r.student_id ? r.student_id.name : 'Unknown',
      register_number: r.student_id ? r.student_id.register_number : 'Unknown',
      department: r.student_id ? r.student_id.department : 'Unknown',
      academic_year: r.student_id ? r.student_id.academic_year : 'Unknown',
      photo_url: r.student_id ? r.student_id.photo_url : null,
      recorder_name: r.recorded_by ? r.recorded_by.name : 'Unknown',
      recorder_role: r.recorded_by ? r.recorded_by.role : 'Unknown'
    }));

    if (department) filtered = filtered.filter(r => r.department === department);
    if (academic_year) filtered = filtered.filter(r => r.academic_year === academic_year);
    if (student) {
      const q = student.toLowerCase();
      filtered = filtered.filter(r => r.student_name.toLowerCase().includes(q) || r.register_number.toLowerCase().includes(q));
    }

    res.status(200).json(filtered);
  } catch (error) {
    console.error('getRemarks error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const deleteRemark = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Remark.findByIdAndDelete(id).populate('student_id');
    if (!deleted) return res.status(404).json({ message: 'Remark not found.' });

    await recordActivity(req.user.name, req.user.role, `Deleted remark for student: ${deleted.student_id ? deleted.student_id.name : 'Unknown'}`);
    res.status(200).json({ message: 'Remark deleted successfully.' });
  } catch (error) {
    console.error('deleteRemark error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── USER ACTIVITY LOGS ──────────────────────────────────────────────────────

export const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ created_at: -1 }).limit(500);
    res.status(200).json(logs.map(l => ({ user: l.user_name, role: l.user_role, action: l.action, date: l.date, time: l.time, created_at: l.created_at })));
  } catch (error) {
    console.error('getActivityLogs error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const createActivityLog = async (req, res) => {
  try {
    const { action } = req.body;
    if (!action) return res.status(400).json({ message: 'Action is required.' });
    await recordActivity(req.user.name, req.user.role, action);
    res.status(201).json({ message: 'Activity logged successfully.' });
  } catch (error) {
    console.error('createActivityLog error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── SYSTEM SETTINGS ─────────────────────────────────────────────────────────

export const getSystemSettings = async (req, res) => {
  try {
    const rows = await SystemSetting.find();
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });

    res.status(200).json({
      college_name: settings.college_name || 'Modern Institute College',
      college_logo: settings.college_logo || '',
      academic_year: settings.academic_year || '2025-2026',
      remark_categories: settings.remark_categories || 'Late-comer, Non-uniform, Indiscipline, Others',
      password_policy: settings.password_policy || '{"minLength":6,"requireSpecial":false}'
    });
  } catch (error) {
    console.error('getSystemSettings error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updateSystemSettings = async (req, res) => {
  try {
    const { college_name, college_logo, academic_year, remark_categories, password_policy } = req.body;
    const updates = {
      college_name: college_name || 'Modern Institute College',
      college_logo: college_logo || '',
      academic_year: academic_year || '2025-2026',
      remark_categories: remark_categories || 'Late-comer, Non-uniform, Indiscipline, Others',
      password_policy: typeof password_policy === 'string' ? password_policy : JSON.stringify(password_policy || { minLength: 6, requireSpecial: false })
    };

    for (const key of Object.keys(updates)) {
      await SystemSetting.findOneAndUpdate({ setting_key: key }, { setting_value: updates[key] }, { upsert: true });
    }

    await recordActivity(req.user.name, req.user.role, 'Updated system settings');
    res.status(200).json({ message: 'System settings updated successfully.' });
  } catch (error) {
    console.error('updateSystemSettings error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── ANALYTICS & DASHBOARD ────────────────────────────────────────────────────

export const getAdminAnalytics = async (req, res) => {
  try {
    const remarks = await Remark.find().populate('student_id');
    const totalStudents = await Student.countDocuments();
    const totalHODs = await User.countDocuments({ role: 'HOD' });
    const totalIncharges = await User.countDocuments({ role: 'Incharge' });
    const totalDepartments = await Department.countDocuments();
    const totalRemarks = remarks.length;

    const deptWise = {};
    remarks.forEach(r => {
      if (r.student_id) {
        const d = r.student_id.department;
        deptWise[d] = (deptWise[d] || 0) + 1;
      }
    });
    const remarksByDeptData = Object.keys(deptWise).map(k => ({ name: k, remarks: deptWise[k] }));

    const categoryCounts = { 'Late-comer': 0, 'Non-uniform': 0, 'Indiscipline': 0, 'Others': 0 };
    remarks.forEach(r => {
      if (categoryCounts[r.remark_text] !== undefined) categoryCounts[r.remark_text]++;
      else categoryCounts['Others']++;
    });
    const remarkCategoriesData = Object.keys(categoryCounts).map(k => ({ name: k, value: categoryCounts[k] })).filter(c => c.value > 0);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last6 = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6.push({ label: months[d.getMonth()], key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, remarks: 0 });
    }

    remarks.forEach(r => {
      const rDate = new Date(r.created_at);
      const rKey = `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, '0')}`;
      const bucket = last6.find(b => b.key === rKey);
      if (bucket) bucket.remarks++;
    });

    res.status(200).json({
      summary: { totalStudents, totalRemarks, totalHODs, totalIncharges, totalDepartments },
      charts: { remarksByDept: remarksByDeptData, remarkCategories: remarkCategoriesData, monthlyRemarks: last6.map(b => ({ month: b.label, remarks: b.remarks })) }
    });
  } catch (error) {
    console.error('getAdminAnalytics error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── ADMIN PROFILE & PASSWORD ───────────────────────────────────────────────

export const updateAdminProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required.' });

    await User.findOneAndUpdate({ _id: req.user.id, role: 'Admin' }, { name, email: email || '', phone: phone || '' });
    await recordActivity(req.user.name, req.user.role, 'Updated admin profile details');
    res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('updateAdminProfile error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const changeAdminPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters long.' });

    await User.findOneAndUpdate({ _id: req.user.id, role: 'Admin' }, { password });
    await recordActivity(req.user.name, req.user.role, 'Changed admin password');
    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('changeAdminPassword error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
