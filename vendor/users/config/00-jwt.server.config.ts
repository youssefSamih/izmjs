import { model, Types } from 'mongoose';
import jwt from 'jsonwebtoken';
const { jwt: config } = require('@config/index');

const User = model('User');

/**
 * Module init function.
 */
export default (app: { use: (arg0: (req: any, res: any, next: any) => Promise<any>) => void }) => {
  if (!config.enabled) {
    return false;
  }

  const { public: pub, private: pr } = config.key;

  app.use(
    /**
     * @param {import('express').Request} req The request
     * @param {import('express').Response} _res The response
     * @param {import('express').NextFunction} next Go to next middleware
     */
    async function onRequest(req, _res, next) {
      let decoded: any;
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return next();
      }

      const [type, token] = authHeader.split(' ');

      if (type !== 'Bearer' || !token) {
        return next();
      }

      try {
        decoded = jwt.verify(token, pub || pr);
      } catch (e) {
        return next();
      }

      if (!decoded || !Types.ObjectId.isValid(decoded.u)) {
        return next();
      }

      try {
        req.user = await User.findById(decoded.u);
      } catch (e) {
        return next(e);
      }

      return next();
    },
  );

  return true;
};
