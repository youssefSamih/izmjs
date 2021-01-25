import { resolve } from 'path';
import { platform } from 'os';
import ora from 'ora';

const spawn = require('child_process');
const npmCmd = platform().startsWith('win') ? 'npm.cmd' : 'npm';
const spinner = ora('Installing NPM dependencies');

const spawn$ = (...args: any) =>
  new Promise((fnResolve, fnReject) => {
    const cmd = spawn(...args);
    cmd.on('close', fnResolve);
    cmd.on('error', fnReject);
  });

function camelize(str: string) {
  return str.replace(/\W+(.)/g, (_match, chr) => chr.toUpperCase());
}

function lowercase(str: string) {
  if (str && typeof str === 'string') {
    return str.toLocaleLowerCase();
  }
  return str;
}

function getKey(txt: string) {
  return typeof txt === 'string' && txt.match(/[- ]/) ? `'${txt}'` : txt;
}

export default (plop: {
  setGenerator: (
    arg0: string,
    arg1: {
      description: string;
      prompts: (
        | { type: string; name: string; message: string; default?: undefined }
        | { type: string; name: string; default: boolean; message: string }
      )[];
      actions: (
        | ((
            answers: any,
          ) => Promise<'Git has been ignored' | 'Git repository has been initialized'>)
        | ((
            answers: any,
          ) => Promise<'Dependencies are ignored' | 'Dependencies installed successfully'>)
        | {
            type: string;
            templateFiles: string;
            destination: string;
            skipIfExists: boolean;
            base: string;
            globOptions: { dot: boolean };
          }
      )[];
    },
  ) => void;
  setHelper: (
    arg0: string,
    arg1: {
      (str: string): string;
      (options: any): any;
      (txt: string): string;
      (str: string): string;
    },
  ) => void;
}) => {
  // controller generator
  plop.setGenerator('module', {
    description: 'Create new module',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Choose a name',
      },
      {
        type: 'confirm',
        name: 'git',
        default: false,
        message: 'Init git repository',
      },
      {
        type: 'confirm',
        default: false,
        name: 'install',
        message: 'Install dependencies',
      },
    ],
    actions: [
      {
        type: 'addMany',
        templateFiles: 'plop/module/**/*!(*.hbs)',
        destination: 'modules/{{{lowercase name}}}',
        skipIfExists: true,
        base: 'plop/module',
        globOptions: {
          dot: true,
        },
      },
      async (answers) => {
        if (answers.git !== true) {
          return 'Git has been ignored';
        }
        console.info('Initializing git repository');
        try {
          await spawn$('git', ['init'], {
            cwd: resolve('modules', answers.name),
            detached: true,
            stdio: 'inherit',
          });
        } catch (e) {
          console.error(e);
        }
        return 'Git repository has been initialized';
      },
      async (answers) => {
        if (answers.install !== true) {
          return 'Dependencies are ignored';
        }

        spinner.start();
        await spawn$(npmCmd, ['install'], {
          cwd: resolve('modules', answers.name),
          detached: true,
          stdio: 'ignore',
        });
        spinner.stop();
        return 'Dependencies installed successfully';
      },
    ],
  });

  // Create the camelize helper
  plop.setHelper('camelize', camelize);
  plop.setHelper('raw-helper', (options: any) => options.fn());
  plop.setHelper('get-key', getKey);
  plop.setHelper('lowercase', lowercase);
};
