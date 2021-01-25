/* eslint-disable import/no-dynamic-require,global-require */

/**
 * Module dependencies.
 */
import passport from 'passport';
import mongoose from 'mongoose';
import { resolve, join } from 'path';

const User = mongoose.model('User');
const config = require('@config/index');

/**
 * Module init function.
 */
export default (app: any) => {
  // Serialize sessions
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize sessions
  passport.deserializeUser((id, done) => {
    User.findOne({
      _id: id,
    })
      .select(config.app.profile.private_attrs.map((attr: any) => `-${attr}`).join(' '))
      .exec((err, user: any) => {
        return done(err, user);
      });
  });

  // Initialize strategies
  config.utils
    .getGlobbedPaths(join(__dirname, './strategies/**/*.js'))
    .forEach((strategy: string) => {
      require(resolve(strategy))(config);
    });

  // Add passport's middleware
  app.use(passport.initialize());
  app.use(passport.session());
};
