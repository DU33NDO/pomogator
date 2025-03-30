import mongoose, { Schema, Document } from 'mongoose';

interface ISubmission {
  userId: mongoose.Types.ObjectId;
  content: string;
  fileName?: string;
  fileUrl?: string;
  submittedAt: Date;
  status: string;
  feedback?: string;
  grade?: number;
}

export enum Status {
  PENDING = 'pending',
  GRADED = 'graded'
}

export interface IAssignment extends Document {
  title: string;
  description: string;
  groupId: mongoose.Types.ObjectId;
  deadline: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  submissions: ISubmission[];
}

const SubmissionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  fileName: { type: String },
  fileUrl: { type: String },
  submittedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'graded'], 
    default: 'pending',
    required: true
  },
  feedback: { type: String },
  grade: { type: Number }
});

const AssignmentSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  deadline: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  submissions: [SubmissionSchema]
}, { timestamps: true });

// Delete the model if it exists to prevent the cached schema issue
if (mongoose.models.Assignment) {
  delete mongoose.models.Assignment;
}

export default mongoose.model<IAssignment>('Assignment', AssignmentSchema); 