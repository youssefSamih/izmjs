"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
module.exports = {
    log: {
        format: ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
    },
    db: {
        promise: global.Promise,
    },
    lib: {
        mongoose: {
            timestamps: {
                createdAt: 'created_at',
                updatedAt: 'updated_at',
            },
        },
    },
    i18next: {
        detector: {
            order: ['querystring', 'cookie'],
            lookupQuerystring: '$lng',
            lookupCookie: 'i18next',
            lookupFromPathIndex: 0,
            caches: false,
        },
        init: {
            fallbackLng: 'en',
            preload: ['fr', 'en'],
            saveMissing: true,
            fallbackNS: 'vendor:core',
            defaultNS: 'vendor:core',
            debug: false,
            backend: {
                loadPath: (lng, ns) => {
                    const [type, name] = ns.split(':');
                    return path_1.resolve(`${type}/${name}/i18n/${lng}.json`);
                },
                addPath: (lng, ns) => {
                    const [type, name] = ns.split(':');
                    return path_1.resolve(`${type}/${name}/i18n/${lng}.missing.json`);
                },
            },
        },
    },
};
//# sourceMappingURL=default.js.map