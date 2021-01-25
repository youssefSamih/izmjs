"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const mongoose_1 = require("mongoose");
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const path_1 = require("path");
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const redisAdapter = require('socket.io-redis');
const socketio = require('socket.io');
const MongoStore = connect_mongo_1.default(express_session_1.default);
const conf = require('..');
let io;
Object.defineProperty(exports, 'io', {
    get: () => io,
});
const init = (server) => {
    io = socketio(server);
    const mongoStore = new MongoStore({
        collection: conf.sessionCollection,
        mongooseConnection: mongoose_1.connection,
    });
    if (conf.sockets.adapter === 'redis') {
        io.adapter(redisAdapter(conf.sockets.redisOptions));
    }
    io.use((socket, next) => {
        cookie_parser_1.default(conf.sessionSecret)(socket.request, {}, () => {
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
                return passport_1.default.initialize()(socket.request, {}, () => {
                    passport_1.default.session()(socket.request, {}, async () => {
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
        require(path_1.resolve(c))(io);
    });
    io.on('connection', (socket) => {
        conf.files.server.sockets.forEach((c) => {
            require(path_1.resolve(c))(io, socket);
        });
    });
    return server;
};
exports.default = init;
//# sourceMappingURL=socket.io.js.map