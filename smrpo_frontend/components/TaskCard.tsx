import React from "react";
import { User } from "@/lib/types/user-types";
import { tasks, TimeLogEntry } from "@/lib/types/tasks";
import { useUser } from "@/lib/hooks/useUser";
import { updateTask, deleteTask } from "@/lib/actions/user-story-actions";
import {
    Card,
    CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Trash2, Play, StopCircle, ChevronDown, ChevronUp, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
    task: tasks;
    isScrumMaster: boolean;
    onTaskUpdated: (updatedTask: tasks) => void;
    onTaskDeleted: (taskId: string) => void;
}

export function TaskCard({ task, isScrumMaster, onTaskUpdated, onTaskDeleted }: TaskCardProps) {
    const { user } = useUser();

    // For manual time logging
    const [manualDone, setManualDone] = React.useState("");
    const [manualToGo, setManualToGo] = React.useState("");
    const [logDate, setLogDate] = React.useState(new Date().toISOString().split('T')[0]);

    // For timer-based time tracking
    const [isTracking, setIsTracking] = React.useState(false);
    const [elapsedTime, setElapsedTime] = React.useState(0);
    const [startTime, setStartTime] = React.useState<Date | null>(null);
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);

    // For time log history display
    const [showLogHistory, setShowLogHistory] = React.useState(false);

    // For optional input-based time logging (not used in this snippet, but left available)
    const [timeInput, setTimeInput] = React.useState("");

    /**
     * Manually log hours (Hours Done / Hours To Go).
     */
    const handleManualTimeLog = async () => {
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

        const done = parseFloat(manualDone);
        const toGo = parseFloat(manualToGo);

        if (isNaN(done) || isNaN(toGo) || done < 0 || toGo < 0) {
            alert("Please enter valid numeric values");
            return;
        }

        // Validate the log date
        const selectedDate = new Date(logDate);
        if (isNaN(selectedDate.getTime())) {
            alert("Please enter a valid date");
            return;
        }

        try {
            // Create a new time log entry
            const newLogEntry = {
                timeLogged: done,
                timeEstimate: toGo,
                logDate: logDate,
                loggedBy: user._id
            };

            // Initialize or update the timeLogHistory array
            const timeLogHistory = task.timeLogHistory ? [...task.timeLogHistory] : [];
            timeLogHistory.push(newLogEntry);

            // Update the task with the new log entry and update current values
            const updatedTask = {
                ...task,
                timeLogged: done, // Keep current value up to date for backward compatibility
                timeEstimate: toGo,
                lastLogDate: logDate, // Keep for backward compatibility
                timeLogHistory: timeLogHistory
            };
            
            await updateTask(updatedTask);
            onTaskUpdated(updatedTask);

            setManualDone("");
            setManualToGo("");
        } catch (error) {
            console.error("Error logging manual time:", error);
            alert("Failed to log time. Please try again.");
        }
    };

    /**
     * Starts the timer that adds to the total logged time when stopped.
     */
    const startTimeTracking = () => {
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

        setIsTracking(true);
        setStartTime(new Date());
        timerRef.current = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);
    };

    /**
     * Stops the timer, calculates hours, and updates the task accordingly.
     */
    const stopTimeTracking = async () => {
        if (!startTime || !user) return;

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        const now = new Date();
        const timeSpentMs = now.getTime() - startTime.getTime();
        const timeSpentHours = timeSpentMs / (1000 * 60 * 60);
        const roundedTimeSpent = Math.round(timeSpentHours * 1000) / 1000;

        try {
            const currentTime = task.timeLogged ? Number(task.timeLogged) : 0;
            const newTime = currentTime + roundedTimeSpent;
            const todayDate = new Date().toISOString().split('T')[0];

            // Create a new time log entry for the timer
            const newLogEntry = {
                timeLogged: roundedTimeSpent, // Just the time spent during this tracking session
                timeEstimate: task.timeEstimate, // Keep current estimate
                logDate: todayDate,
                loggedBy: user._id
            };

            // Initialize or update the timeLogHistory array
            const timeLogHistory = task.timeLogHistory ? [...task.timeLogHistory] : [];
            timeLogHistory.push(newLogEntry);

            const updatedTask = {
                ...task,
                timeLogged: newTime, // Keep current total for backward compatibility
                lastLogDate: todayDate, // Keep for backward compatibility
                timeLogHistory: timeLogHistory
            };

            await updateTask(updatedTask);
            onTaskUpdated(updatedTask);

            // Reset the timer
            setIsTracking(false);
            setStartTime(null);
            setElapsedTime(0);
        } catch (error) {
            console.error("Error logging time:", error);
            alert("Failed to log time. Please try again.");
        }
    };

    /**
     * Utility to format the running timer display as HH:MM:SS.
     */
    const formatElapsedTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    /**
     * Accept or reject a task.
     */
    const handleTaskAcceptance = async () => {
        try {
            if (!user) {
                alert("You must be logged in to accept tasks");
                return;
            }

            // Rejecting a task
            if (task.isAccepted) {
                if (!task.AssignedTo || task.AssignedTo._id !== user._id) {
                    alert("Only the assigned developer can reject this task");
                    return;
                }
                if (task.IsCompleted) {
                    alert("Cannot reject a completed task");
                    return;
                }
                const updatedTask = {
                    ...task,
                    AssignedTo: undefined,
                    isAccepted: false
                };
                await updateTask(updatedTask);
                onTaskUpdated(updatedTask);
                return;
            }

            // Accepting a task
            const updatedTask = {
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

    /**
     * Mark a task as completed or uncompleted.
     */
    const handleTaskCompletion = async () => {
        try {
            // Check if there are still hours to go
            if (task.timeEstimate > 0) {
                if (!confirm("Are you sure you want to complete this task? There are still hours remaining. Setting Hours To Go to 0.")) {
                    return;
                }
            }

            const updatedTask = {
                ...task,
                IsCompleted: !task.IsCompleted,
                timeEstimate: 0 // Set Hours To Go to 0 when completing
            };

            // Add a final time log entry if needed
            if (task.timeEstimate > 0) {
                const newLogEntry = {
                    timeLogged: task.timeLogged,
                    timeEstimate: 0,
                    logDate: new Date().toISOString().split('T')[0],
                    loggedBy: user?._id || ''
                };

                updatedTask.timeLogHistory = [
                    ...(task.timeLogHistory || []),
                    newLogEntry
                ];
            }

            await updateTask(updatedTask);
            onTaskUpdated(updatedTask);
        } catch (error) {
            console.error("Error updating task:", error);
            alert("Failed to complete task. Please try again.");
        }
    };

    /**
     * Delete a task (for allowed users only).
     */
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

    /**
     * Determines the background color based on task status.
     */
    const getStatusColor = () => {
        if (task.IsCompleted) return "bg-green-50 border-green-200";
        if (task.isAccepted) return "bg-blue-50 border-blue-200";
        return "bg-yellow-50 border-yellow-200";
    };

    /**
     * Checks whether the current user can delete a task.
     */
    const canDelete =
        !task.isAccepted &&
        !task.IsCompleted &&
        (isScrumMaster || (task.AssignedTo && task.AssignedTo._id === user?._id));

    return (
        <Card
            className={cn(
                "w-full transition-all hover:shadow-md",
                getStatusColor(),
                task.IsCompleted && "opacity-80"
            )}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                    <div
                        className={cn(
                            "flex-1 font-medium",
                            task.IsCompleted && "line-through text-gray-400"
                        )}
                    >
                        {task.description}
                    </div>
                    <div className="flex items-center gap-2">
                        {task.AssignedTo && (
                            <Badge variant="secondary" className="whitespace-nowrap">
                                {task.AssignedTo.userName}
                            </Badge>
                        )}
                        {!task.isAccepted && task.AssignedTo && (
                            <Badge
                                variant="secondary"
                                className="bg-yellow-100 text-yellow-800 whitespace-nowrap"
                            >
                                Pending Acce..
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="flex gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        Due:{" "}
                        {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString()
                            : "Not set"}
                    </div>
                </div>

                {/* Last log date display if available */}
                {task.lastLogDate && (
                    <div className="mt-1 text-xs text-gray-500">
                        Last time logged: {task.lastLogDate}
                    </div>
                )}

                {task.AssignedTo &&
                    task.AssignedTo._id === user?._id &&
                    task.isAccepted &&
                    !task.IsCompleted && (
                        <div className="mt-4 border-t pt-4">
                            <div className="text-sm font-medium text-gray-700 mb-2">Time Logging</div>
                            
                            {/* Time tracking status and timer */}
                            <div className="flex flex-col gap-2 mb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Clock className="h-4 w-4" />
                                        <span>{task.timeLogged || 0} / {task.timeEstimate || 0}h logged</span>
                                    </div>
                                    {!isTracking ? (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={startTimeTracking}
                                            className="bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center gap-1"
                                        >
                                            <Play className="h-4 w-4" />
                                            Start Timer
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={stopTimeTracking}
                                            className="bg-red-100 text-red-800 hover:bg-red-200 flex items-center gap-1"
                                        >
                                            <StopCircle className="h-4 w-4" />
                                            Stop Timer ({formatElapsedTime(elapsedTime)})
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Manual time logging section */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Hours Done</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={manualDone}
                                            onChange={(e) => setManualDone(e.target.value)}
                                            className="w-full"
                                            placeholder="0.0"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Hours To Go</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={manualToGo}
                                            onChange={(e) => setManualToGo(e.target.value)}
                                            className="w-full"
                                            placeholder="0.0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Log Date</label>
                                    <Input
                                        type="date"
                                        value={logDate}
                                        onChange={(e) => setLogDate(e.target.value)}
                                        className="w-full"
                                    />
                                </div>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleManualTimeLog}
                                    className="w-full bg-blue-100 text-blue-800 hover:bg-blue-200"
                                >
                                    Log Time
                                </Button>
                            </div>
                        </div>
                    )}

                {/* Time log history display */}
                {task.timeLogHistory && task.timeLogHistory.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                        <div className="h-6 text-sm text-gray-600 mb-2">
                            Last logged: {new Date(task.timeLogHistory[task.timeLogHistory.length - 1].logDate).toLocaleDateString()}
                        </div>
                        <div className="space-y-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowLogHistory(!showLogHistory)}
                                className="flex items-center justify-between w-full text-gray-700 hover:bg-gray-50/80 transition-colors duration-200"
                            >
                                <div className="flex items-center gap-1.5">
                                    <History className="h-4 w-4" />
                                    <span className="text-sm">Time Log History</span>
                                </div>
                                <div className={`transform transition-transform duration-200 ${showLogHistory ? 'rotate-180' : ''}`}>
                                    <ChevronDown className="h-4 w-4" />
                                </div>
                            </Button>
                            <div className={`overflow-hidden transition-all duration-200 ease-in-out ${showLogHistory ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="space-y-1 py-2">
                                    {task.timeLogHistory.slice().reverse().map((log, index) => {
                                        const date = new Date(log.logDate);
                                        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
                                        return (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between text-sm text-gray-600 py-1.5 px-2 hover:bg-gray-50 rounded-sm"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-500">{formattedDate}</span>
                                                    <span>{log.timeLogged}h logged</span>
                                                </div>
                                                <span className="text-gray-500">{log.timeEstimate}h remaining</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Right-side controls: Accept/TakeOver/Delete */}
                <div className="flex gap-2 ml-auto">
                    {user && !task.isAccepted && !task.IsCompleted && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleTaskAcceptance}
                            className="border-yellow-200 hover:bg-yellow-50 text-yellow-800"
                        >
                            {task.AssignedTo?._id === user?._id
                                ? "Accept Task"
                                : "Take Over Task"}
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

                {/* Reject and Complete buttons */}
                <div className="flex justify-end gap-2 mt-2">
                    {/* Reject Task button */}
                    {user &&
                        task.isAccepted &&
                        task.AssignedTo &&
                        task.AssignedTo._id === user._id &&
                        !task.IsCompleted && (
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
                                {isTracking ? "Done" : "Complete"}
                            </Button>
                        )}
                </div>
            </CardContent>
        </Card>
    );
}