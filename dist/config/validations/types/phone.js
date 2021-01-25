"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValid = exports.notify = exports.init = void 0;
const path_1 = __importDefault(require("path"));
const nunjucks_1 = __importDefault(require("nunjucks"));
const config = require('@config/index');
function randomNumber(length) {
    let res = '';
    const l = Math.isNaN(length) ? 4 : parseInt(length, 10);
    while (res.length < l) {
        res += Math.floor(Math.random() * 10);
    }
    return res;
}
const init = (_user, validation) => {
    const v = validation;
    v.code = randomNumber(config.validations.config.phone.code_length);
    v.created = Date.now();
    return v;
};
exports.init = init;
const notify = (user, validation) => {
    const v = validation;
    const tpl = path_1.default.resolve(__dirname, '..', 'templates/confirmation-phone.swig');
    user.sendSMS(nunjucks_1.default.render(tpl, {
        app: config.app,
        code: validation.code,
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
//# sourceMappingURL=phone.js.map