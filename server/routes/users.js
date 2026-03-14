const express = require('express');
const { getUsers, getManagers, updateRole, deactivate } = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', restrictTo('admin'), getUsers);
router.get('/managers', getManagers); // All roles can see managers (for assignment UI)
router.patch('/:id/role', restrictTo('admin'), updateRole);
router.patch('/:id/deactivate', restrictTo('admin'), deactivate);

module.exports = router;
