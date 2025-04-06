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

import { getAllUserStories } from "@/lib/actions/user-story-actions";
import { Line } from "react-chartjs-2";

export default function BurndownPage() {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const stories = await getAllUserStories();
      const labels = stories.map((_: any, index: number) => `Story ${index + 1}`);
      const data = stories.map((story: any) => story.loggedTime || 0);

      setChartData({
        labels,
        datasets: [
          {
            label: "Logged Time",
            data,
            borderColor: "red",
            fill: false
          }
        ]
      });
    }
    fetchData();
  }, []);

  if (!chartData) return <div>Loading burndown...</div>;

  return (
    <div>
      <h1>Burndown</h1>
      <Line data={chartData} />
    </div>
  );
}