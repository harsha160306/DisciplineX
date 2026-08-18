import Remark from '../models/Remark.js';
import Student from '../models/Student.js';
import User from '../models/User.js';

export const getStudentRemarks = async (req, res) => {
  try {
    const { studentId } = req.params;
    const remarks = await Remark.find({ student_id: studentId })
      .populate('recorded_by')
      .sort({ created_at: -1 });
      
    const formattedRemarks = remarks.map(r => ({
      ...r._doc,
      id: r._id,
      incharge_name: r.recorded_by ? r.recorded_by.name : 'Unknown'
    }));
    
    res.status(200).json({ remarks: formattedRemarks });
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

    let student = null;
    if (!student_id) {
      student = await Student.findOne({ register_number });
      if (!student) return res.status(404).json({ message: 'Student not found.' });
    } else {
      student = await Student.findById(student_id);
    }
    
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    await Remark.create({
      student_id: student._id,
      remark_text,
      recorded_by
    });

    // Send SMS notification
    if (student.phone) {
      try {
        const smsGatewayUrl = process.env.SMS_GATEWAY_URL;
        
        if (smsGatewayUrl) {
          const messageText = `DisciplineX Alert:\nDear ${student.name}, a new disciplinary remark ("${remark_text}") has been recorded. Please contact your department for details.\n\nప్రియమైన ${student.name}, మీ పై కొత్త క్రమశిక్షణా రిమార్క్ ("${remark_text}") నమోదు చేయబడింది. మరిన్ని వివరాల కోసం దయచేసి మీ విభాగాన్ని సంప్రదించండి.`;
          
          await fetch(smsGatewayUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': process.env.SMS_GATEWAY_KEY || ''
            },
            body: JSON.stringify({
              phone: student.phone,
              message: messageText
            })
          });
        } else {
          console.log('SMS_GATEWAY_URL not configured, skipping SMS notification.');
        }
      } catch (smsError) {
        console.error('Error sending SMS:', smsError);
        // We still return success for remark creation even if SMS fails
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

    let dateQuery = {};
    const d = date || new Date().toISOString().slice(0, 10);
    
    if (startDate && endDate) {
      dateQuery = {
        $gte: new Date(`${startDate}T00:00:00.000Z`),
        $lte: new Date(`${endDate}T23:59:59.999Z`)
      };
    } else {
      dateQuery = {
        $gte: new Date(`${d}T00:00:00.000Z`),
        $lte: new Date(`${d}T23:59:59.999Z`)
      };
    }

    // First filter students
    let studentFilter = {};
    if (userRole === 'HOD' && userDept) studentFilter.department = userDept;
    if (year) studentFilter.academic_year = year;
    if (semester) studentFilter.semester = semester;
    if (section) studentFilter.section = section;
    
    const students = await Student.find(studentFilter).select('_id name register_number course department academic_year semester section');
    const studentIds = students.map(s => s._id);

    // Now query remarks
    let remarkQuery = {
      created_at: dateQuery,
      student_id: { $in: studentIds }
    };
    
    if (userRole !== 'HOD') {
      remarkQuery.recorded_by = userId;
    }

    const remarks = await Remark.find(remarkQuery)
      .populate('recorded_by')
      .sort({ created_at: -1 });

    const formattedRemarks = remarks.map(r => {
      const student = students.find(s => s._id.toString() === r.student_id.toString());
      return {
        ...r._doc,
        id: r._id,
        incharge_name: r.recorded_by ? r.recorded_by.name : 'Unknown',
        name: student ? student.name : 'Unknown',
        register_number: student ? student.register_number : 'Unknown',
        course: student ? student.course : 'Unknown',
        department: student ? student.department : 'Unknown',
        academic_year: student ? student.academic_year : 'Unknown',
        semester: student ? student.semester : 'Unknown',
        section: student ? student.section : 'Unknown'
      };
    });

    res.status(200).json({
      date: date || (startDate && endDate ? `${startDate} to ${endDate}` : new Date().toISOString().slice(0, 10)),
      total: formattedRemarks.length,
      records: formattedRemarks
    });
  } catch (error) {
    console.error('Fetch remarks history error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
