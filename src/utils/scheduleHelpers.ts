import { WeeklySchedule, DailySchedule } from '@/types';

export function createDefaultDailySchedule(): DailySchedule {
  return {
    shiftStart: '07:00',
    shiftEnd: '15:00',
    isPresent: true,
    isOff: false,
  };
}

export function createDefaultWeeklySchedule(): WeeklySchedule {
  const defaultDay = createDefaultDailySchedule();
  
  return {
    monday: { ...defaultDay },
    tuesday: { ...defaultDay },
    wednesday: { ...defaultDay },
    thursday: { ...defaultDay },
    friday: { ...defaultDay },
    saturday: { ...defaultDay, isOff: true, isPresent: false },
    sunday: { ...defaultDay, isOff: true, isPresent: false },
  };
}

export function getDayName(dayKey: keyof WeeklySchedule): string {
  const names: Record<keyof WeeklySchedule, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };
  return names[dayKey];
}
