/**
 * Module dependencies.
 */
const _ = require('lodash');

/**
 * Extend user's controller
 */
export default _.extend(
  require('./users/users.authentication.server.controller'),
  require('./users/users.authorization.server.controller'),
  require('./users/users.password.server.controller'),
  require('./users/users.profile.server.controller'),
);
