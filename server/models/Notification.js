const mongoose = require('mongoose');

// Notifications are created server-side whenever key events happen:
// - A query is assigned to you
// - Someone comments on your query
// - Status of your query changes
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['query_assigned', 'comment_added', 'status_changed', 'query_created'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  query: { type: mongoose.Schema.Types.ObjectId, ref: 'Query', default: null },
  read: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);