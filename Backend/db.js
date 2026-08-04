import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_FILE = path.join(process.cwd(), 'db.json');

// ─── Seeded users: Admin + 3 HODs + 3 Incharges ────────────────────────────────
const SEED_USERS = [
  // Admin
  { id: 7,  username: 'admin',         password: 'Admin@123',   role: 'Admin',    name: 'System Admin',     department: '',           phone: '9500011000', employee_id: 'ADM001', email: 'admin@mic.edu', status: 'Active', designation: 'Administrator' },
  // HODs
  { id: 1,  username: 'hod_cse',      password: 'HOD@cse123',  role: 'HOD',      name: 'Dr. R. Kavitha',   department: 'CSE',        phone: '9500011001', employee_id: 'HOD001', email: 'hod_cse@mic.edu', status: 'Active', designation: 'HOD' },
  { id: 2,  username: 'hod_ece',      password: 'HOD@ece123',  role: 'HOD',      name: 'Dr. S. Rajkumar',  department: 'ECE',        phone: '9500011002', employee_id: 'HOD002', email: 'hod_ece@mic.edu', status: 'Active', designation: 'HOD' },
  { id: 3,  username: 'hod_mech',     password: 'HOD@mech123', role: 'HOD',      name: 'Dr. M. Priya',     department: 'Mechanical', phone: '9500011003', employee_id: 'HOD003', email: 'hod_mech@mic.edu', status: 'Active', designation: 'HOD' },
  // Incharges
  { id: 4,  username: 'incharge_cse1',password: 'Inc@cse1',    role: 'Incharge', name: 'Mr. A. Senthil',   department: 'CSE',        phone: '9500012001', employee_id: 'INC001', email: 'incharge_cse1@mic.edu', status: 'Active', designation: 'Assistant Professor' },
  { id: 5,  username: 'incharge_cse2',password: 'Inc@cse2',    role: 'Incharge', name: 'Ms. B. Divya',     department: 'CSE',        phone: '9500012002', employee_id: 'INC002', email: 'incharge_cse2@mic.edu', status: 'Active', designation: 'Assistant Professor' },
  { id: 6,  username: 'incharge_ece1',password: 'Inc@ece1',    role: 'Incharge', name: 'Mr. C. Rajan',     department: 'ECE',        phone: '9500012003', employee_id: 'INC003', email: 'incharge_ece1@mic.edu', status: 'Active', designation: 'Assistant Professor' },
];

const SEED_STUDENTS = [
  { id: 1, register_number: '2024CS101', name: 'Rahul Sharma',    course: 'B.Tech', department: 'CSE',        academic_year: '3rd Year', validity: '2027', section: 'A', semester: 'V',   email: 'rahul@gmail.com',    phone: '9876543210', photo_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnM-pyl2GLRMVnjxwsCXyp4bZU_dGsSv6BzQCj0OKi8NlhK2UyNps1HU1jaO-RKjb9B_updyWAjRKfBDg572WWob87YdE1z3TdQcV8a2ef1wKEeFrB9sEdd27i_dIOWCyUVlMu7yFK_wIg3BX_KEVleXsL8hvR0fdmFsvCxZPM2qBBvYkaKN8J6PNGNIJVFnkkqqKKD13x4T5B4-oy5GOfVTfsdQ1i_tgyeDusR7TI6zX1MarWjuJGvuY-hBnEByhJW71sEbmPwDrB', created_at: new Date().toISOString() },
  { id: 2, register_number: '2024ME045', name: 'Anjali Verma',    course: 'B.Tech', department: 'Mechanical', academic_year: '2nd Year', validity: '2028', section: 'B', semester: 'III', email: 'anjali@gmail.com',   phone: '9876543211', photo_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTuEzyi6BX288E_wzMVHXWMUOfXKPnfoPAH-0dsuJNUGciaHdnYoTT5IyMfM-JJZ7OW1ZV70AIG19OH-9tzOJmQq8qbSS0Xg34ph03JJs5GmH2skFMmBT1Xw7a2IL6TSpY0ftt8RCdDU_LuiAX1WBu9ZPaWZzIH6GwRQIVRSprKZ-2ZlDKud2OZ_VEYon1QNT90Cs_CwlzK6xDNIjcFck0Y3tFfIkkamZS7duB52mqHKmOgPa_uVfZVj72aDAEqz9luXXxnSkVE_YB', created_at: new Date().toISOString() },
  { id: 3, register_number: '2024CS102', name: 'Priya Patel',     course: 'B.Tech', department: 'CSE',        academic_year: '1st Year', validity: '2028', section: 'A', semester: 'I',   email: 'priya@gmail.com',    phone: '9876543212', photo_url: null, created_at: new Date().toISOString() },
  { id: 4, register_number: '2024EC011', name: 'Vikram Singh',    course: 'B.Tech', department: 'ECE',        academic_year: '2nd Year', validity: '2028', section: 'B', semester: 'III', email: 'vikram@gmail.com',   phone: '9876543213', photo_url: null, created_at: new Date().toISOString() },
  { id: 5, register_number: '2024CS103', name: 'Sneha Reddy',     course: 'B.Tech', department: 'CSE',        academic_year: '3rd Year', validity: '2027', section: 'B', semester: 'V',   email: 'sneha@gmail.com',    phone: '9876543214', photo_url: null, created_at: new Date().toISOString() },
  { id: 6, register_number: '2024ME046', name: 'Arjun Rao',       course: 'B.Tech', department: 'Mechanical', academic_year: '4th Year', validity: '2026', section: 'A', semester: 'VII', email: 'arjun@gmail.com',    phone: '9876543215', photo_url: null, created_at: new Date().toISOString() },
  { id: 7, register_number: '2024EC012', name: 'Divya Nair',      course: 'B.Tech', department: 'ECE',        academic_year: '3rd Year', validity: '2027', section: 'A', semester: 'V',   email: 'divya@gmail.com',    phone: '9876543216', photo_url: null, created_at: new Date().toISOString() },
  { id: 8, register_number: '2024CS104', name: 'Karan Malhotra',  course: 'B.Tech', department: 'CSE',        academic_year: '2nd Year', validity: '2028', section: 'C', semester: 'III', email: 'karan@gmail.com',    phone: '9876543217', photo_url: null, created_at: new Date().toISOString() },
];

const SEED_DEPARTMENTS = [
  { id: 1, name: 'CSE' },
  { id: 2, name: 'ECE' },
  { id: 3, name: 'Mechanical' },
  { id: 4, name: 'Civil' },
  { id: 5, name: 'MBA' }
];

const SEED_SETTINGS = {
  college_name: 'DisciplineX Academy',
  college_logo: '',
  academic_year: '2025-2026',
  remark_categories: 'Late-comer, Non-uniform, Indiscipline, Others',
  password_policy: JSON.stringify({ minLength: 6, requireSpecial: false })
};

// Initialize local JSON file if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ 
    users: SEED_USERS, 
    students: SEED_STUDENTS, 
    remarks: [],
    departments: SEED_DEPARTMENTS,
    activity_logs: [
      { id: 1, user_name: 'System Admin', user_role: 'Admin', action: 'System Initialized', date: '19-Jul-2026', time: '08:30 AM' }
    ],
    system_settings: SEED_SETTINGS
  }, null, 2));
} else {
  // Migrate existing db.json: ensure users/students have required fields & seed new tables
  try {
    const existing = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    let changed = false;

    // Migrate users list
    existing.users = existing.users || [];
    const existingUsernames = new Set(existing.users.map(u => u.username));
    for (const u of SEED_USERS) {
      if (!existingUsernames.has(u.username)) {
        existing.users.push(u);
        changed = true;
      } else {
        const idx = existing.users.findIndex(eu => eu.username === u.username);
        if (idx !== -1) {
          if (!existing.users[idx].department && u.department) { existing.users[idx].department = u.department; changed = true; }
          if (!existing.users[idx].phone && u.phone)           { existing.users[idx].phone = u.phone;           changed = true; }
          if (!existing.users[idx].employee_id && u.employee_id){ existing.users[idx].employee_id = u.employee_id; changed = true; }
          if (!existing.users[idx].email && u.email)           { existing.users[idx].email = u.email;           changed = true; }
          if (!existing.users[idx].status)                      { existing.users[idx].status = 'Active';         changed = true; }
          if (!existing.users[idx].designation)                { existing.users[idx].designation = u.designation || 'Staff'; changed = true; }
        }
      }
    }

    // Migrate departments list
    if (!existing.departments) {
      existing.departments = SEED_DEPARTMENTS;
      changed = true;
    }

    // Migrate activity logs list
    if (!existing.activity_logs) {
      existing.activity_logs = [
        { id: 1, user_name: 'System Admin', user_role: 'Admin', action: 'System Initialized', date: '19-Jul-2026', time: '08:30 AM' }
      ];
      changed = true;
    }

    // Migrate system settings list
    if (!existing.system_settings) {
      existing.system_settings = SEED_SETTINGS;
      changed = true;
    }

    // Migrate students list
    existing.students = existing.students || [];
    const existingRegNos = new Set(existing.students.map(s => s.register_number));
    for (const s of SEED_STUDENTS) {
      if (!existingRegNos.has(s.register_number)) {
        existing.students.push(s);
        changed = true;
      }
    }

    if (changed) fs.writeFileSync(DB_FILE, JSON.stringify(existing, null, 2));
  } catch (e) {
    console.warn('db.json migration warning:', e.message);
  }
}

const readData = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const writeData = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// ─── Mock pool ────────────────────────────────────────────────────────────────
const mockPool = {
  isMock: true,
  query: async (sql, params = []) => {
    const data = readData();
    const cleanSql = sql.replace(/\s+/g, ' ').trim().toLowerCase();

    // 1. Create table queries
    if (cleanSql.startsWith('create table')) return [[]];

    // 2. Select users count
    if (cleanSql.includes('select count(*) as count from users')) {
      return [[{ count: data.users.length }]];
    }

    // 3. Select user by username & role (login)
    if (cleanSql.includes('from users where username = ? and role = ?')) {
      const [username, role] = params;
      const found = data.users.filter(u => u.username === username && u.role === role);
      return [found];
    }

    // 4. Select all users
    if (cleanSql.includes('select') && cleanSql.includes('from users') && !cleanSql.includes('where') && !cleanSql.includes('limit')) {
      return [data.users];
    }

    // 5. Select users filter
    if (cleanSql.includes("from users where role = 'hod'")) {
      return [data.users.filter(u => u.role === 'HOD')];
    }
    if (cleanSql.includes("from users where role = 'incharge'")) {
      return [data.users.filter(u => u.role === 'Incharge')];
    }

    // 6. Select incharges by department
    if (cleanSql.includes("from users where role = 'incharge' and department = ?") ||
        cleanSql.includes('from users where role = ? and department = ?')) {
      const dept = params[params.length - 1];
      const found = data.users.filter(u => u.role === 'Incharge' && u.department === dept);
      return [found];
    }

    // 7. Update user / Reset Password / Status Toggle
    if (cleanSql.startsWith('update users set')) {
      const id = params[params.length - 1];
      const idx = data.users.findIndex(u => u.id === Number(id));
      if (idx !== -1) {
        if (cleanSql.includes('password = ?')) {
          data.users[idx].password = params[0];
        } else if (cleanSql.includes('status = ?')) {
          data.users[idx].status = params[0];
        } else if (cleanSql.includes('name = ?') && cleanSql.includes('email = ?')) {
          const [name, email, phone, employee_id, dept, designation] = params;
          data.users[idx].name = name;
          data.users[idx].email = email;
          data.users[idx].phone = phone;
          data.users[idx].employee_id = employee_id;
          if (dept !== undefined) data.users[idx].department = dept;
          if (designation !== undefined) data.users[idx].designation = designation;
        } else if (cleanSql.includes('name = ?') && cleanSql.includes('phone = ?')) {
          const [name, email, phone] = params;
          data.users[idx].name = name;
          data.users[idx].email = email;
          data.users[idx].phone = phone;
        }
        writeData(data);
        return [{ affectedRows: 1 }];
      }
      return [{ affectedRows: 0 }];
    }

    // 8. Delete user
    if (cleanSql.startsWith('delete from users')) {
      const id = params[0];
      const countBefore = data.users.length;
      data.users = data.users.filter(u => u.id !== Number(id));
      if (data.users.length !== countBefore) {
        writeData(data);
        return [{ affectedRows: 1 }];
      }
      return [{ affectedRows: 0 }];
    }

    // 9. INSERT INTO users
    if (cleanSql.startsWith('insert ignore into users') || cleanSql.startsWith('insert into users')) {
      const [username, password, role, name, department, phone, employee_id, email, status, designation] = params;
      const existing = data.users.find(u => u.username === username);
      if (existing) {
        if (cleanSql.startsWith('insert ignore')) return [{ insertId: 0, affectedRows: 0 }];
        const err = new Error('Duplicate entry'); err.code = 'ER_DUP_ENTRY'; throw err;
      }
      const newUser = {
        id: Math.max(...data.users.map(u => u.id), 0) + 1,
        username, password, role, name,
        department: department || '',
        phone: phone || '',
        employee_id: employee_id || '',
        email: email || '',
        status: status || 'Active',
        designation: designation || (role === 'HOD' ? 'HOD' : 'Discipline Incharge')
      };
      data.users.push(newUser);
      writeData(data);
      return [{ insertId: newUser.id, affectedRows: 1 }];
    }

    // 10. DEPARTMENTS CRUD MOCKS
    if (cleanSql.includes('select') && cleanSql.includes('from departments')) {
      return [data.departments || []];
    }
    if (cleanSql.startsWith('insert into departments')) {
      const name = params[0];
      const existing = data.departments.find(d => d.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        const err = new Error('Duplicate department'); err.code = 'ER_DUP_ENTRY'; throw err;
      }
      const newD = { id: Math.max(...data.departments.map(d => d.id), 0) + 1, name };
      data.departments.push(newD);
      writeData(data);
      return [{ insertId: newD.id }];
    }
    if (cleanSql.startsWith('update departments')) {
      const [name, id] = params;
      const idx = data.departments.findIndex(d => d.id === Number(id));
      if (idx !== -1) {
        data.departments[idx].name = name;
        writeData(data);
        return [{ affectedRows: 1 }];
      }
      return [{ affectedRows: 0 }];
    }
    if (cleanSql.startsWith('delete from departments')) {
      const id = params[0];
      data.departments = data.departments.filter(d => d.id !== Number(id));
      writeData(data);
      return [{ affectedRows: 1 }];
    }

    // 11. ACTIVITY LOGS CRUD MOCKS
    if (cleanSql.includes('select') && cleanSql.includes('from activity_logs')) {
      return [data.activity_logs || []];
    }
    if (cleanSql.startsWith('insert into activity_logs')) {
      const [user_name, user_role, action, date, time] = params;
      const newL = {
        id: Math.max(...(data.activity_logs?.map(l => l.id) || [0]), 0) + 1,
        user_name, user_role, action, date, time,
        created_at: new Date().toISOString()
      };
      data.activity_logs = data.activity_logs || [];
      data.activity_logs.push(newL);
      writeData(data);
      return [{ insertId: newL.id }];
    }

    // 12. SYSTEM SETTINGS CRUD MOCKS
    if (cleanSql.includes('select') && cleanSql.includes('from system_settings')) {
      const rows = Object.keys(data.system_settings || {}).map(k => ({
        setting_key: k,
        setting_value: data.system_settings[k]
      }));
      return [rows];
    }
    if (cleanSql.startsWith('insert into system_settings') || cleanSql.includes('on duplicate key update')) {
      const [key, val] = params;
      data.system_settings = data.system_settings || {};
      data.system_settings[key] = val;
      writeData(data);
      return [{ affectedRows: 1 }];
    }

    // 13. STUDENTS CRUD MOCKS
    if (cleanSql.includes('from students') && !cleanSql.includes('where') && !cleanSql.includes('limit')) {
      return [data.students];
    }
    if (cleanSql.includes('from students where register_number = ? or name like ?')) {
      const [regNum, namePattern] = params;
      const searchName = namePattern.replace(/%/g, '').toLowerCase();
      const found = data.students.filter(s => 
        s.register_number.toLowerCase() === regNum.toLowerCase() || 
        s.name.toLowerCase().includes(searchName)
      );
      return [found];
    }
    if (cleanSql.startsWith('update students set')) {
      const id = params[params.length - 1];
      const idx = data.students.findIndex(s => s.id === Number(id));
      if (idx !== -1) {
        const [name, course, department, academic_year, section, semester, email, phone, dob, blood_group, address] = params;
        data.students[idx].name = name;
        data.students[idx].course = course;
        data.students[idx].department = department;
        data.students[idx].academic_year = academic_year;
        data.students[idx].section = section;
        data.students[idx].semester = semester;
        data.students[idx].email = email;
        data.students[idx].phone = phone;
        if (dob !== undefined) data.students[idx].dob = dob;
        if (blood_group !== undefined) data.students[idx].blood_group = blood_group;
        if (address !== undefined) data.students[idx].address = address;
        writeData(data);
        return [{ affectedRows: 1 }];
      }
      return [{ affectedRows: 0 }];
    }
    if (cleanSql.startsWith('delete from students')) {
      const id = params[0];
      data.students = data.students.filter(s => s.id !== Number(id));
      data.remarks = data.remarks.filter(r => r.student_id !== Number(id));
      writeData(data);
      return [{ affectedRows: 1 }];
    }

    // 14. REMARKS CRUD MOCKS
    if (cleanSql.includes('select') && cleanSql.includes('from remarks') && !cleanSql.includes('join students')) {
      return [data.remarks];
    }
    if (cleanSql.includes('from remarks r join students s') && !cleanSql.includes('date(r.created_at)')) {
      const results = [];
      data.remarks.forEach(r => {
        const s = data.students.find(st => st.id === r.student_id);
        if (!s) return;
        const recorder = data.users.find(u => u.id === Number(r.recorded_by));
        results.push({
          id: r.id, student_id: r.student_id,
          remark_text: r.remark_text, remark: r.remark_text,
          recorded_by: r.recorded_by,
          incharge_name: recorder ? recorder.name : 'Unknown',
          created_at: r.created_at,
          name: s.name, register_number: s.register_number,
          course: s.course || 'BTech', department: s.department,
          academic_year: s.academic_year, semester: s.semester, section: s.section
        });
      });
      return [results.sort((a,b) => new Date(b.created_at) - new Date(a.created_at))];
    }
    if (cleanSql.startsWith('delete from remarks')) {
      const id = params[0];
      data.remarks = data.remarks.filter(r => r.id !== Number(id));
      writeData(data);
      return [{ affectedRows: 1 }];
    }

    if (cleanSql.includes('from remarks r join students s') && (cleanSql.includes('date(r.created_at) = ?') || cleanSql.includes('date(r.created_at) between ? and ?'))) {
      let isBetween = cleanSql.includes('between');
      let startDate = isBetween ? params[0] : params[0];
      let endDate = isBetween ? params[1] : params[0];
      
      let paramIdx = isBetween ? 2 : 1;
      let filterDept = null, filterRecordedBy = null, filterYear = null, filterSem = null, filterSec = null;
      
      if (cleanSql.includes('s.department = ?')) filterDept = params[paramIdx++];
      if (cleanSql.includes('r.recorded_by = ?')) filterRecordedBy = params[paramIdx++];
      if (cleanSql.includes('s.academic_year = ?')) filterYear = params[paramIdx++];
      if (cleanSql.includes('s.semester = ?')) filterSem = params[paramIdx++];
      if (cleanSql.includes('s.section = ?')) filterSec = params[paramIdx++];

      const results = [];
      data.remarks.forEach(r => {
        const rDate = r.created_at.slice(0, 10);
        if (rDate >= startDate && rDate <= endDate) {
          if (filterRecordedBy && Number(r.recorded_by) !== Number(filterRecordedBy)) return;
          const s = data.students.find(st => st.id === r.student_id);
          if (!s) return;
          if (filterDept && s.department !== filterDept) return;
          if (filterYear && s.academic_year !== filterYear) return;
          if (filterSem && s.semester !== filterSem) return;
          if (filterSec && s.section !== filterSec) return;

          const recorder = data.users.find(u => u.id === Number(r.recorded_by));
          results.push({
            id: r.id, student_id: r.student_id,
            remark_text: r.remark_text, remark: r.remark_text,
            recorded_by: r.recorded_by,
            incharge_name: recorder ? recorder.name : 'Unknown',
            created_at: r.created_at,
            name: s.name, register_number: s.register_number,
            course: s.course || 'BTech', department: s.department,
            academic_year: s.academic_year, semester: s.semester, section: s.section
          });
        }
      });
      return [results.sort((a,b) => new Date(b.created_at) - new Date(a.created_at))];
    }

    if (cleanSql.includes('select s.id, s.name, s.register_number') && cleanSql.includes('having remark_count > 1')) {
      const filterDept = params[0];
      const counts = {};
      data.remarks.forEach(r => {
        const s = data.students.find(st => st.id === r.student_id);
        if (s && (!filterDept || s.department === filterDept)) {
          if (!counts[s.id]) counts[s.id] = { ...s, count: 0 };
          counts[s.id].count++;
        }
      });
      const results = Object.values(counts)
        .filter(c => c.count > 1)
        .map(c => ({ id: c.id, name: c.name, register_number: c.register_number, department: c.department, photo_url: c.photo_url, remark_count: c.count }))
        .sort((a,b) => b.remark_count - a.remark_count)
        .slice(0, 20);
      return [results];
    }

    if (cleanSql === 'select count(*) as count from students where department = ?') {
      const count = data.students.filter(s => s.department === params[0]).length;
      return [[{ count }]];
    }
    if (cleanSql === 'select count(*) as count from students where department = ? and date(created_at) >= ?') {
      const count = data.students.filter(s => s.department === params[0] && s.created_at >= params[1]).length;
      return [[{ count }]];
    }
    if (cleanSql === 'select name, register_number, created_at from students where department = ? order by created_at desc limit 1') {
      const studs = data.students.filter(s => s.department === params[0]);
      if (studs.length > 0) {
        const latest = studs.sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];
        return [[{ name: latest.name, register_number: latest.register_number, created_at: latest.created_at }]];
      }
      return [[]];
    }
    if (cleanSql === 'select count(*) as count from users where role = "incharge" and department = ?') {
      const count = data.users.filter(u => u.role === 'Incharge' && u.department === params[0]).length;
      return [[{ count }]];
    }
    if (cleanSql === 'select distinct section from students where department = ?') {
      const sections = [...new Set(data.students.filter(s => s.department === params[0]).map(s => s.section))];
      return [sections.map(s => ({ section: s }))];
    }
    if (cleanSql.includes('group by academic_year')) {
      const studs = data.students.filter(s => s.department === params[0]);
      const res = {};
      studs.forEach(s => { res[s.academic_year] = (res[s.academic_year] || 0) + 1; });
      return [[Object.keys(res).map(k => ({ academic_year: k, count: res[k] }))]];
    }
    if (cleanSql.includes('group by r.remark_text')) {
      const deptStuds = new Set(data.students.filter(s => s.department === params[0]).map(s => s.id));
      const remarks = data.remarks.filter(r => deptStuds.has(r.student_id));
      const res = {};
      remarks.forEach(r => { res[r.remark_text] = (res[r.remark_text] || 0) + 1; });
      return [[Object.keys(res).map(k => ({ remark_text: k, count: res[k] }))]];
    }
    if (cleanSql.includes('date(r.created_at) = ?')) {
      const deptStuds = new Set(data.students.filter(s => s.department === params[0]).map(s => s.id));
      const today = params[1];
      const count = data.remarks.filter(r => deptStuds.has(r.student_id) && r.created_at.startsWith(today)).length;
      return [[{ count }]];
    }
    if (cleanSql.includes('group by month, month(r.created_at)')) {
      return [[
        { month: 'Jan', remarks: 12 }, { month: 'Feb', remarks: 19 },
        { month: 'Mar', remarks: 15 }, { month: 'Apr', remarks: 22 },
        { month: 'May', remarks: 8 }, { month: 'Jun', remarks: 14 }
      ]];
    }
    if (cleanSql.includes('group by s.department')) {
      return [[
        { name: 'CSE', remarks: 120 },
        { name: 'ECE', remarks: 85 },
        { name: 'Mechanical', remarks: 110 }
      ]];
    }
    if (cleanSql.includes('order by r.created_at desc limit 5')) {
      const deptStuds = new Set(data.students.filter(s => s.department === params[0]).map(s => s.id));
      const remarks = data.remarks.filter(r => deptStuds.has(r.student_id)).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
      const res = remarks.map(r => {
        const s = data.students.find(st => st.id === r.student_id);
        const u = data.users.find(us => us.id === r.recorded_by);
        return {
          student: s?.name || 'Unknown',
          regNo: s?.register_number || 'Unknown',
          remark: r.remark_text,
          date: r.created_at,
          submittedBy: u?.name || 'Unknown'
        };
      });
      return [res];
    }
    if (cleanSql.includes('having remarks > 1')) {
      const deptStuds = data.students.filter(s => s.department === params[0]);
      const res = [];
      deptStuds.forEach(s => {
        const count = data.remarks.filter(r => r.student_id === s.id).length;
        if (count > 1) {
          res.push({ student: s.name, remarks: count });
        }
      });
      return [[res.sort((a,b) => b.remarks - a.remarks).slice(0, 5)]];
    }
    if (cleanSql.includes('from users u left join remarks r') && cleanSql.includes('group by u.id')) {
      const incharges = data.users.filter(u => u.role === 'Incharge' && u.department === params[1]);
      const res = incharges.map(inc => {
        const count = data.remarks.filter(r => r.recorded_by === inc.id && r.created_at >= params[0]).length;
        return { name: inc.name, department: inc.department, remarksSubmittedThisMonth: count };
      });
      return [res];
    }
    if (cleanSql.includes('from users where role = "incharge"') && cleanSql.includes('order by created_at desc limit 1')) {
      const incharges = data.users.filter(u => u.role === 'Incharge' && u.department === params[0])
        .sort((a,b) => new Date(b.created_at || '2023-01-01') - new Date(a.created_at || '2023-01-01'));
      return [incharges.slice(0, 1)];
    }

    console.warn('Unhandled mock query:', sql, params);
    return [[]];
  }
};

let activePool = mockPool;

const dbConfig = {
  host: process.env.MYSQL_ADDON_HOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQL_ADDON_USER || process.env.DB_USER || 'root',
  password: process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'mic_attendance',
  port: parseInt(process.env.MYSQL_ADDON_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const tempPool = mysql.createPool(dbConfig);

tempPool.getConnection()
  .then((connection) => {
    connection.release();
    activePool = tempPool;
    console.log('Connected to MySQL successfully.');
  })
  .catch((err) => {
    console.warn('MySQL unavailable. Falling back to local file-based database (db.json):', err.message);
    activePool = mockPool;
  });

const pool = {
  query: (sql, params) => activePool.query(sql, params)
};

export default pool;
