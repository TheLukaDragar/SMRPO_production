'use server';

import {connectToDatabase} from "@/lib/db/connection";
import {UserStoryNoId, UserStory} from "@/lib/types/user-story-types";
import {sprint, sprintNoId} from "@/lib/types/sprint-types";
import {ObjectId} from "mongodb";


// Get all user stories
export async function getAllUserStories() {
    const { db } = await connectToDatabase();
    const stories = await db().collection('userStory').find({}).toArray();
    return JSON.parse(JSON.stringify(stories));
}

//add Story
export async function addStory(story: UserStoryNoId) {
    const { db } = await connectToDatabase();
    const result = await db().collection('userStory').insertOne(story);

    return {
        acknowledged: result.acknowledged,
        insertedId: result.insertedId.toString(),
    };
}

export async function updateStory(story: UserStory) {
    const { db } = await connectToDatabase();
    const { _id, ...storyToUpdate } = story;

    const objectId = new ObjectId(_id);

    const result = await db().collection('userStory').updateOne(
        { _id: objectId },
        { $set: storyToUpdate }
    );

    return {
        acknowledged: result.acknowledged,
        modifiedCount: result.modifiedCount,
    };
}

//TODO: TO JE ZACASNO
export async function getAllSprints() {
    const { db } = await connectToDatabase();
    const sprints = await db().collection('sprint').find({}).toArray();
    return JSON.parse(JSON.stringify(sprints));
}

export async function newSprint(SprintToInsert: sprintNoId) {
    const { db } = await connectToDatabase();
    const result = await db().collection('sprint').insertOne(SprintToInsert);

    return {
        acknowledged: result.acknowledged,
        insertedId: result.insertedId.toString(),
    };
}

export async function updateSprint(SprintToUpdate: sprint) {
    const { db } = await connectToDatabase();
    const { _id, ...sprint_1 } = SprintToUpdate;

    const objectId = new ObjectId(_id);

    const result = await db().collection('sprint').updateOne(
        { _id: objectId },
        { $set: sprint_1 }
    );

    return {
        acknowledged: result.acknowledged,
        modifiedCount: result.modifiedCount,
    };
}

// New function for logging time for a user story
export async function logTimeForUserStory(storyId: string, time: number) {
    const { db } = await connectToDatabase();
    const objectId = new ObjectId(storyId);
    const result = await db().collection('userStory').updateOne(
        { _id: objectId },
        { $inc: { loggedTime: time } }
    );
    return {
        acknowledged: result.acknowledged,
        modifiedCount: result.modifiedCount,
    };
}