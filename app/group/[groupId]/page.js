"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getCurrentUser } from "@/app/_utils/supabase-auth";
import { fetchGroupDates, submitAvailability, fetchGroupName, fetchAllResponses } from "@/app/_utils/group_crud"

const GroupPage = () => {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId;
  const [groupName, setGroupName] = useState(null);

  const [dates, setDates] = useState([]);
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availability, setAvailability] = useState({});
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState(null);

  // Fetch user + group dates
  useEffect(() => {
    const fetchData = async () => {
        const user = await getCurrentUser();
        if (!user) return;
        setUser(user);
  
        const groupDates = await fetchGroupDates(groupId);
        setDates(groupDates);

        const groupName = await fetchGroupName(groupId);
        setGroupName(groupName);

        const groupResponses = await fetchAllResponses(groupId);
        setResponses(groupResponses);
    };
  
    fetchData();
  }, [groupId]);

  const roundToNearest30Minutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    const roundedMinutes = Math.round(minutes / 30) * 30;
    const roundedHours = roundedMinutes === 60 ? hours + 1 : hours;
    return `${String(roundedHours).padStart(2, "0")}:${String(roundedMinutes % 60).padStart(2, "0")}`;
  };

  const handleTimeChange = (dateID, field, value) => {
    if (value === "") {
      value = null;
    } else {
      value = roundToNearest30Minutes(value);
    }
  
    // Takes the previous array, and adds the dateID and start or end date depending which input called. 
    setAvailability((prev) => ({
      ...prev,
      [dateID]: {
        ...prev[dateID],
        [field]: value,
      },
    }));
  };
  

  const handleSubmit = async () => {
    if (!user) return;
  
    // Reset any existing error
    setError(null);
  
    // Check for incomplete time entries or invalid time range
    for (const [dateID, times] of Object.entries(availability)) {
      if ((times.startTime && !times.endTime) || (!times.startTime && times.endTime)) {
        setError("Both start time and end time must be filled out for each date.");
        return;
      }
  
      if (times.startTime && times.endTime && times.endTime < times.startTime) {
        setError("End time cannot be before start time.");
        return;
      }
    }
  
    // Takes the availability array and formats it to be inserted into responses
    const entries = Object.entries(availability)
      .filter(([_, v]) => v.startTime && v.endTime)
      .map(([dateID, times]) => ({
        groupID: groupId,
        dateID: parseInt(dateID),
        userID: user.id,
        startTime: times.startTime,
        endTime: times.endTime,
      }));
  
    const success = await submitAvailability(entries);
    if (success) {
      console.log("Availability submitted!");
      setIsModalOpen(false);
    }
  };

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[+month - 1]} ${+day}, ${year}`;
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-[#00071E] text-gray-200 h-[8.33vh] px-4 drop-shadow-lg flex items-center justify-between">
        <h1 className="text-2xl font-bold">{groupName}</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Input Availability
        </button>
      </header>

      <main className="bg-[#6b7080] flex-1 p-6 text-white">
        <p className="text-lg mb-4">Available Dates:</p>
        <ul className="list-disc pl-6">
          {dates.map((d) => (
            <li
              key={d.dateID}
              className=" text-white"
            >
              {formatDate(d.date)}
            </li>
          ))}
        </ul>

        <p className="text-lg mt-8 mb-2">Submitted Responses:</p>
        {responses.length === 0 ? (
        <p>No responses yet.</p>
        ) : (
        <ul className="list-disc pl-6">
            {responses.map((r, index) => (
            <li key={index} className="mb-2">
                <strong>User:</strong> {r.userID}<br />
                <strong>Date:</strong> {r.group_dates?.date ? formatDate(r.group_dates.date) : "No date found"}<br />
                <strong>Start:</strong> {r.startTime}<br />
                <strong>End:</strong> {r.endTime}
            </li>
            ))}
        </ul>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-20 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Set Your Availability</h2>
            <p>Rounded to the nearest 30 Minute Interval, Leave Blank if unavailable</p>
            {dates.map((d) => (
              <div key={d.dateID} className="mb-4">
                <label className="block font-medium mb-1">{formatDate(d.date)}</label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={availability[d.dateID]?.startTime || ""}
                    onChange={(e) =>
                      handleTimeChange(d.dateID, "startTime", e.target.value)
                    }
                    className="border px-2 py-1 rounded w-1/2"
                  />
                  <input
                    type="time"
                    value={availability[d.dateID]?.endTime || ""}
                    onChange={(e) =>
                      handleTimeChange(d.dateID, "endTime", e.target.value)
                    }
                    className="border px-2 py-1 rounded w-1/2"
                  />
                </div>
              </div>
            ))}
            {error && <p className="text-red-500">{error}</p>} {/* Show error message */}
            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={() => {
                    setError(null);
                    setIsModalOpen(false);
                }}
                className="text-gray-600 hover:underline"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupPage;
