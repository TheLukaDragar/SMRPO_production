"use client"
import React, { useState } from 'react';
import { sprint } from '@/lib/types/sprint-types';

interface AddSprintModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (startDate: Date, endDate: Date, velocity: number, name: string) => void;
    existingSprints: sprint[];
}

const AddSprintModal: React.FC<AddSprintModalProps> = ({ isOpen, onClose, onAdd, existingSprints }) => {
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [velocity, setVelocity] = useState<string>('');
    const [sprintName, setSprintName] = useState<string>('Sprint: '+ existingSprints.length.toString());
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const validateForm = (): boolean => {
        setError(null);

        console.log("ext spr", existingSprints);


        const start = new Date(startDate);
        const end = new Date(endDate);
        const currentDate = new Date();

        const startDay = start.getDay()
        const endDay = end.getDay()

        if (startDay == 5 || startDay == 6 || endDay == 5 || endDay == 6 ) {
            setError("Dates cannot be on weekends");
            return false;
        }

        // Validate start date
        if (start < new Date(currentDate.setHours(0, 0, 0, 0))) {
            setError("Start date cannot be in the past");
            return false;
        }

        // Validate end date
        if (end <= start) {
            setError("End date must be after start date");
            return false;
        }

        // Validate velocity
        const velocityNum = parseFloat(velocity);
        if (isNaN(velocityNum) || velocityNum <= 0) {
            setError("Velocity must be a positive number");
            return false;
        }

        //overlap with existing sprints
        const hasOverlap = existingSprints.some(sprint => {
            if (sprint.startDate && sprint.endDate) {
                const sprintStart = new Date(sprint.startDate);
                const sprintEnd = new Date(sprint.endDate);

                // Check if dates overlap
                return (
                    (start <= sprintEnd && start >= sprintStart) ||
                    (end <= sprintEnd && end >= sprintStart) ||
                    (start <= sprintStart && end >= sprintEnd)
                );
            }
            return false;
        });


        if (hasOverlap) {
            setError("New sprint overlaps with an existing sprint");
            return false;
        }

        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            onAdd(
                new Date(startDate),
                new Date(endDate),
                parseFloat(velocity),
                sprintName
            );
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Add New Sprint</h2>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Sprint Name</label>
                        <input
                            type="text"
                            value={sprintName}
                            onChange={(e) => setSprintName(e.target.value)}
                            className="w-full p-2 border rounded"
                            placeholder="Sprint name"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Expected Velocity (in story points)</label>
                        <input
                            type="number"
                            value={velocity}
                            onChange={(e) => setVelocity(e.target.value)}
                            className="w-full p-2 border rounded"
                            min="0.1"
                            step="0.1"
                            required
                        />
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded"
                        >
                            Add Sprint
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSprintModal;