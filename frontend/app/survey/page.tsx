'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/lib/auth';
import { HEALTH_DIMENSIONS, TEAMS } from '@/lib/data';
import { HealthCheckResponse } from '@/lib/types';
import { getAssessmentPeriod } from '@/lib/assessment-period';
import { submitHealthCheck, formatDateForAPI, HealthCheckAPIError } from '@/lib/api/health-checks';
import { TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, Save, LogOut, CheckCircle, BarChart3, Loader2, AlertCircle } from 'lucide-react';

export default function SurveyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [currentDimension, setCurrentDimension] = useState(0); // Start at first health dimension
  const [responses, setResponses] = useState<HealthCheckResponse[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
    }
  }, [router]);

  const handleScoreSelect = (score: 1 | 2 | 3) => {
    const dimension = HEALTH_DIMENSIONS[currentDimension];
    const existingIndex = responses.findIndex(r => r.dimensionId === dimension.id);
    
    const newResponse: HealthCheckResponse = {
      dimensionId: dimension.id,
      score,
      trend: 'stable',
      comment: ''
    };

    if (existingIndex >= 0) {
      const newResponses = [...responses];
      newResponses[existingIndex] = newResponse;
      setResponses(newResponses);
    } else {
      setResponses([...responses, newResponse]);
    }
  };

  const handleTrendSelect = (trend: 'improving' | 'stable' | 'declining') => {
    const dimension = HEALTH_DIMENSIONS[currentDimension];
    const existingIndex = responses.findIndex(r => r.dimensionId === dimension.id);
    
    if (existingIndex >= 0) {
      const newResponses = [...responses];
      newResponses[existingIndex].trend = trend;
      setResponses(newResponses);
    }
  };

  const handleCommentChange = (comment: string) => {
    const dimension = HEALTH_DIMENSIONS[currentDimension];
    const existingIndex = responses.findIndex(r => r.dimensionId === dimension.id);
    
    if (existingIndex >= 0) {
      const newResponses = [...responses];
      newResponses[existingIndex].comment = comment;
      setResponses(newResponses);
    }
  };

  const getCurrentResponse = () => {
    const dimension = HEALTH_DIMENSIONS[currentDimension];
    return responses.find(r => r.dimensionId === dimension.id);
  };

  const handleNext = () => {
    if (currentDimension < HEALTH_DIMENSIONS.length - 1) {
      setCurrentDimension(currentDimension + 1);
    }
  };

  const handlePrevious = () => {
    if (currentDimension > 0) {
      setCurrentDimension(currentDimension - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const userTeamId = user.teamIds && user.teamIds.length > 0 ? user.teamIds[0] : 'team1';

      // Automatically determine assessment period based on submission date
      const submissionDate = new Date();
      const assessmentPeriod = getAssessmentPeriod(submissionDate);

      // Submit to backend API
      const session = await submitHealthCheck({
        teamId: userTeamId,
        userId: user.id,
        date: formatDateForAPI(submissionDate),
        assessmentPeriod,
        responses: responses.map(r => ({
          dimensionId: r.dimensionId,
          score: r.score,
          trend: r.trend,
          comment: r.comment || ''
        })),
        completed: true
      });

      // Store session ID for success page
      setSessionId(session.id);
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit health check:', err);

      if (err instanceof HealthCheckAPIError) {
        setError(err.message || 'Failed to submit your responses. Please try again.');
      } else {
        setError('An unexpected error occurred. Please check your connection and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;
  
  if (submitted) {
    const isTeamLead = user.hierarchyLevelId === 'level-4';
    const dashboardPath = isTeamLead ? '/manager' : '/survey';

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md w-full text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
          <p className="text-gray-600 mb-4">Your health check responses have been submitted successfully.</p>
          {sessionId && (
            <p className="text-sm text-gray-500 mb-8 font-mono">Session ID: {sessionId}</p>
          )}
          <button
            onClick={() => router.push(dashboardPath)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            {isTeamLead ? 'Back to Team Dashboard' : 'Back to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  const totalQuestions = HEALTH_DIMENSIONS.length; // Total health dimensions
  const currentQuestionNumber = currentDimension + 1; // +1 for display (1-indexed)
  const progress = (currentQuestionNumber / totalQuestions) * 100;
  const isLastDimension = currentDimension === HEALTH_DIMENSIONS.length - 1;
  const canSubmit = responses.length === HEALTH_DIMENSIONS.length;

  const dimension = HEALTH_DIMENSIONS[currentDimension];
  const currentResponse = getCurrentResponse();

  const userTeamId = user.teamIds && user.teamIds.length > 0 ? user.teamIds[0] : null;
  const team = TEAMS.find(t => t.id === userTeamId);
  const isTeamLead = user.hierarchyLevelId === 'level-4';

  // Get current quarter and year
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const currentYear = now.getFullYear();
  const surveyPeriod = `Q${currentQuarter} ${currentYear}`;

  // Get next check date for the team
  const nextCheckDate = team?.nextCheckDate ? new Date(team.nextCheckDate) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-indigo-600 p-6 text-white">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold">Squad Health Check</h1>
                <p className="text-indigo-200">Team: {team?.name || 'Unknown Team'}</p>
                <p className="text-indigo-100 text-sm mt-1">
                  Period: {surveyPeriod}
                  {team?.cadence && ` • ${team.cadence.charAt(0).toUpperCase() + team.cadence.slice(1)} Check`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-indigo-200">Logged in as</p>
                <p className="font-semibold">{user.name}</p>
                <div className="mt-2 flex flex-col gap-1">
                  {isTeamLead && (
                    <button
                      onClick={() => router.push('/manager')}
                      className="flex items-center gap-1 text-sm text-indigo-200 hover:text-white transition-colors"
                    >
                      <BarChart3 className="w-4 h-4" />
                      View Team Dashboard
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-sm text-indigo-200 hover:text-white transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
            <div className="w-full bg-indigo-800 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm mt-2 text-indigo-200">
              Question {currentQuestionNumber} of {totalQuestions}
            </p>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{dimension?.name}</h2>
              <p className="text-gray-600 text-lg">{dimension?.description}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <button
                onClick={() => handleScoreSelect(1)}
                data-dimension={dimension.id}
                data-score="1"
                className={`p-6 rounded-xl border-2 transition-all ${
                  currentResponse?.score === 1
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                }`}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500" />
                <h3 className="font-bold text-red-900 mb-2">Red</h3>
                <p className="text-sm text-gray-600">{dimension.badDescription}</p>
              </button>

              <button
                onClick={() => handleScoreSelect(2)}
                data-dimension={dimension.id}
                data-score="2"
                className={`p-6 rounded-xl border-2 transition-all ${
                  currentResponse?.score === 2
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                }`}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-yellow-500" />
                <h3 className="font-bold text-yellow-900 mb-2">Yellow</h3>
                <p className="text-sm text-gray-600">Some problems, but we are working on it</p>
              </button>

              <button
                onClick={() => handleScoreSelect(3)}
                data-dimension={dimension.id}
                data-score="3"
                className={`p-6 rounded-xl border-2 transition-all ${
                  currentResponse?.score === 3
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500" />
                <h3 className="font-bold text-green-900 mb-2">Green</h3>
                <p className="text-sm text-gray-600">{dimension.goodDescription}</p>
              </button>
            </div>

            {currentResponse?.score && (
              <div className="mb-8 p-6 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-4">Trend</h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleTrendSelect('improving')}
                    data-dimension={dimension.id}
                    data-trend="improving"
                    className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                      currentResponse?.trend === 'improving'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5" />
                    Improving
                  </button>
                  <button
                    onClick={() => handleTrendSelect('stable')}
                    data-dimension={dimension.id}
                    data-trend="stable"
                    className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                      currentResponse?.trend === 'stable'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <Minus className="w-5 h-5" />
                    Stable
                  </button>
                  <button
                    onClick={() => handleTrendSelect('declining')}
                    data-dimension={dimension.id}
                    data-trend="declining"
                    className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                      currentResponse?.trend === 'declining'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <TrendingDown className="w-5 h-5" />
                    Declining
                  </button>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments (optional)
                  </label>
                  <textarea
                    value={currentResponse?.comment || ''}
                    onChange={(e) => handleCommentChange(e.target.value)}
                    data-dimension={dimension.id}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={3}
                    placeholder="Add any additional context..."
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900 mb-1">Submission Failed</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentDimension === 0 || submitting}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                  currentDimension === 0 || submitting
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              {isLastDimension ? (
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                  type="submit"
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                    canSubmit && !submitting
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Submit Responses
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!currentResponse?.score || submitting}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                    currentResponse?.score && !submitting
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}