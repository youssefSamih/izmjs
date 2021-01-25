/**
 * Module dependencies.
 */
import * as adminCtrls from '../controllers/admin.server.controller';

export default {
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
        /**
         * @headers
         * {
         *  "Content-Type": "application/json"
         * }
         *
         * @test
         * pm.test("The server respond with 200", () => {
         *  pm.response.to.have.status(200);
         * });
         *
         * @body
         * {
         *  "username": "{{username}}",
         *  "password": "{{password}}"
         * }
         */
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
