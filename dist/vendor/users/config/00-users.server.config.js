"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = require("path");
const User = mongoose_1.default.model('User');
const config = require('@config/index');
exports.default = (app) => {
    passport_1.default.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport_1.default.deserializeUser((id, done) => {
        User.findOne({
            _id: id,
        })
            .select(config.app.profile.private_attrs.map((attr) => `-${attr}`).join(' '))
            .exec((err, user) => {
            return done(err, user);
        });
    });
    config.utils
        .getGlobbedPaths(path_1.join(__dirname, './strategies/**/*.js'))
        .forEach((strategy) => {
        require(path_1.resolve(strategy))(config);
    });
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
};
//# sourceMappingURL=00-users.server.config.js.map