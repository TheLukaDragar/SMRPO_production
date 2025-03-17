"use client"
import React, { useCallback, useEffect, useState } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import UserStoryCard from "@/components/userStoryCard";
import { UserStory } from "@/lib/types/user-story-types";
import { User } from "@/lib/types/user-types";
import {
    getAllUserStories,
    getAllSprints,
    updateStory,
    newSprint,
    addStory,
    updateSprint
} from "@/lib/actions/user-story-actions";
import StoryTable from "@/components/story-table";
import {sprint, sprintNoId} from "@/lib/types/sprint-types";
import { useProject } from "@/lib/contexts/project-context";
import { getProjectMembers } from "@/lib/actions/project-actions";
import { getUsersByIds } from "@/lib/actions/user-actions";
import { TimeLoggingPopup } from '@/components/TimeLoggingPopup';

export default function DNDPage() {
    const [isRefetching, setIsRefetching] = useState(false);
    const [stories, setStories] = useState<UserStory[]>([]);
    const [columns, setColumns] = useState<sprint[]>([]);
    const [allSprints, setAllSprints] = useState<sprint[]>([]);
    const [projectUsers, setProjectUsers] = useState<User[]>([]);
    const {activeProject, loading, refreshProjects } = useProject();
    const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);

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
    }, [activeProject]);

    const fetchSprints = useCallback(async () => {
        try {
            setIsRefetching(true);
            const sprints = await getAllSprints();
            setAllSprints(sprints);
            const activeSprints = sprints.filter(
                (sprint:sprint) => sprint.isActive && sprint.projectId === activeProject?._id
            );
            console.log("all sprints: ", sprints);
            console.log("active sprints: ", activeSprints);

            setColumns(activeSprints);
            console.log(sprints);
        } catch (error) {
            console.error("Error fetching sprints:", error);
        } finally {
            setIsRefetching(false);
        }
    }, [activeProject]);

    const fetchStories = useCallback(async () => {
        try {
            setIsRefetching(true);
            const storiesData = await getAllUserStories();
            setStories(storiesData);
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
            updateStory(updatedStories[storyIndex]);
        }
    };

    const handleTimeSave = (loggedTime: number) => {
        console.log(`User story ${selectedStory?._id} logged time: ${loggedTime} hours`);
        setSelectedStory(null);
    };

    const handleAddSprint = async () => {
        try {
            const oldSprintIndex = columns.findIndex(col => col.isActive);
            if (oldSprintIndex !== -1) {
                const updatedSprint = {
                    ...columns[oldSprintIndex],
                    isActive: false
                };

                await updateSprint(updatedSprint);

                setColumns(columns.filter(col =>
                    (col._id !== updatedSprint._id) && col.isActive && col.projectId === activeProject?._id
                ));
            }

            const sprintNumber = allSprints.length + 1;
            const toAdd = {
                projectId: activeProject?._id,
                sprintName: `Sprint ${sprintNumber}`,
                isActive: true,
                sprintParts: ['Sprint Backlog', 'Development', 'Testing', 'Acceptance', 'Done']
            } as unknown as sprintNoId;


            const newSprintId = await newSprint(toAdd);

            const updatedUserStoryId = {
                _id: newSprintId.insertedId,
                ...toAdd
            };
            setAllSprints([...allSprints, updatedUserStoryId]);
            setColumns(prevColumns => [...prevColumns, updatedUserStoryId]);
        } catch (error) {
            console.error("Error adding sprint:", error);
        }
    };

    return (
        <div>
            <button
                onClick={() => handleAddSprint()}
                className="px-4 py-2 bg-blue-600 text-white rounded"
            >
                Add Sprint
            </button>
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
                                            items={stories.filter(story => story.SprintPosition === part && story.sprintID === sprint._id)}
                                            projectUsers={projectUsers}
                                            setItems={setStories}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Time Logging Section */}
                    <div className="mt-6">
                        <h2 className="text-xl font-bold mb-4">Time Logging</h2>
                        {stories.map(story => (
                            <div key={story._id} className="flex items-center justify-between p-2 border mb-2 bg-white rounded">
                                <span>{story.title}</span>
                                <button
                                    onClick={() => setSelectedStory(story)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded"
                                >
                                    Log Time
                                </button>
                            </div>
                        ))}
                    </div>

                    {selectedStory && (
                        <TimeLoggingPopup
                            userStoryId={selectedStory._id}
                            title={selectedStory.title}
                            onClose={() => setSelectedStory(null)}
                            onSave={handleTimeSave}
                        />
                    )}
                </div>
            </DragDropContext>
        </div>
    );
}