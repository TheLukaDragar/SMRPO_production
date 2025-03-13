"use client";

import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import {UserStory} from "@/lib/types/user-story-types";

interface UserStoryCardProps {
    ID: number;
    draggableId: string;
    index: number;
    storyData: UserStory;
}

const UserStoryCard: React.FC<UserStoryCardProps> = ({ ID, draggableId, index, storyData }) => {
    return (
        <Draggable key={ID} draggableId={draggableId} index={index}>
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="w-full max-w-md bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300 p-4 my-2"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-800">{storyData.title}</h3>
                        <span
                            className={`text-sm px-2 py-1 rounded-full ${storyData.priority === 'High' ? 'bg-red-500 text-white' : storyData.priority === 'Medium' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'}`}
                        >
                            {storyData.priority}
                        </span>
                    </div>

                    <p className="text-gray-600 mb-4">{storyData.description}</p>

                    <div className="text-sm text-gray-500">
                        <p><strong>Owner:</strong> {storyData.owner.userName} ({storyData.owner.email})</p>
                        <p><strong>Story Points:</strong> {storyData.storyPoints}</p>
                        <p><strong>Due Date:</strong> {new Date(storyData.dueDate).toLocaleDateString()}</p>
                        <p><strong>Sprint:</strong> {storyData.sprintID}</p>
                        <p><strong>Sprint Position:</strong> {storyData.SprintPosition}</p>
                        <p><strong>Created At:</strong> {new Date(storyData.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default UserStoryCard;
