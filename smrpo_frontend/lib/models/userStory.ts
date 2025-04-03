import mongoose, { Schema, models } from "mongoose";

const UserStorySchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, required: true },
    storyPoints: { type: Number },
    sprintID: { type: String },
    SprintPosition: { type: String },
    createdAt: { type: Date, default: Date.now },
    owner: { type: Object }, // or use a User reference if preferred
    comment: { type: String, default: "" }, // ✅ your single comment field
});

export const UserStory =
    models.UserStory || mongoose.model("UserStory", UserStorySchema);
