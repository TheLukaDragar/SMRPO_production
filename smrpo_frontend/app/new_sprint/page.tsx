'use client';
import React, { useState } from 'react';

export default function SprintForm() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [speed, setSpeed] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: Add your submission logic here
    console.log({ startDate, endDate, speed });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Start Date:
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </label>
      <br />
      <label>
        End Date:
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </label>
      <br />
      <label>
        Speed:
        <input
          type="number"
          value={speed}
          onChange={(e) => setSpeed(e.target.value)}
        />
      </label>
      <br />
      <button type="submit">Create Sprint</button>
    </form>
  );
}