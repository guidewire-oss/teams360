'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, getAllUsers } from '@/lib/auth';
import { TEAMS, HEALTH_DIMENSIONS, getTeamHealthSummary, getHealthCheckSessions } from '@/lib/data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import { Users, TrendingUp, Calendar, LogOut, Activity, Clock, Target, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react';

export default function ManagerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [viewType, setViewType] = useState<'overview' | 'details' | 'trends' | 'individual'>('overview');
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
    } else if (currentUser.hierarchyLevelId === 'level-5') {
      // Team members should go to survey
      router.push('/survey');
    } else {
      // Allow team leads (level-4), managers (level-3), directors (level-2), VPs (level-1), and admins
      setUser(currentUser);
      setSelectedTeam(TEAMS[0].id);
    }
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  const selectedTeamData = TEAMS.find(t => t.id === selectedTeam);
  const teamSummary = getTeamHealthSummary(selectedTeam);

  const getScoreColor = (score: number) => {
    if (score >= 2.5) return '#22c55e';
    if (score >= 1.5) return '#eab308';
    return '#ef4444';
  };

  const radarData = teamSummary?.dimensions.map(d => ({
    dimension: d.name.length > 15 ? d.name.substring(0, 12) + '...' : d.name,
    score: d.averageScore,
    fullScore: 3
  })) || [];

  const barData = teamSummary?.dimensions.map(d => ({
    name: d.name,
    red: d.distribution.red,
    yellow: d.distribution.yellow,
    green: d.distribution.green
  })) || [];

  const trendData = [
    { month: 'Oct', overall: 2.1 },
    { month: 'Nov', overall: 2.3 },
    { month: 'Dec', overall: 2.2 },
    { month: 'Jan', overall: 2.4 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
              <p className="text-gray-500">Team Health Check Overview</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Logged in as</p>
                <p className="font-semibold text-gray-900">{user.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex gap-4 items-center flex-wrap">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {TEAMS.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setViewType('overview')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewType === 'overview'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setViewType('details')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewType === 'details'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setViewType('individual')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewType === 'individual'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Individual Responses
              </button>
              <button
                onClick={() => setViewType('trends')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewType === 'trends'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Trends
              </button>
            </div>
          </div>
        </div>

        {selectedTeamData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-indigo-600" />
                <span className="text-2xl font-bold text-gray-900">{selectedTeamData.members.length}</span>
              </div>
              <p className="text-gray-600">Team Members</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold text-gray-900 capitalize">{selectedTeamData.cadence}</span>
              </div>
              <p className="text-gray-600">Check Cadence</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-yellow-600" />
                <span className="text-2xl font-bold text-gray-900">
                  {new Date(selectedTeamData.nextCheckDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-gray-600">Next Check</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 text-purple-600" />
                <span className="text-2xl font-bold text-gray-900">
                  {teamSummary ? Math.round((teamSummary.dimensions.reduce((acc, d) => acc + d.averageScore, 0) / teamSummary.dimensions.length) * 33.33) : 0}%
                </span>
              </div>
              <p className="text-gray-600">Health Score</p>
            </div>
          </div>
        )}

        {viewType === 'overview' && teamSummary && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Radar</h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="dimension" />
                  <PolarRadiusAxis angle={90} domain={[0, 3]} ticks={[1, 2, 3]} />
                  <Radar 
                    name="Score" 
                    dataKey="score" 
                    stroke="#6366f1" 
                    fill="#6366f1" 
                    fillOpacity={0.6} 
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Distribution</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="red" stackId="a" fill="#ef4444" />
                  <Bar dataKey="yellow" stackId="a" fill="#eab308" />
                  <Bar dataKey="green" stackId="a" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {viewType === 'details' && teamSummary && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dimension Details</h3>
              <div className="space-y-4">
                {teamSummary.dimensions.map(dimension => (
                  <div key={dimension.dimensionId} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{dimension.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {HEALTH_DIMENSIONS.find(d => d.id === dimension.dimensionId)?.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: getScoreColor(dimension.averageScore) }}
                        >
                          {dimension.averageScore.toFixed(1)}
                        </div>
                        {dimension.trend === 'improving' && <TrendingUp className="w-5 h-5 text-green-500" />}
                        {dimension.trend === 'declining' && <TrendingUp className="w-5 h-5 text-red-500 rotate-180" />}
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        Red: {dimension.distribution.red}
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                        Yellow: {dimension.distribution.yellow}
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        Green: {dimension.distribution.green}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewType === 'individual' && (() => {
          const allUsers = getAllUsers();
          const teamSessions = getHealthCheckSessions().filter(s => s.teamId === selectedTeam && s.completed);
          const latestDate = teamSessions.length > 0 ? Math.max(...teamSessions.map(s => new Date(s.date).getTime())) : 0;
          const latestSessions = teamSessions.filter(s => new Date(s.date).getTime() === latestDate);

          const toggleDimension = (dimId: string) => {
            const newExpanded = new Set(expandedDimensions);
            if (newExpanded.has(dimId)) {
              newExpanded.delete(dimId);
            } else {
              newExpanded.add(dimId);
            }
            setExpandedDimensions(newExpanded);
          };

          const getScoreBadge = (score: 1 | 2 | 3) => {
            const colors = {
              1: 'bg-red-500',
              2: 'bg-yellow-500',
              3: 'bg-green-500'
            };
            const labels = {
              1: 'Red',
              2: 'Yellow',
              3: 'Green'
            };
            return (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-white text-sm font-medium ${colors[score]}`}>
                {labels[score]}
              </span>
            );
          };

          const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
            if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-600" />;
            if (trend === 'declining') return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
            return <span className="text-blue-600">—</span>;
          };

          return (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Individual Team Member Responses</h3>
                  <p className="text-sm text-gray-500">
                    {latestSessions.length} response{latestSessions.length !== 1 ? 's' : ''}
                    {latestDate > 0 ? ` from ${new Date(latestDate).toLocaleDateString()}` : ''}
                  </p>
                </div>

                {latestSessions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No health check responses yet for this team.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {HEALTH_DIMENSIONS.map(dimension => {
                      const isExpanded = expandedDimensions.has(dimension.id);
                      const dimensionResponses = latestSessions.map(session => ({
                        session,
                        response: session.responses.find(r => r.dimensionId === dimension.id)
                      })).filter(item => item.response);

                      const distribution = {
                        red: dimensionResponses.filter(r => r.response?.score === 1).length,
                        yellow: dimensionResponses.filter(r => r.response?.score === 2).length,
                        green: dimensionResponses.filter(r => r.response?.score === 3).length
                      };

                      return (
                        <div key={dimension.id} className="border rounded-lg overflow-hidden">
                          <div
                            className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleDimension(dimension.id)}
                          >
                            <div className="flex items-center gap-3">
                              <button className="p-1">
                                {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                              </button>
                              <div>
                                <h4 className="font-semibold text-gray-900">{dimension.name}</h4>
                                <p className="text-sm text-gray-500">{dimension.description}</p>
                              </div>
                            </div>
                            <div className="flex gap-3 text-sm">
                              <span className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-red-500 rounded-full" />
                                {distribution.red}
                              </span>
                              <span className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                                {distribution.yellow}
                              </span>
                              <span className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-green-500 rounded-full" />
                                {distribution.green}
                              </span>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-4 space-y-3 bg-white">
                              {dimensionResponses.map(({ session, response }) => {
                                const teamMember = allUsers.find(u => u.id === session.userId);
                                if (!response) return null;

                                return (
                                  <div key={session.id} className="border-l-4 border-gray-200 pl-4 py-2">
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm">
                                          {teamMember?.name.charAt(0) || '?'}
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-900">{teamMember?.name || 'Unknown User'}</p>
                                          <p className="text-sm text-gray-500">{new Date(session.date).toLocaleDateString()}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {getScoreBadge(response.score)}
                                        {getTrendIcon(response.trend)}
                                      </div>
                                    </div>
                                    {response.comment && (
                                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-start gap-2">
                                          <MessageSquare className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                          <p className="text-sm text-gray-700 italic">&quot;{response.comment}&quot;</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {viewType === 'trends' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Health Trend</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="overall"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}