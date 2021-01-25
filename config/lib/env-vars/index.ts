import { readFile, writeFile } from 'fs';
import { resolve } from 'path';
import { promisify } from 'util';
import { parse } from 'dotenv';
import Ajv from 'ajv';
import debugImport from 'debug';
import Field from './field';
import envSchema from './field.schema.json';

const debug = debugImport('app:helpers:utils:env');
const ajv = new Ajv();
const validate = ajv.compile(envSchema);
const readFile$ = promisify(readFile);
const writeFile$ = promisify(writeFile);
const DEFAULT_ENV = process.env.NODE_ENV || 'development';

type EnvironmentSetParam = {
  key: any;
  link: any;
  value: any;
  field: any;
  group: any;
  name: any;
  defaultValue: any;
  description: string;
};

type itemParamFilter = { toString: () => any; value: any; defaultValue: any };

/**
 * Represents an environment
 * @class Environment
 * @access private
 */
class Environment {
  name: string;
  variables: any[];
  values: { [x: string]: string | undefined };

  constructor(name = DEFAULT_ENV) {
    this.name = name;
    this.variables = [];

    if (!process.env.NODE_ENV || name === process.env.NODE_ENV) {
      this.values = { ...process.env };
    } else {
      this.values = {};
    }
  }

  /**
   * Validate the content of an .env.json file
   * @param {Object} env the content of the environment file
   */
  static validate(env: any) {
    const isValid = validate(env);

    if (!isValid) {
      debug(`Env not valid:
OBJECT : ${JSON.stringify(env)}
ERRORS : ${JSON.stringify(validate.errors)}
`);
    }

    return isValid;
  }

  /**
   * Get the environment file path from its type
   * @param {String} type The environment type
   */
  static getEnvFilePath(type = 'common') {
    return resolve(`.env/.${type}.env`);
  }

  /**
   * Load environment variables from the environment file
   * @returns {Object} environment variables and their values
   */
  async load() {
    let content = '';
    const { getEnvFilePath } = this.constructor as any;
    const commonPath = getEnvFilePath();
    const path = getEnvFilePath(this.name);

    try {
      content = await readFile$(commonPath, { encoding: 'utf8' });
      content += '\n';
    } catch (e) {
      debug(`Enable to load common env file file
PATH  : ${commonPath}
ERROR : ${JSON.stringify(e)}`);
    }

    try {
      content += await readFile$(path, { encoding: 'utf8' });
    } catch (e) {
      debug(`Enable to load env file
PATH  : ${path}
ERROR : ${JSON.stringify(e)}`);
    }

    try {
      return parse(content);
    } catch (e) {
      return {};
    }
  }

  async save() {
    const { getEnvFilePath } = this.constructor as any;
    const path = getEnvFilePath(this.name);

    let values: any = {};
    let content = '';

    try {
      values = await this.load();
    } catch (e) {
      values = {};
    }

    Object.keys(values).forEach((key) => {
      const found = this.variables.find((v: any) => v.realKey() === key);
      if (found) {
        return;
      }

      if (!content) {
        content += '# User defined vars\n';
      }

      content += `${key}=${values[key]}\n`;
    });

    if (content) {
      content += '\n';
    }

    content += this.toString();

    try {
      await writeFile$(path, content, { encoding: 'utf8' });
    } catch (e) {
      return false;
    }

    return true;
  }

  /**
   * Adds a new field to the current environment
   * @param {Object} param0 field details
   * @param {JSONSchema} schema the json schema of the field
   * @param {String} scope the scope
   */
  set(
    {
      key,
      link,
      value,
      field,
      group,
      name = key,
      defaultValue,
      description = '',
    }: EnvironmentSetParam,
    schema = { type: 'string' },
    scope = 'general',
  ) {
    let variable = this.variables.find((v: any) => v.scope === scope && v.key === key);

    if (!variable) {
      variable = Field.create(
        {
          key,
          name,
          link,
          group,
          scope,
          field,
          description,
          defaultValue,
        },
        schema,
      );

      this.variables.push(variable);
    }

    const k = variable.realKey();

    if (typeof value !== 'undefined') {
      variable.setValue(value);
    } else if (typeof this.values[k] !== 'undefined') {
      variable.setValue(this.values[k], true);
    }

    return variable.getValue();
  }

  /**
   * Save current environment to the file
   * @chainable
   */
  toString() {
    let content = '';

    const scopes = this.toJSON();

    scopes
      .map((scope: { items: any }) => {
        let { items } = scope;

        items = items.filter((item: itemParamFilter) => {
          const str = item.toString();
          return !!str && item.value !== item.defaultValue;
        });

        return {
          ...scope,
          items,
        };
      })
      .filter((scope: { items: string | any[] }) => scope.items.length > 0)
      .forEach((scope: { name: any; items: any[] }, index: number) => {
        content += `${index > 0 ? '\n' : ''}# ${scope.name}\n`;

        scope.items.forEach((field) => {
          content += `${field.realKey()}=${field.toString()}\n`;
        });
      });

    return content;
  }

  /**
   * Get JSON presentation of the current environment
   */
  toJSON() {
    const json = this.variables.reduce((prevValue, current) => {
      const groupBy = current.group || current.scope;
      const index = prevValue.findIndex((one: { name: any }) => one.name === groupBy);

      if (index < 0) {
        const found = {
          name: groupBy,
          items: [current],
        };

        return prevValue.concat(found);
      }

      prevValue[index].items.push(current);
      return prevValue;
    }, []);

    return json.sort((a: { name: string | number }, b: { name: string | number }) => {
      if (a.name === 'general') {
        return -1;
      }

      if (b.name === 'general') {
        return 1;
      }

      return a.name >= b.name ? 1 : -1;
    });
  }

  /**
   * Get the value of an environment variable
   * @param {String} key The env variable key
   * @param {String} scope The scope
   */
  get(key: any, scope = 'general') {
    const found = this.variables.find((field) => field.key === key && field.scope === scope);

    if (found) {
      return found.getValue();
    }

    return undefined;
  }
}

export default Environment;
