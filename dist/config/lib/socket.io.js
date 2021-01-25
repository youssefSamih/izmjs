const redisAdapter = require('socket.io-redis');
const cookieParser = require('cookie-parser');
const { connection } = require('mongoose');
const session = require('express-session');
const socketio = require('socket.io');
const passport = require('passport');
const { resolve: resolv } = require('path');
const MongoStore = require('connect-mongo')(session);
const conf = require('..');
let io;
Object.defineProperty(exports, 'io', {
    get: () => io,
});
exports.init = (server) => {
    io = socketio(server);
    const mongoStore = new MongoStore({
        collection: conf.sessionCollection,
        mongooseConnection: connection,
    });
    if (conf.sockets.adapter === 'redis') {
        io.adapter(redisAdapter(conf.sockets.redisOptions));
    }
    io.use((socket, next) => {
        cookieParser(conf.sessionSecret)(socket.request, {}, () => {
            const sessionId = socket.request.signedCookies
                ? socket.request.signedCookies[conf.sessionKey]
                : false;
            if (!sessionId) {
                if (conf.sockets.public) {
                    return next(null, true);
                }
                return next(new Error('sessionId was not found in socket.request'), false);
            }
            return mongoStore.get(sessionId, (error, sess) => {
                const s = socket;
                if (error)
                    return next(error, false);
                if (!sess)
                    return next(new Error(`session was not found for ${sessionId}`), false);
                s.request.session = sess;
                return passport.initialize()(socket.request, {}, () => {
                    passport.session()(socket.request, {}, async () => {
                        const { request: req } = socket;
                        if (req.user || conf.sockets.public) {
                            next(null, true);
                        }
                        else {
                            next(new Error('User is not authenticated'), false);
                        }
                    });
                });
            });
        });
    });
    conf.files.server.socketsConfig.forEach((c) => {
        require(resolv(c))(io);
    });
    io.on('connection', (socket) => {
        conf.files.server.sockets.forEach((c) => {
            require(resolv(c))(io, socket);
        });
    });
    return server;
};
//# sourceMappingURL=socket.io.js.map