"use client";

import React, {useEffect, useState} from "react";
import { Draggable } from "@hello-pangea/dnd";
import {UserStory} from "@/lib/types/user-story-types";
import {useUser} from "@/lib/hooks/useUser";
import {updateStory, addTask, getTasks, updateTask} from "@/lib/actions/user-story-actions";
import {tasks, tasks_noId} from "@/lib/types/tasks";
import {User} from "@/lib/types/user-types";

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
    const [taskTimeInputs, setTaskTimeInputs] = useState<Record<string, string>>({});


    const [newTask, setNewTask] = useState<Partial<tasks_noId>>({
        userStoryId: ID,
        IsCompleted: false,
        description: "",
        isAccepted: false,
        AssignedTo: null,
        timeLogged: 0
    });


    useEffect(() => {
        setIsScrumMaster(userRole === "SCRUM_MASTER");
        setIsDeveloper(userRole === "DEVELOPER" || userRole === "SCRUM_MASTER");
        validateStory();
        console.log("team", team);


        const fetchTasks = async () => {
            try {
                const response = await getTasks()
                const filtered = response.filter((task: tasks) => task.userStoryId == draggableId)
                setStoryTasks(filtered);

                const initialTimeInputs: Record<string, string> = {};
                filtered.forEach(task => {
                    initialTimeInputs[task._id] = "";
                });
                setTaskTimeInputs(initialTimeInputs);

            } catch (error) {
                console.error("Error fetching tasks:", error);
            }
        };

        fetchTasks();
    }, [user, storyData, ID]);

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

    const handleTaskInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === "AssignedTo") {
            if (!value || value === "") {
                setNewTask(prev => ({
                    ...prev,
                    AssignedTo: undefined
                }));
            } else {
                const selectedMember = team.find(member => member._id === value);
                setNewTask(prev => ({
                    ...prev,
                    AssignedTo: selectedMember
                }));
            }
        } else {
            setNewTask(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleTaskDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewTask(prev => ({
            ...prev,
            [name]: value ? new Date(value) : null
        }));
    };

    const resetNewTaskForm = () => {
        setNewTask({
            userStoryId: ID,
            IsCompleted: false,
            description: "",
            isAccepted: false,
            AssignedTo: null,
            timeLogged: 0
        });
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const taskToAdd: tasks_noId = {
                userStoryId: draggableId,
                description: newTask.description || "",
                IsCompleted: false,
                isAccepted: false,
                dueDate: newTask.dueDate || new Date(),
                AssignedTo: newTask.AssignedTo || null,
                timeLogged: 0
            };

            const result = await addTask(taskToAdd);

            const updatedTaskId = {
                _id: result.insertedId,
                ...taskToAdd
            };

            setStoryTasks([...storyTasks, updatedTaskId]);
            resetNewTaskForm();
        }
        catch (error) {
            console.error("Error adding task:", error);
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateStory(editedStory)
        setIsModalOpen(false);
    };

    const handleTaskCompletion = async (task: tasks) => {
        try {
            const updatedTask = {
                ...task,
                IsCompleted: !task.IsCompleted
            };

            await updateTask(updatedTask);

            setStoryTasks(prev =>
                prev.map(t => t._id === task._id ? updatedTask : t)
            );
        } catch (error) {
            console.error("Error updating task:", error);
        }
    };

    const handleTaskAcceptance = async (task: tasks) => {
        try {
            if (!user || (task.AssignedTo && task.AssignedTo._id !== user._id)) {
                alert("Only the assigned user can accept this task");
                return;
            }

            const updatedTask = {
                ...task,
                isAccepted: !task.isAccepted
            };

            await updateTask(updatedTask);

            setStoryTasks(prev =>
                prev.map(t => t._id === task._id ? updatedTask : t)
            );
        } catch (error) {
            console.error("Error updating task:", error);
        }
    };

    const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>, taskId: string) => {
        const { value } = e.target;
        setTaskTimeInputs(prev => ({
            ...prev,
            [taskId]: value
        }));
    };

    const logTime = async (e: React.MouseEvent<HTMLButtonElement>, task: tasks) => {
        e.preventDefault();

        const timeValue = taskTimeInputs[task._id];

        if (!timeValue || isNaN(Number(timeValue)) || Number(timeValue) <= 0) {
            alert("Please enter a valid time value");
            return;
        }

        try {
            const currentTime = task.timeLogged ? Number(task.timeLogged) : 0;
            const newTime = currentTime + Number(timeValue);

            const updatedTask = {
                ...task,
                timeLogged: newTime
            };

            await updateTask(updatedTask);

            setStoryTasks(prev =>
                prev.map(t => t._id === task._id ? updatedTask : t)
            );

            setTaskTimeInputs(prev => ({
                ...prev,
                [task._id]: ""
            }));

        } catch (error) {
            console.error("Error logging time:", error);
            alert("Failed to log time. Please try again.");
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
                            <div className="mt-3 pt-3 border-t border-gray-200">
                                <h4 className="font-semibold text-gray-700 mb-2">Tasks ({storyTasks.length})</h4>
                                <div className="space-y-2">
                                    {storyTasks.map((task) => (
                                        <div key={task._id} className="flex items-center p-2 bg-gray-50 rounded text-sm">
                                            <div className={`flex-1 ${task.IsCompleted ? 'line-through text-gray-400' : ''}`}>
                                                <div>{task.description || "No description"}</div>
                                                <div className="text-xs text-gray-500">
                                                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                                                </div>
                                            </div>
                                            <div className="text-xs ml-2 flex flex-col items-end space-y-1">
                                                {task.AssignedTo && (
                                                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                    {task.AssignedTo.userName}
                                                </span>
                                                )}
                                                {task.isAccepted ? (
                                                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                                    Accepted
                                                </span>
                                                ) : task.AssignedTo ? (
                                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                                    Pending
                                                </span>
                                                ) : null}
                                                {task.IsCompleted && (
                                                    <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                                    Completed
                                                </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
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
                                                    <div key={task._id} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                                                        <div className="flex-1">
                                                            <div className={task.IsCompleted ? 'line-through text-gray-400' : ''}>
                                                                {task.description}
                                                            </div>
                                                            <div className="text-sm text-gray-500 mt-1">
                                                                Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                                                            </div>
                                                            <div className="text-sm text-gray-500 mt-1">
                                                                Logged time: {task.timeLogged || 0} hours
                                                            </div>
                                                        </div>

                                                        <div className="px-2 py-1 rounded">
                                                            <label htmlFor={`timeInput-${task._id}`} className="block mb-1 font-medium">Log time:</label>
                                                            <div className="flex">
                                                                <input
                                                                    id={`timeInput-${task._id}`}
                                                                    type="number"
                                                                    min="0.5"
                                                                    step="0.5"
                                                                    value={taskTimeInputs[task._id] || ""}
                                                                    onChange={(e) => handleTimeInputChange(e, task._id)}
                                                                    className="rounded border px-2 py-1 w-20"
                                                                    placeholder="Hours"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => logTime(e, task)}
                                                                    className="ml-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                                >
                                                                    Log
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center space-x-2">
                                                            {task.AssignedTo && (
                                                                <div className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                    {task.AssignedTo.userName}
                                                                </div>
                                                            )}

                                                            <div className="flex space-x-2">
                                                                {task.AssignedTo &&
                                                                    task.AssignedTo._id === user?._id &&
                                                                    !task.isAccepted && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleTaskAcceptance(task)}
                                                                            className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                                                        >
                                                                            Accept
                                                                        </button>
                                                                    )}

                                                                {task.AssignedTo &&
                                                                    task.AssignedTo._id === user?._id &&
                                                                    task.isAccepted &&
                                                                    !task.IsCompleted && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleTaskCompletion(task)}
                                                                            className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                                                                        >
                                                                            Complete
                                                                        </button>
                                                                    )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                            <h4 className="text-md font-medium text-gray-700 mb-3">Add New Task</h4>

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                                    <textarea
                                                        name="description"
                                                        value={newTask.description || ''}
                                                        onChange={handleTaskInputChange}
                                                        rows={2}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Due Date</label>
                                                        <input
                                                            type="date"
                                                            name="dueDate"
                                                            value={newTask.dueDate ? new Date(newTask.dueDate).toISOString().split('T')[0] : ''}
                                                            onChange={handleTaskDateChange}
                                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Assign To (Optional)</label>
                                                        <select
                                                            name="AssignedTo"
                                                            value={newTask.AssignedTo ? newTask.AssignedTo._id : ''}
                                                            onChange={handleTaskInputChange}
                                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        >
                                                            <option value="">Unassigned</option>
                                                            {team && team.map(member => (
                                                                <option key={member._id} value={member._id}>
                                                                    {member.userName}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleAddTask}
                                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        Add Task
                                                    </button>
                                                </div>
                                            </div>
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