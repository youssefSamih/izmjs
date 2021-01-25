"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
module.exports = {
    port: process.env.PORT || 8443,
    db: {
        uri: process.env.MONGODB_URI ||
            process.env.MONGOHQ_URL ||
            process.env.MONGOLAB_URI ||
            `mongodb://${process.env.DB_1_PORT_27017_TCP_ADDR || 'localhost'}/app`,
        options: {
            auth: process.env.MONGODB_USERNAME ? { authSource: 'admin' } : undefined,
            user: process.env.MONGODB_USERNAME || '',
            pass: process.env.MONGODB_PASSWORD || '',
            useNewUrlParser: true,
        },
        debug: process.env.MONGODB_DEBUG || false,
    },
    log: {
        format: process.env.LOG_FORMAT || 'combined',
        options: {
            stream: {
                directoryPath: process.env.LOG_DIR_PATH || path_1.resolve('logs'),
                fileName: process.env.LOG_FILE || 'access.log',
                rotatingLogs: {
                    active: process.env.LOG_ROTATING_ACTIVE === 'true',
                    fileName: process.env.LOG_ROTATING_FILE || 'access-%DATE%.log',
                    frequency: process.env.LOG_ROTATING_FREQUENCY || 'daily',
                    verbose: process.env.LOG_ROTATING_VERBOSE === 'true',
                },
            },
        },
    },
};
//# sourceMappingURL=production.js.map