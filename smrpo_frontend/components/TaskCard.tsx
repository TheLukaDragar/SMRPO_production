import React from "react";
import { User } from "@/lib/types/user-types";
import { tasks } from "@/lib/types/tasks";
import { useUser } from "@/lib/hooks/useUser";
import { updateTask, deleteTask } from "@/lib/actions/user-story-actions";
import {
    Card,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
    task: tasks;
    isScrumMaster: boolean;
    onTaskUpdated: (updatedTask: tasks) => void;
    onTaskDeleted: (taskId: string) => void;
}

export function TaskCard({ task, isScrumMaster, onTaskUpdated, onTaskDeleted }: TaskCardProps) {
    const { user } = useUser();
    const [timeInput, setTimeInput] = React.useState("");

    const canDelete = !task.isAccepted && !task.IsCompleted && 
        (isScrumMaster || (task.AssignedTo && task.AssignedTo._id === user?._id));

    const handleTaskAcceptance = async () => {
        try {
            if (!user) {
                alert("You must be logged in to accept tasks");
                return;
            }

            // For unaccepting/rejecting a task
            if (task.isAccepted) {
                if (!task.AssignedTo || task.AssignedTo._id !== user._id) {
                    alert("Only the assigned developer can reject this task");
                    return;
                }

                if (task.IsCompleted) {
                    alert("Cannot reject a completed task");
                    return;
                }

                const updatedTask: tasks = {
                    ...task,
                    AssignedTo: undefined, // Remove assignment to allow others to take it
                    isAccepted: false
                };

                await updateTask(updatedTask);
                onTaskUpdated(updatedTask);
                return;
            }

            // For accepting a task
            // Task can be accepted if:
            // 1. It's unassigned (AssignedTo is undefined)
            // 2. It's not accepted (even if AssignedTo is set - this happens when task was rejected)
            const updatedTask: tasks = {
                ...task,
                AssignedTo: {
                    _id: user._id,
                    userName: user.userName,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    password: user.password,
                    createdAt: user.createdAt
                },
                isAccepted: true
            };

            await updateTask(updatedTask);
            onTaskUpdated(updatedTask);
        } catch (error) {
            console.error("Error updating task:", error);
            alert("Failed to update task. Please try again.");
        }
    };

    const handleTaskCompletion = async () => {
        try {
            const updatedTask = {
                ...task,
                IsCompleted: !task.IsCompleted
            };

            await updateTask(updatedTask);
            onTaskUpdated(updatedTask);
        } catch (error) {
            console.error("Error updating task:", error);
        }
    };

    const handleTimeLog = async () => {
        if (!user) {
            alert("You must be logged in to log time");
            return;
        }

        if (!task.isAccepted) {
            alert("Task must be accepted before logging time");
            return;
        }

        if (!task.AssignedTo || task.AssignedTo._id !== user._id) {
            alert("Only the assigned user can log time for this task");
            return;
        }

        if (!timeInput || isNaN(Number(timeInput)) || Number(timeInput) <= 0) {
            alert("Please enter a valid time value");
            return;
        }

        try {
            const currentTime = task.timeLogged ? Number(task.timeLogged) : 0;
            const newTime = currentTime + Number(timeInput);

            const updatedTask = {
                ...task,
                timeLogged: newTime
            };

            await updateTask(updatedTask);
            onTaskUpdated(updatedTask);
            setTimeInput("");
        } catch (error) {
            console.error("Error logging time:", error);
            alert("Failed to log time. Please try again.");
        }
    };

    const handleDelete = async () => {
        if (task.isAccepted || task.IsCompleted) {
            alert("Cannot delete an accepted or completed task");
            return;
        }

        if (!isScrumMaster && (!task.AssignedTo || task.AssignedTo._id !== user?._id)) {
            alert("Only the Scrum Master or assigned developer can delete this task");
            return;
        }

        if (!confirm("Are you sure you want to delete this task?")) {
            return;
        }

        try {
            const result = await deleteTask(task._id);
            if (result.deletedCount > 0) {
                onTaskDeleted(task._id);
            }
        } catch (error) {
            console.error("Error deleting task:", error);
            alert("Failed to delete task. Please try again.");
        }
    };

    const getStatusColor = () => {
        if (task.IsCompleted) return "bg-green-50 border-green-200";
        if (task.isAccepted) return "bg-blue-50 border-blue-200";
        return "bg-yellow-50 border-yellow-200";
    };

    return (
        <Card className={cn(
            "w-full transition-all hover:shadow-md",
            getStatusColor(),
            task.IsCompleted && "opacity-80"
        )}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                    <div className={cn(
                        "flex-1 font-medium",
                        task.IsCompleted && "line-through text-gray-400"
                    )}>
                        {task.description}
                    </div>
                    <div className="flex items-center gap-2">
                        {task.AssignedTo && (
                            <Badge variant="secondary" className="whitespace-nowrap">
                                {task.AssignedTo.userName}
                            </Badge>
                        )}
                        {!task.isAccepted && task.AssignedTo && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 whitespace-nowrap">
                                Pending Acce..
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="flex gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {task.timeLogged || 0} / {task.timeEstimate}h logged
                    </div>
                </div>

                {(task.isAccepted || task.IsCompleted) && (
                    <div className="flex gap-2 mt-3">
                        {task.isAccepted && !task.IsCompleted && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                In Progress
                            </Badge>
                        )}
                        {task.IsCompleted && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                                Completed
                            </Badge>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    {task.AssignedTo && 
                     task.AssignedTo._id === user?._id && 
                     task.isAccepted &&
                     !task.IsCompleted && (
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={timeInput}
                                onChange={(e) => setTimeInput(e.target.value)}
                                placeholder="Hours"
                                className="w-24"
                            />
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleTimeLog}
                                className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                            >
                                Log Time
                            </Button>
                        </div>
                    )}

                    <div className="flex gap-2 ml-auto">
                        {/* Show Accept Task button for unassigned tasks or tasks that were rejected */}
                        {user && !task.isAccepted && !task.IsCompleted && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleTaskAcceptance}
                                className="border-yellow-200 hover:bg-yellow-50 text-yellow-800"
                            >
                                {task.AssignedTo?._id === user?._id ? "Accept Task" : "Take Over Task"}
                            </Button>
                        )}

                        {canDelete && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDelete}
                                className="bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
                
                {/* New row for Reject and Complete buttons */}
                <div className="flex justify-end gap-2 mt-2">
                    {/* Show Reject Task button for accepted tasks assigned to current user */}
                    {user && task.isAccepted && task.AssignedTo && task.AssignedTo._id === user._id && !task.IsCompleted && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleTaskAcceptance}
                            className="border-red-200 hover:bg-red-50 text-red-800"
                        >
                            Reject Task
                        </Button>
                    )}

                    {task.AssignedTo &&
                        task.AssignedTo._id === user?._id &&
                        task.isAccepted &&
                        !task.IsCompleted && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleTaskCompletion}
                                className="border-green-200 hover:bg-green-50 text-green-800"
                            >
                                Complete
                            </Button>
                        )}
                </div>
            </CardContent>
        </Card>
    );
} 