import express from 'express';
import {
  createSearch,
  getMySearches,
  deleteSearch,
} from '../controllers/savedSearch.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createSearch);
router.get('/', getMySearches);
router.delete('/:id', deleteSearch);

export default router;
