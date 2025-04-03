import mongoose, { Schema, models } from "mongoose";

const CommentSchema = new Schema({
    storyId: { type: String, required: true },
    user: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }

});

export const Comment = models.Comment || mongoose.model("Comment", CommentSchema);
