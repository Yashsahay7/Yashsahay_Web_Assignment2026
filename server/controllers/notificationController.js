const NotificationService = require('../services/notificationService');

const getNotifications = async (req, res, next) => {
  try {
    const { notifications, unreadCount } = await NotificationService.getForUser(req.user._id);
    res.json({ success: true, data: notifications, unreadCount });
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    await NotificationService.markOneRead(req.params.id, req.user._id);
    res.json({ success: true });
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    await NotificationService.markAllRead(req.user._id);
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = { getNotifications, markRead, markAllRead };