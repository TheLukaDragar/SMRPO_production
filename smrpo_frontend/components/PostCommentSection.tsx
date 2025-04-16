"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CommentEntry, projectPosts } from "@/lib/types/projectPosts-types";
import { useUser } from "@/lib/hooks/useUser";
import { addCommentToPost } from "@/lib/actions/user-story-actions";

export default function PostCommentSection({
    post,
    onUpdateComments
}: {
    post: projectPosts;
    onUpdateComments: (comments: CommentEntry[]) => void;
}) {
    const [text, setText] = useState("");
    const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [showAll, setShowAll] = useState(false);
    const { user } = useUser();

    const comments = post.comments || [];
    const latestComment = comments.length > 0 ? comments[comments.length - 1] : null;

    const saveComment = async () => {
        if (!text.trim() || !user?.userName) return;

        setStatus("saving");

        const newComment: CommentEntry = {
            text,
            user: user.userName,
            createdAt: new Date().toISOString()
        };

        try {
            await addCommentToPost(post._id, newComment);
            const updatedComments = [...comments, newComment];
            onUpdateComments(updatedComments); // Send update to parent
            setText("");
            setStatus("saved");
        } catch (err) {
            console.error("Failed to save comment", err);
            setStatus("error");
        }
    };

    return (
        <div className="mt-4 border-t pt-4">
            <h4 className="font-semibold text-gray-700 mb-2">Comments</h4>
            <Textarea
                placeholder="Write a comment..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="mb-2"
            />
            <Button onClick={saveComment} disabled={status === "saving"}>
                {status === "saving" ? "Saving..." : "Submit"}
            </Button>

            {status === "saved" && <p className="text-sm text-green-600 mt-2">Comment submitted.</p>}
            {status === "error" && <p className="text-sm text-red-600 mt-2">Failed to submit comment.</p>}

            <div className="mt-4 space-y-4">
                {comments.length === 0 ? (
                    <p className="text-sm text-gray-500">No comments yet.</p>
                ) : (
                    <>
                        {!showAll && latestComment && (
                            <div className="border rounded p-3 bg-gray-50 text-sm shadow-sm">
                                <div className="text-gray-800 mb-1 whitespace-pre-line">{latestComment.text}</div>
                                <div className="text-xs text-gray-500">
                                    — {latestComment.user}, {new Date(latestComment.createdAt).toLocaleString()}
                                </div>
                            </div>
                        )}
                        {showAll &&
                            comments.map((comment, index) => (
                                <div key={index} className="border rounded p-3 bg-gray-50 text-sm shadow-sm">
                                    <div className="text-gray-800 mb-1 whitespace-pre-line">{comment.text}</div>
                                    <div className="text-xs text-gray-500">
                                        — {comment.user}, {new Date(comment.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        {comments.length > 1 && (
                            <button onClick={() => setShowAll(!showAll)} className="text-blue-600 text-sm">
                                {showAll ? "Hide older comments" : "View more comments"}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
