export interface DailySchedule {
  shiftStart: string; // e.g., "07:00"
  shiftEnd: string;   // e.g., "15:00"
  isPresent: boolean;
  isOff?: boolean;    // Day off
}

export interface WeeklySchedule {
  monday: DailySchedule;
  tuesday: DailySchedule;
  wednesday: DailySchedule;
  thursday: DailySchedule;
  friday: DailySchedule;
  saturday: DailySchedule;
  sunday: DailySchedule;
}

export interface TeamMember {
  id: string;
  name: string;
  weeklySchedule: WeeklySchedule;
  createdAt: Date;
}

export interface HourlyRotation {
  id: string;
  hour: string;
  startTime: string;
  endTime: string;
  outside: {
    teamMemberId: string;
    teamMemberName: string;
  }[];
  inside: {
    teamMemberId: string;
    teamMemberName: string;
  }[];
  floater: {
    teamMemberId: string;
    teamMemberName: string;
  }[];
}

export interface RotationConfig {
  totalMembers: number;
  presentMembers: number;
  outsideCount: number;
  insideCount: number;
  floaterCount: number;
}
