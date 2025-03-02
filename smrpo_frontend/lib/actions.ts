'use server';

import { connectToDatabase} from "@/lib/mongodbConn";
import { revalidatePath } from 'next/cache';
import { genSalt, hash } from "bcrypt-ts";


//ime, priimek, e-pošta
// Type for User document
interface User {
    userName: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

// Get all users
export async function getUsers() {
    const { db } = await connectToDatabase();
    const users = await db().collection('users').find({}).toArray();
    return JSON.parse(JSON.stringify(users));
}

export async function handleAddUser(formData: FormData) {
    const salt = await genSalt(10);

    const userData = {
        userName: formData.get('userName') as string,
        password: await hash(formData.get('password') as string, salt),
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email: formData.get('email') as string,
        role: formData.get('role') as string,
    };

    await addUser(userData);

    revalidatePath('/');
}

// Create a new user
export async function addUser(userData: User) {
    const { db } = await connectToDatabase();
    const result = await db().collection('users').insertOne({
        ...userData,
        createdAt: new Date(),
    });

    revalidatePath('/users');

    return result;
}