import express from 'express';
import { bookmark, unbookmark, listSaved } from '../controllers/saved.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', listSaved);
router.post('/', bookmark);
router.delete('/:jobId', unbookmark);

export default router;
