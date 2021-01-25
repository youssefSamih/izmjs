"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ajv_1 = __importDefault(require("ajv"));
const chalk_1 = require("chalk");
const debug = require('debug')('app:helpers:utils:env:field');
const ajv = new ajv_1.default();
class GenericField {
    constructor(opts = {}, schema = { type: 'string' }) {
        Object.keys(opts).forEach((attr) => {
            this[attr] = opts[attr];
        });
        this.name = this.name || this.key;
        this.description = this.description || '';
        this.schema = schema;
        this.validator = ajv.compile(schema);
        if (typeof opts.defaultValue !== 'undefined') {
            this.setValue(this.defaultValue);
        }
    }
    realKey() {
        const { scope = 'general', key } = this;
        const s = scope.toUpperCase().replace(/[- *&?@$]/g, '_');
        return scope === 'general' ? key : `${s}_MODULE_${key}`;
    }
    validate(value) {
        const isValid = this.validator(value);
        if (!isValid) {
            debug(`Warning: Invalid field value
KEY         : ${this.key}
NAME        : ${this.name}
VALUE       : ${value}
SCOPE       : ${this.scope}
DESCRIPTION : ${this.description}
ERRORS      : ${JSON.stringify(this.validate.errors, null, '  ')}
`);
        }
        return isValid;
    }
    setValue(value, isForce = false) {
        if (typeof value === 'undefined') {
            this.value = this.defaultValue;
            return this;
        }
        const isValid = this.validate(value);
        if (!isValid && isForce !== true) {
            console.error(chalk_1.red(`"${this.key}" can not have the value "${value}"`));
            throw new Error(this.validator.errors);
        }
        this.value = value;
        return this;
    }
    getValue() {
        return this.value;
    }
    reset() {
        this.setValue(this.defaultValue);
        return this;
    }
    toJSON() {
        return {
            key: this.key,
            link: this.link,
            envVar: this.realKey(),
            name: this.name,
            value: this.getValue(),
            schema: this.schema,
            field: this.field,
            description: this.description,
            defaultValue: this.defaultValue,
        };
    }
    toString() {
        if (typeof this.value === 'undefined' || this.value === null) {
            return undefined;
        }
        return this.value.toString();
    }
}
exports.default = GenericField;
//# sourceMappingURL=generic.js.map