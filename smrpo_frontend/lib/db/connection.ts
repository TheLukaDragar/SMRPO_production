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

    const client = new MongoClient(uri);
    await client.connect();

    cachedClient = client;
    cachedDb = client;

    return {
        client,
        db: (name = dbName) => client.db(name),
    };
} 