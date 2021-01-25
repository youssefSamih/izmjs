"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const crypto_1 = __importDefault(require("crypto"));
const validator_1 = __importDefault(require("validator"));
const generate_password_1 = __importDefault(require("generate-password"));
const owasp_password_strength_test_1 = __importDefault(require("owasp-password-strength-test"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const twilio_1 = __importDefault(require("twilio"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
const util_1 = __importDefault(require("util"));
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default('vendor:users:models:users');
const { Schema } = mongoose_1.default;
const config = require('@config/index');
let { twilio: twilioConfig } = config;
let isSendGrid = false;
if (twilioConfig &&
    twilioConfig.from &&
    twilioConfig.from !== 'TWILIO_FROM' &&
    twilioConfig.accountID &&
    twilioConfig.accountID !== 'TWILIO_ACCOUNT_SID' &&
    twilioConfig.authToken &&
    twilioConfig.authToken !== 'TWILIO_AUTH_TOKEN') {
    twilioConfig = twilio_1.default(config.twilio.accountID, config.twilio.authToken);
}
else {
    if ((config.validations.mondatory.indexOf('phone') >= 0 ||
        config.validations.types.indexOf('phone') >= 0) &&
        (twilioConfig.from === 'TWILIO_FROM' ||
            twilioConfig.accountID === 'TWILIO_ACCOUNT_SID' ||
            twilioConfig.authToken === 'TWILIO_AUTH_TOKEN')) {
        console.warn('Please configure TWILIO_FROM, TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN env vars');
    }
    twilioConfig = false;
}
if (config.sendGrid && config.sendGrid.key && config.sendGrid.key !== 'SENDGRID_API_KEY') {
    isSendGrid = true;
    mail_1.default.setApiKey(config.sendGrid.key);
}
let smtpTransport;
if (config.mailer.options && config.mailer.options.auth && config.mailer.options.auth.pass) {
    smtpTransport = nodemailer_1.default.createTransport(config.mailer.options);
}
async function sendMail(subject, body, users = [], opts = {}) {
    const msg = Object.assign(Object.assign({}, opts), { to: users, from: config.mailer.from, subject, html: body });
    if (!Array.isArray(users) || users.length === 0) {
        return false;
    }
    if (isSendGrid) {
        try {
            const send = util_1.default.promisify(mail_1.default.send).bind(mail_1.default);
            const data = await send(msg, false);
            if (Array.isArray(data) && data.length > 0) {
                const [d] = data;
                return d.toJSON();
            }
            return data;
        }
        catch (e) {
            return false;
        }
    }
    else if (smtpTransport) {
        const send = util_1.default.promisify(smtpTransport.sendMail).bind(smtpTransport);
        try {
            const data = await send(msg);
            return data;
        }
        catch (e) {
            debug('Error while sending email', e, subject, users);
            return false;
        }
    }
    return false;
}
const validateLocalStrategyProperty = () => true;
const validateLocalStrategyEmail = (email) => validator_1.default.isEmail(email);
const validateLocalStrategyPhone = (phone) => {
    if (!phone) {
        return true;
    }
    return ((this.provider !== 'local' && !this.updated) ||
        /^\+[1-9]{1}[0-9]{3,14}$/.test(phone));
};
const validateRole = async (name) => {
    const Role = mongoose_1.default.model('Role');
    try {
        const r = await Role.findOne({ name });
        return !!r;
    }
    catch (e) {
        return false;
    }
};
const UserSchema = new Schema({
    name: {
        first: {
            type: String,
            trim: true,
            default: '',
            validate: [validateLocalStrategyProperty, 'Please fill in your first name'],
        },
        last: {
            type: String,
            trim: true,
            default: '',
            validate: [validateLocalStrategyProperty, 'Please fill in your last name'],
        },
    },
    email: {
        type: String,
        unique: 'email already exists',
        lowercase: true,
        trim: true,
        default: '',
        validate: [validateLocalStrategyEmail, 'Please fill a valid email address'],
    },
    username: {
        type: String,
        unique: 'username already exists',
        lowercase: true,
        trim: true,
        default: '',
    },
    phone: {
        type: String,
        lowercase: true,
        trim: true,
        validate: [validateLocalStrategyPhone, 'Please fill a valid phone number'],
    },
    password: {
        type: String,
        default: '',
    },
    salt: {
        type: String,
    },
    data: {
        type: Object,
    },
    provider: {
        type: String,
        required: 'Provider is required',
    },
    picture: {
        ref: 'Grid',
        type: 'ObjectId',
    },
    providerData: {},
    additionalProvidersData: {},
    roles: {
        type: [
            {
                type: String,
                validate: [validateRole, 'The role is invalid'],
            },
        ],
        default: config.app.roles.default,
        required: 'Please provide at least one role',
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    },
    validations: {
        default: [],
        type: [
            {
                type: { type: String },
                validated: { type: Boolean, default: false },
                code: String,
                resends: { type: Number, default: 0 },
                created: { type: Date, default: new Date() },
                last_try: Date,
                tries: {
                    type: Number,
                    default: 0,
                },
            },
        ],
    },
    isMale: {
        type: Boolean,
        default: true,
    },
    birthdate: {
        type: Date,
    },
}, {
    timestamps: config.lib.mongoose.timestamps,
});
UserSchema.virtual('profilePictureUrl').get(function get_picture_url() {
    if (this.picture) {
        return `${config.app.prefix}/files/${this.picture}/view?size=300x300`;
    }
    return `${config.app.prefix}/users/${this.id}/picture`;
});
UserSchema.virtual('name.full').get(function get_fullname() {
    let result = '';
    if (this.name.first) {
        result += this.name.first
            .split(' ')
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
            .join(' ');
    }
    if (this.name.last) {
        if (result) {
            result += ' ';
        }
        result += this.name.last.toUpperCase();
    }
    return result;
});
UserSchema.pre('save', function pre_save(next) {
    if (this.password && this.isModified('password')) {
        this.salt = crypto_1.default.randomBytes(16).toString('base64');
        this.password = this.constructor.hashPassword(this.password, this.salt);
    }
    next();
});
UserSchema.pre('validate', function pre_validate(next) {
    if (this.provider === 'local' &&
        this.password &&
        this.isModified('password')) {
        const result = owasp_password_strength_test_1.default.test(this.password);
        if (result.errors.length) {
            const error = result.errors.join(' ');
            this.invalidate('password', error);
        }
    }
    next();
});
UserSchema.statics.hashPassword = function hash_pwd(password, salt) {
    if (salt && password) {
        return crypto_1.default
            .pbkdf2Sync(password, Buffer.from(salt, 'base64'), 10000, 64, 'sha512')
            .toString('base64');
    }
    return password;
};
UserSchema.methods.authenticate = function authenticate(password) {
    return this.password === this.constructor.hashPassword(password, this.salt);
};
UserSchema.methods.sendSMS = function send_sms(body) {
    if (this.phone && twilioConfig) {
        return twilioConfig.messages.create({
            to: this.phone,
            from: config.twilio.from,
            body,
        });
    }
    return false;
};
UserSchema.methods.sendMail = function send_mail(subject, body, opts = {}) {
    return sendMail(subject, body, [this.email], opts);
};
UserSchema.statics.sendMail = function send_mail(emails = [], subject, body, opts = {}) {
    return sendMail(subject, body, emails, opts);
};
UserSchema.query.sendMail = async function send_mail_col(subject, body, opts = {}) {
    const users = await this;
    return sendMail(subject, body, users.map((u) => u.email), opts);
};
UserSchema.methods.notify = function notify() {
    throw new Error('Not implement yet!');
};
UserSchema.methods.json = function json() {
    const private_attrs = config.app.profile.private_attrs || [];
    const obj = this.toJSON({
        virtuals: true,
    });
    private_attrs.forEach((attr) => delete obj[attr]);
    return obj;
};
UserSchema.statics.sanitize = function sanitize(obj) {
    const o = Object.assign({}, obj);
    const protected_attrs = config.app.profile.protected_attrs || [];
    protected_attrs.forEach((attr) => delete o[attr]);
    return o;
};
UserSchema.statics.generateRandomPassphrase = function generateRandomPassphrase() {
    return new Promise((resolve, reject) => {
        let password = '';
        const repeatingCharacters = new RegExp('(.)\\1{2,}', 'g');
        while (password.length < 20 || repeatingCharacters.test(password)) {
            password = generate_password_1.default.generate({
                length: Math.floor(Math.random() * 20) + 20,
                numbers: true,
                symbols: false,
                uppercase: true,
                excludeSimilarCharacters: true,
            });
            password = password.replace(repeatingCharacters, '');
        }
        if (owasp_password_strength_test_1.default.test(password).errors.length) {
            reject(new Error('An unexpected problem occured while generating the random passphrase'));
        }
        else {
            resolve(password);
        }
    });
};
const UserModel = mongoose_1.default.model('User', UserSchema);
UserModel.createIndexes();
exports.default = UserModel;
//# sourceMappingURL=user.server.model.js.map