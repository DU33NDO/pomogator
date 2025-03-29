import { Types } from 'mongoose';
import { UserRole } from '@/models/User';

export interface MongoUser {
  _id: string | Types.ObjectId;
  email: string;
  username: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Participant {
  userId: string | Types.ObjectId | MongoUser;
  role: UserRole;
}

export interface MongoGroup {
  _id: string | Types.ObjectId;
  name: string;
  slug: string;
  participants: Participant[];
  createdBy: string | Types.ObjectId | MongoUser;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Submission {
  userId: string | Types.ObjectId | MongoUser;
  content: string;
  fileName?: string;
  fileUrl?: string;
  submittedAt: Date;
}

export interface MongoAssignment {
  _id: string | Types.ObjectId;
  title: string;
  description: string;
  groupId: string | Types.ObjectId | MongoGroup;
  deadline: Date;
  createdBy: string | Types.ObjectId | MongoUser;
  submissions: Submission[];
  createdAt: Date;
  updatedAt?: Date;
} 