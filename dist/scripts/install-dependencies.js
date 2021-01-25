#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const os_1 = require("os");
['modules', 'vendor'].forEach((base) => {
    const lib = path_1.resolve(__dirname, '..', base);
    fs_1.readdirSync(lib).forEach((mod) => {
        const modPath = path_1.join(lib, mod);
        if (!fs_1.existsSync(path_1.join(modPath, 'package.json'))) {
            return false;
        }
        const npmCmd = os_1.platform().startsWith('win') ? 'npm.cmd' : 'npm';
        child_process_1.spawn(npmCmd, ['i'], { env: process.env, cwd: modPath, stdio: 'inherit' });
        return true;
    });
});
//# sourceMappingURL=install-dependencies.js.map