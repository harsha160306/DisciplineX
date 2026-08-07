import express from 'express';
import { getStudentByRegisterNumber, registerStudent, getRepeatOffenders, filterStudents } from '../controllers/studentController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/repeat-offenders', auth, getRepeatOffenders);
router.get('/filter', auth, filterStudents);
router.get('/register/:registerNumber', auth, getStudentByRegisterNumber);
router.post('/', auth, registerStudent);

export default router;
