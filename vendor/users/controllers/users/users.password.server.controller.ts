/* eslint-disable import/no-dynamic-require */

/**
 * Module dependencies.
 */
import { resolve } from 'path';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { CustomPromisify, promisify } from 'util';
import { renderString } from 'nunjucks';

const config = require('@config/index');

const User = mongoose.model('User');

const { vendor } = config.files.server.modules;

/**
 * Forgot for reset password (forgot POST)
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const forgot = async function forgot(
  req: {
    body: { username: string };
    t: (arg0?: string, arg1?: { username: any } | undefined) => any;
  },
  res: {
    status: (
      arg0: number,
    ) => { (): any; new (): any; send: { (arg0: { message: any }): any; new (): any } };
    render: CustomPromisify<Function>;
    send: (arg0: { message: any }) => any;
  },
  next: (arg0: any) => any,
) {
  if (!req.body.username) {
    return res.status(422).send({
      message: req.t('USER_BLANK_USERNAME'),
    });
  }

  let user: any;

  try {
    user = await User.findOne(
      {
        $or: [
          {
            email: req.body.username.toLowerCase(),
          },
          {
            username: req.body.username.toLowerCase(),
          },
        ],
      },
      '-salt -password',
    );
  } catch (e) {
    return next(e);
  }

  if (!user) {
    return res.status(400).send({
      message: req.t('USER_USERNAME_NOT_FOUND', {
        username: req.body.username,
      }),
    });
  }

  if (user.provider !== 'local') {
    return res.status(400).send({
      message: req.t('USER_NOT_LOCAL', user.toJSON()),
    });
  }

  const token = (await promisify(crypto.randomBytes)(20)).toString('hex');

  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

  try {
    await user.save();
  } catch (e) {
    return next(e);
  }

  const render = promisify(res.render);

  try {
    const html = await render.bind(res)(resolve(`${vendor}/users/views/reset-password-email`), {
      user,
      app: config.app,
      url: renderString(config.links.resetPwd, {
        app: config.app,
        user,
        token,
      }),
    });
    user.sendMail('Password Reset', html);
  } catch (e) {
    return next(e);
  }

  return res.send({
    message: req.t('USER_EMAIL_SENT'),
  });
};

/**
 * Reset password GET from email token
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const validateResetToken = async function validateResetToken(
  req: { params: { token: any } },
  res: { redirect: (arg0: string) => void },
) {
  User.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: {
        $gt: Date.now(),
      },
    },
    (err, user) => {
      if (err || !user) {
        return res.redirect('/password/reset/invalid');
      }

      return res.redirect(`/password/reset/${req.params.token}`);
    },
  );
};

/**
 * Reset password POST from email token
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const reset = async function reset(
  req: {
    body: any;
    params: { token: any };
    t: (arg0: string) => any;
    login: (arg0: mongoose.Document, arg1: (e: any) => any) => void;
  },
  res: {
    status: (
      arg0: number,
    ) => { (): any; new (): any; send: { (arg0: { message: any }): any; new (): any } };
    json: (arg0: any) => any;
    render: (
      arg0: string,
      arg1: { name: any; appName: any },
      arg2: (err: any, emailHTML: any) => void,
    ) => any;
  },
  next: (arg0: any) => any,
) {
  // Init Variables
  const passwordDetails = req.body;
  let user: any;

  try {
    user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: {
        $gt: Date.now(),
      },
    });
  } catch (e) {
    return next(e);
  }

  if (!user) {
    return res.status(400).send({
      message: req.t('USER_NOT_FOUND'),
    });
  }

  if (passwordDetails.newPassword !== passwordDetails.verifyPassword) {
    return res.status(400).send({
      message: req.t('USER_PASSWORD_NOT_MATCH'),
    });
  }

  user.password = passwordDetails.newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  try {
    await user.save();
  } catch (e) {
    return next(e);
  }

  req.login(user, (e) => {
    if (e) {
      return next(e);
    }

    // Remove sensitive data before return authenticated user
    user.password = undefined;
    user.salt = undefined;
    user.validations = undefined;

    return res.json(
      user.toJSON({
        virtuals: true,
      }),
    );
  });

  return res.render(
    `${vendor}/users/templates/reset-password-confirm-email`,
    {
      name: user.name.full,
      appName: config.app.title,
    },
    (_err, emailHTML) => {
      if (emailHTML) {
        user.sendMail(req.t('USER_PASSWORD_CHANGED'), emailHTML);
      }
    },
  );
};

/**
 * Change Password
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const changePassword = async function changePassword(
  req: { body: any; user: { id: any }; t: (arg0: string) => any; login: CustomPromisify<Function> },
  res: {
    status: (
      arg0: number,
    ) => { (): any; new (): any; send: { (arg0: { message: any }): any; new (): any } };
    send: (arg0: { message: any }) => any;
  },
  next: (arg0: any) => any,
) {
  // Init Variables
  const passwordDetails = req.body;

  if (!req.user) {
    return res.status(401).send({
      message: req.t('USER_NOT_LOGGEDIN'),
    });
  }

  if (!passwordDetails.newPassword) {
    return res.status(422).send({
      message: req.t('USER_PASSWORD_NEW'),
    });
  }

  let user: any;
  const login = promisify(req.login).bind(req);

  try {
    user = await User.findById(req.user.id);
  } catch (e) {
    return next(e);
  }

  if (!user) {
    return res.status(400).send({
      message: req.t('USER_NOT_FOUND'),
    });
  }

  if (!user.authenticate(passwordDetails.currentPassword)) {
    return res.status(400).send({
      message: req.t('USER_PASSWORD_INCORRECT'),
    });
  }

  if (passwordDetails.newPassword !== passwordDetails.verifyPassword) {
    return res.status(400).send({
      message: req.t('USER_PASSWORD_NOT_MATCH'),
    });
  }

  user.password = passwordDetails.newPassword;

  try {
    await user.save();
    await login(user);
  } catch (e) {
    return next(e);
  }

  return res.send({
    message: req.t('USER_PASSWORD_CHANGED_SUCCESS'),
  });
};
