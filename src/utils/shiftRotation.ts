import { TeamMember, HourlyRotation, RotationConfig, DailySchedule } from '@/types';

// Helper to get day of week key from date string
function getDayOfWeek(dateString: string): keyof TeamMember['weeklySchedule'] {
  const date = new Date(dateString);
  const days: (keyof TeamMember['weeklySchedule'])[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

// Helper to get daily schedule for a specific date
function getDailySchedule(member: TeamMember, date: string): DailySchedule {
  const dayKey = getDayOfWeek(date);
  return member.weeklySchedule[dayKey];
}

// Export helper for UI to use
export { getDailySchedule, getDayOfWeek };

export function getRotationConfig(presentMembers: TeamMember[]): RotationConfig {
  const presentCount = presentMembers.length;
  
  // Split evenly between outside and inside
  // If odd number, the extra person is a floater
  const halfCount = Math.floor(presentCount / 2);
  const hasFloater = presentCount % 2 === 1;
  
  const outsideCount = halfCount;
  const insideCount = halfCount;
  const floaterCount = hasFloater ? 1 : 0;

  return {
    totalMembers: presentMembers.length,
    presentMembers: presentCount,
    outsideCount,
    insideCount,
    floaterCount,
  };
}

// Helper to convert time string to minutes for comparison
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Check if a team member is working at a specific hour on a specific date
function isMemberWorking(member: TeamMember, hour: number, date: string): boolean {
  const dailySchedule = getDailySchedule(member, date);
  
  if (!dailySchedule.isPresent || dailySchedule.isOff) return false;
  
  const hourStart = hour * 60; // Convert hour to minutes
  const hourEnd = (hour + 1) * 60;
  const shiftStart = timeToMinutes(dailySchedule.shiftStart);
  const shiftEnd = timeToMinutes(dailySchedule.shiftEnd);
  
  // Check if the hour falls within the member's shift
  // Member must have already started (hourStart >= shiftStart)
  // AND their shift must not have ended yet (hourEnd <= shiftEnd)
  return hourStart >= shiftStart && hourEnd <= shiftEnd;
}

export function generateHourlyRotation(
  teamMembers: TeamMember[],
  date: string
): HourlyRotation[] {
  const rotations: HourlyRotation[] = [];
  const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 7am to 10pm (16 hours)
  
  // Get present members for this specific date
  const presentMembers = teamMembers.filter(m => {
    const dailySchedule = getDailySchedule(m, date);
    return dailySchedule.isPresent && !dailySchedule.isOff;
  });
  
  // Track rotation index for each unique group of available members
  const rotationState: { [key: string]: number } = {};
  
  for (const hour of hours) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
    
    // Find members available for THIS SPECIFIC HOUR on this date
    const availableMembers = presentMembers.filter(m => isMemberWorking(m, hour, date));
    
    // Calculate config based on who's actually available THIS HOUR
    const hourConfig = getRotationConfig(availableMembers);
    
    const rotation: HourlyRotation = {
      id: `${date}-${hour}`,
      hour: `${hour}`,
      startTime,
      endTime,
      outside: [],
      inside: [],
      floater: [],
    };
    
    if (availableMembers.length === 0) {
      rotations.push(rotation);
      continue;
    }
    
    // Create a key for this group of members to track their rotation state
    const memberKey = availableMembers.map(m => m.id).sort().join('-');
    if (rotationState[memberKey] === undefined) {
      rotationState[memberKey] = 0;
    }
    
    // Get the current rotation offset for this group
    const rotationOffset = rotationState[memberKey];
    
    // Calculate the number of positions to shift to ensure no one repeats
    // We need to shift by at least the size of the largest position group
    const maxPositionSize = Math.max(hourConfig.outsideCount, hourConfig.insideCount, hourConfig.floaterCount);
    const shiftAmount = Math.max(maxPositionSize, 1);
    
    // Assign positions with rotation
    let assignmentIndex = 0;
    
    // Assign outside positions
    for (let i = 0; i < hourConfig.outsideCount; i++) {
      const memberIdx = (rotationOffset + assignmentIndex) % availableMembers.length;
      rotation.outside.push({
        teamMemberId: availableMembers[memberIdx].id,
        teamMemberName: availableMembers[memberIdx].name,
      });
      assignmentIndex++;
    }
    
    // Assign inside positions
    for (let i = 0; i < hourConfig.insideCount; i++) {
      const memberIdx = (rotationOffset + assignmentIndex) % availableMembers.length;
      rotation.inside.push({
        teamMemberId: availableMembers[memberIdx].id,
        teamMemberName: availableMembers[memberIdx].name,
      });
      assignmentIndex++;
    }
    
    // Assign floater positions
    for (let i = 0; i < hourConfig.floaterCount; i++) {
      const memberIdx = (rotationOffset + assignmentIndex) % availableMembers.length;
      rotation.floater.push({
        teamMemberId: availableMembers[memberIdx].id,
        teamMemberName: availableMembers[memberIdx].name,
      });
      assignmentIndex++;
    }
    
    // Advance rotation to ensure people don't stay in same position
    // Shift by the amount that guarantees position changes
    rotationState[memberKey] = (rotationOffset + shiftAmount) % availableMembers.length;
    
    rotations.push(rotation);
  }
  
  return rotations;
}

export function formatTime(time: string): string {
  const [hours] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${ampm}`;
}
