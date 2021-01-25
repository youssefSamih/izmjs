/**
 * Module dependencies.
 */
import mongoose from 'mongoose';
import passport from 'passport';

const User: any = mongoose.model('User');

const validationsHelper = require('@config/validations');
const errorHandler = require('@vendor/core/controllers/errors.server.controller');
const config = require('@config/index');

// URLs for which user can't be redirected on signin
const noReturnUrls = ['/authentication/signin', '/authentication/signup'];

/**
 * Signup
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const signup = async function signup(
  req: { body: any; t: (arg0?: string) => any; user: any },
  res: {
    status: (
      arg0: number,
    ) => { (): any; new (): any; json: { (arg0: { message: any }): any; new (): any } };
  },
  next: (arg0?: undefined) => any,
) {
  // For security measurement we sanitize the user object
  const b = User.sanitize(req.body);

  // Init Variables
  const user = new User(b);
  const { hooks } = validationsHelper;

  await hooks.onInit(user);

  // Add missing user fields
  user.provider = 'local';

  try {
    await user.save();
    hooks.onSignup(user, req);
    await user.save();
  } catch (err) {
    switch (true) {
      case err.code === 11000:
        return res.status(400).json({
          message: req.t('USER_ALREADY_EXISTS'),
        });
      case err.name === 'ValidationError':
        return res.status(400).json({
          message: err.message,
        });
      default:
        return next(err);
    }
  }

  req.user = user;

  return next();
};

/**
 * Signin after passport authentication
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const signin = async function signin(
  req: {
    t: (arg0?: string, arg1?: undefined) => any;
    login: (arg0: any, arg1: (err_: any) => Promise<any>) => any;
  },
  res: {
    status: (
      arg0: number,
    ) => {
      (): any;
      new (): any;
      json: { (arg0: { ok: boolean; message: any }): any; new (): any };
      send: { (arg0: any): any; new (): any };
    };
  },
  next: (arg0: null) => any,
) {
  passport.authenticate('local', (err, user /* , info */) => {
    if (err || !user) {
      return res.status(401).json({
        ok: false,
        message: req.t('WRONG_CREDENTIALS'),
      });
    }

    const { utils, hooks } = validationsHelper;

    try {
      utils.isValidated(user);
    } catch (err_) {
      return res.status(401).json({
        message: req.t(err_.code, err_.data),
        ok: false,
      });
    }

    return req.login(user, async (err_: any) => {
      if (err_) {
        return res.status(400).send(err_);
      }

      await hooks.onLogin(req, user);

      return next(null);
    });
  })(req, res, next);
};

/**
 * Signout
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const signout = async function signout(
  req: { logout: () => void },
  res: { redirect: (arg0: any) => void },
) {
  req.logout();
  res.redirect(config.app.pages.login || '/');
};

/**
 * OAuth provider call
 */
export const oauthCall = (
  strategy: string | string[] | passport.Strategy,
  scope: ((...args: any[]) => any) | undefined,
) =>
  async function oauthCall(
    req: { query: { redirect_to: string }; session: { redirect_to: any } },
    res: any,
    next: any,
  ) {
    // Set redirection path on session.
    // Do not redirect to a signin or signup page
    if (noReturnUrls.indexOf(req.query.redirect_to) === -1) {
      req.session.redirect_to = req.query.redirect_to;
    }
    // Authenticate
    passport.authenticate(strategy, scope)(req, res, next);
  };

/**
 * OAuth callback
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const oauthCallback = (strategy: string | string[] | passport.Strategy) =>
  async function oauthCall(
    req: { session: { redirect_to: any }; login: (arg0: any, arg1: (err_: any) => any) => any },
    res: { redirect: (arg0: string) => any },
    next: any,
  ) {
    // Pop redirect URL from session
    const sessionRedirectURL = req.session.redirect_to;
    delete req.session.redirect_to;

    passport.authenticate(strategy, (err, user, redirectURL) => {
      if (err) {
        return res.redirect(
          `/authentication/signin?err=${encodeURIComponent(errorHandler.getErrorMessage(err))}`,
        );
      }

      if (!user) {
        return res.redirect('/authentication/signin');
      }

      return req.login(user, (err_: any) => {
        if (err_) {
          return res.redirect('/authentication/signin');
        }

        return res.redirect(redirectURL || sessionRedirectURL || '/');
      });
    })(req, res, next);
  };

/**
 * Helper function to save or update a OAuth user profile
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const saveOAuthUserProfile = (
  req: { user: any; t: (arg0: string) => string | undefined },
  providerUserProfile: {
    providerIdentifierField: string | number;
    provider: string | number;
    providerData: { [x: string]: any };
    username: any;
    email: string;
    firstName: any;
    lastName: any;
    profilePictureUrl: any;
  },
  done: (arg0?: Error, arg1?: undefined, arg2?: string | undefined) => any,
) => {
  if (!req.user) {
    // Define a search query fields
    const smpif = `providerData.${providerUserProfile.providerIdentifierField}`;
    const sapif = `additionalProvidersData.${providerUserProfile.provider}.${providerUserProfile.providerIdentifierField}`;

    // Define main provider search query
    const msq: any = {};
    msq.provider = providerUserProfile.provider;
    msq[smpif] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

    // Define additional provider search query
    const apsq: any = {};
    apsq[sapif] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

    // Define a search query to find existing user with current provider profile
    const searchQuery = {
      $or: [msq, apsq],
    };

    User.findOne(searchQuery, (err: any, user: any) => {
      if (err) {
        return done(err);
      }

      if (!user) {
        const possibleUsername =
          providerUserProfile.username ||
          (providerUserProfile.email ? providerUserProfile.email.split('@')[0] : '');

        return User.findUniqueUsername(possibleUsername, null, () => {
          const userTmp = new User({
            name: {
              first: providerUserProfile.firstName,
              last: providerUserProfile.lastName,
            },
            email: providerUserProfile.email,
            profilePictureUrl: providerUserProfile.profilePictureUrl,
            provider: providerUserProfile.provider,
            providerData: providerUserProfile.providerData,
          });

          // And save the user
          userTmp.save((err_: any) => done(err_, userTmp));
        });
      }

      return done(err, user);
    });
  } else {
    // User is already logged in, join the provider data to the existing user
    const userTmp = req.user;

    // Check if user exists, is not signed in using this provider, and doesn't
    // have that provider data already configured
    if (
      userTmp.provider !== providerUserProfile.provider &&
      (!userTmp.additionalProvidersData ||
        !userTmp.additionalProvidersData[providerUserProfile.provider])
    ) {
      // Add the provider data to the additional provider data field
      if (!userTmp.additionalProvidersData) {
        userTmp.additionalProvidersData = {};
      }

      userTmp.additionalProvidersData[providerUserProfile.provider] =
        providerUserProfile.providerData;

      // Then tell mongoose that we've updated the additionalProvidersData field
      userTmp.markModified('additionalProvidersData');

      // And save the user
      userTmp.save((err: any) => done(err, userTmp, '/settings/accounts'));
    } else {
      return done(new Error(req.t('USER_PROVIDER_ALREADY_CONNECTED')), req.user);
    }
  }

  return null;
};

/**
 * Remove OAuth provider
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const removeOAuthProvider = async function removeOAuthProvider(
  req: { query?: any; t?: any; login?: any; user?: any },
  res: {
    status: (
      arg0: number,
    ) => {
      (): any;
      new (): any;
      json: { (arg0: { message: any }): any; new (): any };
      send: { (arg0?: { message: any } | undefined): any; new (): any };
    };
    json: (arg0: any) => any;
  },
) {
  const { user } = req;
  const { provider } = req.query;

  if (!user) {
    return res.status(401).json({
      message: req.t('USER_NOT_LOGGEDIN'),
    });
  }
  if (!provider) {
    return res.status(400).send();
  }

  // Delete the additional provider
  if (user.additionalProvidersData[provider]) {
    delete user.additionalProvidersData[provider];

    // Then tell mongoose that we've updated the additionalProvidersData field
    user.markModified('additionalProvidersData');
  }

  return user.save((err: any) => {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    return req.login(user, (err_: any) => {
      if (err_) {
        return res.status(400).send(err_);
      }

      return res.json(
        user.toJSON({
          virtuals: true,
        }),
      );
    });
  });
};
