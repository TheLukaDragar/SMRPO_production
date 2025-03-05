'use server';

import { connectToDatabase } from "@/lib/db/connection";
import { revalidatePath } from 'next/cache';
import { genSalt, hash } from "bcrypt-ts";

// Type for User document
export interface User {
    _id: string;
    userName: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    createdAt: Date;
}

// Get all users
export async function getUsers() {
    const { db } = await connectToDatabase();
    const users = await db().collection('users').find({}).toArray();
    return JSON.parse(JSON.stringify(users));
}

// Handle user form submission
export async function handleAddUser(formData: FormData) {
    const salt = await genSalt(10);

    const userData: User = {
        _id: '', // This will be replaced by MongoDB
        userName: formData.get('userName') as string,
        password: await hash(formData.get('password') as string, salt),
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email: formData.get('email') as string,
        role: formData.get('role') as string,
        createdAt: new Date(),
    };

    await addUser(userData);
    revalidatePath('/users');
}

// Create a new user
export async function addUser(userData: User) {
    const { db } = await connectToDatabase();
    const result = await db().collection('users').insertOne({
        ...userData,
        createdAt: new Date(),
    });

    return result;
}

// Get user by ID
export async function getUserById(id: string) {
    const { db } = await connectToDatabase();
    const user = await db().collection('users').findOne({ _id: id });
    return user ? JSON.parse(JSON.stringify(user)) : null;
}

// Update user
export async function updateUser(id: string, userData: Partial<User>) {
    const { db } = await connectToDatabase();
    const result = await db().collection('users').updateOne(
        { _id: id },
        { $set: userData }
    );
    
    revalidatePath('/users');
    return result;
}

// Delete user
export async function deleteUser(id: string) {
    const { db } = await connectToDatabase();
    const result = await db().collection('users').deleteOne({ _id: id });
    
    revalidatePath('/users');
    return result;
} 