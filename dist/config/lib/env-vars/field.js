"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { NumberField, ObjectField, GenericField, BooleanField, IntegerField } = require('./types');
class Field {
    constructor() {
        throw new Error('You can instantiate this abstract class');
    }
    static create(config, schema = { type: 'string' }) {
        switch (schema.type) {
            case 'object':
                return new ObjectField(config, schema);
            case 'boolean':
                return new BooleanField(config, schema);
            case 'integer':
                return new IntegerField(config, schema);
            case 'number':
                return new NumberField(config, schema);
            default:
                return new GenericField(config, schema);
        }
    }
}
exports.default = Field;
//# sourceMappingURL=field.js.map