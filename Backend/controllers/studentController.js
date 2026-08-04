import pool from '../db.js';

export const getStudentByRegisterNumber = async (req, res) => {
  try {
    const { registerNumber } = req.params;
    const searchTerm = `%${registerNumber}%`;
    const [students] = await pool.query(
      'SELECT * FROM students WHERE register_number = ? OR name LIKE ?',
      [registerNumber, searchTerm]
    );

    if (students.length === 0) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    
    const student = students[0];

    const [remarks] = await pool.query(
      `SELECT r.*, u.name as incharge_name 
       FROM remarks r 
       LEFT JOIN users u ON r.recorded_by = u.id 
       WHERE r.student_id = ? 
       ORDER BY r.created_at DESC`,
      [student.id]
    );

    res.status(200).json({ student, remarks });
  } catch (error) {
    console.error('Fetch student error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const registerStudent = async (req, res) => {
  try {
    const { register_number, name, course, department, academic_year, validity, dob, blood_group, address, email, phone, photo_url } = req.body;

    if (!register_number || !name || !course || !department || !academic_year || !validity) {
      return res.status(400).json({ message: 'Required fields: Register number, name, course, department, academic year, validity.' });
    }

    const [existing] = await pool.query('SELECT * FROM students WHERE register_number = ?', [register_number]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Registration number already exists.' });
    }

    await pool.query(
      'INSERT INTO students (register_number, name, course, department, academic_year, validity, dob, blood_group, address, section, semester, email, phone, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [register_number, name, course, department, academic_year, validity, dob || null, blood_group || '', address || '', '-', '-', email || '', phone || '', photo_url || null]
    );

    res.status(201).json({ message: 'Student registered successfully.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Registration number already exists.' });
    }
    console.error('Register student error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getRepeatOffenders = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userDept = req.user.department;

    let queryStr = `
      SELECT s.id, s.name, s.register_number, s.department, s.photo_url, count(r.id) as remark_count
      FROM students s
      JOIN remarks r ON s.id = r.student_id
    `;
    let queryParams = [];

    if (userRole === 'HOD') {
      queryStr += ' WHERE s.department = ?';
      queryParams.push(userDept);
    }

    queryStr += `
      GROUP BY s.id
      HAVING remark_count > 1
      ORDER BY remark_count DESC
      LIMIT 20
    `;

    const [rows] = await pool.query(queryStr, queryParams);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Fetch repeat offenders error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
