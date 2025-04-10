// Type for User document
export enum UserRole {
    ADMINISTRATOR = 'Administrator',
    DEVELOPER = 'Developer',
}

export interface User {
    _id: string;
    userName: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    createdAt: Date;
    currentPassword?: string; // Optional for password verification
    twoFactorEnabled?: boolean; // Whether 2FA is enabled
    twoFactorSecret?: string; // Secret for 2FA verification
    twoFactorRecoveryCode?: string; // Recovery code for 2FA
}

export interface UserNoId {
    userName: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    createdAt: Date;
    currentPassword?: string; // Optional for password verification
    twoFactorEnabled?: boolean; // Whether 2FA is enabled
    twoFactorSecret?: string; // Secret for 2FA verification
    twoFactorRecoveryCode?: string; // Recovery code for 2FA
}