"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generic_1 = __importDefault(require("./generic"));
class ObjectField extends generic_1.default {
    setValue(value) {
        let json = {};
        if (typeof value === 'string') {
            try {
                json = JSON.parse(value);
            }
            catch (e) {
                json = {};
            }
        }
        this.value = json;
        return this;
    }
    toString() {
        if (typeof this.value === 'undefined' || this.value === null) {
            return undefined;
        }
        return JSON.stringify(this.value);
    }
}
exports.default = ObjectField;
//# sourceMappingURL=object.js.map