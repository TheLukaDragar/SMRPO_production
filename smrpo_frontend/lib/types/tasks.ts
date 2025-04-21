import {User} from "@/lib/types/user-types";

// Define a type for individual time log entries
export interface TimeLogEntry {
    timeLogged: number;
    timeEstimate: number;
    logDate: string;
    loggedBy: string; // User ID who logged the time
}

export interface tasks {
    _id: string;
    userStoryId: string;
    description: string;
    timeEstimate: number;
    IsCompleted: boolean;
    isAccepted: boolean;
    startLog: Date;
    timeLogged: number;
    dueDate: Date;
    lastLogDate?: string; // For backward compatibility
    AssignedTo?: User;
    timeLogHistory?: TimeLogEntry[]; // Array to store log history
}

export interface tasks_noId {
    userStoryId: string;
    description: string;
    timeEstimate: number;
    IsCompleted: boolean;
    isAccepted: boolean;
    startLog: Date | null;
    timeLogged: number;
    dueDate: Date;
    lastLogDate?: string; // For backward compatibility
    AssignedTo?: User;
    timeLogHistory?: TimeLogEntry[]; // Array to store log history
}