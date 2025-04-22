"use client"

import React, { useState } from "react";
import { UserStory } from "@/lib/types/user-story-types";
import { User } from "@/lib/types/user-types";
import { addStory } from "@/lib/actions/user-story-actions";

interface StoryTableProps {
    title: string;
    items: UserStory[];
    projectUsers: User[];
    setItems: React.Dispatch<React.SetStateAction<UserStory[]>>;
    userRole: string;
    projectId: string;
    category: string;
    onDeleteStory: (storyId: string) => void;
    onUpdateStory: (updatedStory: UserStory) => void;
    canEditDeleteStory: (story: UserStory) => boolean;
}

const SimpleBacklogTable: React.FC<StoryTableProps> = ({
                                                           title,
                                                           items,
                                                           projectUsers,
                                                           setItems,
                                                           userRole,
                                                           projectId,
                                                           category,
                                                           onDeleteStory,
                                                           onUpdateStory,
                                                           canEditDeleteStory
                                                       }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStory, setCurrentStory] = useState<UserStory | null>(null);

    const [newUserStory, setNewUserStory] = useState({
        title: "",
        projectId: projectId,
        description: "",
        owner: {} as User,
        priority: "",
        storyPoints: 0,
        dueDate: new Date(),
        sprintID: null,
        SprintPosition: category === "realized" ? "Done" : "backlog",
        createdAt: new Date(),
    });

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

            setItems([...items, updatedUserStoryId as unknown as UserStory]);
            setIsModalOpen(false);

            // Reset form fields
            setNewUserStory({
                title: "",
                projectId: projectId,
                description: "",
                owner: {} as User,
                priority: "",
                storyPoints: 0,
                dueDate: new Date(),
                sprintID: null,
                SprintPosition: category === "realized" ? "Done" : "backlog",
                createdAt: new Date(),
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while adding the story');
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentStory) return;

        setError("");
        setIsSubmitting(true);

        const validationErrors = [];

        if (!currentStory.title.trim()) {
            validationErrors.push("Title is required");
        }
        if (!currentStory.description.trim()) {
            validationErrors.push("Description is required");
        }
        if (!currentStory.priority) {
            validationErrors.push("Priority is required");
        }
        if (!currentStory.dueDate) {
            validationErrors.push("Due date is required");
        }

        if (validationErrors.length > 0) {
            setError(validationErrors.join(", "));
            setIsSubmitting(false);
            return;
        }

        try {
            await onUpdateStory(currentStory);
            setIsEditModalOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while updating the story');
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setNewUserStory({ ...newUserStory, [e.target.name]: e.target.value });
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        if (!currentStory) return;
        setCurrentStory({
            ...currentStory,
            [e.target.name]: e.target.value
        });
    };

    const openEditModal = (story: UserStory) => {
        if (!canEditDeleteStory(story)) {
            return;
        }
        setCurrentStory(story);
        setIsEditModalOpen(true);
    };

    const handleDelete = (storyId: string) => {
        const confirmed = window.confirm("Ali ste prepričani, da želite izbrisati to zgodbo?");
        if (confirmed) {
            onDeleteStory(storyId);
        }
    };

    // Function to get color based on priority
    const getPriorityColor = (priority: string) => {
        switch(priority) {
            case "Must have": return "bg-red-100 text-red-800";
            case "Should Have": return "bg-yellow-100 text-yellow-800";
            case "Wont Have": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    // Function to format date
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString();
    };

    // Function to check if a user can show the Add Story button
    const showAddButton = () => {
        const adminRoles = ["Product Owner", "Scrum Master", "Administrator", "SCRUM_DEV"];

        // Show button for admin roles in any category
        if (adminRoles.includes(userRole)) {
            return true;
        }

        // Also show button for SCRUM_DEV but only in the "unrealized-unassigned" category
        if (userRole === "SCRUM_DEV" && category === "unrealized-unassigned") {
            return true;
        }

        return false;
    };

    return (
        <div className="bg-white rounded-lg shadow-md w-full flex-shrink-0">
            <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <h2 className="font-bold text-lg text-gray-700">{title}</h2>
                <div className="text-sm text-gray-500 mt-1">{items.length} stories</div>
            </div>

            <div className="p-3 min-h-64 max-h-screen overflow-y-auto">
                {items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No stories available
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((story) => (
                            <div
                                key={story._id}
                                className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium text-gray-900">{story.title}</h3>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(story.priority)}`}>
                                        {story.priority}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{story.description}</p>
                                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        {story.owner?.userName || "Unassigned"}
                                    </div>
                                    {story.dueDate && (
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {formatDate(story.dueDate)}
                                        </div>
                                    )}
                                    {story.storyPoints > 0 && (
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {story.storyPoints} points
                                        </div>
                                    )}
                                </div>

                                {/* Edit/Delete Actions */}
                                {canEditDeleteStory(story) && (userRole === "Product Owner" || userRole === "Scrum Master" || userRole === "SCRUM_DEV") && title == "Nerealizirane zgodbe - nedodeljene" &&(
                                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end space-x-2">
                                        <button
                                            onClick={() => openEditModal(story)}
                                            className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800"
                                        >
                                            Uredi
                                        </button>
                                        <button
                                            onClick={() => handleDelete(story._id)}
                                            className="text-xs px-2 py-1 text-red-600 hover:text-red-800"
                                        >
                                            Izbriši
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showAddButton() && (
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

            {/* Add Story Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Add New User Story</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={newUserStory.title}
                                        onChange={handleInputChange}
                                        className={`mt-1 block w-full border ${!newUserStory.title.trim() && error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                        placeholder="Enter story title"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={newUserStory.description}
                                        onChange={handleInputChange}
                                        className={`mt-1 block w-full border ${!newUserStory.description.trim() && error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                        rows={3}
                                        placeholder="Enter story description"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                                        Priority
                                    </label>
                                    <select
                                        id="priority"
                                        name="priority"
                                        value={newUserStory.priority}
                                        onChange={handleInputChange}
                                        className={`mt-1 block w-full border ${!newUserStory.priority && error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                        required
                                    >
                                        <option value="">Select priority</option>
                                        <option value="Wont Have">Wont Have</option>
                                        <option value="Should Have">Should Have</option>
                                        <option value="Must have">Must have</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        id="dueDate"
                                        name="dueDate"
                                        value={newUserStory.dueDate ? new Date(newUserStory.dueDate).toISOString().split('T')[0] : ''}
                                        onChange={handleInputChange}
                                        className={`mt-1 block w-full border ${!newUserStory.dueDate && error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? 'Adding...' : 'Add User Story'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Story Modal */}
            {isEditModalOpen && currentStory && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Edit User Story</h2>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleEditSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        id="edit-title"
                                        name="title"
                                        value={currentStory.title}
                                        onChange={handleEditInputChange}
                                        className={`mt-1 block w-full border ${!currentStory.title.trim() && error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                        placeholder="Enter story title"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                                        Description
                                    </label>
                                    <textarea
                                        id="edit-description"
                                        name="description"
                                        value={currentStory.description}
                                        onChange={handleEditInputChange}
                                        className={`mt-1 block w-full border ${!currentStory.description.trim() && error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                        rows={3}
                                        placeholder="Enter story description"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-700">
                                        Priority
                                    </label>
                                    <select
                                        id="edit-priority"
                                        name="priority"
                                        value={currentStory.priority}
                                        onChange={handleEditInputChange}
                                        className={`mt-1 block w-full border ${!currentStory.priority && error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                        required
                                    >
                                        <option value="">Select priority</option>
                                        <option value="Wont Have">Wont Have</option>
                                        <option value="Should Have">Should Have</option>
                                        <option value="Must have">Must have</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="edit-dueDate" className="block text-sm font-medium text-gray-700">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        id="edit-dueDate"
                                        name="dueDate"
                                        value={currentStory.dueDate ? new Date(currentStory.dueDate).toISOString().split('T')[0] : ''}
                                        onChange={handleEditInputChange}
                                        className={`mt-1 block w-full border ${!currentStory.dueDate && error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SimpleBacklogTable;