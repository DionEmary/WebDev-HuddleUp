"use client";

import { useState, useEffect } from "react";
import { CalendarClock } from "lucide-react";
import { db, auth, provider } from "./_utils/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  const [groups, setGroups] = useState([]);
  const [user, setUser] = useState(null);

  // Check auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch groups when signed in
  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) return;
      try {
        const groupRef = collection(db, "groups");

        // Query to get groups where the user is either the creator or a member
        const groupQuery = query(
          groupRef,
          where("members", "array-contains", user.uid) // Check if the user's UID is in the members array
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
    console.log("router.push:", router.push);
    router.push(`/group/${group.id}`);
  };

  // If not signed in, show login
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

  // Main signed-in UI
  return (
    <div className="flex flex-col h-screen">
      <header className="bg-[#00071E] text-gray-200 h-[8.33vh] px-4 drop-shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarClock size={36} className="cursor-pointer" />
          <h1 className="text-2xl font-bold tracking-wide">HuddleUp</h1>
        </div>
        <button
          onClick={handleSignOut}
          className="bg-white text-black px-4 py-1.5 rounded-md mr-4 hover:bg-gray-200"
        >
          Sign Out
        </button>
      </header>

      <main className="flex flex-row h-[91.67vh]">
        <div className="w-1/6 bg-[#0d1636] p-4 overflow-hidden">
          <p className="text-white text-sm">Welcome, {user.displayName}</p>
        </div>

        <div className="bg-[#6b7080] w-5/6 overflow-y-auto">
          <h2 className="text-gray-200 mx-6 mt-6 text-2xl font-semibold">Recent Groups</h2>
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
                  <h2 className="text-xl font-semibold text-[#00071E]">{group.name}</h2>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
