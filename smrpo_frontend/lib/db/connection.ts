import { MongoClient } from 'mongodb';

interface MongoDBConnection {
    client: MongoClient;
    db: (dbName?: string) => any;
}

const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB || 'nextjs-app';

let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

export async function connectToDatabase(): Promise<MongoDBConnection> {
    if (cachedClient && cachedDb) {
        return {
            client: cachedClient,
            db: (name = dbName) => cachedDb.db(name),
        };
    }

    const client = new MongoClient(uri, {
        connectTimeoutMS: 5000, // 5 seconds timeout for initial connection
        socketTimeoutMS: 30000, // 30 seconds for operations
        maxPoolSize: 10, // Limit concurrent connections
        minPoolSize: 0,
        maxIdleTimeMS: 30000, // Close idle connections after 30 seconds
    });
    await client.connect();

    cachedClient = client;
    cachedDb = client;

    return {
        client,
        db: (name = dbName) => client.db(name),
    };
} 