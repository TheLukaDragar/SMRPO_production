'use server';

import {connectToDatabase} from "@/lib/db/connection";
import {UserStoryNoId} from "@/lib/types/user-story-types";


// Get all user stories
export async function getAllUserStories() {
    const { db } = await connectToDatabase();
    const stories = await db().collection('userStory').find({}).toArray();
    return JSON.parse(JSON.stringify(stories));
}

//add Story
export async function addStory(story: UserStoryNoId) {
    const { db } = await connectToDatabase();
    const result = await db().collection('userStory').insertOne({
        ...story,
        createdAt: new Date(),
    });

    return result;
}

//TODO: TO JE ZACASNO
export async function getAllSprints() {
    const { db } = await connectToDatabase();
    const users = await db().collection('sprint').find({}).toArray();
    return JSON.parse(JSON.stringify(users));
}
