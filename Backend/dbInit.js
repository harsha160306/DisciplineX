import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.MYSQL_ADDON_HOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQL_ADDON_USER || process.env.DB_USER || 'root',
  password: process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'mic_attendance',
  port: parseInt(process.env.MYSQL_ADDON_PORT || '3306', 10),
};

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.MYSQL_ADDON_HOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQL_ADDON_USER || process.env.DB_USER || 'root',
  password: process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'mic_attendance',
  port: parseInt(process.env.MYSQL_ADDON_PORT || '3306', 10),
};

const initializeDB = async () => {
  let connection;
  try {
    console.log('Connecting to MySQL database for initialization...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected successfully. Initializing Database Tables...');

    // 1. Users Table
    await connection.query(`
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
        designation VARCHAR(100) DEFAULT 'Discipline Incharge',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('- Users table verified/created.');

    // Migration of columns for legacy users table if exists
    const usersColumns = [
      { name: 'department', type: 'VARCHAR(100)' },
      { name: 'phone', type: 'VARCHAR(20)' },
      { name: 'employee_id', type: 'VARCHAR(50)' },
      { name: 'email', type: 'VARCHAR(255)' },
      { name: 'status', type: "VARCHAR(20) DEFAULT 'Active'" },
      { name: 'designation', type: "VARCHAR(100) DEFAULT 'Discipline Incharge'" },
      { name: 'created_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ];
    for (const col of usersColumns) {
      try {
        await connection.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        console.log(`- Column ${col.name} verified/added to users.`);
      } catch (_) {}
    }

    // Seed default users if users table has no admin
    const [userRows] = await connection.query("SELECT COUNT(*) as count FROM users WHERE role = 'Admin'");
    if (userRows[0].count === 0) {
      await connection.query(`
        INSERT INTO users (username, password, role, name, department, phone, employee_id, email, status) VALUES 
        ('admin', 'Admin@123', 'Admin', 'System Admin', '', '9500011000', 'ADM001', 'admin@mic.edu', 'Active'),
        ('hod_cse', 'HOD@cse123', 'HOD', 'Dr. R. Kavitha', 'CSE', '9500011001', 'HOD001', 'hod_cse@mic.edu', 'Active'),
        ('hod_ece', 'HOD@ece123', 'HOD', 'Dr. S. Rajkumar', 'ECE', '9500011002', 'HOD002', 'hod_ece@mic.edu', 'Active'),
        ('hod_mech', 'HOD@mech123', 'HOD', 'Dr. M. Priya', 'Mechanical', '9500011003', 'HOD003', 'hod_mech@mic.edu', 'Active'),
        ('incharge_cse1', 'Inc@cse1', 'Incharge', 'Mr. A. Senthil', 'CSE', '9500012001', 'INC001', 'incharge_cse1@mic.edu', 'Active'),
        ('incharge_cse2', 'Inc@cse2', 'Incharge', 'Ms. B. Divya', 'CSE', '9500012002', 'INC002', 'incharge_cse2@mic.edu', 'Active'),
        ('incharge_ece1', 'Inc@ece1', 'Incharge', 'Mr. C. Rajan', 'ECE', '9500012003', 'INC003', 'incharge_ece1@mic.edu', 'Active')
      `);
      console.log('- Default test logins (Admin, HODs, Incharges) seeded.');
    }

    // 2. Departments Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('- Departments table verified/created.');

    const [deptRows] = await connection.query('SELECT COUNT(*) as count FROM departments');
    if (deptRows[0].count === 0) {
      await connection.query("INSERT INTO departments (name) VALUES ('CSE'), ('ECE'), ('Mechanical'), ('Civil'), ('MBA')");
      console.log('- Default departments seeded.');
    }

    // 3. Activity Logs Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_name VARCHAR(255) NOT NULL,
        user_role VARCHAR(50) NOT NULL,
        action VARCHAR(255) NOT NULL,
        date VARCHAR(20) NOT NULL,
        time VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('- Activity logs table verified/created.');

    // 4. System Settings Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT NOT NULL
      )
    `);
    console.log('- System settings table verified/created.');

    const [settingRows] = await connection.query('SELECT COUNT(*) as count FROM system_settings');
    if (settingRows[0].count === 0) {
      await connection.query(`
        INSERT INTO system_settings (setting_key, setting_value) VALUES 
        ('college_name', 'Modern Institute College'),
        ('college_logo', ''),
        ('academic_year', '2025-2026'),
        ('remark_categories', 'Late-comer, Non-uniform, Indiscipline, Others'),
        ('password_policy', '{"minLength": 6, "requireSpecial": false}')
      `);
      console.log('- Default system settings seeded.');
    }

    // 5. Students Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        register_number VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        course VARCHAR(50) NOT NULL,
        department VARCHAR(100) NOT NULL,
        academic_year VARCHAR(50) NOT NULL,
        validity VARCHAR(50) NOT NULL,
        dob VARCHAR(50),
        blood_group VARCHAR(10),
        address TEXT,
        section VARCHAR(10) NOT NULL,
        semester VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        photo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('- Students table verified/created.');

    // Seed Students
    const [studentRows] = await connection.query('SELECT COUNT(*) as count FROM students');
    if (studentRows[0].count === 0) {
      await connection.query(`
        INSERT INTO students (register_number, name, course, department, academic_year, validity, dob, blood_group, address, section, semester, email, phone, photo_url) VALUES 
        ('2024CS101', 'Rahul Sharma', 'B.Tech', 'CSE', '3rd Year', '2027', NULL, NULL, NULL, 'A', 'V', 'rahul@gmail.com', '9876543210', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnM-pyl2GLRMVnjxwsCXyp4bZU_dGsSv6BzQCj0OKi8NlhK2UyNps1HU1jaO-RKjb9B_updyWAjRKfBDg572WWob87YdE1z3TdQcV8a2ef1wKEeFrB9sEdd27i_dIOWCyUVlMu7yFK_wIg3BX_KEVleXsL8hvR0fdmFsvCxZPM2qBBvYkaKN8J6PNGNIJVFnkkqqKKD13x4T5B4-oy5GOfVTfsdQ1i_tgyeDusR7TI6zX1MarWjuJGvuY-hBnEByhJW71sEbmPwDrB'),
        ('2024ME045', 'Anjali Verma', 'B.Tech', 'Mechanical', '2nd Year', '2028', NULL, NULL, NULL, 'B', 'III', 'anjali@gmail.com', '9876543211', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTuEzyi6BX288E_wzMVHXWMUOfXKPnfoPAH-0dsuJNUGciaHdnYoTT5IyMfM-JJZ7OW1ZV70AIG19OH-9tzOJmQq8qbSS0Xg34ph03JJs5GmH2skFMmBT1Xw7a2IL6TSpY0ftt8RCdDU_LuiAX1WBu9ZPaWZzIH6GwRQIVRSprKZ-2ZlDKud2OZ_VEYon1QNT90Cs_CwlzK6xDNIjcFck0Y3tFfIkkamZS7duB52mqHKmOgPa_uVfZVj72aDAEqz9luXXxnSkVE_YB')
      `);
      console.log('- Default test students seeded.');
    }

    // 6. Remarks Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS remarks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        remark_text TEXT NOT NULL,
        recorded_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('- Remarks table verified/created.');

    console.log('Database initialization and seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error during database initialization:', err);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

initializeDB();
