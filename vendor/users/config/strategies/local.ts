/**
 * Module dependencies.
 */
import passport from 'passport';
import passportLocal from 'passport-local';
import mongoose from 'mongoose';

const LocalStrategy = passportLocal.Strategy;
const User = mongoose.model('User');

export default () => {
  // Use local strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'username',
        passwordField: 'password',
      },
      (username, password, done) => {
        User.findOne(
          {
            $or: [
              {
                username: username.toLowerCase(),
              },
              {
                email: username.toLowerCase(),
              },
            ],
          },
          (err, user: any) => {
            if (err) {
              return done(err);
            }
            if (!user || !user.authenticate(password)) {
              return done(null, false);
            }

            return done(null, user);
          },
        );
      },
    ),
  );
};
