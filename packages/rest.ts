import { ObjectId } from 'bson';
import { Document, DocumentQuery, model, Types } from 'mongoose';

type sanitizeQueryReqParam = {
  query: { $expand?: any; $select?: any; $filter?: any };
  $query: DocumentQuery<Document[], Document, {}>;
};

export const sanitizeQuery = (modelName: string) => {
  const Model = model(modelName);
  /**
   * Sanitize the query
   * @controller Sanitize Query
   * @param {import('express').Request} req The request
   * @param {import('express').Response} _res The response
   * @param {Function} next Go to the next middleware
   */
  return async function sanitizeQuery(req: sanitizeQueryReqParam, _res: any, next: () => void) {
    const { $expand = '', $select = '' } = req.query;

    let { $filter } = req.query;

    if (typeof $filter === 'string') {
      try {
        $filter = JSON.parse($filter);
      } catch (e) {
        $filter = {};
      }
    } else if (!$filter || typeof $filter !== 'object') {
      $filter = {};
    }

    req.$query = Model.find($filter).select(
      $select
        .split(',')
        .map((attr: string) => attr.trim())
        .filter(Boolean)
        .join(' '),
    );

    $expand
      .split(',')
      .map((attr: string) => attr.trim())
      .filter(Boolean)
      .forEach((attr: any) => req.$query.populate(attr));

    next();
  };
};

/**
 * List all entities
 * @controller List
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const list = (modelName: string) => {
  const Model = model(modelName);

  /**
   * Sanitize the query
   * @controller Sanitize Query
   * @param {import('express').Request} req The request
   * @param {import('express').Response} res The response
   * @param {Function} next Go to the next middleware
   */
  return async function list(
    req: { $query?: any; query?: any },
    res: { json: (arg0: any) => any },
    next: (arg0: any) => any,
  ) {
    let { $query } = req;
    const { query } = req;
    const { $top: top = 10, $skip: skip = 0 } = query;

    if (!$query) {
      $query = Model.find({});
    }

    try {
      const result = await $query.paginate({ top, skip });
      return res.json(result);
    } catch (e) {
      return next(e);
    }
  };
};

export const create = (modelName: string) => {
  const Model = model(modelName);
  /**
   * Create new entity
   * @controller Create
   * @param {import('express').Request} req The request
   * @param {import('express').Response} res The response
   * @param {Function} next Go to the next middleware
   */
  return async function create(
    req: { body: any },
    res: {
      status: (
        arg0: number,
      ) => { (): any; new (): any; json: { (arg0: Document): any; new (): any } };
    },
    next: (arg0: any) => any,
  ) {
    const { body } = req;
    const entity: any = new Model(body);

    try {
      const result = await entity.save({ new: true });
      return res.status(201).json(result);
    } catch (e) {
      return next(e);
    }
  };
};

/**
 * Get a specific entity
 * @controller Get one
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const getOne = async function getOne(
  req: { entity: any },
  res: { json: (arg0: any) => any },
) {
  const { entity } = req;
  return res.json(entity);
};

/**
 * Get a specific entity
 * @controller Get one
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const removeOne = async function removeOne(
  req: { entity: any },
  res: { status: (arg0: number) => { (): any; new (): any; end: { (): any; new (): any } } },
  next: (arg0: any) => any,
) {
  const { entity } = req;
  try {
    await entity.remove();
    return res.status(204).end();
  } catch (e) {
    return next(e);
  }
};

/**
 * Get a specific entity
 * @controller Get one
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const updateOne = async function updateOne(
  req: { entity: any; body: any },
  res: { json: (arg0: any) => any },
  next: (arg0: any) => any,
) {
  const { entity, body } = req;
  try {
    entity.set(body);
    const result = await entity.save({ new: true });
    return res.json(result);
  } catch (e) {
    return next(e);
  }
};

export const getById = (modelName: string) => {
  const Model = model(modelName);
  /**
   * Get entity by ID
   * @controller GetById
   * @param {import('express').Request} req The request
   * @param {import('express').Response} res The response
   * @param {Function} next Go to the next middleware
   */
  return async (
    req: { t: (arg0: string, arg1: { id: any; modelName: string }) => any; entity: Document },
    res: {
      status: (
        arg0: number,
      ) => { (): any; new (): any; send: { (arg0: { message: any }): any; new (): any } };
    },
    next: (arg0?: undefined) => any,
    id: string | number | ObjectId,
  ) => {
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).send({
        message: req.t('INVALID_ENTITY_ID', {
          id,
          modelName,
        }),
      });
    }

    let entity;

    try {
      entity = await Model.findById(id);
    } catch (e) {
      return next(e);
    }

    if (!entity) {
      return res.status(404).send({
        message: req.t('ENTITY_NOT_FOUND', {
          id,
          modelName,
        }),
      });
    }

    req.entity = entity;
    return next();
  };
};

/**
 * @decorator
 * @param {'$filter' | 'body'} type The type of the object to mutate
 * @param {object} payload The payload
 * @param {boolean} isMerge true to merge with the existing payload, false otherwise
 * @returns {Function} The middleware
 */
export const set = (type = '$filter', payload = {}, isMerge = false) => {
  /**
   * Sets an object of the request
   * @controller Set
   * @param {import('express').Request} req The request
   * @param {import('express').Response} _res The response
   * @param {Function} next Go to the next middleware
   */
  return function set(req: { query?: any; body?: any }, _res: any, next: () => any) {
    let { body } = req;
    let { $filter = {} } = req.query;

    switch (type) {
      case '$filter':
        if (typeof $filter === 'string') {
          try {
            $filter = JSON.parse($filter);
          } catch (e) {
            $filter = payload;
          }
        } else if (!$filter || typeof $filter !== 'object') {
          $filter = payload;
        }

        if (isMerge === true) {
          $filter = Object.assign($filter, payload);
        } else {
          $filter = payload;
        }

        break;
      case 'body':
        if (!body || typeof body !== 'object') {
          body = payload;
        }

        if (isMerge === true) {
          body = Object.assign(body, payload);
        } else {
          body = payload;
        }
        break;
      default:
        break;
    }

    return next();
  };
};
