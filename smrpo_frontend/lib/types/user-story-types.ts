import { User } from "@/lib/types/user-types";
import { CommentEntry } from "@/lib/types/projectPosts-types";
export interface UserStory {
    _id: string;
    title: string;
    projectId: string;
    description: string;
    owner: User;
    priority: string;
    storyPoints: number;
    dueDate: Date;
    sprintID: string | null;
    SprintPosition: string
    createdAt: Date;
    comments: CommentEntry[];
    rejectionComment: string;
}

export interface UserStoryNoId {
    title: string;
    projectId: string;
    description: string;
    owner: User;
    priority: string;
    storyPoints: number;
    dueDate: Date;
    sprintID: string | null; // Allow null here
    SprintPosition: string
    createdAt: Date;
}