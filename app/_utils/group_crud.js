import supabase from "./supabase";
import { generateDateRange } from "../components/generateDateRange" // Used to get a list of dates just of start and end dates

// ========= Fetch Functions =========

export const fetchUserGroups = async (userId) => {
  try {
    const { data: groupMemberships, error: groupMembershipError } = await supabase
      .from("group_members")
      .select("groupID")
      .eq("userID", userId);

    if (groupMembershipError) {
      console.error("Error fetching group memberships:", groupMembershipError.message);
      return [];
    }

    const groupIds = groupMemberships.map((membership) => membership.groupID);

    if (groupIds.length === 0) return [];

    const { data: groupsData, error: groupsError } = await supabase
      .from("groups")
      .select("*")
      .in("groupId", groupIds);

    if (groupsError) {
      console.error("Error fetching group details:", groupsError.message);
      return [];
    }

    return groupsData;
  } catch (error) {
    console.error("Error fetching user groups:", error);
    return [];
  }
};

export const fetchGroupDates = async (groupId) => {
  const { data, error } = await supabase
    .from("group_dates")
    .select("dateID, date")
    .eq("groupID", groupId)
    .order("date", { ascending: true });

  if (error) {
    console.error("Failed to fetch dates:", error.message);
    return [];
  }

  return data;
};

export const fetchGroupName = async (groupId) => {
  const {data, error } = await supabase
    .from("groups")
    .select("name")
    .eq("groupId", groupId)
  
  if (error) {
    console.error("Failed to fetch Group Name: ", error.message);
    return [];
  }

  const name = data[0].name;

  return name;
}

export const fetchAllResponses = async (groupId) => {
  const { data, error } = await supabase
    .from("responses")
    .select("dateID, startTime, endTime, userID, group_dates(date), users(display_name)")
    .eq("groupID", groupId);

  if (error) {
    console.error("Error fetching responses:", error);
    return [];
  }

  return data;
}

export const fetchInvites = async (uuid) => {
  const { data, error } = await supabase
    .from("groups")
    .select(`
      name,
      groupId,
      invites!inner(
        invitedUser,
        inviteID
      )
    `)
    .eq('invites.invitedUser', uuid);

  if (error) {
    console.error(error);
    return [];
  }

  return data;
};

// ========= Submit/Data Add Functions
export const submitAvailability = async (entries) => {
  if (entries.length === 0) return false;

  const { groupID, userID } = entries[0]; // assume all entries share the same group/user, only and issue if they tamper with their sent data

  // Delete existing responses for the same user and group. Prevents multiple responses and since it requires all filled in (or null if unavailable) we expect them to always be valid
  const { error: deleteError } = await supabase
    .from("responses")
    .delete()
    .eq("groupID", groupID)
    .eq("userID", userID);

  if (deleteError) {
    console.error("Error deleting old availability:", deleteError.message);
    return false;
  }

  // Insert new responses
  const { error: insertError } = await supabase
    .from("responses")
    .insert(entries);

  if (insertError) {
    console.error("Error submitting availability:", insertError.message);
    return false;
  }

  return true;
};

export const addNewUser = async (uuid, displayName, username) => {
  // Check if username already exists
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('username')
    .eq('username', username)
    .maybeSingle();

  if (checkError) {
    console.error("Error checking username:", checkError);
    throw checkError;
  }

  if (existingUser) {
    // Custom error for existing username
    throw new Error("Username already exists");
  }

  // Insert new user
  const { data, error } = await supabase
    .from('users')
    .insert([{ uuid, display_name: displayName, username }]);

  if (error) {
    console.log("Error Adding User: ", error);
    throw error;
  }

  return data;
};

export const inviteUser = async (username, senderUser, groupID) => {
  // Get user object from the username
  const invitedUser = await getUserFromName(username);

  // Check if the user exists
  if (!invitedUser) {
    console.log("Error getting User");
    return false;
  }

  // Insert the invite into the invites table
  const { data, error } = await supabase
    .from("invites")
    .insert([
      {
        invitedUser: invitedUser,
        senderUser: senderUser,
        groupID: groupID,
      },
    ]);

  if (error) {
    console.error("Error inserting invite:", error);
    return false;
  }

  return true;
};

export const inviteResponce = async (inviteID, uuid, groupID, response) => { // This both Deletes the invite and adds the member to group only if they accept
  if (response) {
    const { error } = await supabase
      .from("group_members")
      .insert([{ groupID, userID: uuid }]);

    if (error) {
      console.error("Error adding user to group_members:", error);
      return false;
    }
  }

  const { deleteError } = await supabase
    .from("invites")
    .delete()
    .eq("inviteID", inviteID);

  if (deleteError) {
    console.error("Error deleting invite:", deleteError);
    return false;
  }

  return true;
};

export const handleCreateGroup = async (newGroupName, startDate, endDate, currentUser, setGroups, resetForm, setDateError) => {
  setDateError("");

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    setDateError("Start date must be before end date.");
    return;
  }

  const dayDiff = (end - start) / (1000 * 60 * 60 * 24);
  if (dayDiff > 6) {
    setDateError("The date range cannot exceed 7 days.");
    return;
  }

  try {
    const { data: groupData, error: groupError } = await supabase
      .from("groups")
      .insert([
        {
          name: newGroupName,
          uuid: currentUser.id,
          startDate,
          endDate,
        },
      ])
      .select()
      .single();

    if (groupError || !groupData) {
      console.error("Group creation failed:", groupError?.message);
      setDateError("Something went wrong. Try again.");
      return;
    }

    await supabase.from("group_members").insert([
      {
        groupID: groupData.groupId,
        userID: currentUser.id,
      },
    ]);

    const dateList = generateDateRange(startDate, endDate);
    const groupDates = dateList.map((date) => ({
      groupID: groupData.groupId,
      date,
    }));

    await supabase.from("group_dates").insert(groupDates);

    setGroups((prev) => [...prev, groupData]);
    resetForm();
  } catch (err) {
    console.error("Group creation failed:", err);
    setDateError("Something went wrong. Try again.");
  }
};

// ========= Get/Check Data =========
export const checkUserExists = async (uuid) => {
  const { data, error } = await supabase
    .from('users')
    .select('display_name')
    .eq('uuid', uuid);

  if (error) {
    console.error('Error checking user:', error);
    return false;
  }

  return data.length > 0; // returns null if not found
};

export const getUserFromName = async (username) => {
  const { data, error } = await supabase
    .from("users")
    .select("uuid")
    .eq("username", username)
    .single();

    if (error) {
      return null;
    }

    return data.uuid;
};

export const getDisplayName = async (uuid) => {
  const { data, error } = await supabase
    .from("users")
    .select("display_name")
    .eq("uuid", uuid)
    .single();

    if(error) {
      console.error("Error getting Display Name: ", error);
    }

    return data.display_name;
}

// Check group owner (used for deleting and editing)
export const checkOwner = async (groupID, uuid) => {
  const { data, error } = await supabase // Gets Group ID's related to passed in UUID. Used later to check if any match the groupID passed in
    .from("groups")
    .select("uuid")
    .eq("groupId", groupID)
    .single();

    if(error) {
      console.error("Error Checking Owner: ", error.message)
      return false;
    }

    if(uuid == data.uuid){
      return true;
    } else {
      return false;
    }
}

export const checkMembers = async (uuid, groupID) => { // Checks if the user is in the group

  const { data, error } = await supabase
    .from("group_members")
    .select("*")
    .eq("userID", uuid)
    .eq("groupID", groupID)
    .single();
    
    if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned (which is fine)
      console.error("Error checking group membership:", error);
      return false;
    }

    if(data == null) { // If the member isnt in the group return false
      return false
    }

    return true; // Return true if data isnt null
}

// ========= Delete Data ========= 

// Completely Deletes a Group. (Only Owner can do)
export const removeGroup = async (groupID, uuid) => {
  const check = checkOwner(groupID, uuid); // Checks if the user passed in owns the group passed in
  if(check){ // If they own the group we remove the group
    const { data, error } = await supabase
      .from("groups")
      .delete()
      .eq("groupId", groupID);

    if(error){
      console.error("Error Removing Group: ", error.message);
      return false;
    }

    return true;
  } else {
    console.log("Error Removing Group, You are not the owner. Stop trying to break my code :(")
  }
}

export const removeMember = async (uuid) => {
  const { data, error } = await supabase 
    .from("group_members")
    .delete()
    .eq("userID", uuid);

    if(error) {
      console.error('Error Removing Member: ', error.message)
    }
};