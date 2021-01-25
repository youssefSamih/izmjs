/**
 * Module dependencies.
 */
import { ObjectId } from 'bson';
import mongoose from 'mongoose';

const User = mongoose.model('User');

/**
 * User middleware
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const userByID = async function userByID(
  req: { t: (arg0: string, arg1: { id: any }) => string | undefined; profile: mongoose.Document },
  res: {
    status: (
      arg0: number,
    ) => { (): any; new (): any; send: { (arg0: { message: any }): any; new (): any } };
  },
  next: (arg0?: mongoose.NativeError | undefined) => void,
  id: string | number | ObjectId,
) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: req.t('USER_INVALID', {
        id,
      }),
    });
  }

  return User.findOne({
    _id: id,
  }).exec((err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(
        new Error(
          req.t('USER_LOAD_FAILED', {
            id,
          }),
        ),
      );
    }

    req.profile = user;
    return next();
  });
};
