import mongoose, { Connection } from "mongoose";

// Define the structure for the cached mongoose connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the NodeJS Global interface to include mongoose
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
    // If we have a cached connection, return it
    if (cached.conn) {
        console.log("Using cached database connection");
        return cached.conn;
    }

    // If no cached promise exists, create a new connection promise
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            minPoolSize: 1,
            socketTimeoutMS: 30000,
            family: 4,
            serverSelectionTimeoutMS: 5000,
        };

        cached.promise = mongoose.connect(MONGODB_URI as string, opts)
            .then((mongoose) => {
                console.log("New database connection established");
                return mongoose;
            })
            .catch((error) => {
                console.error("Database connection error:", error);
                cached.promise = null; // Reset the promise on error
                throw error;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        throw error;
    }

    return cached.conn;
}