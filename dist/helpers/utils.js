"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.addIamToRoles = exports.isExcluded = exports.createUser = exports.getBaseURLFromRequest = exports.hasIAM = exports.validate = void 0;
const ajv_1 = __importDefault(require("ajv"));
const mongoose_1 = require("mongoose");
const debug_1 = __importDefault(require("debug"));
const path_1 = require("path");
const fs_1 = require("fs");
const util_1 = require("util");
const ajv_errors_1 = __importDefault(require("ajv-errors"));
const socket_io_1 = __importDefault(require("@config/lib/socket.io"));
const debug = debug_1.default('boilerplate:helpers:utils');
const roleCache = {};
let excludeCache;
const readFile$ = util_1.promisify(fs_1.readFile);
const validate = (schema, type = 'body') => async function validateSchema(req, res, next) {
    const ajv = new ajv_1.default({ allErrors: true, jsonPointers: true });
    ajv_errors_1.default(ajv);
    const validate = ajv.compile(schema);
    let obj;
    switch (type) {
        case 'params':
            obj = req.query;
            break;
        default:
            obj = req.body;
            break;
    }
    if (validate(obj)) {
        return next();
    }
    return res.status(400).json({
        success: false,
        result: validate.errors.map((err) => ({
            message: req.t(err.message),
            data: err.params,
        })),
    });
};
exports.validate = validate;
const hasIAM = (iam) => async function hasIAM(req, res, next) {
    const IAM = mongoose_1.model('IAM');
    const { iams } = req;
    let count;
    try {
        count = await IAM.countDocuments({ iam });
    }
    catch (e) {
        return next(e);
    }
    if (count <= 0)
        return res.status(404).json({ message: `Permission(IAM) ${iam} not found` });
    if (iams.find((el) => el.iam === iam) === undefined) {
        return res.status(403).json({ message: `You don't have permission ${iam} to continue` });
    }
    return next(undefined);
};
exports.hasIAM = hasIAM;
const getBaseURLFromRequest = (req) => {
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    return `${protocol}://${req.get('host')}`;
};
exports.getBaseURLFromRequest = getBaseURLFromRequest;
const createUser = async (credentials = {
    username: 'username',
    password: 'jsI$Aw3$0m3',
}, iams = ['users:auth:signin'], name = 'role-tests', opts = {}) => {
    const IAM = mongoose_1.model('IAM');
    const User = mongoose_1.model('User');
    const Role = mongoose_1.model('Role');
    const list = await IAM.find({
        iam: {
            $in: iams,
        },
    });
    if (roleCache[name] && (!opts || opts.rmRole !== false)) {
        await roleCache[name].remove();
    }
    try {
        roleCache[name] = await new Role({
            name,
            iams: list,
        }).save({ new: true });
    }
    catch (e) {
        debug(e);
    }
    const user = await new User({
        name: {
            first: 'Full',
            last: 'Name',
        },
        email: `${credentials.username}@example.com`,
        username: credentials.username,
        password: credentials.password,
        provider: 'local',
        roles: [name],
        validations: [
            {
                type: 'email',
                validated: true,
            },
        ],
    }).save({ new: true });
    return user;
};
exports.createUser = createUser;
const isExcluded = async ({ iam, parents = [] }) => {
    if (process.env.NODE_ENV === 'test') {
        return {
            found: false,
        };
    }
    if (!excludeCache) {
        let content = '';
        try {
            content = await readFile$(path_1.resolve('.api.exclude'), { encoding: 'utf8' });
        }
        catch (e) {
        }
        excludeCache = content
            .split('\n')
            .map((one) => one.trim())
            .filter((one) => Boolean(one) && !one.startsWith('#'));
    }
    let found = excludeCache.includes(iam);
    if (found) {
        return {
            found: true,
            reason: 'iam',
            data: iam,
        };
    }
    found = excludeCache.find((one) => parents.includes(one));
    if (found) {
        return {
            found: true,
            reason: 'parent',
            data: found,
        };
    }
    return {
        found: false,
    };
};
exports.isExcluded = isExcluded;
const addIamToRoles = async (iamName, roles = ['guest', 'user'], tries = 100) => {
    const Role = mongoose_1.model('Role');
    const Iam = mongoose_1.model('IAM');
    let iam = await Iam.findOne({ iam: iamName });
    let counter = tries;
    const interval = setInterval(async () => {
        if (iam) {
            const { _id: id } = iam;
            roles.map(async (r) => {
                try {
                    await Role.findOneAndUpdate({
                        name: r,
                    }, {
                        $addToSet: {
                            iams: id,
                        },
                    });
                }
                catch (e) {
                }
            });
        }
        if (iam || counter === 0) {
            clearInterval(interval);
            return;
        }
        iam = await Iam.findOne({ iam: iamName });
        counter -= 1;
    }, 100);
};
exports.addIamToRoles = addIamToRoles;
const getIO = () => socket_io_1.default.io;
exports.getIO = getIO;
//# sourceMappingURL=utils.js.map