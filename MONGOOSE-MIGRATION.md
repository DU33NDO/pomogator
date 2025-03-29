# MongoDB and Mongoose Migration Summary

## Overview
This project has been migrated from PostgreSQL to MongoDB using Mongoose as the ODM (Object Document Mapper). All Prisma dependencies have been removed in favor of Mongoose.

## Key Changes
1. Removed all Prisma dependencies and configuration
2. Added Mongoose and MongoDB dependencies
3. Created Mongoose models for all entities
4. Updated all API routes to use Mongoose
5. Configured Docker and environment variables for MongoDB

## Model Structure
The application now uses the following Mongoose models:

### User Model
```typescript
// models/User.ts
export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export interface IUser extends Document {
  email: string;
  username: string;
  password: string;
  role: UserRole;
  groupId?: mongoose.Types.ObjectId;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: Object.values(UserRole), required: true },
  groupId: { type: Schema.Types.ObjectId, ref: 'Group' }
}, { timestamps: true });
```

### Group Model
```typescript
// models/Group.ts
export interface IGroup extends Document {
  name: string;
}

const GroupSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true }
}, { timestamps: true });
```

### Assignment Model
```typescript
// models/Assignment.ts
export interface IAssignment extends Document {
  teacherId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  description: string;
  deadline: Date;
  createdAt: Date;
}

const AssignmentSchema: Schema = new Schema({
  teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  description: { type: String, required: true },
  deadline: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });
```

## MongoDB Connection
The database connection is managed through a dedicated module that supports connection pooling and caching:

```typescript
// lib/mongoose.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB || '';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB environment variable');
}

// Connection caching to prevent multiple connections in development
let cached = global.mongoose || { conn: null, promise: null };

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
    return mongoose;
  });
  
  cached.conn = await cached.promise;
  return cached.conn;
}
```

## API Usage Example
All API routes now follow this pattern:

```typescript
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";

export async function GET() {
  try {
    await dbConnect();
    const users = await User.find(...).select("-password");
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error message" }, { status: 500 });
  }
}
```

## Environment Configuration
The application now uses a single MongoDB connection string via the `MONGODB` environment variable:

```
MONGODB=mongodb+srv://username:password@cluster.mongodb.net/dbname
```

## Getting Started
1. Install dependencies: `npm install`
2. Set up MongoDB connection in `.env` file
3. Start the application: `npm run dev`

## Benefits of Using Mongoose
- Native MongoDB query capabilities
- Rich schema validation and middleware
- TypeScript support through interfaces
- Simplified population of related documents
- Mature ecosystem with extensive documentation 