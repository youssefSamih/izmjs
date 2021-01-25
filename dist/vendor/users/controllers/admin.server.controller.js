"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userByID = exports.list = exports.svg = exports.remove = exports.update = exports.picture = exports.read = exports.validateUser = void 0;
const path_1 = require("path");
const mongoose_1 = __importDefault(require("mongoose"));
const config = require('@config/index');
const User = mongoose_1.default.model('User');
const { vendor } = config.files.server.modules;
const errorHandler = require(path_1.resolve(`./${vendor}/core/controllers/errors.server.controller`));
const validateUser = async function validateUser(req, res, next) {
    const { entity } = req;
    entity.validations.set('validations', entity.validations.map((v) => v.type === 'admin' ? Object.assign(Object.assign({}, v), { validated: true }) : v));
    try {
        await entity.save();
    }
    catch (e) {
        return next(e);
    }
    return res.status(204).end();
};
exports.validateUser = validateUser;
const read = async function read(req, res) {
    res.json(req.model.toJSON({
        virtuals: true,
    }));
};
exports.read = read;
const picture = async function picture(req, res, next) {
    const { model } = req;
    const { picture: pic } = model;
    if (!pic) {
        return next();
    }
    return res.redirect(`${config.app.prefix}/files/${pic}/view?size=300x300`);
};
exports.picture = picture;
const update = async function update(req, res) {
    const user = req.model;
    user.name = Object.assign(Object.assign({}, user.name), req.body.name);
    if (Array.isArray(req.body.roles)) {
        user.roles = req.body.roles;
    }
    try {
        await user.save();
    }
    catch (e) {
        return res.status(400).send({
            message: errorHandler.getErrorMessage(e),
        });
    }
    return res.json(user.toJSON({
        virtuals: true,
    }));
};
exports.update = update;
const remove = async function remove(req, res) {
    const user = req.model;
    user.remove((err) => {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err),
            });
        }
        return res.status(204).end();
    });
};
exports.remove = remove;
const svg = ({ size = 46, color = '#d35400', fill = '#ffffff' }) => async function svg(req, res) {
    const { model } = req;
    const { name } = model;
    const { full } = name;
    const text = full
        .split(' ')
        .map((n) => n.charAt(0))
        .join('');
    res.set('Content-Type', 'image/svg+xml');
    return res.render(path_1.resolve(__dirname, '../views/profile-picture.server.view.swig'), {
        text,
        size,
        color,
        fill,
    });
};
exports.svg = svg;
const list = async function list(req, res, next) {
    const { $filter = '', $top: top, $skip: skip } = req.query;
    const private_attrs = config.app.profile.private_attrs || [];
    const findObj = $filter ? { $text: { $search: $filter } } : {};
    try {
        const json = await User.find(findObj, {
            score: { $meta: 'textScore' },
        })
            .select(private_attrs.map((attr) => `-${attr}`).join(' '))
            .sort({ score: { $meta: 'textScore' } }).paginate({ top, skip });
        json.value = json.value.map((u) => u.toJSON({ virtuals: true }));
        return res.json(json);
    }
    catch (e) {
        return next(e);
    }
};
exports.list = list;
const userByID = async function userByID(req, res, next, id) {
    const private_attrs = config.app.profile.private_attrs || [];
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        return res.status(400).send({
            message: req.t('USER_INVALID', {
                id,
            }),
        });
    }
    return User.findById(id, private_attrs.map((attr) => `-${attr}`).join(' ')).exec((err, user) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(404).json({
                message: req.t('USER_LOAD_FAILED', {
                    id,
                }),
            });
        }
        req.model = user;
        return next();
    });
};
exports.userByID = userByID;
//# sourceMappingURL=admin.server.controller.js.map