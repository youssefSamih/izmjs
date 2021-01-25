/*
eslint-disable import/no-dynamic-require,global-require
*/

/**
 * Local dependencies.
 */
const vConfig = require('@config/index').validations;

const tConfig = vConfig.config;

class ValidationError {
  code: string;
  data: { type: any; remaining?: number | undefined } | undefined;

  constructor(code: string, data?: { type: any; remaining?: number } | undefined) {
    this.code = code;
    this.data = data;
  }
}

/**
 * Check a given user if he is already validated
 * @param {Object} user The user
 */
export const isValidated = (user: { validations: never[] }) => {
  const types = vConfig.mondatory || [];
  const validations = user.validations || [];

  for (let index = 0; index < types.length; index += 1) {
    const t = validations.find((v: any) => v.type === types[index]) as any;

    if (!t || !t.validated) {
      throw new ValidationError('VALIDATIONS!UNVALIDATED', {
        type: types[index],
      });
    }
  }

  return true;
};

/**
 * Force the validation of a given user
 * @param {Object} user The user
 * @param {String} type The validation type
 */
export const validate = async (user: any, type: string) => {
  const types = vConfig.mondatory || [];

  if (type === '*' || !type) {
    types.forEach((t: any) => {
      validate(user, t);
    });
  }

  const v = getValidationObj(user, type);

  if (!v) {
    throw new ValidationError('VALIDATIONS!UNKNOWN_TYPE');
  }

  v.validated = true;
  user.markModified('validations');
  return user;
};

/**
 * Force the unvalidation of a given user
 * @param {Object} user The user
 * @param {String} type The validation type
 */
export const unvalidate = async (user: any, type: string) => {
  const v = getValidationObj(user, type);

  if (!v) {
    throw new ValidationError('VALIDATIONS!UNKNOWN_TYPE');
  }

  v.validated = false;
  user.markModified('validations');
  return user;
};

/**
 * Gets the validation object of a given type
 * @param {Object} user The user
 * @param {String} type The validation type
 */
export const getValidationObj = (user: any, type: string): any => {
  if (vConfig.types.lastIndexOf(type) < 0) {
    return null;
  }

  const validations = user.validations || [];

  let v = validations.find((v_: { type: string }) => v_.type === type);

  if (!v) {
    v = {
      type,
    };

    validations.push(v);
    return getValidationObj(user, type);
  }

  return v;
};

/**
 * Try to validate a given type using a given code
 * Note: Will increment the number of tries
 * @param {Object} user The user
 * @param {String} type The validation type
 * @param {*} code The code
 */
export const tryValidate = async (user: any, type: string, code: any) => {
  const c = tConfig[type];
  const v = getValidationObj(user, type);

  if (!v) {
    throw new ValidationError('VALIDATIONS!UNKNOWN_TYPE', {
      type,
    });
  }

  if (v.validated) {
    throw new ValidationError('VALIDATIONS!ALREADY_VALIDATED', {
      type,
    });
  }

  if (c && c.max_tries && v.tries >= c.max_tries) {
    throw new ValidationError('VALIDATIONS!MAX_TRIES_EXCEEDED', {
      type,
    });
  }

  v.tries += 1;
  user.markModified('validations');

  const m = require(`./types/${type}`);
  const isValid = m.isValid(user, v, code);

  if (!isValid) {
    throw new ValidationError('VALIDATIONS!INVALID_CODE', {
      type,
      remaining: c.max_tries - v.tries,
    });
  }

  v.validated = isValid;

  return isValid;
};

/**
 * Try to notify the user using the appropriate type
 * Note: Will increment the number of resends
 * @param {Object} user The user
 * @param {String} type The validation type
 */
export const tryNotify = async (user: any, type: string, req: any) => {
  const c = tConfig[type];
  const v = getValidationObj(user, type);

  if (!v) {
    throw new ValidationError('VALIDATIONS!UNKNOWN_TYPE');
  }

  const m = require(`./types/${type}`);

  if (c && c.max_resends && v.resends >= c.max_resends) {
    throw new ValidationError('VALIDATIONS!MAX_RESENDS_EXCEEDED');
  }

  await m.notify(user, v, req);
  v.resends += 1;

  user.markModified('validations');

  return true;
};
