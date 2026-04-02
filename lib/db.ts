import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const HARD_CONNECT_TIMEOUT_MS = 15000;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = globalThis.mongooseCache;

if (!cached) {
  cached = globalThis.mongooseCache = { conn: null, promise: null };
}

function withHardTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('MongoDB connection timeout'));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Fail fast when Atlas DNS/network is unavailable so API routes can fallback quickly.
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await withHardTimeout(cached.promise, HARD_CONNECT_TIMEOUT_MS);
  } catch (e: any) {
    // One retry for transient DNS/network blips that can happen on local dev networks.
    const message = String(e?.message || '');
    if (/ENOTFOUND|querySrv|ECONNREFUSED|timeout|MongoDB connection timeout/i.test(message)) {
      cached.promise = null;
      const retryOpts = {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      };
      cached.promise = mongoose.connect(MONGODB_URI, retryOpts);
      try {
        cached.conn = await withHardTimeout(cached.promise, HARD_CONNECT_TIMEOUT_MS);
        return cached.conn;
      } catch (retryError) {
        cached.promise = null;
        throw retryError;
      }
    }

    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
