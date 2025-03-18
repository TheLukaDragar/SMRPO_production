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
import { TimeLoggingPopup } from '@/components/TimeLoggingPopup';
import AddSprintModal from '@/components/AddSprintModal';
import {useUser} from "@/lib/hooks/useUser";

export default function DNDPage() {
    const [isRefetching, setIsRefetching] = useState(false);
    const [stories, setStories] = useState<UserStory[]>([]);
    const [columns, setColumns] = useState<sprint[]>([]);
    const [allSprints, setAllSprints] = useState<sprint[]>([]);
    const [projectUsers, setProjectUsers] = useState<User[]>([]);
    const { activeProject, loading, refreshProjects } = useProject();
    const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);
    const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    const { user } = useUser();

    const fetchProjectUsers = useCallback(async () => {
        try {
            setIsRefetching(true);
            const users = await getProjectMembers(activeProject?._id);
            console.log('Users JSON:', JSON.stringify(users));

            if (user && user._id) {
                console.log("all u;" , users)
                console.log("curr u;", user)

                const currentUserInProject = users.filter((projectUser: any) => projectUser.userId == user._id);
                if (currentUserInProject) {
                    setUserRole(currentUserInProject[0].role);
                    console.log("Current user role:", currentUserInProject[0].role);
                }
            }

            const usr_ids = users.map((user: User) => user._id);
            console.log("usr_ids: ", usr_ids);
            await fetchUserData(usr_ids);
        } catch (error) {
            console.error("Error fetching project users:", error);
        } finally {
            setIsRefetching(false);
        }
    }, [activeProject, user]);

    const fetchSprints = useCallback(async () => {
        try {
            setIsRefetching(true);
            const sprints = await getAllSprints();
            const projSprint = sprints.filter(
                (sprint: sprint) => sprint.projectId === activeProject?._id
            );
            setAllSprints(projSprint);
            const activeSprints = sprints.filter(
                (sprint: sprint) => sprint.isActive && sprint.projectId === activeProject?._id
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
        console.log("role: ", userRole)
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

    const handleAddSprint = async (startDate: Date, endDate: Date, velocity: number, name: string) => {
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
                sprintName: name || `Sprint ${sprintNumber}`,
                isActive: true,
                sprintParts: ['Sprint Backlog', 'Development', 'Testing', 'Acceptance', 'Done'],
                startDate: startDate,
                endDate: endDate,
                velocity: velocity
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
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="p-6 bg-gray-100 min-h-screen">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Project Planning Board</h1>
                        {userRole === 'SCRUM_MASTER' && (
                            <button
                                onClick={() => setIsSprintModalOpen(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded"
                            >
                                Add Sprint
                            </button>
                        )}
                    </div>
                    <div className="flex space-x-8 overflow-x-auto pb-4">
                        {columns.map((sprint) => (
                            <div key={sprint._id} className="flex-none">
                                <div className="flex items-center mb-4">
                                    <h2 className="font-bold">{sprint.sprintName}</h2>
                                    {sprint.startDate && sprint.endDate && (
                                        <span className="ml-2 text-sm text-gray-600">
                                            {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                                        </span>
                                    )}
                                    {sprint.velocity && (
                                        <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                            Velocity: {sprint.velocity}
                                        </span>
                                    )}
                                </div>
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

            <AddSprintModal
                isOpen={isSprintModalOpen}
                onClose={() => setIsSprintModalOpen(false)}
                onAdd={handleAddSprint}
                existingSprints={allSprints}
            />
        </div>
    );
}