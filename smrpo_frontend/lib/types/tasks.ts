import {User} from "@/lib/types/user-types";

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
    AssignedTo?: User;
}

export interface tasks_noId {
    userStoryId: string;
    description: string;
    timeEstimate: number;
    IsCompleted: boolean;
    isAccepted: boolean;
    startLog: Date;
    timeLogged: number;
    dueDate: Date;
    AssignedTo?: User;
}