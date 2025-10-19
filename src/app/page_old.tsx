'use client';

import { useState, useEffect } from 'react';
import { TeamMember, HourlyRotation } from '@/types';
import { generateHourlyRotation, getRotationConfig, formatTime } from '@/utils/shiftRotation';

export default function Home() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newShiftStart, setNewShiftStart] = useState('07:00');
  const [newShiftEnd, setNewShiftEnd] = useState('15:00');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rotations, setRotations] = useState<HourlyRotation[]>([]);

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

  const addTeamMember = () => {
    if (newMemberName.trim()) {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: newMemberName.trim(),
        shiftStart: newShiftStart,
        shiftEnd: newShiftEnd,
        isPresent: true,
        createdAt: new Date(),
      };
      setTeamMembers([...teamMembers, newMember]);
      setNewMemberName('');
    }
  };

  const removeMember = (id: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
  };

  const toggleMemberPresence = (id: string) => {
    setTeamMembers(teamMembers.map(m =>
      m.id === id ? { ...m, isPresent: !m.isPresent } : m
    ));
  };

  const updateMemberShift = (id: string, shiftStart: string, shiftEnd: string) => {
    setTeamMembers(teamMembers.map(m =>
      m.id === id ? { ...m, shiftStart, shiftEnd } : m
    ));
  };

  const generateRotation = () => {
    const presentMembers = teamMembers.filter(m => m.isPresent);
    if (presentMembers.length === 0) {
      alert('Please add team members and mark them as present');
      return;
    }
    const generatedRotations = generateHourlyRotation(teamMembers, selectedDate);
    setRotations(generatedRotations);
  };

  const presentMembers = teamMembers.filter(m => m.isPresent);
  const config = presentMembers.length > 0 ? getRotationConfig(presentMembers) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Team Shift Scheduler
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Team Management Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Team Members</h2>
            
            <div className="space-y-3 mb-6">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Team member name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Shift Start</label>
                  <input
                    type="time"
                    value={newShiftStart}
                    onChange={(e) => setNewShiftStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Shift End</label>
                  <input
                    type="time"
                    value={newShiftEnd}
                    onChange={(e) => setNewShiftEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={addTeamMember}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Add Team Member
              </button>
            </div>

            <div className="space-y-3">
              {teamMembers.map(member => (
                <div
                  key={member.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-800">{member.name}</span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          member.isPresent
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {member.isPresent ? 'Present' : 'Absent'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleMemberPresence(member.id)}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors text-xs font-medium"
                      >
                        Toggle
                      </button>
                      <button
                        onClick={() => removeMember(member.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Shift Start</label>
                      <input
                        type="time"
                        value={member.shiftStart}
                        onChange={(e) => updateMemberShift(member.id, e.target.value, member.shiftEnd)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Shift End</label>
                      <input
                        type="time"
                        value={member.shiftEnd}
                        onChange={(e) => updateMemberShift(member.id, member.shiftStart, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    Schedule: {formatTime(member.shiftStart)} - {formatTime(member.shiftEnd)}
                  </div>
                </div>
              ))}
              {teamMembers.length === 0 && (
                <p className="text-gray-500 text-center py-8">No team members added yet</p>
              )}
            </div>
          </div>

          {/* Rotation Configuration Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Rotation Settings</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {config && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Current Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Present Members:</span>
                    <span className="font-medium text-gray-800">{config.presentMembers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Outside Positions:</span>
                    <span className="font-medium text-gray-800">{config.outsideCount} per hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Inside Positions:</span>
                    <span className="font-medium text-gray-800">{config.insideCount} per hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Floater Positions:</span>
                    <span className="font-medium text-gray-800">{config.floaterCount} per hour</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={generateRotation}
              disabled={presentMembers.length === 0}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Generate Outside Rotation
            </button>

            <div className="mt-4 text-sm text-gray-600 bg-yellow-50 p-4 rounded-lg">
              <p className="font-medium mb-2">How It Works:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Enter each team member's scheduled shift times</li>
                <li>Mark who is present today</li>
                <li>App generates hourly rotation (7 AM - 11 PM)</li>
                <li>1 person outside, 1 person inside each hour</li>
                <li>With 5+ people: adds 1 floater to help where needed</li>
                <li>Only assigns members during their scheduled shift</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Hourly Rotation Display Section */}
        {rotations.length > 0 && (() => {
          // Check if any hour has a floater
          const hasAnyFloater = rotations.some(r => r.floater.length > 0);
          
          return (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                Hourly Rotation for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              
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
                            <div className="flex flex-wrap gap-2">
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
          </div>
          );
        })()}
      </div>
    </div>
  );
}
