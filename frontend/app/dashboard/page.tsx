'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/lib/auth';
import { HEALTH_DIMENSIONS } from '@/lib/data';
import { getOrgConfig, getHierarchyLevel } from '@/lib/org-config';
import { LogOut, Building2, ChevronDown, BarChart3, LineChart as LineChartIcon, Users as UsersIcon, Activity } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';

type TabType = 'radar' | 'distribution' | 'responses' | 'trends';

interface HealthSummary {
  dimension: string;
  averageScore: number;
}

interface ResponseDistribution {
  dimension: string;
  red: number;
  yellow: number;
  green: number;
}

interface IndividualResponse {
  userId: string;
  userName: string;
  sessionId: string;
  date: string;
  responses: {
    dimensionId: string;
    dimensionName: string;
    score: number;
    trend: string;
    comment: string;
  }[];
}

interface TrendData {
  period: string;
  [key: string]: string | number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('radar');
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [teamId, setTeamId] = useState<string>('');

  // Data states
  const [healthSummary, setHealthSummary] = useState<HealthSummary[]>([]);
  const [distribution, setDistribution] = useState<ResponseDistribution[]>([]);
  const [individualResponses, setIndividualResponses] = useState<IndividualResponse[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);

    // Get the team ID from user's first team
    if (currentUser.teamIds && currentUser.teamIds.length > 0) {
      const firstTeamId = currentUser.teamIds[0];
      setTeamId(firstTeamId);
      fetchDashboardData(firstTeamId);
    } else {
      setLoading(false);
    }
  }, [router]);

  const fetchDashboardData = async (teamId: string) => {
    try {
      setLoading(true);

      // Fetch health summary for radar chart
      const healthRes = await fetch(`/api/v1/teams/${teamId}/dashboard/health-summary`);
      if (healthRes.ok) {
        const data = await healthRes.json();
        // Transform backend format to frontend format
        // Backend: { dimensions: [{ dimensionId, avgScore, responseCount }] }
        // Frontend: [{ dimension, averageScore }]
        if (data.dimensions && Array.isArray(data.dimensions)) {
          const transformed = data.dimensions.map((d: { dimensionId: string; avgScore: number }) => {
            // Find dimension name from HEALTH_DIMENSIONS
            const dimInfo = HEALTH_DIMENSIONS.find(hd => hd.id === d.dimensionId);
            return {
              dimension: dimInfo?.name || d.dimensionId,
              averageScore: d.avgScore,
            };
          });
          setHealthSummary(transformed);
        }
      }

      // Fetch response distribution
      const distRes = await fetch(`/api/v1/teams/${teamId}/dashboard/response-distribution`);
      if (distRes.ok) {
        const data = await distRes.json();
        // Transform backend format to frontend format
        // Backend: { distribution: [{ dimensionId, red, yellow, green }] }
        // Frontend: [{ dimension, red, yellow, green }]
        if (data.distribution && Array.isArray(data.distribution)) {
          const transformed = data.distribution.map((d: { dimensionId: string; red: number; yellow: number; green: number }) => {
            const dimInfo = HEALTH_DIMENSIONS.find(hd => hd.id === d.dimensionId);
            return {
              dimension: dimInfo?.name || d.dimensionId,
              red: d.red,
              yellow: d.yellow,
              green: d.green,
            };
          });
          setDistribution(transformed);
        }
      }

      // Fetch individual responses
      const respRes = await fetch(`/api/v1/teams/${teamId}/dashboard/individual-responses`);
      if (respRes.ok) {
        const data = await respRes.json();
        // Transform backend format to frontend format
        // Backend: { responses: [{ sessionId, userId, userName, date, dimensions: [...] }] }
        // Frontend: [{ sessionId, userId, userName, date, responses: [...] }]
        if (data.responses && Array.isArray(data.responses)) {
          const transformed = data.responses.map((r: {
            sessionId: string;
            userId: string;
            userName: string;
            date: string;
            dimensions: { dimensionId: string; score: number; trend: string; comment: string }[];
          }) => ({
            sessionId: r.sessionId,
            userId: r.userId,
            userName: r.userName,
            date: r.date,
            responses: (r.dimensions || []).map((d) => {
              const dimInfo = HEALTH_DIMENSIONS.find(hd => hd.id === d.dimensionId);
              return {
                dimensionId: d.dimensionId,
                dimensionName: dimInfo?.name || d.dimensionId,
                score: d.score,
                trend: d.trend,
                comment: d.comment || '',
              };
            }),
          }));
          setIndividualResponses(transformed);
        }
      }

      // Fetch trends
      const trendsRes = await fetch(`/api/v1/teams/${teamId}/dashboard/trends`);
      if (trendsRes.ok) {
        const data = await trendsRes.json();
        // Transform backend format to frontend format
        // Backend: { periods: [...], dimensions: [{ dimensionId, scores: [...] }] }
        // Frontend: [{ period, mission: 2.5, value: 3.0, ... }]
        if (data.periods && Array.isArray(data.periods) && data.dimensions) {
          const transformed = data.periods.map((period: string, idx: number) => {
            const row: TrendData = { period };
            (data.dimensions || []).forEach((dim: { dimensionId: string; scores: number[] }) => {
              row[dim.dimensionId] = dim.scores[idx] || 0;
            });
            return row;
          });
          setTrends(transformed);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  const config = getOrgConfig();
  const userLevel = getHierarchyLevel(user.hierarchyLevelId || '');

  // Get score color
  const getScoreColor = (score: number) => {
    if (score === 3) return 'text-green-600';
    if (score === 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score === 3) return 'Green';
    if (score === 2) return 'Yellow';
    return 'Red';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Building2 className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Team Lead Dashboard</h1>
                <p className="text-gray-500">{config.companyName} Health Metrics</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setShowUserInfo(!showUserInfo)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: userLevel?.color }}
                  />
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{userLevel?.name}</p>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showUserInfo && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border p-4 z-10">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Level:</span>
                        <span className="font-medium">{userLevel?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Teams:</span>
                        <span className="font-medium">{user.teamIds?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
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
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="border-b">
            <div className="flex gap-2 p-2">
              <button
                data-testid="radar-tab"
                onClick={() => setActiveTab('radar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'radar'
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Activity className="w-4 h-4" />
                Radar Chart
              </button>
              <button
                data-testid="distribution-tab"
                onClick={() => setActiveTab('distribution')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'distribution'
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Response Distribution
              </button>
              <button
                data-testid="responses-tab"
                onClick={() => setActiveTab('responses')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'responses'
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <UsersIcon className="w-4 h-4" />
                Individual Responses
              </button>
              <button
                data-testid="trends-tab"
                onClick={() => setActiveTab('trends')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'trends'
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <LineChartIcon className="w-4 h-4" />
                Trends
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-gray-500">Loading...</div>
              </div>
            ) : (
              <>
                {/* Radar Chart Tab */}
                {activeTab === 'radar' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Health Overview</h2>
                    {healthSummary.length > 0 ? (
                      <ResponsiveContainer width="100%" height={500}>
                        <RadarChart data={healthSummary} data-testid="radar-chart">
                          <PolarGrid />
                          <PolarAngleAxis dataKey="dimension" />
                          <PolarRadiusAxis domain={[0, 3]} />
                          <Radar
                            name="Health Score"
                            dataKey="averageScore"
                            stroke="#6366f1"
                            fill="#6366f1"
                            fillOpacity={0.6}
                          />
                          <Tooltip />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-gray-500 text-center py-12">No health data available</p>
                    )}
                  </div>
                )}

                {/* Distribution Tab */}
                {activeTab === 'distribution' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Response Distribution</h2>
                    {distribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={500}>
                        <BarChart data={distribution} data-testid="distribution-chart">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="dimension" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="red" fill="#EF4444" name="Red (Poor)" />
                          <Bar dataKey="yellow" fill="#F59E0B" name="Yellow (Medium)" />
                          <Bar dataKey="green" fill="#10B981" name="Green (Good)" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-gray-500 text-center py-12">No distribution data available</p>
                    )}
                  </div>
                )}

                {/* Individual Responses Tab */}
                {activeTab === 'responses' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Individual Team Responses</h2>
                    {individualResponses.length > 0 ? (
                      <div className="space-y-4">
                        {individualResponses.map((response, idx) => (
                          <div key={idx} className="border rounded-lg p-4" data-testid="response-card">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-semibold text-gray-900">{response.userName}</h3>
                                <p className="text-sm text-gray-500">
                                  {new Date(response.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {response.responses.map((resp, respIdx) => (
                                <div key={respIdx} className="bg-gray-50 rounded p-3">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-medium text-gray-700">
                                      {resp.dimensionName}
                                    </span>
                                    <span
                                      className={`text-xs font-semibold px-2 py-1 rounded ${getScoreColor(resp.score)}`}
                                      data-testid="score-indicator"
                                    >
                                      {getScoreLabel(resp.score)}
                                    </span>
                                  </div>
                                  {resp.comment && (
                                    <p className="text-xs text-gray-600 mt-2" data-testid="comment">
                                      {resp.comment}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-12">No individual responses available</p>
                    )}
                  </div>
                )}

                {/* Trends Tab */}
                {activeTab === 'trends' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Health Trends Over Time</h2>
                    {trends.length > 0 ? (
                      <ResponsiveContainer width="100%" height={500}>
                        <LineChart data={trends} data-testid="trends-chart">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis domain={[0, 3]} />
                          <Tooltip />
                          <Legend />
                          {HEALTH_DIMENSIONS.slice(0, 5).map((dim, idx) => (
                            <Line
                              key={dim.id}
                              type="monotone"
                              dataKey={dim.id}
                              name={dim.name}
                              stroke={`hsl(${idx * 60}, 70%, 50%)`}
                              strokeWidth={2}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-gray-500 text-center py-12">No trend data available</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}