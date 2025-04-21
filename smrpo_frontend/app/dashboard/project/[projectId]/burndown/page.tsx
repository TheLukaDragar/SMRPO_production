//// filepath: c:\Users\user\Documents\GitHub\Faks FRI\SMRPO\SMRPO\smrpo_frontend\app\dashboard\project\[projectId]\burndown\page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

// Register the components with Chart.js
Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

import { getAllUserStories, getAllSprints, getTasks } from "@/lib/actions/user-story-actions";
import { Line } from "react-chartjs-2";
import { useParams } from "next/navigation";
import { sprint } from "@/lib/types/sprint-types";
import { UserStory } from "@/lib/types/user-story-types";
import { tasks, TimeLogEntry } from "@/lib/types/tasks";

export default function BurndownPage() {
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const projectId = params.projectId as string;

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        // Get all sprints and filter for the active one in this project
        const allSprints = await getAllSprints();
        const activeSprint = allSprints.find(
          (sprint: sprint) => sprint.isActive && sprint.projectId === projectId
        );

        if (!activeSprint) {
          console.error("No active sprint found");
          setIsLoading(false);
          return;
        }

        // Get all user stories for this sprint
        const allStories = await getAllUserStories();
        const sprintStories = allStories.filter(
          (story: UserStory) => story.sprintID === activeSprint._id
        );

        if (!sprintStories.length) {
          console.error("No stories found for this sprint");
          setIsLoading(false);
          return;
        }

        // Get all tasks to access their time logging history
        const allTasks = await getTasks();
        
        // Filter tasks that belong to our sprint stories
        const storyIds = sprintStories.map((story: UserStory) => story._id);
        const sprintTasks = allTasks.filter((task: tasks) => 
          storyIds.includes(task.userStoryId)
        );

        // Generate dates for the sprint duration
        const startDate = new Date(activeSprint.startDate || new Date());
        const endDate = new Date(activeSprint.endDate || new Date());
        const today = new Date();

        // Calculate number of days in sprint
        const sprintDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysElapsed = Math.max(0, Math.min(sprintDuration, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))));

        // Generate all dates within the sprint for the x-axis
        const dates: string[] = [];
        const dateMap = new Map<string, number>(); // Map to track position of each date in the array
        
        // Create an array of all dates in the sprint and a lookup map
        const currentDate = new Date(startDate);
        for (let i = 0; i <= sprintDuration; i++) {
          const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          dates.push(dateStr);
          dateMap.set(dateStr, i);
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Calculate ideal burndown (linear decrease from total to 0)
        // Sum initial estimates from all tasks
        const initialEstimate = sprintTasks.reduce(
          (total: number, task: tasks) => total + (task.timeEstimate || 0), 0
        );
        
        const idealBurndown = dates.map((_, index) => 
          initialEstimate * (1 - (index / sprintDuration))
        );

        // For actual burndown, we need to process all time log entries chronologically
        const timeLogsData: {
          date: string;
          hoursLogged: number;
          remainingEstimate: number;
        }[] = [];

        // Process all tasks with time log history
        sprintTasks.forEach((task: tasks) => {
          // Use the timeLogHistory if available, otherwise use the legacy fields
          if (task.timeLogHistory && task.timeLogHistory.length > 0) {
            task.timeLogHistory.forEach((logEntry: TimeLogEntry) => {
              timeLogsData.push({
                date: logEntry.logDate,
                hoursLogged: logEntry.timeLogged,
                remainingEstimate: logEntry.timeEstimate
              });
            });
          } else if (task.lastLogDate) {
            // Handle legacy data without timeLogHistory
            timeLogsData.push({
              date: task.lastLogDate,
              hoursLogged: task.timeLogged,
              remainingEstimate: task.timeEstimate
            });
          }
        });

        // Sort time logs by date
        timeLogsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Initialize arrays for our actual data points
        const hoursLoggedByDate = new Array(dates.length).fill(0);
        const remainingEstimateByDate = new Array(dates.length).fill(initialEstimate);

        // Process the time logs to build our data points
        let cumulativeHoursLogged = 0;
        let latestRemainingEstimate = initialEstimate;

        timeLogsData.forEach(logEntry => {
          const dateKey = logEntry.date.split('T')[0]; // Ensure we have YYYY-MM-DD format
          const dateIndex = dateMap.get(dateKey);
          
          if (dateIndex !== undefined && dateIndex < dates.length) {
            // Add this entry's hours to our cumulative total
            cumulativeHoursLogged += logEntry.hoursLogged;
            
            // Update the remaining estimate
            latestRemainingEstimate = logEntry.remainingEstimate;
            
            // Update our data arrays at this date index
            hoursLoggedByDate[dateIndex] = cumulativeHoursLogged;
            remainingEstimateByDate[dateIndex] = latestRemainingEstimate;
            
            // Also update all future dates to reflect this latest data
            for (let i = dateIndex + 1; i < dates.length; i++) {
              if (hoursLoggedByDate[i] < cumulativeHoursLogged) {
                hoursLoggedByDate[i] = cumulativeHoursLogged;
              }
              if (remainingEstimateByDate[i] > latestRemainingEstimate) {
                remainingEstimateByDate[i] = latestRemainingEstimate;
              }
            }
          }
        });

        // Format dates for display
        const formattedDates = dates.map(dateStr => {
          const date = new Date(dateStr);
          return date.toLocaleDateString();
        });

        // Set chart data
        setChartData({
          labels: formattedDates,
          datasets: [
            {
              label: "Ideal Burndown",
              data: idealBurndown,
              borderColor: "blue",
              backgroundColor: "transparent",
              borderWidth: 2,
              pointRadius: 3,
              tension: 0.1,
            },
            {
              label: "Hours Logged (Actual)",
              data: hoursLoggedByDate,
              borderColor: "green",
              backgroundColor: "transparent",
              borderWidth: 2,
              pointRadius: 4,
              tension: 0.1,
            },
            {
              label: "Hours Remaining (Actual)",
              data: remainingEstimateByDate,
              borderColor: "red",
              backgroundColor: "transparent",
              borderWidth: 2,
              pointRadius: 4,
              tension: 0.1,
            }
          ]
        });
      } catch (error) {
        console.error("Error fetching data for burndown chart:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [projectId]);

  if (isLoading || !chartData) return <div className="py-8 text-center">Loading burndown chart...</div>;

  const options = {
    responsive: true,
    scales: {
      y: {
        title: {
          display: true,
          text: 'Hours of Work',
        },
        beginAtZero: true,
      },
      x: {
        title: {
          display: true,
          text: 'Sprint Timeline',
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => `Date: ${context[0].label}`,
          label: (context: any) => `${context.dataset.label}: ${Math.round(context.parsed.y * 10) / 10} hours`,
        }
      }
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Sprint Burndown Chart</h1>
      <div className="bg-white p-4 rounded-lg shadow">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}