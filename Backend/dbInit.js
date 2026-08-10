import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Department from './models/Department.js';
import Student from './models/Student.js';
import SystemSetting from './models/SystemSetting.js';
import ActivityLog from './models/ActivityLog.js';
import Remark from './models/Remark.js';

dotenv.config();

const initializeDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully. Initializing Database Collections...');

    // 1. Users
    const adminCount = await User.countDocuments({ role: 'Admin' });
    if (adminCount === 0) {
      await User.insertMany([
        { username: 'admin', password: 'Admin@123', role: 'Admin', name: 'System Admin', department: '', phone: '9500011000', employee_id: 'ADM001', email: 'admin@mic.edu', status: 'Active' },
        { username: 'hod_cse', password: 'HOD@cse123', role: 'HOD', name: 'Dr. R. Kavitha', department: 'CSE', phone: '9500011001', employee_id: 'HOD001', email: 'hod_cse@mic.edu', status: 'Active' },
        { username: 'hod_ece', password: 'HOD@ece123', role: 'HOD', name: 'Dr. S. Rajkumar', department: 'ECE', phone: '9500011002', employee_id: 'HOD002', email: 'hod_ece@mic.edu', status: 'Active' },
        { username: 'hod_mech', password: 'HOD@mech123', role: 'HOD', name: 'Dr. M. Priya', department: 'Mechanical', phone: '9500011003', employee_id: 'HOD003', email: 'hod_mech@mic.edu', status: 'Active' },
        { username: 'incharge_cse1', password: 'Inc@cse1', role: 'Incharge', name: 'Mr. A. Senthil', department: 'CSE', phone: '9500012001', employee_id: 'INC001', email: 'incharge_cse1@mic.edu', status: 'Active' },
        { username: 'incharge_cse2', password: 'Inc@cse2', role: 'Incharge', name: 'Ms. B. Divya', department: 'CSE', phone: '9500012002', employee_id: 'INC002', email: 'incharge_cse2@mic.edu', status: 'Active' },
        { username: 'incharge_ece1', password: 'Inc@ece1', role: 'Incharge', name: 'Mr. C. Rajan', department: 'ECE', phone: '9500012003', employee_id: 'INC003', email: 'incharge_ece1@mic.edu', status: 'Active' }
      ]);
      console.log('- Default test logins (Admin, HODs, Incharges) seeded.');
    } else {
      console.log('- Users already seeded.');
    }

    // 2. Departments
    const deptCount = await Department.countDocuments();
    if (deptCount === 0) {
      await Department.insertMany([
        { name: 'CSE' }, { name: 'ECE' }, { name: 'Mechanical' }, { name: 'Civil' }, { name: 'MBA' }
      ]);
      console.log('- Default departments seeded.');
    } else {
      console.log('- Departments already seeded.');
    }

    // 3. System Settings
    const settingsCount = await SystemSetting.countDocuments();
    if (settingsCount === 0) {
      await SystemSetting.insertMany([
        { setting_key: 'college_name', setting_value: 'Modern Institute College' },
        { setting_key: 'college_logo', setting_value: '' },
        { setting_key: 'academic_year', setting_value: '2025-2026' },
        { setting_key: 'remark_categories', setting_value: 'Late-comer, Non-uniform, Indiscipline, Others' },
        { setting_key: 'password_policy', setting_value: '{"minLength": 6, "requireSpecial": false}' }
      ]);
      console.log('- Default system settings seeded.');
    } else {
      console.log('- System settings already seeded.');
    }

    // 4. Students
    const studentCount = await Student.countDocuments();
    if (studentCount === 0) {
      await Student.insertMany([
        { register_number: '2024CS101', name: 'Rahul Sharma', course: 'B.Tech', department: 'CSE', academic_year: '3rd Year', validity: '2027', section: 'A', semester: 'V', email: 'rahul@gmail.com', phone: '9876543210', photo_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnM-pyl2GLRMVnjxwsCXyp4bZU_dGsSv6BzQCj0OKi8NlhK2UyNps1HU1jaO-RKjb9B_updyWAjRKfBDg572WWob87YdE1z3TdQcV8a2ef1wKEeFrB9sEdd27i_dIOWCyUVlMu7yFK_wIg3BX_KEVleXsL8hvR0fdmFsvCxZPM2qBBvYkaKN8J6PNGNIJVFnkkqqKKD13x4T5B4-oy5GOfVTfsdQ1i_tgyeDusR7TI6zX1MarWjuJGvuY-hBnEByhJW71sEbmPwDrB' },
        { register_number: '2024ME045', name: 'Anjali Verma', course: 'B.Tech', department: 'Mechanical', academic_year: '2nd Year', validity: '2028', section: 'B', semester: 'III', email: 'anjali@gmail.com', phone: '9876543211', photo_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTuEzyi6BX288E_wzMVHXWMUOfXKPnfoPAH-0dsuJNUGciaHdnYoTT5IyMfM-JJZ7OW1ZV70AIG19OH-9tzOJmQq8qbSS0Xg34ph03JJs5GmH2skFMmBT1Xw7a2IL6TSpY0ftt8RCdDU_LuiAX1WBu9ZPaWZzIH6GwRQIVRSprKZ-2ZlDKud2OZ_VEYon1QNT90Cs_CwlzK6xDNIjcFck0Y3tFfIkkamZS7duB52mqHKmOgPa_uVfZVj72aDAEqz9luXXxnSkVE_YB' }
      ]);
      console.log('- Default test students seeded.');
    } else {
      console.log('- Students already seeded.');
    }

    // 5. Remarks and Activity Logs will be created via API.

    console.log('Database initialization and seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error during database initialization:', err);
    process.exit(1);
  }
};

initializeDB();
