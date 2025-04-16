export interface CommentEntry {
    text: string;
    user: string;
    createdAt: string;
}

export interface projectPosts {
    _id: string;
    projectId: string;
    text: string;
    author: string;
    lastChangeDate: Date;
    comments?: CommentEntry[];
}

export interface projectPostsNoId {
    projectId: string;
    text: string;
    author: string;
    lastChangeDate: Date;
}

