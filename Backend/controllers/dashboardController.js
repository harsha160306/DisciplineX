import User from '../models/User.js';
import Student from '../models/Student.js';
import Remark from '../models/Remark.js';

export const getHODDashboardData = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userDept = req.user.department;

    if (userRole !== 'HOD') return res.status(403).json({ message: 'Access denied.' });

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const firstDayOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);

    // Get all student IDs for this department to easily filter remarks
    const deptStudents = await Student.find({ department: userDept }).select('_id');
    const deptStudentIds = deptStudents.map(s => s._id);

    // 1. Department Overview Stats
    const totalStudents = deptStudentIds.length;
    const monthStudents = await Student.countDocuments({ department: userDept, created_at: { $gte: firstDayOfMonth } });
    const latestStudent = await Student.findOne({ department: userDept }).sort({ created_at: -1 });
    
    const facultyCount = await User.countDocuments({ role: 'Incharge', department: userDept });
    const sectionsList = await Student.distinct('section', { department: userDept });
    const sections = sectionsList.filter(Boolean);

    // 2. Student Stats by Year
    const yearlyStatsRaw = await Student.aggregate([
      { $match: { department: userDept } },
      { $group: { _id: "$academic_year", count: { $sum: 1 } } }
    ]);

    const formatYear = (yearStr) => {
      if (yearStr.includes('1')) return 'Year I';
      if (yearStr.includes('2')) return 'Year II';
      if (yearStr.includes('3')) return 'Year III';
      if (yearStr.includes('4')) return 'Year IV';
      return yearStr;
    };

    const studentYearStats = { 'Year I': 0, 'Year II': 0, 'Year III': 0, 'Year IV': 0 };
    yearlyStatsRaw.forEach(stat => {
      const formatted = formatYear(stat._id || '');
      if (studentYearStats[formatted] !== undefined) studentYearStats[formatted] += stat.count;
    });

    // 3. Remark Statistics Breakdown
    const categoryStats = await Remark.aggregate([
      { $match: { student_id: { $in: deptStudentIds } } },
      { $group: { _id: "$remark_text", count: { $sum: 1 } } }
    ]);

    let totalRemarksCount = 0;
    const remarkCategories = { 'Non-uniform': 0, 'Late-comer': 0, 'Indiscipline': 0, 'Others': 0 };
    categoryStats.forEach(stat => {
      totalRemarksCount += stat.count;
      if (remarkCategories[stat._id] !== undefined) remarkCategories[stat._id] += stat.count;
      else remarkCategories['Others'] += stat.count;
    });

    const categoriesPie = Object.keys(remarkCategories).map(key => ({ name: key, value: remarkCategories[key] })).filter(cat => cat.value > 0);

    const todayRemarksCount = await Remark.countDocuments({ 
      student_id: { $in: deptStudentIds }, 
      created_at: { $gte: todayDate } 
    });

    // 4. Monthly Remarks (Bar Chart Data - Last 6 Months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last6 = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(todayDate.getFullYear(), todayDate.getMonth() - i, 1);
      last6.push({ month: months[d.getMonth()], key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, remarks: 0 });
    }

    const deptRemarks = await Remark.find({ student_id: { $in: deptStudentIds }, created_at: { $gte: new Date(todayDate.getFullYear(), todayDate.getMonth() - 5, 1) } });
    deptRemarks.forEach(r => {
      const rDate = new Date(r.created_at);
      const rKey = `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, '0')}`;
      const bucket = last6.find(b => b.key === rKey);
      if (bucket) bucket.remarks++;
    });

    // 5. Department-wise Remarks (Comparison Bar Chart)
    const allRemarks = await Remark.find().populate('student_id');
    const deptWiseCount = {};
    allRemarks.forEach(r => {
      if (r.student_id) {
        const d = r.student_id.department;
        deptWiseCount[d] = (deptWiseCount[d] || 0) + 1;
      }
    });
    const deptWiseRemarks = Object.keys(deptWiseCount).map(k => ({ name: k, remarks: deptWiseCount[k] })).sort((a, b) => b.remarks - a.remarks);

    // 6. Recent Remarks Table (Last 5)
    const recentRemarksRaw = await Remark.find({ student_id: { $in: deptStudentIds } })
      .populate('student_id').populate('recorded_by')
      .sort({ created_at: -1 }).limit(5);

    const recentRemarks = recentRemarksRaw.map(r => ({
      student: r.student_id ? r.student_id.name : 'Unknown',
      regNo: r.student_id ? r.student_id.register_number : 'Unknown',
      remark: r.remark_text,
      date: r.created_at,
      submittedBy: r.recorded_by ? r.recorded_by.name : 'Unknown'
    }));

    // 7. Students with Multiple Remarks
    const repeatOffendersRaw = await Remark.aggregate([
      { $match: { student_id: { $in: deptStudentIds } } },
      { $group: { _id: "$student_id", remarks: { $sum: 1 } } },
      { $match: { remarks: { $gt: 1 } } },
      { $sort: { remarks: -1 } },
      { $limit: 5 }
    ]);
    const repeatOffenderIds = repeatOffendersRaw.map(r => r._id);
    const repeatOffenderStudents = await Student.find({ _id: { $in: repeatOffenderIds } });
    const repeatOffenders = repeatOffendersRaw.map(r => {
      const stu = repeatOffenderStudents.find(s => s._id.toString() === r._id.toString());
      return { student: stu ? stu.name : 'Unknown', remarks: r.remarks };
    });

    // 8. Discipline Incharge Information
    const incharges = await User.find({ role: 'Incharge', department: userDept });
    const inchargeInfo = await Promise.all(incharges.map(async inc => {
      const remarksThisMonth = await Remark.countDocuments({ recorded_by: inc._id, created_at: { $gte: firstDayOfMonth } });
      return { name: inc.name, department: inc.department, remarksSubmittedThisMonth: remarksThisMonth };
    }));

    // 9. Notifications
    const notifications = [];
    if (latestStudent) {
      notifications.push({ id: 'n1', type: 'registration', message: `Student Registered: ${latestStudent.name}`, time: latestStudent.created_at });
    }
    recentRemarks.slice(0, 3).forEach((r, idx) => {
      notifications.push({ id: `n${idx + 2}`, type: 'remark', message: `Remark Submitted for ${r.student} by ${r.submittedBy}.`, time: r.date });
    });
    
    const latestIncharge = await User.findOne({ role: 'Incharge', department: userDept }).sort({ created_at: -1 });
    if (latestIncharge) {
      notifications.push({ id: 'n_inc', type: 'incharge', message: `New Incharge Added: ${latestIncharge.name}`, time: latestIncharge.created_at });
    }
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.status(200).json({
      departmentInfo: { 
        name: userDept,
        academicYear: '2025-2026',
        facultyCount,
        sections: sections.join(', ') || 'N/A'
      },
      studentStats: {
        total: totalStudents,
        thisMonth: monthStudents,
        latest: latestStudent,
        byYear: studentYearStats
      },
      remarkStats: {
        total: totalRemarksCount,
        today: todayRemarksCount,
        categories: remarkCategories
      },
      remarkCategories: categoriesPie,
      monthlyRemarks: last6.map(b => ({ month: b.month, remarks: b.remarks })),
      deptWiseRemarks,
      recentRemarks,
      repeatOffenders,
      inchargeInfo,
      notifications
    });

  } catch (error) {
    console.error('Dashboard Data Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
