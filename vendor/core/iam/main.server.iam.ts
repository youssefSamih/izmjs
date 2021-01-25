/**
 * Module dependencies.
 */

import * as ctrls from '../controllers/checks.server.controller';

export default {
  prefix: '',
  routes: [
    {
      path: '/ok',
      methods: {
        get: {
          middlewares: [ctrls.ok],
          iam: 'core:checks:ok',
          title: 'Check if the app is up and running',
          description: 'API to check if the application is accessible',
          affectable: false,
        },
      },
    },
  ],
};
