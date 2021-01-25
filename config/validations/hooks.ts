/*
eslint-disable import/no-dynamic-require,global-require
*/

/**
 * Local dependencies.
 */
import config from '@config/index';
const utils = require('./utils');

export const onInit = async (user: { markModified: (arg0: string) => void }) => {
  const vConfig = (config as any).validations;
  const types = vConfig.types || [];

  types.forEach((t: any) => {
    const m = require(`./types/${t}`);
    const v = utils.getValidationObj(user, t);

    m.init(user, v);
  });

  user.markModified('validations');
  return user;
};

export const onSignup = async (user: { markModified: (arg0: string) => void }, req: any) => {
  const vConfig = (config as any).validations;
  const types = vConfig.types || [];

  types.forEach((t: any) => utils.tryNotify(user, t, req));

  user.markModified('validations');
  return user;
};

export const onLogin = async () => {};
