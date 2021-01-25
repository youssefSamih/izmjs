"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default('modules:{{{lowercase name}}}');
module.exports = async () => {
    debug('Module "{{{lowercase name}}}" bootstraped');
};
//# sourceMappingURL=boot.server.bootstrap.js.map