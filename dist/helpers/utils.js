const Ajv = require('ajv');
const { model } = require('mongoose');
const debug = require('debug')('boilerplate:helpers:utils');
const { resolve } = require('path');
const { readFile } = require('fs');
const { promisify } = require('util');
const ajvErrors = require('ajv-errors');
const sockets = require('@config/lib/socket.io');
const roleCache = {};
let excludeCache;
const readFile$ = promisify(readFile);
exports.validate = (schema, type = 'body') => async function validateSchema(req, res, next) {
    const ajv = new Ajv({ allErrors: true, jsonPointers: true });
    ajvErrors(ajv);
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
exports.hasIAM = (iam) => async function hasIAM(req, res, next) {
    const IAM = model('IAM');
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
exports.getBaseURLFromRequest = (req) => {
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    return `${protocol}://${req.get('host')}`;
};
exports.createUser = async (credentials = {
    username: 'username',
    password: 'jsI$Aw3$0m3',
}, iams = ['users:auth:signin'], name = 'role-tests', opts = {}) => {
    const IAM = model('IAM');
    const User = model('User');
    const Role = model('Role');
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
exports.isExcluded = async ({ iam, parents = [] }) => {
    if (process.env.NODE_ENV === 'test') {
        return {
            found: false,
        };
    }
    if (!excludeCache) {
        let content = '';
        try {
            content = await readFile$(resolve('.api.exclude'), { encoding: 'utf8' });
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
exports.addIamToRoles = async (iamName, roles = ['guest', 'user'], tries = 100) => {
    const Role = model('Role');
    const Iam = model('IAM');
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
exports.getIO = () => sockets.io;
//# sourceMappingURL=utils.js.map