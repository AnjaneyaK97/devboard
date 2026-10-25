import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { parseResumeBuffer } from '../services/resumeParser.service.js';
import { User, AuditLog } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure local uploads directory exists
const uploadsDir = path.resolve(__dirname, '../../../uploads/resumes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const handleResumeUpload = asyncWrapper(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No resume file provided. Please attach a .pdf file.', 400));
  }

  // 1. Generate unique file name
  const fileHash = crypto.randomBytes(8).toString('hex');
  const safeOriginalName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${fileHash}_${safeOriginalName}`;
  const filePath = path.join(uploadsDir, fileName);

  // 2. Save file to disk
  fs.writeFileSync(filePath, req.file.buffer);
  const fileUrl = `/uploads/resumes/${fileName}`;

  // 3. Extract skills and experience using parser service
  const parseResult = await parseResumeBuffer(req.file.buffer);

  // 4. Update candidate user document
  if (req.user) {
    const user = await User.findById(req.user._id);
    if (user) {
      user.resumeUrl = fileUrl;
      user.resumeOriginalName = req.file.originalname;

      // If user had no experience years, populate with estimated
      if ((!user.experienceYears || user.experienceYears === 0) && parseResult.estimatedExperienceYears > 0) {
        user.experienceYears = parseResult.estimatedExperienceYears;
      }

      await user.save();

      // Audit Log
      await AuditLog.create({
        actor: user._id,
        action: 'RESUME_UPLOADED',
        entity: 'User',
        entityId: user._id,
        meta: {
          originalName: req.file.originalname,
          skillsFound: parseResult.extractedSkills.length,
        },
      });
    }
  }

  res.status(200).json({
    success: true,
    message: 'Resume uploaded and parsed successfully',
    data: {
      resumeUrl: fileUrl,
      originalName: req.file.originalname,
      extractedSkills: parseResult.extractedSkills,
      estimatedExperienceYears: parseResult.estimatedExperienceYears,
      preview: parseResult.preview,
    },
    requestId: req.requestId,
  });
});
