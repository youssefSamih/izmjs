"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnect = exports.connect = exports.loadModels = void 0;
const chalk = require('chalk');
const path = require('path');
const mongoose = require('mongoose');
const config = require('..');
const loadModels = (callback) => {
    config.files.server.models.forEach((modelPath) => {
        require(path.resolve(modelPath));
    });
    if (callback)
        callback();
};
exports.loadModels = loadModels;
const connect = (callback) => {
    mongoose.Promise = global.Promise;
    mongoose
        .connect(config.db.uri, Object.assign(Object.assign({}, config.db.options), { autoIndex: false, useFindAndModify: false, useUnifiedTopology: true }))
        .then(() => {
        mongoose.set('debug', config.db.debug);
        if (callback)
            callback(mongoose.connection.db);
    })
        .catch((err) => {
        console.error(chalk.red('Could not connect to MongoDB!'));
        console.error(err);
    });
};
exports.connect = connect;
process.on('uncaughtException', (err) => {
    console.error(err);
    if (err.name === 'MongoError' && err.codeName === 'DuplicateKey') {
    }
    else {
        process.exit(0);
    }
});
const disconnect = (cb) => {
    mongoose.connection.close((err) => {
        console.info(chalk.yellow('Disconnected from MongoDB.'));
        return cb(err);
    });
};
exports.disconnect = disconnect;
mongoose.Query.prototype.paginate = async function paginate({ top = 10, skip = 0 }) {
    const t = isNaN(top) ? 10 : typeof top !== 'number' ? parseInt(top, 10) : top;
    const s = isNaN(skip) ? 10 : typeof skip !== 'number' ? parseInt(skip, 10) : skip;
    if (t >= 0) {
        this.limit(t);
    }
    if (s >= 0) {
        this.skip(s);
    }
    const result = await Promise.all([
        this.exec(),
        this.model.find(this.getQuery()).countDocuments(),
    ]);
    return {
        top: t >= 0 ? t : result[1],
        skip: s >= 0 ? s : 0,
        value: result[0],
        count: result[1],
    };
};
//# sourceMappingURL=mongoose.js.map