"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = exports.create = exports.verifyIams = exports.verifyExisting = exports.listRoles = exports.get = exports.getById = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Role = mongoose_1.default.model('Role');
const IAM = mongoose_1.default.model('IAM');
const getById = async function getById(req, res, next, id) {
    let role;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        return res.status(400).json('Invalid ID');
    }
    try {
        role = await Role.findOne({ _id: id });
    }
    catch (e) {
        return next(e);
    }
    if (role === null)
        return res.status(404).json('not found');
    req.role = role;
    return next();
};
exports.getById = getById;
const get = async function get(req, res) {
    const { role } = req;
    if (role === undefined)
        return res.status(404).json('not found');
    return res.status(200).json(role);
};
exports.get = get;
const listRoles = async function listRoles(_req, res, next) {
    let roles = [];
    try {
        roles = await Role.find({}, 'name');
    }
    catch (e) {
        return next(e);
    }
    const count = roles.length;
    roles = roles.slice(0, 10);
    return res.status(200).json({
        values: roles,
        count,
        top: 10,
        skip: 0,
    });
};
exports.listRoles = listRoles;
const verifyExisting = async function verifyExisting(req, res, next) {
    const { name } = req.body;
    let exists = [];
    try {
        exists = await Role.find({ name });
    }
    catch (e) {
        return next(e);
    }
    if (exists.length !== 0) {
        return res.status(400).json({
            message: req.t('ROLE_ALREADY_EXISTS'),
        });
    }
    return next();
};
exports.verifyExisting = verifyExisting;
const verifyIams = async function verifyIAMs(req, _res, next) {
    const { iams: permissions } = req.body;
    if (permissions === undefined) {
        return next();
    }
    let iams = [];
    iams = permissions.filter((el) => mongoose_1.default.Types.ObjectId.isValid(el));
    try {
        iams = await IAM.find({
            _id: {
                $in: iams,
            },
            affectable: true,
        });
    }
    catch (e) {
        return next(e);
    }
    if (iams.length < 0)
        return next();
    iams = iams.map((el) => el.id);
    req.roleIams = iams;
    return next();
};
exports.verifyIams = verifyIams;
const create = async function create(req, res, next) {
    const { roleIams, body } = req;
    const { name, title, description } = body;
    let createdRole;
    try {
        createdRole = new Role({
            name,
            title,
            description,
            roleIams,
        });
        createdRole = await createdRole.save({ new: true });
    }
    catch (e) {
        return next(e);
    }
    return res.status(200).json(createdRole);
};
exports.create = create;
const update = async function update(req, res, next) {
    const { roleIams, body } = req;
    const { title, description, name } = body;
    let { role } = req;
    if (name !== undefined)
        role.name = name;
    if (title !== undefined)
        role.title = title;
    if (description !== undefined)
        role.description = description;
    if (roleIams !== undefined)
        role.iams = roleIams;
    try {
        role = await role.save({ new: true });
    }
    catch (e) {
        return next(e);
    }
    return res.status(200).json(role);
};
exports.update = update;
//# sourceMappingURL=role.server.controller.js.map