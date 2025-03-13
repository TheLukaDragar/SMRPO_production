"use client"
import React, {useCallback, useEffect, useState} from "react";
import {DragDropContext, Droppable} from "@hello-pangea/dnd";
import UserStoryCard from "@/components/userStoryCard";
import {UserStory} from "@/lib/types/user-story-types";
import {getAllUserStories} from "@/lib/actions/user-story-actions";

export default function DNDPage() {
    const [isRefetching, setIsRefetching] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stories, setStories] = useState<UserStory[]>([]);

    const fetchStories = useCallback(async () => {
        try {
            setIsRefetching(true);
            const userData = await getAllUserStories();
            setStories(userData);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsRefetching(false);
        }
    }, []);

    useEffect(() => {
        fetchStories()
    }, []);

    const handleDragEnd = () => {
        return 0
    }

    console.log(stories)

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="stories" type="STORY">
                {(provided) => (
                    <div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                    >
                        {stories.map((story, index) => (
                            <UserStoryCard
                                ID={index}
                                draggableId={story._id.toString()}
                                key={story._id.toString()}
                                index={index}
                                storyData={story}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>

    );
}
