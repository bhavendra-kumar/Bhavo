import mongoose from "mongoose";

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development and reuse connections across serverless invocations.
 */
// @ts-expect-error - Global caching for Next.js
let cached = global.mongoose;

if (!cached) {
  // @ts-expect-error - Global caching for Next.js
  cached = global.mongoose = { conn: null, promise: null };
}

function getDatabaseUri(): string {
  const uri = process.env.DATABASE_URL;
  if (!uri || uri.trim() === "") {
    throw new Error(
      "FATAL: DATABASE_URL environment variable is not defined or is empty. MongoDB connection cannot proceed."
    );
  }
  return uri.trim();
}

/**
 * Connects to MongoDB with production-grade pooling and connection safety parameters.
 */
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

/**
 * Checks whether the current process has an active MongoDB connection.
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Performs a lightweight health check ping against the database.
 * Never leaks database credentials, internal hostnames, or connection strings.
 */
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

