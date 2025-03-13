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

export interface UserNoId {
    userName: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    createdAt: Date;
}