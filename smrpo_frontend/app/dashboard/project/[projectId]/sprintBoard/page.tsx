"use client"
import React, {useCallback, useEffect, useState} from "react";
import {DragDropContext, Droppable, DropResult} from "@hello-pangea/dnd";
import UserStoryCard from "@/components/userStoryCard";
import {UserStory} from "@/lib/types/user-story-types";
import {User} from "@/lib/types/user-types";
import {getAllUserStories, getAllSprints, updateStory} from "@/lib/actions/user-story-actions";
import StoryTable from "@/components/story-table";
import {sprint} from "@/lib/types/sprint-types";
import {useProject} from "@/lib/contexts/project-context";
import {getProjectMembers} from "@/lib/actions/project-actions";
import {getUsersByIds} from "@/lib/actions/user-actions";

export default function DNDPage() {
    const [isRefetching, setIsRefetching] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stories, setStories] = useState<UserStory[]>([]);
    const [columns, setColumns] = useState<sprint[]>([]);
    const [projectUsers, setProjectUsers] = useState<User[]>([]);
    const {activeProject, loading, refreshProjects } = useProject();

    const fetchProjectUsers = useCallback(async () => {
        try {
            setIsRefetching(true);
            const users = await getProjectMembers(activeProject?._id);
            console.log('Users JSON:', JSON.stringify(users));
            const usr_ids = users.map((user) => user.userId);
            console.log("usr_ids: ", usr_ids);

            await fetchUserData(usr_ids);
        } catch (error) {
            console.error("Error fetching project users:", error);
        } finally {
            setIsRefetching(false);
        }
    }, []);

    const fetchSprints = useCallback(async () => {
        try {
            setIsRefetching(true);
            const sprints = await getAllSprints();
            const activeSprints = sprints.filter(sprint => sprint.isActive === true && sprint.projectId === activeProject?._id);
            setColumns(activeSprints);
            console.log(sprints);
        } catch (error) {
            console.error("Error fetching sprints:", error);
        } finally {
            setIsRefetching(false);
        }
    }, []);

    const fetchStories = useCallback(async () => {
        try {
            setIsRefetching(true);
            const stories = await getAllUserStories();
            setStories(stories);
        } catch (error) {
            console.error("Error fetching stories:", error);
        } finally {
            setIsRefetching(false);
        }
    }, []);

    const fetchUserData = useCallback(async (users: string[]) => {
        try {
            setIsRefetching(true);
            const userData = await getUsersByIds(users);
            console.log("in_str", users);
            console.log("usr dat:" + JSON.stringify(userData));
            setProjectUsers(userData);
        } catch (error) {
            console.error("Error fetching userData:", error);
        } finally {
            setIsRefetching(false);
        }
    }, []);

    useEffect(() => {
        console.log("project users: ", projectUsers);
    }, [projectUsers]);


    useEffect(() => {
        if (!activeProject?._id) return;

        fetchStories();
        fetchSprints();
        fetchProjectUsers();
    }, [activeProject, fetchProjectUsers, fetchSprints, fetchStories]);

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const storyIndex = stories.findIndex(story => story._id === result.draggableId);

        if (storyIndex !== -1) {
            const updatedStories = [...stories];

            const [sprintId, sprintPart] = result.destination.droppableId.split('-');

            updatedStories[storyIndex] = {
                ...updatedStories[storyIndex],
                sprintID: sprintId,
                SprintPosition: sprintPart
            };

            setStories(updatedStories);
            updateStory(updatedStories[storyIndex])
        }
    }

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="p-6 bg-gray-100 min-h-screen">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">Project Planning Board</h1>

                <div className="flex space-x-8 overflow-x-auto pb-4">
                    {columns.map((sprint) => (
                        <div key={sprint._id} className="flex-none">
                            <h2 className="mb-4">{sprint.sprintName}</h2>

                            <div className="flex space-x-4 overflow-x-auto">
                                {sprint.sprintParts && sprint.sprintParts.map((part) => (
                                    <StoryTable
                                        droppableId={`${sprint._id}-${part}`}
                                        key={part}
                                        title={part}
                                        items={stories.filter(story => story.SprintPosition === part)}
                                        projectUsers={projectUsers}
                                        setItems={setStories}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DragDropContext>

    );
}
