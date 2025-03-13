"use client"

import React, { useState } from "react";
import {Droppable } from "@hello-pangea/dnd";
import UserStoryCard from "@/components/userStoryCard";
import { UserStory } from "@/lib/types/user-story-types";


interface StoryTableProps {
    droppableId: string;
    title: string;
    items: UserStory[];
}

const StoryTable: React.FC<StoryTableProps> = ({ droppableId, title, items }) => {
    return (
        <div className="bg-white rounded-lg shadow-md w-80 flex-shrink-0">
            <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <h2 className="font-bold text-lg text-gray-700">{title}</h2>
                <div className="text-sm text-gray-500 mt-1">{items.length} stories</div>
            </div>

            <Droppable droppableId={droppableId}>
                {provided => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="p-3 min-h-64 max-h-screen overflow-y-auto"
                    >
                        {items.map((story_data, index) => (
                            <UserStoryCard
                                key={story_data._id}
                                ID={story_data._id}
                                draggableId={story_data._id}
                                index={index}
                                storyData={story_data}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>

            <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                <button className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center justify-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add Story
                </button>
            </div>
        </div>
    );
};

export default StoryTable;