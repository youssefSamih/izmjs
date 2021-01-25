"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userByID = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User = mongoose_1.default.model('User');
const userByID = async function userByID(req, res, next, id) {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        return res.status(400).send({
            message: req.t('USER_INVALID', {
                id,
            }),
        });
    }
    return User.findOne({
        _id: id,
    }).exec((err, user) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return next(new Error(req.t('USER_LOAD_FAILED', {
                id,
            })));
        }
        req.profile = user;
        return next();
    });
};
exports.userByID = userByID;
//# sourceMappingURL=users.authorization.server.controller.js.map