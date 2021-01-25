"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resend = exports.confirm = exports.me = exports.profilePictFilter = exports.uploadProfilePicture = exports.getProfilePicture = exports.update = void 0;
const lodash_1 = __importDefault(require("lodash"));
const path_1 = require("path");
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config = require('@config/index');
const validationModule = require('@config/validations');
const { vendor } = config.files.server.modules;
const errorHandler = require(path_1.resolve(`./${vendor}/core/controllers/errors.server.controller`));
const User = mongoose_1.default.model('User');
const update = async function update(req, res) {
    let { user } = req;
    User.sanitize(req.body);
    user.set(req.body);
    try {
        user = await user.save();
    }
    catch (err) {
        return res.status(400).send({
            message: errorHandler.getErrorMessage(err),
        });
    }
    return res.json(user.toJSON({
        virtuals: true,
    }));
};
exports.update = update;
const getProfilePicture = async function getProfilePicture(req, res) {
    res.redirect(req.user.profilePictureUrl);
};
exports.getProfilePicture = getProfilePicture;
const uploadProfilePicture = async function uploadProfilePicture(req, res, next) {
    const Grid = mongoose_1.default.model('Grid');
    const { file, user } = req;
    const { file: f } = file;
    const { _id: userId } = user;
    const { _id: fId } = f;
    try {
        let gridFile = await Grid.findOne({
            _id: fId,
        });
        gridFile.set('metadata', {
            owner: userId,
            type: 'profile',
        });
        gridFile = await gridFile.save();
        req.user.set('picture', gridFile);
        req.user = await req.user.save();
    }
    catch (e) {
        return next(e);
    }
    return res.json({
        ok: true,
    });
};
exports.uploadProfilePicture = uploadProfilePicture;
const profilePictFilter = async function profilePictFilter(req, file, cb) {
    if (config.app.profile.picture.accept.lastIndexOf(file.mimetype) < 0) {
        return cb(new Error(req.t('USER_PROFILE_PIC_INVALID')));
    }
    return cb(null, true);
};
exports.profilePictFilter = profilePictFilter;
const me = async function me(req, res) {
    let { $expand } = req.query;
    const { $select, $jwt } = req.query;
    const { iams = [] } = req;
    let result = req.user ? req.user.json() : null;
    if (!result) {
        return res.json(result);
    }
    const { _id: id } = result;
    if ($expand) {
        $expand = $expand.split(',').map((attr) => attr.trim());
        if ($expand.includes('iams')) {
            result.iams = iams.map((iam) => {
                const { resource, permission } = iam, toSend = __rest(iam, ["resource", "permission"]);
                return toSend;
            });
        }
    }
    if (!result.iams) {
        result.iams = iams.map((iam) => iam.iam);
    }
    if ($select) {
        result = lodash_1.default.pick(result, $select.split(','), 'id');
    }
    if (config.jwt.enabled && $jwt === 'true') {
        const { key, alg, expiresIn } = config.jwt;
        result.token = jsonwebtoken_1.default.sign({ u: id }, key.private, {
            algorithm: alg,
            expiresIn,
        });
    }
    return res.json(result);
};
exports.me = me;
const confirm = async function confirm(req, res) {
    let user;
    const { query } = req;
    if (!query.uid) {
        return res.status(404).send({
            message: req.t('USER_NOT_FOUND'),
        });
    }
    try {
        user = await User.findById(query.uid);
    }
    catch (e) {
        return res.status(404).send({
            message: req.t('USER_NOT_FOUND'),
        });
    }
    if (!user) {
        return res.status(404).send({
            message: req.t('USER_NOT_FOUND'),
        });
    }
    const { utils } = validationModule;
    try {
        await utils.tryValidate(user, query.type, query.code);
    }
    catch (e) {
        if (e.code === 'VALIDATIONS!INVALID_CODE') {
            await user.save();
        }
        return res.status(400).send({
            message: req.t(e.code, e.data),
        });
    }
    const baseURL = `${req.protocol}://${req.get('host')}`;
    user = await user.save();
    return res.format({
        'text/html': () => {
            res.render(`${vendor}/users/views/email-confirmed`, {
                app: {
                    name: config.app.title,
                    url: baseURL,
                },
                user,
            });
        },
        'application/json': () => {
            res.json({
                ok: true,
            });
        },
        default() {
            res.send('Email confirmed');
        },
    });
};
exports.confirm = confirm;
const resend = async function resend(req, res) {
    let user;
    const { query } = req;
    if (!query.uid) {
        return res.status(404).send({
            message: req.t('USER_NOT_FOUND'),
        });
    }
    try {
        user = await User.findById(query.uid);
    }
    catch (e) {
        return res.status(404).send({
            message: req.t('USER_NOT_FOUND'),
        });
    }
    const { utils } = validationModule;
    try {
        await utils.tryNotify(user, query.type, req);
    }
    catch (e) {
        return res.status(400).send({
            message: req.t(e.code, {
                type: query.type,
            }),
        });
    }
    user = await user.save();
    return res.json({
        ok: true,
    });
};
exports.resend = resend;
//# sourceMappingURL=users.profile.server.controller.js.map