"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const { jwt: config } = require('@config/index');
const User = mongoose_1.model('User');
exports.default = (app) => {
    if (!config.enabled) {
        return false;
    }
    const { public: pub, private: pr } = config.key;
    app.use(async function onRequest(req, _res, next) {
        let decoded;
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return next();
        }
        const [type, token] = authHeader.split(' ');
        if (type !== 'Bearer' || !token) {
            return next();
        }
        try {
            decoded = jsonwebtoken_1.default.verify(token, pub || pr);
        }
        catch (e) {
            return next();
        }
        if (!decoded || !mongoose_1.Types.ObjectId.isValid(decoded.u)) {
            return next();
        }
        try {
            req.user = await User.findById(decoded.u);
        }
        catch (e) {
            return next(e);
        }
        return next();
    });
    return true;
};
//# sourceMappingURL=00-jwt.server.config.js.map