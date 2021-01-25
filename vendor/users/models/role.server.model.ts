/**
 * Module dependencies.
 */
import mongoose from 'mongoose';

const { model, Schema } = mongoose;

const RoleSchema = new Schema(
  {
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IAM',
        required: true,
      },
    ],
    protected: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'roles',
  },
);

RoleSchema.statics.getIAMs = async function getIAMs(roles = []) {
  const IAM: any = model('IAM');
  let list = roles.filter((r) => Boolean(r) && typeof r === 'string');

  list = await this.find({ name: list });
  list = (list
    .filter(Boolean)
    .map((r: any) => r.iams)
    .filter(Boolean) as any).flat();

  list = await IAM.getChildren(list);

  return list;
};

const RoleModel = mongoose.model('Role', RoleSchema);
RoleModel.createIndexes();

export default RoleModel;
