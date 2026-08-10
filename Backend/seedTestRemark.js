import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Student from './models/Student.js';
import Remark from './models/Remark.js';

dotenv.config();

const seedTest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully. Creating test student and remark...');

    // Find CSE HOD and Incharge
    const incharge = await User.findOne({ username: 'incharge_cse1' });

    // Create a 2nd year CSE student
    const testStudent = await Student.findOneAndUpdate(
      { register_number: '2024CS202' },
      {
        register_number: '2024CS202',
        name: 'Neha Gupta',
        course: 'B.Tech',
        department: 'CSE',
        academic_year: '2nd Year',
        validity: '2028',
        section: 'A',
        semester: 'III',
        email: 'neha@gmail.com',
        phone: '9876543222',
        photo_url: null
      },
      { upsert: true, new: true }
    );

    // Create a remark for July 15, 2026
    const remarkDate = new Date('2026-07-15T10:30:00Z');
    
    await Remark.create({
      student_id: testStudent._id,
      remark_text: 'Late-comer',
      recorded_by: incharge._id,
      created_at: remarkDate // Mongoose timestamps usually override this unless we configure it or manually set it.
    });

    // To ensure created_at is strictly July 15, we might need to update it directly if timestamps override it
    await Remark.updateOne(
      { student_id: testStudent._id, remark_text: 'Late-comer' },
      { $set: { created_at: remarkDate, updatedAt: remarkDate } }
    );

    console.log('Test student (2nd Year, CSE) and July remark seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

seedTest();
