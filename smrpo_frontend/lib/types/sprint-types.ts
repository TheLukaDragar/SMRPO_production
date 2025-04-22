export interface sprint {
    _id: string;
    projectId: string;
    sprintName: string;
    isActive: boolean;
    sprintParts: string[];
    startDate?: Date;
    endDate?: Date;
    velocity?: number;
}

export interface sprintNoId {
    projectId: string;
    sprintName: string;
    isActive: boolean;
    sprintParts: string[];
    startDate?: Date;
    endDate?: Date;
    velocity?: number;
}

