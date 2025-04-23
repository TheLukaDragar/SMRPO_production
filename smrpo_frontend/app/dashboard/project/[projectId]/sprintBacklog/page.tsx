"use client"
import React, {useState, useEffect, useCallback} from "react";
import { User } from "@/lib/types/user-types";
import { UserStory } from "@/lib/types/user-story-types";
import { sprint } from "@/lib/types/sprint-types";
import SimpleBacklogTable from "@/components/simpleBacklogTable";
import {useUser} from "@/lib/hooks/useUser";
import {useParams} from "next/navigation";
import {getAllUserStories, deleteStory, updateStory, getAllSprints} from "@/lib/actions/user-story-actions";
import {getProjectMembers} from "@/lib/actions/project-actions";
import {getUsersByIds} from "@/lib/actions/user-actions";
import { useToast } from "@/components/ui/use-toast"

const SprintBacklog: React.FC = () => {
    const [stories, setStories] = useState<UserStory[]>([]);
    const [activeSprint, setActiveSprint] = useState<sprint | null>(null);
    const [projectUsers, setProjectUsers] = useState<User[]>([]);
    const [userRole, setUserRole] = useState<string | null>(null);
    const params = useParams();
    const [expandedCategory, setExpandedCategory] = useState<string | null>("active");
    const { toast } = useToast();

    const projectId = params.projectId as string;
    const { user } = useUser();

    const canEditDeleteStory = useCallback((story: UserStory): boolean => {
        const isScrumMaster = userRole === "Scrum Master";
        const isProductOwner = userRole === "Product Owner";
        const isDeveloper = userRole === "SCRUM_DEV";
        const isStoryOwner = user && story.owner?._id === user._id;

        // Scrum Master can edit/delete any story
        if (isScrumMaster) return true;

        // Product Owner can edit/delete unassigned stories
        if (isProductOwner && (!story.owner || !story.owner._id)) return true;

        // Story owner can edit their own stories if not completed
        if (isStoryOwner && story.SprintPosition !== "Done") return true;

        // Developers can edit unassigned stories
        if (isDeveloper && (!story.owner || !story.owner._id)) return true;

        return false;
    }, [userRole, user]);

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
            toast({
                title: "Zgodba ne obstaja.",
                description: "Vprašajte svojega Scrum Masterja za dodatno vedenje.",
                variant: "destructive",
            });
            return;
        }

        if (!canEditDeleteStory(storyToDelete)) {
            toast({
                title: "Nimate dovoljenja za brisanje te zgodbe.",
                description: "Vprašajte svojega Scrum Masterja za dodatno vedenje.",
                variant: "destructive",
            });
            return;
        }

        try {
            await deleteStory(storyId);
            setStories(prevStories => prevStories.filter(story => story._id !== storyId));
            toast({
                title: "Zgodba uspešno izbrisana.",
                description: "Vprašajte svojega Scrum Masterja za dodatno vedenje.",
                variant: "success",
            });
        } catch (error) {
            console.error("Error deleting story:", error);
            toast({
                title: "Napaka pri brisanju zgodbe.",
                description: "Vprašajte svojega Scrum Masterja za dodatno vedenje.",
                variant: "destructive",
            });
        }
    }, [stories, canEditDeleteStory, toast]);

    // Function to handle story update
    const handleUpdateStory = useCallback(async (updatedStory: UserStory) => {
        const originalStory = stories.find(story => story._id === updatedStory._id);

        if (!originalStory) {
            toast({
                title: "Zgodba ne obstaja.",
                description: "Vprašajte svojega Scrum Masterja za dodatno vedenje.",
                variant: "destructive",
            });
            return;
        }

        if (!canEditDeleteStory(originalStory)) {
            toast({
                title: "Nimate dovoljenja za urejanje te zgodbe.",
                description: "Vprašajte svojega Scrum Masterja za dodatno vedenje.",
                variant: "destructive",
            });
            return;
        }

        // Check for duplicate title
        if (updatedStory.title !== originalStory.title && checkDuplicateTitle(updatedStory.title, updatedStory._id)) {
            toast({
                title: "Zgodba s tem naslovom že obstaja.",
                description: "Vprašajte svojega Scrum Masterja za dodatno vedenje.",
                variant: "destructive",
            });
            return;
        }

        try {
            await updateStory(updatedStory);
            setStories(prevStories =>
                prevStories.map(story =>
                    story._id === updatedStory._id ? updatedStory : story
                )
            );
            toast({
                title: "Zgodba uspešno posodobljena.",
                description: "Vprašajte svojega Scrum Masterja za dodatno vedenje.",
                variant: "success",
            });
        } catch (error) {
            console.error("Error updating story:", error);
            toast({
                title: "Napaka pri posodabljanju zgodbe.",
                description: "Vprašajte svojega Scrum Masterja za dodatno vedenje.",
                variant: "destructive",
            });
        }
    }, [stories, canEditDeleteStory, checkDuplicateTitle, toast]);

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
            if (!activeSprint) return;

            // Get all user stories
            const storiesData = await getAllUserStories();

            // Filter for stories in the active sprint
            const sprintStories = storiesData.filter((story: UserStory) =>
                story.sprintID === activeSprint._id &&
                story.projectId === projectId
            );

            setStories(sprintStories);
        } catch (error) {
            console.error("Error fetching stories:", error);
        }
    }, [activeSprint, projectId]);

    const fetchActiveSprint = useCallback(async () => {
        try {
            if (!projectId) return;
            const sprints = await getAllSprints();
            const activeSprints = sprints.filter(
                (sprint: sprint) => sprint.isActive && sprint.projectId === projectId
            );

            const sprint = activeSprints[0];
            setActiveSprint(sprint);
        } catch (error) {
            console.error("Error fetching active sprint:", error);
        }
    }, [projectId]);

    useEffect(() => {
        if (!projectId) return;
        fetchActiveSprint();
        fetchProjectUsers();
    }, [projectId, fetchActiveSprint, fetchProjectUsers]);

    useEffect(() => {
        if (activeSprint) {
            fetchStories();
        }
    }, [activeSprint, fetchStories]);

    // Filter stories based on their SprintPosition/status
    const activeStories = stories.filter(story => story.SprintPosition === "Development" || story.SprintPosition === "Testing");
    const assignedStories = stories.filter(story => story.owner !== null && story.SprintPosition === "backlog" );
    const unassignedStories = stories.filter(story => story.owner === null);
    const completedStories = stories.filter(story => story.SprintPosition === "Done");

    const toggleCategory = (category: string) => {
        if (expandedCategory === category) {
            setExpandedCategory(null);
        } else {
            setExpandedCategory(category);
        }
    };

    if (!activeSprint) {
        return (
            <div className="p-4 bg-gray-50 rounded-lg shadow">
                <p className="text-center text-gray-600">Ni aktivnega sprinta za ta projekt.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Seznam nalog (Sprint Backlog)</h1>

                {/* Sprint info */}
                {activeSprint && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h2 className="text-lg font-semibold text-blue-700 mb-2">
                            Aktivni sprint: {activeSprint.sprintName}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-blue-800">
                                    <span className="font-medium">Začetek:</span>{" "}
                                    {activeSprint.startDate ? new Date(activeSprint.startDate).toLocaleDateString('sl-SI') : 'Ni datuma'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-blue-800">
                                    <span className="font-medium">Konec:</span>{" "}
                                    {activeSprint.endDate ? new Date(activeSprint.endDate).toLocaleDateString('sl-SI') : 'Ni datuma'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-blue-800">
                                    <span className="font-medium">Skupno število točk:</span> {activeSprint.velocity || '0'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Permission info box */}
                {(userRole === "Scrum Master" || userRole === "Product Owner") && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <span className="font-semibold">Opomba:</span> Skrbnik metodologije lahko ureja vse zgodbe.
                            Produktni vodja lahko ureja nedodeljene zgodbe. Razvijalci lahko urejajo svoje zgodbe in nedodeljene zgodbe.
                        </p>
                    </div>
                )}

                {/* Active stories */}
                <div className="mb-4">
                    <div
                        className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 cursor-pointer flex justify-between items-center"
                        onClick={() => toggleCategory("active")}
                    >
                        <h2 className="text-lg font-medium text-yellow-700">
                            Aktivne naloge ({activeStories.length})
                        </h2>
                        <span className="text-yellow-700">{expandedCategory === "active" ? "▼" : "►"}</span>
                    </div>

                    {expandedCategory === "active" && (
                        <div className="mt-2">
                            <SimpleBacklogTable
                                title="Aktivne naloge"
                                items={activeStories}
                                projectUsers={projectUsers}
                                setItems={setStories}
                                userRole={userRole || ""}
                                projectId={projectId}
                                category="active"
                                onDeleteStory={handleDeleteStory}
                                onUpdateStory={handleUpdateStory}
                                canEditDeleteStory={canEditDeleteStory}
                            />
                        </div>
                    )}
                </div>

                {/* Assigned stories */}
                <div className="mb-4">
                    <div
                        className="bg-blue-50 p-3 rounded-lg border border-blue-200 cursor-pointer flex justify-between items-center"
                        onClick={() => toggleCategory("assigned")}
                    >
                        <h2 className="text-lg font-medium text-blue-700">
                            Dodeljene naloge ({assignedStories.length})
                        </h2>
                        <span className="text-blue-700">{expandedCategory === "assigned" ? "▼" : "►"}</span>
                    </div>

                    {expandedCategory === "assigned" && (
                        <div className="mt-2">
                            <SimpleBacklogTable
                                title="Dodeljene naloge"
                                items={assignedStories}
                                projectUsers={projectUsers}
                                setItems={setStories}
                                userRole={userRole || ""}
                                projectId={projectId}
                                category="assigned"
                                onDeleteStory={handleDeleteStory}
                                onUpdateStory={handleUpdateStory}
                                canEditDeleteStory={canEditDeleteStory}
                            />
                        </div>
                    )}
                </div>

                {/* Unassigned stories */}
                <div className="mb-4">
                    <div
                        className="bg-gray-50 p-3 rounded-lg border border-gray-200 cursor-pointer flex justify-between items-center"
                        onClick={() => toggleCategory("unassigned")}
                    >
                        <h2 className="text-lg font-medium text-gray-700">
                            Nedodeljene naloge ({unassignedStories.length})
                        </h2>
                        <span className="text-gray-700">{expandedCategory === "unassigned" ? "▼" : "►"}</span>
                    </div>

                    {expandedCategory === "unassigned" && (
                        <div className="mt-2">
                            <SimpleBacklogTable
                                title="Nedodeljene naloge"
                                items={unassignedStories}
                                projectUsers={projectUsers}
                                setItems={setStories}
                                userRole={userRole || ""}
                                projectId={projectId}
                                category="unassigned"
                                onDeleteStory={handleDeleteStory}
                                onUpdateStory={handleUpdateStory}
                                canEditDeleteStory={canEditDeleteStory}
                            />
                        </div>
                    )}
                </div>

                {/* Completed stories */}
                <div className="mb-4">
                    <div
                        className="bg-green-50 p-3 rounded-lg border border-green-200 cursor-pointer flex justify-between items-center"
                        onClick={() => toggleCategory("completed")}
                    >
                        <h2 className="text-lg font-medium text-green-700">
                            Zaključene naloge ({completedStories.length})
                        </h2>
                        <span className="text-green-700">{expandedCategory === "completed" ? "▼" : "►"}</span>
                    </div>

                    {expandedCategory === "completed" && (
                        <div className="mt-2">
                            <SimpleBacklogTable
                                title="Zaključene naloge"
                                items={completedStories}
                                projectUsers={projectUsers}
                                setItems={setStories}
                                userRole={userRole || ""}
                                projectId={projectId}
                                category="completed"
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

export default SprintBacklog;