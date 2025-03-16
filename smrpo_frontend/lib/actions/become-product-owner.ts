import { connectToDatabase } from "@/lib/db/connection";
import { ObjectId } from "mongodb";

export async function becomeProductOwner(projectId: string, userId: string) {
    try {
        if (!projectId || !userId) {
            return { error: "Project ID and User ID are required" };
        }

        const { db } = await connectToDatabase();
        const project = await db().collection("projects").findOne({ _id: new ObjectId(projectId) });

        if (!project) {
            return { error: "Project not found" };
        }

        // Ensure user is a member
        const isMember = project.members.some((member: { userId: string; role: string }) => member.userId === userId);
        if (!isMember) {
            return { error: "You must be a project member to become Product Owner" };
        }

        // Ensure there is currently no Product Owner
        const hasProductOwner = project.members.some((member: { userId: string; role: string }) => member.role === "PRODUCT_OWNER");
        if (hasProductOwner) {
            return { error: "This project already has a Product Owner." };
        }

        // Update user role to Product Owner
        await db().collection("projects").updateOne(
            { _id: new ObjectId(projectId), "members.userId": userId },
            { $set: { "members.$.role": "PRODUCT_OWNER" } }
        );

        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Internal Server Error" };
    }
}

import { becomeProductOwner as importedBecomeProductOwner } from "@/lib/actions/become-product-owner";

import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const { projectId, userId } = req.body;
        const result = await importedBecomeProductOwner(projectId, userId);

        if (result.error) {
            return res.status(400).json({ error: result.error });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

