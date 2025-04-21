"use client"

import React, { useEffect, useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import UserStoryCard from "@/components/userStoryCard";
import { UserStory } from "@/lib/types/user-story-types";
import { useUser } from "@/lib/hooks/useUser";
import { User } from "@/lib/types/user-types";
import { addStory } from "@/lib/actions/user-story-actions";

interface StoryTableProps {
    droppableId: string;
    title: string;
    items: UserStory[];
    projectUsers: User[];
    setItems: React.Dispatch<React.SetStateAction<UserStory[]>>;
    userRole: string | undefined;
}
const BacklogTable: React.FC<StoryTableProps> = ({ droppableId, title, items, projectUsers, setItems, userRole }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newUserStory, setNewUserStory] = useState({
        title: "",
        description: "",
        owner: {
            userName: "",
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            role: "User"
        } as unknown as User,
        priority: "",
        storyPoints: 0,
        dueDate: new Date(),
        sprintID: droppableId.split("-")[0],
        SprintPosition: droppableId.split("-")[1],
        createdAt: new Date(),
    });

    const { user } = useUser()

    useEffect(() => {
        setIsAdmin(user?.role === "Administrator")
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        const validationErrors = [];

        if (!newUserStory.title.trim()) {
            validationErrors.push("Title is required");
        }
        if (!newUserStory.description.trim()) {
            validationErrors.push("Description is required");
        }
        if (!newUserStory.priority) {
            validationErrors.push("Priority is required");
        }
        if (!newUserStory.owner?._id) {
            validationErrors.push("Owner is required");
        }
        if (!newUserStory.dueDate) {
            validationErrors.push("Due date is required");
        }

        if (validationErrors.length > 0) {
            setError(validationErrors.join(", "));
            setIsSubmitting(false);
            return;
        }

        const updatedUserStory = {
            ...newUserStory,
            createdAt: new Date()
        };

        try {
            const newStoryId = await addStory(updatedUserStory);

            const updatedUserStoryId = {
                _id: newStoryId.insertedId,
                ...newUserStory
            };

            setItems([...items, updatedUserStoryId as UserStory]);
            setIsModalOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while adding the story');
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setNewUserStory({ ...newUserStory, [e.target.name]: e.target.value });
    };

    return (
        <div className="bg-white rounded-lg shadow-md w-full flex-shrink-0">
            <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <h2 className="font-bold text-lg text-gray-700">{title}</h2>
                <div className="text-sm text-gray-500 mt-1">{items.length} stories</div>
            </div>

            <Droppable droppableId={droppableId}>
                {provided => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="p-3 min-h-64 max-h-screen overflow-y-auto"
                    >
                        {items.map((story_data, index) => (
                            <UserStoryCard
                                key={story_data._id}
                                ID={story_data._id}
                                draggableId={story_data._id}
                                index={index}
                                storyData={story_data}
                                userRole={userRole || ""}
                                team={projectUsers}
                                comment={""}
                                projectMembers={projectUsers.map(u => ({ userId: typeof u._id === "object" ? u._id.$oid : u._id, role: u.role }))}
                                currentUserId={typeof user?._id === "object" ? user._id.$oid : user?._id}
                                onStoryUpdated={(updatedStory) => {
                                    setItems(prev =>
                                        prev.map(s => s._id === updatedStory._id ? updatedStory : s)
                                    );
                                }}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>

            {(
                <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center justify-center"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Story
                    </button>
                </div>
            )}

            {/* Modal remains unchanged */}
        </div>
    );
};

export default BacklogTable;