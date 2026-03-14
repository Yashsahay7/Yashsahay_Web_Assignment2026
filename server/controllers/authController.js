const AuthService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { token, user } = await AuthService.register(req.body);
    res.status(201).json({ success: true, token, data: AuthService.formatUser(user) });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required.' });
    const { token, user } = await AuthService.login({ email, password });
    res.json({ success: true, token, data: AuthService.formatUser(user) });
  } catch (err) { next(err); }
};

const getMe = async (req, res, next) => {
  try {
    const user = await AuthService.getProfile(req.user._id);
    res.json({ success: true, data: AuthService.formatUser(user) });
  } catch (err) { next(err); }
};

module.exports = { register, login, getMe };