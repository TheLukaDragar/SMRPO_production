import { z } from 'zod';

export const loginSchema = z.object({
    emailOrUsername: z.string().min(1, 'Email or username is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const userSchema = z.object({
    _id: z.string().optional(),
    userName: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    role: z.enum(['Administrator', 'Developer']),
    createdAt: z.date().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UserInput = z.infer<typeof userSchema>;

export const validateLogin = (data: unknown): LoginInput => {
    return loginSchema.parse(data);
};

export const validateUser = (data: unknown): UserInput => {
    return userSchema.parse(data);
}; 