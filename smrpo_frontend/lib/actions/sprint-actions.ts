import {connectToDatabase} from "@/lib/db/connection";

export async function getAllSprints() {
    const { db } = await connectToDatabase();
    const users = await db().collection('users').find({}).toArray();
    return JSON.parse(JSON.stringify(users));
}
