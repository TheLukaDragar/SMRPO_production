'use server';

import {connectToDatabase} from "@/lib/db/connection";
import {revalidatePath} from 'next/cache';
import {genSalt, hash, compare} from "bcrypt-ts";
import {User, UserNoId, UserRole} from "../types/user-types";
import {ObjectId} from "mongodb";
import { validateUser, userSchema, validatePartialUser, partialUserSchema } from '../validations/auth-validations';
import { AppError, createErrorResponse } from '@/lib/utils/error-handling';
import { ZodError } from 'zod';
import type { ErrorResponse } from '@/lib/utils/error-handling';

export type { User };

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
   
    // Check for duplicate email (case-insensitive)
    const duplicateEmail = await db().collection('users').findOne({ 
        email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });
    if (duplicateEmail) {
        throw new Error("Email already registered");
    }

    // Check for duplicate username (case-insensitive)
    const duplicateUsername = await db().collection('users').findOne({ 
        userName: { $regex: new RegExp(`^${userName}$`, 'i') } 
    });
    if (duplicateUsername) {
        throw new Error("Username already exists");
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
    const user = await db().collection('users').findOne({ _id: new ObjectId(id) });
    if (!user) return null;
    
    // Convert string date back to Date object
    return {
        ...JSON.parse(JSON.stringify(user)),
        createdAt: new Date(user.createdAt)
    };
}

export async function getUsersByIds(ids: string[] | string) {
    const { db } = await connectToDatabase();

    const idsArray = Array.isArray(ids) ? ids : [ids];

    if (idsArray.length === 0) {
        throw new Error('No IDs provided');
    }

    const objectIds = idsArray.map(id => new ObjectId(id));

    const usersFromDb = await db().collection('users').find({
        _id: { $in: objectIds }
    }).toArray();

    const users = usersFromDb.map((user:User) => ({
        ...user,
        _id: user._id.toString(),
    }));

    return users;
}

// Update user
export async function updateUser(id: string, userData: Partial<User>): Promise<{ success: true } | ErrorResponse> {
    try {
        const { db } = await connectToDatabase();
        const { _id, currentPassword, ...updateData } = userData;

        // Get current user data
        const currentUser = await getUserById(id);
        if (!currentUser) {
            throw new AppError("User not found", 404, "NotFoundError");
        }

        // If updating password, verify current password
        if (updateData.password && currentPassword) {
            // Verify the current password matches
            const isPasswordValid = await compare(currentPassword, currentUser.password);
            if (!isPasswordValid) {
                throw new AppError("Current password is incorrect", 401, "AuthError");
            }
        } else if (updateData.password && !currentPassword) {
            throw new AppError("Current password is required to change password", 400, "ValidationError");
        }

        // Check for duplicate username (case-insensitive)
        if (updateData.userName && updateData.userName.toLowerCase() !== currentUser.userName.toLowerCase()) {
            const duplicateUser = await db().collection('users').findOne({ 
                userName: { $regex: new RegExp(`^${updateData.userName}$`, 'i') },
                _id: { $ne: new ObjectId(id) } // exclude current user
            });
            if (duplicateUser) {
                throw new AppError("Username already exists", 400, "ValidationError");
            }
        }

        // Check for duplicate email (case-insensitive)
        if (updateData.email && updateData.email.toLowerCase() !== currentUser.email.toLowerCase()) {
            const duplicateEmail = await db().collection('users').findOne({ 
                email: { $regex: new RegExp(`^${updateData.email}$`, 'i') },
                _id: { $ne: new ObjectId(id) } // exclude current user
            });
            if (duplicateEmail) {
                throw new AppError("Email already exists", 400, "ValidationError");
            }
        }

        // Create merged object for validation
        const mergedData = {
            ...currentUser,
            ...updateData,
            // Ensure createdAt is a Date object
            createdAt: currentUser.createdAt instanceof Date ? currentUser.createdAt : new Date(currentUser.createdAt)
        };

        // Validate the updated data using the partial schema
        try {
            validatePartialUser(mergedData);
        } catch (error) {
            if (error instanceof ZodError) {
                const validationErrors = error.errors.map(err => ({
                    field: err.path[0],
                    message: err.message
                }));
                throw new AppError(
                    validationErrors[0].message,
                    400,
                    'ValidationError',
                    validationErrors
                );
            }
            throw error;
        }

        // If password is being updated, ensure it's hashed
        if (updateData.password && !updateData.password.startsWith('$2')) {
            const salt = await genSalt(10);
            updateData.password = await hash(updateData.password, salt);
        }

        // Only include fields that have been provided
        const cleanUpdateData = Object.entries(updateData)
            .filter(([_, value]) => value !== undefined && value !== null && value !== '')
            .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

        if (Object.keys(cleanUpdateData).length === 0) {
            return { success: true }; // No changes to make
        }

        const result = await db().collection('users').updateOne(
            { _id: new ObjectId(id) },
            { $set: cleanUpdateData }
        );

        if (result.matchedCount === 0) {
            throw new AppError("User not found", 404, "NotFoundError");
        }

        // Revalidate appropriate paths
        revalidatePath('/dashboard/admin/user_managment');
        revalidatePath('/profile');
        return { success: true };
    } catch (error) {
        return createErrorResponse(error);
    }
}

// Handle user update form submission
export async function handleUpdateUser(formData: FormData, userId: string): Promise<{ success: true } | ErrorResponse> {
    try {
        const { db } = await connectToDatabase();

        // Retrieve the current user data
        const currentUser = await getUserById(userId);
        if (!currentUser) {
            throw new AppError("User not found", 404, "NotFoundError");
        }

        // Prepare update data object
        const updateData: Partial<User> = {};

        // Get form values
        const newUserName = formData.get("userName") as string;
        const firstName = formData.get("firstName") as string;
        const lastName = formData.get("lastName") as string;
        const email = formData.get("email") as string;
        const role = formData.get("role") as UserRole;
        const newPassword = formData.get("newPassword") as string;
        const currentPassword = formData.get("currentPassword") as string;

        // Only include fields that have changed
        if (newUserName && newUserName.toLowerCase() !== currentUser.userName.toLowerCase()) {
            updateData.userName = newUserName;
        }
        if (firstName && firstName !== currentUser.firstName) {
            updateData.firstName = firstName;
        }
        if (lastName && lastName !== currentUser.lastName) {
            updateData.lastName = lastName;
        }
        if (email && email.toLowerCase() !== currentUser.email.toLowerCase()) {
            updateData.email = email;
        }
        if (role && role !== currentUser.role) {
            updateData.role = role;
        }

        // Handle password update
        if (newPassword) {
            // If updating password, verify current password
            if (!currentPassword) {
                throw new AppError("Current password is required to change password", 400, "ValidationError");
            }
            
            updateData.password = newPassword;
            updateData.currentPassword = currentPassword;
        }

        // Create merged object for validation
        const validationData = {
            ...currentUser,
            ...updateData,
            // Ensure createdAt is a Date object
            createdAt: currentUser.createdAt instanceof Date ? currentUser.createdAt : new Date(currentUser.createdAt)
        };

        // Validate the updated data using Zod schema
        try {
            userSchema.parse(validationData);
        } catch (error) {
            if (error instanceof ZodError) {
                const validationErrors = error.errors.map(err => ({
                    field: err.path[0],
                    message: err.message
                }));
                throw new AppError(
                    validationErrors[0].message,
                    400,
                    'ValidationError',
                    validationErrors
                );
            }
            throw error;
        }

        return await updateUser(userId, updateData);
    } catch (error) {
        return createErrorResponse(error);
    }
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