"use client"
import React, {use, useCallback, useEffect, useState} from "react";
import ProjectWallPosts from "@/components/ProjectWallPosts";
import {projectPosts} from "@/lib/types/projectPosts-types";
import {getPosts, getPostsById} from "@/lib/actions/user-story-actions";

export default function ProjectWall({ params }: { params: { projectId: string } }) {
    const [posts, setPosts] =  useState<projectPosts[]>([]);
    const projectId = use(params).projectId;

    const fetchPostsById = useCallback(async () => {
        try {
            const got_posts = await getPostsById(projectId);
            console.log("posts", got_posts);
            setPosts(got_posts);
        } catch (error) {
            console.error("Error fetching posts:", error);
        }
    }, [projectId]);

    useEffect(() => {
        fetchPostsById();
    }, [fetchPostsById]);

    return (
        <div>
            <h1 className="text-3xl font-bold">Project Wall</h1>
            <ProjectWallPosts project_id={projectId} posts={posts} setPosts={setPosts} />
        </div>
    );
}

