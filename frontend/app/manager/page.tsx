'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/lib/auth';
import { User } from '@/lib/types';
import { LogOut, Users, ChevronDown, AlertCircle } from 'lucide-react';

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

export default function ManagerPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [dashboardData, setDashboardData] = useState<ManagerDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

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

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    if (user) {
      fetchDashboardData(user.id, period);
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
            </select>
          </div>
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
        {!loading && !error && dashboardData && dashboardData.teams.length === 0 && (
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

        {/* Team Health Cards */}
        {!loading && !error && dashboardData && dashboardData.teams.length > 0 && (
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

        {/* Summary Stats */}
        {!loading && !error && dashboardData && dashboardData.teams.length > 0 && (
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
      </div>
    </div>
  );
}
