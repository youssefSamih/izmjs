"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValid = exports.notify = exports.init = void 0;
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
    const tpl = path_1.default.resolve(__dirname, '..', 'templates/confirmation-email.swig');
    const baseURL = utils.getBaseURLFromRequest(req);
    const { _id: userId } = user;
    let url = baseURL + config.app.prefix;
    url += '/auth/confirm?type=email';
    url += `&uid=${userId}`;
    url += `&code=${validation.code}`;
    user.sendMail('Email validation', nunjucks_1.default.render(tpl, {
        name: user.name.full,
        url,
        app: config.app,
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
//# sourceMappingURL=email.js.map