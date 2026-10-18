import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = globalThis as unknown as { mongoose: MongooseCache };

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { conn: null, promise: null };
}

const cached: MongooseCache = globalWithMongoose.mongoose;

function getDatabaseUri(): string {
  const uri = process.env.DATABASE_URL;
  if (!uri || uri.trim() === "") {
    throw new Error(
      "FATAL: DATABASE_URL environment variable is not defined or is empty. MongoDB connection cannot proceed."
    );
  }
  return uri.trim();
}

async function dbConnect() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (cached.conn && mongoose.connection.readyState === 0) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const uri = getDatabaseUri();
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 20),
      minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE || 2),
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((m) => {
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function checkDatabaseHealth(): Promise<{
  ok: boolean;
  readyState: number;
  latencyMs?: number;
}> {
  try {
    if (mongoose.connection.readyState !== 1) {
      await dbConnect();
    }

    const start = Date.now();
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
    }
    const latencyMs = Date.now() - start;

    return {
      ok: true,
      readyState: mongoose.connection.readyState,
      latencyMs,
    };
  } catch {
    return {
      ok: false,
      readyState: mongoose.connection.readyState,
    };
  }
}

export default dbConnect;

