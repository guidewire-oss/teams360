'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, authenticatedFetch } from '@/lib/auth';
import { HEALTH_DIMENSIONS } from '@/lib/data';
import { getOrgConfig, getHierarchyLevel } from '@/lib/org-config';
import { LogOut, Building2, ChevronDown, BarChart3, LineChart as LineChartIcon, Users as UsersIcon, Activity, ClipboardList, CheckCircle, AlertCircle, Grid3X3 } from 'lucide-react';
import { getTeamSubmissionStatus, getAssessmentPeriods, TeamSubmissionStatus } from '@/lib/api/health-checks';
import { API_BASE_URL } from '@/lib/api/client';
import { getAssessmentPeriod, toCadence } from '@/lib/assessment-period';
import { getTeamInfoCached } from '@/lib/api/teams';
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
  surveyType?: string;
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
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [assessmentPeriodOptions, setAssessmentPeriodOptions] = useState<string[]>([]);
  const [submissionStatus, setSubmissionStatus] = useState<TeamSubmissionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [responseView, setResponseView] = useState<'person' | 'dimension'>('person');
  const [teamOptions, setTeamOptions] = useState<{id: string, name: string}[]>([]);

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
      fetchDashboardData(firstTeamId, '');
      // Fetch team info for cadence, then compute current period for submission status
      getTeamInfoCached(firstTeamId)
        .then((teamInfo) => {
          const currentPeriod = getAssessmentPeriod(new Date(), toCadence(teamInfo.cadence));
          return getTeamSubmissionStatus(firstTeamId, currentPeriod);
        })
        .catch(() => {
          // Fallback: use default cadence if team info fetch fails
          const currentPeriod = getAssessmentPeriod(new Date());
          return getTeamSubmissionStatus(firstTeamId, currentPeriod);
        })
        .then(setSubmissionStatus)
        .catch((err) => console.error('Failed to fetch submission status:', err));

      // Fetch team names for multi-team selector
      if (currentUser.teamIds.length > 1) {
        Promise.all(
          currentUser.teamIds.map((tid: string) =>
            getTeamInfoCached(tid).then(info => ({ id: info.id, name: info.name })).catch(() => ({ id: tid, name: tid }))
          )
        ).then(setTeamOptions);
      }
    } else {
      setLoading(false);
    }
  }, [router]);

  // Fetch assessment period options from database
  useEffect(() => {
    getAssessmentPeriods()
      .then(setAssessmentPeriodOptions)
      .catch((err) => console.error('Failed to fetch assessment periods:', err));
  }, []);

  const fetchDashboardData = async (teamId: string, assessmentPeriod: string) => {
    try {
      setLoading(true);
      setError(null);

      // Build query string for assessment period filter
      const periodQuery = assessmentPeriod ? `?assessmentPeriod=${encodeURIComponent(assessmentPeriod)}` : '';

      // Fetch health summary for radar chart
      const healthRes = await authenticatedFetch(`${API_BASE_URL}/api/v1/teams/${teamId}/dashboard/health-summary${periodQuery}`);
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
      } else if (healthRes.status >= 500) {
        setError('Unable to load dashboard data. Please refresh the page.');
      }

      // Fetch response distribution
      const distRes = await authenticatedFetch(`${API_BASE_URL}/api/v1/teams/${teamId}/dashboard/response-distribution${periodQuery}`);
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
      } else if (distRes.status >= 500) {
        setError('Unable to load dashboard data. Please refresh the page.');
      }

      // Fetch individual responses
      const respRes = await authenticatedFetch(`${API_BASE_URL}/api/v1/teams/${teamId}/dashboard/individual-responses${periodQuery}`);
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
            surveyType?: string;
            dimensions: { dimensionId: string; score: number; trend: string; comment: string }[];
          }) => ({
            sessionId: r.sessionId,
            userId: r.userId,
            userName: r.userName,
            date: r.date,
            surveyType: r.surveyType || 'individual',
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
      } else if (respRes.status >= 500) {
        setError('Unable to load dashboard data. Please refresh the page.');
      }

      // Fetch trends (trends don't filter by period - they show all periods)
      const trendsRes = await authenticatedFetch(`${API_BASE_URL}/api/v1/teams/${teamId}/dashboard/trends`);
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
      } else if (trendsRes.status >= 500) {
        setError('Unable to load dashboard data. Please refresh the page.');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Unable to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    if (teamId) {
      fetchDashboardData(teamId, period);
    }
  };

  const handleTeamChange = (newTeamId: string) => {
    // Clear stale data before switching so a failed reload doesn't show old team's data
    setHealthSummary([]);
    setDistribution([]);
    setIndividualResponses([]);
    setTrends([]);
    setSubmissionStatus(null);
    setError(null);
    setTeamId(newTeamId);
    setSelectedPeriod('');
    fetchDashboardData(newTeamId, '');
    // Re-fetch submission status for the new team
    getTeamInfoCached(newTeamId)
      .then((teamInfo) => {
        const currentPeriod = getAssessmentPeriod(new Date(), toCadence(teamInfo.cadence));
        return getTeamSubmissionStatus(newTeamId, currentPeriod);
      })
      .catch(() => {
        const currentPeriod = getAssessmentPeriod(new Date());
        return getTeamSubmissionStatus(newTeamId, currentPeriod);
      })
      .then(setSubmissionStatus)
      .catch((err) => console.error('Failed to fetch submission status:', err));
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

  const getScoreBgColor = (score: number) => {
    if (score === 3) return 'bg-green-500';
    if (score === 2) return 'bg-yellow-400';
    return 'bg-red-500';
  };

  const getTrendSymbol = (trend: string) => {
    if (trend === 'improving') return '↑';
    if (trend === 'declining') return '↓';
    return '→';
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'improving') return 'text-green-600';
    if (trend === 'declining') return 'text-red-600';
    return 'text-gray-500';
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
                <div className="flex items-center gap-2">
                  <p className="text-gray-500">{config.companyName} Health Metrics</p>
                  {teamOptions.length > 1 && (
                    <select
                      data-testid="team-selector"
                      value={teamId}
                      onChange={(e) => handleTeamChange(e.target.value)}
                      className="ml-2 px-2 py-1 text-sm border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {teamOptions.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Take Survey Button */}
              <button
                onClick={() => router.push(teamId ? `/survey?team=${teamId}` : '/survey')}
                data-testid="take-survey-button"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                Take Survey
              </button>

              {/* Post-Workshop Survey Button */}
              {submissionStatus?.postWorkshopExists ? (
                <span
                  data-testid="post-workshop-submitted-badge"
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200"
                >
                  <CheckCircle className="w-4 h-4" />
                  Workshop Submitted
                </span>
              ) : (
                <button
                  onClick={() => router.push(teamId ? `/survey?type=post_workshop&team=${teamId}` : '/survey?type=post_workshop')}
                  data-testid="post-workshop-survey-button"
                  title="Record your team's workshop consensus"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-amber-500 text-white hover:bg-amber-600"
                >
                  <ClipboardList className="w-4 h-4" />
                  Post-Workshop Survey
                </button>
              )}

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
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Periods</option>
              {assessmentPeriodOptions.map((period) => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>
          </div>
        </div>

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

          {/* Error Banner */}
          {error && (
            <div data-testid="dashboard-error-banner" className="mx-6 mt-4 flex items-center gap-2 text-red-700 text-sm bg-red-50 border border-red-200 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

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
                  <div data-testid="radar-chart-section">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Health Overview</h2>
                    {healthSummary.length > 0 ? (
                      <div data-testid="radar-chart" style={{ width: '100%', height: 500 }}>
                      <ResponsiveContainer width="100%" height={500}>
                        <RadarChart data={healthSummary}>
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
                      <p className="text-gray-500 text-center py-12">No health data available</p>
                    )}
                  </div>
                )}

                {/* Distribution Tab */}
                {activeTab === 'distribution' && (
                  <div data-testid="distribution-chart-section">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Response Distribution</h2>
                    {distribution.length > 0 ? (
                      <div data-testid="distribution-chart" style={{ width: '100%', height: 500 }}>
                      <ResponsiveContainer width="100%" height={500}>
                        <BarChart data={distribution}>
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
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-12">No distribution data available</p>
                    )}
                  </div>
                )}

                {/* Individual Responses Tab */}
                {activeTab === 'responses' && (
                  <div data-testid="responses-section">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Individual Team Responses</h2>
                      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        <button
                          data-testid="view-by-person-btn"
                          onClick={() => setResponseView('person')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            responseView === 'person'
                              ? 'bg-white text-indigo-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <UsersIcon className="w-3.5 h-3.5" />
                          By Person
                        </button>
                        <button
                          data-testid="view-by-dimension-btn"
                          onClick={() => setResponseView('dimension')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            responseView === 'dimension'
                              ? 'bg-white text-indigo-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Grid3X3 className="w-3.5 h-3.5" />
                          By Dimension
                        </button>
                      </div>
                    </div>

                    {individualResponses.length > 0 ? (
                      <>
                        {/* Person View (existing card layout) */}
                        {responseView === 'person' && (
                          <div className="space-y-4">
                            {individualResponses.map((response, idx) => (
                              <div key={idx} className="border rounded-lg p-4" data-testid="response-card">
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-3">
                                    <h3 className="font-semibold text-gray-900">{response.userName}</h3>
                                    {response.surveyType === 'post_workshop' ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                        Post-Workshop
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Individual
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500">
                                    {new Date(response.date).toLocaleDateString()}
                                  </p>
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
                        )}

                        {/* Dimension Matrix View */}
                        {responseView === 'dimension' && (
                          <div data-testid="dimension-matrix" className="overflow-x-auto">
                            <table className="min-w-full border-collapse">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r">
                                    Member
                                  </th>
                                  {HEALTH_DIMENSIONS.map((dim) => (
                                    <th
                                      key={dim.id}
                                      data-testid={`matrix-header-${dim.id}`}
                                      className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b whitespace-nowrap"
                                    >
                                      {dim.name}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {individualResponses.map((response, idx) => {
                                  const dimMap = new Map(
                                    response.responses.map((r) => [r.dimensionId, r])
                                  );
                                  return (
                                    <tr
                                      key={idx}
                                      data-testid={`matrix-row-${response.sessionId}`}
                                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                                    >
                                      <td className="sticky left-0 z-10 px-4 py-3 border-r whitespace-nowrap" style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                                        <div className="font-medium text-sm text-gray-900">{response.userName}</div>
                                        <div className="text-xs text-gray-500">{new Date(response.date).toLocaleDateString()}</div>
                                      </td>
                                      {HEALTH_DIMENSIONS.map((dim) => {
                                        const resp = dimMap.get(dim.id);
                                        if (!resp) {
                                          return (
                                            <td key={dim.id} className="px-3 py-3 text-center">
                                              <span className="text-gray-300">—</span>
                                            </td>
                                          );
                                        }
                                        return (
                                          <td
                                            key={dim.id}
                                            data-testid={`matrix-cell-${response.sessionId}-${dim.id}`}
                                            className="px-3 py-3 text-center"
                                          >
                                            <div className="relative flex items-center justify-center gap-1 group">
                                              <span
                                                data-testid={`matrix-score-${response.sessionId}-${dim.id}`}
                                                className={`inline-flex items-center justify-center w-7 h-7 rounded text-white text-xs font-bold ${getScoreBgColor(resp.score)}`}
                                              >
                                                {getScoreLabel(resp.score).charAt(0)}
                                              </span>
                                              <span
                                                data-testid={`matrix-trend-${response.sessionId}-${dim.id}`}
                                                className={`text-sm font-bold ${getTrendColor(resp.trend)}`}
                                              >
                                                {getTrendSymbol(resp.trend)}
                                              </span>
                                              {resp.comment && (
                                                <button
                                                  type="button"
                                                  data-testid={`matrix-comment-${response.sessionId}-${dim.id}`}
                                                  className="text-xs cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-500 rounded"
                                                  aria-label="View comment"
                                                >
                                                  💬
                                                </button>
                                              )}
                                              {resp.comment && (
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block group-focus-within:block z-50 w-56 p-2 text-xs text-left text-white bg-gray-800 rounded-lg shadow-lg whitespace-pre-wrap">
                                                  {resp.comment}
                                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                                                </div>
                                              )}
                                            </div>
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500 text-center py-12">No individual responses available</p>
                    )}
                  </div>
                )}

                {/* Trends Tab */}
                {activeTab === 'trends' && (
                  <div data-testid="trends-chart-section">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Health Trends Over Time</h2>
                    {trends.length > 0 ? (
                      <div data-testid="trends-chart" style={{ width: '100%', height: 500 }}>
                      <ResponsiveContainer width="100%" height={500}>
                        <LineChart data={trends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis domain={[0, 3]} />
                          <Tooltip />
                          <Legend />
                          {HEALTH_DIMENSIONS.map((dim, idx) => (
                            <Line
                              key={dim.id}
                              type="monotone"
                              dataKey={dim.id}
                              name={dim.name}
                              stroke={`hsl(${idx * 30}, 70%, 50%)`}
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}