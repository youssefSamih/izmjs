"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const iam_server_helper_1 = __importDefault(require("../helpers/iam.server.helper"));
exports.default = (io) => {
    const iam = new iam_server_helper_1.default();
    io.use((s, next) => {
        const { request: req } = s;
        const roles = req.user && Array.isArray(req.user.roles) ? req.user.roles : ['guest'];
        iam
            .IAMsFromRoles(roles)
            .then((list) => {
            req.iams = list.map((item) => (Object.assign(Object.assign({}, item), { resource: new RegExp(item.resource, 'i') })));
            return next();
        })
            .catch(next);
    });
};
//# sourceMappingURL=user.server.socket.config.js.map