/**
 * Module dependencies.
 */

import users from '../controllers/users.server.controller';
export default {
  prefix: '/auth',
  routes: [
    {
      path: '/forgot',
      methods: {
        /**
         * @body
         * {
         *  "username": "{{email}}"
         * }
         */
        post: {
          parents: ['vendor:users', 'vendor:users:auth', 'vendor:users:public'],
          middlewares: [users.forgot],
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
          middlewares: [users.validateResetToken],
          iam: 'vendor:users:auth:passwd:validate-token',
          title: 'Reset password page',
          description: 'Redirect the user to the right page to change his password',
        },
        /**
         * @body
         * {
         *   "newPassword": "P@$$w0rd",
         *   "verifyPassword": "P@$$w0rd"
         * }
         */
        post: {
          parents: ['vendor:users', 'vendor:users:auth', 'vendor:users:public'],
          middlewares: [users.reset],
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
          middlewares: [users.changePassword],
          iam: 'vendor:users:passwd:change',
          title: 'Change current user password',
          description: 'API to change the current user password',
        },
      },
    },
    {
      path: '/signup',
      methods: {
        /**
         * @body
         * {
         *   "name": {
         *     "first": "{{firstname}}",
         *     "last": "{{lastname}}"
         *   },
         *   "email": "{{email}}",
         *   "password": "{{password}}",
         *   "username": "{{username}}",
         *   "phone": "{{phone}}"
         * }
         *
         * @test
         * pm.test("Status code is 200", function () {
         *   pm.response.to.have.status(200);
         *   const json = pm.response.json();
         *   pm.environment.set("userId", json._id);
         * });
         */
        post: {
          parents: ['vendor:users', 'vendor:users:auth', 'vendor:users:public'],
          middlewares: [users.signup, users.me],
          iam: 'vendor:users:auth:signup',
          title: 'Signup',
          description: 'Sign up a new user',
        },
      },
    },
    {
      path: '/signin',
      methods: {
        /**
         * @body
         * {
         *   "username": "{{username}}",
         *   "password": "{{password}}"
         * }
         *
         * @params
         * [{
         *   "key": "$select",
         *   "value": "name,iams",
         *   "description": "Attributes to select"
         * }, {
         *   "key": "$jwt",
         *   "value": "false",
         *   "description": "Return or not a jwt token"
         * }]
         *
         * @test
         * pm.test("Status code is 200", function () {
         *   pm.response.to.have.status(200);
         *   const json = pm.response.json();
         *   pm.environment.set("userId", json._id);
         * });
         */
        post: {
          parents: ['vendor:users', 'vendor:users:auth', 'vendor:users:public'],
          middlewares: [users.signin, users.me],
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
          middlewares: [users.signout],
          iam: 'vendor:users:auth:signout',
          title: 'Signout',
          description: 'Signout the current user',
        },
      },
    },
    {
      path: '/confirm',
      methods: {
        /**
         * @params
         * [{
         *   "key": "type",
         *   "value": "email",
         *   "description": "Specify the code type. the application supports two types: 'email' and 'phone'"
         * }, {
         *   "key": "uid",
         *   "value": "{{userId}}",
         *   "description": "The user ID"
         * }, {
         *   "key": "code",
         *   "value": "{{code}}",
         *   "description": "the code"
         * }]
         */
        get: {
          parents: ['vendor:users', 'vendor:users:auth', 'vendor:users:public'],
          middlewares: [users.confirm],
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
          middlewares: [users.resend],
          iam: 'vendor:users:auth:code:resend',
          title: 'Resend code',
          description: 'Resend an automatically generated code',
        },
      },
    },
  ],
};
