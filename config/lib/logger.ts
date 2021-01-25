const _ = require('lodash');
import chalk from 'chalk';
const fileStreamRotator = require('file-stream-rotator');
const fs = require('fs');
const config = require('..');

// list of valid formats for the logging
const validFormats = ['combined', 'common', 'dev', 'short', 'tiny'];

/**
 * The format to use with the logger
 *
 * Returns the log.format option set in the current environment configuration
 */
function getLogFormat() {
  let format = config.log && config.log.format ? config.log.format.toString() : 'combined';

  // make sure we have a valid format
  if (!_.includes(validFormats, format)) {
    format = 'combined';

    if (process.env.NODE_ENV !== 'test') {
      console.warn();
      console.warn(
        chalk.yellow(
          `Warning: An invalid format was provided. The logger will use the default format of "${format}"`,
        ),
      );
      console.warn();
    }
  }

  return format;
}

/**
 * The options to use with the logger
 *
 * Returns the log.options object set in the current environment configuration.
 * NOTE: Any options, requiring special handling (e.g. 'stream'), that encounter
 * an error will be removed from the options.
 */
function getLogOptions() {
  const options = config.log && config.log.options ? _.clone(config.log.options, true) : {};

  // check if the current environment config has the log stream option set
  if (_.has(options, 'stream')) {
    try {
      // check if we need to use rotating logs
      if (_.has(options, 'stream.rotatingLogs') && options.stream.rotatingLogs.active) {
        if (options.stream.rotatingLogs.fileName.length && options.stream.directoryPath.length) {
          // ensure the log directory exists
          if (!fs.existsSync(options.stream.directoryPath)) {
            fs.mkdirSync(options.stream.directoryPath);
          }

          options.stream = fileStreamRotator.getStream({
            filename: `${options.stream.directoryPath}/${options.stream.rotatingLogs.fileName}`,
            frequency: options.stream.rotatingLogs.frequency,
            verbose: options.stream.rotatingLogs.verbose,
          });
        } else {
          // throw a new error so we can catch and handle it gracefully
          throw new Error(
            'An invalid fileName or directoryPath was provided for the rotating logs option.',
          );
        }
      } else if (options.stream.fileName.length && options.stream.directoryPath.length) {
        // create the WriteStream to use for the logs
        // ensure the log directory exists
        if (!fs.existsSync(options.stream.directoryPath)) {
          fs.mkdirSync(options.stream.directoryPath);
        }

        options.stream = fs.createWriteStream(
          `${options.stream.directoryPath}/${config.log.options.stream.fileName}`,
          {
            flags: 'a',
          },
        );
      } else {
        // throw a new error so we can catch and handle it gracefully
        throw new Error('An invalid fileName or directoryPath was provided for stream option.');
      }
    } catch (err) {
      // remove the stream option
      delete options.stream;

      if (process.env.NODE_ENV !== 'test') {
        console.error();
        console.error(
          chalk.red(
            'An error has occured during the creation of the WriteStream. The stream option has been omitted.',
          ),
        );
        console.error(chalk.red(err));
        console.error();
      }
    }
  }

  return options;
}

// export the logger service
export default {
  getFormat: getLogFormat, // log format to use
  getOptions: getLogOptions, // log options to use
};
