"use client";

import React, {useEffect, useState} from "react";
import { Draggable } from "@hello-pangea/dnd";
import {UserStory} from "@/lib/types/user-story-types";
import {useUser} from "@/lib/hooks/useUser";
import {updateStory, getTasks} from "@/lib/actions/user-story-actions";
import {tasks} from "@/lib/types/tasks";
import {User} from "@/lib/types/user-types";
import { TaskCard } from "@/components/TaskCard";
import { AddTaskForm } from "@/components/AddTaskForm";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface UserStoryCardProps {
    ID: string;
    draggableId: string;
    index: number;
    storyData: UserStory;
    userRole: string;
    team: User[];
}

const UserStoryCard: React.FC<UserStoryCardProps> = ({ ID, draggableId, index, storyData, userRole, team}) => {
    const { user } = useUser();
    const [isScrumMaster, setIsScrumMaster] = useState(false);
    const [isDeveloper, setIsDeveloper] = useState(false);
    const [isValid, setIsValid] = useState(true);
    const [validationMessage, setValidationMessage] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editedStory, setEditedStory] = useState<UserStory>({...storyData});
    const [storyTasks, setStoryTasks] = useState<tasks[]>([]);
    const [isTasksOpen, setIsTasksOpen] = useState(true);

    useEffect(() => {
        setIsScrumMaster(userRole === "SCRUM_MASTER");
        setIsDeveloper(userRole === "DEVELOPER" || userRole === "SCRUM_MASTER");
        validateStory();
        fetchTasks();
    }, [user, storyData, ID, draggableId, userRole]);

    useEffect(() => {
        setEditedStory({...storyData});
    }, [storyData]);

    const validateStory = () => {
        let valid = true;
        let message = "";

        if (!storyData.storyPoints || storyData.storyPoints <= 0) {
            valid = false;
            message = "Missing time estimate";
        }
        else if (storyData.SprintPosition === "Done") {
            valid = false;
            message = "Story already completed";
        }

        setIsValid(valid);
        setValidationMessage(message);
    };

    const handleDoubleClick = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditedStory({...storyData});
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditedStory(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedStory(prev => ({
            ...prev,
            [name]: value === '' ? null : parseInt(value)
        }));
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedStory(prev => ({
            ...prev,
            [name]: value || null
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateStory(editedStory)
        setIsModalOpen(false);
    };

    const handleTaskAdded = (newTask: tasks) => {
        setStoryTasks(prev => [...prev, newTask]);
        fetchTasks();
    };

    const fetchTasks = async () => {
        try {
            const response = await getTasks()
            const filtered = response.filter((task: tasks) => task.userStoryId == draggableId)
            setStoryTasks(filtered);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    };

    return (
        <div>
            <Draggable
                key={ID}
                draggableId={draggableId}
                index={index}
                isDragDisabled={!isScrumMaster || !isValid}
            >
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`w-full max-w-md bg-white rounded-lg border ${!isValid ? 'border-red-300' : 'border-gray-200'} 
                              shadow-md hover:shadow-lg transition-shadow duration-300 p-4 my-2
                              ${snapshot.isDragging ? 'ring-2 ring-blue-500' : ''}
                              ${!isValid ? 'opacity-75' : ''}`}
                        onDoubleClick={handleDoubleClick}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">{storyData.title}</h3>
                            <div className="flex items-center space-x-2">
                                {!isValid && (
                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                    {validationMessage}
                                </span>
                                )}
                                <span
                                    className={`text-sm px-2 py-1 rounded-full ${
                                        storyData.priority === 'High'
                                            ? 'bg-red-500 text-white'
                                            : storyData.priority === 'Medium'
                                                ? 'bg-yellow-500 text-white'
                                                : 'bg-green-500 text-white'
                                    }`}
                                >
                                {storyData.priority}
                            </span>
                            </div>
                        </div>

                        <p className="text-gray-600 mb-4">{storyData.description}</p>

                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mb-3">
                            <p><strong>Owner:</strong> {storyData.owner?.userName || "Unassigned"}</p>
                            <p className={!storyData.storyPoints ? "text-red-500" : ""}>
                                <strong>Story Points:</strong> {storyData.storyPoints || "Not estimated"}
                            </p>
                            <p><strong>Due Date:</strong> {storyData.dueDate ? new Date(storyData.dueDate).toLocaleDateString() : "Not set"}</p>
                            <p><strong>Status:</strong> {storyData.SprintPosition}</p>
                            <p className="col-span-2"><strong>Created:</strong> {new Date(storyData.createdAt).toLocaleDateString()}</p>
                        </div>

                        {storyTasks.length > 0 && (
                            <Collapsible
                                open={isTasksOpen}
                                onOpenChange={setIsTasksOpen}
                                className="mt-4 pt-4 border-t border-gray-200"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <CollapsibleTrigger className="flex items-center gap-2 hover:text-blue-600">
                                        <h4 className="font-semibold text-gray-700">Tasks ({storyTasks.length})</h4>
                                        {isTasksOpen ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                    </CollapsibleTrigger>
                                </div>
                                <CollapsibleContent className="space-y-3">
                                    {storyTasks.map((task) => (
                                        <TaskCard
                                            key={task._id}
                                            task={task}
                                            isScrumMaster={isScrumMaster}
                                            onTaskUpdated={(updatedTask) => {
                                                setStoryTasks(prev =>
                                                    prev.map(t => t._id === updatedTask._id ? updatedTask : t)
                                                );
                                            }}
                                            onTaskDeleted={(taskId) => {
                                                setStoryTasks(prev => prev.filter(t => t._id !== taskId));
                                            }}
                                        />
                                    ))}
                                </CollapsibleContent>
                            </Collapsible>
                        )}
                    </div>
                )}
            </Draggable>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Edit User Story</h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={editedStory.title || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    name="description"
                                    value={editedStory.description || ''}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                                    <select
                                        name="priority"
                                        value={editedStory.priority || ''}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Story Points</label>
                                    <input
                                        type="number"
                                        name="storyPoints"
                                        value={editedStory.storyPoints || ''}
                                        onChange={handleNumberChange}
                                        min="1"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                                    <input
                                        type="date"
                                        name="dueDate"
                                        value={editedStory.dueDate ? new Date(editedStory.dueDate).toISOString().split('T')[0] : ''}
                                        onChange={handleDateChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Sprint Position</label>
                                    <select
                                        name="SprintPosition"
                                        value={editedStory.SprintPosition || ''}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="Backlog">Backlog</option>
                                        <option value="Sprint">Sprint</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Done">Done</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-semibold mb-4">Tasks</h3>
                                {storyTasks.length > 0 && (
                                    <div className="mb-6 space-y-3">
                                        <h4 className="text-md font-medium text-gray-700">Existing Tasks</h4>
                                        {storyTasks.map((task) => (
                                            <TaskCard
                                                key={task._id}
                                                task={task}
                                                isScrumMaster={isScrumMaster}
                                                onTaskUpdated={(updatedTask) => {
                                                    setStoryTasks(prev =>
                                                        prev.map(t => t._id === updatedTask._id ? updatedTask : t)
                                                    );
                                                }}
                                                onTaskDeleted={(taskId) => {
                                                    setStoryTasks(prev => prev.filter(t => t._id !== taskId));
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}

                                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                    <h4 className="text-md font-medium text-gray-700 mb-3">Add New Task</h4>
                                    <AddTaskForm
                                        userStoryId={draggableId}
                                        team={team}
                                        isDeveloper={isDeveloper}
                                        isScrumMaster={isScrumMaster}
                                        sprintPosition={storyData.SprintPosition}
                                        onTaskAdded={handleTaskAdded}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserStoryCard;