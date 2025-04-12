"use client";

import React, { use, useCallback, useEffect, useState } from "react";
import ProjectWallPosts from "@/components/ProjectWallPosts";
import { projectPosts } from "@/lib/types/projectPosts-types";
import { getPostsById } from "@/lib/actions/user-story-actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/hooks/useUser";

interface CommentEntry {
    text: string;
    user: string;
    createdAt: string;
}

export default function ProjectWall({ params }: { params: { projectId: string } }) {
    const [posts, setPosts] = useState<projectPosts[]>([]);
    const [projectComments, setProjectComments] = useState<CommentEntry[]>([]);
    const [newComment, setNewComment] = useState("");
    const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [showAll, setShowAll] = useState(false);
    const { user } = useUser();

    const projectId = use(params).projectId;

    const fetchPostsById = useCallback(async () => {
        try {
            const got_posts = await getPostsById(projectId);
            setPosts(got_posts);
        } catch (error) {
            console.error("Error fetching posts:", error);
        }
    }, [projectId]);

    useEffect(() => {
        fetchPostsById();
    }, [fetchPostsById]);

    const submitComment = async () => {
        if (!newComment.trim() || !user?.userName) return;

        setStatus("saving");

        const comment: CommentEntry = {
            text: newComment,
            user: user.userName,
            createdAt: new Date().toISOString(),
        };

        try {
            // You can hook this up to backend later
            setProjectComments((prev) => [...prev, comment]);
            setNewComment("");
            setStatus("saved");
        } catch (err) {
            console.error("Failed to save comment", err);
            setStatus("error");
        }
    };

    const latestComment = projectComments.length > 0 ? projectComments[projectComments.length - 1] : null;

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Project Wall</h1>
            <ProjectWallPosts project_id={projectId} posts={posts} setPosts={setPosts} />

            <div className="mt-10 border-t pt-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Project Comments</h2>

                <Textarea
                    placeholder="Write your comment about the project..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mb-2"
                />
                <Button onClick={submitComment} disabled={status === "saving"}>
                    {status === "saving" ? "Saving..." : "Submit Comment"}
                </Button>

                {status === "saved" && <p className="text-sm text-green-600 mt-2">Comment submitted.</p>}
                {status === "error" && <p className="text-sm text-red-600 mt-2">Failed to submit comment.</p>}

                <div className="mt-6 space-y-4">
                    {projectComments.length === 0 ? (
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
                                projectComments.map((comment, index) => (
                                    <div key={index} className="border rounded p-3 bg-gray-50 text-sm shadow-sm">
                                        <div className="text-gray-800 mb-1 whitespace-pre-line">{comment.text}</div>
                                        <div className="text-xs text-gray-500">
                                            — {comment.user}, {new Date(comment.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            {projectComments.length > 1 && (
                                <button onClick={() => setShowAll(!showAll)} className="text-blue-600 text-sm">
                                    {showAll ? "Hide older comments" : "View more comments"}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
