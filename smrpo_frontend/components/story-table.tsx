"use client"

import React, { useState } from "react";
import {Droppable } from "@hello-pangea/dnd";
import UserStoryCard from "@/components/userStoryCard";


interface StoryTableProps {
    droppableId: string;
    title: string;
    items: string[];
}

const StoryTable: React.FC<StoryTableProps> = ({ droppableId, title, items }) => {
    return (
        <div className="w-full max-w-xs">
            <h2 className="font-bold text-lg mb-2">{title}</h2>
            <Droppable droppableId={droppableId}>
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="bg-gray-200 p-4 rounded-lg border-2 border-dashed border-gray-400 min-h-[200px] flex flex-col gap-3"
                    >
                        {items.map((item, index) => (
                            <UserStoryCard
                                key={`${droppableId}-item-${index}`}
                                draggableId={`${droppableId}-item-${index}`}
                                index={index}
                                ID={index}
                                text={item}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};

export default StoryTable;