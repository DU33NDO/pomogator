import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from './User';

interface IParticipant {
  userId: mongoose.Types.ObjectId;
  role: UserRole;
}

export interface IGroup extends Document {
  name: string;
  slug: string;
  participants: IParticipant[];
  createdBy: mongoose.Types.ObjectId;
}

const ParticipantSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: Object.values(UserRole), required: true }
}, { _id: false });

const GroupSchema: Schema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  participants: [ParticipantSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { 
  timestamps: true,
});

// Create a slug from the name before saving
GroupSchema.pre('save', function(this: IGroup & Document, next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-') + '-' + Date.now().toString().slice(-4);
  }
  next();
});

export default mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema); 