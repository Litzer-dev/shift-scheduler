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

// Seeded random number generator for consistent but varied daily rotations
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Shuffle array using seeded random for consistent daily variation
function seededShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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
  
  // Create a seed based on the date to ensure different pairings each day
  // but consistent results for the same date
  const dateSeed = new Date(date).getTime();
  
  // Shuffle members based on the date seed to vary daily pairings
  const shuffledMembers = seededShuffle(presentMembers, dateSeed);
  
  // Track position history for each member to ensure fair rotation
  const positionHistory: { [memberId: string]: { outside: number; inside: number; floater: number } } = {};
  shuffledMembers.forEach(m => {
    positionHistory[m.id] = { outside: 0, inside: 0, floater: 0 };
  });
  
  // Track last position for each member to prevent consecutive same positions
  const lastPosition: { [memberId: string]: 'outside' | 'inside' | 'floater' | null } = {};
  shuffledMembers.forEach(m => {
    lastPosition[m.id] = null;
  });
  
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
    
    // Sort available members by:
    // 1. Who has worked least in any position (for fairness)
    // 2. Add slight randomization based on date + hour to vary pairings
    const sortedMembers = [...availableMembers].sort((a, b) => {
      const aHistory = positionHistory[a.id];
      const bHistory = positionHistory[b.id];
      const aTotal = aHistory.outside + aHistory.inside + aHistory.floater;
      const bTotal = bHistory.outside + bHistory.inside + bHistory.floater;
      
      // If work totals are equal, use seeded randomization to vary order
      if (aTotal === bTotal) {
        const hourSeed = dateSeed + hour;
        const aRandom = seededRandom(hourSeed + a.id.charCodeAt(0));
        const bRandom = seededRandom(hourSeed + b.id.charCodeAt(0));
        return aRandom - bRandom;
      }
      
      return aTotal - bTotal;
    });
    
    // Helper function to assign members to a position, avoiding consecutive same positions
    const assignToPosition = (
      position: 'outside' | 'inside' | 'floater',
      count: number,
      pool: TeamMember[]
    ): TeamMember[] => {
      const assigned: TeamMember[] = [];
      const remaining = [...pool];
      
      for (let i = 0; i < count && remaining.length > 0; i++) {
        // Sort by: 1) didn't have this position last hour, 2) least time in this position, 3) randomize ties
        remaining.sort((a, b) => {
          const aWasLastPosition = lastPosition[a.id] === position ? 1 : 0;
          const bWasLastPosition = lastPosition[b.id] === position ? 1 : 0;
          
          if (aWasLastPosition !== bWasLastPosition) {
            return aWasLastPosition - bWasLastPosition;
          }
          
          const aPositionTime = positionHistory[a.id][position];
          const bPositionTime = positionHistory[b.id][position];
          
          if (aPositionTime !== bPositionTime) {
            return aPositionTime - bPositionTime;
          }
          
          // If tied, use randomization based on date + hour + position to vary pairings
          const positionSeed = dateSeed + hour + position.charCodeAt(0);
          const aRandom = seededRandom(positionSeed + a.id.charCodeAt(0));
          const bRandom = seededRandom(positionSeed + b.id.charCodeAt(0));
          return aRandom - bRandom;
        });
        
        const selected = remaining.shift()!;
        assigned.push(selected);
        positionHistory[selected.id][position]++;
        lastPosition[selected.id] = position;
      }
      
      return assigned;
    };
    
    // Assign positions fairly
    const outsideMembers = assignToPosition('outside', hourConfig.outsideCount, sortedMembers);
    const remainingAfterOutside = sortedMembers.filter(m => !outsideMembers.includes(m));
    
    const insideMembers = assignToPosition('inside', hourConfig.insideCount, remainingAfterOutside);
    const remainingAfterInside = remainingAfterOutside.filter(m => !insideMembers.includes(m));
    
    const floaterMembers = assignToPosition('floater', hourConfig.floaterCount, remainingAfterInside);
    
    // Populate rotation object
    rotation.outside = outsideMembers.map(m => ({
      teamMemberId: m.id,
      teamMemberName: m.name,
    }));
    
    rotation.inside = insideMembers.map(m => ({
      teamMemberId: m.id,
      teamMemberName: m.name,
    }));
    
    rotation.floater = floaterMembers.map(m => ({
      teamMemberId: m.id,
      teamMemberName: m.name,
    }));
    
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
