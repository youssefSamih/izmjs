"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderNotFound = exports.renderServerError = exports.renderIndex = void 0;
const index_1 = __importDefault(require("@config/index"));
const { vendor } = index_1.default.files.server.modules;
const renderIndex = async function renderIndex(req, res) {
    res.render(`${vendor}/core/views/index`, {
        user: req.user ? req.user.toJSON({ virtuals: true }) : null,
    });
};
exports.renderIndex = renderIndex;
const renderServerError = async function renderServerError(req, res) {
    req.i18n.setDefaultNamespace('vendor:core');
    res.status(500).render(`${vendor}/core/views/500`, {
        title: req.t('ERROR_500_TITLE'),
        error: req.t('ERROR_500'),
    });
};
exports.renderServerError = renderServerError;
const renderNotFound = async function renderNotFound(req, res) {
    req.i18n.setDefaultNamespace('vendor:core');
    res.status(404).format({
        'text/html': () => {
            res.render(`${vendor}/core/views/404`, {
                title: req.t('PAGE_NOT_FOUND_TITLE'),
                details: req.t('PAGE_NOT_FOUND_DETAILS', {
                    url: req.originalUrl,
                }),
            });
        },
        'application/json': () => {
            res.json({
                error: req.t('ERROR_404'),
            });
        },
        default() {
            res.send(req.t('ERROR_404'));
        },
    });
};
exports.renderNotFound = renderNotFound;
//# sourceMappingURL=core.server.controller.js.map