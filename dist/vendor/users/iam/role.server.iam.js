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
const utils = __importStar(require("@helpers/utils"));
const ctrl = __importStar(require("../controllers/role.server.controller"));
const createSchema = require('../schemas/create_role.server.schema.json');
const updateSchema = require('../schemas/update_role.server.schema.json');
module.exports = {
    prefix: '/roles',
    params: [
        {
            name: 'roleId',
            middleware: ctrl.getById,
        },
    ],
    routes: [
        {
            path: '/',
            methods: {
                get: {
                    title: 'Get available roles',
                    decription: 'Returns a list of the roles available',
                    iam: 'vendor:users:roles:list',
                    parents: ['vendor:users', 'vendor:users:roles'],
                    middlewares: [ctrl.listRoles],
                },
                post: {
                    title: 'Create new role',
                    description: 'Creates new role with the given permissions',
                    iam: 'vendor:users:roles:create',
                    parents: ['vendor:users', 'vendor:users:roles'],
                    middlewares: [
                        utils.validate(createSchema),
                        ctrl.verifyExisting,
                        ctrl.verifyIams,
                        ctrl.create,
                    ],
                },
            },
        },
        {
            path: '/:roleId',
            methods: {
                get: {
                    title: 'Get a role by id',
                    description: 'returns the object of the role',
                    iam: 'vendor:users:roles:get',
                    parents: ['vendor:users', 'vendor:users:roles'],
                    middlewares: [ctrl.get],
                },
                put: {
                    title: 'Update a role',
                    description: 'Updates the role',
                    iam: 'vendor:users:roles:update',
                    parents: ['vendor:users', 'vendor:users:roles'],
                    middlewares: [utils.validate(updateSchema), ctrl.verifyIams, ctrl.update],
                },
            },
        },
    ],
};
//# sourceMappingURL=role.server.iam.js.map