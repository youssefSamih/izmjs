"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.env.NODE_ENV = 'test';
process.env.DEBUG = '';
process.env.ADMIN_VALIDATE = 'false';
require("./polyfill");
const mongoos = require('../config/lib/mongoose');
let dataBase;
mongoos.loadModels();
suiteSetup((done) => {
    mongoos.connect((db) => {
        dataBase = db;
        done();
    });
});
suiteTeardown((done) => {
    dataBase.dropDatabase((err) => {
        if (err) {
            console.error(err);
        }
        else {
            console.info('Successfully dropped db: ', dataBase.databaseName);
        }
        mongoos.disconnect((e) => {
            if (e) {
                console.info('Error disconnecting from database');
                console.info(e);
            }
            return done();
        });
    });
});
//# sourceMappingURL=test-hooks.js.map