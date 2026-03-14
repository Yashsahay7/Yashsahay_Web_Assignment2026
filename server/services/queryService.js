const Query = require('../models/Query');
const User  = require('../models/User');
const NotificationService = require('./notificationService');

/**
 * Build a MongoDB filter based on the user's role.
 * - Admin    → sees everything
 * - Manager  → sees queries assigned to them OR created by them
 * - Member   → sees only queries they created or are assigned to
 */
const buildVisibilityFilter = (user) => {
  if (user.role === 'admin') return {};
  if (user.role === 'manager') {
    // Sees all queries in their domain + any query explicitly assigned to them (even outside domain)
    return { $or: [{ category: user.domain }, { assignedTo: user._id }] };
  }
  return { $or: [{ createdBy: user._id }, { assignedTo: user._id }] };
};

const assertCanAccess = (query, user) => {
  const isAdmin           = user.role === 'admin';
  const isManagerOfDomain = user.role === 'manager' && user.domain === query.category;
  const isCreator         = query.createdBy._id?.toString() === user._id.toString()
                         || query.createdBy.toString()      === user._id.toString();
  // assignedTo can be raw ObjectIds OR populated objects — handle both
  const isAssignee        = (query.assignedTo || []).some(a => {
    const id = a?._id ? a._id.toString() : a?.toString();
    return id === user._id.toString();
  });

  if (!isAdmin && !isManagerOfDomain && !isCreator && !isAssignee) {
    const err = new Error('You do not have access to this query.');
    err.status = 403;
    throw err;
  }
};

const assertCanManage = (query, user) => {
  const isAdmin           = user.role === 'admin';
  const isManagerOfDomain = user.role === 'manager' && user.domain === query.category;
  // A manager explicitly assigned to this query (even outside their domain) can manage it
  const isAssignedManager = user.role === 'manager' && (query.assignedTo || []).some(a => {
    const id = a?._id ? a._id.toString() : a?.toString();
    return id === user._id.toString();
  });

  if (!isAdmin && !isManagerOfDomain && !isAssignedManager) {
    const err = new Error('Only admins and assigned managers can update this query.');
    err.status = 403;
    throw err;
  }
};

// ─── READ ────────────────────────────────────────────────────

const getAll = async ({ user, status, priority, category, page = 1, limit = 15, search, view }) => {
  let filter = buildVisibilityFilter(user);

  // Manager tab segregation
  if (user.role === 'manager' && view === 'assigned') {
    // Show queries explicitly assigned to this manager OR auto-assigned via same domain/category
    filter = { $or: [{ assignedTo: user._id }, { category: user.domain }] };
  } else if (user.role === 'manager' && view === 'created') {
    filter = { createdBy: user._id };
  }

  if (status)   filter.status   = status;
  if (priority) filter.priority = priority;
  if (category && user.role === 'admin') filter.category = category;
  if (search) {
    filter.$or = [
      { title:       { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [queries, total] = await Promise.all([
    Query.find(filter)
      .populate('createdBy',  'name email avatar role')
      .populate('assignedTo', 'name email avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Query.countDocuments(filter),
  ]);

  return {
    queries,
    pagination: {
      total,
      page:       parseInt(page),
      limit:      parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};

const getById = async (queryId, user) => {
  const query = await Query.findById(queryId)
    .populate('createdBy',           'name email avatar role domain')
    .populate('assignedTo',          'name email avatar role domain')
    .populate('comments.author',     'name email avatar role')
    .populate('statusHistory.changedBy', 'name email');

  if (!query) {
    const err = new Error('Query not found.');
    err.status = 404;
    throw err;
  }

  assertCanAccess(query, user);

  if (user.role === 'member') {
    query.comments = query.comments.filter(c => !c.isInternal);
  }

  return query;
};

const getStats = async (user) => {
  const filter = buildVisibilityFilter(user);
  const [byStatus, byCategory, total] = await Promise.all([
    Query.aggregate([{ $match: filter }, { $group: { _id: '$status',   count: { $sum: 1 } } }]),
    Query.aggregate([{ $match: filter }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
    Query.countDocuments(filter),
  ]);
  return { byStatus, byCategory, total };
};

// ─── CREATE ──────────────────────────────────────────────────

const create = async ({ title, description, category, priority, files, createdBy }) => {
  const attachments = (files || []).map(f => ({
    filename:   f.originalname,
    storedName: f.filename,
    url:        `/uploads/${f.filename}`,
    mimetype:   f.mimetype,
    size:       f.size,
    uploadedBy: createdBy._id,
  }));

  const query = await Query.create({
    title,
    description,
    category,
    priority:      priority || 'medium',
    createdBy:     createdBy._id,
    attachments,
    assignedTo:    [],
    statusHistory: [{ status: 'open', changedBy: createdBy._id }],
  });

  // Auto-assign: find ALL active managers for this domain
  const domainManagers = await User.find({ role: 'manager', domain: category, isActive: true });

  if (domainManagers.length > 0) {
    query.assignedTo = domainManagers.map(m => m._id);
    await query.save();

    // Notify every assigned manager
    for (const manager of domainManagers) {
      await NotificationService.create({
        recipient: manager._id,
        type:      'query_assigned',
        title:     'New query assigned to you',
        message:   `"${title}" was automatically assigned to you as ${category} manager.`,
        query:     query._id,
      });
    }
  }

  // Notify all admins
  const admins = await User.find({ role: 'admin', isActive: true });
  for (const admin of admins) {
    if (admin._id.toString() === createdBy._id.toString()) continue;
    await NotificationService.create({
      recipient: admin._id,
      type:      'query_created',
      title:     'New query submitted',
      message:   `${createdBy.name} submitted: "${title}"`,
      query:     query._id,
    });
  }

  return Query.findById(query._id)
    .populate('createdBy',  'name email avatar')
    .populate('assignedTo', 'name email avatar');
};

// ─── UPDATE ──────────────────────────────────────────────────

const update = async (queryId, { status, priority, assignedTo, note }, user) => {
  const query = await Query.findById(queryId);
  if (!query) {
    const err = new Error('Query not found.');
    err.status = 404;
    throw err;
  }

  assertCanManage(query, user);

  if (status && status !== query.status) {
    query.statusHistory.push({ status, changedBy: user._id, note });
    query.status = status;

    // Notify creator
    if (query.createdBy.toString() !== user._id.toString()) {
      await NotificationService.create({
        recipient: query.createdBy,
        type:      'status_changed',
        title:     'Your query status was updated',
        message:   `"${query.title}" changed to ${status.replace('_', ' ')}.`,
        query:     query._id,
      });
    }
  }

  if (priority) query.priority = priority;

  // assignedTo is now an array — accept array of IDs from the client
  if (assignedTo !== undefined) {
    const oldAssignees = query.assignedTo.map(a => a.toString());
    const newAssignees = Array.isArray(assignedTo) ? assignedTo : (assignedTo ? [assignedTo] : []);
    query.assignedTo = newAssignees;

    // Notify newly added assignees
    for (const id of newAssignees) {
      if (!oldAssignees.includes(id.toString())) {
        await NotificationService.create({
          recipient: id,
          type:      'query_assigned',
          title:     'A query was assigned to you',
          message:   `"${query.title}" has been assigned to you.`,
          query:     query._id,
        });
      }
    }
  }

  await query.save();

  return Query.findById(query._id)
    .populate('createdBy',  'name email avatar role')
    .populate('assignedTo', 'name email avatar role');
};

// ─── COMMENT ─────────────────────────────────────────────────

const addComment = async (queryId, { text, isInternal }, user) => {
  if (!text?.trim()) {
    const err = new Error('Comment text is required.');
    err.status = 400;
    throw err;
  }

  const query = await Query.findById(queryId);
  if (!query) {
    const err = new Error('Query not found.');
    err.status = 404;
    throw err;
  }

  const internal = isInternal && user.role !== 'member';
  query.comments.push({ author: user._id, text: text.trim(), isInternal: !!internal });
  await query.save();

  const isCreator = query.createdBy.toString() === user._id.toString();

  // Notify creator
  if (!isCreator && !internal) {
    await NotificationService.create({
      recipient: query.createdBy,
      type:      'comment_added',
      title:     'New comment on your query',
      message:   `${user.name} commented on "${query.title}".`,
      query:     query._id,
    });
  }

  // Notify all assignees (except the commenter)
  if (!internal) {
    for (const assigneeId of query.assignedTo) {
      const idStr = assigneeId.toString();
      if (idStr !== user._id.toString() && idStr !== query.createdBy.toString()) {
        await NotificationService.create({
          recipient: assigneeId,
          type:      'comment_added',
          title:     'New comment on assigned query',
          message:   `${user.name} commented on "${query.title}".`,
          query:     query._id,
        });
      }
    }
  }

  const updated = await Query.findById(queryId).populate('comments.author', 'name email avatar role');
  return updated.comments[updated.comments.length - 1];
};

// ─── DELETE ──────────────────────────────────────────────────

const remove = async (queryId, user) => {
  if (user.role !== 'admin') {
    const err = new Error('Only admins can delete queries.');
    err.status = 403;
    throw err;
  }
  const query = await Query.findByIdAndDelete(queryId);
  if (!query) {
    const err = new Error('Query not found.');
    err.status = 404;
    throw err;
  }
};

module.exports = { getAll, getById, getStats, create, update, addComment, remove };
