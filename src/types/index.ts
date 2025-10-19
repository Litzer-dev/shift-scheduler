export interface TeamMember {
  id: string;
  name: string;
  shiftStart: string; // e.g., "07:00"
  shiftEnd: string;   // e.g., "15:00"
  isPresent: boolean;
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
