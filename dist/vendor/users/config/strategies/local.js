"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = __importDefault(require("passport-local"));
const mongoose_1 = __importDefault(require("mongoose"));
const LocalStrategy = passport_local_1.default.Strategy;
const User = mongoose_1.default.model('User');
exports.default = () => {
    passport_1.default.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
    }, (username, password, done) => {
        User.findOne({
            $or: [
                {
                    username: username.toLowerCase(),
                },
                {
                    email: username.toLowerCase(),
                },
            ],
        }, (err, user) => {
            if (err) {
                return done(err);
            }
            if (!user || !user.authenticate(password)) {
                return done(null, false);
            }
            return done(null, user);
        });
    }));
};
//# sourceMappingURL=local.js.map