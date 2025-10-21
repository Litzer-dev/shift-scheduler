'use client';

import { useState, useEffect } from 'react';
import { TeamMember, HourlyRotation, WeeklySchedule } from '@/types';
import { generateHourlyRotation, formatTime } from '@/utils/shiftRotation';
import { createDefaultWeeklySchedule, getDayName } from '@/utils/scheduleHelpers';
import { exportToPDF, exportToExcel, exportDayToPDF } from '@/utils/exportUtils';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  fetchTeamMembers,
  addTeamMember as addTeamMemberToSupabase,
  updateTeamMember as updateTeamMemberInSupabase,
  deleteTeamMember as deleteTeamMemberFromSupabase,
  subscribeToTeamMembers,
} from '@/utils/supabaseOperations';

export default function Home() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [selectedWeekStart, setSelectedWeekStart] = useState(getMonday(new Date()).toISOString().split('T')[0]);
  const [weekRotations, setWeekRotations] = useState<{ [date: string]: HourlyRotation[] }>({});
  const [editingMember, setEditingMember] = useState<string | null>(null);

  // Load team members from Supabase or localStorage
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (isSupabaseConfigured()) {
        // Load from Supabase
        const members = await fetchTeamMembers();
        setTeamMembers(members);
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem('teamMembers');
        if (stored) {
          setTeamMembers(JSON.parse(stored));
        }
      }
    };

    loadTeamMembers();

    // Subscribe to real-time updates if Supabase is configured
    if (isSupabaseConfigured()) {
      const channel = subscribeToTeamMembers((members) => {
        setTeamMembers(members);
      });

      // Resilience: refetch on focus/visibility and on an interval
      const refreshMembers = async () => {
        const latest = await fetchTeamMembers();
        setTeamMembers(latest);
      };

      const onVisibility = () => {
        if (document.visibilityState === 'visible') {
          refreshMembers();
        }
      };

      window.addEventListener('focus', refreshMembers);
      document.addEventListener('visibilitychange', onVisibility);
      const intervalId = setInterval(refreshMembers, 30000); // periodic safety refresh

      // Cleanup subscription on unmount
      return () => {
        if (channel) {
          channel.unsubscribe();
        }
        window.removeEventListener('focus', refreshMembers);
        document.removeEventListener('visibilitychange', onVisibility);
        clearInterval(intervalId);
      };
    }
  }, []);

  // Save team members to localStorage (only if Supabase is not configured)
  useEffect(() => {
    if (!isSupabaseConfigured() && teamMembers.length > 0) {
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

  const addTeamMember = async () => {
    if (newMemberName.trim()) {
      const memberData = {
        name: newMemberName.trim(),
        weeklySchedule: createDefaultWeeklySchedule(),
      };

      if (isSupabaseConfigured()) {
        // Add to Supabase
        const newMember = await addTeamMemberToSupabase(memberData);
        if (newMember) {
          setTeamMembers([...teamMembers, newMember]);
        }
      } else {
        // Add to localStorage
        const newMember: TeamMember = {
          id: Date.now().toString(),
          ...memberData,
          createdAt: new Date(),
        };
        setTeamMembers([...teamMembers, newMember]);
      }
      
      setNewMemberName('');
    }
  };

  const removeMember = async (id: string) => {
    if (isSupabaseConfigured()) {
      // Delete from Supabase
      const success = await deleteTeamMemberFromSupabase(id);
      if (success) {
        setTeamMembers(teamMembers.filter(m => m.id !== id));
      }
    } else {
      // Delete from localStorage
      setTeamMembers(teamMembers.filter(m => m.id !== id));
    }
  };

  const updateMemberSchedule = async (memberId: string, dayKey: keyof WeeklySchedule, field: string, value: string | boolean) => {
    const updatedMembers = teamMembers.map(m => {
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
    });

    setTeamMembers(updatedMembers);

    // Sync to Supabase if configured
    if (isSupabaseConfigured()) {
      const updatedMember = updatedMembers.find(m => m.id === memberId);
      if (updatedMember) {
        await updateTeamMemberInSupabase(updatedMember);
      }
    }
  };

  const copyScheduleToWeek = async (memberId: string, sourceDayKey: keyof WeeklySchedule) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;

    const sourceSchedule = member.weeklySchedule[sourceDayKey];
    const newWeeklySchedule: WeeklySchedule = {} as WeeklySchedule;

    (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as (keyof WeeklySchedule)[]).forEach(day => {
      newWeeklySchedule[day] = { ...sourceSchedule };
    });

    const updatedMembers = teamMembers.map(m =>
      m.id === memberId ? { ...m, weeklySchedule: newWeeklySchedule } : m
    );

    setTeamMembers(updatedMembers);

    // Sync to Supabase if configured
    if (isSupabaseConfigured()) {
      const updatedMember = updatedMembers.find(m => m.id === memberId);
      if (updatedMember) {
        await updateTeamMemberInSupabase(updatedMember);
      }
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
            Weekly Shift Scheduler
          </h1>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm shadow-lg border border-teal-100">
            <div className={`w-2 h-2 rounded-full ${isSupabaseConfigured() ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm font-medium text-slate-700">
              {isSupabaseConfigured() ? 'Cloud Sync Active' : 'Local Storage Only'}
            </span>
          </div>
        </div>

        {/* Team Member Management */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-6 mb-8 border border-teal-100">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-teal-600">👥</span> Team Members
          </h2>
          
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTeamMember()}
              placeholder="Enter team member name"
              className="flex-1 px-4 py-2 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
            />
            <button
              onClick={addTeamMember}
              className="px-6 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg hover:from-teal-700 hover:to-emerald-700 transition-all font-medium shadow-md hover:shadow-lg"
            >
              Add Member
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {teamMembers.map(member => (
              <div key={member.id} className="border border-teal-200 rounded-lg p-3 bg-white hover:shadow-md transition-all hover:border-teal-400">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-800 truncate">{member.name}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingMember(editingMember === member.id ? null : member.id)}
                      className="p-1.5 bg-teal-100 text-teal-700 rounded hover:bg-teal-200 transition-colors"
                      title={editingMember === member.id ? 'Close' : 'Edit Schedule'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {editingMember === member.id ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        )}
                      </svg>
                    </button>
                    <button
                      onClick={() => removeMember(member.id)}
                      className="p-1.5 bg-rose-100 text-rose-700 rounded hover:bg-rose-200 transition-colors"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
          {teamMembers.length === 0 && (
            <p className="text-slate-500 text-center py-8">No team members added yet. Add your first team member to get started! 🚀</p>
          )}
        </div>

        {/* Schedule Editor Modal */}
        {editingMember && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-6 mb-8 border border-teal-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <span className="text-teal-600">📋</span> Edit Schedule: {teamMembers.find(m => m.id === editingMember)?.name}
              </h2>
              <button
                onClick={() => setEditingMember(null)}
                className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-3">
              {dayKeys.map((dayKey) => {
                const member = teamMembers.find(m => m.id === editingMember);
                if (!member) return null;
                const schedule = member.weeklySchedule[dayKey];
                return (
                  <div key={dayKey} className="border border-teal-200 rounded-lg p-3 bg-white shadow-sm">
                    <div className="text-sm font-semibold text-teal-700 mb-3 text-center">
                      {getDayName(dayKey)}
                    </div>
                    
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={schedule.isOff}
                        onChange={(e) => updateMemberSchedule(editingMember, dayKey, 'isOff', e.target.checked)}
                        className="rounded text-teal-600"
                      />
                      <span className="text-xs">Day Off</span>
                    </label>

                    {!schedule.isOff && (
                      <>
                        <label className="flex items-center gap-2 mb-3">
                          <input
                            type="checkbox"
                            checked={schedule.isPresent}
                            onChange={(e) => updateMemberSchedule(editingMember, dayKey, 'isPresent', e.target.checked)}
                            className="rounded text-teal-600"
                          />
                          <span className="text-xs">Working</span>
                        </label>

                        <div className="space-y-2">
                          <input
                            type="time"
                            value={schedule.shiftStart}
                            onChange={(e) => updateMemberSchedule(editingMember, dayKey, 'shiftStart', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-teal-200 rounded focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="Start"
                          />
                          <input
                            type="time"
                            value={schedule.shiftEnd}
                            onChange={(e) => updateMemberSchedule(editingMember, dayKey, 'shiftEnd', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-teal-200 rounded focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="End"
                          />
                        </div>
                      </>
                    )}

                    <button
                      onClick={() => copyScheduleToWeek(editingMember, dayKey)}
                      className="w-full mt-3 px-2 py-1.5 text-xs bg-gradient-to-r from-teal-100 to-emerald-100 hover:from-teal-200 hover:to-emerald-200 text-teal-700 rounded transition-colors font-medium"
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

        {/* Week Selection and Generation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-6 mb-8 border border-teal-100">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-teal-600">📅</span> Generate Week Rotation
          </h2>
          
          <div className="flex gap-4 items-end mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Week Starting (Monday)
              </label>
              <input
                type="date"
                value={selectedWeekStart}
                onChange={(e) => setSelectedWeekStart(e.target.value)}
                className="w-full px-4 py-2 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
              />
            </div>
            <button
              onClick={generateWeekRotation}
              disabled={teamMembers.length === 0}
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-medium disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              Generate Week Rotation
            </button>
          </div>

          {/* Export Buttons */}
          {Object.keys(weekRotations).length > 0 && (
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => exportToPDF(weekRotations, weekDates)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-lg hover:from-rose-700 hover:to-pink-700 transition-all font-medium shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export to PDF
              </button>
              <button
                onClick={() => exportToExcel(weekRotations, weekDates)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all font-medium shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export to Excel
              </button>
            </div>
          )}

          <div className="text-sm text-slate-700 bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200">
            <p className="font-semibold mb-2 text-amber-900">💡 How It Works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Set each team member&apos;s schedule for every day of the week</li>
              <li>Mark days off and presence for each day</li>
              <li>Generate rotation for entire week at once</li>
              <li>Fair rotation ensures no one stays in same position consecutively</li>
              <li>Daily pairings vary to prevent same partners day after day</li>
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
                <div key={date} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-teal-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">
                      {getDayName(dayKey)} - {new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </h3>
                    <button
                      onClick={() => exportDayToPDF(date, getDayName(dayKey), rotations)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white text-sm rounded-lg hover:from-rose-700 hover:to-pink-700 transition-all shadow-md"
                      title="Export this day to PDF"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      PDF
                    </button>
                  </div>

                  {rotations.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-teal-100 to-emerald-100">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-800">⏰ Time</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-800">🌤️ Outside</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-800">🏢 Inside</th>
                            {hasAnyFloater && (
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-800">🔄 Floater</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {rotations.map((rotation, idx) => (
                            <tr key={rotation.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-teal-50/30'}>
                              <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                {formatTime(rotation.startTime)}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {rotation.outside.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {rotation.outside.map((person) => (
                                      <div key={person.teamMemberId} className="bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 px-3 py-1 rounded-full shadow-sm border border-orange-200">
                                        {person.teamMemberName}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {rotation.inside.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {rotation.inside.map((person) => (
                                      <div key={person.teamMemberId} className="bg-gradient-to-r from-sky-100 to-blue-100 text-blue-800 px-3 py-1 rounded-full shadow-sm border border-blue-200">
                                        {person.teamMemberName}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">—</span>
                                )}
                              </td>
                              {hasAnyFloater && (
                                <td className="px-4 py-3 text-sm">
                                  {rotation.floater.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {rotation.floater.map((person) => (
                                        <div key={person.teamMemberId} className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-3 py-1 rounded-full shadow-sm border border-purple-200">
                                          {person.teamMemberName}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic">—</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-center py-4">No rotations for this day</p>
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
