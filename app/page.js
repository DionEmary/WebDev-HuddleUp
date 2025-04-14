"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock } from 'lucide-react';

const Home = () => {
  // Mock group data
  const [groups] = useState([
    { id: "1", name: "Weekend Hike", created: "2025-04-01", creator: "Jay" },
    { id: "2", name: "Study Group", created: "2025-04-05", creator: "John"},
    { id: "3", name: "Birthday Planning", created: "2025-04-08", creator: "Josh" },
  ]);

  const handleCreateGroup = () => {
    alert("Create Group clicked!");
  };

  return (
    <div className="flex flex-col h-screen">
    {/* Header - Fixed Height */}
    <header className="bg-[#00071E] text-gray-200 h-[8.33vh] px-4 drop-shadow-lg">
      <div className="flex content-baseline gap-3">
        <CalendarClock size={36} className="cursor-pointer mt-4.5" />
        <h1 className="text-2xl font-bold tracking-wide mt-5">HuddleUp</h1>
      </div>
    </header>

    {/* Main layout: sidebar + content */}
    <main className="flex flex-row h-[91.67vh]">
      {/* Sidebar - Fixed */}
      <div className="w-1/6 bg-[#0d1636] p-4 overflow-hidden">
        {/* Sidebar content here */}
      </div>

      {/* Scrollable content area */}
      <div className="bg-[#6b7080] w-5/6 overflow-y-auto">
        <h2 className="text-gray-200 mx-6 mt-6 text-2xl font-semibold">Recent Groups</h2>
        <div className="flex flex-wrap m-4">
          {groups.map(group => (
            <div key={group.id} className="bg-white p-4 rounded-lg shadow-md m-6 h-40 w-80">
              <h2 className="text-xl font-semibold text-[#00071E]">{group.name}</h2>
              <p className="text-sm text-gray-600">Created by: {group.creator}</p>
              <p className="text-sm text-gray-500">Date: {group.created}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  </div>
  );
};

export default Home;
