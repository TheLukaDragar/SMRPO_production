import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/connection';
import { Comment } from '@/lib/models/comment';

export async function GET(req: Request) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const storyId = searchParams.get('storyId');

        if (!storyId) {
            return NextResponse.json({ message: "Missing storyId" }, { status: 400 });
        }

        const comments = await Comment.find({ storyId }).sort({ createdAt: 1 });
        return NextResponse.json(comments);
    } catch (error) {
        console.error("GET /api/comments error:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectToDatabase();

        const session = await getSession();
        if (!session || !session.user?.userName) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        //const body = await req.json();
        let body;
        try {
            console.log("✅ Comment saved to DB:");
            body = await req.json();
        } catch (err) {
            console.error("Invalid JSON body:", err);
            return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
        }

        const { storyId, text } = body;

        if (!storyId || !text.trim()) {
            return NextResponse.json({ message: "Missing storyId or text" }, { status: 400 });
        }

        const newComment = await Comment.create({
            storyId,
            text,
            user: session.user.userName,
            createdAt: new Date(),
        });

        return NextResponse.json(newComment, { status: 201 });
    } catch (error) {
        console.error("POST /api/comments error:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
