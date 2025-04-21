"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { UserStory } from "@/lib/types/user-story-types";
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
import { useParams } from "next/navigation";

interface UserStoryCardProps {
    ID: string;
    draggableId: string;
    index: number;
    storyData: UserStory;
    userRole: string;
    team: User[];
    comment: string;
    projectMembers: { userId: string | { $oid: string }; role: string }[];
    currentUserId: string | { $oid: string };
    onStoryUpdated?: (updatedStory: UserStory) => void;
}


const UserStoryCard: React.FC<UserStoryCardProps> = ({ ID, draggableId, index, storyData, userRole, onStoryUpdated }) => {
    const { user } = useUser();
    const [isScrumMaster, setIsScrumMaster] = useState(false);
    const [isProductOwner, setIsProductOwner] = useState(false);
    const [isDeveloper, setIsDeveloper] = useState(false);
    const [isValid, setIsValid] = useState(true);
    const [validationMessage, setValidationMessage] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editedStory, setEditedStory] = useState<UserStory>({ ...storyData });
    const [storyTasks, setStoryTasks] = useState<tasks[]>([]);
    const [isTasksOpen, setIsTasksOpen] = useState(true);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionComment, setRejectionComment] = useState<string | null>(null);
    const [tempComment, setTempComment] = useState("");
    const params = useParams();

    const validateStory = useCallback(() => {
        let valid = true;
        let message = "";

        if (!storyData.storyPoints || storyData.storyPoints <= 0) {
            valid = false;
            message = "Missing time estimate";
        } else if (storyData.SprintPosition === "Done") {
            valid = false;
            message = "Story already completed";
        }

        setIsValid(valid);
        setValidationMessage(message);
    }, [storyData.storyPoints, storyData.SprintPosition]);

    const fetchTasks = useCallback(async () => {
        try {
            const response = await getTasks();
            const filtered = response.filter((task: tasks) => task.userStoryId == draggableId);
            setStoryTasks(filtered);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    }, [draggableId]);

    useEffect(() => {
        setIsScrumMaster(userRole === "SCRUM_MASTER");
        setIsDeveloper(userRole === "DEVELOPER" || userRole === "SCRUM_MASTER");
        setIsProductOwner(userRole === "PRODUCT_OWNER");
        validateStory();
        fetchTasks();
    }, [userRole, validateStory, fetchTasks]);

    useEffect(() => {
        setEditedStory({ ...storyData });
    }, [storyData]);

    const handleDoubleClick = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditedStory({ ...storyData });
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
        updateStory(editedStory);
        setIsModalOpen(false);
    };

    const handleTaskAdded = (newTask: tasks) => {
        setStoryTasks(prev => [...prev, newTask]);
        fetchTasks();
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
                            {storyData.SprintPosition === "Acceptance" && isProductOwner && (
                                <button
                                    className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                                    onClick={() => setShowRejectModal(true)}
                                >
                                    Reject
                                </button>
                            )}
                        </div>

                        <p className="text-gray-600 mb-4">{storyData.description}</p>

                        {editedStory.rejectionComment && (
                            <div className="mt-4 p-3 border-l-4 border-red-500 bg-red-100 text-red-800 rounded">
                                <strong>Rejection Reason:</strong> {editedStory.rejectionComment}
                            </div>
                        )}


                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mb-3">
                            <p><strong>Owner:</strong> {storyData.owner?.userName || "Unassigned"}</p>
                            <p className={!storyData.storyPoints ? "text-red-500" : ""}>
                                <strong>Story Points:</strong> {storyData.storyPoints || "Not estimated"}
                            </p>
                            <p><strong>Status:</strong> {storyData.SprintPosition}</p>
                            <p className="col-span-2"><strong>Created:</strong> {new Date(storyData.createdAt).toLocaleDateString()}</p>
                            <CommentSection
                                storyId={draggableId}
                                storyData={storyData}
                                userRole={userRole}
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

            {showRejectModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-4">Reason for Rejection</h2>
                        <textarea
                            value={tempComment}
                            onChange={(e) => setTempComment(e.target.value)}
                            className="w-full border rounded p-2 mb-4"
                            rows={4}
                            placeholder="Enter reason..."
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                onClick={() => {
                                    setTempComment("");
                                    setShowRejectModal(false);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                onClick={async () => {
                                    const updated = {
                                        ...storyData,
                                        rejectionComment: tempComment,
                                        SprintPosition: 'Sprint Backlog', // Moves it back
                                    };

                                    try {
                                        await updateStory(updated);
                                        setEditedStory(updated);
                                        setTempComment("");
                                        setShowRejectModal(false);
                                        if (onStoryUpdated) {
                                            onStoryUpdated(updated);
                                        }
                                    } catch (error) {
                                        console.error("Failed to reject story:", error);
                                    }
                                }}

                            >
                                Reject Story
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserStoryCard;