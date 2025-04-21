"use client";

import React, { useState } from "react";
import { User } from "@/lib/types/user-types";
import { tasks_noId } from "@/lib/types/tasks";
import { addTask } from "@/lib/actions/user-story-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface AddTaskFormProps {
    userStoryId: string;
    team: User[];
    isDeveloper: boolean;
    isScrumMaster: boolean;
    sprintPosition: string;
    onTaskAdded: (newTask: any) => void;
}

export function AddTaskForm({ userStoryId, team, isDeveloper, isScrumMaster, sprintPosition, onTaskAdded }: AddTaskFormProps) {
    const [newTask, setNewTask] = useState<Partial<tasks_noId>>({
        userStoryId: userStoryId,
        IsCompleted: false,
        description: "",
        isAccepted: false,
        AssignedTo: undefined,
        timeLogged: 0,
        timeEstimate: 1,
        dueDate: new Date(),
        timeLogHistory: [] // Initialize with empty array
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string>("");

    const validateTask = (): boolean => {
        // Validate user role
        if (!isDeveloper && !isScrumMaster) {
            setError("Only developers and Scrum Master can add tasks");
            return false;
        }

        // Validate story status
        if (sprintPosition === "Done") {
            setError("Cannot add tasks to a completed user story");
            return false;
        }

        // Validate if story is in active sprint
        if (sprintPosition === "Backlog") {
            setError("Cannot add tasks to a story in the backlog");
            return false;
        }

        // Validate description
        if (!newTask.description || newTask.description.trim() === "") {
            setError("Task description is required");
            return false;
        }

        // Validate time estimate
        if (!newTask.timeEstimate || newTask.timeEstimate <= 0) {
            setError("Please provide a valid time estimate greater than 0");
            return false;
        }

        // Validate due date
        if (!newTask.dueDate) {
            setError("Due date is required");
            return false;
        }

        setError("");
        return true;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewTask(prev => ({
            ...prev,
            [name]: value ? new Date(value) : null
        }));
    };

    const resetForm = () => {
        setNewTask({
            userStoryId: userStoryId,
            IsCompleted: false,
            description: "",
            isAccepted: false,
            AssignedTo: undefined,
            timeLogged: 0,
            timeEstimate: 1,
            dueDate: new Date(),
            timeLogHistory: [] // Initialize with empty array
        });
        setError("");
    };

    const handleSubmit = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault();

        if (!validateTask()) {
            return;
        }

        try {
            setIsSubmitting(true);
            setError("");

            const taskToAdd: tasks_noId = {
                userStoryId: userStoryId,
                description: newTask.description!.trim(),
                IsCompleted: false,
                isAccepted: false,
                dueDate: newTask.dueDate || new Date(),
                AssignedTo: newTask.AssignedTo,
                timeLogged: 0,
                timeEstimate: newTask.timeEstimate!,
                startLog: null,
                timeLogHistory: [] // Initialize with empty array for new tasks
            };

            const result = await addTask(taskToAdd);

            if (!result || !result.insertedId) {
                throw new Error("Failed to add task - no ID returned");
            }

            const updatedTaskId = {
                _id: result.insertedId,
                ...taskToAdd
            };

            onTaskAdded(updatedTaskId);
            resetForm();
        } catch (error) {
            console.error("Error adding task:", error);
            setError("Failed to add task. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardContent className="p-4">
                {/* Changed from form to div to prevent nested form elements */}
                <div className="space-y-4">
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <Textarea
                            name="description"
                            value={newTask.description || ''}
                            onChange={handleInputChange}
                            rows={2}
                            placeholder="Task description"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Time Estimate (hours)
                            </label>
                            <Input
                                type="number"
                                name="timeEstimate"
                                value={newTask.timeEstimate || ''}
                                onChange={handleInputChange}
                                min="0.5"
                                step="0.5"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Due Date
                            </label>
                            <Input
                                type="date"
                                name="dueDate"
                                value={newTask.dueDate ? new Date(newTask.dueDate).toISOString().split('T')[0] : ''}
                                onChange={handleDateChange}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Assign To (Optional)
                        </label>
                        <select
                            name="AssignedTo"
                            value={newTask.AssignedTo ? newTask.AssignedTo._id : ''}
                            onChange={handleInputChange}
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

                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full"
                    >
                        {isSubmitting ? 'Adding...' : 'Add Task'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}