"use client"
import React, { useCallback, useEffect, useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { UserStory } from "@/lib/types/user-story-types";
import { User } from "@/lib/types/user-types";
import {
    getAllUserStories,
    getAllSprints,
    updateStory,
    newSprint,
    updateSprint
} from "@/lib/actions/user-story-actions";
import StoryTable from "@/components/story-table";
import { sprint, sprintNoId } from "@/lib/types/sprint-types";
import { useProject } from "@/lib/contexts/project-context";
import { getProjectMembers } from "@/lib/actions/project-actions";
import { getUsersByIds } from "@/lib/actions/user-actions";
//import { TimeLoggingPopup } from '@/components/TimeLoggingPopup';

export default function DNDPage() {
    const [isRefetching, setIsRefetching] = useState(false);
    const [stories, setStories] = useState<UserStory[]>([]);
    const [columns, setColumns] = useState<sprint[]>([]);
    const [allSprints, setAllSprints] = useState<sprint[]>([]);
    const [projectUsers, setProjectUsers] = useState<User[]>([]);
    const { activeProject, loading, refreshProjects } = useProject();
    const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);
    const [selectedSprint, setSelectedSprint] = useState<string | null>(null);

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

    const fetchProjectUsers = useCallback(async () => {
        try {
            setIsRefetching(true);
            const users = await getProjectMembers(activeProject?._id ?? "");
            console.log('Users JSON:', JSON.stringify(users));
            const usr_ids = users.map((user: User) => user._id);
            console.log("usr_ids: ", usr_ids);
            await fetchUserData(usr_ids);
        } catch (error) {
            console.error("Error fetching project users:", error);
        } finally {
            setIsRefetching(false);
        }
    }, [activeProject, fetchUserData]);

    const fetchSprints = useCallback(async () => {
        try {
            setIsRefetching(true);
            const sprints = await getAllSprints();
            const projSprint = sprints.filter(
                (sprint: sprint) => sprint.projectId === activeProject?._id
            );
            setAllSprints(projSprint);
            const activeSprints = sprints.filter(
                (sprint: sprint) => !sprint.isActive && sprint.projectId === activeProject?._id
            );
            console.log("all sprints: ", sprints);
            console.log("active sprints: ", activeSprints);
            setColumns(activeSprints);

            // Set default selected sprint if none is selected
            if (activeSprints.length > 0 && !selectedSprint) {
                setSelectedSprint(activeSprints[0]._id);
            }

            console.log(sprints);
        } catch (error) {
            console.error("Error fetching sprints:", error);
        } finally {
            setIsRefetching(false);
        }
    }, [activeProject, selectedSprint]);

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

    const handleSprintChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedSprint(e.target.value);
    };

    // Get the currently selected sprint
    const currentSprint = columns.find(sprint => sprint._id === selectedSprint);

    return (
        <div>
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="p-6 bg-gray-100 min-h-screen">
                    <h1 className="text-2xl font-bold mb-6 text-gray-800">Project Planning Board</h1>

                    {/* Sprint Selector Dropdown */}
                    <div className="mb-6">
                        <label htmlFor="sprint-selector" className="block text-sm font-medium text-gray-700 mb-2">
                            Select Sprint:
                        </label>
                        <select
                            id="sprint-selector"
                            value={selectedSprint || ""}
                            onChange={handleSprintChange}
                            className="block w-full md:w-64 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {columns.length > 0 ? (
                                columns.map((sprint) => (
                                    <option key={sprint._id} value={sprint._id}>
                                        {sprint.sprintName}
                                    </option>
                                ))
                            ) : (
                                <option disabled>No sprints available</option>
                            )}
                        </select>
                    </div>

                    {/* Selected Sprint View */}
                    {currentSprint && (
                        <div className="flex-none w-full">
                            <h2 className="mb-4 font-semibold text-lg">{currentSprint.sprintName}</h2>
                            <div className="flex space-x-4 overflow-x-auto">
                                {currentSprint.sprintParts && currentSprint.sprintParts.map((part) => (
                                    <StoryTable
                                        ID={`${currentSprint._id}-${part}`}
                                        key={part}
                                        title={part}
                                        items={stories.filter(story => story.SprintPosition === part && story.sprintID === currentSprint._id)}
                                        projectUsers={projectUsers}
                                        setItems={setStories}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {!currentSprint && columns.length > 0 && (
                        <div className="text-center p-4 bg-gray-200 rounded">
                            Please select a sprint from the dropdown
                        </div>
                    )}

                    {columns.length === 0 && (
                        <div className="text-center p-4 bg-gray-200 rounded">
                            No sprints available for this project
                        </div>
                    )}
                </div>
            </DragDropContext>

            {/*
            {selectedStory && (
                <TimeLoggingPopup
                    story={selectedStory}
                    onSave={handleTimeSave}
                    onCancel={() => setSelectedStory(null)}
                />
            )}
            */}
        </div>
    );
}