'use server';

import { connectToDatabase } from "@/lib/db/connection";
import { revalidatePath } from 'next/cache';
import { genSalt, hash } from "bcrypt-ts";
import { User } from "../types/user-types";


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


// Handle user update form submission
export async function handleUpdateUser(formData: FormData, userId: string) {
    const { db } = await connectToDatabase();

    // Retrieve the current user data
    const currentUser = await getUserById(userId);
    if (!currentUser) {
        throw new Error("User not found");
    }

    // Prepare update data object
    const updateData: Partial<User> = {};

    // Check and update username (prevent duplicates)
    const newUserName = formData.get("userName") as string;
    if (newUserName && newUserName !== currentUser.userName) {
        const duplicate = await db().collection('users').findOne({ userName: newUserName });
        if (duplicate) {
            throw new Error("Username already exists");
        }
        updateData.userName = newUserName;
    }

    // Check and update password if provided
    const newPassword = formData.get("password") as string;
    if (newPassword) {
        const salt = await genSalt(10);
        updateData.password = await hash(newPassword, salt);
    }

    // Update other personal details
    const firstName = formData.get("firstName") as string;
    if (firstName) {
        updateData.firstName = firstName;
    }
    const lastName = formData.get("lastName") as string;
    if (lastName) {
        updateData.lastName = lastName;
    }
    const email = formData.get("email") as string;
    if (email) {
        updateData.email = email;
    }

    // Execute the update operation
    const result = await updateUser(userId, updateData);
    return result;
}

// Delete user
export async function deleteUser(id: string) {
    const { db } = await connectToDatabase();
    const result = await db().collection('users').deleteOne({ _id: id });
    
    revalidatePath('/users');
    return result;
}

// Search users by username
export async function searchUsers(query: string) {
    const { db } = await connectToDatabase();
    const users = await db().collection('users')
        .find({ 
            userName: { 
                $regex: new RegExp(query, 'i') 
            }
        })
        .limit(5)
        .toArray();
    return JSON.parse(JSON.stringify(users));
} 