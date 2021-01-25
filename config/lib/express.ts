/**
 * Module dependencies.
 */
import { lstatSync, readdirSync, readFileSync } from 'fs';
import { createServer as createHTTPsServer } from 'https';
import {
  createServer as createHTTPServer,
  IncomingMessage,
  RequestListener,
  ServerResponse,
} from 'http';
import methodOverride from 'method-override';
import Backend from 'i18next-fs-backend';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { connection } from 'mongoose';
import bodyParser, { OptionsJson } from 'body-parser';
import compress from 'compression';
import flash from 'connect-flash';
import nunjucks from 'nunjucks';
import i18next from 'i18next';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import { resolve, join } from 'path';
import config from '..';

const i18nextMiddleware = require('i18next-http-middleware');
const debug = require('debug')('app:config:express');
const MongoStore = require('connect-mongo')(session);
const logger = require('./logger');
const { init: initSocketIO } = require('./socket.io');

const { vendor, custom } = (config as any).files?.server.modules;

/**
 * Initialize local variables
 */
type initLocalVariablesAppParam = { use?: any; locals?: any };
type reqParam = { protocol: any; hostname: any; headers: { host: any }; originalUrl: any };
type resParam = { locals: { host: string; url: string } };
type initMiddlewareAppParam = { set?: any; enable?: any; use?: any; locals?: any };
type initViewEngineParam = { set: (arg0: string, arg1: string) => void };
type initHelmetHeadersParam = {
  use: (
    arg0: (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => void,
  ) => void;
  disable: (arg0: string) => void;
};
type initModulesServerRoutesParam = { use: (arg0: any, arg1: any) => void };
type initI18nParam = { use: (arg0: any) => void };
type initErrorRoutesParam = {
  use: (arg0: (err: any, req: any, res: any, next: any) => any) => void;
};

export const initLocalVariables = (app: initLocalVariablesAppParam) => {
  const { locals } = app;
  const { secure } = (config as any).app;

  // Setting application local variables
  if (secure.ssl === true) {
    locals.secure = secure.ssl;
  }

  // Passing the request url to environment locals
  app.use((req: reqParam, res: resParam, next: () => void) => {
    res.locals.host = `${req.protocol}://${req.hostname}`;
    res.locals.url = `${req.protocol}://${req.headers.host}${req.originalUrl}`;
    next();
  });
};

/**
 * Run bootstrap files
 */
export const runBootstrap = (app: any, db: any) => {
  const promises = (config as any).files?.server.bootstraps.map(async (f: string) => {
    // eslint-disable-next-line import/no-dynamic-require,global-require
    const m = require(resolve(f));

    if (typeof m === 'function') {
      try {
        debug('Bootstraping file %s', f);
        await m(config, app, db);
        debug('file "%s" executed successfully', f);
      } catch (e) {
        console.error('Error bootstraping file "%s"', f, e);
        return false;
      }
    }

    return true;
  });

  return Promise.all(promises);
};

/**
 * Initialize application middleware
 */
export const initMiddleware = (app: initMiddlewareAppParam) => {
  const { locals } = app;

  // Showing stack errors
  app.set('showStackError', true);

  // Enable jsonp
  app.enable('jsonp callback');

  // Should be placed before express.static
  app.use(
    compress({
      filter(_req, res: any) {
        return /json|text|javascript|css|font|svg/.test(res.getHeader('Content-Type'));
      },
      level: 9,
    }),
  );

  // Enable logger (morgan)
  app.use(morgan(logger.getFormat(), logger.getOptions()));

  // Environment dependent middleware
  if (process.env.NODE_ENV === 'development') {
    // Disable views cache
    app.set('view cache', false);
  } else if (process.env.NODE_ENV === 'production') {
    locals.cache = 'memory';
  }

  // Request body parsing middleware should be above methodOverride
  app.use(bodyParser.json({ limit: '4mb', extended: true } as OptionsJson));
  app.use(bodyParser.urlencoded({ limit: '4mb', extended: true }));
  app.use(methodOverride());
  // Add the cookie parser and flash middleware
  app.use(cookieParser());
  app.use(flash());
  app.use('/assets', express.static('assets'));
  app.use(express.static((config as any).app.webFolder));

  if ((config as any).app.cors.enabled) {
    app.use(
      cors({
        credentials: (config as any).app.cors.credentials,
        origin: (config as any).app.cors.origin,
      }),
    );
  }
};

/**
 * Configure view engine
 */
export const initViewEngine = (app: initViewEngineParam) => {
  nunjucks.configure('./', {
    autoescape: true,
    express: app,
  });

  // Set views path and view engine
  app.set('view engine', 'server.view.swig');
};

/**
 * Configure Express session
 */
export const initSession = (app: any) => {
  const { cookie, name, secret, collection } = (config as any).session;

  // Express MongoDB session storage
  app.use(
    session({
      saveUninitialized: true,
      resave: true,
      secret,
      cookie,
      name,
      store: new MongoStore({
        collection,
        mongooseConnection: connection,
      }),
    }),
  );

  // Add Lusca CSRF Middleware
  // app.use(lusca(config.csrf));
};

/**
 * Invoke modules server configuration
 */
export const initModulesConfiguration = (app: any, db: any) => {
  (config as any).files?.server.configs.forEach((configPath: string) => {
    // eslint-disable-next-line import/no-dynamic-require,global-require
    require(resolve(configPath))(app, db, config);
  });
};

/**
 * Configure Helmet headers configuration
 */
export const initHelmetHeaders = (app: initHelmetHeadersParam) => {
  // Use helmet to secure Express headers
  const SIX_MONTHS = 15778476000;
  app.use(
    helmet({
      maxAge: SIX_MONTHS,
    } as Readonly<any>),
  );
  app.disable('x-powered-by');
};

/**
 * Configure the modules server routes
 */
export const initModulesServerRoutes = (app: initModulesServerRoutesParam) => {
  // Globbing routing files
  (config as any).files?.server.routes.forEach((routePath: string) => {
    // eslint-disable-next-line import/no-dynamic-require,global-require
    const m = require(resolve(routePath));
    if (typeof m === 'function') {
      m(app);
    } else {
      app.use((config as any).app.prefix + m.prefix, m.router(app));
    }
  });
};

export const createServer = (app: RequestListener | undefined) => {
  let server;
  const { secure } = (config as any).app;
  if (secure.ssl === true) {
    // Load SSL key and certificate
    const privateKey = readFileSync(resolve(secure.privateKey), 'utf8');
    const certificate = readFileSync(resolve(secure.certificate), 'utf8');
    let caBundle;

    try {
      caBundle = readFileSync(resolve(secure.caBundle), 'utf8');
    } catch (err) {
      console.warn('Warning: could not find or read caBundle file');
    }

    const options = {
      key: privateKey,
      cert: certificate,
      ca: caBundle,
      //  requestCert : true,
      //  rejectUnauthorized : true,
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

    // Create new HTTPS Server
    server = createHTTPsServer(options, app);
  } else {
    // Create a new HTTP server
    server = createHTTPServer(app);
  }

  return server;
};

/**
 * Configure i18n
 */
export const initI18n = (app: initI18nParam) => {
  const lngDetector = new i18nextMiddleware.LanguageDetector(
    null,
    (config as any).i18next.detector,
  );

  const getDirsNames = () => {
    const modules = [vendor, ...custom];
    const names = modules.map((source) =>
      readdirSync(source)
        .map((name) => {
          const p = join(source, name);

          if (!lstatSync(p).isDirectory()) {
            return false;
          }

          return `${source}:${name}`;
        })
        .filter(Boolean),
    );

    return Array.prototype.concat.apply([], names);
  };

  i18next
    .use(Backend)
    .use(lngDetector)
    .init({
      ...(config as any).i18next.init,
      ns: getDirsNames(),
    });

  app.use(i18nextMiddleware.handle(i18next));
};

/**
 * Configure error handling
 */
export const initErrorRoutes = (app: initErrorRoutesParam) => {
  app.use((err, req, res, next) => {
    // If the error object doesn't exists
    if (!err) {
      return next();
    }

    // Log it
    console.error(err.stack);

    if (!req.i18n) {
      return res.status(500).render(`${vendor}/core/views/500`, {
        error: 'ERROR_500',
      });
    }

    const { options } = req.i18n;

    options.defaultNS = 'vendor:core';

    // Redirect to error page
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

/**
 * Initialize the Express application
 */
export const init = async (db: any) => {
  // Initialize express app
  const app = express();

  // Run bootstrap files
  await (this as any)?.runBootstrap(app, db);

  // Initialize local variables
  (this as any)?.initLocalVariables(app, db);

  // Initialize Express middleware
  (this as any)?.initMiddleware(app);

  // Initialize Express view engine
  (this as any)?.initViewEngine(app);

  // Initialize Express session
  (this as any)?.initSession(app, db);

  // Initialize modules server i18n
  (this as any)?.initI18n(app);

  // Initialize Modules configuration
  (this as any)?.initModulesConfiguration(app, db);

  // Initialize Helmet security headers
  (this as any)?.initHelmetHeaders(app);

  // Initialize modules server routes
  (this as any)?.initModulesServerRoutes(app);

  // Initialize error routes
  (this as any)?.initErrorRoutes(app);

  // create the server, then return the instance
  const server = (this as any)?.createServer(app);

  // Configure Socket.io
  initSocketIO(server);

  return server;
};
