"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeOAuthProvider = exports.saveOAuthUserProfile = exports.oauthCallback = exports.oauthCall = exports.signout = exports.signin = exports.signup = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const passport_1 = __importDefault(require("passport"));
const User = mongoose_1.default.model('User');
const validationsHelper = require('@config/validations');
const errorHandler = require('@vendor/core/controllers/errors.server.controller');
const config = require('@config/index');
const noReturnUrls = ['/authentication/signin', '/authentication/signup'];
const signup = async function signup(req, res, next) {
    const b = User.sanitize(req.body);
    const user = new User(b);
    const { hooks } = validationsHelper;
    await hooks.onInit(user);
    user.provider = 'local';
    try {
        await user.save();
        hooks.onSignup(user, req);
        await user.save();
    }
    catch (err) {
        switch (true) {
            case err.code === 11000:
                return res.status(400).json({
                    message: req.t('USER_ALREADY_EXISTS'),
                });
            case err.name === 'ValidationError':
                return res.status(400).json({
                    message: err.message,
                });
            default:
                return next(err);
        }
    }
    req.user = user;
    return next();
};
exports.signup = signup;
const signin = async function signin(req, res, next) {
    passport_1.default.authenticate('local', (err, user) => {
        if (err || !user) {
            return res.status(401).json({
                ok: false,
                message: req.t('WRONG_CREDENTIALS'),
            });
        }
        const { utils, hooks } = validationsHelper;
        try {
            utils.isValidated(user);
        }
        catch (err_) {
            return res.status(401).json({
                message: req.t(err_.code, err_.data),
                ok: false,
            });
        }
        return req.login(user, async (err_) => {
            if (err_) {
                return res.status(400).send(err_);
            }
            await hooks.onLogin(req, user);
            return next(null);
        });
    })(req, res, next);
};
exports.signin = signin;
const signout = async function signout(req, res) {
    req.logout();
    res.redirect(config.app.pages.login || '/');
};
exports.signout = signout;
const oauthCall = (strategy, scope) => async function oauthCall(req, res, next) {
    if (noReturnUrls.indexOf(req.query.redirect_to) === -1) {
        req.session.redirect_to = req.query.redirect_to;
    }
    passport_1.default.authenticate(strategy, scope)(req, res, next);
};
exports.oauthCall = oauthCall;
const oauthCallback = (strategy) => async function oauthCall(req, res, next) {
    const sessionRedirectURL = req.session.redirect_to;
    delete req.session.redirect_to;
    passport_1.default.authenticate(strategy, (err, user, redirectURL) => {
        if (err) {
            return res.redirect(`/authentication/signin?err=${encodeURIComponent(errorHandler.getErrorMessage(err))}`);
        }
        if (!user) {
            return res.redirect('/authentication/signin');
        }
        return req.login(user, (err_) => {
            if (err_) {
                return res.redirect('/authentication/signin');
            }
            return res.redirect(redirectURL || sessionRedirectURL || '/');
        });
    })(req, res, next);
};
exports.oauthCallback = oauthCallback;
const saveOAuthUserProfile = (req, providerUserProfile, done) => {
    if (!req.user) {
        const smpif = `providerData.${providerUserProfile.providerIdentifierField}`;
        const sapif = `additionalProvidersData.${providerUserProfile.provider}.${providerUserProfile.providerIdentifierField}`;
        const msq = {};
        msq.provider = providerUserProfile.provider;
        msq[smpif] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];
        const apsq = {};
        apsq[sapif] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];
        const searchQuery = {
            $or: [msq, apsq],
        };
        User.findOne(searchQuery, (err, user) => {
            if (err) {
                return done(err);
            }
            if (!user) {
                const possibleUsername = providerUserProfile.username ||
                    (providerUserProfile.email ? providerUserProfile.email.split('@')[0] : '');
                return User.findUniqueUsername(possibleUsername, null, () => {
                    const userTmp = new User({
                        name: {
                            first: providerUserProfile.firstName,
                            last: providerUserProfile.lastName,
                        },
                        email: providerUserProfile.email,
                        profilePictureUrl: providerUserProfile.profilePictureUrl,
                        provider: providerUserProfile.provider,
                        providerData: providerUserProfile.providerData,
                    });
                    userTmp.save((err_) => done(err_, userTmp));
                });
            }
            return done(err, user);
        });
    }
    else {
        const userTmp = req.user;
        if (userTmp.provider !== providerUserProfile.provider &&
            (!userTmp.additionalProvidersData ||
                !userTmp.additionalProvidersData[providerUserProfile.provider])) {
            if (!userTmp.additionalProvidersData) {
                userTmp.additionalProvidersData = {};
            }
            userTmp.additionalProvidersData[providerUserProfile.provider] =
                providerUserProfile.providerData;
            userTmp.markModified('additionalProvidersData');
            userTmp.save((err) => done(err, userTmp, '/settings/accounts'));
        }
        else {
            return done(new Error(req.t('USER_PROVIDER_ALREADY_CONNECTED')), req.user);
        }
    }
    return null;
};
exports.saveOAuthUserProfile = saveOAuthUserProfile;
const removeOAuthProvider = async function removeOAuthProvider(req, res) {
    const { user } = req;
    const { provider } = req.query;
    if (!user) {
        return res.status(401).json({
            message: req.t('USER_NOT_LOGGEDIN'),
        });
    }
    if (!provider) {
        return res.status(400).send();
    }
    if (user.additionalProvidersData[provider]) {
        delete user.additionalProvidersData[provider];
        user.markModified('additionalProvidersData');
    }
    return user.save((err) => {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err),
            });
        }
        return req.login(user, (err_) => {
            if (err_) {
                return res.status(400).send(err_);
            }
            return res.json(user.toJSON({
                virtuals: true,
            }));
        });
    });
};
exports.removeOAuthProvider = removeOAuthProvider;
//# sourceMappingURL=users.authentication.server.controller.js.map