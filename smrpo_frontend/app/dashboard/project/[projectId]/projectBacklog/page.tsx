"use client"
import React, {useState, useEffect, useCallback} from "react";
import { User } from "@/lib/types/user-types";
import { UserStory } from "@/lib/types/user-story-types";
import { sprint } from "@/lib/types/sprint-types";
import SimpleBacklogTable from "@/components/simpleBacklogTable";
import {useUser} from "@/lib/hooks/useUser";
import {useParams} from "next/navigation";
import {getAllSprints, getAllUserStories, deleteStory, updateStory} from "@/lib/actions/user-story-actions";
import {getProjectMembers} from "@/lib/actions/project-actions";
import {getUsersByIds} from "@/lib/actions/user-actions";
import { toast } from "react-hot-toast";

const ProductBacklog: React.FC = () => {
    const [stories, setStories] = useState<UserStory[]>([]);
    const [allSprints, setAllSprints] = useState<sprint[]>([]);
    const [projectUsers, setProjectUsers] = useState<User[]>([]);
    const [userRole, setUserRole] = useState<string | null>(null);
    const params = useParams();
    const [expandedCategory, setExpandedCategory] = useState<string | null>("unrealized-unassigned");

    const projectId = params.projectId as string;
    const { user } = useUser();

    const canEditDeleteStory = useCallback((story: UserStory): boolean => {
        const role = (userRole === "Product Owner" || userRole === "Scrum Master" || userRole === "SCRUM_DEV")

        // Can only edit/delete stories that are not realized
        if (story.SprintPosition === "Done") {
            return false;
        }

        // Can only edit/delete stories that are not assigned to any Sprint
        const hasNoSprint = !story.sprintID || story.sprintID === "";
        const isInInactiveSprint = story.sprintID && story.sprintID !== "" && !allSprints.some(sprint =>
            sprint._id === story.sprintID &&
            sprint.isActive &&
            sprint.projectId === projectId
        );

        return Boolean(hasNoSprint || isInInactiveSprint || role);
    }, [userRole, allSprints, projectId]);

    // Function to check for duplicate story title
    const checkDuplicateTitle = useCallback((title: string, storyId: string) => {
        return stories.some(story =>
            story.title === title && story._id !== storyId
        );
    }, [stories]);

    // Function to handle story deletion
    const handleDeleteStory = useCallback(async (storyId: string) => {
        const storyToDelete = stories.find(story => story._id === storyId);

        if (!storyToDelete) {
            toast.error("Zgodba ne obstaja.");
            return;
        }

        if (!canEditDeleteStory(storyToDelete)) {
            toast.error("Nimate dovoljenja za brisanje te zgodbe.");
            return;
        }

        try {
            await deleteStory(storyId);
            setStories(prevStories => prevStories.filter(story => story._id !== storyId));
            toast.success("Zgodba uspešno izbrisana.");
        } catch (error) {
            console.error("Error deleting story:", error);
            toast.error("Napaka pri brisanju zgodbe.");
        }
    }, [stories, canEditDeleteStory]);

    // Function to handle story update
    const handleUpdateStory = useCallback(async (updatedStory: UserStory) => {
        const originalStory = stories.find(story => story._id === updatedStory._id);

        if (!originalStory) {
            toast.error("Zgodba ne obstaja.");
            return;
        }

        if (!canEditDeleteStory(originalStory)) {
            toast.error("Nimate dovoljenja za urejanje te zgodbe.");
            return;
        }

        // Check for duplicate title
        if (updatedStory.title !== originalStory.title && checkDuplicateTitle(updatedStory.title, updatedStory._id)) {
            toast.error("Zgodba s tem naslovom že obstaja.");
            return;
        }

        try {
            await updateStory(updatedStory);
            setStories(prevStories =>
                prevStories.map(story =>
                    story._id === updatedStory._id ? updatedStory : story
                )
            );
            toast.success("Zgodba uspešno posodobljena.");
        } catch (error) {
            console.error("Error updating story:", error);
            toast.error("Napaka pri posodabljanju zgodbe.");
        }
    }, [stories, canEditDeleteStory, checkDuplicateTitle]);

    const fetchUserData = useCallback(async (users: string[]) => {
        try {
            const userData = await getUsersByIds(users);
            setProjectUsers(userData);
        } catch (error) {
            console.error("Error fetching userData:", error);
        }
    }, []);

    const fetchProjectUsers = useCallback(async () => {
        try {
            if (!projectId) {
                console.log("No project ID");
                return;
            }
            const users = await getProjectMembers(projectId);

            if (user && user._id) {
                const currentUserInProject = users.filter((projectUser: any) => projectUser.userId == user._id);
                if (currentUserInProject && currentUserInProject.length > 0) {
                    setUserRole(currentUserInProject[0].role);
                } else {
                    setUserRole(null);
                }
            }
            const userIds = users.map((user: any) => user.userId);
            if (userIds.length > 0) {
                await fetchUserData(userIds);
            } else {
                setProjectUsers([]);
            }
        } catch (error) {
            console.error("Error fetching project users:", error);
        }
    }, [projectId, user, fetchUserData]);

    const fetchStories = useCallback(async () => {
        try {
            const storiesData = await getAllUserStories();
            setStories(storiesData.filter((story: UserStory) => story.projectId === projectId));
        } catch (error) {
            console.error("Error fetching stories:", error);
        }
    }, []);

    const fetchSprints = useCallback(async () => {
        try {
            const sprints = await getAllSprints();
            const projectSprints = sprints.filter(
                (sprint: sprint) => sprint.projectId === projectId
            );
            setAllSprints(projectSprints);
        } catch (error) {
            console.error("Error fetching sprints:", error);
        }
    }, [projectId]);

    useEffect(() => {
        if (!projectId) return;
        fetchStories();
        fetchSprints();
        fetchProjectUsers();
    }, [projectId, fetchProjectUsers, fetchSprints, fetchStories]);

    const realizedStories = stories.filter(story =>
        story.SprintPosition === "Done"
    );

    const unrealizedAssignedStories = stories.filter(story => {
        const hasValidSprintID = story.sprintID && story.sprintID !== "";
        const isInActiveSprint = hasValidSprintID && allSprints.some(sprint =>
            sprint._id === story.sprintID &&
            sprint.isActive &&
            sprint.projectId === projectId
        );
        return isInActiveSprint && story.SprintPosition !== "Done";
    });

    const unrealizedUnassignedStories = stories.filter(story => {
        const hasNoSprint = !story.sprintID || story.sprintID === "";
        const isInInactiveSprint = story.sprintID && story.sprintID !== "" && !allSprints.some(sprint =>
            sprint._id === story.sprintID &&
            sprint.isActive &&
            sprint.projectId === projectId
        );

        return (hasNoSprint || isInInactiveSprint) && story.SprintPosition !== "Done";
    });

    const toggleCategory = (category: string) => {
        if (expandedCategory === category) {
            setExpandedCategory(null);
        } else {
            setExpandedCategory(category);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Seznam zahtev (Product Backlog)</h1>

                {/* Permission info box */}
                {(userRole === "Product Owner" || userRole === "Scrum Master") && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <span className="font-semibold">Opomba:</span> Produktni vodja in skrbnik metodologije lahko urejata in brišeta
                            tiste uporabniške zgodbe v projektu, ki še niso realizirane in niso dodeljene nobenemu Sprintu.
                        </p>
                    </div>
                )}

                <div className="mb-4">
                    <div
                        className="bg-green-50 p-3 rounded-lg border border-green-200 cursor-pointer flex justify-between items-center"
                        onClick={() => toggleCategory("realized")}
                    >
                        <h2 className="text-lg font-medium text-green-700">
                            Realizirane zgodbe ({realizedStories.length})
                        </h2>
                        <span className="text-green-700">{expandedCategory === "realized" ? "▼" : "►"}</span>
                    </div>

                    {expandedCategory === "realized" && (
                        <div className="mt-2">
                            <SimpleBacklogTable
                                title="Realizirane zgodbe"
                                items={realizedStories}
                                projectUsers={projectUsers}
                                setItems={setStories}
                                userRole={userRole || ""}
                                projectId={projectId}
                                category="realized"
                                onDeleteStory={handleDeleteStory}
                                onUpdateStory={handleUpdateStory}
                                canEditDeleteStory={canEditDeleteStory}
                            />
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <div
                        className="bg-blue-50 p-3 rounded-lg border border-blue-200 cursor-pointer flex justify-between items-center"
                        onClick={() => toggleCategory("unrealized-assigned")}
                    >
                        <h2 className="text-lg font-medium text-blue-700">
                            Nerealizirane zgodbe - dodeljene ({unrealizedAssignedStories.length})
                        </h2>
                        <span className="text-blue-700">{expandedCategory === "unrealized-assigned" ? "▼" : "►"}</span>
                    </div>

                    {expandedCategory === "unrealized-assigned" && (
                        <div className="mt-2">
                            <SimpleBacklogTable
                                title="Nerealizirane zgodbe - dodeljene"
                                items={unrealizedAssignedStories}
                                projectUsers={projectUsers}
                                setItems={setStories}
                                userRole={userRole || ""}
                                projectId={projectId}
                                category="unrealized-assigned"
                                onDeleteStory={handleDeleteStory}
                                onUpdateStory={handleUpdateStory}
                                canEditDeleteStory={canEditDeleteStory}
                            />
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <div
                        className="bg-gray-50 p-3 rounded-lg border border-gray-200 cursor-pointer flex justify-between items-center"
                        onClick={() => toggleCategory("unrealized-unassigned")}
                    >
                        <h2 className="text-lg font-medium text-gray-700">
                            Nerealizirane zgodbe - nedodeljene ({unrealizedUnassignedStories.length})
                        </h2>
                        <span className="text-gray-700">{expandedCategory === "unrealized-unassigned" ? "▼" : "►"}</span>
                    </div>

                    {expandedCategory === "unrealized-unassigned" && (
                        <div className="mt-2">
                            <SimpleBacklogTable
                                title="Nerealizirane zgodbe - nedodeljene"
                                items={unrealizedUnassignedStories}
                                projectUsers={projectUsers}
                                setItems={setStories}
                                userRole={userRole || ""}
                                projectId={projectId}
                                category="unrealized-unassigned"
                                onDeleteStory={handleDeleteStory}
                                onUpdateStory={handleUpdateStory}
                                canEditDeleteStory={canEditDeleteStory}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductBacklog;