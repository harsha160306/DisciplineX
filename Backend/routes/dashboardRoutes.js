import express from 'express';
import { getHODDashboardData } from '../controllers/dashboardController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/hod', auth, getHODDashboardData);

export default router;
