export interface projectPosts {
    _id: string;
    projectId: string;
    text: string;
    author: string;
    lastChangeDate: Date;
}

export interface projectPostsNoId {
    projectId: string;
    text: string;
    author: string;
    lastChangeDate: Date;
}