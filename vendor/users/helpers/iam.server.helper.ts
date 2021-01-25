import mongoose from 'mongoose';
import newDebug from 'debug';

const pathToRegexp = require('path-to-regexp');
const debug = newDebug('modules:users:helpers:iam');

class Iam {
  IamModel: mongoose.Model<mongoose.Document, {}>;
  RoleModel: any;

  constructor() {
    this.IamModel = mongoose.model('IAM');
    this.RoleModel = mongoose.model('Role');
  }

  async allow(resource: any, permission: any, iam: any, opts: any = {}) {
    const { title, module, groups, parents, description } = opts;
    const regex = pathToRegexp(resource).toString();
    const obj: any = {
      resource: regex.substr(1, regex.length - 3),
      permission,
      iam,
    };

    if (typeof opts.excluded === 'boolean') {
      obj.excluded = opts.excluded;
    }

    if (typeof opts.affectable === 'boolean') {
      obj.affectable = opts.affectable;
    }

    if (typeof opts.system === 'boolean') {
      obj.system = opts.system;
    }

    if (typeof title === 'string') {
      obj.title = title;
    }

    if (typeof description === 'string') {
      obj.description = description;
    }

    if (typeof module === 'string') {
      obj.module = module;
    }

    if (Array.isArray(groups) && groups.length > 0) {
      obj.groups = groups
        .filter((g) => Boolean(g) && typeof g === 'string')
        .map((g) => g.trim().toLowerCase().replace(/\s+/g, ' ').replace(/ /g, '-'));

      obj.groups = obj.groups.filter((g: any, index: any) => obj.groups.indexOf(g) === index);
    }

    let one: any;

    try {
      one = await this.IamModel.findOneAndUpdate({ iam }, obj, {
        upsert: true,
        setDefaultsOnInsert: true,
        new: true,
      });
    } catch (e) {
      debug('Database Error', e);
    }

    if (Array.isArray(parents)) {
      const { _id: id } = one;
      const list = parents
        .filter((g, index) => Boolean(g) && typeof g === 'string' && parents.indexOf(g) === index)
        .map((g) =>
          this.IamModel.findOneAndUpdate(
            { iam: g },
            {
              iam: g,
              $addToSet: {
                children: id,
              },
            },
            {
              upsert: true,
              setDefaultsOnInsert: true,
              new: true,
            },
          ),
        );

      try {
        await Promise.all(list);
      } catch (e) {
        debug('Database Error');
      }
    }

    return this;
  }

  async IAMsFromRoles(roles = []) {
    try {
      let iams = await this.RoleModel.getIAMs(roles);

      // Flatten the IAMs
      iams = iams.map((iam: { toJSON: (arg0: { virtuals: boolean }) => any }) =>
        iam.toJSON({
          virtuals: true,
        }),
      );

      return iams;
    } catch (e) {
      return [];
    }
  }

  async areAnyIamAllowed(iams = [], resource: any, permission: any) {
    try {
      const isYes = await this.IamModel.findOne({
        iam: {
          $in: iams,
        },
        resource,
        permission,
      });
      return !!isYes;
    } catch (e) {
      return false;
    }
  }

  async areAnyIamIdAllowed(iamIDs = [], resource: any, permission: any) {
    try {
      const isYes = await this.IamModel.findOne({
        _id: {
          $in: iamIDs,
        },
        resource,
        permission,
      });
      return !!isYes;
    } catch (e) {
      return false;
    }
  }

  async areAnyRoleAllowed(roles = [], resource: any, permission: any) {
    // Find the IAMs of selected roles
    const iams = await this.IAMsFromRoles(roles);

    // Get IAMs by ID
    const isYes = await this.IamModel.findOne({
      _id: {
        $in: iams,
      },
      resource,
      permission,
    });
    return !!isYes;
  }
}

export default Iam;
