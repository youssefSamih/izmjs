"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const { model, Schema } = mongoose_1.default;
const RoleSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    title: String,
    description: String,
    iams: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'IAM',
            required: true,
        },
    ],
    protected: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    collection: 'roles',
});
RoleSchema.statics.getIAMs = async function getIAMs(roles = []) {
    const IAM = model('IAM');
    let list = roles.filter((r) => Boolean(r) && typeof r === 'string');
    list = await this.find({ name: list });
    list = list
        .filter(Boolean)
        .map((r) => r.iams)
        .filter(Boolean).flat();
    list = await IAM.getChildren(list);
    return list;
};
const RoleModel = mongoose_1.default.model('Role', RoleSchema);
RoleModel.createIndexes();
exports.default = RoleModel;
//# sourceMappingURL=role.server.model.js.map