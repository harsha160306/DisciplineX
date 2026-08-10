import pool from '../db.js';
import { google } from 'googleapis';

const createGmailClient = () => {
  const OAuth2 = google.auth.OAuth2;
  const oauth2Client = new OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
};

export const getStudentRemarks = async (req, res) => {
  try {
    const { studentId } = req.params;
    const [remarks] = await pool.query(
      `SELECT r.*, u.name as incharge_name 
       FROM remarks r 
       LEFT JOIN users u ON r.recorded_by = u.id 
       WHERE r.student_id = ? 
       ORDER BY r.created_at DESC`,
      [studentId]
    );
    res.status(200).json({ remarks });
  } catch (error) {
    console.error('Fetch student remarks error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const recordRemark = async (req, res) => {
  try {
    const { student_id, register_number, remark_text } = req.body;
    const recorded_by = req.user.id;

    if (!register_number || !remark_text) {
      return res.status(400).json({ message: 'Register number and remark text are required.' });
    }

    let sId = student_id;
    let studentEmail = null;
    let studentName = null;

    if (!sId) {
      const [students] = await pool.query('SELECT * FROM students WHERE register_number = ?', [register_number]);
      if (students.length === 0) {
        return res.status(404).json({ message: 'Student not found.' });
      }
      sId = students[0].id;
      studentEmail = students[0].email;
      studentName = students[0].name;
    } else {
      const [students] = await pool.query('SELECT * FROM students WHERE id = ?', [sId]);
      if (students.length > 0) {
        studentEmail = students[0].email;
        studentName = students[0].name;
      }
    }

    await pool.query(
      'INSERT INTO remarks (student_id, remark_text, recorded_by) VALUES (?, ?, ?)',
      [sId, remark_text, recorded_by]
    );

    // Send email notification
    if (studentEmail) {
      try {
        const gmail = createGmailClient();
        const subject = 'New Disciplinary Remark Recorded - DisciplineX';
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const bodyText = `Dear ${studentName},\n\nA new disciplinary remark has been recorded on your profile.\n\nRemark Details:\n"${remark_text}"\n\nPlease check the portal or contact your department for more details.\n\nRegards,\nModern Institute College`;
        
        const messageParts = [
          `From: ${process.env.GMAIL_EMAIL}`,
          `To: ${studentEmail}`,
          'Content-Type: text/plain; charset=utf-8',
          'MIME-Version: 1.0',
          `Subject: ${utf8Subject}`,
          '',
          bodyText
        ];
        
        const message = messageParts.join('\n');
        const encodedMessage = Buffer.from(message)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
          
        await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw: encodedMessage }
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // We still return success for remark creation even if email fails
      }
    }

    res.status(201).json({ message: 'Remark recorded successfully.' });
  } catch (error) {
    console.error('Record remark error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── GET /api/remarks/history ─────────────────────────────────────────────────
// HOD: returns all incharges' remarks for HOD's department today
// Incharge: returns own remarks for today
export const getRemarksHistory = async (req, res) => {
  try {
    const { year, department, semester, section, date, startDate, endDate } = req.query;
    const userRole   = req.user.role;
    const userId     = req.user.id;
    const userDept   = department || req.user.department;

    let dateCondition = 'DATE(r.created_at) = ?';
    let dateParams = [date || new Date().toISOString().slice(0, 10)];

    if (startDate && endDate) {
      dateCondition = 'DATE(r.created_at) BETWEEN ? AND ?';
      dateParams = [startDate, endDate];
    }

    let queryStr = `
      SELECT r.*, u.name as incharge_name, s.name, s.register_number, s.course, s.department, s.academic_year, s.semester, s.section 
      FROM remarks r 
      JOIN students s ON r.student_id = s.id 
      LEFT JOIN users u ON r.recorded_by = u.id
      WHERE ${dateCondition}
    `;
    const queryParams = [...dateParams];

    if (userRole === 'HOD') {
      if (userDept) {
        queryStr += ' AND s.department = ?';
        queryParams.push(userDept);
      }
    } else {
      queryStr += ' AND r.recorded_by = ?';
      queryParams.push(userId);
    }

    // Apply additional filters
    if (year) {
      queryStr += ' AND s.academic_year = ?';
      queryParams.push(year);
    }
    if (semester) {
      queryStr += ' AND s.semester = ?';
      queryParams.push(semester);
    }
    if (section) {
      queryStr += ' AND s.section = ?';
      queryParams.push(section);
    }

    // Add ordering
    queryStr += ' ORDER BY r.created_at DESC';

    const [rows] = await pool.query(queryStr, queryParams);

    res.status(200).json({
      date: date || (startDate && endDate ? `${startDate} to ${endDate}` : new Date().toISOString().slice(0, 10)),
      total: rows.length,
      records: rows
    });
  } catch (error) {
    console.error('Fetch remarks history error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
