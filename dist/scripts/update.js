#! /usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const glob_1 = require("glob");
const path_1 = require("path");
const util_1 = require("util");
const child_process_1 = require("child_process");
const glob$ = util_1.promisify(glob_1.glob);
(async () => {
    const REGEX = /^--(.*)=(.*)$/;
    const args = {};
    process.argv.forEach((arg) => {
        const exec = REGEX.exec(arg);
        if (exec) {
            const [, name, value] = exec;
            args[name] = value;
        }
    });
    const pattern = args.only === 'git' ? './modules/*/.git' : './modules/*/package.json';
    let dirs = (await glob$(pattern)).map((dir) => dir.substr(0, dir.lastIndexOf('/')));
    dirs.unshift('.');
    dirs = dirs.map(async (dir) => new Promise((fnResolve, fnReject) => {
        const cmd = child_process_1.spawn(path_1.resolve(__dirname, './modules-tools.sh'), [args.cmd || 'npm-update'], {
            cwd: dir,
            stdio: 'inherit',
        });
        cmd.on('close', fnResolve);
        cmd.on('error', fnReject);
    }));
    await Promise.all(dirs);
})();
//# sourceMappingURL=update.js.map