"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core = require('../controllers/core.server.controller');
exports.default = (app) => {
    app.route('/server-error').get(core.renderServerError);
    app.route('/:url(api)/*').get(core.renderNotFound);
    app.route('/').get(core.renderIndex);
    app.route('/*').get(core.renderNotFound);
};
//# sourceMappingURL=core.server.routes.js.map