import express from 'express';
import { recordRemark, getRemarksHistory } from '../controllers/remarkController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, recordRemark);
router.get('/history', auth, getRemarksHistory);

export default router;
