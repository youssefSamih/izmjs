/* eslint-disable no-undef */
process.env.NODE_ENV = 'test';
process.env.DEBUG = '';
process.env.ADMIN_VALIDATE = 'false';

import './polyfill';

type DataaseVar = { dropDatabase: (arg0: (err: any) => void) => void; databaseName: any };

const mongoos = require('../config/lib/mongoose');

let dataBase: DataaseVar;

mongoos.loadModels();

suiteSetup((done: () => void) => {
  mongoos.connect((db: DataaseVar) => {
    dataBase = db;
    done();
  });
});

suiteTeardown((done: () => any) => {
  dataBase.dropDatabase((err) => {
    if (err) {
      console.error(err);
    } else {
      console.info('Successfully dropped db: ', dataBase.databaseName);
    }

    mongoos.disconnect((e: any) => {
      if (e) {
        console.info('Error disconnecting from database');
        console.info(e);
      }

      return done();
    });
  });
});
