const QueryService = require('../services/queryService');

const getQueries = async (req, res, next) => {
  try {
    const result = await QueryService.getAll({ user: req.user, ...req.query });
    res.json({ success: true, data: result.queries, pagination: result.pagination });
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const data = await QueryService.getStats(req.user);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getQuery = async (req, res, next) => {
  try {
    const query = await QueryService.getById(req.params.id, req.user);
    res.json({ success: true, data: query });
  } catch (err) { next(err); }
};

const createQuery = async (req, res, next) => {
  try {
    const query = await QueryService.create({
      ...req.body,
      files:     req.files,
      createdBy: req.user,
    });
    res.status(201).json({ success: true, data: query });
  } catch (err) { next(err); }
};

const updateQuery = async (req, res, next) => {
  try {
    const query = await QueryService.update(req.params.id, req.body, req.user);
    res.json({ success: true, data: query });
  } catch (err) { next(err); }
};

const addComment = async (req, res, next) => {
  try {
    const comment = await QueryService.addComment(req.params.id, req.body, req.user);
    res.status(201).json({ success: true, data: comment });
  } catch (err) { next(err); }
};

const deleteQuery = async (req, res, next) => {
  try {
    await QueryService.remove(req.params.id, req.user);
    res.json({ success: true, message: 'Query deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getQueries, getQuery, createQuery, updateQuery, addComment, deleteQuery, getStats };