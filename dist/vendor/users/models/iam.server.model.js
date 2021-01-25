"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const IAMSchema = new Schema({
    iam: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    title: String,
    description: String,
    resource: String,
    permission: String,
    module: String,
    affectable: {
        type: Boolean,
        default: true,
        required: true,
    },
    system: {
        type: Boolean,
        default: false,
        required: true,
    },
    children: {
        type: [
            {
                type: Schema.Types.ObjectId,
                ref: 'IAM',
            },
        ],
        default: [],
    },
    excluded: {
        type: Boolean,
        default: false,
    },
    groups: {
        type: [
            {
                type: String,
                trim: true,
                lowercase: true,
                required: true,
            },
        ],
        default: [],
    },
}, {
    collection: 'iams',
});
IAMSchema.statics.getChildren = async function getChildren(ids = [], cache = []) {
    let list = ids
        .map((id) => id.toString())
        .filter((id, index, arr) => index === arr.indexOf(id))
        .filter((id) => {
        const found = cache.find((one) => one.id === id);
        return !found;
    });
    if (list.length === 0) {
        return cache;
    }
    list = await this.find({ _id: list });
    const children = list.map((iam) => iam.children).filter(Boolean).flat();
    list = cache.concat(list);
    if (children.length === 0) {
        return list;
    }
    list = await this.getChildren(children, list);
    return list;
};
const IAMModel = mongoose_1.default.model('IAM', IAMSchema);
IAMModel.createIndexes();
exports.default = IAMModel;
//# sourceMappingURL=iam.server.model.js.map