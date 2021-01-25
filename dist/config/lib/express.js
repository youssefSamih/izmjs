"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = exports.initErrorRoutes = exports.initI18n = exports.createServer = exports.initModulesServerRoutes = exports.initHelmetHeaders = exports.initModulesConfiguration = exports.initSession = exports.initViewEngine = exports.initMiddleware = exports.runBootstrap = exports.initLocalVariables = void 0;
const fs_1 = require("fs");
const https_1 = require("https");
const http_1 = require("http");
const method_override_1 = __importDefault(require("method-override"));
const i18next_fs_backend_1 = __importDefault(require("i18next-fs-backend"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
const mongoose_1 = require("mongoose");
const body_parser_1 = __importDefault(require("body-parser"));
const compression_1 = __importDefault(require("compression"));
const connect_flash_1 = __importDefault(require("connect-flash"));
const nunjucks_1 = __importDefault(require("nunjucks"));
const i18next_1 = __importDefault(require("i18next"));
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const path_1 = require("path");
const i18nextMiddleware = require('i18next-http-middleware');
const debug = require('debug')('app:config:express');
const MongoStore = require('connect-mongo')(express_session_1.default);
const config = require('..');
const logger = require('./logger');
const { init: initSocketIO } = require('./socket.io');
const { vendor, custom } = config.files.server.modules;
const initLocalVariables = (app) => {
    const { locals } = app;
    const { secure } = config.app;
    if (secure.ssl === true) {
        locals.secure = secure.ssl;
    }
    app.use((req, res, next) => {
        res.locals.host = `${req.protocol}://${req.hostname}`;
        res.locals.url = `${req.protocol}://${req.headers.host}${req.originalUrl}`;
        next();
    });
};
exports.initLocalVariables = initLocalVariables;
const runBootstrap = (app, db) => {
    const promises = config.files.server.bootstraps.map(async (f) => {
        const m = require(path_1.resolve(f));
        if (typeof m === 'function') {
            try {
                debug('Bootstraping file %s', f);
                await m(config, app, db);
                debug('file "%s" executed successfully', f);
            }
            catch (e) {
                console.error('Error bootstraping file "%s"', f, e);
                return false;
            }
        }
        return true;
    });
    return Promise.all(promises);
};
exports.runBootstrap = runBootstrap;
const initMiddleware = (app) => {
    const { locals } = app;
    app.set('showStackError', true);
    app.enable('jsonp callback');
    app.use(compression_1.default({
        filter(_req, res) {
            return /json|text|javascript|css|font|svg/.test(res.getHeader('Content-Type'));
        },
        level: 9,
    }));
    app.use(morgan_1.default(logger.getFormat(), logger.getOptions()));
    if (process.env.NODE_ENV === 'development') {
        app.set('view cache', false);
    }
    else if (process.env.NODE_ENV === 'production') {
        locals.cache = 'memory';
    }
    app.use(body_parser_1.default.json({ limit: '4mb', extended: true }));
    app.use(body_parser_1.default.urlencoded({ limit: '4mb', extended: true }));
    app.use(method_override_1.default());
    app.use(cookie_parser_1.default());
    app.use(connect_flash_1.default());
    app.use('/assets', express_1.default.static('assets'));
    app.use(express_1.default.static(config.app.webFolder));
    if (config.app.cors.enabled) {
        app.use(cors_1.default({
            credentials: config.app.cors.credentials,
            origin: config.app.cors.origin,
        }));
    }
};
exports.initMiddleware = initMiddleware;
const initViewEngine = (app) => {
    nunjucks_1.default.configure('./', {
        autoescape: true,
        express: app,
    });
    app.set('view engine', 'server.view.swig');
};
exports.initViewEngine = initViewEngine;
const initSession = (app) => {
    const { cookie, name, secret, collection } = config.session;
    app.use(express_session_1.default({
        saveUninitialized: true,
        resave: true,
        secret,
        cookie,
        name,
        store: new MongoStore({
            collection,
            mongooseConnection: mongoose_1.connection,
        }),
    }));
};
exports.initSession = initSession;
const initModulesConfiguration = (app, db) => {
    config.files.server.configs.forEach((configPath) => {
        require(path_1.resolve(configPath))(app, db, config);
    });
};
exports.initModulesConfiguration = initModulesConfiguration;
const initHelmetHeaders = (app) => {
    const SIX_MONTHS = 15778476000;
    app.use(helmet_1.default({
        maxAge: SIX_MONTHS,
    }));
    app.disable('x-powered-by');
};
exports.initHelmetHeaders = initHelmetHeaders;
const initModulesServerRoutes = (app) => {
    config.files.server.routes.forEach((routePath) => {
        const m = require(path_1.resolve(routePath));
        if (typeof m === 'function') {
            m(app);
        }
        else {
            app.use(config.app.prefix + m.prefix, m.router(app));
        }
    });
};
exports.initModulesServerRoutes = initModulesServerRoutes;
const createServer = (app) => {
    let server;
    const { secure } = config.app;
    if (secure.ssl === true) {
        const privateKey = fs_1.readFileSync(path_1.resolve(secure.privateKey), 'utf8');
        const certificate = fs_1.readFileSync(path_1.resolve(secure.certificate), 'utf8');
        let caBundle;
        try {
            caBundle = fs_1.readFileSync(path_1.resolve(secure.caBundle), 'utf8');
        }
        catch (err) {
            console.warn('Warning: could not find or read caBundle file');
        }
        const options = {
            key: privateKey,
            cert: certificate,
            ca: caBundle,
            secureProtocol: 'TLSv1_method',
            ciphers: [
                'ECDHE-RSA-AES128-GCM-SHA256',
                'ECDHE-ECDSA-AES128-GCM-SHA256',
                'ECDHE-RSA-AES256-GCM-SHA384',
                'ECDHE-ECDSA-AES256-GCM-SHA384',
                'DHE-RSA-AES128-GCM-SHA256',
                'ECDHE-RSA-AES128-SHA256',
                'DHE-RSA-AES128-SHA256',
                'ECDHE-RSA-AES256-SHA384',
                'DHE-RSA-AES256-SHA384',
                'ECDHE-RSA-AES256-SHA256',
                'DHE-RSA-AES256-SHA256',
                'HIGH',
                '!aNULL',
                '!eNULL',
                '!EXPORT',
                '!DES',
                '!RC4',
                '!MD5',
                '!PSK',
                '!SRP',
                '!CAMELLIA',
            ].join(':'),
            honorCipherOrder: true,
        };
        server = https_1.createServer(options, app);
    }
    else {
        server = http_1.createServer(app);
    }
    return server;
};
exports.createServer = createServer;
const initI18n = (app) => {
    const lngDetector = new i18nextMiddleware.LanguageDetector(null, config.i18next.detector);
    const getDirsNames = () => {
        const modules = [vendor, ...custom];
        const names = modules.map((source) => fs_1.readdirSync(source)
            .map((name) => {
            const p = path_1.join(source, name);
            if (!fs_1.lstatSync(p).isDirectory()) {
                return false;
            }
            return `${source}:${name}`;
        })
            .filter(Boolean));
        return Array.prototype.concat.apply([], names);
    };
    i18next_1.default
        .use(i18next_fs_backend_1.default)
        .use(lngDetector)
        .init(Object.assign(Object.assign({}, config.i18next.init), { ns: getDirsNames() }));
    app.use(i18nextMiddleware.handle(i18next_1.default));
};
exports.initI18n = initI18n;
const initErrorRoutes = (app) => {
    app.use((err, req, res, next) => {
        if (!err) {
            return next();
        }
        console.error(err.stack);
        if (!req.i18n) {
            return res.status(500).render(`${vendor}/core/views/500`, {
                error: 'ERROR_500',
            });
        }
        const { options } = req.i18n;
        options.defaultNS = 'vendor:core';
        return res.status(500).format({
            'text/html': () => {
                res.render(`${vendor}/core/views/500`, {
                    error: req.t('ERROR_500'),
                });
            },
            'application/json': () => {
                res.json({
                    error: req.t('ERROR_500'),
                });
            },
            default() {
                res.send(req.t('ERROR_500'));
            },
        });
    });
};
exports.initErrorRoutes = initErrorRoutes;
const init = async (db) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const app = express_1.default();
    await ((_a = this) === null || _a === void 0 ? void 0 : _a.runBootstrap(app, db));
    (_b = this) === null || _b === void 0 ? void 0 : _b.initLocalVariables(app, db);
    (_c = this) === null || _c === void 0 ? void 0 : _c.initMiddleware(app);
    (_d = this) === null || _d === void 0 ? void 0 : _d.initViewEngine(app);
    (_e = this) === null || _e === void 0 ? void 0 : _e.initSession(app, db);
    (_f = this) === null || _f === void 0 ? void 0 : _f.initI18n(app);
    (_g = this) === null || _g === void 0 ? void 0 : _g.initModulesConfiguration(app, db);
    (_h = this) === null || _h === void 0 ? void 0 : _h.initHelmetHeaders(app);
    (_j = this) === null || _j === void 0 ? void 0 : _j.initModulesServerRoutes(app);
    (_k = this) === null || _k === void 0 ? void 0 : _k.initErrorRoutes(app);
    const server = (_l = this) === null || _l === void 0 ? void 0 : _l.createServer(app);
    initSocketIO(server);
    return server;
};
exports.init = init;
//# sourceMappingURL=express.js.map