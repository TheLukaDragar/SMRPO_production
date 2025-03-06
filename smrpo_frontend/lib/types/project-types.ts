// Type for Project document
export enum ProjectRole {
    PRODUCT_OWNER = 'PRODUCT_OWNER',
    SCRUM_MASTER = 'SCRUM_MASTER',
    DEVELOPER = 'DEVELOPER'
}

export interface BoardColumn {
    id: string;
    name: string;
    order: number;
}

export interface Board {
    id: string;
    name: string;
    columns: BoardColumn[];
}

export interface ProjectMember {
    userId: string;
    role: ProjectRole;
    joinedAt: Date;
}

export interface Project {
    _id: string;
    name: string;
    description?: string;
    boards: Board[];
    members: ProjectMember[];
    createdAt: Date;
}

