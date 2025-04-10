"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from 'lucide-react';

const Home = () => {
  // Mock group data
  const [groups] = useState([
    { id: "1", name: "Weekend Hike", created: "2025-04-01" },
    { id: "2", name: "Study Group", created: "2025-04-05" },
    { id: "3", name: "Birthday Planning", created: "2025-04-08" },
  ]);

  const handleCreateGroup = () => {
    alert("Create Group clicked!");
  };

  return (
    <div>
      <header>
        <Menu />
        <div>Huddle Up</div>
      </header>
      <main>
      </main>
    </div>
  );
};

export default Home;
