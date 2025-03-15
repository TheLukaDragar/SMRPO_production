"use client"
import React, {useCallback, useEffect, useState} from "react";
import {DragDropContext, Droppable, DropResult} from "@hello-pangea/dnd";
import UserStoryCard from "@/components/userStoryCard";
import {UserStory} from "@/lib/types/user-story-types";
import {getAllUserStories, getAllSprints} from "@/lib/actions/user-story-actions";
import StoryTable from "@/components/story-table";
import {sprint} from "@/lib/types/sprint-types";

export default function DNDPage() {
    const [isRefetching, setIsRefetching] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stories, setStories] = useState<UserStory[]>([]);
    const [columns, setColumns] = useState<sprint[]>([]);

    const fetchSprints = useCallback(async () => {
        try {
            setIsRefetching(true);
            const sprints = await getAllSprints();
            setColumns(sprints);
            console.log(sprints);
        } catch (error) {
            console.error("Error fetching sprints:", error);
        } finally {
            setIsRefetching(false);
        }
    }, []);


    const fetchStories = useCallback(async () => {
        try {
            setIsRefetching(true);
            const stories = await getAllUserStories();
            setStories(stories);
        } catch (error) {
            console.error("Error fetching stories:", error);
        } finally {
            setIsRefetching(false);
        }
    }, []);


    useEffect(() => {
        fetchStories()
        fetchSprints()
    }, []);

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const storyIndex = stories.findIndex(story => story._id === result.draggableId);

        if (storyIndex !== -1) {
            const updatedStories = [...stories];

            updatedStories[storyIndex] = {
                ...updatedStories[storyIndex],
                sprintID: result.destination.droppableId
            };

            setStories(updatedStories);
        }
    }

    console.log(columns)

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="p-6 bg-gray-100 min-h-screen">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">Project Planning Board</h1>

                <div className="flex space-x-4 overflow-x-auto pb-4">
                    {columns.map((sprint) => (
                        <StoryTable
                            droppableId={sprint._id}
                            key={sprint._id}
                            title={sprint.sprintName}
                            items={stories.filter(story => story.sprintID === sprint._id)}
                        />
                    ))}
                </div>
            </div>
        </DragDropContext>

    );
}
