"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.reset = exports.validateResetToken = exports.forgot = void 0;
const path_1 = require("path");
const mongoose_1 = __importDefault(require("mongoose"));
const crypto_1 = __importDefault(require("crypto"));
const util_1 = require("util");
const nunjucks_1 = require("nunjucks");
const config = require('@config/index');
const User = mongoose_1.default.model('User');
const { vendor } = config.files.server.modules;
const forgot = async function forgot(req, res, next) {
    if (!req.body.username) {
        return res.status(422).send({
            message: req.t('USER_BLANK_USERNAME'),
        });
    }
    let user;
    try {
        user = await User.findOne({
            $or: [
                {
                    email: req.body.username.toLowerCase(),
                },
                {
                    username: req.body.username.toLowerCase(),
                },
            ],
        }, '-salt -password');
    }
    catch (e) {
        return next(e);
    }
    if (!user) {
        return res.status(400).send({
            message: req.t('USER_USERNAME_NOT_FOUND', {
                username: req.body.username,
            }),
        });
    }
    if (user.provider !== 'local') {
        return res.status(400).send({
            message: req.t('USER_NOT_LOCAL', user.toJSON()),
        });
    }
    const token = (await util_1.promisify(crypto_1.default.randomBytes)(20)).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    try {
        await user.save();
    }
    catch (e) {
        return next(e);
    }
    const render = util_1.promisify(res.render);
    try {
        const html = await render.bind(res)(path_1.resolve(`${vendor}/users/views/reset-password-email`), {
            user,
            app: config.app,
            url: nunjucks_1.renderString(config.links.resetPwd, {
                app: config.app,
                user,
                token,
            }),
        });
        user.sendMail('Password Reset', html);
    }
    catch (e) {
        return next(e);
    }
    return res.send({
        message: req.t('USER_EMAIL_SENT'),
    });
};
exports.forgot = forgot;
const validateResetToken = async function validateResetToken(req, res) {
    User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {
            $gt: Date.now(),
        },
    }, (err, user) => {
        if (err || !user) {
            return res.redirect('/password/reset/invalid');
        }
        return res.redirect(`/password/reset/${req.params.token}`);
    });
};
exports.validateResetToken = validateResetToken;
const reset = async function reset(req, res, next) {
    const passwordDetails = req.body;
    let user;
    try {
        user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: {
                $gt: Date.now(),
            },
        });
    }
    catch (e) {
        return next(e);
    }
    if (!user) {
        return res.status(400).send({
            message: req.t('USER_NOT_FOUND'),
        });
    }
    if (passwordDetails.newPassword !== passwordDetails.verifyPassword) {
        return res.status(400).send({
            message: req.t('USER_PASSWORD_NOT_MATCH'),
        });
    }
    user.password = passwordDetails.newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    try {
        await user.save();
    }
    catch (e) {
        return next(e);
    }
    req.login(user, (e) => {
        if (e) {
            return next(e);
        }
        user.password = undefined;
        user.salt = undefined;
        user.validations = undefined;
        return res.json(user.toJSON({
            virtuals: true,
        }));
    });
    return res.render(`${vendor}/users/templates/reset-password-confirm-email`, {
        name: user.name.full,
        appName: config.app.title,
    }, (_err, emailHTML) => {
        if (emailHTML) {
            user.sendMail(req.t('USER_PASSWORD_CHANGED'), emailHTML);
        }
    });
};
exports.reset = reset;
const changePassword = async function changePassword(req, res, next) {
    const passwordDetails = req.body;
    if (!req.user) {
        return res.status(401).send({
            message: req.t('USER_NOT_LOGGEDIN'),
        });
    }
    if (!passwordDetails.newPassword) {
        return res.status(422).send({
            message: req.t('USER_PASSWORD_NEW'),
        });
    }
    let user;
    const login = util_1.promisify(req.login).bind(req);
    try {
        user = await User.findById(req.user.id);
    }
    catch (e) {
        return next(e);
    }
    if (!user) {
        return res.status(400).send({
            message: req.t('USER_NOT_FOUND'),
        });
    }
    if (!user.authenticate(passwordDetails.currentPassword)) {
        return res.status(400).send({
            message: req.t('USER_PASSWORD_INCORRECT'),
        });
    }
    if (passwordDetails.newPassword !== passwordDetails.verifyPassword) {
        return res.status(400).send({
            message: req.t('USER_PASSWORD_NOT_MATCH'),
        });
    }
    user.password = passwordDetails.newPassword;
    try {
        await user.save();
        await login(user);
    }
    catch (e) {
        return next(e);
    }
    return res.send({
        message: req.t('USER_PASSWORD_CHANGED_SUCCESS'),
    });
};
exports.changePassword = changePassword;
//# sourceMappingURL=users.password.server.controller.js.map