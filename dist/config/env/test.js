module.exports = {
    db: {
        uri: process.env.MONGODB_URI ||
            process.env.MONGOHQ_URL ||
            process.env.MONGOLAB_URI ||
            `mongodb://${process.env.DB_1_PORT_27017_TCP_ADDR || 'localhost'}/app-test`,
        options: {
            user: '',
            pass: '',
            useNewUrlParser: true,
        },
        debug: process.env.MONGODB_DEBUG || false,
        fake: true,
    },
    log: {
        format: 'dev',
        options: {
            stream: {
                directoryPath: process.cwd(),
                fileName: 'logs/access.log',
                rotatingLogs: {
                    active: false,
                    fileName: 'access-%DATE%.log',
                    frequency: 'daily',
                    verbose: false,
                },
            },
        },
    },
};
//# sourceMappingURL=test.js.map