import mongoose, { Schema, models } from "mongoose";

const UserStorySchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, required: true },
    storyPoints: { type: Number },
    sprintID: { type: String },
    SprintPosition: { type: String },
    createdAt: { type: Date, default: Date.now },
    owner: { type: Object },
    comment: { type: String, default: "" },
});

export const UserStory =
    models.UserStory || mongoose.model("UserStory", UserStorySchema);
