import express from 'express';
import { handleResumeUpload } from '../controllers/upload.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadResume } from '../middleware/upload.middleware.js';

const router = express.Router();

router.post('/resume', protect, uploadResume, handleResumeUpload);

export default router;
