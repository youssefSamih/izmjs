#! /usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const child_process_1 = require("child_process");
(() => {
    if (!process.env.npm_config_argv) {
        console.log('This is meant to be run from within npm script.');
        return;
    }
    const { platform } = process;
    const platformSpecific = child_process_1.spawn(platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'test:prefix', path_1.resolve('tests/\\*\\*/\\*.test.js')], {
        shell: true,
        stdio: 'inherit',
        cwd: path_1.resolve(__dirname, '..'),
    });
    platformSpecific.on('exit', (code) => process.exit(code));
})();
//# sourceMappingURL=run-tests.js.map