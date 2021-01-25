"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryNotify = exports.tryValidate = exports.getValidationObj = exports.unvalidate = exports.validate = exports.isValidated = void 0;
const vConfig = require('@config/index').validations;
const tConfig = vConfig.config;
class ValidationError {
    constructor(code, data) {
        this.code = code;
        this.data = data;
    }
}
const isValidated = (user) => {
    const types = vConfig.mondatory || [];
    const validations = user.validations || [];
    for (let index = 0; index < types.length; index += 1) {
        const t = validations.find((v) => v.type === types[index]);
        if (!t || !t.validated) {
            throw new ValidationError('VALIDATIONS!UNVALIDATED', {
                type: types[index],
            });
        }
    }
    return true;
};
exports.isValidated = isValidated;
const validate = async (user, type) => {
    const types = vConfig.mondatory || [];
    if (type === '*' || !type) {
        types.forEach((t) => {
            exports.validate(user, t);
        });
    }
    const v = exports.getValidationObj(user, type);
    if (!v) {
        throw new ValidationError('VALIDATIONS!UNKNOWN_TYPE');
    }
    v.validated = true;
    user.markModified('validations');
    return user;
};
exports.validate = validate;
const unvalidate = async (user, type) => {
    const v = exports.getValidationObj(user, type);
    if (!v) {
        throw new ValidationError('VALIDATIONS!UNKNOWN_TYPE');
    }
    v.validated = false;
    user.markModified('validations');
    return user;
};
exports.unvalidate = unvalidate;
const getValidationObj = (user, type) => {
    if (vConfig.types.lastIndexOf(type) < 0) {
        return null;
    }
    const validations = user.validations || [];
    let v = validations.find((v_) => v_.type === type);
    if (!v) {
        v = {
            type,
        };
        validations.push(v);
        return exports.getValidationObj(user, type);
    }
    return v;
};
exports.getValidationObj = getValidationObj;
const tryValidate = async (user, type, code) => {
    const c = tConfig[type];
    const v = exports.getValidationObj(user, type);
    if (!v) {
        throw new ValidationError('VALIDATIONS!UNKNOWN_TYPE', {
            type,
        });
    }
    if (v.validated) {
        throw new ValidationError('VALIDATIONS!ALREADY_VALIDATED', {
            type,
        });
    }
    if (c && c.max_tries && v.tries >= c.max_tries) {
        throw new ValidationError('VALIDATIONS!MAX_TRIES_EXCEEDED', {
            type,
        });
    }
    v.tries += 1;
    user.markModified('validations');
    const m = require(`./types/${type}`);
    const isValid = m.isValid(user, v, code);
    if (!isValid) {
        throw new ValidationError('VALIDATIONS!INVALID_CODE', {
            type,
            remaining: c.max_tries - v.tries,
        });
    }
    v.validated = isValid;
    return isValid;
};
exports.tryValidate = tryValidate;
const tryNotify = async (user, type, req) => {
    const c = tConfig[type];
    const v = exports.getValidationObj(user, type);
    if (!v) {
        throw new ValidationError('VALIDATIONS!UNKNOWN_TYPE');
    }
    const m = require(`./types/${type}`);
    if (c && c.max_resends && v.resends >= c.max_resends) {
        throw new ValidationError('VALIDATIONS!MAX_RESENDS_EXCEEDED');
    }
    await m.notify(user, v, req);
    v.resends += 1;
    user.markModified('validations');
    return true;
};
exports.tryNotify = tryNotify;
//# sourceMappingURL=utils.js.map