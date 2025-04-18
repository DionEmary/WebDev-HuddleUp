import supabase from "./supabase";
import { generateDateRange } from "../components/generateDateRange"

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
