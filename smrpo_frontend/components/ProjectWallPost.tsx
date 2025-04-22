"use client"

import React, {useEffect, useState} from "react";
import {useUser} from "@/lib/hooks/useUser";
import { formatDistanceToNow } from 'date-fns';
import {useProject} from "@/lib/contexts/project-context";

interface ProjectWallPostProps {
    author: string
    text: string
    lastChangeDate: Date
    postId?: string
    userRole?: string
}

const ProjectWallPost: React.FC<ProjectWallPostProps> = ({author, text, lastChangeDate, postId, userRole}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(text);
    const { user } = useUser();
    const { activeProject } = useProject();


    const formattedDate = lastChangeDate ?
        formatDistanceToNow(new Date(lastChangeDate), { addSuffix: true }) :
        'Unknown date';

    const isAuthor = user?.userName === author;

    const activeUser = activeProject?.members.filter(member => member.userId == user?._id)[0]

    const hasSpecialRole = activeUser?.role ==="SCRUM_MASTER" || activeUser?.role === "PRODUCT_OWNER";

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedText(text);
    };

    const handleSave = async () => {
        if (editedText.trim() === '') return;

        try {
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating comment:", error);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this comment?")) {
            try {
            } catch (error) {
                console.error("Error deleting comment:", error);
            }
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow-md w-full mb-4 ${hasSpecialRole ? 'border-2 border-red-500' : ''}`}>
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
                            {author ? author.charAt(0).toUpperCase() : "A"}
                        </div>
                        <span className="ml-2 font-medium">{author || "Anonymous"}</span>
                        {hasSpecialRole && (
                            <span className="ml-2 text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                                {userRole}
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-gray-500">{formattedDate}</span>
                </div>

                {isEditing ? (
                    <div className="mt-2">
                        <textarea
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                            <button
                                onClick={handleCancel}
                                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-gray-700 whitespace-pre-line">{text}</p>

                        {isAuthor && (
                            <div className="mt-3 flex justify-end space-x-2 text-xs">
                                <button
                                    onClick={handleEdit}
                                    className="text-blue-500 hover:text-blue-700"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectWallPost;