"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = exports.init = exports.loadModels = void 0;
const chalk_1 = require("chalk");
const cluster_1 = __importDefault(require("cluster"));
const debug_1 = __importDefault(require("debug"));
const config = __importStar(require(".."));
const express = __importStar(require("./express"));
const debug = debug_1.default('app:config:lib:app');
const mongoose = require('./mongoose');
mongoose.loadModels();
const loadModels = function loadModels() {
    mongoose.loadModels();
};
exports.loadModels = loadModels;
const init = function init(callback) {
    mongoose.connect(async (db) => {
        const app = await express.init(db);
        if (callback)
            callback(app, db, config);
    });
};
exports.init = init;
const start = async function start(callback) {
    const { port, host, prefix, cluster: clusterConfig } = config.app;
    const { enabled, maxWorkers } = clusterConfig;
    if (enabled && cluster_1.default.isMaster) {
        for (let i = 0; i < maxWorkers; i += 1) {
            cluster_1.default.fork();
        }
        cluster_1.default.on('exit', (worker) => {
            debug(`worker ${worker.process.pid} died`);
        });
    }
    else {
        this.init((app, db) => {
            const server = app.listen(port, host, () => {
                const { port: p, address } = server.address();
                const { secure, publicAddress, cors } = config.app;
                const addr = `http${secure.ssl ? 's' : ''}://${address}:${p}`;
                debug(`--
${chalk_1.green('HTTPs          : ')}${secure.ssl ? chalk_1.green('✓') : chalk_1.red('𐄂')}
${chalk_1.green(`Address        : ${addr}`)}
${chalk_1.green('Cluster        : ')}${enabled ? chalk_1.green('✓') : chalk_1.red('𐄂')}
${chalk_1.green(`Database       : ${config.db.uri}`)}
${chalk_1.green(`API Prefix     : ${prefix}`)}
${chalk_1.green(`Environment    : ${process.env.NODE_ENV}`)}
${chalk_1.green(`App version    : ${config.pkg.version}`)}
${chalk_1.green('CORS disabled  : ')}${cors.enabled ? chalk_1.red('𐄂') : chalk_1.green('✓')}
${chalk_1.green(`Public address : ${publicAddress}`)}
--`);
                if (callback)
                    callback(app, db, config);
            });
        });
    }
};
exports.start = start;
//# sourceMappingURL=app.js.map