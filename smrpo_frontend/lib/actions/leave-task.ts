import { connectToDatabase } from "@/lib/db/connection";
import { getSession } from "@/lib/auth/session";
import { ObjectId } from "mongodb";

export async function leaveTask(projectId: string) {
    try {
        const { db } = await connectToDatabase();
        const session = await getSession();

        if (!session?.user?._id) {
            return { error: "User not authenticated" };
        }

        if (!projectId) {
            return { error: "Project ID is required" };
        }

        const project = await db().collection("projects").findOne({ _id: new ObjectId(projectId) });

        if (!project) {
            return { error: "Project not found" };
        }

        // Find the user in the members list
        const userIndex = project.members.findIndex((member: { userId: string; role: string }) => member.userId === session.user._id);
        if (userIndex === -1) {
            return { error: "You are not a member of this project" };
        }

        // Check if user is the only Product Owner
        const productOwnerCount = project.members.filter((member: { userId: string; role: string }) => member.role === "PRODUCT_OWNER").length;

        if (project.members[userIndex].role === "PRODUCT_OWNER" && productOwnerCount === 1) {
            // Instead of removing them, set role to "UNASSIGNED"
            await db().collection("projects").updateOne(
                { _id: new ObjectId(projectId), "members.userId": session.user._id },
                { $set: { "members.$.role": "UNASSIGNED" } }
            );
            return { success: true, message: "You have left the project. Another user must be assigned as Product Owner." };
        }

        // Otherwise, remove the member
        await db().collection("projects").updateOne(
            { _id: new ObjectId(projectId) },
            { $pull: { members: { userId: session.user._id } } }
        );

        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Internal Server Error" };
    }
}