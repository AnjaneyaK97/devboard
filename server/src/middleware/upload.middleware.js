import multer from 'multer';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

// Use memory storage for quick streaming to parser & cloud/disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF resume documents are supported. Please upload a .pdf file.', 400), false);
  }
};

export const uploadResume = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024, // 5MB
  },
}).single('resume');
