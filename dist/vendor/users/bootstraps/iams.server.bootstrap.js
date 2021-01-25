"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const mongoose_1 = require("mongoose");
const util_1 = require("util");
const utils_1 = require("@helpers/utils");
const debug = require('debug')('modules:users:bootstraps');
const roles = require('@config/lib/acl');
const config = require('@config/index');
const Iam = require('../helpers/iam.server.helper');
async function seedIAMs() {
    debug('seeding IAMs');
    const iam = new Iam();
    const regex = /^[a-zA-Z0-9]*\/([^/]*)/;
    const all$ = config.files.server.iam.map(async (iamFilePath) => {
        const m = require(path_1.resolve(iamFilePath));
        const exec = regex.exec(iamFilePath);
        if (Array.isArray(m.routes)) {
            const routes$ = m.routes.map(async (route) => {
                const methods$ = Object.keys(route.methods).map(async (k) => {
                    const method = route.methods[k];
                    const { found } = await utils_1.isExcluded(method);
                    await iam.allow((m.is_global === true ? '' : config.app.prefix) + m.prefix + route.path, k, method.iam, Object.assign(Object.assign({}, route.methods[k]), { module: exec ? exec[1] : '', excluded: found }));
                });
                await Promise.all(methods$);
                return true;
            });
            await Promise.all(routes$);
        }
        return true;
    });
    await Promise.all(all$);
}
async function seedRoles() {
    const IamModel = mongoose_1.model('IAM');
    const RoleModel = mongoose_1.model('Role');
    const cache = {};
    const iams = []
        .concat(...roles.map((r) => r.iams))
        .filter((r, pos, arr) => arr.indexOf(r) === pos);
    try {
        const list = await IamModel.find({
            iam: {
                $in: iams,
            },
        });
        list.forEach((entity) => {
            cache[entity.iam] = entity;
        });
    }
    catch (e) {
        debug('DB Error while listing IAMs', e);
    }
    const promises = roles.map(async (role) => {
        let list = Array.isArray(role.iams) ? role.iams : [];
        list = role.iams.map((iam) => cache[iam]).filter(Boolean);
        try {
            let r = await RoleModel.findOne({ name: role.name });
            if (!r) {
                r = new RoleModel(Object.assign(Object.assign({}, role), { iams: list }));
            }
            else {
                list.forEach((iam) => {
                    const found = r.iams.find((item) => item.toString() === iam.id);
                    if (!found) {
                        r.iams.push(iam.id);
                    }
                });
            }
            return await r.save();
        }
        catch (e) {
            debug('DB Error while getting the role', e);
        }
        return false;
    });
    const iamsFiles = config.files.server.iams.map(async (iamFilePath) => {
        let m;
        try {
            m = require(path_1.resolve(iamFilePath));
        }
        catch (e) {
            debug('Iam file is invalid', iamFilePath);
        }
        if (Array.isArray(m)) {
            await Promise.all(m.map(async (one) => {
                try {
                    await IamModel.findOneAndUpdate({
                        iam: one.iam,
                    }, one, {
                        upsert: true,
                    });
                }
                catch (e) {
                    debug('Enable to save IAMs from file', iamFilePath);
                }
            }));
        }
        return true;
    });
    await Promise.all(iamsFiles);
    await Promise.all(promises);
    return true;
}
exports.default = async () => {
    const IamModel = mongoose_1.model('IAM');
    const RoleModel = mongoose_1.model('Role');
    const createIAMIndices$ = util_1.promisify(IamModel.createIndexes).bind(IamModel);
    const createRolesIndices$ = util_1.promisify(RoleModel.createIndexes).bind(RoleModel);
    await createIAMIndices$();
    await createRolesIndices$();
    await seedIAMs();
    await seedRoles();
};
//# sourceMappingURL=iams.server.bootstrap.js.map