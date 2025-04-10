'use server';

import {connectToDatabase} from "@/lib/db/connection";
import {UserStoryNoId, UserStory} from "@/lib/types/user-story-types";
import {sprint, sprintNoId} from "@/lib/types/sprint-types";
import {ObjectId} from "mongodb";
import {tasks, tasks_noId} from "@/lib/types/tasks";
import {projectPostsNoId} from "@/lib/types/projectPosts-types";


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

export async function getTasks() {
    const { db } = await connectToDatabase();
    const stories = await db().collection('tasks').find({}).toArray();
    return JSON.parse(JSON.stringify(stories));
}

export async function addTask(task: tasks_noId) {
    const { db } = await connectToDatabase();
    const result = await db().collection('tasks').insertOne(task);

    return {
        acknowledged: result.acknowledged,
        insertedId: result.insertedId.toString(),
    };
}

export async function updateTask(task: tasks) {
    const { db } = await connectToDatabase();
    const { _id, ...taskToUpdate } = task;

    const objectId = new ObjectId(_id);

    const result = await db().collection('tasks').updateOne(
        { _id: objectId },
        { $set: taskToUpdate }
    );

    return {
        acknowledged: result.acknowledged,
        modifiedCount: result.modifiedCount,
    };
}

export async function deleteTask(taskId: string) {
    const { db } = await connectToDatabase();
    const objectId = new ObjectId(taskId);

    const result = await db().collection('tasks').deleteOne({ _id: objectId });

    return {
        acknowledged: result.acknowledged,
        deletedCount: result.deletedCount,
    };
}


///project posts actions


// Get all posts
export async function getPosts() {
    const { db } = await connectToDatabase();
    const posts = await db().collection('projectPosts').find({}).toArray();
    return JSON.parse(JSON.stringify(posts));
}

//post by id
export async function getPostsById(StringId: string) {
    const { db } = await connectToDatabase();

    try {
        const objectId = new ObjectId(StringId);
        const posts = await db().collection('projectPosts').find({"projectId": objectId}).toArray();

        if (posts.length === 0) {
            const stringPosts = await db().collection('projectPosts').find({"projectId": StringId}).toArray();
            return JSON.parse(JSON.stringify(stringPosts));
        }

        return JSON.parse(JSON.stringify(posts));
    } catch (error) {
        console.error("Error in getPostsById:", error);

        const stringPosts = await db().collection('projectPosts').find({"projectId": StringId}).toArray();
        return JSON.parse(JSON.stringify(stringPosts));
    }
}

//post by id
export async function createPost(data: projectPostsNoId) {
    const { db } = await connectToDatabase();

    const result = await db().collection('projectPosts').insertOne(data);

    return {
        acknowledged: result.acknowledged,
        insertedId: result.insertedId.toString(),
    };
}