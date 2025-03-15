'use server';

import {connectToDatabase} from "@/lib/db/connection";
import {revalidatePath} from 'next/cache';
import {genSalt, hash} from "bcrypt-ts";
import {User, UserNoId, UserRole} from "../types/user-types";
import {ObjectId} from "mongodb";
import { validateUser, userSchema } from '../validations/auth-validations';


// Get all users
export async function getUsers() {
    const { db } = await connectToDatabase();
    const users = await db().collection('users').find({}).toArray();
    return JSON.parse(JSON.stringify(users));
}

// Handle user form submission
export async function handleAddUser(formData: FormData) {
    const { db } = await connectToDatabase();

    const email = formData.get('email') as string;
    const userName = formData.get('userName') as string;
   

    // Check for duplicate email
    const duplicateEmail = await db().collection('users').findOne({ email });
    if (duplicateEmail) {
        throw new Error("Email already registered");
    }

    const userData : UserNoId = {
        userName,
        password: formData.get('password') as string,
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email,
        role: formData.get('role') as UserRole,
        createdAt: new Date(),
    };

    // Validate user data before hashing
    try {
        validateUser(userData);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Validation error: ${error.message}`);
        }
        throw error;
    }

    // Hash password after validation
    const salt = await genSalt(10);
    userData.password = await hash(userData.password, salt);

    await addUser(userData);
    revalidatePath('/users');
}

// Create a new user
export async function addUser(userData: UserNoId) {
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
    console.log(userData)
    const { db } = await connectToDatabase();

    const { _id, ...updateData } = userData;

    const result = await db().collection('users').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
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

    // Create merged object for validation
    const validationData = {
        ...currentUser,
        ...updateData
    };

    // Check and update password if provided - after initial validation
    const newPassword = formData.get("password") as string;
    if (newPassword) {
        validationData.password = newPassword;
        // Validate with the new unhashed password
        try {
            validateUser(validationData);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Validation error: ${error.message}`);
            }
            throw error;
        }
        // Only hash password after validation
        const salt = await genSalt(10);
        updateData.password = await hash(newPassword, salt);
    } else {
        // Validate without password change
        try {
            validateUser(validationData);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Validation error: ${error.message}`);
            }
            throw error;
        }
    }

    // Execute the update operation
    return await updateUser(userId, updateData);
}

// Delete user
export async function deleteUser(id: string) {
    const { db } = await connectToDatabase();
    const result = await db().collection('users').deleteOne({ _id: new ObjectId(id) });
    
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