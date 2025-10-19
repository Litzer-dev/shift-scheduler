'use client';

import { useState, useEffect } from 'react';
import { TeamMember, HourlyRotation, WeeklySchedule } from '@/types';
import { generateHourlyRotation, formatTime } from '@/utils/shiftRotation';
import { createDefaultWeeklySchedule, getDayName } from '@/utils/scheduleHelpers';

export default function Home() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [selectedWeekStart, setSelectedWeekStart] = useState(getMonday(new Date()).toISOString().split('T')[0]);
  const [weekRotations, setWeekRotations] = useState<{ [date: string]: HourlyRotation[] }>({});
  const [editingMember, setEditingMember] = useState<string | null>(null);

  // Load team members from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('teamMembers');
    if (stored) {
      setTeamMembers(JSON.parse(stored));
    }
  }, []);

  // Save team members to localStorage
  useEffect(() => {
    if (teamMembers.length > 0) {
      localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
    }
  }, [teamMembers]);

  // Get Monday of current week
  function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  // Get array of dates for the week
  function getWeekDates(mondayDate: string): string[] {
    const dates: string[] = [];
    const monday = new Date(mondayDate);
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }

  const addTeamMember = () => {
    if (newMemberName.trim()) {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: newMemberName.trim(),
        weeklySchedule: createDefaultWeeklySchedule(),
        createdAt: new Date(),
      };
      setTeamMembers([...teamMembers, newMember]);
      setNewMemberName('');
    }
  };

  const removeMember = (id: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
  };

  const updateMemberSchedule = (memberId: string, dayKey: keyof WeeklySchedule, field: string, value: string | boolean) => {
    setTeamMembers(teamMembers.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          weeklySchedule: {
            ...m.weeklySchedule,
            [dayKey]: {
              ...m.weeklySchedule[dayKey],
              [field]: value,
            },
          },
        };
      }
      return m;
    }));
  };

  const copyScheduleToWeek = (memberId: string, sourceDayKey: keyof WeeklySchedule) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;

    const sourceSchedule = member.weeklySchedule[sourceDayKey];
    const newWeeklySchedule: WeeklySchedule = {} as WeeklySchedule;

    (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as (keyof WeeklySchedule)[]).forEach(day => {
      newWeeklySchedule[day] = { ...sourceSchedule };
    });

    setTeamMembers(teamMembers.map(m =>
      m.id === memberId ? { ...m, weeklySchedule: newWeeklySchedule } : m
    ));
  };

  const generateWeekRotation = () => {
    const weekDates = getWeekDates(selectedWeekStart);
    const rotations: { [date: string]: HourlyRotation[] } = {};

    weekDates.forEach(date => {
      rotations[date] = generateHourlyRotation(teamMembers, date);
    });

    setWeekRotations(rotations);
  };

  const weekDates = getWeekDates(selectedWeekStart);
  const dayKeys: (keyof WeeklySchedule)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Weekly Shift Scheduler
        </h1>

        {/* Team Member Management */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Team Members</h2>
          
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTeamMember()}
              placeholder="Enter team member name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addTeamMember}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Add Member
            </button>
          </div>

          <div className="space-y-4">
            {teamMembers.map(member => (
              <div key={member.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{member.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingMember(editingMember === member.id ? null : member.id)}
                      className="px-4 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors text-sm font-medium"
                    >
                      {editingMember === member.id ? 'Hide Schedule' : 'Edit Schedule'}
                    </button>
                    <button
                      onClick={() => removeMember(member.id)}
                      className="px-4 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {editingMember === member.id && (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-7 gap-2">
                      {dayKeys.map((dayKey) => {
                        const schedule = member.weeklySchedule[dayKey];
                        return (
                          <div key={dayKey} className="border border-gray-300 rounded p-2 bg-white">
                            <div className="text-xs font-semibold text-gray-700 mb-2 text-center">
                              {getDayName(dayKey)}
                            </div>
                            
                            <label className="flex items-center gap-1 mb-2">
                              <input
                                type="checkbox"
                                checked={schedule.isOff}
                                onChange={(e) => updateMemberSchedule(member.id, dayKey, 'isOff', e.target.checked)}
                                className="rounded"
                              />
                              <span className="text-xs">Off</span>
                            </label>

                            {!schedule.isOff && (
                              <>
                                <label className="flex items-center gap-1 mb-2">
                                  <input
                                    type="checkbox"
                                    checked={schedule.isPresent}
                                    onChange={(e) => updateMemberSchedule(member.id, dayKey, 'isPresent', e.target.checked)}
                                    className="rounded"
                                  />
                                  <span className="text-xs">Present</span>
                                </label>

                                <input
                                  type="time"
                                  value={schedule.shiftStart}
                                  onChange={(e) => updateMemberSchedule(member.id, dayKey, 'shiftStart', e.target.value)}
                                  className="w-full px-1 py-1 text-xs border border-gray-300 rounded mb-1"
                                />
                                <input
                                  type="time"
                                  value={schedule.shiftEnd}
                                  onChange={(e) => updateMemberSchedule(member.id, dayKey, 'shiftEnd', e.target.value)}
                                  className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
                                />
                              </>
                            )}

                            <button
                              onClick={() => copyScheduleToWeek(member.id, dayKey)}
                              className="w-full mt-2 px-1 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                              title="Copy this day's schedule to all days"
                            >
                              Copy to Week
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {teamMembers.length === 0 && (
              <p className="text-gray-500 text-center py-8">No team members added yet</p>
            )}
          </div>
        </div>

        {/* Week Selection and Generation */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Generate Week Rotation</h2>
          
          <div className="flex gap-4 items-end mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Week Starting (Monday)
              </label>
              <input
                type="date"
                value={selectedWeekStart}
                onChange={(e) => setSelectedWeekStart(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={generateWeekRotation}
              disabled={teamMembers.length === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Generate Week Rotation
            </button>
          </div>

          <div className="text-sm text-gray-600 bg-yellow-50 p-4 rounded-lg">
            <p className="font-medium mb-2">How It Works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Set each team member&apos;s schedule for every day of the week</li>
              <li>Mark days off and presence for each day</li>
              <li>Generate rotation for entire week at once</li>
              <li>Fair rotation ensures no one stays in same position consecutively</li>
            </ul>
          </div>
        </div>

        {/* Week Rotation Display */}
        {Object.keys(weekRotations).length > 0 && (
          <div className="space-y-6">
            {weekDates.map((date, dayIndex) => {
              const rotations = weekRotations[date] || [];
              const dayKey = dayKeys[dayIndex];
              const hasAnyFloater = rotations.some(r => r.floater.length > 0);

              return (
                <div key={date} className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-700 mb-4">
                    {getDayName(dayKey)} - {new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>

                  {rotations.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Outside</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Inside</th>
                            {hasAnyFloater && (
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Floater</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {rotations.map((rotation, idx) => (
                            <tr key={rotation.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                {formatTime(rotation.startTime)}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {rotation.outside.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {rotation.outside.map((person) => (
                                      <div key={person.teamMemberId} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                                        {person.teamMemberName}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 italic">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {rotation.inside.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {rotation.inside.map((person) => (
                                      <div key={person.teamMemberId} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                        {person.teamMemberName}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 italic">—</span>
                                )}
                              </td>
                              {hasAnyFloater && (
                                <td className="px-4 py-3 text-sm">
                                  {rotation.floater.length > 0 ? (
                                    <div className="flex-wrap gap-2">
                                      {rotation.floater.map((person) => (
                                        <div key={person.teamMemberId} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                                          {person.teamMemberName}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 italic">—</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No rotations for this day</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
