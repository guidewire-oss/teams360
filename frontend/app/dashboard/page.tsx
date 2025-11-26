'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/lib/auth';
import { TEAMS_DATA, generateMockHealthSessions, calculateAggregatedMetrics } from '@/lib/teams-data';
import { getOrgConfig, getUserPermissions, getHierarchyLevel } from '@/lib/org-config';
import HierarchicalDashboard from '@/components/HierarchicalDashboard';
import { LogOut, Users, Activity, TrendingUp, Calendar, Building2, ChevronDown } from 'lucide-react';
import { User } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
      // Generate mock health sessions
      const mockSessions = generateMockHealthSessions();
      setSessions(mockSessions);
      // Note: In the new architecture, users should be fetched from API
      // For now, using empty array as getAllUsers has been removed
      setAllUsers([]);
    }
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  const config = getOrgConfig();
  const permissions = getUserPermissions(user);
  const userLevel = getHierarchyLevel(user.hierarchyLevelId || '');

  // Get teams and metrics based on user's position in hierarchy
  const getRelevantTeams = () => {
    if (permissions.canViewAllTeams) {
      return TEAMS_DATA;
    }
    
    // Find all users reporting to current user (recursively)
    const subordinates = new Set<string>();
    const findSubordinates = (userId: string) => {
      allUsers.forEach(u => {
        if (u.reportsTo === userId) {
          subordinates.add(u.id);
          findSubordinates(u.id);
        }
      });
    };
    findSubordinates(user.id);
    
    // Get teams managed by subordinates or user
    return TEAMS_DATA.filter(team => 
      team.supervisorChain.some(s => s.userId === user.id || subordinates.has(s.userId))
    );
  };

  const relevantTeams = getRelevantTeams();
  const metrics = calculateAggregatedMetrics(relevantTeams, sessions);

  // Calculate health score color
  const getHealthColor = (score: number) => {
    const percentage = (score / 3) * 100;
    if (percentage >= 66) return 'text-green-600 bg-green-50';
    if (percentage >= 33) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
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
                <h1 className="text-2xl font-bold text-gray-900">
                  {userLevel?.name} Dashboard
                </h1>
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
                        <span className="text-gray-500">Reports To:</span>
                        <span className="font-medium">
                          {user.reportsTo ? allUsers.find(u => u.id === user.reportsTo)?.name : 'None'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Teams:</span>
                        <span className="font-medium">{relevantTeams.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total Members:</span>
                        <span className="font-medium">{metrics.totalMembers}</span>
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
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">{metrics.totalTeams}</span>
            </div>
            <p className="text-gray-600">Teams</p>
            <p className="text-xs text-gray-500 mt-1">
              {permissions.canViewAllTeams ? 'All Teams' : 'Your Teams'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">{metrics.totalMembers}</span>
            </div>
            <p className="text-gray-600">Total Members</p>
            <p className="text-xs text-gray-500 mt-1">Across all teams</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-green-600" />
              <span className={`text-2xl font-bold px-2 py-1 rounded ${getHealthColor(metrics.avgHealth)}`}>
                {((metrics.avgHealth / 3) * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-gray-600">Overall Health</p>
            <p className="text-xs text-gray-500 mt-1">Average score</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-emerald-600" />
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900">{metrics.trends.improving}</span>
                <div className="flex gap-2 text-xs">
                  <span className="text-blue-600">{metrics.trends.stable} stable</span>
                  <span className="text-red-600">{metrics.trends.declining} declining</span>
                </div>
              </div>
            </div>
            <p className="text-gray-600">Improving</p>
            <p className="text-xs text-gray-500 mt-1">Trend direction</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900">
                {(metrics.participation * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-gray-600">Participation</p>
            <p className="text-xs text-gray-500 mt-1">Last check</p>
          </div>
        </div>

        {/* Organizational View */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Organizational Health View</h2>
            <div className="text-sm text-gray-500">
              Showing {relevantTeams.length} teams under your hierarchy
            </div>
          </div>
          
          <HierarchicalDashboard
            currentUser={user}
            users={allUsers}
            teams={relevantTeams}
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session, idx) => {
              const team = TEAMS_DATA.find(t => t.id === session.teamId);
              const user = allUsers.find(u => u.id === session.userId);
              return (
                <div key={idx} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{team?.name}</p>
                    <p className="text-sm text-gray-500">
                      Health check completed by {user?.name || 'Unknown'} on {new Date(session.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {session.responses.length} dimensions assessed
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}