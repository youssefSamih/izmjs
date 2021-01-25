"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.set = exports.getById = exports.updateOne = exports.removeOne = exports.getOne = exports.create = exports.list = exports.sanitizeQuery = void 0;
const mongoose_1 = require("mongoose");
const sanitizeQuery = (modelName) => {
    const Model = mongoose_1.model(modelName);
    return async function sanitizeQuery(req, _res, next) {
        const { $expand = '', $select = '' } = req.query;
        let { $filter } = req.query;
        if (typeof $filter === 'string') {
            try {
                $filter = JSON.parse($filter);
            }
            catch (e) {
                $filter = {};
            }
        }
        else if (!$filter || typeof $filter !== 'object') {
            $filter = {};
        }
        req.$query = Model.find($filter).select($select
            .split(',')
            .map((attr) => attr.trim())
            .filter(Boolean)
            .join(' '));
        $expand
            .split(',')
            .map((attr) => attr.trim())
            .filter(Boolean)
            .forEach((attr) => req.$query.populate(attr));
        next();
    };
};
exports.sanitizeQuery = sanitizeQuery;
const list = (modelName) => {
    const Model = mongoose_1.model(modelName);
    return async function list(req, res, next) {
        let { $query } = req;
        const { query } = req;
        const { $top: top = 10, $skip: skip = 0 } = query;
        if (!$query) {
            $query = Model.find({});
        }
        try {
            const result = await $query.paginate({ top, skip });
            return res.json(result);
        }
        catch (e) {
            return next(e);
        }
    };
};
exports.list = list;
const create = (modelName) => {
    const Model = mongoose_1.model(modelName);
    return async function create(req, res, next) {
        const { body } = req;
        const entity = new Model(body);
        try {
            const result = await entity.save({ new: true });
            return res.status(201).json(result);
        }
        catch (e) {
            return next(e);
        }
    };
};
exports.create = create;
const getOne = async function getOne(req, res) {
    const { entity } = req;
    return res.json(entity);
};
exports.getOne = getOne;
const removeOne = async function removeOne(req, res, next) {
    const { entity } = req;
    try {
        await entity.remove();
        return res.status(204).end();
    }
    catch (e) {
        return next(e);
    }
};
exports.removeOne = removeOne;
const updateOne = async function updateOne(req, res, next) {
    const { entity, body } = req;
    try {
        entity.set(body);
        const result = await entity.save({ new: true });
        return res.json(result);
    }
    catch (e) {
        return next(e);
    }
};
exports.updateOne = updateOne;
const getById = (modelName) => {
    const Model = mongoose_1.model(modelName);
    return async (req, res, next, id) => {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(400).send({
                message: req.t('INVALID_ENTITY_ID', {
                    id,
                    modelName,
                }),
            });
        }
        let entity;
        try {
            entity = await Model.findById(id);
        }
        catch (e) {
            return next(e);
        }
        if (!entity) {
            return res.status(404).send({
                message: req.t('ENTITY_NOT_FOUND', {
                    id,
                    modelName,
                }),
            });
        }
        req.entity = entity;
        return next();
    };
};
exports.getById = getById;
const set = (type = '$filter', payload = {}, isMerge = false) => {
    return function set(req, _res, next) {
        let { body } = req;
        let { $filter = {} } = req.query;
        switch (type) {
            case '$filter':
                if (typeof $filter === 'string') {
                    try {
                        $filter = JSON.parse($filter);
                    }
                    catch (e) {
                        $filter = payload;
                    }
                }
                else if (!$filter || typeof $filter !== 'object') {
                    $filter = payload;
                }
                if (isMerge === true) {
                    $filter = Object.assign($filter, payload);
                }
                else {
                    $filter = payload;
                }
                break;
            case 'body':
                if (!body || typeof body !== 'object') {
                    body = payload;
                }
                if (isMerge === true) {
                    body = Object.assign(body, payload);
                }
                else {
                    body = payload;
                }
                break;
            default:
                break;
        }
        return next();
    };
};
exports.set = set;
//# sourceMappingURL=rest.js.map