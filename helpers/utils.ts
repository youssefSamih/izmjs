import Ajv from 'ajv';
import { model } from 'mongoose';
import debugImport from 'debug';
import { resolve } from 'path';
import { readFile } from 'fs';
import { promisify } from 'util';
import ajvErrors from 'ajv-errors';
import sockets from '@config/lib/socket.io';

const debug = debugImport('boilerplate:helpers:utils');

const roleCache: any = {};
let excludeCache: any[];
const readFile$ = promisify(readFile);

type reqParams = { query: any; body: any; t: (arg0: any) => any };
type resParams = {
  status: (
    arg0: number,
  ) => {
    (): any;
    new (): any;
    json: { (arg0: { success: boolean; result: any }): any; new (): any };
  };
};

type isExcludedType = { iam: object; parents: any[] };
/**
 * Validates a payload with a given schema
 * @param {Object} schema The schema of the payload
 */
export const validate = (schema: object, type = 'body') =>
  async function validateSchema(req: reqParams, res: resParams, next: () => any) {
    const ajv = new Ajv({ allErrors: true, jsonPointers: true });
    ajvErrors(ajv);

    const validate: any = ajv.compile(schema);
    let obj;

    switch (type) {
      case 'params':
        obj = req.query;
        break;
      default:
        obj = req.body;
        break;
    }

    if (validate(obj)) {
      return next();
    }

    return res.status(400).json({
      success: false,
      result: validate.errors.map((err: { message: any; params: any }) => ({
        message: req.t(err.message),
        data: err.params,
      })),
    });
  };

/**
 * Check current user has IAM
 * @param {Object} iam the IAM to check
 */
export const hasIAM = (iam: any) =>
  async function hasIAM(
    req: { iams: any },
    res: {
      status: (
        arg0: number,
      ) => { (): any; new (): any; json: { (arg0: { message: string }): any; new (): any } };
    },
    next: (arg0: undefined) => any,
  ) {
    const IAM = model('IAM');
    const { iams } = req;
    let count;

    // Check if the permission exist in data base.
    try {
      count = await IAM.countDocuments({ iam });
    } catch (e) {
      return next(e);
    }
    if (count <= 0) return res.status(404).json({ message: `Permission(IAM) ${iam} not found` });

    // Check if the user has the permission.
    if (iams.find((el: { iam: any }) => el.iam === iam) === undefined) {
      return res.status(403).json({ message: `You don't have permission ${iam} to continue` });
    }

    return next(undefined);
  };

/**
 * Gets the base URL of the request
 * @param {IncomingMessage} req The request
 */
export const getBaseURLFromRequest = (req: { get: (arg0: string) => any; protocol: any }) => {
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  return `${protocol}://${req.get('host')}`;
};

/**
 * Create a new user that has a specific list of IAMs
 * @param {Object} credentials An object containing the username and the password
 * @param {Array} iams An array of IAM keys to affect to the current user
 * @param {String} name The name of the group to generate
 */
export const createUser = async (
  credentials = {
    username: 'username',
    password: 'jsI$Aw3$0m3',
  },
  iams = ['users:auth:signin'],
  name = 'role-tests',
  opts: any = {},
) => {
  const IAM = model('IAM');
  const User = model('User');
  const Role = model('Role');

  const list = await IAM.find({
    iam: {
      $in: iams,
    },
  });

  if (roleCache[name] && (!opts || opts.rmRole !== false)) {
    await roleCache[name].remove();
  }

  try {
    roleCache[name] = await (new Role({
      name,
      iams: list,
    }) as any).save({ new: true });
  } catch (e) {
    debug(e);
  }

  const user = await (new User({
    name: {
      first: 'Full',
      last: 'Name',
    },
    email: `${credentials.username}@example.com`,
    username: credentials.username,
    password: credentials.password,
    provider: 'local',
    roles: [name],
    validations: [
      {
        type: 'email',
        validated: true,
      },
    ],
  }) as any).save({ new: true });

  return user;
};

/**
 * Check an IAM if it is exluded or not
 * @param {Object} iam The IAM object
 */
export const isExcluded = async ({ iam, parents = [] }: isExcludedType) => {
  if (process.env.NODE_ENV === 'test') {
    return {
      found: false,
    };
  }
  if (!excludeCache) {
    let content = '';
    try {
      content = await readFile$(resolve('.api.exclude'), { encoding: 'utf8' });
    } catch (e) {
      // Ignore, just proceed
    }

    excludeCache = content
      .split('\n')
      .map((one) => one.trim())
      .filter((one) => Boolean(one) && !one.startsWith('#'));
  }

  let found = excludeCache.includes(iam);

  if (found) {
    return {
      found: true,
      reason: 'iam',
      data: iam,
    };
  }

  found = excludeCache.find((one) => parents.includes(one));

  if (found) {
    return {
      found: true,
      reason: 'parent',
      data: found,
    };
  }

  return {
    found: false,
  };
};

/**
 * Add an IAM to roles
 * @param { String } iamName The iam name
 * @param { Array[String] } roles List of roles
 * @param { Number } tries Number of tries
 */
export const addIamToRoles = async (iamName: any, roles = ['guest', 'user'], tries = 100) => {
  const Role = model('Role');
  const Iam = model('IAM');

  let iam = await Iam.findOne({ iam: iamName });
  let counter = tries;

  const interval = setInterval(async () => {
    if (iam) {
      const { _id: id } = iam;
      roles.map(async (r) => {
        try {
          await Role.findOneAndUpdate(
            {
              name: r,
            },
            {
              $addToSet: {
                iams: id,
              },
            },
          );
        } catch (e) {
          // Do nothing, just proceed
        }
      });
    }

    if (iam || counter === 0) {
      clearInterval(interval);
      return;
    }

    iam = await Iam.findOne({ iam: iamName });
    counter -= 1;
  }, 100);
};

export const getIO = () => (sockets as any).io;
