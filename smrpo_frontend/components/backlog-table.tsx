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

        // Validate all required fields
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
        // if (!newUserStory.storyPoints || newUserStory.storyPoints <= 0) {
        //     validationErrors.push("Story points must be greater than 0");
        // }
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

            setItems([...items, updatedUserStoryId]);
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
                                userRole={userRole}

                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>

            <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                <button onClick={() => true && setIsModalOpen(true)}
                    className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center justify-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add Story
                </button>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-0  flex items-center justify-center z-50">
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
                                    {!newUserStory.title.trim() && error && (
                                        <p className="mt-1 text-sm text-red-500">Title is required</p>
                                    )}
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
                                    {!newUserStory.description.trim() && error && (
                                        <p className="mt-1 text-sm text-red-500">Description is required</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="owner" className="block text-sm font-medium text-gray-700">
                                        Owner
                                    </label>
                                    <select
                                        id="owner"
                                        name="owner"
                                        value={newUserStory.owner?._id || ""}
                                        onChange={(e) => {
                                            const selectedUser = projectUsers.find(user => user._id === e.target.value);
                                            setNewUserStory({ ...newUserStory, owner: selectedUser || {} as User });
                                        }}
                                        className={`mt-1 block w-full border ${!newUserStory.owner?._id && error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                        required
                                    >
                                        <option value="">Select an owner</option>
                                        {projectUsers.map((user) => (
                                            <option key={user._id} value={user._id}>
                                                {user.userName}
                                            </option>
                                        ))}
                                    </select>
                                    {!newUserStory.owner?._id && error && (
                                        <p className="mt-1 text-sm text-red-500">Owner is required</p>
                                    )}
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
                                    {!newUserStory.priority && error && (
                                        <p className="mt-1 text-sm text-red-500">Priority is required</p>
                                    )}
                                </div>
                                {/* <div>
                                    <label htmlFor="storyPoints" className="block text-sm font-medium text-gray-700">
                                        Story Points (Time Estimate)
                                    </label>
                                    <input
                                        type="number"
                                        id="storyPoints"
                                        name="storyPoints"
                                        value={newUserStory.storyPoints}
                                        onChange={handleInputChange}
                                        min="1"
                                        list="storypoints-options"
                                        className={`mt-1 block w-full border ${(!newUserStory.storyPoints || newUserStory.storyPoints <= 0) && error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                        required
                                    />
                                    {(!newUserStory.storyPoints || newUserStory.storyPoints <= 0) && error && (
                                        <p className="mt-1 text-sm text-red-500">Story points must be greater than 0</p>
                                    )}
                                </div> */}
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
                                    {!newUserStory.dueDate && error && (
                                        <p className="mt-1 text-sm text-red-500">Due date is required</p>
                                    )}
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
                                    className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                                        }`}
                                >
                                    {isSubmitting ? 'Adding...' : 'Add User Story'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BacklogTable;