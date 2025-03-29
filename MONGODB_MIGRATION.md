# MongoDB Migration Guide

This project has been migrated from PostgreSQL to MongoDB. Here are the key changes and steps to get it running:

## Changes Made

1. Updated Prisma schema to use MongoDB
2. Added Mongoose for direct MongoDB interaction
3. Changed Docker configuration to use MongoDB
4. Updated database connection string
5. Added MongoDB client libraries

## Getting Started

1. Pull the latest changes
2. Run `npm install` to install new dependencies
3. Run `npx prisma generate` to generate the Prisma client
4. Set up your `.env` file with the following:
   ```
   MONGODB=mongodb+srv://username:password@cluster.mongodb.net/dbname
   DATABASE_URL=${MONGODB}
   JWT_SECRET=your_secret_key
   JWT_REFRESH_SECRET=your_refresh_secret_key
   ```
5. Start the application with Docker:
   ```
   docker-compose up -d
   ```

## Data Migration

If you need to migrate existing data from PostgreSQL to MongoDB, you'll need to:

1. Export data from PostgreSQL
2. Transform it to match the MongoDB schema
3. Import it into MongoDB

This process will depend on the amount and complexity of your data. For small datasets, you can manually recreate the data in MongoDB.

## Using Mongoose and Prisma Together

This project now supports both Prisma and Mongoose for database operations:

### Prisma
- Continues to work with existing API routes
- Schema defined in `prisma/schema.prisma`
- Automatic type generation with `npx prisma generate`

### Mongoose
- Direct MongoDB interaction
- Models defined in `models/` directory
- More flexible schema and validation options
- Better for complex MongoDB operations

### Examples

**Using Prisma:**
```typescript
import { db } from '@/lib/db';

// Create a user
const user = await db.user.create({
  data: {
    email,
    username,
    password: hashedPassword,
    role
  }
});
```

**Using Mongoose:**
```typescript
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

await dbConnect();

// Create a user
const user = await User.create({
  email,
  username,
  password: hashedPassword,
  role
});
```

## Development Notes

- MongoDB uses ObjectId for primary keys instead of UUIDs
- Relations work differently in MongoDB compared to PostgreSQL
- When working with IDs, ensure they're properly typed with `@db.ObjectId` in Prisma
- When using Mongoose, use the models in the `models/` directory
- The environment variables have been updated to use `MONGODB` as the primary connection string 