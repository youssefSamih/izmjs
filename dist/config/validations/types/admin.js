"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValid = exports.notify = exports.init = void 0;
const mongoose_1 = require("mongoose");
const nunjucks_1 = __importDefault(require("nunjucks"));
const path_1 = __importDefault(require("path"));
const generate_password_1 = __importDefault(require("generate-password"));
const config = require('@config/index');
const utils = require('@helpers/utils');
const init = (_user, validation) => {
    const v = validation;
    v.code = generate_password_1.default.generate({
        length: config.validations.config.email.code_length,
        numbers: true,
        symbols: false,
        uppercase: false,
        excludeSimilarCharacters: true,
    });
    v.created = Date.now();
    return v;
};
exports.init = init;
const notify = (user, validation, req) => {
    const v = validation;
    const tpl = path_1.default.resolve(__dirname, '..', 'templates/confirmation-admin.swig');
    const baseURL = utils.getBaseURLFromRequest(req);
    const { _id: userId } = user;
    let url = baseURL + config.app.prefix;
    url += '/auth/confirm?type=admin';
    url += `&uid=${userId}`;
    url += `&code=${validation.code}`;
    mongoose_1.model('User').find({ roles: 'admin' }).sendMail(`New account: ${user.name.full}`, nunjucks_1.default.render(tpl, {
        url,
        app: config.app,
        name: user.name.full,
    }));
    return v;
};
exports.notify = notify;
const isValid = (_user, validation, code) => {
    if (!validation || typeof validation !== 'object') {
        return false;
    }
    return validation.code === code;
};
exports.isValid = isValid;
//# sourceMappingURL=admin.js.map