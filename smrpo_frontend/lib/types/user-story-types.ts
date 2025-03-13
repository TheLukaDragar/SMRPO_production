import {User} from "@/lib/types/user-types";

export interface UserStory {
    _id: string;
    title: string;
    description: string;
    owner: User;
    priority: string;
    storyPoints: number;
    dueDate: Date;
    sprintID: string
    SprintPosition: string
    createdAt: Date;
}

export interface UserStoryNoId {
    title: string;
    description: string;
    owner: User;
    priority: string;
    storyPoints: number;
    dueDate: Date;
    sprintID: string
    SprintPosition: string
    createdAt: Date;
}