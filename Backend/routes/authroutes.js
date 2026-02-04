import express from 'express';
import {
  signup,
  signin,
  getUserProfile,
  getPatients,
  getDoctors,
  getDoctorByWallet,
  getPatientByWallet
} from '../controllers/authcontroller.js';
import { authenticateToken, authenticateTokenWithRole, protect } from '../middleware/authmiddleware.js';

const router = express.Router();

// Authentication routes
router.post('/signup', signup);
router.post('/signin', signin);
router.get('/me', protect, getUserProfile);

router.get('/patients', getPatients);
router.get('/doctors', getDoctors);
router.get('/doctors/wallet/:walletAddress', getDoctorByWallet);
router.get('/patients/wallet/:walletAddress', getPatientByWallet);

export default router;