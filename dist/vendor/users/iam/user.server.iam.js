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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils = __importStar(require("@helpers/utils"));
const users_server_controller_1 = __importDefault(require("../controllers/users.server.controller"));
const update_profile_server_schema_json_1 = __importDefault(require("../schemas/update_profile.server.schema.json"));
module.exports = {
    prefix: '/me',
    routes: [
        {
            path: '/',
            methods: {
                get: {
                    parents: [
                        'vendor:users',
                        'vendor:users:user',
                        'vendor:users:user:profile',
                        'vendor:users:public',
                    ],
                    middlewares: [users_server_controller_1.default.me],
                    iam: 'vendor:users:user:profile:get',
                    title: 'Get current user details',
                    description: 'API to fetch the current user details',
                },
                post: {
                    parents: ['vendor:users', 'vendor:users:user', 'vendor:users:auth:profile'],
                    middlewares: [utils.validate(update_profile_server_schema_json_1.default), users_server_controller_1.default.update],
                    iam: 'vendor:users:user:profile:edit',
                    title: 'Update profile',
                    description: 'Update current user details',
                },
            },
        },
        {
            path: '/accounts',
            methods: {
                delete: {
                    parents: ['vendor:users', 'vendor:users:user'],
                    middlewares: [users_server_controller_1.default.removeOAuthProvider],
                    iam: 'vendor:users:user:oauth:remove',
                    title: 'Remove a social network account',
                    description: 'API to remove an linked social network account',
                },
            },
        },
        {
            path: '/picture',
            methods: {
                get: {
                    parents: ['vendor:users', 'vendor:users:user', 'vendor:users:user:profile'],
                    middlewares: [users_server_controller_1.default.getProfilePicture],
                    iam: 'vendor:users:auth:profile:picture:get',
                    title: 'Get current user profile picture',
                    description: 'API to fetch the image of the current user',
                },
            },
        },
    ],
};
//# sourceMappingURL=user.server.iam.js.map