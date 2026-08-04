import jwt from 'jsonwebtoken';
import pool from '../db.js';

export const normalizeRole = (value = '') => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();
  if (lower === 'admin') return 'Admin';
  if (lower === 'hod') return 'HOD';
  if (lower === 'incharge') return 'Incharge';
  return trimmed;
};

export const findMatchingUser = (users = [], inputRole = '', inputUsername = '') => {
  const normalizedRole = normalizeRole(inputRole);
  const normalizedUsername = String(inputUsername || '').trim().toLowerCase();

  return users.find((user) => {
    const userRole = normalizeRole(user?.role);
    const userUsername = String(user?.username || '').trim().toLowerCase();
    return userRole === normalizedRole && userUsername === normalizedUsername;
  }) || null;
};

// Fallback credentials when MySQL is unavailable
const FALLBACK_USERS = [
  { id: 7,  username: 'admin',         password: 'Admin@123',   role: 'Admin',    name: 'System Admin',     department: '',           phone: '9500011000', employee_id: 'ADM001' },
  { id: 1,  username: 'hod_cse',       password: 'HOD@cse123',  role: 'HOD',      name: 'Dr. R. Kavitha',   department: 'CSE',        phone: '9500011001', employee_id: 'HOD001' },
  { id: 2,  username: 'hod_ece',       password: 'HOD@ece123',  role: 'HOD',      name: 'Dr. S. Rajkumar',  department: 'ECE',        phone: '9500011002', employee_id: 'HOD002' },
  { id: 3,  username: 'hod_mech',      password: 'HOD@mech123', role: 'HOD',      name: 'Dr. M. Priya',     department: 'Mechanical', phone: '9500011003', employee_id: 'HOD003' },
  { id: 4,  username: 'incharge_cse1', password: 'Inc@cse1',    role: 'Incharge', name: 'Mr. A. Senthil',   department: 'CSE',        phone: '9500012001', employee_id: 'INC001' },
  { id: 5,  username: 'incharge_cse2', password: 'Inc@cse2',    role: 'Incharge', name: 'Ms. B. Divya',     department: 'CSE',        phone: '9500012002', employee_id: 'INC002' },
  { id: 6,  username: 'incharge_ece1', password: 'Inc@ece1',    role: 'Incharge', name: 'Mr. C. Rajan',     department: 'ECE',        phone: '9500012003', employee_id: 'INC003' },
];

export const login = async (req, res) => {
  try {
    const { role, username, password } = req.body;
    const normalizedRole = normalizeRole(role);
    const normalizedUsername = String(username || '').trim();

    if (!normalizedRole || !normalizedUsername || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    let user = null;

    try {
      // Ensure users table exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          name VARCHAR(255) NOT NULL,
          department VARCHAR(100),
          phone VARCHAR(20),
          employee_id VARCHAR(50),
          email VARCHAR(255),
          status VARCHAR(20) DEFAULT 'Active',
          designation VARCHAR(100) DEFAULT 'Discipline Incharge'
        )
      `);

      // Always ensure all seed users exist (insert-ignore for idempotency)
      for (const u of FALLBACK_USERS) {
        try {
          await pool.query(
            'INSERT IGNORE INTO users (username, password, role, name, department, phone, employee_id) VALUES (?,?,?,?,?,?,?)',
            [u.username, u.password, u.role, u.name, u.department, u.phone, u.employee_id]
          );
        } catch (_) { /* skip if INSERT IGNORE not supported */ }
      }
      // Also add department column if missing (migration)
      try {
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100)');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50)');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT "Active"');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS designation VARCHAR(100) DEFAULT "Discipline Incharge"');
      } catch (_) { /* columns may already exist */ }

      const [users] = await pool.query('SELECT * FROM users');
      user = findMatchingUser(users, normalizedRole, normalizedUsername);

    } catch (dbError) {
      console.warn('MySQL unavailable, using fallback credentials:', dbError.code || dbError.message);
      user = findMatchingUser(FALLBACK_USERS, normalizedRole, normalizedUsername);
    }

    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });
    if (password !== user.password) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name, department: user.department || '' },
      process.env.JWT_SECRET || 'super_secret_mic_key_2026',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id:          user.id,
        username:    user.username,
        role:        user.role,
        name:        user.name,
        department:  user.department || '',
        phone:       user.phone || '',
        employee_id: user.employee_id || ''
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── GET /api/auth/incharges — HOD fetches incharges in their department ─────
export const getIncharges = async (req, res) => {
  try {
    if (req.user.role !== 'HOD') {
      return res.status(403).json({ message: 'Access denied. HOD role required.' });
    }

    const department = req.user.department;
    let incharges = [];

    try {
      const [rows] = await pool.query(
        "SELECT id, username, name, department, phone, employee_id FROM users WHERE role = 'Incharge' AND department = ?",
        [department]
      );
      incharges = rows;
    } catch (dbError) {
      console.warn('DB error fetching incharges, using fallback:', dbError.message);
      incharges = FALLBACK_USERS
        .filter(u => u.role === 'Incharge' && u.department === department)
        .map(({ id, username, name, department, phone, employee_id }) => ({ id, username, name, department, phone, employee_id }));
    }

    res.status(200).json({ department, total: incharges.length, incharges });

  } catch (error) {
    console.error('getIncharges error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── POST /api/auth/incharge — HOD creates a new incharge ────────────────────
export const createIncharge = async (req, res) => {
  try {
    if (req.user.role !== 'HOD') {
      return res.status(403).json({ message: 'Access denied. HOD role required.' });
    }

    const { name, username, password, phone, employee_id } = req.body;
    const department = req.user.department;

    if (!name || !username || !password) {
      return res.status(400).json({ message: 'Name, username and password are required.' });
    }

    try {
      await pool.query(
        'INSERT INTO users (username, password, role, name, department, phone, employee_id) VALUES (?,?,?,?,?,?,?)',
        [username, password, 'Incharge', name, department, phone || '', employee_id || '']
      );
      res.status(201).json({ message: 'Incharge created successfully.', department });
    } catch (dbError) {
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Username already exists.' });
      }
      throw dbError;
    }

  } catch (error) {
    console.error('createIncharge error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
