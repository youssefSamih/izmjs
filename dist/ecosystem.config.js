"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    apps: [
        {
            name: 'api',
            script: 'app.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development',
            },
            env_production: {
                NODE_ENV: 'production',
            },
        },
    ],
};
//# sourceMappingURL=ecosystem.config.js.map