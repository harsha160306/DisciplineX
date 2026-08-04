import pool from '../db.js';

// Helper to log administrative activities
const recordActivity = async (userName, userRole, action) => {
  try {
    const now = new Date();
    const date = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    await pool.query(
      'INSERT INTO activity_logs (user_name, user_role, action, date, time) VALUES (?, ?, ?, ?, ?)',
      [userName, userRole, action, date, time]
    );
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

// ─── HOD MANAGEMENT ──────────────────────────────────────────────────────────

export const getHODs = async (req, res) => {
  try {
    const [hods] = await pool.query("SELECT id, username, name, department, phone, employee_id, email, status, designation FROM users WHERE role = 'HOD'");
    res.status(200).json(hods);
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

    await pool.query(
      'INSERT INTO users (username, password, role, name, department, phone, employee_id, email, status, designation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [username, password, 'HOD', name, department, phone || '', employee_id || '', email || '', 'Active', 'HOD']
    );

    await recordActivity(req.user.name, req.user.role, `Added HOD: ${name} (${department})`);

    res.status(201).json({ message: 'HOD account created successfully.' });
  } catch (error) {
    console.error('createHOD error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username already exists.' });
    }
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updateHOD = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, phone, employee_id, email } = req.body;
    if (!name || !department) {
      return res.status(400).json({ message: 'Name and department are required.' });
    }

    const [existing] = await pool.query("SELECT * FROM users WHERE id = ? AND role = 'HOD'", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'HOD not found.' });
    }

    await pool.query(
      'UPDATE users SET name = ?, email = ?, phone = ?, employee_id = ?, department = ? WHERE id = ? AND role = ?',
      [name, email || '', phone || '', employee_id || '', department, id, 'HOD']
    );

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
    const [existing] = await pool.query("SELECT * FROM users WHERE id = ? AND role = 'HOD'", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'HOD not found.' });
    }

    await pool.query("DELETE FROM users WHERE id = ? AND role = 'HOD'", [id]);
    await recordActivity(req.user.name, req.user.role, `Deleted HOD account: ${existing[0].name}`);

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
    if (!password) {
      return res.status(400).json({ message: 'New password is required.' });
    }

    const [existing] = await pool.query("SELECT * FROM users WHERE id = ? AND role = 'HOD'", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'HOD not found.' });
    }

    await pool.query("UPDATE users SET password = ? WHERE id = ? AND role = 'HOD'", [password, id]);
    await recordActivity(req.user.name, req.user.role, `Reset password for HOD: ${existing[0].name}`);

    res.status(200).json({ message: 'HOD password reset successfully.' });
  } catch (error) {
    console.error('resetHODPassword error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const toggleHODStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Active' or 'Inactive'
    if (!status) {
      return res.status(400).json({ message: 'Status is required.' });
    }

    const [existing] = await pool.query("SELECT * FROM users WHERE id = ? AND role = 'HOD'", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'HOD not found.' });
    }

    await pool.query("UPDATE users SET status = ? WHERE id = ? AND role = 'HOD'", [status, id]);
    await recordActivity(req.user.name, req.user.role, `${status === 'Active' ? 'Activated' : 'Deactivated'} HOD account: ${existing[0].name}`);

    res.status(200).json({ message: `HOD status updated to ${status}.` });
  } catch (error) {
    console.error('toggleHODStatus error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── DISCIPLINE INCHARGE MANAGEMENT ──────────────────────────────────────────

export const getIncharges = async (req, res) => {
  try {
    const [incharges] = await pool.query("SELECT id, username, name, department, phone, employee_id, email, status, designation FROM users WHERE role = 'Incharge'");
    res.status(200).json(incharges);
  } catch (error) {
    console.error('getIncharges error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const createIncharge = async (req, res) => {
  try {
    const { username, password, name, department, phone, employee_id, email, designation } = req.body;
    if (!username || !password || !name || !department) {
      return res.status(400).json({ message: 'Username, password, name and department are required.' });
    }

    await pool.query(
      'INSERT INTO users (username, password, role, name, department, phone, employee_id, email, status, designation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [username, password, 'Incharge', name, department, phone || '', employee_id || '', email || '', 'Active', designation || 'Discipline Incharge']
    );

    await recordActivity(req.user.name, req.user.role, `Added Incharge: ${name} (${department})`);

    res.status(201).json({ message: 'Incharge account created successfully.' });
  } catch (error) {
    console.error('createIncharge error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username already exists.' });
    }
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updateIncharge = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, phone, employee_id, email, designation } = req.body;
    if (!name || !department) {
      return res.status(400).json({ message: 'Name and department are required.' });
    }

    const [existing] = await pool.query("SELECT * FROM users WHERE id = ? AND role = 'Incharge'", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Incharge not found.' });
    }

    await pool.query(
      'UPDATE users SET name = ?, email = ?, phone = ?, employee_id = ?, department = ?, designation = ? WHERE id = ? AND role = ?',
      [name, email || '', phone || '', employee_id || '', department, designation || 'Discipline Incharge', id, 'Incharge']
    );

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
    const [existing] = await pool.query("SELECT * FROM users WHERE id = ? AND role = 'Incharge'", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Incharge not found.' });
    }

    await pool.query("DELETE FROM users WHERE id = ? AND role = 'Incharge'", [id]);
    await recordActivity(req.user.name, req.user.role, `Deleted Incharge account: ${existing[0].name}`);

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
    if (!password) {
      return res.status(400).json({ message: 'New password is required.' });
    }

    const [existing] = await pool.query("SELECT * FROM users WHERE id = ? AND role = 'Incharge'", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Incharge not found.' });
    }

    await pool.query("UPDATE users SET password = ? WHERE id = ? AND role = 'Incharge'", [password, id]);
    await recordActivity(req.user.name, req.user.role, `Reset password for Incharge: ${existing[0].name}`);

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
    if (!status) {
      return res.status(400).json({ message: 'Status is required.' });
    }

    const [existing] = await pool.query("SELECT * FROM users WHERE id = ? AND role = 'Incharge'", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Incharge not found.' });
    }

    await pool.query("UPDATE users SET status = ? WHERE id = ? AND role = 'Incharge'", [status, id]);
    await recordActivity(req.user.name, req.user.role, `${status === 'Active' ? 'Activated' : 'Deactivated'} Incharge account: ${existing[0].name}`);

    res.status(200).json({ message: `Incharge status updated to ${status}.` });
  } catch (error) {
    console.error('toggleInchargeStatus error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── DEPARTMENT MANAGEMENT ───────────────────────────────────────────────────

export const getDepartments = async (req, res) => {
  try {
    const [depts] = await pool.query("SELECT * FROM departments");
    const [allUsers] = await pool.query("SELECT id, name, role, department FROM users");
    const [allStudents] = await pool.query("SELECT id, department FROM students");

    const detailedDepts = depts.map(d => {
      const hod = allUsers.find(u => u.role === 'HOD' && u.department === d.name);
      const totalIncharges = allUsers.filter(u => u.role === 'Incharge' && u.department === d.name).length;
      const totalStudents = allStudents.filter(s => s.department === d.name).length;

      return {
        id: d.id,
        name: d.name,
        hod: hod ? hod.name : 'Not Assigned',
        totalStudents,
        totalIncharges
      };
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
    if (!name) {
      return res.status(400).json({ message: 'Department name is required.' });
    }

    await pool.query("INSERT INTO departments (name) VALUES (?)", [name]);
    await recordActivity(req.user.name, req.user.role, `Created department: ${name}`);

    res.status(201).json({ message: 'Department created successfully.' });
  } catch (error) {
    console.error('createDepartment error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Department already exists.' });
    }
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Department name is required.' });
    }

    const [depts] = await pool.query("SELECT * FROM departments WHERE id = ?", [id]);
    if (depts.length === 0) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    await pool.query("UPDATE departments SET name = ? WHERE id = ?", [name, id]);
    await recordActivity(req.user.name, req.user.role, `Updated department: ${depts[0].name} to ${name}`);

    res.status(200).json({ message: 'Department updated successfully.' });
  } catch (error) {
    console.error('updateDepartment error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const [depts] = await pool.query("SELECT * FROM departments WHERE id = ?", [id]);
    if (depts.length === 0) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    await pool.query("DELETE FROM departments WHERE id = ?", [id]);
    await recordActivity(req.user.name, req.user.role, `Deleted department: ${depts[0].name}`);

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
    const [students] = await pool.query("SELECT * FROM students");

    let filtered = students;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.register_number.toLowerCase().includes(q)
      );
    }
    if (department) {
      filtered = filtered.filter(s => s.department === department);
    }

    res.status(200).json(filtered);
  } catch (error) {
    console.error('getStudents error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, course, department, academic_year, section, semester, email, phone, dob, blood_group, address } = req.body;
    if (!name || !department || !academic_year || !section || !semester) {
      return res.status(400).json({ message: 'Required fields missing.' });
    }

    const [existing] = await pool.query("SELECT * FROM students WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    await pool.query(
      'UPDATE students SET name = ?, course = ?, department = ?, academic_year = ?, section = ?, semester = ?, email = ?, phone = ?, dob = ?, blood_group = ?, address = ? WHERE id = ?',
      [name, course || 'B.Tech', department, academic_year, section, semester, email || '', phone || '', dob || null, blood_group || '', address || '', id]
    );

    await recordActivity(req.user.name, req.user.role, `Updated student details: ${name} (${existing[0].register_number})`);

    res.status(200).json({ message: 'Student details updated successfully.' });
  } catch (error) {
    console.error('updateStudent error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query("SELECT * FROM students WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    await pool.query("DELETE FROM students WHERE id = ?", [id]);
    await recordActivity(req.user.name, req.user.role, `Deleted student: ${existing[0].name} (${existing[0].register_number})`);

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

    const [remarks] = await pool.query(`
      SELECT r.id, r.student_id, r.remark_text, r.recorded_by, r.created_at,
             s.name as student_name, s.register_number, s.department, s.academic_year, s.photo_url,
             u.name as recorder_name, u.role as recorder_role
      FROM remarks r
      JOIN students s ON r.student_id = s.id
      LEFT JOIN users u ON r.recorded_by = u.id
      ORDER BY r.created_at DESC
    `);

    let filtered = remarks;
    if (department) {
      filtered = filtered.filter(r => r.department === department);
    }
    if (academic_year) {
      filtered = filtered.filter(r => r.academic_year === academic_year);
    }
    if (month) {
      // month is in YYYY-MM form
      filtered = filtered.filter(r => r.created_at.startsWith(month));
    }
    if (student) {
      const q = student.toLowerCase();
      filtered = filtered.filter(r =>
        r.student_name.toLowerCase().includes(q) ||
        r.register_number.toLowerCase().includes(q)
      );
    }
    if (remark_category) {
      filtered = filtered.filter(r => r.remark_text.toLowerCase() === remark_category.toLowerCase());
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
    const [existing] = await pool.query("SELECT r.*, s.name as student_name FROM remarks r JOIN students s ON r.student_id = s.id WHERE r.id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Remark not found.' });
    }

    await pool.query("DELETE FROM remarks WHERE id = ?", [id]);
    await recordActivity(req.user.name, req.user.role, `Deleted remark for student: ${existing[0].student_name}`);

    res.status(200).json({ message: 'Remark deleted successfully.' });
  } catch (error) {
    console.error('deleteRemark error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── USER ACTIVITY LOGS ──────────────────────────────────────────────────────

export const getActivityLogs = async (req, res) => {
  try {
    const [logs] = await pool.query("SELECT user_name as user, user_role as role, action, date, time, created_at FROM activity_logs ORDER BY created_at DESC LIMIT 500");
    res.status(200).json(logs);
  } catch (error) {
    console.error('getActivityLogs error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const createActivityLog = async (req, res) => {
  try {
    const { action } = req.body;
    if (!action) {
      return res.status(400).json({ message: 'Action is required.' });
    }
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
    const [rows] = await pool.query("SELECT * FROM system_settings");
    const settings = {};
    rows.forEach(r => {
      settings[r.setting_key] = r.setting_value;
    });

    // Fallbacks if tables are empty
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
      // MySQL upsert query pattern
      await pool.query(
        "INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
        [key, updates[key], updates[key]]
      );
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
    const [remarks] = await pool.query(`
      SELECT r.id, r.remark_text, r.created_at, s.department, s.academic_year
      FROM remarks r
      JOIN students s ON r.student_id = s.id
    `);
    const [students] = await pool.query("SELECT id FROM students");
    const [users] = await pool.query("SELECT id, role FROM users");
    const [depts] = await pool.query("SELECT name FROM departments");

    const totalStudents = students.length;
    const totalRemarks = remarks.length;
    const totalHODs = users.filter(u => u.role === 'HOD').length;
    const totalIncharges = users.filter(u => u.role === 'Incharge').length;

    // 1. Remarks by Department (Bar Chart)
    const deptWise = {};
    depts.forEach(d => { deptWise[d.name] = 0; });
    remarks.forEach(r => {
      if (deptWise[r.department] !== undefined) {
        deptWise[r.department]++;
      } else {
        deptWise[r.department] = 1;
      }
    });
    const remarksByDeptData = Object.keys(deptWise).map(k => ({
      name: k,
      remarks: deptWise[k]
    }));

    // 2. Remark Categories (Pie Chart)
    const categoryCounts = { 'Late-comer': 0, 'Non-uniform': 0, 'Indiscipline': 0, 'Others': 0 };
    remarks.forEach(r => {
      if (categoryCounts[r.remark_text] !== undefined) {
        categoryCounts[r.remark_text]++;
      } else {
        categoryCounts['Others']++;
      }
    });
    const remarkCategoriesData = Object.keys(categoryCounts).map(k => ({
      name: k,
      value: categoryCounts[k]
    })).filter(c => c.value > 0);

    // 3. Monthly Remarks (Line Chart - Last 6 Months)
    // Gather month-wise counts
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthCounts = {};
    
    // Initialize last 6 months
    const last6 = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = months[d.getMonth()];
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      last6.push({ label: mLabel, key: mKey, remarks: 0 });
    }

    remarks.forEach(r => {
      const rDate = new Date(r.created_at);
      const rKey = `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, '0')}`;
      const bucket = last6.find(b => b.key === rKey);
      if (bucket) bucket.remarks++;
    });

    const monthlyRemarksData = last6.map(b => ({
      month: b.label,
      remarks: b.remarks
    }));

    res.status(200).json({
      summary: {
        totalStudents,
        totalRemarks,
        totalHODs,
        totalIncharges,
        totalDepartments: depts.length
      },
      charts: {
        remarksByDept: remarksByDeptData,
        remarkCategories: remarkCategoriesData,
        monthlyRemarks: monthlyRemarksData
      }
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
    if (!name) {
      return res.status(400).json({ message: 'Name is required.' });
    }

    await pool.query(
      "UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ? AND role = 'Admin'",
      [name, email || '', phone || '', req.user.id]
    );

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
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    await pool.query(
      "UPDATE users SET password = ? WHERE id = ? AND role = 'Admin'",
      [password, req.user.id]
    );

    await recordActivity(req.user.name, req.user.role, 'Changed admin password');

    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('changeAdminPassword error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
