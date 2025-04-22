"use client"
import React, { useCallback, useEffect, useState } from "react";
import { useProject } from "@/lib/contexts/project-context";
import { sprint } from "@/lib/types/sprint-types";
import { getAllSprints, updateSprint, deleteSprint } from "@/lib/actions/user-story-actions";
import { format } from "date-fns";

export default function SprintsManagementPage() {
    const [isRefetching, setIsRefetching] = useState(false);
    const [allSprints, setAllSprints] = useState<sprint[]>([]);
    const [editingSprint, setEditingSprint] = useState<sprint | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const { activeProject } = useProject();

    // Fetch all sprints for the active project
    const fetchSprints = useCallback(async () => {
        if (!activeProject?._id) return;

        try {
            setIsRefetching(true);
            const sprints = await getAllSprints();
            const projectSprints = sprints.filter(
                (sprint: sprint) => sprint.projectId === activeProject?._id
            );
            setAllSprints(projectSprints);
        } catch (error) {
            console.error("Error fetching sprints:", error);
        } finally {
            setIsRefetching(false);
        }
    }, [activeProject]);

    useEffect(() => {
        fetchSprints();
    }, [fetchSprints]);

    // Start editing a sprint
    const handleEditSprint = (sprint: sprint) => {
        setEditingSprint({
            ...sprint,
            startDate: sprint.startDate ? new Date(sprint.startDate) : undefined,
            endDate: sprint.endDate ? new Date(sprint.endDate) : undefined
        });
        setValidationErrors({});
    };

    // Cancel editing
    const handleCancelEdit = () => {
        setEditingSprint(null);
        setValidationErrors({});
    };

    // Handle changes to the editing sprint
    const handleSprintChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setEditingSprint(prev => {
            if (!prev) return null;

            if (name === 'velocity') {
                return { ...prev, [name]: Number(value) };
            }

            if (name === 'startDate' || name === 'endDate') {
                return { ...prev, [name]: value ? new Date(value) : undefined };
            }

            return { ...prev, [name]: value };
        });
    };

    // Validate sprint dates
    const validateSprint = (sprint: sprint): Record<string, string> => {
        const errors: Record<string, string> = {};
        const startDate = sprint.startDate || new Date();
        const endDate = sprint.endDate || new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if end date is before start date
        if (endDate < startDate) {
            errors.endDate = "End date cannot be before the start date";
        }

        // Check if start date is in the past
        if (startDate < today) {
            errors.startDate = "Start date cannot be in the past";
        }

        // Check for overlap with other sprints
        const otherSprints = allSprints.filter(s => s._id !== sprint._id);

        for (const otherSprint of otherSprints) {
            const otherStart = new Date(otherSprint.startDate ?? '');
            const otherEnd = new Date(otherSprint.endDate ?? '');

            // Check for overlap
            if (
                (startDate <= otherEnd && endDate >= otherStart) ||
                (otherStart <= endDate && otherEnd >= startDate)
            ) {
                errors.date = `Sprint dates overlap with ${otherSprint.sprintName}`;
                break;
            }
        }

        // Validate velocity
        if (!sprint.velocity || sprint.velocity <= 0) {
            errors.velocity = "Velocity must be a positive number";
        }

        return errors;
    };

    // Save changes to a sprint
    const handleSaveSprint = async () => {
        if (!editingSprint) return;

        const errors = validateSprint(editingSprint);

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        try {
            await updateSprint(editingSprint);
            setEditingSprint(null);
            fetchSprints();
        } catch (error) {
            console.error("Error updating sprint:", error);
        }
    };

    // Delete a sprint
    const handleDeleteSprint = async (sprintId: string) => {
        if (confirm("Are you sure you want to delete this sprint?")) {
            try {
                await deleteSprint(sprintId);
                fetchSprints();
            } catch (error) {
                console.error("Error deleting sprint:", error);
            }
        }
    };

    // Check if a sprint has already started
    const hasSprintStarted = (sprint: sprint): boolean => {
        if (!sprint.startDate) return false;
        const startDate = sprint.startDate;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return startDate <= today;
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Sprint Management</h1>

            {isRefetching ? (
                <div className="flex justify-center">
                    <p className="text-gray-600">Loading sprints...</p>
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sprint Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Start Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                End Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Velocity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {allSprints.map((sprint) => (
                            <tr key={sprint._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {sprint.sprintName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {sprint.startDate ? format(new Date(sprint.startDate), 'dd/MM/yyyy') : 'Not set'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {sprint.endDate ? format(new Date(sprint.endDate), 'dd/MM/yyyy') : 'Not set'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {sprint.velocity || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {hasSprintStarted(sprint)
                                        ? <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Started</span>
                                        : <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Not Started</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {!hasSprintStarted(sprint) && (
                                        <>
                                            <button
                                                onClick={() => handleEditSprint(sprint)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSprint(sprint._id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                    {hasSprintStarted(sprint) && (
                                        <span className="text-gray-400">Cannot modify</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {allSprints.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No sprints found for this project
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Sprint Modal */}
            {editingSprint && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-4">Edit Sprint</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sprint Name
                            </label>
                            <input
                                type="text"
                                name="sprintName"
                                value={editingSprint.sprintName}
                                onChange={handleSprintChange}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                name="startDate"
                                value={editingSprint.startDate ? new Date(editingSprint.startDate).toISOString().split('T')[0] : ''}
                                onChange={handleSprintChange}
                                className={`w-full p-2 border rounded ${validationErrors.startDate || validationErrors.date ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {validationErrors.startDate && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.startDate}</p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                name="endDate"
                                value={editingSprint.endDate ? new Date(editingSprint.endDate).toISOString().split('T')[0] : ''}
                                onChange={handleSprintChange}
                                className={`w-full p-2 border rounded ${validationErrors.endDate || validationErrors.date ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {validationErrors.endDate && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.endDate}</p>
                            )}
                        </div>

                        {validationErrors.date && (
                            <p className="text-red-500 text-xs mb-4">{validationErrors.date}</p>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Velocity (Story Points)
                            </label>
                            <input
                                type="number"
                                name="velocity"
                                value={editingSprint.velocity || 0}
                                onChange={handleSprintChange}
                                className={`w-full p-2 border rounded ${validationErrors.velocity ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {validationErrors.velocity && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.velocity}</p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleCancelEdit}
                                className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveSprint}
                                className="px-4 py-2 bg-indigo-600 border border-transparent rounded text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}