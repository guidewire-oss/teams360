'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, User } from '@/lib/auth';
import { HEALTH_DIMENSIONS } from '@/lib/data';
import { LogOut, Users, ChevronDown, AlertCircle, Activity, LineChart as LineChartIcon } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Types matching backend API response
interface DimensionSummary {
  dimensionId: string;
  avgScore: number;
  responseCount: number;
}

interface TeamHealthSummary {
  teamId: string;
  teamName: string;
  overallHealth: number;
  submissionCount: number;
  dimensions: DimensionSummary[];
}

interface ManagerDashboardResponse {
  managerId: string;
  teams: TeamHealthSummary[];
  totalTeams: number;
  assessmentPeriod?: string;
}

interface RadarData {
  dimension: string;
  averageScore: number;
}

interface TrendData {
  period: string;
  [key: string]: string | number;
}

type TabView = 'teams' | 'hierarchy' | 'summary' | 'comparison' | 'radar' | 'trends';

export default function ManagerPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [dashboardData, setDashboardData] = useState<ManagerDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabView>('teams');
  const [selectedTeamsForComparison, setSelectedTeamsForComparison] = useState<string[]>([]);

  // Radar and Trends data states
  const [radarData, setRadarData] = useState<RadarData[]>([]);
  const [trendsData, setTrendsData] = useState<TrendData[]>([]);
  const [radarLoading, setRadarLoading] = useState(false);
  const [trendsLoading, setTrendsLoading] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
      fetchDashboardData(currentUser.id, '');
    }
  }, [router]);

  const fetchDashboardData = async (managerId: string, assessmentPeriod: string) => {
    setLoading(true);
    setError(null);

    try {
      const url = assessmentPeriod
        ? `/api/v1/managers/${managerId}/teams/health?assessmentPeriod=${encodeURIComponent(assessmentPeriod)}`
        : `/api/v1/managers/${managerId}/teams/health`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      const data: ManagerDashboardResponse = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRadarData = async (managerId: string, assessmentPeriod: string) => {
    setRadarLoading(true);
    try {
      const url = assessmentPeriod
        ? `/api/v1/managers/${managerId}/dashboard/radar?assessmentPeriod=${encodeURIComponent(assessmentPeriod)}`
        : `/api/v1/managers/${managerId}/dashboard/radar`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Transform backend format to frontend format
        // Backend: { dimensions: [{ dimensionId, avgScore, responseCount }] }
        // Frontend: [{ dimension, averageScore }]
        if (data.dimensions && Array.isArray(data.dimensions)) {
          const transformed = data.dimensions.map((d: DimensionSummary) => {
            const dimInfo = HEALTH_DIMENSIONS.find(hd => hd.id === d.dimensionId);
            return {
              dimension: dimInfo?.name || d.dimensionId,
              averageScore: d.avgScore,
            };
          });
          setRadarData(transformed);
        } else {
          setRadarData([]);
        }
      }
    } catch (error) {
      console.error('Error fetching radar data:', error);
      setRadarData([]);
    } finally {
      setRadarLoading(false);
    }
  };

  const fetchTrendsData = async (managerId: string) => {
    setTrendsLoading(true);
    try {
      const response = await fetch(`/api/v1/managers/${managerId}/dashboard/trends`);
      if (response.ok) {
        const data = await response.json();
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
          setTrendsData(transformed);
        } else {
          setTrendsData([]);
        }
      }
    } catch (error) {
      console.error('Error fetching trends data:', error);
      setTrendsData([]);
    } finally {
      setTrendsLoading(false);
    }
  };

  // Fetch radar/trends data when tab changes
  useEffect(() => {
    if (user && activeTab === 'radar') {
      fetchRadarData(user.id, selectedPeriod);
    } else if (user && activeTab === 'trends') {
      fetchTrendsData(user.id);
    }
  }, [user, activeTab, selectedPeriod]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    if (user) {
      fetchDashboardData(user.id, period);
      if (activeTab === 'radar') {
        fetchRadarData(user.id, period);
      }
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Calculate health score color and percentage
  const getHealthColor = (score: number) => {
    const percentage = (score / 3) * 100;
    if (percentage >= 66) return 'bg-green-100 text-green-800 border-green-300';
    if (percentage >= 33) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const formatHealthScore = (score: number) => {
    return score.toFixed(1);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
              <p className="text-gray-500">Team Health Overview</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">Manager</p>
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
        {/* Assessment Period Filter */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Team Health Overview</h2>
          <div className="flex items-center gap-2">
            <label htmlFor="period-filter" className="text-sm text-gray-600">
              Assessment Period:
            </label>
            <select
              id="period-filter"
              data-testid="period-filter"
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Periods</option>
              <option value="2024 - 2nd Half">2024 - 2nd Half</option>
              <option value="2024 - 1st Half">2024 - 1st Half</option>
              <option value="2023 - 2nd Half">2023 - 2nd Half</option>
              <option value="2023 - 1st Half">2023 - 1st Half</option>
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('teams')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'teams'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Team Cards
            </button>
            <button
              data-testid="radar-tab"
              onClick={() => setActiveTab('radar')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'radar'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="w-4 h-4" />
              Radar
            </button>
            <button
              data-testid="trends-tab"
              onClick={() => setActiveTab('trends')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'trends'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <LineChartIcon className="w-4 h-4" />
              Trends
            </button>
            <button
              data-testid="hierarchy-tab"
              onClick={() => setActiveTab('hierarchy')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'hierarchy'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Hierarchy View
            </button>
            <button
              data-testid="summary-tab"
              onClick={() => setActiveTab('summary')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'summary'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Summary View
            </button>
            <button
              data-testid="comparison-tab"
              onClick={() => setActiveTab('comparison')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'comparison'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Comparison
            </button>
          </nav>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading team health data...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-300 rounded-xl p-6 flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Dashboard</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && dashboardData && dashboardData.teams.length === 0 && activeTab !== 'radar' && activeTab !== 'trends' && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No teams found</h3>
            <p className="text-gray-600">
              {selectedPeriod
                ? `No teams have submitted health checks for ${selectedPeriod}`
                : 'You are not currently supervising any teams'}
            </p>
          </div>
        )}

        {/* Radar Tab */}
        {!loading && !error && activeTab === 'radar' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Aggregated Health Overview</h3>
            {radarLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : radarData.length > 0 ? (
              <div data-testid="vp-radar-chart">
                <ResponsiveContainer width="100%" height={500}>
                  <RadarChart data={radarData}>
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
              </div>
            ) : (
              <p className="text-gray-500 text-center py-12">No health data available for radar chart</p>
            )}
          </div>
        )}

        {/* Trends Tab */}
        {!loading && !error && activeTab === 'trends' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Health Trends Over Time</h3>
            {trendsLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : trendsData.length > 0 ? (
              <div data-testid="vp-trends-chart">
                <ResponsiveContainer width="100%" height={500}>
                  <LineChart data={trendsData}>
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
              </div>
            ) : (
              <p className="text-gray-500 text-center py-12">No trend data available</p>
            )}
          </div>
        )}

        {/* Team Cards Tab */}
        {!loading && !error && dashboardData && dashboardData.teams.length > 0 && activeTab === 'teams' && (
          <div className="space-y-4">
            {dashboardData.teams.map((team) => (
              <div
                key={team.teamId}
                data-testid="team-health-card"
                className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3
                      data-testid="team-name"
                      className="text-xl font-semibold text-gray-900 mb-2"
                    >
                      {team.teamName}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span data-testid="submission-count">
                        <strong>{team.submissionCount}</strong>{' '}
                        {team.submissionCount === 1 ? 'submission' : 'submissions'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Overall Health</div>
                    <div
                      data-testid="team-health-score"
                      className={`text-3xl font-bold px-4 py-2 rounded-lg border-2 ${getHealthColor(
                        team.overallHealth
                      )}`}
                    >
                      {formatHealthScore(team.overallHealth)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {((team.overallHealth / 3) * 100).toFixed(0)}% health
                    </div>
                  </div>
                </div>

                {/* Dimension Breakdown */}
                {team.dimensions.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <button
                      data-testid="view-details-button"
                      onClick={() =>
                        setExpandedTeam(expandedTeam === team.teamId ? null : team.teamId)
                      }
                      className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          expandedTeam === team.teamId ? 'rotate-180' : ''
                        }`}
                      />
                      {expandedTeam === team.teamId ? 'Hide' : 'View'} Dimension Details (
                      {team.dimensions.length})
                    </button>

                    {expandedTeam === team.teamId && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {team.dimensions.map((dimension) => (
                          <div
                            key={dimension.dimensionId}
                            className="bg-gray-50 rounded-lg p-3 border"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <h4 className="font-medium text-gray-900 capitalize text-sm">
                                {dimension.dimensionId === 'value'
                                  ? 'Delivering Value'
                                  : dimension.dimensionId}
                              </h4>
                              <span
                                className={`text-lg font-bold px-2 py-1 rounded ${getHealthColor(
                                  dimension.avgScore
                                )}`}
                              >
                                {formatHealthScore(dimension.avgScore)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {dimension.responseCount}{' '}
                              {dimension.responseCount === 1 ? 'response' : 'responses'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* No Dimensions State */}
                {team.dimensions.length === 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500 italic">No dimension data available</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats (only show on team cards tab) */}
        {!loading && !error && dashboardData && dashboardData.teams.length > 0 && activeTab === 'teams' && (
          <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-xl p-6">
            <h3 className="font-semibold text-indigo-900 mb-3">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-indigo-700 font-medium">Total Teams:</span>{' '}
                <span className="text-indigo-900 font-bold">{dashboardData.totalTeams}</span>
              </div>
              <div>
                <span className="text-indigo-700 font-medium">Total Submissions:</span>{' '}
                <span className="text-indigo-900 font-bold">
                  {dashboardData.teams.reduce((sum, t) => sum + t.submissionCount, 0)}
                </span>
              </div>
              <div>
                <span className="text-indigo-700 font-medium">Average Health:</span>{' '}
                <span className="text-indigo-900 font-bold">
                  {dashboardData.teams.length > 0
                    ? formatHealthScore(
                        dashboardData.teams.reduce((sum, t) => sum + t.overallHealth, 0) /
                          dashboardData.teams.length
                      )
                    : 'N/A'}
                </span>
              </div>
            </div>
            {dashboardData.assessmentPeriod && (
              <div className="mt-3 pt-3 border-t border-indigo-200">
                <span className="text-indigo-700 font-medium">Filtered by:</span>{' '}
                <span className="text-indigo-900 font-bold">{dashboardData.assessmentPeriod}</span>
              </div>
            )}
          </div>
        )}

        {/* Hierarchy View Tab */}
        {!loading && !error && activeTab === 'hierarchy' && (
          <div data-testid="hierarchy-tree" className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Organization Hierarchy</h3>

            {/* VP Level */}
            <div className="space-y-4">
              <div data-testid="org-node-vp" className="border-l-4 border-purple-500 pl-4 py-2">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-semibold text-gray-900">VP Level</div>
                    <div className="text-sm text-gray-600">{user?.name || 'Vice President'}</div>
                  </div>
                </div>

                {/* Directors */}
                <div className="mt-4 ml-6 space-y-3">
                  <div data-testid="org-node-director" className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-semibold text-gray-900">Director Level</div>
                          <div className="text-sm text-gray-600">
                            {dashboardData?.teams?.length || 0} team{(dashboardData?.teams?.length || 0) !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      {/* Managers/Teams */}
                      <div className="mt-3 ml-6 space-y-2">
                        {(dashboardData?.teams || []).map((team) => (
                          <div key={team.teamId} className="border-l-4 border-green-500 pl-4 py-1">
                            <div className="flex items-center gap-3">
                              <Users className="w-4 h-4 text-green-600" />
                              <div>
                                <div className="font-medium text-gray-900">{team.teamName}</div>
                                <div className="text-xs text-gray-500">
                                  Health: {formatHealthScore(team.overallHealth)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                </div>
              </div>
            </div>

            {(!dashboardData || dashboardData.teams.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <p>No organizational structure to display</p>
              </div>
            )}
          </div>
        )}

        {/* Summary View Tab */}
        {!loading && !error && activeTab === 'summary' && dashboardData && (
          <div className="space-y-6">
            {/* Overall Health Score */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Overall Health Metrics</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div data-testid="overall-health-score" className="text-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
                  <div className="text-sm text-indigo-700 font-medium mb-2">Overall Health Score</div>
                  <div className={`text-5xl font-bold mb-2 ${
                    dashboardData.teams.length > 0
                      ? getHealthColor(dashboardData.teams.reduce((sum, t) => sum + t.overallHealth, 0) / dashboardData.teams.length).replace('bg-', 'text-').replace('-100', '-600')
                      : 'text-gray-400'
                  }`}>
                    {dashboardData.teams.length > 0
                      ? formatHealthScore(
                          dashboardData.teams.reduce((sum, t) => sum + t.overallHealth, 0) /
                            dashboardData.teams.length
                        )
                      : 'N/A'}
                  </div>
                  <div className="text-sm text-indigo-600">
                    {dashboardData.teams.length > 0
                      ? `${((dashboardData.teams.reduce((sum, t) => sum + t.overallHealth, 0) / dashboardData.teams.length / 3) * 100).toFixed(0)}% health`
                      : 'No data'}
                  </div>
                </div>

                <div data-testid="total-teams" className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <div className="text-sm text-blue-700 font-medium mb-2">Total Teams</div>
                  <div className="text-5xl font-bold text-blue-600 mb-2">
                    {dashboardData.totalTeams}
                  </div>
                  <div className="text-sm text-blue-600">Active teams</div>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <div className="text-sm text-purple-700 font-medium mb-2">Total Submissions</div>
                  <div className="text-5xl font-bold text-purple-600 mb-2">
                    {dashboardData.teams.reduce((sum, t) => sum + t.submissionCount, 0)}
                  </div>
                  <div className="text-sm text-purple-600">Health check responses</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div data-testid="recent-activity" className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>

              {dashboardData.teams.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.teams
                    .sort((a, b) => b.submissionCount - a.submissionCount)
                    .slice(0, 5)
                    .map((team) => (
                      <div key={team.teamId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-gray-600" />
                          <div>
                            <div className="font-medium text-gray-900">{team.teamName}</div>
                            <div className="text-sm text-gray-600">
                              {team.submissionCount} submission{team.submissionCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-lg font-bold ${getHealthColor(team.overallHealth)}`}>
                          {formatHealthScore(team.overallHealth)}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent activity to display</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comparison Tab */}
        {!loading && !error && activeTab === 'comparison' && dashboardData && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Team Comparison</h3>

            {/* Team Selector */}
            <div className="mb-6">
              <label htmlFor="team-selector" className="block text-sm font-medium text-gray-700 mb-2">
                Select teams to compare:
              </label>
              <select
                id="team-selector"
                data-testid="team-selector"
                multiple
                value={selectedTeamsForComparison}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedTeamsForComparison(selected);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                size={Math.min(dashboardData.teams.length, 5)}
              >
                {dashboardData.teams.map((team) => (
                  <option key={team.teamId} value={team.teamId}>
                    {team.teamName} - Health: {formatHealthScore(team.overallHealth)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Hold Ctrl (Cmd on Mac) to select multiple teams</p>
            </div>

            {/* Comparison Table */}
            {selectedTeamsForComparison.length > 0 ? (
              <div data-testid="comparison-table" className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Metric
                      </th>
                      {selectedTeamsForComparison.map((teamId) => {
                        const team = dashboardData.teams.find((t) => t.teamId === teamId);
                        return (
                          <th key={teamId} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {team?.teamName}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Overall Health
                      </td>
                      {selectedTeamsForComparison.map((teamId) => {
                        const team = dashboardData.teams.find((t) => t.teamId === teamId);
                        return (
                          <td key={teamId} className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-lg font-bold ${team ? getHealthColor(team.overallHealth) : ''}`}>
                              {team ? formatHealthScore(team.overallHealth) : 'N/A'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Submissions
                      </td>
                      {selectedTeamsForComparison.map((teamId) => {
                        const team = dashboardData.teams.find((t) => t.teamId === teamId);
                        return (
                          <td key={teamId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {team?.submissionCount || 0}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Dimensions Tracked
                      </td>
                      {selectedTeamsForComparison.map((teamId) => {
                        const team = dashboardData.teams.find((t) => t.teamId === teamId);
                        return (
                          <td key={teamId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {team?.dimensions.length || 0}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Select teams from the dropdown above to compare their metrics</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
