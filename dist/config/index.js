"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const lodash_1 = __importDefault(require("lodash"));
const glob_1 = __importDefault(require("glob"));
const fs_1 = require("fs");
const path_1 = require("path");
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default('app:config');
const Environment = require('./lib/env-vars');
const SKIP_MODULES = (process.env.SKIP_MODULES || '').split(',').filter(Boolean);
function getGlobbedPaths(globPatterns, excludes) {
    const urlRegex = new RegExp('^(?:[a-z]+:)?//', 'i');
    let output = [];
    if (lodash_1.default.isArray(globPatterns) && typeof globPatterns === 'object') {
        globPatterns.forEach((globPattern) => {
            output = lodash_1.default.union(output, getGlobbedPaths(globPattern, excludes));
        });
    }
    else if (lodash_1.default.isString(globPatterns) && typeof globPatterns === 'string') {
        if (urlRegex.test(globPatterns)) {
            output.push(globPatterns);
        }
        else {
            let files = glob_1.default.sync(globPatterns);
            if (excludes) {
                files = files.map((file) => {
                    let f = file;
                    if (lodash_1.default.isArray(excludes)) {
                        excludes.forEach((e) => {
                            f = file.replace(e, '');
                        });
                    }
                    else {
                        f = typeof excludes === 'string' ? file.replace(excludes, '') : '';
                    }
                    return f;
                });
            }
            output = lodash_1.default.union(output, files);
        }
    }
    return output;
}
function validateEnvironmentVariable() {
    const environmentFiles = glob_1.default.sync(`./config/env/${process.env.NODE_ENV}.js`);
    if (!environmentFiles.length) {
        if (process.env.NODE_ENV) {
            console.error(chalk_1.default.red(`+ Error: No configuration file found for "${process.env.NODE_ENV}" environment using development instead`));
        }
        else {
            console.error(chalk_1.default.red('+ Error: NODE_ENV is not defined! Using default development environment'));
        }
        process.env.NODE_ENV = 'development';
    }
    chalk_1.default.white('');
}
function validateSecureMode(config) {
    if (!config.secure || config.secure.ssl !== true) {
        return true;
    }
    const privateKey = fs_1.existsSync(path_1.resolve(config.secure.privateKey));
    const certificate = fs_1.existsSync(path_1.resolve(config.secure.certificate));
    if (!privateKey || !certificate) {
        debug(chalk_1.default.red('+ Error: Certificate file or key file is missing, falling back to non-SSL mode'));
        debug(chalk_1.default.red('  To create them, simply run the following from your shell: sh ./scripts/generate-ssl-certs.sh'));
        lodash_1.default.merge(config.secure, {
            ssl: false,
        });
    }
    return true;
}
function validateSessionSecret(config, testing) {
    if (process.env.NODE_ENV !== 'production') {
        return true;
    }
    if (config.session.secret === 'DEFAULT_SESSION_SECRET') {
        if (!testing) {
            debug(chalk_1.default.red('+ WARNING: It is strongly recommended that you change session secret while running in production!'));
            debug(chalk_1.default.red('Please add `SESSION_SECRET=super amazing secret` to `.env/.production.env`'));
        }
        return false;
    }
    return true;
}
function initGlobalConfigFiles(config, assets) {
    const { modules } = assets;
    lodash_1.default.merge(config, {
        files: {
            server: {
                modules,
                models: getGlobbedPaths(assets.server.models),
                routes: getGlobbedPaths(assets.server.routes),
                configs: getGlobbedPaths(assets.server.config),
                appConfigs: getGlobbedPaths(assets.server.appConfig),
                iam: getGlobbedPaths(assets.server.iam),
                iams: getGlobbedPaths(assets.server.iams),
                bootstraps: getGlobbedPaths(assets.server.bootstraps),
                sockets: getGlobbedPaths(assets.server.sockets),
                socketsConfig: getGlobbedPaths(assets.server.socketsConfig),
            },
        },
    });
    if (SKIP_MODULES.length > 0) {
        const { server } = config.files;
        Object.keys(server).forEach((attr) => {
            const current = server[attr];
            if (Array.isArray(current)) {
                server[attr] = server[attr].filter((file) => {
                    const isToSkip = SKIP_MODULES.find((mName) => file.startsWith(mName));
                    return !isToSkip;
                });
            }
        });
    }
}
function loadEnv(assets) {
    const env = new Environment(process.env.NODE_ENV);
    const files = getGlobbedPaths(assets.server.env);
    files.forEach((f) => {
        const m = require(path_1.resolve(f));
        Object.keys(m).forEach((key) => {
            const _a = m[key], { scope, schema } = _a, item = __rest(_a, ["scope", "schema"]);
            env.set(Object.assign(Object.assign({}, item), { key }), schema, scope);
        });
    });
    return env;
}
function mergeModulesConfig(config) {
    const { appConfigs } = config.files.server;
    let result = config;
    if (Array.isArray(appConfigs)) {
        appConfigs.forEach((mPath) => {
            const m = require(path_1.resolve(mPath));
            if (typeof m === 'function') {
                const c = m(config);
                result = lodash_1.default.defaultsDeep(result, c);
            }
        });
    }
    return result;
}
function initGlobalConfig() {
    validateEnvironmentVariable();
    const defaultAssets = require(path_1.join(process.cwd(), 'config/assets/default'));
    const environmentAssets = require(path_1.join(process.cwd(), 'config/assets/', process.env.NODE_ENV || '')) || {};
    const assets = lodash_1.default.merge(defaultAssets, environmentAssets);
    const env = loadEnv(assets);
    const defaultConfig = require(path_1.join(process.cwd(), 'config/env/default'));
    const environmentConfig = require(path_1.join(process.cwd(), 'config/env/', process.env.NODE_ENV || '')) || {};
    const utils = {
        getGlobbedPaths,
        validateSessionSecret,
        env,
    };
    let config = lodash_1.default.merge({ utils }, defaultConfig, environmentConfig);
    const pkg = require(path_1.resolve('./package.json'));
    config.pkg = pkg;
    if (process.env.NODE_ENV !== 'test') {
        config = lodash_1.default.merge(config, (fs_1.existsSync(path_1.join(process.cwd(), 'config/env/local.js')) &&
            require(path_1.join(process.cwd(), 'config/env/local.js'))) ||
            {});
    }
    initGlobalConfigFiles(config, assets);
    config = mergeModulesConfig(config);
    validateSecureMode(config);
    validateSessionSecret(config);
    return config;
}
exports.default = initGlobalConfig;
//# sourceMappingURL=index.js.map