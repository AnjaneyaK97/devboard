import { asyncWrapper } from '../utils/asyncWrapper.js';
import * as savedSearchService from '../services/savedSearch.service.js';

/**
 * POST /api/v1/saved-searches
 */
export const createSearch = asyncWrapper(async (req, res) => {
  const result = await savedSearchService.createSavedSearch(req.user._id, req.body);
  res.status(201).json({
    success: true,
    data: { savedSearch: result },
  });
});

/**
 * GET /api/v1/saved-searches
 */
export const getMySearches = asyncWrapper(async (req, res) => {
  const result = await savedSearchService.getUserSavedSearches(req.user._id);
  res.status(200).json({
    success: true,
    data: { savedSearches: result },
  });
});

/**
 * DELETE /api/v1/saved-searches/:id
 */
export const deleteSearch = asyncWrapper(async (req, res) => {
  const result = await savedSearchService.deleteSavedSearch(req.params.id, req.user._id);
  res.status(200).json({
    success: true,
    data: result,
  });
});
