"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ctrls = require('../controllers/main.server.controller');
exports.default = {
    prefix: '/{{{lowercase name}}}/main',
    routes: [
        {
            path: '/ok',
            methods: {
                get: {
                    iam: 'modules:{{{lowercase name}}}:main:ok',
                    title: '"{{{lowercase name}}}" is ready',
                    parents: ['modules:{{{lowercase name}}}', 'modules:{{{lowercase name}}}:main'],
                    groups: [],
                    description: 'Test if the module "modules:{{{lowercase name}}}" is up and running',
                    middlewares: [ctrls.ok],
                },
            },
        },
    ],
};
//# sourceMappingURL=main.server.iam.js.map