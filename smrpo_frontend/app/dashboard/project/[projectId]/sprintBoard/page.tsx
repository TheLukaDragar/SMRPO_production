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
import AddSprintModal from '@/components/AddSprintModal';
import { useUser } from "@/lib/hooks/useUser";
import BacklogTable from "@/components/backlog-table";
import { use } from 'react';
import { useParams } from "next/navigation";

export default function DNDPage() {
    const [isRefetching, setIsRefetching] = useState(false);
    const [stories, setStories] = useState<UserStory[]>([]);
    const [columns, setColumns] = useState<sprint[]>([]);
    const [allSprints, setAllSprints] = useState<sprint[]>([]);
    const [projectUsers, setProjectUsers] = useState<User[]>([]);
    const { loading, refreshProjects } = useProject();
    const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);
    const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isUserRoleLoading, setIsUserRoleLoading] = useState(true);
    const params = useParams();

    const projectId = params.projectId as string;
    const { user } = useUser();

    const renderLoading = () => (
        <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

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
            setIsLoadingUsers(false);
        }
    }, []);

    const fetchProjectUsers = useCallback(async () => {
        try {
            setIsRefetching(true);
            setIsLoadingUsers(true);
            setIsUserRoleLoading(true);
            if (!projectId) {
                console.log("No project ID");
                setIsLoadingUsers(false);
                setIsRefetching(false);
                setIsUserRoleLoading(false);
                return;
            }
            const users = await getProjectMembers(projectId);
            if (user && user._id) {
                console.log("all u;", users)
                console.log("curr u;", user)

                const currentUserInProject = users.filter((projectUser: any) => projectUser.userId == user._id);
                if (currentUserInProject && currentUserInProject.length > 0) {
                    setUserRole(currentUserInProject[0].role);
                    console.log("Current user role:", currentUserInProject[0].role);
                } else {
                    setUserRole(null);
                    console.log("User not found in project members");
                }
            }
            const usr_ids = users.map((user: any) => user.userId);
            console.log("usr_ids: ", usr_ids);
            if (usr_ids.length > 0) {
                await fetchUserData(usr_ids);
            } else {
                setProjectUsers([]);
                setIsLoadingUsers(false);
            }
        } catch (error) {
            console.error("Error fetching project users:", error);
        } finally {
            setIsRefetching(false);
            setIsUserRoleLoading(false);
        }
    }, [projectId, user, fetchUserData]);

    const fetchSprints = useCallback(async () => {
        try {
            setIsRefetching(true);
            const sprints = await getAllSprints();
            const projSprint = sprints.filter(
                (sprint: sprint) => sprint.projectId === projectId
            );
            setAllSprints(projSprint);
            const activeSprints = sprints.filter(
                (sprint: sprint) => sprint.isActive && sprint.projectId === projectId
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
    }, [projectId]);

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
        if (!projectId) return;
        fetchStories();
        fetchSprints();
        fetchProjectUsers();
        console.log("role: ", userRole)
    }, [projectId, fetchProjectUsers, fetchSprints, fetchStories, userRole]);

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
                    (col._id !== updatedSprint._id) && col.isActive && col.projectId === projectId
                ));
            }

            const sprintNumber = allSprints.length + 1;
            const toAdd = {
                projectId: projectId,
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

    console.log("ROLE" + userRole);
    return (
        <div>
            {(isUserRoleLoading || isLoadingUsers) ? renderLoading() : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="p-6 bg-gray-100 min-h-screen">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-800">Project Planning Board</h1>
                            {(userRole === 'SCRUM_MASTER' || userRole === 'SCRUM_DEV') && (
                                <button
                                    onClick={() => setIsSprintModalOpen(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                    Add Sprint
                                </button>
                            )}
                        </div>
                        {/* Content when data is loaded */}
                        {/* Product Backlog Section */}
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">Product Backlog</h2>
                            <BacklogTable
                                droppableId={`${projectId}-backlog`}
                                key={`${projectId}-backlog`}
                                title={"Product Backlog"}
                                items={stories.filter(story => story.SprintPosition === "backlog" && story.sprintID === projectId)}
                                projectUsers={projectUsers}
                                setItems={setStories}
                                userRole={userRole || undefined}
                            />
                        </div>
                        {/* Sprint Boards Section */}
                        <div className="mt-10">
                            <h2 className="text-xl font-semibold mb-4">Sprint Boards</h2>
                            {columns.length > 0 ? (
                                <div className="flex space-x-8 overflow-x-auto pb-6">
                                    {columns.map((sprint) => (
                                        <div key={sprint._id} className="flex-none min-w-max">
                                            <div className="mb-4 bg-white p-3 rounded-lg shadow-sm">
                                                <h3 className="font-bold text-lg">{sprint.sprintName}</h3>
                                                {sprint.startDate && sprint.endDate && (
                                                    <span className="text-sm text-gray-600 block mt-1">
                                                        {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {sprint.velocity && (
                                                    <span className="mt-2 inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                                        Velocity: {sprint.velocity}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex space-x-6 overflow-x-auto">
                                                {sprint.sprintParts && sprint.sprintParts.map((part) => (
                                                    <BacklogTable
                                                        droppableId={`${sprint._id}-${part}`}
                                                        key={part}
                                                        title={part}
                                                        items={stories.filter(story => story.SprintPosition === part && story.sprintID === sprint._id)}
                                                        projectUsers={projectUsers}
                                                        setItems={setStories}
                                                        userRole={userRole || ""}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white p-8 rounded-lg text-center">
                                    <p className="text-gray-600">No active sprints found. {(userRole === 'SCRUM_MASTER' || userRole === 'SCRUM_DEV') ? 'Add a sprint to get started.' : 'Contact your Scrum Master to create a sprint.'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </DragDropContext>
            )}
            <AddSprintModal
                isOpen={isSprintModalOpen}
                onClose={() => setIsSprintModalOpen(false)}
                onAdd={handleAddSprint}
                existingSprints={allSprints}
            />
        </div>
    );
}

