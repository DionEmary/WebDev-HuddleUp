"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getCurrentUser } from "@/app/_utils/supabase-auth";
import { 
  fetchGroupDates, 
  submitAvailability, 
  fetchGroupName, 
  fetchAllResponses, 
  inviteUser,
  checkOwner,
  checkMembers,
  getUserFromName,
  removeGroup,
} from "@/app/_utils/group_crud" // All this is used to get, modify and add data used by this page
import findBestTimeSlots from '@/app/components/getBestTime'

const GroupPage = () => {
  // Basic Page Variables (Router to go home, params for the groupId and groupId to store it for supabase functions)
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId;

  const [user, setUser] = useState(null); // Stores our user data (Mainly used to verify they are logged in and to get their UUID for data storage)

  // Stores Page Data used to display data
  const [groupName, setGroupName] = useState(null);
  const [dates, setDates] = useState([]);
  const [bestTimes, setBestTimes] = useState([]);
  const [responses, setResponses] = useState([]);

  // Page State Variables
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true); // When Data is loading this is true to show loading page
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false); // Modal used for Invites
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal used for availability

  // Used to store data input in the modals for invites and availability, aswell as the errors if data is poorly formatted
  const [availability, setAvailability] = useState({});
  const [error, setError] = useState(null);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteError, setInviteError] = useState(null);

  // Fetch user + group dates
  useEffect(() => {
    setLoading(true);
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

        const isOwner = await checkOwner(groupId, user.id);
        setIsOwner(isOwner);

        const bestTimes = findBestTimeSlots(groupResponses);
        setBestTimes(bestTimes);

        setLoading(false);
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
    setError(null);
  
    // Validate times
    for (const [dateID, times] of Object.entries(availability)) {
      const hasStart = !!times.startTime;
      const hasEnd = !!times.endTime;
  
      if ((hasStart && !hasEnd) || (!hasStart && hasEnd)) {
        setError("Both start time and end time must be filled out for each date, or leave both blank.");
        return;
      }
  
      if (hasStart && hasEnd && times.endTime < times.startTime) {
        setError("End time cannot be before start time.");
        return;
      }
    }
  
    // Format all dates (even ones left blank) into entries
    const entries = dates.map((d) => {
      const times = availability[d.dateID] || {};
      return {
        groupID: groupId,
        dateID: d.dateID,
        userID: user.id,
        startTime: times.startTime || null,
        endTime: times.endTime || null,
      };
    });
  
    const success = await submitAvailability(entries);
    if (success) {
      // Re-fetch updated responses and best times
      const updatedResponses = await fetchAllResponses(groupId);
      setResponses(updatedResponses);
  
      const updatedBestTimes = findBestTimeSlots(updatedResponses);
      setBestTimes(updatedBestTimes);
  
      setIsModalOpen(false);
    }
  };

  const handleInvite = async (invitedUser) => {
    if (!user) return; // Prevents issues with errors
    const uuid = await getUserFromName(invitedUser);
    const check = await checkMembers(uuid, groupId);  
    
    if(!check){
      const inviteBool = await inviteUser(invitedUser, user.id, groupId);

      if(inviteBool){
        setIsInviteModalOpen(false);
      } else {
        setInviteError("Invalid Username");
      }
    } else {
      setInviteError("User already in group")
    }
  }

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[+month - 1]} ${+day}, ${year}`;
  };

  const formatTime = (timeString) => { // Formats time from 15:30:00 to 3:30PM as an example
    if (!timeString) return "";
  
    const [hourStr, minuteStr] = timeString.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
  
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12; // converts 0 to 12 for 12 AM
  
    return `${hour}:${minute.toString().padStart(2, "0")} ${ampm}`;
  };
  

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 left-0 right-0 bg-[#00071E] text-gray-200 h-[70px] px-4 drop-shadow-lg flex items-center justify-between z-50">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">{groupName}</h1>
          {isOwner && ( // Only Shows if user is the owner (Code again checks if user is owner just to make sure and to prevent errors)
            <button
              onClick={() => {
                removeGroup(groupId, user.id);
                router.push('/');
              }}
              className="bg-[#2a3350] text-white px-4 py-2 ml-10 rounded hover:bg-blue-600"
            >
              Delete Group
            </button> 
          )}
        </div>
        <div className="flex justify-between w-full sm:w-5/6 md:w-1/2 lg:w-4/10 xl:w-3/10" >
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#2a3350] text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Input Availability
          </button>  
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-[#2a3350] text-white px-4 py-2 rounded hover:bg-blue-600"
          >
           Invite Members
          </button>  
          <button
            onClick={() => router.push("/")}
            className="bg-[#2a3350] text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Back to Home
          </button>          
        </div>

      </header>

      <main className="bg-[#6b7080] flex-1 p-6 text-white mt-[70px]">
        <section>
        <h2 className="text-2xl font-semibold mb-4">Best Time Slots by Date</h2>
        {Object.keys(bestTimes).length === 0 ? (
          <p>No responses yet.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(bestTimes).map(([date, slot], index) => (
              <div
                key={index}
                className="bg-[#3a3f4b] text-white p-4 rounded-xl shadow-md"
              >
                <p className="text-lg font-semibold mb-1">
                  📅 {formatDate(date)}
                </p>

                {slot ? (
                  <div className="text-sm">
                    <p>
                      🕒 <strong>Time:</strong> {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                    </p>
                    <p>
                      👥 <strong>Overlap:</strong>{" "}
                      {slot.overlapType === "everyone"
                        ? "Everyone is available"
                        : `Most people are available (${slot.approxUsers})`}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm italic text-red-300">
                    No Good Availability This Day
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        </section>
        <section className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">User Responses</h2>
        {responses.length === 0 ? (
          <p>No responses submitted yet.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {responses.map((response) => (
              <div
                key={`${response.userID}-${response.dateID}`}
                className="bg-[#4b5366] p-4 rounded-xl shadow-md w-full sm:w-[300px]"
              >
                <p className="font-semibold text-lg">
                  {response.users?.display_name}
                </p>
                <p className="text-sm">
                  📅{" "}
                  {response.group_dates?.date
                    ? formatDate(response.group_dates?.date)
                    : "No date info"}
                  <br />
                  🕒{" "}
                  {response.startTime && response.endTime
                    ? `${formatTime(response.startTime)} – ${formatTime(response.endTime)}`
                    : "No time selected"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#3a3f4b] text-white p-6 rounded-xl shadow-md w-full sm:w-[400px] max-w-lg">
            <h2 className="text-2xl font-semibold mb-4">Set Your Availability</h2>
            <p className="text-sm mb-4">Rounded to the nearest 30 Minute Interval, Leave Blank if unavailable</p>
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
                    className="border border-gray-300 px-2 py-1 rounded w-1/2"
                  />
                  <input
                    type="time"
                    value={availability[d.dateID]?.endTime || ""}
                    onChange={(e) =>
                      handleTimeChange(d.dateID, "endTime", e.target.value)
                    }
                    className="border border-gray-300 px-2 py-1 rounded w-1/2"
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
                className="bg-[#646a7e] text-white px-4 py-2 rounded hover:bg-[#494e5f]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="bg-[#35436e] text-white px-4 py-2 rounded hover:bg-[#404861]"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {isInviteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#3a3f4b] text-white p-6 rounded-xl shadow-md w-full sm:w-[400px] max-w-lg">
            <h3 className="text-2xl font-semibold mb-4">Invite a User</h3>

            <input
              type="text"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              placeholder="Enter Username"
              className="w-full border border-gray-300 px-3 py-2 rounded mb-4 bg-[#444857]"
            />

            {inviteError && (
              <p className="text-red-600 text-sm mb-3">{inviteError}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setInviteUsername("");
                }}
                className="bg-[#444857] text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleInvite(inviteUsername)}
                className="bg-[#2a3350] text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupPage;
