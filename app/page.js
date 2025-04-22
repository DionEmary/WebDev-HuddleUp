'use client';

import { useEffect, useState } from 'react';
import { signInWithGoogle, signOut, getCurrentUser } from '@/app/_utils/supabase-auth';
import { useRouter } from 'next/navigation';
import { CalendarClock } from 'lucide-react';
import { 
  fetchUserGroups, 
  handleCreateGroup,
  checkUserExists,
  addNewUser,
  getDisplayName,
  fetchInvites,
  inviteResponce,
  getUsername
} from '@/app/_utils/group_crud'; // All this is used to get, modify and add data used by this page

const Home = () => {
  const router = useRouter(); // Used to route to other pages

  // Gets currentUser and display name for auth and displaying their name
  const [currentUser, setCurrentUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");

  // Stores Groups and Invites to be displayed
  const [groups, setGroups] = useState([]);
  const [invites, setInvites] = useState([]);

  // Used to store if user is creating group and all the data that is used during that, or errors that result of it
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");

  // Used to let the user input their display name and user name. This is only used when they first log in if they dont already have these in the database
  const [showDisplayNamePrompt, setShowDisplayNamePrompt] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [usernameInput, setusernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");

  // Used to show loading page when getting data to avoid issues with changing page mid data fetch
  const [loading, setLoading] = useState(true);

  // Fetch user info on page load
  useEffect(() => {
    setLoading(true); // Extra Protection incase it is somehow false at page load

    const fetchUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
    
        const existing = await checkUserExists(user.id);
        if (!existing) {
          setShowDisplayNamePrompt(true);
        } else {
          const groups = await fetchUserGroups(user.id);
          setGroups(groups);
        }

        const display_name = await getDisplayName(user.id);
        setDisplayName(dispaly_name);

        const username = await getUsername(user.id);
        setUsername(username);

        const invites = await fetchInvites(user.id);
        setInvites(invites);
      }

      setLoading(false);
    };
  
    fetchUser();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithGoogle(); // Attempt to sign in
      router.push('/'); // Redirect to home page after login
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setCurrentUser(null); // Set currentUser to null after logging out
      router.push('/'); // Redirect to the home page after logout
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleUserSubmit = async () => {
    if (!displayNameInput.trim()) {
      setUsernameError("Display Name Cant Be Empty");
      return;
    }

    if(usernameInput.trim() < 6) {
      setUsernameError("Username Must be 6 Characters or Longer")
      return;
    }
  
    try {
      setUsernameError("");
      await addNewUser(currentUser.id, displayNameInput.trim(), usernameInput.trim());
      setShowDisplayNamePrompt(false);
  
      const groups = await fetchUserGroups(currentUser.id);
      setGroups(groups);
    } catch (err) {
      if (err.message === "Username already exists") {
        setUsernameError("That username is already taken.");
      } else {
        console.error("Error creating user:", err);
        setUsernameError("Something went wrong. Please try again.");
      }
    }
  };
  
  

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[+month - 1]} ${+day}, ${year}`;
  };

  const handleGroupClick = (group) => {
    router.push(`/group/${group.groupId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  // If no user is logged in, show the login page
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0d1636] text-white">
        <h1 className="text-4xl font-bold mb-6">Welcome to HuddleUp</h1>
        <button
          onClick={handleLogin}
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
          <p className="text-sm">{username}</p>
          <button
            onClick={handleLogout} // Use handleLogout
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
            {displayName}&apos;s Groups
          </h2>
          <div className="flex flex-wrap m-4">
            {groups.length === 0 ? (
              <p className="text-white m-6">No groups found.</p>
            ) : (
              groups.map((group) => (
                <div
                  key={group.groupId}
                  className="bg-[#4b5366] text-white p-4 rounded-lg shadow-md m-6 h-40 w-80 cursor-pointer hover:shadow-xl transition"
                  onClick={() => handleGroupClick(group)}
                >
                  <h2 className="text-xl font-semibold text-gray-200">
                    {group.name}
                  </h2>
                  <p className="text-sm text-gray-200 mt-2">
                    {formatDate(group.startDate)} → {formatDate(group.endDate)}
                  </p>
                </div>
              ))
            )}
          </div>
          <h2 className="text-gray-200 mx-6 mt-10 text-2xl font-semibold">
            Your Invites
          </h2>
          <div className="flex flex-wrap m-4">
            {invites.length === 0 ? (
              <p className="text-white m-6">No Invites.</p>
            ) : (
              invites.map((invite) => (
                <div
                  key={invite.groupId}
                  className="bg-[#4b5366] text-white p-4 rounded-lg shadow-md m-6 h-40 w-80"
                >
                  <h2 className="text-xl font-semibold text-gray-200">
                    {invite.name}
                  </h2>
                  <div className="flex mt-5">
                    <button
                      onClick={async () => {
                        await inviteResponce(invite.invites[0].inviteID, currentUser.id, invite.groupId, true);
                        const updatedInvites = await fetchInvites(currentUser.id);
                        setInvites(updatedInvites);
                        const updatedGroups = await fetchUserGroups(currentUser.id);
                        setGroups(updatedGroups);
                      }}
                      className="bg-green-600 text-white px-4 py-2 m-2 rounded-md hover:bg-green-700 w-full"
                    >
                      Accept
                    </button>
                    <button
                      onClick={async () => {
                        await inviteResponce(invite.invites[0].inviteID, currentUser.id, invite.groupId, false);
                        const updatedInvites = await fetchInvites(currentUser.id);
                        setInvites(updatedInvites);
                        const updatedGroups = await fetchUserGroups(currentUser.id);
                        setGroups(updatedGroups);
                      }}
                      className="bg-red-600 text-white px-4 py-2 m-2 rounded-md hover:bg-red-800 w-full"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {isCreating && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#3a3f4b] text-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-semibold mb-4">Create a Group</h3>

            <label className="block text-sm font-medium text-white">
              Group Name
            </label>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full border border-gray-300 px-3 py-2 rounded mb-4 bg-[#3a3f4b]"
            />

            <label className="block text-sm font-medium text-white">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded mb-4"
            />

            <label className="block text-sm font-medium text-white">
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
                className="text-white hover:underline"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateGroup(newGroupName, startDate, endDate, currentUser, setGroups, setDateError, setIsCreating)}
                className="bg-blue-600 text-white px-4 py-2 ml-4 rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      {showDisplayNamePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-md w-96">
            <h2 className="text-lg font-semibold mb-4">Choose a User Name and Display Name</h2>
            <label className="block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <input
              type="text"
              value={displayNameInput}
              onChange={(e) => setDisplayNameInput(e.target.value)}
              placeholder="Enter display name"
              className="w-full border border-gray-300 px-3 py-2 rounded mb-4"
            />
            <label className="block text-sm font-medium text-gray-700">
              Username: (Must be Unique)
            </label>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setusernameInput(e.target.value)}
              placeholder="Enter username"
              className="w-full border border-gray-300 px-3 py-2 rounded mb-4"
            />

            {usernameError && (
              <p className="text-red-600 text-sm mb-3">{usernameError}</p>
            )}

            <button
              onClick={handleUserSubmit}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
            >
              Save and Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
