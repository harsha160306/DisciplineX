import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const normalizeRole = (value = '') => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();
  if (lower === 'admin') return 'Admin';
  if (lower === 'hod') return 'HOD';
  if (lower === 'incharge') return 'Incharge';
  return trimmed;
};

export const login = async (req, res) => {
  try {
    const { role, username, password } = req.body;
    const normalizedRole = normalizeRole(role);
    const normalizedUsername = String(username || '').trim();

    if (!normalizedRole || !normalizedUsername || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Case-insensitive username search
    const user = await User.findOne({ 
      role: normalizedRole, 
      username: new RegExp(`^${normalizedUsername}$`, 'i')
    });

    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });
    if (password !== user.password) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role, name: user.name, department: user.department || '' },
      process.env.JWT_SECRET || 'super_secret_mic_key_2026',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id:          user._id,
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
    const incharges = await User.find({ role: 'Incharge', department })
      .select('_id username name department phone employee_id');

    // Map _id to id for frontend compatibility
    const formattedIncharges = incharges.map(inc => ({
      id: inc._id,
      username: inc.username,
      name: inc.name,
      department: inc.department,
      phone: inc.phone,
      employee_id: inc.employee_id
    }));

    res.status(200).json({ department, total: formattedIncharges.length, incharges: formattedIncharges });

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
      await User.create({
        username,
        password,
        role: 'Incharge',
        name,
        department,
        phone: phone || '',
        employee_id: employee_id || ''
      });
      res.status(201).json({ message: 'Incharge created successfully.', department });
    } catch (dbError) {
      if (dbError.code === 11000) { // MongoDB duplicate key error
        return res.status(409).json({ message: 'Username already exists.' });
      }
      throw dbError;
    }

  } catch (error) {
    console.error('createIncharge error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
