import express from 'express';
import { 
  getHODs, createHOD, updateHOD, deleteHOD, resetHODPassword, toggleHODStatus,
  getIncharges, createIncharge, updateIncharge, deleteIncharge, resetInchargePassword, toggleInchargeStatus,
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getStudents, updateStudent, deleteStudent,
  getRemarks, deleteRemark,
  getActivityLogs, createActivityLog,
  getSystemSettings, updateSystemSettings,
  getAdminAnalytics,
  updateAdminProfile, changeAdminPassword
} from '../controllers/adminController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Middleware to restrict access to Admins only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
};

// HOD Management
router.get('/hods', auth, adminOnly, getHODs);
router.post('/hods', auth, adminOnly, createHOD);
router.put('/hods/:id', auth, adminOnly, updateHOD);
router.delete('/hods/:id', auth, adminOnly, deleteHOD);
router.put('/hods/:id/reset-password', auth, adminOnly, resetHODPassword);
router.put('/hods/:id/status', auth, adminOnly, toggleHODStatus);

// Discipline Incharge Management
router.get('/incharges', auth, adminOnly, getIncharges);
router.post('/incharges', auth, adminOnly, createIncharge);
router.put('/incharges/:id', auth, adminOnly, updateIncharge);
router.delete('/incharges/:id', auth, adminOnly, deleteIncharge);
router.put('/incharges/:id/reset-password', auth, adminOnly, resetInchargePassword);
router.put('/incharges/:id/status', auth, adminOnly, toggleInchargeStatus);

// Department Management
router.get('/departments', auth, adminOnly, getDepartments);
router.post('/departments', auth, adminOnly, createDepartment);
router.put('/departments/:id', auth, adminOnly, updateDepartment);
router.delete('/departments/:id', auth, adminOnly, deleteDepartment);

// Student Management
router.get('/students', auth, adminOnly, getStudents);
router.put('/students/:id', auth, adminOnly, updateStudent);
router.delete('/students/:id', auth, adminOnly, deleteStudent);

// Remarks Management
router.get('/remarks', auth, adminOnly, getRemarks);
router.delete('/remarks/:id', auth, adminOnly, deleteRemark);

// Activity Logs
router.get('/logs', auth, adminOnly, getActivityLogs);
router.post('/logs', auth, adminOnly, createActivityLog);

// System Settings
router.get('/settings', auth, adminOnly, getSystemSettings);
router.post('/settings', auth, adminOnly, updateSystemSettings);

// Analytics
router.get('/analytics', auth, adminOnly, getAdminAnalytics);

// Admin Profile
router.put('/profile', auth, adminOnly, updateAdminProfile);
router.put('/change-password', auth, adminOnly, changeAdminPassword);

export default router;
