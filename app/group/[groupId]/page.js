"use client";

import React, { useEffect, useState } from "react";
import { db, auth } from "../../_utils/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

export default function GroupPage({ params }) {
  const router = useRouter();
  const { groupId } = React.use(params);

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [availability, setAvailability] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const docRef = doc(db, "groups", groupId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGroup(docSnap.data());
        } else {
          console.log("No such group!");
        }
      } catch (error) {
        console.error("Error fetching group data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) fetchGroup();
  }, [groupId]);

  const getDatesInRange = (start, end) => {
    const dates = [];
    let current = new Date(start);
    while (current <= new Date(end)) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const handleTimeChange = (dateStr, field, value) => {
    setAvailability((prev) => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!user) return alert("You must be signed in");
  
    try {
      const promises = Object.entries(availability).map(async ([date, { startTime, endTime }]) => {
        // Creating the correct reference path to store user availability
        const dayRef = doc(db, "groups", groupId, "responses", user.uid, date);
  
        // Only write availability data when there's data to save
        await setDoc(dayRef, {
          startTime,
          endTime
        });
      });
  
      await Promise.all(promises);
      alert("Availability saved!");
    } catch (error) {
      console.error("Error saving availability:", error);
      alert("Failed to save availability.");
    }
  };  
  

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#1E1E1E]">
        <p className="text-white text-lg">Loading...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#1E1E1E]">
        <p className="text-white text-lg">No group found</p>
      </div>
    );
  }

  const dates =
    group.startDate && group.endDate
      ? getDatesInRange(group.startDate, group.endDate)
      : [];

  return (
    <div className="min-h-screen bg-[#F1F1F1] p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold text-[#00071E] mb-4">Group: {groupId}</h1>
        <p className="text-lg text-gray-800 mb-2">Created by: {group.uuid}</p>

        {dates.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Your Availability</h2>
            <form className="space-y-4">
              {dates.map((date) => {
                const dateStr = date.toISOString().split("T")[0];
                return (
                  <div key={dateStr} className="bg-gray-100 p-4 rounded-md">
                    <p className="font-semibold mb-2">{date.toDateString()}</p>
                    <div className="flex items-center gap-4">
                      <label className="text-sm">
                        Start Time:
                        <input
                          type="time"
                          step="900" // 15 minutes
                          value={availability[dateStr]?.startTime || ""}
                          onChange={(e) => handleTimeChange(dateStr, "startTime", e.target.value)}
                          className="p-2 border rounded"
                        />
                      </label>
                      <label className="text-sm">
                        End Time:
                        <input
                          type="time"
                          step="900"
                          value={availability[dateStr]?.endTime || ""}
                          onChange={(e) => handleTimeChange(dateStr, "endTime", e.target.value)}
                          className="p-2 border rounded"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-[#4C6A92] text-white py-2 px-6 rounded-md hover:bg-[#36517B] transition"
              >
                Save Availability
              </button>
            </form>
          </div>
        )}

        <div className="mt-6">
          <button
            className="bg-[#1c1e20] text-white py-2 px-6 rounded-md hover:bg-[#36517B] transition"
            onClick={() => router.push("/")}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
