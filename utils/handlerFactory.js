// Generic handler factory to create CRUD handlers with pagination, filtering, sorting, selection
// Uses ApiUtils to parse request query into options
const mongoose = require('mongoose');
const ApiError = require('./ApiError');
const ApiUtils = require('./ApiUtils');

exports.list = function (Model, options = {}) {
  const { populate, filterMap = {}, defaultSort = { createdAt: -1 }, maxLimit = 100, baseFilter } = options;
  return async (req, res, next) => {
    try {
      const api = new ApiUtils(req);
      const { page, limit, select, sort, filter } = api.getOptions({ filterMap, baseFilter, defaultSort, maxLimit });

      const total = await Model.countDocuments(filter);
      const q = Model.find(filter)
        .skip((page - 1) * limit)
        .limit(limit);

      if (sort) q.sort(sort);
      if (select) q.select(select.split(',').join(' '));
      if (populate) q.populate(populate);

      const docs = await q.exec();
      return res.json({ page, limit, total, pages: Math.ceil(total / limit), results: docs });
    } catch (err) {
      return next(err);
    }
  };
};

exports.getOne = function (Model, options = {}) {
  const { populate, select } = options;
  return async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return next(ApiError.badRequest('Invalid book id'));
      }
      const api = new ApiUtils(req);
      const opts = api.getOptions();
      const sel = select || opts.select || '';
      const doc = await Model.findById(req.params.id).select(sel).populate(populate || '').exec();
      if (!doc) return next(ApiError.notFound('Not found'));
      return res.json({ data: doc });
    } catch (err) {
      return next(err);
    }
  };
};

exports.createOne = function (Model, options = {}) {
  const { populate } = options;
  return async (req, res, next) => {
    try {
      const doc = new Model(req.body);
      await doc.save();
      if (populate) await doc.populate(populate);
      return res.status(201).json(doc);
    } catch (err) {
      return next(err);
    }
  };
};

exports.updateOne = function (Model, options = {}) {
  const { populate } = options;
  return async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return next(ApiError.badRequest('Invalid book id'));
      }
      let doc = await Model.findById(req.params.id);
      if (!doc) return next(ApiError.notFound('Not found'));
      Object.assign(doc, req.body);
      await doc.save();
      if (populate) await doc.populate(populate);
      return res.json(doc);
    } catch (err) {
      return next(err);
    }
  };
};

exports.deleteOne = function (Model, options = {}) {
  return async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return next(ApiError.badRequest('Invalid book id'));
      }
      const doc = await Model.findById(req.params.id);
      if (!doc) return next(ApiError.notFound('Not found'));
      await doc.deleteOne();
      return res.json({ message: 'Deleted', data: doc });
    } catch (err) {
      return next(err);
    }
  };
};
