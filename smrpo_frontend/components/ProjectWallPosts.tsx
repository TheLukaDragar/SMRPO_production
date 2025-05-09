"use client"

import React, { useEffect, useRef, useState } from "react";
import { useUser } from "@/lib/hooks/useUser";
import ProjectWallPost from "@/components/ProjectWallPost";
import { createPost } from "@/lib/actions/user-story-actions";
import { projectPosts, projectPostsNoId } from "@/lib/types/projectPosts-types";
import PostCommentSection from "./PostCommentSection";

interface ProjectWallPostsProps {
    project_id: string;
    posts?: projectPosts[];
    setPosts: React.Dispatch<React.SetStateAction<projectPosts[]>>;
}

const ProjectWallPosts: React.FC<ProjectWallPostsProps> = ({ project_id, posts, setPosts }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user } = useUser();

    useEffect(() => {
        setIsAdmin(user?.role === "Administrator")
    }, [user]);

    const handlePost = async () => {
        if (!user || !input.trim()) return;

        const newPost: projectPostsNoId = {
            projectId: project_id,
            text: input,
            author: user.userName,
            lastChangeDate: new Date()
        };

        const newPostId = await createPost(newPost);

        const updatedUserStoryId = {
            _id: newPostId.insertedId,
            ...newPost,
            comments: []
        };
        if (posts) {
            setPosts([...posts, updatedUserStoryId as projectPosts]);
        }
        setInput('');
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handlePost();
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-md w-full">
            <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <div className="mb-16">
                    {posts && posts.length > 0 ? (
                        posts.map((post, index) => (
                            <div key={post._id} className="mb-10">
                                <ProjectWallPost
                                    author={post.author}
                                    lastChangeDate={post.lastChangeDate}
                                    text={post.text}
                                    postId={post._id}
                                />
                                <PostCommentSection
                                    post={post}
                                    onUpdateComments={(newComments) => {
                                        const updatedPosts = [...posts];
                                        updatedPosts[index] = { ...updatedPosts[index], comments: newComments };
                                        setPosts(updatedPosts);
                                    }}
                                />
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center py-4">No posts yet. Be the first to post!</p>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="border-t p-4 bg-white fixed bottom-0 left-0 right-0 z-10 shadow-md">
                    <div className="flex space-x-2 max-w-4xl mx-auto">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                // if (e.key === 'Enter' && !e.shiftKey) {
                                //     e.preventDefault();
                                //     handlePost();
                                // }
                            }}
                            placeholder="Input new post..."
                            className="flex-1 border rounded-lg px-4 py-2 min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handlePost}
                            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Post
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectWallPosts;
