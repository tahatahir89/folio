import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    /** Bumped on password change so older sessions stop working. */
    tokenVersion: { type: Number, default: 0 },
    /** Ready for future subscription tiers; the core editor never depends on it. */
    plan: { type: String, enum: ['free'], default: 'free' },
  },
  { timestamps: true },
);

export type UserRecord = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId; createdAt: Date; updatedAt: Date };

export const User: Model<UserRecord> =
  (mongoose.models.User as Model<UserRecord> | undefined) ?? mongoose.model<UserRecord>('User', UserSchema);
