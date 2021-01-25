"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const debug_1 = __importDefault(require("debug"));
const pathToRegexp = require('path-to-regexp');
const debug = debug_1.default('modules:users:helpers:iam');
class Iam {
    constructor() {
        this.IamModel = mongoose_1.default.model('IAM');
        this.RoleModel = mongoose_1.default.model('Role');
    }
    async allow(resource, permission, iam, opts = {}) {
        const { title, module, groups, parents, description } = opts;
        const regex = pathToRegexp(resource).toString();
        const obj = {
            resource: regex.substr(1, regex.length - 3),
            permission,
            iam,
        };
        if (typeof opts.excluded === 'boolean') {
            obj.excluded = opts.excluded;
        }
        if (typeof opts.affectable === 'boolean') {
            obj.affectable = opts.affectable;
        }
        if (typeof opts.system === 'boolean') {
            obj.system = opts.system;
        }
        if (typeof title === 'string') {
            obj.title = title;
        }
        if (typeof description === 'string') {
            obj.description = description;
        }
        if (typeof module === 'string') {
            obj.module = module;
        }
        if (Array.isArray(groups) && groups.length > 0) {
            obj.groups = groups
                .filter((g) => Boolean(g) && typeof g === 'string')
                .map((g) => g.trim().toLowerCase().replace(/\s+/g, ' ').replace(/ /g, '-'));
            obj.groups = obj.groups.filter((g, index) => obj.groups.indexOf(g) === index);
        }
        let one;
        try {
            one = await this.IamModel.findOneAndUpdate({ iam }, obj, {
                upsert: true,
                setDefaultsOnInsert: true,
                new: true,
            });
        }
        catch (e) {
            debug('Database Error', e);
        }
        if (Array.isArray(parents)) {
            const { _id: id } = one;
            const list = parents
                .filter((g, index) => Boolean(g) && typeof g === 'string' && parents.indexOf(g) === index)
                .map((g) => this.IamModel.findOneAndUpdate({ iam: g }, {
                iam: g,
                $addToSet: {
                    children: id,
                },
            }, {
                upsert: true,
                setDefaultsOnInsert: true,
                new: true,
            }));
            try {
                await Promise.all(list);
            }
            catch (e) {
                debug('Database Error');
            }
        }
        return this;
    }
    async IAMsFromRoles(roles = []) {
        try {
            let iams = await this.RoleModel.getIAMs(roles);
            iams = iams.map((iam) => iam.toJSON({
                virtuals: true,
            }));
            return iams;
        }
        catch (e) {
            return [];
        }
    }
    async areAnyIamAllowed(iams = [], resource, permission) {
        try {
            const isYes = await this.IamModel.findOne({
                iam: {
                    $in: iams,
                },
                resource,
                permission,
            });
            return !!isYes;
        }
        catch (e) {
            return false;
        }
    }
    async areAnyIamIdAllowed(iamIDs = [], resource, permission) {
        try {
            const isYes = await this.IamModel.findOne({
                _id: {
                    $in: iamIDs,
                },
                resource,
                permission,
            });
            return !!isYes;
        }
        catch (e) {
            return false;
        }
    }
    async areAnyRoleAllowed(roles = [], resource, permission) {
        const iams = await this.IAMsFromRoles(roles);
        const isYes = await this.IamModel.findOne({
            _id: {
                $in: iams,
            },
            resource,
            permission,
        });
        return !!isYes;
    }
}
exports.default = Iam;
//# sourceMappingURL=iam.server.helper.js.map