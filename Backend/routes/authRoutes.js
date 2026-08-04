import express from 'express';
import { login, getIncharges, createIncharge } from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/incharges', auth, getIncharges);
router.post('/incharge', auth, createIncharge);

export default router;
