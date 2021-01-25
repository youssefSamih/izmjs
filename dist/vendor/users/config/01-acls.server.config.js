"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const path_1 = require("path");
const express_1 = __importDefault(require("express"));
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default('vendor:users:config:acls');
const { isExcluded } = require('@helpers/utils');
const Iam = require('../helpers/iam.server.helper');
function hasIam(iams, isAll = true) {
    return (...iamNames) => {
        const found = iams.filter(({ iam }) => iamNames.includes(iam));
        return isAll === true ? found.length === iamNames.length : found.length > 0;
    };
}
exports.default = (app, _db, config) => {
    const regex = /^([a-zA-Z0-9]*)\/([^/]*)/;
    const iam = new Iam();
    app.use(async (req, _res, next) => {
        const { iams } = req;
        let allIAMs;
        const roles = req.user && Array.isArray(req.user.roles) ? req.user.roles : ['guest'];
        try {
            allIAMs = await iam.IAMsFromRoles(roles);
            req.iams = allIAMs.map((item) => (Object.assign(Object.assign({}, item), { resource: new RegExp(item.resource, 'i') })));
        }
        catch (e) {
            return next(e);
        }
        if (Array.isArray(iams)) {
            req.iams = req.iams.filter((one) => iams.includes(one.iam));
            const children = req.iams.reduce((prev, cur, _index, arr) => {
                const result = [...prev];
                const { children: ch = [] } = cur;
                ch.forEach((one) => {
                    const str = one.toString();
                    if (!result.includes(str) && !arr.find(({ id }) => str === id)) {
                        result.push(str);
                    }
                });
                return result;
            }, []);
            req.iams = Array.prototype.concat.apply(req.iams, allIAMs.filter(({ id }) => children.includes(id)));
        }
        req.hasAllIams = hasIam(req.iams, true);
        req.hasAnyIam = hasIam(req.iams, false);
        return next();
    });
    function isAllowed(iam) {
        let allIAMs;
        return async (req, res, next) => {
            const { iams, user } = req;
            const roles = user && Array.isArray(user.roles) ? user.roles : ['guest'];
            const index = iams.findIndex((item) => {
                const { permission, resource } = item;
                if (resource instanceof RegExp) {
                    return (resource.test(req.baseUrl + req.route.path) &&
                        (permission === 'all' || permission === '*' || req.method.toLowerCase() === permission));
                }
                if (typeof resource === 'string') {
                    return (new RegExp(resource).test(req.baseUrl + req.route.path) &&
                        req.method.toLowerCase() === permission);
                }
                return false;
            });
            if (index >= 0) {
                return next();
            }
            if (!allIAMs) {
                try {
                    allIAMs = await iam.IamModel.find();
                }
                catch (e) {
                }
            }
            const found = (allIAMs || []).find((one) => one.resource &&
                new RegExp(one.resource).test(req.baseUrl + req.route.path) &&
                (one.permission === 'all' ||
                    one.permission === '*' ||
                    one.permission === req.method.toLowerCase()) &&
                !one.excluded);
            if (!found) {
                return res.status(404).json({
                    message: 'Not Found',
                });
            }
            if (roles.length <= 1 && (!roles[0] || roles[0] === 'guest')) {
                return res.status(401).json({
                    message: 'User is not signed in',
                });
            }
            return res.status(403).json({
                message: 'User is not authorized',
            });
        };
    }
    config.files.server.iam.forEach((routePath) => {
        const m = require(path_1.resolve(routePath));
        const r = express_1.default.Router();
        const exec = regex.exec(routePath);
        r.use((req, _res, next) => {
            if (exec) {
                req.i18n.setDefaultNamespace(`${exec[1]}:${exec[2]}`);
            }
            next();
        });
        if (Array.isArray(m.before)) {
            m.before.forEach((middleware) => {
                r.use(middleware);
            });
        }
        if (Array.isArray(m.routes)) {
            m.routes.forEach((route) => {
                if (!route ||
                    typeof route !== 'object' ||
                    !route.methods ||
                    typeof route.methods !== 'object' ||
                    !route.path) {
                    console.warn('Invalid route', route);
                    return;
                }
                let routeTmp = r.route(route.path);
                let allMiddlwares = route.all || route['*'];
                if (allMiddlwares && !Array.isArray(allMiddlwares)) {
                    allMiddlwares = [allMiddlwares];
                }
                if (!Array.isArray(allMiddlwares)) {
                    allMiddlwares = [];
                }
                allMiddlwares.unshift(isAllowed(iam));
                routeTmp = routeTmp.all(allMiddlwares);
                Object.keys(route.methods).forEach(async (k) => {
                    if (typeof routeTmp[k] === 'function' &&
                        Object.prototype.hasOwnProperty.call(route.methods, k) &&
                        route.methods[k] &&
                        typeof route.methods[k] === 'object' &&
                        route.methods[k].middlewares) {
                        const method = route.methods[k];
                        try {
                            const { found, reason, data } = await isExcluded(method);
                            if (!found) {
                                routeTmp[k](method.middlewares);
                            }
                            else {
                                debug(chalk_1.default.yellow(`
IAM  excluded:
IAM     : ${method.iam}
Reason  : ${reason}
Data    : ${data}`));
                            }
                        }
                        catch (e) {
                            const routes = method.middlewares.map((middleware) => {
                                const result = typeof middleware === 'function' ? '⨍' : 'null';
                                return result;
                            });
                            console.error(`
Error while adding route:

${chalk_1.default.red('Route')}   : ${route.path}
${chalk_1.default.red('Module')}  : ${routePath}
${chalk_1.default.red('Method')}  : ${k}
${chalk_1.default.red('Routes')}  : [${routes.join(' , ')}]

Please check your IAM configuraion
`);
                            process.exit(1);
                        }
                    }
                });
            });
        }
        if (Array.isArray(m.params)) {
            m.params.forEach((p) => {
                r.param(p.name, p.middleware);
            });
        }
        if (Array.isArray(m.after)) {
            m.after.forEach((middleware) => {
                r.use(middleware);
            });
        }
        if (m.is_global === true) {
            app.use(m.prefix, r);
        }
        else {
            app.use(config.app.prefix + m.prefix, r);
        }
    });
};
//# sourceMappingURL=01-acls.server.config.js.map