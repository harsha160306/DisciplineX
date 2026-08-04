import pool from './db.js';
import { setTimeout as sleep } from 'timers/promises';

await sleep(3000); // wait for MySQL pool to connect

console.log('Running migration...');

// Add missing columns
for (const col of [
  'ALTER TABLE users ADD COLUMN department VARCHAR(100) DEFAULT ""',
  'ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT ""',
  'ALTER TABLE users ADD COLUMN employee_id VARCHAR(50) DEFAULT ""',
]) {
  try { await pool.query(col); console.log('OK:', col.slice(0, 50)); }
  catch(e) { console.log('Skip (exists?):', e.message.slice(0, 80)); }
}

// Seed users
const USERS = [
  { username: 'hod_cse',        password: 'HOD@cse123',  role: 'HOD',      name: 'Dr. R. Kavitha',   department: 'CSE',        phone: '9500011001', employee_id: 'HOD001' },
  { username: 'hod_ece',        password: 'HOD@ece123',  role: 'HOD',      name: 'Dr. S. Rajkumar',  department: 'ECE',        phone: '9500011002', employee_id: 'HOD002' },
  { username: 'hod_mech',       password: 'HOD@mech123', role: 'HOD',      name: 'Dr. M. Priya',     department: 'Mechanical', phone: '9500011003', employee_id: 'HOD003' },
  { username: 'incharge_cse1',  password: 'Inc@cse1',    role: 'Incharge', name: 'Mr. A. Senthil',   department: 'CSE',        phone: '9500012001', employee_id: 'INC001' },
  { username: 'incharge_cse2',  password: 'Inc@cse2',    role: 'Incharge', name: 'Ms. B. Divya',     department: 'CSE',        phone: '9500012002', employee_id: 'INC002' },
  { username: 'incharge_ece1',  password: 'Inc@ece1',    role: 'Incharge', name: 'Mr. C. Rajan',     department: 'ECE',        phone: '9500012003', employee_id: 'INC003' },
];

for (const u of USERS) {
  try {
    await pool.query(
      'INSERT IGNORE INTO users (username, password, role, name, department, phone, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [u.username, u.password, u.role, u.name, u.department, u.phone, u.employee_id]
    );
    console.log('Inserted:', u.username);
  } catch (e) {
    console.log('Error for', u.username, ':', e.message);
  }
}

const [rows] = await pool.query('SELECT username, role, department FROM users');
console.log('\nFinal users in DB:');
rows.forEach(r => console.log(`  ${r.role.padEnd(10)} ${r.username.padEnd(20)} ${r.department || ''}`));
process.exit(0);
