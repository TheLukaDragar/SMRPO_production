import { NextResponse } from 'next/server';
import { MongoClient, Db } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = process.env.MONGODB_URI; // e.g., "mongodb+srv://user:password@cluster.mongodb.net"
const dbName = process.env.MONGODB_DB; // e.g., "mydatabase"

let cachedClient: MongoClient;
let cachedDb: Db;

async function connectToDatabase() {
  if (cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }
  if (!dbName) {
    throw new Error('Please define the MONGODB_DB environment variable');
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const userName = formData.get('userName')?.toString();
    const firstName = formData.get('firstName')?.toString();
    const lastName = formData.get('lastName')?.toString();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();

    // Validate required fields
    if (!email) {
      return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
    }

    // Build the update object
    const updateData: {
      userName?: string;
      firstName?: string;
      lastName?: string;
      password?: string;
    } = {};

    if (userName) updateData.userName = userName;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Connect to MongoDB and get the users collection
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Update user using email as a unique identifier
    const result = await usersCollection.updateOne(
      { email },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: 'User not found or no changes provided.' }, { status: 404 });
    }

    // Optionally, return the updated user document
    const updatedUser = await usersCollection.findOne({ email });

    return NextResponse.json(
      { message: 'Profile updated successfully!', data: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ message: 'Failed to update profile' }, { status: 500 });
  }
}