"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const adminCtrls = __importStar(require("../controllers/admin.server.controller"));
exports.default = {
    prefix: '/users',
    params: [
        {
            name: 'userId',
            middleware: adminCtrls.userByID,
        },
    ],
    routes: [
        {
            path: '/',
            methods: {
                get: {
                    parents: ['vendor:users', 'vendor:users:admin'],
                    middlewares: [adminCtrls.list],
                    iam: 'vendor:users:admin:list',
                    title: 'List users',
                    description: 'Gérer la liste des utilisateurs',
                },
            },
        },
        {
            path: '/:userId/picture',
            methods: {
                get: {
                    parents: ['vendor:users', 'vendor:users:admin'],
                    middlewares: [
                        adminCtrls.picture,
                        adminCtrls.svg({ size: 46, color: '#d35400', fill: '#ffffff' }),
                    ],
                    iam: 'vendor:users:admin:picture',
                    title: 'Get user profile picture',
                    description: 'Get the profile picture of an existing using his identifier',
                },
            },
        },
        {
            path: '/:userId/validate',
            methods: {
                post: {
                    iam: 'modules:admin:main:users:admin',
                    title: 'Validate a user',
                    groups: [],
                    parents: ['modules:admin', 'modules:admin:users'],
                    description: 'Validate an existing user',
                    middlewares: [adminCtrls.validateUser],
                },
            },
        },
        {
            path: '/:userId',
            methods: {
                get: {
                    parents: ['vendor:users', 'vendor:users:admin'],
                    middlewares: [adminCtrls.read],
                    iam: 'vendor:users:admin:read',
                    title: 'Get user',
                    description: 'Get a specific user using his `id`',
                },
                put: {
                    parents: ['vendor:users', 'vendor:users:admin'],
                    middlewares: [adminCtrls.update],
                    iam: 'vendor:users:admin:update',
                    title: 'Update an existing user',
                    description: 'Update a specific user using his identifier',
                },
                delete: {
                    parents: ['vendor:users', 'vendor:users:admin'],
                    middlewares: [adminCtrls.remove],
                    iam: 'vendor:users:admin:delete',
                    title: 'Remove an existing user',
                    description: 'Remove a specific user using his identifier',
                },
            },
        },
    ],
};
//# sourceMappingURL=admin.server.iam.js.map