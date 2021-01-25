"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require('lodash');
const mongoose_1 = __importDefault(require("mongoose"));
const chalk = require('chalk');
const config = require('..');
async function seed(collection, opts) {
    const options = _.merge(opts || {}, collection.options || {});
    const Model = mongoose_1.default.model(collection.model);
    const { docs } = collection;
    const skipWhen = collection.skip ? collection.skip.when : null;
    if (!Model.seed) {
        throw new Error(`Database Seeding: Invalid Model Configuration - ${collection.model}.seed() not implemented`);
    }
    if (!docs || !docs.length) {
        return;
    }
    async function skipCollection() {
        if (!skipWhen) {
            return false;
        }
        const results = await Model.find(skipWhen);
        return results && results.length;
    }
    async function seedDocuments(skipCollection_) {
        function onComplete(responses) {
            if (options.logResults) {
                responses.forEach((response) => {
                    if (response.message) {
                        console.info(chalk.magenta(response.message));
                    }
                });
            }
        }
        if (skipCollection_) {
            return onComplete([
                {
                    message: chalk.yellow(`Database Seeding: ${collection.model} collection skipped`),
                },
            ]);
        }
        const workload = docs
            .filter((doc) => doc.data)
            .map((doc) => Model.seed(doc.data, {
            overwrite: doc.overwrite,
        }));
        return onComplete(await Promise.all(workload));
    }
    const tmp = await skipCollection();
    await seedDocuments(tmp);
}
function start(seedConfig) {
    return new Promise((resolve, reject) => {
        const seedConfigTmp = seedConfig || {};
        const options = seedConfigTmp.options || (config.seedDB ? _.clone(config.seedDB.options, true) : {});
        const collections = seedConfigTmp.collections || (config.seedDB ? _.clone(config.seedDB.collections, true) : []);
        if (!collections.length) {
            return resolve();
        }
        const seeds = collections.filter((collection) => collection.model);
        function onSuccessComplete() {
            if (options.logResults) {
                console.info();
                console.info(chalk.bold.green('Database Seeding: Mongo Seed complete!'));
                console.info();
            }
            return resolve();
        }
        function onError(err) {
            if (options.logResults) {
                console.info();
                console.info(chalk.bold.red('Database Seeding: Mongo Seed Failed!'));
                console.info(chalk.bold.red(`Database Seeding: ${err}`));
                console.info();
            }
            return reject(err);
        }
        return seeds
            .reduce((p, item) => p.then(() => seed(item, options)), Promise.resolve())
            .then(onSuccessComplete)
            .catch(onError);
    });
}
exports.default = start;
//# sourceMappingURL=mongo-seed.js.map