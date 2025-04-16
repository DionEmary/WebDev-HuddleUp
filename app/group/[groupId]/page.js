"use client";

import React, { useEffect, useState } from "react";
import { db } from "../../_utils/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function GroupPage({ params }) {
  const router = useRouter();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  // Unwrap params using React.use
  const { groupId } = React.use(params);

  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true);
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

    if (groupId) {
      fetchGroup();
    }
  }, [groupId]);

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

  return (
    <div className="min-h-screen bg-[#F1F1F1] p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold text-[#00071E] mb-4">Group: {groupId}</h1>
        <div className="border-b border-gray-300 mb-6"></div>
        <p className="text-lg text-gray-800">Created by: {group.uuid}</p>
        <div className="mt-6">
          <button className="bg-[#4C6A92] text-white py-2 px-6 rounded-md hover:bg-[#36517B] transition">
            Manage Group
          </button>
          <button
            className="bg-[#1c1e20] text-white py-2 px-6 ml-4 rounded-md hover:bg-[#36517B] transition"
            onClick={() => router.push('/')}
          >
            Back
          </button>

        </div>
      </div>
    </div>
  );
}
