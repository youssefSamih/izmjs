/**
 * Module dependencies.
 */
import _ from 'lodash';
import { resolve } from 'path';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const config = require('@config/index');
const validationModule = require('@config/validations');

const { vendor } = config.files.server.modules;

// eslint-disable-next-line import/no-dynamic-require
const errorHandler = require(resolve(`./${vendor}/core/controllers/errors.server.controller`));

const User: any = mongoose.model('User');

/**
 * Update user details
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const update = async function update(
  req: { body?: any; user?: any },
  res: {
    status: (
      arg0: number,
    ) => { (): any; new (): any; send: { (arg0: { message: any }): any; new (): any } };
    json: (arg0: any) => any;
  },
) {
  // Init Variables
  let { user } = req;

  // For security measurement we sanitize the user object
  User.sanitize(req.body);

  // Merge existing user
  user.set(req.body);

  try {
    user = await user.save();
  } catch (err) {
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err),
    });
  }

  return res.json(
    user.toJSON({
      virtuals: true,
    }),
  );
};

/**
 * Get profile picture
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const getProfilePicture = async function getProfilePicture(
  req: { user: { profilePictureUrl: any } },
  res: { redirect: (arg0: any) => void },
) {
  res.redirect(req.user.profilePictureUrl);
};

/**
 * Update profile picture
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const uploadProfilePicture = async function uploadProfilePicture(
  req: { user: any; file?: any },
  res: { json: (arg0: { ok: boolean }) => any },
  next: (arg0: any) => any,
) {
  const Grid = mongoose.model('Grid');
  const { file, user } = req;
  const { file: f } = file;
  const { _id: userId } = user;
  const { _id: fId } = f;

  try {
    let gridFile: any = await Grid.findOne({
      _id: fId,
    });
    gridFile.set('metadata', {
      owner: userId,
      type: 'profile',
    });
    gridFile = await gridFile.save();

    req.user.set('picture', gridFile);
    req.user = await req.user.save();
  } catch (e) {
    return next(e);
  }

  return res.json({
    ok: true,
  });
};

/**
 * Filter the profile picture mimeTypes
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const profilePictFilter = async function profilePictFilter(
  req: { t: (arg0: string) => string | undefined },
  file: { mimetype: any },
  cb: (arg0?: Error | null, arg1?: boolean | undefined) => any,
) {
  if (config.app.profile.picture.accept.lastIndexOf(file.mimetype) < 0) {
    return cb(new Error(req.t('USER_PROFILE_PIC_INVALID')));
  }

  return cb(null, true);
};

/**
 * Send User
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const me = async function me(
  req: { query?: any; user?: any; iams?: any },
  res: { json: (arg0: any) => any },
) {
  let { $expand } = req.query;
  const { $select, $jwt } = req.query;
  const { iams = [] } = req;

  let result = req.user ? req.user.json() : null;

  if (!result) {
    return res.json(result);
  }

  const { _id: id } = result;

  if ($expand) {
    $expand = $expand.split(',').map((attr: string) => attr.trim());

    if ($expand.includes('iams')) {
      result.iams = iams.map((iam: { [x: string]: any; resource: any; permission: any }) => {
        const { resource, permission, ...toSend } = iam;
        return toSend;
      });
    }
  }

  if (!result.iams) {
    result.iams = iams.map((iam: { iam: any }) => iam.iam);
  }

  if ($select) {
    result = _.pick(result, $select.split(','), 'id');
  }

  if (config.jwt.enabled && $jwt === 'true') {
    const { key, alg, expiresIn } = config.jwt;
    result.token = jwt.sign({ u: id }, key.private, {
      algorithm: alg,
      expiresIn,
    });
  }

  return res.json(result);
};

/**
 * Confirmation
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const confirm = async function confirm(
  req: { t?: any; protocol?: any; get?: any; query?: any },
  res: {
    status: (
      arg0: number,
    ) => { (): any; new (): any; send: { (arg0: { message: any }): any; new (): any } };
    format: (arg0: {
      'text/html': () => void;
      'application/json': () => void;
      default(): void;
    }) => any;
    render: (arg0: string, arg1: { app: { name: any; url: string }; user: any }) => void;
    json: (arg0: { ok: boolean }) => void;
    send: (arg0: string) => void;
  },
) {
  let user: { save: () => any };
  const { query } = req;

  if (!query.uid) {
    return res.status(404).send({
      message: req.t('USER_NOT_FOUND'),
    });
  }

  try {
    user = await User.findById(query.uid);
  } catch (e) {
    return res.status(404).send({
      message: req.t('USER_NOT_FOUND'),
    });
  }

  if (!user) {
    return res.status(404).send({
      message: req.t('USER_NOT_FOUND'),
    });
  }

  const { utils } = validationModule;

  try {
    await utils.tryValidate(user, query.type, query.code);
  } catch (e) {
    if (e.code === 'VALIDATIONS!INVALID_CODE') {
      await user.save();
    }

    return res.status(400).send({
      message: req.t(e.code, e.data),
    });
  }

  const baseURL = `${req.protocol}://${req.get('host')}`;

  user = await user.save();

  return res.format({
    'text/html': () => {
      res.render(`${vendor}/users/views/email-confirmed`, {
        app: {
          name: config.app.title,
          url: baseURL,
        },
        user,
      });
    },
    'application/json': () => {
      res.json({
        ok: true,
      });
    },
    default() {
      res.send('Email confirmed');
    },
  });
};

/**
 * Resend the confirmation code
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const resend = async function resend(
  req: { t?: any; query?: any },
  res: {
    status: (
      arg0: number,
    ) => { (): any; new (): any; send: { (arg0: { message: any }): any; new (): any } };
    json: (arg0: { ok: boolean }) => any;
  },
) {
  let user;
  const { query } = req;

  if (!query.uid) {
    return res.status(404).send({
      message: req.t('USER_NOT_FOUND'),
    });
  }

  try {
    user = await User.findById(query.uid);
  } catch (e) {
    return res.status(404).send({
      message: req.t('USER_NOT_FOUND'),
    });
  }

  const { utils } = validationModule;

  try {
    await utils.tryNotify(user, query.type, req);
  } catch (e) {
    return res.status(400).send({
      message: req.t(e.code, {
        type: query.type,
      }),
    });
  }

  user = await user.save();

  return res.json({
    ok: true,
  });
};
