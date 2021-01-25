"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generic_1 = __importDefault(require("./generic"));
class NumberField extends generic_1.default {
    setValue(value) {
        this.value = Number.isNaN(value) ? null : +value;
        return this;
    }
}
exports.default = NumberField;
//# sourceMappingURL=number.js.map