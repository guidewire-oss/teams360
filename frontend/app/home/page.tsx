'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, User } from '@/lib/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LogOut, TrendingUp, Calendar, Users, BarChart3, Loader2, AlertCircle, FileText } from 'lucide-react';

interface SurveyHistoryEntry {
  sessionId: string;
  teamId: string;
  teamName: string;
  date: string;
  assessmentPeriod: string;
  avgScore: number;
  responseCount: number;
  completed: boolean;
}

interface SurveyHistoryResponse {
  userId: string;
  surveys: SurveyHistoryEntry[];
  totalSurveys: number;
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [historyData, setHistoryData] = useState<SurveyHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
      fetchSurveyHistory(currentUser.id);
    }
  }, [router]);

  const fetchSurveyHistory = async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/users/${userId}/survey-history`);

      if (!response.ok) {
        throw new Error(`Failed to fetch survey history: ${response.statusText}`);
      }

      const data: SurveyHistoryResponse = await response.json();
      setHistoryData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching survey history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Calculate health score color based on avg score (1-3 scale)
  const getHealthColor = (score: number) => {
    if (score >= 2.5) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 1.5) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getHealthColorBadge = (score: number) => {
    if (score >= 2.5) return 'bg-green-100 text-green-800';
    if (score >= 1.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatHealthScore = (score: number) => {
    return score.toFixed(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Prepare trend chart data - group by assessment period
  const getTrendChartData = () => {
    if (!historyData || historyData.surveys.length === 0) return [];

    // Group surveys by assessment period and calculate average
    const periodMap = new Map<string, { sum: number; count: number }>();

    historyData.surveys.forEach(survey => {
      const existing = periodMap.get(survey.assessmentPeriod) || { sum: 0, count: 0 };
      periodMap.set(survey.assessmentPeriod, {
        sum: existing.sum + survey.avgScore,
        count: existing.count + 1
      });
    });

    // Convert to chart data format
    const chartData = Array.from(periodMap.entries()).map(([period, data]) => ({
      period,
      avgScore: data.sum / data.count
    }));

    // Sort by period (chronologically)
    return chartData.sort((a, b) => {
      // Extract year and half from period (e.g., "2024 - 1st Half")
      const parseYear = (p: string) => {
        const match = p.match(/(\d{4})/);
        return match ? parseInt(match[1]) : 0;
      };
      const parseHalf = (p: string) => p.includes('1st') ? 1 : 2;

      const yearA = parseYear(a.period);
      const yearB = parseYear(b.period);

      if (yearA !== yearB) return yearA - yearB;
      return parseHalf(a.period) - parseHalf(b.period);
    });
  };

  // Check if trend is improving
  const isImprovingTrend = () => {
    const chartData = getTrendChartData();
    if (chartData.length < 2) return false;

    const firstScore = chartData[0].avgScore;
    const lastScore = chartData[chartData.length - 1].avgScore;
    return lastScore > firstScore;
  };

  if (!user) return null;

  const isTeamLead = user.hierarchyLevelId === 'level-4' ||
                      user.hierarchyLevelId === 'level-3' ||
                      user.hierarchyLevelId === 'level-2' ||
                      user.hierarchyLevelId === 'level-1';
  const trendData = getTrendChartData();
  const improving = isImprovingTrend();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Health Check Dashboard</h1>
              <p className="text-gray-500">Personal Survey History & Trends</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">
                  {user.hierarchyLevelId === 'level-1' ? 'VP' :
                   user.hierarchyLevelId === 'level-2' ? 'Director' :
                   user.hierarchyLevelId === 'level-3' ? 'Manager' :
                   user.hierarchyLevelId === 'level-4' ? 'Team Lead' :
                   'Team Member'}
                </p>
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
        {/* Action Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => router.push('/survey')}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            <FileText className="w-5 h-5" />
            Take New Survey
          </button>

          {isTeamLead && (
            <button
              onClick={() => router.push('/manager')}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
            >
              <BarChart3 className="w-5 h-5" />
              Team Dashboard
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <Loader2 className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading your survey history...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-300 rounded-xl p-6 flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading History</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && historyData && historyData.surveys.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Surveys Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't submitted any health check surveys yet. Get started by taking your first survey!
            </p>
            <button
              onClick={() => router.push('/survey')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              Take Your First Survey
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && historyData && historyData.surveys.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Trend Chart - Takes 2 columns on large screens */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Personal Health Trend</h2>
                  <p className="text-sm text-gray-600">Average scores across assessment periods</p>
                </div>
                {improving && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                    Improving
                  </div>
                )}
              </div>

              <div data-testid="personal-trend-chart" className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      domain={[1, 3]}
                      ticks={[1, 1.5, 2, 2.5, 3]}
                      label={{ value: 'Health Score', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatHealthScore(value), 'Avg Score']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avgScore"
                      stroke="#4F46E5"
                      strokeWidth={3}
                      name="Health Score"
                      dot={{ fill: '#4F46E5', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary Stats - Takes 1 column on large screens */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Summary</h2>

              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <div className="text-sm text-indigo-700 font-medium mb-1">Total Surveys</div>
                  <div className="text-3xl font-bold text-indigo-900">{historyData.totalSurveys}</div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-700 font-medium mb-1">Latest Score</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {formatHealthScore(historyData.surveys[0].avgScore)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {historyData.surveys[0].assessmentPeriod}
                  </div>
                </div>

                {trendData.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-700 font-medium mb-1">Overall Average</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatHealthScore(
                        trendData.reduce((sum, d) => sum + d.avgScore, 0) / trendData.length
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Across {trendData.length} {trendData.length === 1 ? 'period' : 'periods'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Survey History - Full width */}
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Survey History</h2>

              <div data-testid="survey-history" className="space-y-3">
                {historyData.surveys.map((survey) => (
                  <div
                    key={survey.sessionId}
                    data-testid="survey-entry"
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <Users className="w-5 h-5 text-gray-400" />
                        <h3 className="font-semibold text-gray-900">{survey.teamName}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 ml-8">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(survey.date)}
                        </div>
                        <div className="text-gray-500">
                          {survey.assessmentPeriod}
                        </div>
                        <div className="text-gray-500">
                          {survey.responseCount} {survey.responseCount === 1 ? 'response' : 'responses'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`inline-flex items-center px-4 py-2 rounded-lg font-bold text-2xl border-2 ${getHealthColor(survey.avgScore)}`}>
                        {formatHealthScore(survey.avgScore)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {((survey.avgScore / 3) * 100).toFixed(0)}% health
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
