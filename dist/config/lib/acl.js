"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const guest = ['vendor:users:public'];
const user = [
    'vendor:users:user',
    'vendor:users:auth',
];
const admin = [
    ...user,
    'vendor:users:admin',
    'vendor:users:roles',
];
exports.default = [
    {
        name: 'guest',
        protected: true,
        title: 'Guest role',
        description: "Role given for any unauthenticated user, or users who don't have any role.",
        iams: guest,
    },
    {
        name: 'user',
        protected: true,
        iams: user,
        title: 'User role',
        description: 'The default role.',
    },
    {
        name: 'admin',
        protected: true,
        iams: admin,
        title: 'Admin role',
        description: 'Given to advanced users.',
    },
];
//# sourceMappingURL=acl.js.map