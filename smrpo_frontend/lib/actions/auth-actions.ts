'use server';

import { cookies } from 'next/headers';
import { compare, hash, genSalt } from 'bcrypt-ts';
import { connectToDatabase } from '@/lib/db/connection';
import { validateLogin, validateUser } from '../validations/auth-validations';
import { AppError, createErrorResponse, ErrorResponse } from '../utils/error-handling';
import { redirect } from 'next/navigation';
import { ZodError } from 'zod';
import { UserRole } from '../types/user-types';
import { ObjectId } from 'mongodb';

export async function login(formData: FormData): Promise<{ success: true; requireTwoFactor?: boolean; userId?: string } | ErrorResponse> {
    try {
        const loginData = {
            emailOrUsername: formData.get('emailOrUsername') as string,
            password: formData.get('password') as string,
        };

        // Validate input
        const validatedData = validateLogin(loginData);

        const { db } = await connectToDatabase();
        const user = await db().collection('users').findOne({
            $or: [
                { email: { $regex: new RegExp(`^${validatedData.emailOrUsername}$`, 'i') } },
                { userName: { $regex: new RegExp(`^${validatedData.emailOrUsername}$`, 'i') } }
            ]
        });

        // Update lastAttemptedLogin regardless of whether credentials are valid
        if (user) {
            await db().collection('users').updateOne(
                { _id: user._id },
                { $set: { lastAttemptedLogin: new Date() } }
            );
        }

        if (!user) {
            return createErrorResponse(new AppError('Invalid credentials', 401, 'AuthError'));
        }

        // Compare password
        const isPasswordValid = await compare(validatedData.password, user.password);
        if (!isPasswordValid) {
            return createErrorResponse(new AppError('Invalid credentials', 401, 'AuthError'));
        }

        // Create session
        const token = await createSession(user._id);

        // Set session cookie
        (await cookies()).set('session_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        // Check if 2FA is enabled
        if (user.twoFactorEnabled) {
            return { 
                success: true, 
                requireTwoFactor: true,
                userId: user._id.toString()
            };
        }

        return { success: true };
    } catch (error) {
        if (error instanceof ZodError) {
            // Format Zod validation errors into a user-friendly message
            const validationErrors = error.errors.map(err => ({
                field: err.path[0],
                message: err.message
            }));
            return createErrorResponse(new AppError(
                validationErrors[0].message,
                400,
                'ValidationError',
                validationErrors
            ));
        }
        return createErrorResponse(error);
    }
}

export async function register(formData: FormData): Promise<{ success: true } | ErrorResponse> {
    try {
        const userData = {
            userName: formData.get('userName') as string,
            password: formData.get('password') as string,
            firstName: formData.get('firstName') as string,
            lastName: formData.get('lastName') as string,
            email: formData.get('email') as string,
            role: formData.get('role') as UserRole,
        };

        // Validate input first
        const validatedData = validateUser(userData);

        const { db } = await connectToDatabase();

        // Check if email already exists (case-insensitive)
        const existingUserByEmail = await db().collection('users').findOne({ 
            email: { $regex: new RegExp(`^${validatedData.email}$`, 'i') } 
        });
        if (existingUserByEmail) {
            return createErrorResponse(new AppError('Email already registered', 400, 'ValidationError'));
        }

        // Check if username already exists (case-insensitive)
        const existingUserByUsername = await db().collection('users').findOne({ 
            userName: { $regex: new RegExp(`^${validatedData.userName}$`, 'i') } 
        });
        if (existingUserByUsername) {
            return createErrorResponse(new AppError('Username already taken', 400, 'ValidationError'));
        }

        // Only hash password after all validations pass
        const salt = await genSalt(10);
        const hashedPassword = await hash(validatedData.password, salt);

        // Create user with hashed password
        await db().collection('users').insertOne({
            ...validatedData,
            password: hashedPassword,
            createdAt: new Date(),
        });

        return { success: true };
    } catch (error) {
        if (error instanceof ZodError) {
            // Format Zod validation errors into a user-friendly message
            const validationErrors = error.errors.map(err => ({
                field: err.path[0],
                message: err.message
            }));
            return createErrorResponse(new AppError(
                validationErrors[0].message,
                400,
                'ValidationError',
                validationErrors
            ));
        }
        return createErrorResponse(error);
    }
}

export async function logout() {
    try {
        const sessionToken = (await cookies()).get('session_token')?.value;

        if (sessionToken) {
            const { db } = await connectToDatabase();
            await db().collection('sessions').deleteOne({ token: sessionToken });
            (await cookies()).delete('session_token');
        }

        redirect('/login');
    } catch (error) {
        console.error('Error during logout:', error);
        redirect('/login');
    }
}

async function createSession(userId: string | ObjectId): Promise<string> {
    const { db } = await connectToDatabase();
    const token = generateSessionToken();

    await db().collection('sessions').insertOne({
        token,
        userId: typeof userId === 'string' ? new ObjectId(userId) : userId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        twoFactorVerified: false, // Add this field for 2FA status
    });

    return token;
}

function generateSessionToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
} 