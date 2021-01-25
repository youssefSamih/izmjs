"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({
    path: './.env/.common.env',
});
const env = process.env.NODE_ENV || 'development';
dotenv_1.default.config({
    path: `./.env/.${env}.env`,
});
require("module-alias/register");
//# sourceMappingURL=polyfill.js.map