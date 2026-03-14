const express = require('express');
const { body } = require('express-validator');
const {
  getQueries, getQuery, createQuery, updateQuery,
  addComment, deleteQuery, getStats,
} = require('../controllers/queryController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// All query routes require authentication
router.use(protect);

// Stats (must be before /:id to avoid conflict)
router.get('/stats', getStats);

// Validation for creating a query
const createValidation = [
  body('title').trim().isLength({ min: 5, max: 150 }).withMessage('Title must be 5-150 characters'),
  body('description').trim().isLength({ min: 10, max: 5000 }).withMessage('Description must be 10-5000 characters'),
  body('category')
    .isIn(['tech', 'marketing', 'events', 'partnerships', 'media', 'operations', 'general'])
    .withMessage('Invalid category'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
];

router
  .route('/')
  .get(getQueries)
  .post(upload.array('attachments', 5), createValidation, createQuery);

router
  .route('/:id')
  .get(getQuery)
  .patch(restrictTo('admin', 'manager'), updateQuery)
  .delete(restrictTo('admin'), deleteQuery);

router.post('/:id/comments', addComment);

module.exports = router;