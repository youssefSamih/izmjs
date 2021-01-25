"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const users_server_controller_1 = __importDefault(require("../controllers/users.server.controller"));
exports.default = {
    prefix: '/auth',
    routes: [
        {
            path: '/forgot',
            methods: {
                post: {
                    parents: ['vendor:users', 'vendor:users:auth', 'vendor:users:public'],
                    middlewares: [users_server_controller_1.default.forgot],
                    iam: 'vendor:users:auth:passwd:forgotten',
                    title: 'Request Reset Link',
                    description: 'Generate a reset password link and send it to the user',
                },
            },
        },
        {
            path: '/reset/:token',
            methods: {
                get: {
                    parents: ['vendor:users', 'vendor:users:auth', 'vendor:users:public'],
                    middlewares: [users_server_controller_1.default.validateResetToken],
                    iam: 'vendor:users:auth:passwd:validate-token',
                    title: 'Reset password page',
                    description: 'Redirect the user to the right page to change his password',
                },
                post: {
                    parents: ['vendor:users', 'vendor:users:auth', 'vendor:users:public'],
                    middlewares: [users_server_controller_1.default.reset],
                    iam: 'vendor:users:auth:passwd:reset',
                    title: 'Reset password',
                    description: 'Change a user password using a valid reset password token',
                },
            },
        },
        {
            path: '/password',
            methods: {
                post: {
                    parents: ['vendor:users', 'vendor:users:auth'],
                    middlewares: [users_server_controller_1.default.changePassword],
                    iam: 'vendor:users:passwd:change',
                    title: 'Change current user password',
                    description: 'API to change the current user password',
                },
            },
        },
        {
            path: '/signup',
            methods: {
                post: {
                    parents: ['vendor:users', 'vendor:users:auth', 'vendor:users:public'],
                    middlewares: [users_server_controller_1.default.signup, users_server_controller_1.default.me],
                    iam: 'vendor:users:auth:signup',
                    title: 'Signup',
                    description: 'Sign up a new user',
                },
            },
        },
        {
            path: '/signin',
            methods: {
                post: {
                    parents: ['vendor:users', 'vendor:users:auth', 'vendor:users:public'],
                    middlewares: [users_server_controller_1.default.signin, users_server_controller_1.default.me],
                    iam: 'vendor:users:auth:signin',
                    title: 'Signin',
                    description: 'Sign in an existing user',
                },
            },
        },
        {
            path: '/signout',
            methods: {
                get: {
                    parents: ['vendor:users', 'vendor:users:auth'],
                    middlewares: [users_server_controller_1.default.signout],
                    iam: 'vendor:users:auth:signout',
                    title: 'Signout',
                    description: 'Signout the current user',
                },
            },
        },
        {
            path: '/confirm',
            methods: {
                get: {
                    parents: ['vendor:users', 'vendor:users:auth', 'vendor:users:public'],
                    middlewares: [users_server_controller_1.default.confirm],
                    iam: 'vendor:users:auth:code:confirm',
                    title: 'Confirm code',
                    description: 'Confirm an automatically generated code',
                },
            },
        },
        {
            path: '/resend',
            methods: {
                get: {
                    parents: ['vendor:users', 'vendor:users:auth', 'vendor:users:public'],
                    middlewares: [users_server_controller_1.default.resend],
                    iam: 'vendor:users:auth:code:resend',
                    title: 'Resend code',
                    description: 'Resend an automatically generated code',
                },
            },
        },
    ],
};
//# sourceMappingURL=auth.server.iam.js.map