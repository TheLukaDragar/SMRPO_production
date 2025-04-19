"use client";

import React, { useEffect, useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { useUser } from "@/lib/hooks/useUser";
import { updateStory, getTasks } from "@/lib/actions/user-story-actions";
import { tasks } from "@/lib/types/tasks";
import { User } from "@/lib/types/user-types";
import { TaskCard } from "@/components/TaskCard";
import { AddTaskForm } from "@/components/AddTaskForm";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import TextAreaTests from "@/components/TextAreaTests";
import CommentSection from "@/components/CommentSection";
import { CommentEntry } from "@/lib/types/projectPosts-types";
import { UserStory } from "@/lib/types/user-story-types";



interface UserStoryCardProps {
    ID: string;
    title: string;
    items: UserStory[];
    projectUsers: User[];
    setItems: React.Dispatch<React.SetStateAction<UserStory[]>>;
}

const UserStoryCard: React.FC<UserStoryCardProps> = ({ ID, title, items, projectUsers, setItems }) => {
    const { user } = useUser();
    const [isScrumMaster, setIsScrumMaster] = useState(false);
    const [isDeveloper, setIsDeveloper] = useState(false);
    const [isValid, setIsValid] = useState(true);
    const [validationMessage, setValidationMessage] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editedStory, setEditedStory] = useState<UserStory>({ ...items[0] });
    const [storyTasks, setStoryTasks] = useState<tasks[]>([]);
    const [isTasksOpen, setIsTasksOpen] = useState(true);

    const handleDoubleClick = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsModalOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditedStory({ ...editedStory, [e.target.name]: e.target.value });
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditedStory({ ...editedStory, [e.target.name]: parseInt(e.target.value) });
    };

    const handleTaskAdded = (task: tasks) => {
        setStoryTasks(prev => [...prev, task]);
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setEditedStory({ ...editedStory, [e.target.name]: e.target.value });
    };

    return (
        <div>
            <Draggable
                key={ID}
                draggableId={ID}
                index={items.indexOf(items[0])}
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
                            <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                            <div className="flex items-center space-x-2">
                                {!isValid && (
                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                        {validationMessage}
                                    </span>
                                )}
                                <span
                                    className={`text-sm px-2 py-1 rounded-full ${editedStory.priority === 'Must have'
                                        ? 'bg-red-500 text-white'
                                        : editedStory.priority === 'Should have'
                                            ? 'bg-yellow-500 text-white'
                                            : 'bg-green-500 text-white'
                                    }`}
                                >
                                    {editedStory.priority}
                                </span>
                            </div>
                        </div>

                        <p className="text-gray-600 mb-4">{editedStory.description}</p>

                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mb-3">
                            <p><strong>Owner:</strong> {editedStory.owner?.userName || "Unassigned"}</p>
                            <p className={!editedStory.storyPoints ? "text-red-500" : ""}>
                                <strong>Story Points:</strong> {editedStory.storyPoints || "Not estimated"}
                            </p>
                            <p><strong>Status:</strong> {editedStory.SprintPosition}</p>
                            <p className="col-span-2"><strong>Created:</strong> {new Date(editedStory.createdAt).toLocaleDateString()}</p>
                            <CommentSection
                                storyId={ID}
                                storyData={editedStory}
                            />
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
                                <TextAreaTests input={editedStory} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                                    <select
                                        name="priority"
                                        value={editedStory.priority || ''}
                                        onChange={handleSelectChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="Wont Have">Wont Have</option>
                                        <option value="Should Have">Should Have</option>
                                        <option value="Must have">Must have</option>
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
                                    <label className="block text-sm font-medium text-gray-700">Sprint Position</label>
                                    <select
                                        name="SprintPosition"
                                        value={editedStory.SprintPosition || ''}
                                        onChange={handleSelectChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="Backlog">Backlog</option>
                                        <option value="Sprint">Sprint</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Done">Done</option>
                                        <option value="Rejected">Rejected</option>
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
                                        userStoryId={ID}
                                        team={projectUsers}
                                        isDeveloper={isDeveloper}
                                        isScrumMaster={isScrumMaster}
                                        sprintPosition={editedStory.SprintPosition}
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