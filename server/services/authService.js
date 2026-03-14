const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * AuthService
 * Handles all authentication business logic.
 * Controllers call these methods and only deal with req/res.
 */

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Register a new user.
 * Returns { token, user } on success.
 * Throws an error with a .status property on failure.
 */
const register = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('Email already in use.');
    err.status = 409;
    throw err;
  }

  const user = await User.create({
    name,
    email,
    password,
    role:   'member',   // always member on registration — admin promotes via Users page
    domain: 'general',  // default domain, admin can change later
  });

  const token = signToken(user._id);
  return { token, user };
};

/**
 * Login with email + password.
 * Returns { token, user } on success.
 * Throws 401 on bad credentials.
 */
const login = async ({ email, password }) => {
  // Explicitly select password (excluded by default in schema)
  const user = await User.findOne({ email }).select('+password');

  if (!user || !user.isActive) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  const token = signToken(user._id);
  return { token, user };
};

/**
 * Get full user profile by ID.
 */
const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }
  return user;
};

/**
 * Format user for API response — strips sensitive fields.
 */
const formatUser = (user) => ({
  id:     user._id,
  name:   user.name,
  email:  user.email,
  role:   user.role,
  domain: user.domain,
  avatar: user.avatar,
});

module.exports = { register, login, getProfile, formatUser, signToken };
