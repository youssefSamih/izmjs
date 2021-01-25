import { model } from 'mongoose';
import nunjucks from 'nunjucks';
import path from 'path';
import generatePassword from 'generate-password';

const config = require('@config/index');
const utils = require('@helpers/utils');

/**
 * Init the validation object
 * @param {Object} _user The current user
 * @param {Object} validation The validation object
 */
export const init = (_user: object, validation: any) => {
  const v = validation;

  v.code = generatePassword.generate({
    length: config.validations.config.email.code_length,
    numbers: true,
    symbols: false,
    uppercase: false,
    excludeSimilarCharacters: true,
  });
  v.created = Date.now();

  return v;
};

/**
 * Hook: The pre validation hook
 * @param {Object} user The current user
 * @param {Object} validation The validation object
 */
export const notify = (user: { name?: any; _id?: any }, validation: { code: any }, req: any) => {
  const v = validation;
  const tpl = path.resolve(__dirname, '..', 'templates/confirmation-admin.swig');
  const baseURL = utils.getBaseURLFromRequest(req);
  const { _id: userId } = user;

  let url = baseURL + config.app.prefix;
  url += '/auth/confirm?type=admin';
  url += `&uid=${userId}`;
  url += `&code=${validation.code}`;

  (model('User').find({ roles: 'admin' }) as any).sendMail(
    `New account: ${user.name.full}`,
    nunjucks.render(tpl, {
      url,
      app: config.app,
      name: user.name.full,
    }),
  );

  return v;
};

/**
 * Check the code if it's valid
 * @param {Object} _user The current user
 * @param {Object} validation The validation object
 * @param {*} code The code to check
 */
export const isValid = (_user: object, validation: any, code: any) => {
  if (!validation || typeof validation !== 'object') {
    return false;
  }

  return validation.code === code;
};
