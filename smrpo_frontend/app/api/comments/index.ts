import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import dbConnect from "@/lib/dbConnect";
import CommentModel from "@/models/Comment";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();

    if (req.method === "POST") {
        const session = await getSession({ req });
        if (!session || !session.user) return res.status(401).json({ message: "Unauthorized" });

        const { storyId, text } = req.body;

        if (!storyId || !text.trim()) return res.status(400).json({ message: "Missing data" });

        const newComment = await CommentModel.create({
            storyId,
            text,
            user: session.user.name || "Anonymous",
            createdAt: new Date(),
        });

        return res.status(201).json(newComment);
    }

    if (req.method === "GET") {
        const { storyId } = req.query;

        if (!storyId) return res.status(400).json({ message: "Missing storyId" });

        const comments = await CommentModel.find({ storyId }).sort({ createdAt: 1 });

        return res.status(200).json(comments);
    }

    return res.status(405).json({ message: "Method Not Allowed" });
}
