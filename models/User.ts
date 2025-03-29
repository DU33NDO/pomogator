import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export interface IUser extends Document {
  email: string;
  username: string;
  password: string;
  role: UserRole;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: Object.values(UserRole), required: true }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 