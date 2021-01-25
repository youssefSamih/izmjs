/*
eslint-disable import/no-extraneous-dependencies
*/
import path from 'path';
import nunjucks from 'nunjucks';

const config = require('@config/index');

/**
 * Generate a random number of a specific length
 * @param {Number} length The length of the code to generate
 */
function randomNumber(length: string) {
  let res = '';
  const l = (Math as any).isNaN(length) ? 4 : parseInt(length, 10);

  while (res.length < l) {
    res += Math.floor(Math.random() * 10);
  }

  return res;
}

/**
 * Init the validation object
 * @param {Object} _user The current user
 * @param {Object} validation The validation object
 */
export const init = (_user: any, validation: any) => {
  const v = validation;

  v.code = randomNumber(config.validations.config.phone.code_length);
  v.created = Date.now();

  return v;
};

/**
 * Hook: The pre validation hook
 * @param {Object} user The current user
 * @param {Object} validation The validation object
 */
export const notify = (user: { sendSMS: (arg0: string) => void }, validation: { code: any }) => {
  const v = validation;
  const tpl = path.resolve(__dirname, '..', 'templates/confirmation-phone.swig');

  user.sendSMS(
    nunjucks.render(tpl, {
      app: config.app,
      code: validation.code,
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
export const isValid = (_user: any, validation: { code: any }, code: any) => {
  if (!validation || typeof validation !== 'object') {
    return false;
  }

  return validation.code === code;
};
