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
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useParams } from "next/navigation";
import { ProjectRole } from "@/lib/types/project-types";

// shadcn components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import TextAreaTests from "@/components/TextAreaTests";
import CommentSection from "@/components/CommentSection";
import { CommentEntry } from "@/lib/types/projectPosts-types";

interface UserStoryCardProps {
    ID: string;
    draggableId: string;
    index: number;
    storyData: UserStory;
    userRole: string;
    team: User[];
    comment: string;
    projectMembers?: { userId: string | { $oid: string }; role: string }[];
    currentUserId?: string | { $oid: string };
    onStoryUpdated?: (updatedStory: UserStory) => void;
}

const UserStoryCard: React.FC<UserStoryCardProps> = ({ ID, draggableId, index, storyData, userRole, team, comment, projectMembers, currentUserId, onStoryUpdated }) => {
    const { user } = useUser();
    const [isScrumMaster, setIsScrumMaster] = useState(false);
    const [isDeveloper, setIsDeveloper] = useState(false);
    const [isProductOwner, setIsProductOwner] = useState(false);
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
            if (userRole === ProjectRole.PRODUCT_OWNER) {
                message = "Waiting for time estimate";
            } else {
                message = "Missing time estimate";
            }
        }
        else if (storyData.SprintPosition === "Done") {
            valid = false;
            message = "Story already completed";
        }

        setIsValid(valid);
        setValidationMessage(message);
    }, [storyData.storyPoints, storyData.SprintPosition, userRole]);

    const fetchTasks = useCallback(async () => {
        try {
            const response = await getTasks()
            const filtered = response.filter((task: tasks) => task.userStoryId == draggableId)
            setStoryTasks(filtered);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    }, [draggableId]);

    useEffect(() => {
        setIsScrumMaster(userRole === "SCRUM_MASTER" || userRole === "SCRUM_DEV");
        setIsDeveloper(userRole === "DEVELOPER" || userRole === "SCRUM_MASTER" || userRole === "SCRUM_DEV");
        setIsProductOwner(userRole === "PRODUCT_OWNER");
        validateStory();
        fetchTasks();
    }, [user, storyData, ID, draggableId, userRole, validateStory, fetchTasks]);

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

    const handleSelectChange = (name: string, value: string) => {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const updatedStoryData: UserStory | null = await updateStory(editedStory);
            if (updatedStoryData && onStoryUpdated) {
                onStoryUpdated(updatedStoryData);
                setIsModalOpen(false);
            } else if (updatedStoryData === null) {
                console.error("Failed to update story, backend returned null.");
                setIsModalOpen(false);
            } else {
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error("Error during story update process:", error);
            setIsModalOpen(false);
        }
    };

    const handleTaskAdded = (newTask: tasks) => {
        setStoryTasks(prev => [...prev, newTask]);
        fetchTasks();
    };

    const getPriorityBadgeVariant = (priority: string) => {
        switch (priority) {
            case 'Must have':
                return 'destructive';
            case 'Should Have':
                return 'secondary';
            default:
                return 'secondary';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Done':
                return 'text-green-600';
            case 'In Progress':
                return 'text-blue-600';
            case 'Sprint':
                return 'text-purple-600';
            case 'Rejected':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    const getValidationBadgeVariant = (message: string, isValid: boolean) => {
        if (!isValid) {
            if (message.includes("completed")) {
                return "secondary";
            }
            return "destructive";
        }
        return "outline";
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
                        onDoubleClick={handleDoubleClick}
                    >
                        <Card className={`w-full max-w-md ${snapshot.isDragging ? 'ring-2 ring-primary' : ''} 
                                     ${!isValid && !validationMessage.includes("completed") ? 'opacity-75 border-destructive' : ''} 
                                     hover:shadow-md transition-all duration-200`}>
                            <CardHeader className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl">{storyData.title}</CardTitle>
                                    <div className="flex gap-2">
                                        {!isValid && (
                                            <Badge 
                                                variant={getValidationBadgeVariant(validationMessage, isValid)}
                                                className={`${validationMessage.includes("completed") ? "text-blue-500" : ""} 
                                                          ${!validationMessage.includes("completed") ? "animate-pulse" : ""}`}
                                            >
                                                {validationMessage}
                                            </Badge>
                                        )}
                                        <Badge variant={getPriorityBadgeVariant(storyData.priority)}>
                                            {storyData.priority}
                                        </Badge>
                                    </div>
                                </div>
                                <CardDescription className="text-gray-600">{storyData.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {storyData.rejectionComment && (
                                    <Alert variant="destructive" className="bg-destructive/5 text-destructive">
                                        <AlertDescription>
                                            <strong>Rejection Reason:</strong> {storyData.rejectionComment}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <Label className="text-gray-500">Owner</Label>
                                        <p className="font-medium mt-1">{storyData.owner?.userName || "Unassigned"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-500">Story Points</Label>
                                        <p className={`font-medium mt-1 ${!storyData.storyPoints ? "text-destructive" : ""}`}>
                                            {storyData.storyPoints || (isProductOwner ? "Waiting for time estimate" : "Not estimated")}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-500">Status</Label>
                                        <p className={`font-medium mt-1 ${getStatusColor(storyData.SprintPosition)}`}>
                                            {storyData.SprintPosition}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-500">Created</Label>
                                        <p className="font-medium mt-1">{new Date(storyData.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <CommentSection
                                    storyId={draggableId}
                                    storyData={storyData}
                                    userRole={userRole}
                                />

                                {storyTasks.length > 0 && (
                                    <Collapsible
                                        open={isTasksOpen}
                                        onOpenChange={setIsTasksOpen}
                                        className="pt-4"
                                    >
                                        <CollapsibleTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                className="flex w-full items-center justify-between p-0 hover:bg-transparent hover:text-primary"
                                            >
                                                <span className="font-semibold">Tasks ({storyTasks.length})</span>
                                                {isTasksOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </Button>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="space-y-3 pt-2">
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
                            </CardContent>
                            {storyData.SprintPosition === "Acceptance" && isProductOwner && (
                                <CardFooter>
                                    <Button 
                                        variant="destructive" 
                                        onClick={() => setShowRejectModal(true)}
                                        className="w-full sm:w-auto"
                                    >
                                        Reject Story
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                    </div>
                )}
            </Draggable>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-primary">Edit User Story</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title" className="text-gray-700">Title</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={editedStory.title || ''}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description" className="text-gray-700">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={editedStory.description || ''}
                                    onChange={handleInputChange}
                                    placeholder="Enter story description..."
                                    className="min-h-[120px] resize-vertical"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="priority" className="text-gray-700">Priority</Label>
                                    <Select 
                                        name="priority" 
                                        value={editedStory.priority || ''} 
                                        onValueChange={(value) => handleSelectChange('priority', value)}
                                    >
                                        <SelectTrigger id="priority" className="w-full">
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Must have" className="text-destructive">Must Have</SelectItem>
                                            <SelectItem value="Should Have" className="text-yellow-600">Should Have</SelectItem>
                                            <SelectItem value="Wont Have" className="text-gray-600">Won't Have</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="storyPoints" className="text-gray-700">
                                        Story Points {isProductOwner && <span className="text-gray-400 text-sm">(Set by dev team)</span>}
                                    </Label>
                                    <Input
                                        id="storyPoints"
                                        type="number"
                                        name="storyPoints"
                                        value={editedStory.storyPoints || ''}
                                        onChange={handleNumberChange}
                                        min="1"
                                        disabled={isProductOwner}
                                        className={`w-full ${isProductOwner ? 'opacity-50' : ''}`}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="sprintPosition" className="text-gray-700">Sprint Position</Label>
                                <Select 
                                    name="SprintPosition" 
                                    value={editedStory.SprintPosition || ''} 
                                    onValueChange={(value) => handleSelectChange('SprintPosition', value)}
                                >
                                    <SelectTrigger id="sprintPosition" className="w-full">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Backlog">Backlog</SelectItem>
                                        <SelectItem value="Sprint" className="text-purple-600">Sprint</SelectItem>
                                        <SelectItem value="In Progress" className="text-blue-600">In Progress</SelectItem>
                                        <SelectItem value="Done" className="text-green-600">Done</SelectItem>
                                        <SelectItem value="Rejected" className="text-destructive">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-primary hover:bg-primary/90">
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>

                    {storyTasks.length > 0 && (
                        <div className="mt-8 pt-6 border-t">
                            <h3 className="text-lg font-semibold mb-4 text-primary">Tasks</h3>
                            <div className="space-y-4 bg-gray-50/50 rounded-lg p-4 border border-gray-100">
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
                        </div>
                    )}

                    {!isProductOwner && (
                        <div className="mt-8 pt-6 border-t">
                            <h3 className="text-lg font-semibold mb-4 text-primary">Add New Task</h3>
                            <div className="bg-gray-50/50 p-6 rounded-lg border border-gray-100">
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
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reason for Rejection</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Textarea
                            value={tempComment}
                            onChange={(e) => setTempComment(e.target.value)}
                            placeholder="Enter reason for rejecting this story..."
                            className="min-h-[100px] resize-none"
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setTempComment("");
                                setShowRejectModal(false);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                const updated = {
                                    ...storyData,
                                    rejectionComment: tempComment,
                                    SprintPosition: 'Sprint Backlog',
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
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UserStoryCard;