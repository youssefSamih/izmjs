"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const os_1 = require("os");
const ora_1 = __importDefault(require("ora"));
const spawn = require('child_process');
const npmCmd = os_1.platform().startsWith('win') ? 'npm.cmd' : 'npm';
const spinner = ora_1.default('Installing NPM dependencies');
const spawn$ = (...args) => new Promise((fnResolve, fnReject) => {
    const cmd = spawn(...args);
    cmd.on('close', fnResolve);
    cmd.on('error', fnReject);
});
function camelize(str) {
    return str.replace(/\W+(.)/g, (_match, chr) => chr.toUpperCase());
}
function lowercase(str) {
    if (str && typeof str === 'string') {
        return str.toLocaleLowerCase();
    }
    return str;
}
function getKey(txt) {
    return typeof txt === 'string' && txt.match(/[- ]/) ? `'${txt}'` : txt;
}
exports.default = (plop) => {
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
                        cwd: path_1.resolve('modules', answers.name),
                        detached: true,
                        stdio: 'inherit',
                    });
                }
                catch (e) {
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
                    cwd: path_1.resolve('modules', answers.name),
                    detached: true,
                    stdio: 'ignore',
                });
                spinner.stop();
                return 'Dependencies installed successfully';
            },
        ],
    });
    plop.setHelper('camelize', camelize);
    plop.setHelper('raw-helper', (options) => options.fn());
    plop.setHelper('get-key', getKey);
    plop.setHelper('lowercase', lowercase);
};
//# sourceMappingURL=plopfile.js.map