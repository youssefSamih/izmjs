/**
 * Module dependencies.
 */
import { green, red } from 'chalk';
import cluster from 'cluster';
import debugImport from 'debug';
import * as config from '..';
import * as express from './express';

const debug = debugImport('app:config:lib:app');
const mongoose = require('./mongoose');

type ParamCallBack = (arg0: any, arg1: any, arg2: any) => void;
type initStartParam = { listen: (arg0: any, arg1: any, arg2: () => void) => any };

mongoose.loadModels();

export const loadModels = function loadModels() {
  mongoose.loadModels();
};

export const init = function init(callback: ParamCallBack) {
  mongoose.connect(async (db: any) => {
    // Initialize express
    const app = await express.init(db);
    if (callback) callback(app, db, config);
  });
};

export const start = async function start(this: any, callback?: ParamCallBack) {
  const { port, host, prefix, cluster: clusterConfig } = (config as any).app;
  const { enabled, maxWorkers } = clusterConfig;

  if (enabled && cluster.isMaster) {
    // Fork workers.
    for (let i = 0; i < maxWorkers; i += 1) {
      cluster.fork();
    }

    cluster.on('exit', (worker) => {
      debug(`worker ${worker.process.pid} died`);
    });
  } else {
    this.init((app: initStartParam, db: any) => {
      // Start the app by listening on <port>
      const server = app.listen(port, host, () => {
        const { port: p, address } = server.address();
        const { secure, publicAddress, cors } = (config as any).app;
        // Logging initialization
        const addr = `http${secure.ssl ? 's' : ''}://${address}:${p}`;

        debug(`--
${green('HTTPs          : ')}${secure.ssl ? green('✓') : red('𐄂')}
${green(`Address        : ${addr}`)}
${green('Cluster        : ')}${enabled ? green('✓') : red('𐄂')}
${green(`Database       : ${(config as any).db.uri}`)}
${green(`API Prefix     : ${prefix}`)}
${green(`Environment    : ${process.env.NODE_ENV}`)}
${green(`App version    : ${(config as any).pkg.version}`)}
${green('CORS disabled  : ')}${cors.enabled ? red('𐄂') : green('✓')}
${green(`Public address : ${publicAddress}`)}
--`);

        if (callback) callback(app, db, config);
      });
    });
  }
};
