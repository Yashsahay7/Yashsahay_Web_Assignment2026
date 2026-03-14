const User = require('../models/User');

/**
 * UserService
 * All user management business logic.
 */

const getAll = async () => {
  return User.find().select('-password').sort({ createdAt: -1 });
};

const getManagers = async () => {
  return User.find({ role: 'manager', isActive: true })
    .select('name email role domain avatar');
};

const updateRole = async (targetId, { role, domain }, requestingUser) => {
  if (requestingUser.role !== 'admin') {
    const err = new Error('Only admins can change roles.');
    err.status = 403;
    throw err;
  }
  if (targetId === requestingUser._id.toString()) {
    const err = new Error('You cannot change your own role.');
    err.status = 400;
    throw err;
  }

  const user = await User.findByIdAndUpdate(
    targetId,
    { role, domain },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  return user;
};

const deactivate = async (targetId, requestingUser) => {
  if (requestingUser.role !== 'admin') {
    const err = new Error('Only admins can deactivate users.');
    err.status = 403;
    throw err;
  }
  if (targetId === requestingUser._id.toString()) {
    const err = new Error('You cannot deactivate yourself.');
    err.status = 400;
    throw err;
  }

  const user = await User.findByIdAndUpdate(
    targetId,
    { isActive: false },
    { new: true }
  ).select('-password');

  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  return user;
};

module.exports = { getAll, getManagers, updateRole, deactivate };