'use client'

import React, { useState } from 'react'

interface TimeLoggingPopupProps {
    userStoryId: string
    title: string
    onClose: () => void
    onSave: (loggedTime: number) => void
}

export function TimeLoggingPopup({ userStoryId, title, onClose, onSave }: TimeLoggingPopupProps) {
    const [loggedTime, setLoggedTime] = useState<string>('')

    const handleSave = () => {
        const time = parseFloat(loggedTime)
        if (isNaN(time) || time < 0) {
            alert('Please enter a valid time.')
            return
        }
        onSave(time)
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-lg w-96">
                <h2 className="text-xl font-bold mb-4">Log Time for: {title}</h2>
                <div className="mb-4">
                    <label htmlFor="loggedTime" className="block mb-1">
                        Logged Time (in hours)
                    </label>
                    <input
                        id="loggedTime"
                        type="number"
                        step="0.1"
                        min="0"
                        className="w-full border px-2 py-1"
                        value={loggedTime}
                        onChange={(e) => setLoggedTime(e.target.value)}
                    />
                </div>
                <div className="flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-2 border rounded">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">
                        Save
                    </button>
                </div>
            </div>
        </div>
    )
}