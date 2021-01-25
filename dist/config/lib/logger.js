"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require('lodash');
const chalk_1 = __importDefault(require("chalk"));
const fileStreamRotator = require('file-stream-rotator');
const fs = require('fs');
const config = require('..');
const validFormats = ['combined', 'common', 'dev', 'short', 'tiny'];
function getLogFormat() {
    let format = config.log && config.log.format ? config.log.format.toString() : 'combined';
    if (!_.includes(validFormats, format)) {
        format = 'combined';
        if (process.env.NODE_ENV !== 'test') {
            console.warn();
            console.warn(chalk_1.default.yellow(`Warning: An invalid format was provided. The logger will use the default format of "${format}"`));
            console.warn();
        }
    }
    return format;
}
function getLogOptions() {
    const options = config.log && config.log.options ? _.clone(config.log.options, true) : {};
    if (_.has(options, 'stream')) {
        try {
            if (_.has(options, 'stream.rotatingLogs') && options.stream.rotatingLogs.active) {
                if (options.stream.rotatingLogs.fileName.length && options.stream.directoryPath.length) {
                    if (!fs.existsSync(options.stream.directoryPath)) {
                        fs.mkdirSync(options.stream.directoryPath);
                    }
                    options.stream = fileStreamRotator.getStream({
                        filename: `${options.stream.directoryPath}/${options.stream.rotatingLogs.fileName}`,
                        frequency: options.stream.rotatingLogs.frequency,
                        verbose: options.stream.rotatingLogs.verbose,
                    });
                }
                else {
                    throw new Error('An invalid fileName or directoryPath was provided for the rotating logs option.');
                }
            }
            else if (options.stream.fileName.length && options.stream.directoryPath.length) {
                if (!fs.existsSync(options.stream.directoryPath)) {
                    fs.mkdirSync(options.stream.directoryPath);
                }
                options.stream = fs.createWriteStream(`${options.stream.directoryPath}/${config.log.options.stream.fileName}`, {
                    flags: 'a',
                });
            }
            else {
                throw new Error('An invalid fileName or directoryPath was provided for stream option.');
            }
        }
        catch (err) {
            delete options.stream;
            if (process.env.NODE_ENV !== 'test') {
                console.error();
                console.error(chalk_1.default.red('An error has occured during the creation of the WriteStream. The stream option has been omitted.'));
                console.error(chalk_1.default.red(err));
                console.error();
            }
        }
    }
    return options;
}
exports.default = {
    getFormat: getLogFormat,
    getOptions: getLogOptions,
};
//# sourceMappingURL=logger.js.map