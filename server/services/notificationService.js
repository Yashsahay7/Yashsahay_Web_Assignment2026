const Notification = require('../models/Notification');

/**
 * NotificationService
 * Responsible for all notification creation logic.
 * Called by other services — never directly by controllers.
 * Failures are swallowed so they never break the main request flow.
 */

const create = async ({ recipient, type, title, message, query }) => {
  try {
    if (!recipient) return;
    await Notification.create({ recipient, type, title, message, query: query || null });
  } catch (err) {
    console.error('[NotificationService] Failed to create notification:', err.message);
  }
};

const getForUser = async (userId) => {
  const notifications = await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('query', 'title');
  const unreadCount = await Notification.countDocuments({ recipient: userId, read: false });
  return { notifications, unreadCount };
};

const markOneRead = async (notificationId, userId) => {
  await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { read: true }
  );
};

const markAllRead = async (userId) => {
  await Notification.updateMany({ recipient: userId, read: false }, { read: true });
};

module.exports = { create, getForUser, markOneRead, markAllRead };