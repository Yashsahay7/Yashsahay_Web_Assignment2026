const UserService = require('../services/userService');

const getUsers = async (req, res, next) => {
  try {
    const users = await UserService.getAll();
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

const getManagers = async (req, res, next) => {
  try {
    const managers = await UserService.getManagers();
    res.json({ success: true, data: managers });
  } catch (err) { next(err); }
};

const updateRole = async (req, res, next) => {
  try {
    const user = await UserService.updateRole(req.params.id, req.body, req.user);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

const deactivate = async (req, res, next) => {
  try {
    const user = await UserService.deactivate(req.params.id, req.user);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

module.exports = { getUsers, getManagers, updateRole, deactivate };