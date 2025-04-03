"use client";

import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Comment {
    id: string;
    user: string;
    text: string;
    createdAt: string;
}

export default function CommentSection({ storyId }: { storyId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [text, setText] = useState("");

    useEffect(() => {
        fetch(`/api/comments?storyId=${storyId}`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setComments(data);
                } else {
                    console.error("Failed to fetch comments:", data);
                    setComments([]);
                }
            })
            .catch((err) => {
                console.error("Error fetching comments:", err);
                setComments([]);
            });
    }, [storyId]);

    const submitComment = async () => {
        if (!text.trim()) return;

        const res = await fetch("/api/comments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ storyId, text }),
        });

        if (res.ok) {
            const newComment = await res.json();
            setComments((prev) => [...prev, newComment]);
            setText("");
        }
    };

    return (
        <div className="mt-4 border-t pt-4">
            <h3 className="font-semibold text-gray-700 mb-2">Comments</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
                {comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-100 rounded p-2 text-sm">
                        <div className="text-gray-800">{comment.text}</div>
                        <div className="text-gray-400 text-xs">{new Date(comment.createdAt).toLocaleString()}</div>
                    </div>
                ))}
            </div>
            <Textarea
                placeholder="Type your comment..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="mt-3"
            />
            <Button className="mt-2" onClick={submitComment}>
                Submit
            </Button>
            <div className="max-h-52 overflow-y-auto space-y-3 mb-4 border border-gray-200 rounded p-3 bg-white shadow-inner">
                {comments.length === 0 ? (
                    <p className="text-sm text-gray-500">No comments yet.</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="border-b pb-2">
                            <div className="text-sm text-gray-800">{comment.text}</div>
                            <div className="text-xs text-gray-400 mt-1">
                                {new Date(comment.createdAt).toLocaleString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>


    );
}
