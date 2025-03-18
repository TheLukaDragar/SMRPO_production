"use client"

import React, {useEffect, useState} from "react";
import {Droppable } from "@hello-pangea/dnd";
import UserStoryCard from "@/components/userStoryCard";
import { UserStory } from "@/lib/types/user-story-types";
import {useUser} from "@/lib/hooks/useUser";
import {User} from "@/lib/types/user-types";
import {addStory} from "@/lib/actions/user-story-actions";

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

    const handleSubmit = async () => {
        setError("");
        setIsSubmitting(true);

        const updatedUserStory = {
            ...newUserStory,
            createdAt: new Date()
        };

        const newStoryId = await addStory(updatedUserStory);

        const updatedUserStoryId = {
            _id: newStoryId.insertedId,
            ...newUserStory
        };

        setItems([...items, updatedUserStoryId]);


        try {
            setIsModalOpen(false);
            console.log(newUserStory);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
                <button onClick={() => isAdmin && setIsModalOpen(true)}
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
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                        Description
                                    </label>
                                    <input
                                        type="textarea"
                                        id="description"
                                        name="description"
                                        value={newUserStory.description}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
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
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    >
                                        {projectUsers.map((user) => (
                                            <option key={user._id} value={user._id}>
                                                {user.userName}
                                            </option>
                                        ))}
                                    </select>
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
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    >
                                        <option value="">Select priority</option>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="storyPoints" className="block text-sm font-medium text-gray-700">
                                        Story Points
                                    </label>
                                    <input
                                        type="number"
                                        id="storyPoints"
                                        name="storyPoints"
                                        value={newUserStory.storyPoints}
                                        onChange={handleInputChange}
                                        min="0"
                                        list="storypoints-options"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                    <datalist id="storypoints-options">
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="5">5</option>
                                        <option value="8">8</option>
                                        <option value="13">13</option>
                                        <option value="20">20</option>
                                        <option value="40">40</option>
                                        <option value="100">100</option>
                                    </datalist>
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
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                                    className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                        isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
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