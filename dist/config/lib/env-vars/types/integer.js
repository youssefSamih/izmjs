"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generic_1 = __importDefault(require("./generic"));
class IntegerField extends generic_1.default {
    setValue(value) {
        this.value = Number.isNaN(value) ? null : parseInt(value, 10);
        return this;
    }
}
exports.default = IntegerField;
//# sourceMappingURL=integer.js.map