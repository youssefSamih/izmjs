"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
exports.default = (config) => {
    const { env } = config.utils;
    const profile = {
        picture: {
            default: {
                male: '/assets/img/male.png',
                female: '/assets/img/female.png',
            },
            thumbnail: '100x100',
            accept: ['image/png', 'image/jpeg'],
        },
        protected_attrs: ['validations', 'salt', 'updated_at', 'created_at', 'provider', 'roles'],
        private_attrs: ['validations', 'salt', 'password'],
    };
    const validations = {
        types: ['admin', 'phone', 'email'].filter((one) => env.get(`${one.toUpperCase()}_ENABLED`)),
        config: {
            phone: {
                validate: env.get('PHONE_VALIDATE'),
                code_length: env.get('PHONE_CODE_LENGTH'),
                max_tries: env.get('PHONE_MAX_TRIES'),
                authenticate: env.get('PHONE_IS_AUTHENTICATE'),
                max_resends: env.get('PHONE_MAX_RESENDS'),
            },
            email: {
                validate: env.get('EMAIL_VALIDATE'),
                code_length: env.get('EMAIL_CODE_LENGTH'),
                max_tries: env.get('EMAIL_MAX_TRIES'),
                authenticate: env.get('EMAIL_IS_AUTHENTICATE'),
                max_resends: env.get('EMAIL_MAX_RESENDS'),
            },
            admin: {
                validate: env.get('ADMIN_VALIDATE'),
                code_length: env.get('ADMIN_CODE_LENGTH'),
                max_tries: env.get('ADMIN_MAX_TRIES'),
                authenticate: false,
                max_resends: env.get('ADMIN_MAX_RESENDS'),
            },
        },
    };
    validations.mondatory = validations.types.filter((type) => validations.config[type].validate);
    const twilio = {
        from: env.get('TWILIO_FROM'),
        accountID: env.get('TWILIO_ACCOUNT_SID'),
        authToken: env.get('TWILIO_AUTH_TOKEN'),
    };
    const sendGrid = {
        key: env.get('SENDGRID_API_KEY'),
    };
    const mailer = {
        from: env.get('MAILER_FROM'),
        options: {
            host: env.get('MAILER_HOST'),
            port: env.get('MAILER_PORT'),
            secure: env.get('MAILER_SECURE'),
            auth: {
                user: env.get('MAILER_AUTH_USER'),
                pass: env.get('MAILER_AUTH_PASS'),
            },
        },
    };
    const links = {
        resetPwd: env.get('LINK_RESET_PWD'),
    };
    const jwt = {
        enabled: env.get('JWT_ENABLED'),
        key: {
            type: env.get('JWT_KEY_TYPE'),
            private: env.get('JWT_PRIVATE_KEY'),
            public: env.get('JWT_PUBLIC_KEY'),
        },
        alg: env.get('JWT_ALG'),
        expiresIn: env.get('JWT_EXPIRES_IN'),
    };
    if (jwt.key.type === 'file') {
        jwt.key.private = fs_1.readFileSync(jwt.key.private);
        jwt.key.public = fs_1.readFileSync(jwt.key.public);
    }
    return {
        jwt,
        links: Object.assign(Object.assign({}, config.links), links),
        mailer,
        twilio,
        sendGrid,
        validations,
        app: {
            profile,
            roles: {
                default: env.get('DEFAULT_GROUPS'),
            },
        },
    };
};
//# sourceMappingURL=app.config.js.map