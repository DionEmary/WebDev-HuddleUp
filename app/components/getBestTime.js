const timeToMinutes = (t) => {
    if (!t || typeof t !== "string" || !t.includes(":")) return null;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  
  const minutesToTime = (m) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };
  
  const findBestTimeSlots = (responses) => {
    const grouped = {};
  
    // Group responses by actual date
    for (const r of responses) {
      const date = r.group_dates?.date;
      if (!date) continue;
  
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(r);
    }
  
    const results = {};
  
    for (const date in grouped) {
      const responsesForDate = grouped[date];
      const totalUsers = responsesForDate.length;
  
      const ranges = responsesForDate
        .filter(r => r.startTime && r.endTime)
        .map(r => {
          const start = timeToMinutes(r.startTime);
          const end = timeToMinutes(r.endTime);
          return start !== null && end !== null ? { start, end } : null;
        })
        .filter(r => r !== null);
  
      const usersWithAvailability = ranges.length;
  
      if (usersWithAvailability === 0) {
        results[date] = null;
        continue;
      }
  
      const maxStart = Math.max(...ranges.map(r => r.start));
      const minEnd = Math.min(...ranges.map(r => r.end));
  
      // Only consider "everyone" if ALL users submitted availability
      if (
        usersWithAvailability === totalUsers &&
        maxStart < minEnd &&
        (minEnd - maxStart) >= 60
      ) {
        results[date] = {
          startTime: minutesToTime(maxStart),
          endTime: minutesToTime(minEnd),
          overlapType: "everyone"
        };
        continue;
      }
  
      // Partial overlap with at least 60 mins
      const availability = new Array(1440).fill(0);
  
      for (const range of ranges) {
        for (let i = range.start; i < range.end; i++) {
          availability[i]++;
        }
      }
  
      let bestBlock = { start: 0, end: 0, users: 0 };
      let tempStart = null;
      let currentUsers = 0;
  
      for (let i = 0; i <= 1440; i++) {
        const users = availability[i] || 0;
  
        if (users >= 2) {
          if (tempStart === null) {
            tempStart = i;
            currentUsers = users;
          } else {
            currentUsers = Math.min(currentUsers, users);
          }
        } else {
          if (tempStart !== null && (i - tempStart) >= 60) {
            if ((i - tempStart) > (bestBlock.end - bestBlock.start)) {
              bestBlock = { start: tempStart, end: i, users: currentUsers };
            }
          }
          tempStart = null;
          currentUsers = 0;
        }
      }
  
      if (bestBlock.end > bestBlock.start) {
        results[date] = {
          startTime: minutesToTime(bestBlock.start),
          endTime: minutesToTime(bestBlock.end),
          overlapType: "most"
        };
      } else {
        results[date] = null;
      }
    }
  
    return results;
  };
  
  export default findBestTimeSlots;
  