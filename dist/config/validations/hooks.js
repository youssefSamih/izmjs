"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onLogin = exports.onSignup = exports.onInit = void 0;
const index_1 = __importDefault(require("@config/index"));
const utils = require('./utils');
const onInit = async (user) => {
    const vConfig = index_1.default.validations;
    const types = vConfig.types || [];
    types.forEach((t) => {
        const m = require(`./types/${t}`);
        const v = utils.getValidationObj(user, t);
        m.init(user, v);
    });
    user.markModified('validations');
    return user;
};
exports.onInit = onInit;
const onSignup = async (user, req) => {
    const vConfig = index_1.default.validations;
    const types = vConfig.types || [];
    types.forEach((t) => utils.tryNotify(user, t, req));
    user.markModified('validations');
    return user;
};
exports.onSignup = onSignup;
const onLogin = async () => { };
exports.onLogin = onLogin;
//# sourceMappingURL=hooks.js.map