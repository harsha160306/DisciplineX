import pool from '../db.js';

export const getHODDashboardData = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userDept = req.user.department;

    if (userRole !== 'HOD') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

    // 1. Department Overview Stats
    const [totalStudents] = await pool.query('SELECT COUNT(*) as count FROM students WHERE department = ?', [userDept]);
    const [monthStudents] = await pool.query('SELECT COUNT(*) as count FROM students WHERE department = ? AND DATE(created_at) >= ?', [userDept, firstDayOfMonth]);
    const [latestStudent] = await pool.query('SELECT name, register_number, created_at FROM students WHERE department = ? ORDER BY created_at DESC LIMIT 1', [userDept]);
    
    // Total faculty (incharges) and sections
    const [facultyCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "Incharge" AND department = ?', [userDept]);
    const [sectionsList] = await pool.query('SELECT DISTINCT section FROM students WHERE department = ?', [userDept]);
    const sections = sectionsList.map(s => s.section).filter(Boolean);

    // 2. Student Stats by Year
    const [yearlyStats] = await pool.query(`
      SELECT academic_year, COUNT(*) as count 
      FROM students 
      WHERE department = ? 
      GROUP BY academic_year
    `, [userDept]);

    const formatYear = (yearStr) => {
      if (yearStr.includes('1')) return 'Year I';
      if (yearStr.includes('2')) return 'Year II';
      if (yearStr.includes('3')) return 'Year III';
      if (yearStr.includes('4')) return 'Year IV';
      return yearStr;
    };

    const studentYearStats = {
      'Year I': 0, 'Year II': 0, 'Year III': 0, 'Year IV': 0
    };
    yearlyStats.forEach(stat => {
      const formatted = formatYear(stat.academic_year);
      if (studentYearStats[formatted] !== undefined) {
        studentYearStats[formatted] += stat.count;
      }
    });

    // 3. Remark Statistics Breakdown
    const [categoryStats] = await pool.query(`
      SELECT r.remark_text, COUNT(*) as count FROM remarks r
      JOIN students s ON r.student_id = s.id
      WHERE s.department = ?
      GROUP BY r.remark_text
    `, [userDept]);

    let totalRemarksCount = 0;
    const remarkCategories = {
      'Non-uniform': 0,
      'Late-comer': 0,
      'Indiscipline': 0,
      'Others': 0
    };

    categoryStats.forEach(stat => {
      totalRemarksCount += stat.count;
      if (remarkCategories[stat.remark_text] !== undefined) {
        remarkCategories[stat.remark_text] += stat.count;
      } else {
        remarkCategories['Others'] += stat.count;
      }
    });

    // For Pie Chart format
    const categoriesPie = Object.keys(remarkCategories).map(key => ({
      name: key,
      value: remarkCategories[key]
    })).filter(cat => cat.value > 0);

    const [todayRemarks] = await pool.query(`
      SELECT COUNT(*) as count FROM remarks r
      JOIN students s ON r.student_id = s.id
      WHERE s.department = ? AND DATE(r.created_at) = ?
    `, [userDept, today]);

    // 4. Monthly Remarks (Bar Chart Data - Last 6 Months)
    const [monthlyData] = await pool.query(`
      SELECT DATE_FORMAT(r.created_at, '%b') as month, COUNT(*) as remarks
      FROM remarks r
      JOIN students s ON r.student_id = s.id
      WHERE s.department = ? AND r.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month, MONTH(r.created_at)
      ORDER BY MONTH(r.created_at)
    `, [userDept]);

    // 5. Department-wise Remarks (Comparison Bar Chart)
    const [deptWiseRemarks] = await pool.query(`
      SELECT s.department as name, COUNT(*) as remarks
      FROM remarks r
      JOIN students s ON r.student_id = s.id
      GROUP BY s.department
      ORDER BY remarks DESC
    `);

    // 6. Recent Remarks Table (Last 5)
    const [recentRemarks] = await pool.query(`
      SELECT s.name as student, s.register_number as regNo, r.remark_text as remark, r.created_at as date, u.name as submittedBy
      FROM remarks r
      JOIN students s ON r.student_id = s.id
      LEFT JOIN users u ON r.recorded_by = u.id
      WHERE s.department = ?
      ORDER BY r.created_at DESC
      LIMIT 5
    `, [userDept]);

    // 7. Students with Multiple Remarks
    const [repeatOffenders] = await pool.query(`
      SELECT s.name as student, COUNT(*) as remarks
      FROM remarks r
      JOIN students s ON r.student_id = s.id
      WHERE s.department = ?
      GROUP BY s.id
      HAVING remarks > 1
      ORDER BY remarks DESC
      LIMIT 5
    `, [userDept]);

    // 8. Discipline Incharge Information
    const [inchargeInfo] = await pool.query(`
      SELECT u.name, u.department, COUNT(r.id) as remarksSubmittedThisMonth
      FROM users u
      LEFT JOIN remarks r ON u.id = r.recorded_by AND DATE(r.created_at) >= ?
      WHERE u.department = ? AND u.role = 'Incharge'
      GROUP BY u.id
    `, [firstDayOfMonth, userDept]);

    // 9. Notifications (Mocked from latest registrations and remarks)
    const notifications = [];
    if (latestStudent.length > 0) {
      notifications.push({
        id: 'n1',
        type: 'registration',
        message: `Student Registered: ${latestStudent[0].name}`,
        time: latestStudent[0].created_at
      });
    }
    recentRemarks.slice(0, 3).forEach((r, idx) => {
      notifications.push({
        id: `n${idx + 2}`,
        type: 'remark',
        message: `Remark Submitted for ${r.student} by ${r.submittedBy || 'Unknown'}.`,
        time: r.date
      });
    });
    
    // Add mock for New Incharge Added
    const [latestIncharge] = await pool.query('SELECT name, created_at FROM users WHERE role = "Incharge" AND department = ? ORDER BY created_at DESC LIMIT 1', [userDept]);
    if (latestIncharge.length > 0) {
      notifications.push({
        id: 'n_inc',
        type: 'incharge',
        message: `New Incharge Added: ${latestIncharge[0].name}`,
        time: latestIncharge[0].created_at
      });
    }

    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.status(200).json({
      departmentInfo: { 
        name: userDept,
        academicYear: '2025-2026', // usually computed or retrieved from settings
        facultyCount: facultyCount[0]?.count || 0,
        sections: sections.join(', ') || 'N/A'
      },
      studentStats: {
        total: totalStudents[0]?.count || 0,
        thisMonth: monthStudents[0]?.count || 0,
        latest: latestStudent[0] || null,
        byYear: studentYearStats
      },
      remarkStats: {
        total: totalRemarksCount,
        today: todayRemarks[0]?.count || 0,
        categories: remarkCategories
      },
      remarkCategories: categoriesPie,
      monthlyRemarks: monthlyData,
      deptWiseRemarks: deptWiseRemarks,
      recentRemarks: recentRemarks,
      repeatOffenders: repeatOffenders,
      inchargeInfo: inchargeInfo,
      notifications: notifications
    });

  } catch (error) {
    console.error('Dashboard Data Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
