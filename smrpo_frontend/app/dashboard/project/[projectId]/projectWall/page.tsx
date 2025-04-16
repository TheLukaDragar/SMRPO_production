"use client";

import React, { use, useCallback, useEffect, useState } from "react";
import ProjectWallPosts from "@/components/ProjectWallPosts";
import { projectPosts } from "@/lib/types/projectPosts-types";
import { getPostsById } from "@/lib/actions/user-story-actions";
import { useUser } from "@/lib/hooks/useUser";

export default function ProjectWall({ params }: { params: { projectId: string } }) {
    const [posts, setPosts] = useState<projectPosts[]>([]);
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

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Project Wall</h1>
            <ProjectWallPosts project_id={projectId} posts={posts} setPosts={setPosts} />
        </div>
    );
}
