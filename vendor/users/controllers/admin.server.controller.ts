/**
 * Module dependencies.
 */
import { resolve } from 'path';
import mongoose from 'mongoose';
import { ObjectId } from 'bson';

const config = require('@config/index');

const User = mongoose.model('User');

const { vendor } = config.files.server.modules;

// eslint-disable-next-line import/no-dynamic-require
const errorHandler = require(resolve(`./${vendor}/core/controllers/errors.server.controller`));

/**
 * Validate an existing user
 * @controller ValidateUser
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const validateUser = async function validateUser(
  req: { entity: any },
  res: { status: (arg0: number) => { (): any; new (): any; end: { (): any; new (): any } } },
  next: (arg0: any) => any,
) {
  const { entity } = req;

  entity.validations.set(
    'validations',
    entity.validations.map((v: { type: string }) =>
      v.type === 'admin' ? { ...v, validated: true } : v,
    ),
  );

  try {
    await entity.save();
  } catch (e) {
    return next(e);
  }

  return res.status(204).end();
};

/**
 * Read a single user infos
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const read = async function read(
  req: { model: { toJSON: (arg0: { virtuals: boolean }) => any } },
  res: { json: (arg0: any) => void },
) {
  res.json(
    req.model.toJSON({
      virtuals: true,
    }),
  );
};

/**
 * Send the profile picture of a specific user
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const picture = async function picture(
  req: { model: any },
  res: { redirect: (arg0: string) => any },
  next: () => any,
) {
  const { model } = req;
  const { picture: pic } = model;

  if (!pic) {
    return next();
  }

  return res.redirect(`${config.app.prefix}/files/${pic}/view?size=300x300`);
};

/**
 * Update a User
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const update = async function update(
  req: { model: any; body: { name: any; roles: any } },
  res: {
    status: (
      arg0: number,
    ) => { (): any; new (): any; send: { (arg0: { message: any }): any; new (): any } };
    json: (arg0: any) => any;
  },
) {
  const user = req.model;

  // For security purposes only merge these parameters
  user.name = {
    ...user.name,
    ...req.body.name,
  };

  if (Array.isArray(req.body.roles)) {
    user.roles = req.body.roles;
  }

  try {
    await user.save();
  } catch (e) {
    return res.status(400).send({
      message: errorHandler.getErrorMessage(e),
    });
  }

  return res.json(
    user.toJSON({
      virtuals: true,
    }),
  );
};

/**
 * Delete a user
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const remove = async function remove(
  req: { model: any },
  res: {
    status: (
      arg0: number,
    ) => {
      (): any;
      new (): any;
      send: { (arg0: { message: any }): any; new (): any };
      end: { (): any; new (): any };
    };
  },
) {
  const user = req.model;

  user.remove((err: any) => {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err),
      });
    }

    return res.status(204).end();
  });
};

/**
 * Return an svg image from the user
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const svg = ({ size = 46, color = '#d35400', fill = '#ffffff' }) =>
  async function svg(
    req: { model: any },
    res: {
      set: (arg0: string, arg1: string) => void;
      render: (arg0: string, arg1: { text: any; size: number; color: string; fill: string }) => any;
    },
  ) {
    const { model } = req;
    const { name } = model;
    const { full } = name;
    const text = full
      .split(' ')
      .map((n: string) => n.charAt(0))
      .join('');

    res.set('Content-Type', 'image/svg+xml');
    return res.render(resolve(__dirname, '../views/profile-picture.server.view.swig'), {
      text,
      size,
      color,
      fill,
    });
  };

/**
 * List of Users
 */
export const list = async function list(
  req: { query: { $filter?: '' | undefined; $top: any; $skip: any } },
  res: { json: (arg0: any) => any },
  next: (arg0: any) => any,
) {
  const { $filter = '', $top: top, $skip: skip } = req.query;
  const private_attrs = config.app.profile.private_attrs || [];
  const findObj = $filter ? { $text: { $search: $filter } } : {};

  try {
    const json = await (User.find(findObj, {
      score: { $meta: 'textScore' },
    })
      .select(private_attrs.map((attr: any) => `-${attr}`).join(' '))
      .sort({ score: { $meta: 'textScore' } }) as any).paginate({ top, skip });

    json.value = json.value.map((u: { toJSON: (arg0: { virtuals: boolean }) => any }) =>
      u.toJSON({ virtuals: true }),
    );

    return res.json(json);
  } catch (e) {
    return next(e);
  }
};

/**
 * Get user by ID
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const userByID = async function userByID(
  req: { t: (arg0: string, arg1: { id: any }) => any; model: mongoose.Document },
  res: {
    status: (
      arg0: number,
    ) => {
      (): any;
      new (): any;
      send: { (arg0: { message: any }): any; new (): any };
      json: { (arg0: { message: any }): void; new (): any };
    };
  },
  next: (arg0?: mongoose.NativeError | undefined) => void,
  id: string | number | ObjectId,
) {
  const private_attrs = config.app.profile.private_attrs || [];

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: req.t('USER_INVALID', {
        id,
      }),
    });
  }

  return User.findById(id, private_attrs.map((attr: any) => `-${attr}`).join(' ')).exec(
    (err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(404).json({
          message: req.t('USER_LOAD_FAILED', {
            id,
          }),
        });
      }

      req.model = user;
      return next();
    },
  );
};
