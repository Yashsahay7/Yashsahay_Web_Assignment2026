const mongoose = require('mongoose');

// Sub-schema for comments/discussion
const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    // Internal note visible only to managers/admins
    isInternal: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Sub-schema for file attachments
const attachmentSchema = new mongoose.Schema({
  filename: { type: String, required: true },    // Original filename shown to user
  storedName: { type: String, required: true },  // UUID filename on disk
  url: { type: String, required: true },         // Full URL to access the file
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },         // bytes
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  uploadedAt: { type: Date, default: Date.now },
});

const querySchema = new mongoose.Schema(
  {
    // Core fields
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },

    // Category maps to E-Cell initiatives/domains
    category: {
      type: String,
      enum: ['tech', 'marketing', 'events', 'partnerships', 'media', 'operations', 'general'],
      required: [true, 'Category is required'],
    },

    // Workflow status
    status: {
      type: String,
      enum: ['open', 'in_progress', 'pending_info', 'resolved', 'closed'],
      default: 'open',
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },

    // People
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Array — query can be assigned to multiple managers of the same domain
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],

    // Discussion thread
    comments: [commentSchema],

    // File attachments
    attachments: [attachmentSchema],

    // Track status changes for history
    statusHistory: [
      {
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],

    // Auto-close date
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for efficient querying
querySchema.index({ status: 1, category: 1 });
querySchema.index({ createdBy: 1 });
querySchema.index({ assignedTo: 1 });
querySchema.index({ createdAt: -1 });

// Virtual for comment count
querySchema.virtual('commentCount').get(function () {
  return this.comments.length;
});

// When status becomes resolved, set resolvedAt
querySchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Query', querySchema);