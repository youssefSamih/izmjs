import { ObjectId } from 'bson';
import mongoose from 'mongoose';

const Role = mongoose.model('Role');
const IAM = mongoose.model('IAM');

/**
 * fetch the Role by Id
 * @controller Role By Id
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const getById = async function getById(
  req: { role: mongoose.Document },
  res: {
    status: (arg0: number) => { (): any; new (): any; json: { (arg0: string): any; new (): any } };
  },
  next: (arg0?: undefined) => any,
  id: string | number | ObjectId,
) {
  let role;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json('Invalid ID');
  }

  try {
    role = await Role.findOne({ _id: id });
  } catch (e) {
    return next(e);
  }

  if (role === null) return res.status(404).json('not found');

  req.role = role;

  return next();
};

/**
 * Returns the Role by id
 * @controller Get one role
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const get = async function get(
  req: { role: any },
  res: {
    status: (arg0: number) => { (): any; new (): any; json: { (arg0: string): any; new (): any } };
  },
) {
  const { role } = req;

  if (role === undefined) return res.status(404).json('not found');

  return res.status(200).json(role);
};

/**
 * List all the roles
 * @controller List roles
 * @param {import('express').Request} _req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const listRoles = async function listRoles(
  _req: any,
  res: {
    status: (
      arg0: number,
    ) => {
      (): any;
      new (): any;
      json: {
        (arg0: { values: mongoose.Document[]; count: number; top: number; skip: number }): any;
        new (): any;
      };
    };
  },
  next: (arg0: any) => any,
) {
  let roles = [];

  try {
    roles = await Role.find({}, 'name');
  } catch (e) {
    return next(e);
  }

  const count = roles.length;

  roles = roles.slice(0, 10);

  return res.status(200).json({
    values: roles,
    count,
    top: 10,
    skip: 0,
  });
};

/**
 * Verify existing role
 * @controller Verify Existance
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const verifyExisting = async function verifyExisting(
  req: { body: { name: any }; t: (arg0: string) => any },
  res: {
    status: (
      arg0: number,
    ) => { (): any; new (): any; json: { (arg0: { message: any }): any; new (): any } };
  },
  next: (arg0?: undefined) => any,
) {
  const { name } = req.body;

  let exists = [];
  try {
    exists = await Role.find({ name });
  } catch (e) {
    return next(e);
  }

  if (exists.length !== 0) {
    return res.status(400).json({
      message: req.t('ROLE_ALREADY_EXISTS'),
    });
  }
  return next();
};

/**
 * Verify Iams
 * @controller Verify IAM IDs
 * @param {import('express').Request} req The request
 * @param {import('express').Response} _res The response
 * @param {Function} next Go to the next middleware
 */
export const verifyIams = async function verifyIAMs(
  req: { body: { iams: any }; roleIams: any[] },
  _res: any,
  next: (arg0?: undefined) => any,
) {
  const { iams: permissions } = req.body;

  // filter the valid object ids

  if (permissions === undefined) {
    return next();
  }

  let iams = [];

  iams = permissions.filter((el: string | number | ObjectId) =>
    mongoose.Types.ObjectId.isValid(el),
  );

  // filter existing ACLs
  try {
    iams = await IAM.find({
      _id: {
        $in: iams,
      },
      affectable: true,
    });
  } catch (e) {
    return next(e);
  }

  if (iams.length < 0) return next();

  iams = iams.map((el) => el.id);
  req.roleIams = iams;

  return next();
};

/**
 * Creates new role
 * @controller Create new role
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const create = async function create(
  req: { roleIams: any; body: any },
  res: {
    status: (
      arg0: number,
    ) => { (): any; new (): any; json: { (arg0: mongoose.Document): any; new (): any } };
  },
  next: (arg0: any) => any,
) {
  const { roleIams, body } = req;
  const { name, title, description } = body;

  let createdRole: any;
  try {
    createdRole = new Role({
      name,
      title,
      description,
      roleIams,
    });
    createdRole = await createdRole.save({ new: true });
  } catch (e) {
    return next(e);
  }

  return res.status(200).json(createdRole);
};

/**
 * Edit a role
 * @controller Edit existing role
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const update = async function update(
  req: { roleIams?: any; body?: any; role?: any },
  res: {
    status: (arg0: number) => { (): any; new (): any; json: { (arg0: any): any; new (): any } };
  },
  next: (arg0: any) => any,
) {
  const { roleIams, body } = req;
  const { title, description, name } = body;
  let { role } = req;

  if (name !== undefined) role.name = name;
  if (title !== undefined) role.title = title;
  if (description !== undefined) role.description = description;
  if (roleIams !== undefined) role.iams = roleIams;

  try {
    role = await role.save({ new: true });
  } catch (e) {
    return next(e);
  }

  return res.status(200).json(role);
};
