const redisAdapter = require('socket.io-redis');
const cookieParser = require('cookie-parser');
const { connection } = require('mongoose');
const session = require('express-session');
const socketio = require('socket.io');
const passport = require('passport');
const { resolve: resolv } = require('path');
const MongoStore = require('connect-mongo')(session);

const conf = require('..');

let io: {
  adapter: (arg0: any) => void;
  use: (arg0: (socket: any, next: any) => void) => void;
  on: (arg0: string, arg1: (socket: any) => void) => void;
};

// Define the io property
Object.defineProperty(exports, 'io', {
  get: () => io,
});

// Define the Socket.io configuration method
exports.init = (server: any) => {
  // Create a new Socket.io server
  io = socketio(server);

  // Create a MongoDB storage object
  const mongoStore = new MongoStore({
    collection: conf.sessionCollection,
    mongooseConnection: connection,
  });

  // Redis adapater
  if (conf.sockets.adapter === 'redis') {
    io.adapter(redisAdapter(conf.sockets.redisOptions));
  }

  // Intercept Socket.io's handshake request
  io.use((socket, next) => {
    // Use the 'cookie-parser' module to parse the request cookies
    cookieParser(conf.sessionSecret)(socket.request, {}, () => {
      // Get the session id from the request cookies
      const sessionId = socket.request.signedCookies
        ? socket.request.signedCookies[conf.sessionKey]
        : false;

      if (!sessionId) {
        if (conf.sockets.public) {
          return next(null, true);
        }
        return next(new Error('sessionId was not found in socket.request'), false);
      }

      // Use the mongoStorage instance to get the Express session information
      return mongoStore.get(sessionId, (error: any, sess: any) => {
        const s = socket;
        if (error) return next(error, false);
        if (!sess) return next(new Error(`session was not found for ${sessionId}`), false);

        // Set the Socket.io session information
        s.request.session = sess;

        // Use Passport to populate the user details
        return passport.initialize()(socket.request, {}, () => {
          passport.session()(socket.request, {}, async () => {
            const { request: req } = socket;

            if (req.user || conf.sockets.public) {
              next(null, true);
            } else {
              next(new Error('User is not authenticated'), false);
            }
          });
        });
      });
    });
  });

  conf.files.server.socketsConfig.forEach((c: any) => {
    // eslint-disable-next-line import/no-dynamic-require,global-require
    require(resolv(c))(io);
  });

  // Add an event listener to the 'connection' event
  io.on('connection', (socket) => {
    conf.files.server.sockets.forEach((c: any) => {
      // eslint-disable-next-line import/no-dynamic-require,global-require
      require(resolv(c))(io, socket);
    });
  });

  // return server;
  return server;
};
