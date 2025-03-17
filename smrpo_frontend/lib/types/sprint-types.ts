export interface sprint {
    _id: string;
    sprintName: string;
    projectId: string;
    sprintParts: [];
    isActive: boolean;
}

export interface sprintNoId {
    sprintName: string;
    projectId: string;
    sprintParts: [];
    isActive: boolean;
}