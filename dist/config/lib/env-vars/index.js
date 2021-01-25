"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const util_1 = require("util");
const dotenv_1 = require("dotenv");
const ajv_1 = __importDefault(require("ajv"));
const debug_1 = __importDefault(require("debug"));
const field_1 = __importDefault(require("./field"));
const field_schema_json_1 = __importDefault(require("./field.schema.json"));
const debug = debug_1.default('app:helpers:utils:env');
const ajv = new ajv_1.default();
const validate = ajv.compile(field_schema_json_1.default);
const readFile$ = util_1.promisify(fs_1.readFile);
const writeFile$ = util_1.promisify(fs_1.writeFile);
const DEFAULT_ENV = process.env.NODE_ENV || 'development';
class Environment {
    constructor(name = DEFAULT_ENV) {
        this.name = name;
        this.variables = [];
        if (!process.env.NODE_ENV || name === process.env.NODE_ENV) {
            this.values = Object.assign({}, process.env);
        }
        else {
            this.values = {};
        }
    }
    static validate(env) {
        const isValid = validate(env);
        if (!isValid) {
            debug(`Env not valid:
OBJECT : ${JSON.stringify(env)}
ERRORS : ${JSON.stringify(validate.errors)}
`);
        }
        return isValid;
    }
    static getEnvFilePath(type = 'common') {
        return path_1.resolve(`.env/.${type}.env`);
    }
    async load() {
        let content = '';
        const { getEnvFilePath } = this.constructor;
        const commonPath = getEnvFilePath();
        const path = getEnvFilePath(this.name);
        try {
            content = await readFile$(commonPath, { encoding: 'utf8' });
            content += '\n';
        }
        catch (e) {
            debug(`Enable to load common env file file
PATH  : ${commonPath}
ERROR : ${JSON.stringify(e)}`);
        }
        try {
            content += await readFile$(path, { encoding: 'utf8' });
        }
        catch (e) {
            debug(`Enable to load env file
PATH  : ${path}
ERROR : ${JSON.stringify(e)}`);
        }
        try {
            return dotenv_1.parse(content);
        }
        catch (e) {
            return {};
        }
    }
    async save() {
        const { getEnvFilePath } = this.constructor;
        const path = getEnvFilePath(this.name);
        let values = {};
        let content = '';
        try {
            values = await this.load();
        }
        catch (e) {
            values = {};
        }
        Object.keys(values).forEach((key) => {
            const found = this.variables.find((v) => v.realKey() === key);
            if (found) {
                return;
            }
            if (!content) {
                content += '# User defined vars\n';
            }
            content += `${key}=${values[key]}\n`;
        });
        if (content) {
            content += '\n';
        }
        content += this.toString();
        try {
            await writeFile$(path, content, { encoding: 'utf8' });
        }
        catch (e) {
            return false;
        }
        return true;
    }
    set({ key, link, value, field, group, name = key, defaultValue, description = '', }, schema = { type: 'string' }, scope = 'general') {
        let variable = this.variables.find((v) => v.scope === scope && v.key === key);
        if (!variable) {
            variable = field_1.default.create({
                key,
                name,
                link,
                group,
                scope,
                field,
                description,
                defaultValue,
            }, schema);
            this.variables.push(variable);
        }
        const k = variable.realKey();
        if (typeof value !== 'undefined') {
            variable.setValue(value);
        }
        else if (typeof this.values[k] !== 'undefined') {
            variable.setValue(this.values[k], true);
        }
        return variable.getValue();
    }
    toString() {
        let content = '';
        const scopes = this.toJSON();
        scopes
            .map((scope) => {
            let { items } = scope;
            items = items.filter((item) => {
                const str = item.toString();
                return !!str && item.value !== item.defaultValue;
            });
            return Object.assign(Object.assign({}, scope), { items });
        })
            .filter((scope) => scope.items.length > 0)
            .forEach((scope, index) => {
            content += `${index > 0 ? '\n' : ''}# ${scope.name}\n`;
            scope.items.forEach((field) => {
                content += `${field.realKey()}=${field.toString()}\n`;
            });
        });
        return content;
    }
    toJSON() {
        const json = this.variables.reduce((prevValue, current) => {
            const groupBy = current.group || current.scope;
            const index = prevValue.findIndex((one) => one.name === groupBy);
            if (index < 0) {
                const found = {
                    name: groupBy,
                    items: [current],
                };
                return prevValue.concat(found);
            }
            prevValue[index].items.push(current);
            return prevValue;
        }, []);
        return json.sort((a, b) => {
            if (a.name === 'general') {
                return -1;
            }
            if (b.name === 'general') {
                return 1;
            }
            return a.name >= b.name ? 1 : -1;
        });
    }
    get(key, scope = 'general') {
        const found = this.variables.find((field) => field.key === key && field.scope === scope);
        if (found) {
            return found.getValue();
        }
        return undefined;
    }
}
exports.default = Environment;
//# sourceMappingURL=index.js.map