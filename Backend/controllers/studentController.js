import Student from '../models/Student.js';
import Remark from '../models/Remark.js';
import ScannedIdCard from '../models/ScannedIdCard.js';

export const getStudentByRegisterNumber = async (req, res) => {
  try {
    const { registerNumber } = req.params;
    
    // Exact match on register number OR partial match on name
    const students = await Student.find({
      $or: [
        { register_number: registerNumber },
        { name: { $regex: new RegExp(registerNumber, 'i') } }
      ]
    });

    if (students.length === 0) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    
    const student = students[0];

    const remarks = await Remark.find({ student_id: student._id })
      .populate('recorded_by')
      .sort({ created_at: -1 });

    const formattedRemarks = remarks.map(r => ({
      ...r._doc,
      id: r._id,
      incharge_name: r.recorded_by ? r.recorded_by.name : 'Unknown'
    }));

    res.status(200).json({ student: { ...student._doc, id: student._id }, remarks: formattedRemarks });
  } catch (error) {
    console.error('Fetch student error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const filterStudents = async (req, res) => {
  try {
    const { department, academic_year } = req.query;

    if (!department || !academic_year) {
      return res.status(400).json({ message: 'Department and academic_year are required parameters.' });
    }

    const students = await Student.find({ department, academic_year });

    res.status(200).json(students.map(s => ({ ...s._doc, id: s._id })));
  } catch (error) {
    console.error('Filter students error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const registerStudent = async (req, res) => {
  try {
    const { register_number, name, course, department, academic_year, validity, dob, blood_group, address, email, phone, photo_url } = req.body;

    if (!register_number || !name || !course || !department || !academic_year || !validity) {
      return res.status(400).json({ message: 'Required fields: Register number, name, course, department, academic year, validity.' });
    }

    try {
      await Student.create({
        register_number, name, course, department, academic_year, validity, 
        dob: dob || null, 
        blood_group: blood_group || '', 
        address: address || '', 
        section: '-', 
        semester: '-', 
        email: email || '', 
        phone: phone || '', 
        photo_url: photo_url || null
      });
      res.status(201).json({ message: 'Student registered successfully.' });
    } catch (dbError) {
      if (dbError.code === 11000) {
        return res.status(400).json({ message: 'Registration number already exists.' });
      }
      throw dbError;
    }

  } catch (error) {
    console.error('Register student error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getRepeatOffenders = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userDept = req.user.department;

    let studentFilter = {};
    if (userRole === 'HOD' && userDept) {
      studentFilter.department = userDept;
    }

    // Find all students in department (or all students if Admin)
    const students = await Student.find(studentFilter);
    const studentIds = students.map(s => s._id);

    // Aggregate remarks for these students
    const repeatOffendersRaw = await Remark.aggregate([
      { $match: { student_id: { $in: studentIds } } },
      { $group: { _id: "$student_id", remark_count: { $sum: 1 } } },
      { $match: { remark_count: { $gt: 1 } } },
      { $sort: { remark_count: -1 } },
      { $limit: 20 }
    ]);

    const repeatOffenders = repeatOffendersRaw.map(r => {
      const student = students.find(s => s._id.toString() === r._id.toString());
      return {
        id: student ? student._id : null,
        name: student ? student.name : 'Unknown',
        register_number: student ? student.register_number : 'Unknown',
        department: student ? student.department : 'Unknown',
        photo_url: student ? student.photo_url : null,
        remark_count: r.remark_count
      };
    }).filter(r => r.id !== null);

    res.status(200).json(repeatOffenders);
  } catch (error) {
    console.error('Fetch repeat offenders error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const saveScannedIdCard = async (req, res) => {
  try {
    const { register_number, name, branch } = req.body;

    if (!register_number || !name || !branch) {
      return res.status(400).json({ message: 'Required fields: Register number, name, branch.' });
    }

    await ScannedIdCard.create({
      register_number, name, branch
    });

    res.status(201).json({ message: 'Scanned ID card saved successfully.' });
  } catch (error) {
    console.error('Save scanned ID error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
