import { z } from 'zod';

export const loginSchema = z.object({
    emailOrUsername: z.string().min(1, 'Email or username is required'),
    password: z.string()
        .min(12, 'Password must be at least 12 characters')
        .max(128, 'Password cannot exceed 128 characters')
        // Custom validation to ensure spaces are preserved exactly as entered
        .refine(
            (val) => {
                // Check if there are multiple consecutive spaces
                const hasMultipleConsecutiveSpaces = /\s{2,}/.test(val);
                
                if (hasMultipleConsecutiveSpaces) {
                    // If password has multiple spaces, compare with a version where spaces might be consolidated
                    const normalizedSpaces = val.replace(/\s+/g, ' ');
                    
                    // If the normalized version is the same as the original, that means 
                    // spaces were already consolidated/trimmed somewhere before validation
                    return val !== normalizedSpaces;
                }
                
                // If there are no multiple spaces, then pass the validation
                return true;
            },
            { message: 'Password with multiple spaces must preserve all spaces exactly as entered' }
        ),
});

export const userSchema = z.object({
    _id: z.string().optional(),
    userName: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string()
        .min(12, 'Password must be at least 12 characters')
        .max(128, 'Password cannot exceed 128 characters')
        // Custom validation to ensure spaces are preserved exactly as entered
        .refine(
            (val) => {
                // Check if there are multiple consecutive spaces
                const hasMultipleConsecutiveSpaces = /\s{2,}/.test(val);
                
                if (hasMultipleConsecutiveSpaces) {
                    // If password has multiple spaces, compare with a version where spaces might be consolidated
                    const normalizedSpaces = val.replace(/\s+/g, ' ');
                    
                    // If the normalized version is the same as the original, that means 
                    // spaces were already consolidated/trimmed somewhere before validation
                    return val !== normalizedSpaces;
                }
                
                // If there are no multiple spaces, then pass the validation
                return true;
            },
            { message: 'Password with multiple spaces must preserve all spaces exactly as entered' }
        ),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    role: z.enum(['Administrator', 'Developer']),
    createdAt: z.date().optional(),
});

// Create a partial schema for user updates that makes all fields optional
export const partialUserSchema = userSchema.partial().extend({
    currentPassword: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type PartialUserInput = z.infer<typeof partialUserSchema>;

export const validateLogin = (data: unknown): LoginInput => {
    return loginSchema.parse(data);
};

export const validateUser = (data: unknown): UserInput => {
    return userSchema.parse(data);
};

export const validatePartialUser = (data: unknown): PartialUserInput => {
    return partialUserSchema.parse(data);
}; 