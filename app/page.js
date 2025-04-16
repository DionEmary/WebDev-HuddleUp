"use client";

import { useState, useEffect } from "react";
import { CalendarClock } from "lucide-react";
import { db, auth, provider } from "./_utils/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
} from "firebase/firestore";
import {
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { useRouter } from "next/navigation";

const Home = () => {
  const router = useRouter();

  const [groups, setGroups] = useState([]);
  const [user, setUser] = useState(null);

  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch groups if logged in
  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) return;
      try {
        const groupQuery = query(
          collection(db, "groups"),
          where("members", "array-contains", user.uid)
        );
        const querySnapshot = await getDocs(groupQuery);
        const groupList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGroups(groupList);
      } catch (error) {
        console.error("Error fetching groups:", error);
      }
    };

    fetchGroups();
  }, [user]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Sign-in Error:", error);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  const handleGroupClick = (group) => {
    router.push(`/group/${group.id}`);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    if (!startDate || !endDate) {
      setDateError("Please select both start and end dates.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays > 7 || diffDays < 1) {
      setDateError("Date range must be between 1 and 7 days.");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "groups"), {
        name: newGroupName.trim(),
        uuid: user.uid,
        members: [user.uid],
        startDate,
        endDate,
      });

      setGroups((prev) => [
        ...prev,
        {
          id: docRef.id,
          name: newGroupName.trim(),
          uuid: user.uid,
          members: [user.uid],
          startDate,
          endDate,
        },
      ]);

      // Reset modal
      setNewGroupName("");
      setStartDate("");
      setEndDate("");
      setDateError("");
      setIsCreating(false);
    } catch (err) {
      console.error("Error creating group:", err);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, options);
  };
  
  

  // Login screen if user not signed in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0d1636] text-white">
        <h1 className="text-4xl font-bold mb-6">Welcome to HuddleUp</h1>
        <button
          onClick={handleGoogleSignIn}
          className="bg-white text-black px-6 py-2 rounded-md shadow hover:bg-gray-200 transition"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-[#00071E] text-gray-200 h-[8.33vh] px-4 drop-shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarClock size={36} className="cursor-pointer" />
          <h1 className="text-2xl font-bold tracking-wide">HuddleUp</h1>
        </div>
        <div className="flex items-center gap-3 mr-4">
          <p className="text-sm">{user.displayName}</p>
          <button
            onClick={handleSignOut}
            className="bg-white text-black px-4 py-1.5 rounded-md hover:bg-gray-200"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="flex flex-row h-[91.67vh]">
        <div className="w-1/6 bg-[#0d1636] p-4 overflow-hidden">
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 w-full"
          >
            + Create Group
          </button>
        </div>

        <div className="bg-[#6b7080] w-5/6 overflow-y-auto">
          <h2 className="text-gray-200 mx-6 mt-6 text-2xl font-semibold">
            Your Groups
          </h2>
          <div className="flex flex-wrap m-4">
            {groups.length === 0 ? (
              <p className="text-white m-6">No groups found.</p>
            ) : (
              groups.map((group) => (
                <div
                  key={group.id}
                  className="bg-white p-4 rounded-lg shadow-md m-6 h-40 w-80 cursor-pointer hover:shadow-xl transition"
                  onClick={() => handleGroupClick(group)}
                >
                  <h2 className="text-xl font-semibold text-[#00071E]">
                    {group.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-2">
                    {formatDate(group.startDate)} → {formatDate(group.endDate)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {isCreating && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-semibold mb-4">Create a Group</h3>

            <label className="block text-sm font-medium text-gray-700">
              Group Name
            </label>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full border border-gray-300 px-3 py-2 rounded mb-4"
            />

            <label className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded mb-4"
            />

            <label className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded mb-4"
            />

            {dateError && (
              <p className="text-red-600 text-sm mb-3">{dateError}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewGroupName("");
                  setStartDate("");
                  setEndDate("");
                  setDateError("");
                }}
                className="text-gray-600 hover:underline"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                className="bg-blue-600 text-white px-4 py-2 ml-4 rounded hover:bg-blue-700"
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

export default Home;
