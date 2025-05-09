"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateStory } from "@/lib/actions/user-story-actions";
import { UserStory } from "@/lib/types/user-story-types";
import { CommentEntry } from "@/lib/types/projectPosts-types";
import { useUser } from "@/lib/hooks/useUser";

interface CommentSectionProps {
    storyId: string;
    storyData: UserStory;
    userRole: string;
    onCommentUpdate?: (updatedStory: UserStory) => void;
}

export default function CommentSection({
    storyId,
    storyData,
    userRole,
    onCommentUpdate
}: CommentSectionProps) {
    const [text, setText] = useState("");
    const [comments, setComments] = useState<CommentEntry[]>(storyData.comments || []);
    const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [showAll, setShowAll] = useState(false);
    const isProductOwner = userRole === "PRODUCT_OWNER";
    const { user } = useUser();

    const saveComment = async () => {
        if (!text.trim() || !user?.userName) return;

        setStatus("saving");

        const newComment: CommentEntry = {
            text,
            user: user.userName,
            createdAt: new Date().toISOString(),
        };

        // Append the new comment to the existing ones
        const updatedComments = [...comments, newComment];
        const updated = {
            ...storyData,
            comments: updatedComments,
        };

        try {
            const updatedStory = await updateStory(updated);
            if (updatedStory) {
                setComments(updatedStory.comments || []);
                setText("");
                setStatus("saved");
                if (onCommentUpdate) {
                    onCommentUpdate(updatedStory);
                }
            }
        } catch (err) {
            console.error("Error saving comment:", err);
            setStatus("error");
        }
    };

    // Helper: Display the most recent comment
    const latestComment = comments.length > 0 ? comments[comments.length - 1] : null;

    return (
        <div className="mt-4 border-t pt-4">
            <h3 className="font-semibold text-gray-700 mb-2">Comments</h3>

            <Textarea
                placeholder="Write your comment..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="mb-2"
            />
            {!isProductOwner && (
                <Button onClick={saveComment} disabled={status === "saving"}>
                    {status === "saving" ? "Saving..." : "Submit Comment"}
                </Button>
            )}

            {status === "saved" && (
                <p className="text-sm text-green-600 mt-2">Comment submitted.</p>
            )}
            {status === "error" && (
                <p className="text-sm text-red-600 mt-2">Failed to submit comment.</p>
            )}

            <div className="mt-4 space-y-4">
                {comments.length === 0 ? (
                    <p className="text-sm text-gray-500">No comments yet.</p>
                ) : (
                    <>
                        {/* If not showing all, display only the most recent comment */}
                        {!showAll && latestComment && (
                            <div className="border rounded p-3 bg-gray-50 text-sm shadow-sm">
                                <div className="text-gray-800 mb-1 whitespace-pre-line">
                                    {latestComment.text}
                                </div>
                                <div className="text-xs text-gray-500">
                                    — {latestComment.user}, {new Date(latestComment.createdAt).toLocaleString()}
                                </div>
                            </div>
                        )}
                        {/* If showing all, display all comments */}
                        {showAll && comments.map((comment, index) => (
                            <div key={index} className="border rounded p-3 bg-gray-50 text-sm shadow-sm">
                                <div className="text-gray-800 mb-1 whitespace-pre-line">
                                    {comment.text}
                                </div>
                                <div className="text-xs text-gray-500">
                                    — {comment.user}, {new Date(comment.createdAt).toLocaleString()}
                                </div>
                            </div>
                        ))}
                        {/* Show the toggle button only if there is more than one comment */}
                        {comments.length > 1 && (
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="text-blue-600 text-sm"
                            >
                                {showAll ? "Hide older comments" : "View more comments"}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
