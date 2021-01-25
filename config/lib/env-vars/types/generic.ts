import Ajv from 'ajv';
import { red } from 'chalk';

const debug = require('debug')('app:helpers:utils:env:field');
const ajv = new Ajv();

/**
 * Represents a field
 * @class Field
 * @access private
 */
class GenericField {
  name: any;
  key: any;
  description: any;
  schema: { type: string };
  validator: Ajv.ValidateFunction;
  defaultValue: any;
  scope: string;
  value: any;
  link: any;
  field: any;

  constructor(opts: any = {}, schema = { type: 'string' }) {
    Object.keys(opts).forEach((attr: any) => {
      (this as any)[attr] = (opts as any)[attr];
    });

    this.name = this.name || this.key;
    this.description = this.description || '';
    this.schema = schema;

    this.validator = ajv.compile(schema);

    if (typeof opts.defaultValue !== 'undefined') {
      this.setValue(this.defaultValue);
    }
  }

  /**
   * Get the real environment key from a basic key
   * @param {String} key basic key
   * @param {String} scope The namespace
   */
  realKey() {
    const { scope = 'general', key } = this;
    const s = scope.toUpperCase().replace(/[- *&?@$]/g, '_');
    return scope === 'general' ? key : `${s}_MODULE_${key}`;
  }

  /**
   * Validate field value
   * @param {any} value the value to validate
   */
  validate(value: any) {
    const isValid = this.validator(value);
    if (!isValid) {
      debug(`Warning: Invalid field value
KEY         : ${this.key}
NAME        : ${this.name}
VALUE       : ${value}
SCOPE       : ${this.scope}
DESCRIPTION : ${this.description}
ERRORS      : ${JSON.stringify((this.validate as any).errors, null, '  ')}
`);
    }

    return isValid;
  }

  /**
   * Set the value of the current field
   * @param {any} value The new value
   * @chainable
   */
  setValue(value: any, isForce = false) {
    if (typeof value === 'undefined') {
      this.value = this.defaultValue;
      return this;
    }

    const isValid = this.validate(value);

    if (!isValid && isForce !== true) {
      console.error(red(`"${this.key}" can not have the value "${value}"`));
      throw new Error(this.validator.errors as string | undefined);
    }

    this.value = value;
    return this;
  }

  /**
   * Get the current value
   * @returns {any} current value
   * @chainable
   */
  getValue() {
    return this.value;
  }

  /**
   * Reset the field value
   * @chainable
   */
  reset() {
    this.setValue(this.defaultValue);
    return this;
  }

  /**
   * Get JSON format of the field
   * @returns {Object} JSON format of the current field
   */
  toJSON() {
    return {
      key: this.key,
      link: this.link,
      envVar: this.realKey(),
      name: this.name,
      value: this.getValue(),
      schema: this.schema,
      field: this.field,
      description: this.description,
      defaultValue: this.defaultValue,
    };
  }

  /**
   * @returns {String} the json format of the current field
   */
  toString() {
    if (typeof this.value === 'undefined' || this.value === null) {
      return undefined;
    }

    return this.value.toString();
  }
}

export default GenericField;
