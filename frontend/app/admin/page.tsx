'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/lib/auth';
import { HEALTH_DIMENSIONS } from '@/lib/data';
import { listTeams, TeamSummary } from '@/lib/api/teams';
import { Settings, Users, Calendar, Plus, Edit2, Trash2, LogOut, Shield, Save, X, Building2 } from 'lucide-react';
import HierarchyConfig from '@/components/HierarchyConfig';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'teams' | 'users' | 'settings'>('hierarchy');
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
    } else if (!currentUser.isAdmin) {
      router.push('/survey');
    } else {
      setUser(currentUser);
    }
  }, [router]);

  // Fetch teams when activeTab changes to 'teams'
  useEffect(() => {
    if (activeTab === 'teams' && teams.length === 0) {
      setTeamsLoading(true);
      listTeams()
        .then((data) => setTeams(data.teams))
        .catch((err) => console.error('Failed to load teams:', err))
        .finally(() => setTeamsLoading(false));
    }
  }, [activeTab, teams.length]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSaveTeam = (team: any) => {
    // In a real app, this would update the backend
    console.log('Saving team:', team);
    setEditingTeam(null);
    setShowNewTeamForm(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500">System Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Administrator</p>
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
        <div className="flex gap-4 mb-8 border-b">
          <button
            data-testid="hierarchy-tab"
            onClick={() => setActiveTab('hierarchy')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'hierarchy'
                ? 'text-indigo-600 border-indigo-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Hierarchy
            </div>
          </button>
          <button
            data-testid="teams-tab"
            onClick={() => setActiveTab('teams')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'teams'
                ? 'text-indigo-600 border-indigo-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Teams
            </div>
          </button>
          <button
            data-testid="users-tab"
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'users'
                ? 'text-indigo-600 border-indigo-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users
            </div>
          </button>
          <button
            data-testid="settings-tab"
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'settings'
                ? 'text-indigo-600 border-indigo-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </div>
          </button>
        </div>

        {activeTab === 'hierarchy' && (
          <HierarchyConfig />
        )}

        {activeTab === 'teams' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Manage Teams</h2>
              <button
                data-testid="add-team"
                onClick={() => setShowNewTeamForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Team
              </button>
            </div>

            {showNewTeamForm && (
              <div className="bg-white p-6 rounded-xl shadow-sm border mb-6" data-testid="create-team-form">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">New Team</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
                    <input
                      type="text"
                      name="name"
                      id="team-name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter team name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cadence</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                      <option>Select Manager</option>
                      <option>Manager User</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Next Check Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => handleSaveTeam({})}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save Team
                  </button>
                  <button
                    onClick={() => setShowNewTeamForm(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {teamsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading teams...</p>
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No teams found. Add your first team to get started.
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full" data-testid="teams-list">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cadence</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Check Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Lead</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {teams.map(team => (
                      <tr key={team.id} data-testid="team-row">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{team.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {team.cadence}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {team.nextCheckDate || 'Not scheduled'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Users className="w-4 h-4" />
                            {team.memberCount}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {team.teamLeadName || 'Not assigned'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingTeam(team)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Manage Users</h2>
              <button
                data-testid="add-user"
                onClick={() => setShowNewUserForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add User
              </button>
            </div>

            {showNewUserForm && (
              <div className="bg-white p-6 rounded-xl shadow-sm border mb-6" data-testid="create-user-form">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">New User</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                    <input
                      type="text"
                      name="username"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select name="role" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                      <option value="level-5">Team Member</option>
                      <option value="level-4">Team Lead</option>
                      <option value="level-3">Manager</option>
                      <option value="level-2">Director</option>
                      <option value="level-1">VP</option>
                      <option value="level-admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setShowNewUserForm(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save User
                  </button>
                  <button
                    onClick={() => setShowNewUserForm(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {editingUser && (
              <div className="bg-white p-6 rounded-xl shadow-sm border mb-6" data-testid="edit-user-form">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      defaultValue={editingUser.name}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                    <input
                      type="text"
                      name="username"
                      defaultValue={editingUser.username}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={editingUser.email}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select name="role" defaultValue={editingUser.role} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                      <option value="level-5">Team Member</option>
                      <option value="level-4">Team Lead</option>
                      <option value="level-3">Manager</option>
                      <option value="level-2">Director</option>
                      <option value="level-1">VP</option>
                      <option value="level-admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full" data-testid="users-list">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr data-testid="user-row">
                    <td className="px-6 py-4">Demo User</td>
                    <td className="px-6 py-4">demo</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm" data-testid="role-badge">Team Member</span>
                    </td>
                    <td className="px-6 py-4">Phoenix Squad</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          data-testid="edit-user"
                          onClick={() => setEditingUser({ name: 'Demo User', username: 'demo', email: 'demo@example.com', role: 'level-5' })}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-900">Delete</button>
                      </div>
                    </td>
                  </tr>
                  <tr data-testid="user-row">
                    <td className="px-6 py-4">Manager User</td>
                    <td className="px-6 py-4">manager</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm" data-testid="role-badge">Manager</span>
                    </td>
                    <td className="px-6 py-4">All Teams</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          data-testid="edit-user"
                          onClick={() => setEditingUser({ name: 'Manager User', username: 'manager', email: 'manager@example.com', role: 'level-3' })}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-900">Delete</button>
                      </div>
                    </td>
                  </tr>
                  <tr data-testid="user-row">
                    <td className="px-6 py-4">Admin User</td>
                    <td className="px-6 py-4">admin</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm" data-testid="role-badge">Admin</span>
                    </td>
                    <td className="px-6 py-4">-</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          data-testid="edit-user"
                          onClick={() => setEditingUser({ name: 'Admin User', username: 'admin', email: 'admin@example.com', role: 'level-admin' })}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button className="text-gray-400 cursor-not-allowed">Delete</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">System Settings</h2>

            <div className="space-y-6">
              <div data-testid="dimensions-settings">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Health Dimensions Configuration</h3>
                <div className="space-y-3">
                  {HEALTH_DIMENSIONS.map(dimension => (
                    <div key={dimension.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid="dimension-row">
                      <div>
                        <p className="font-medium text-gray-900">{dimension.name}</p>
                        <p className="text-sm text-gray-500">{dimension.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-indigo-600 hover:text-indigo-900">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div data-testid="notifications-settings">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" defaultChecked />
                    <span>Send email reminders for upcoming health checks</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" defaultChecked />
                    <span>Notify managers when team health declines</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" />
                    <span>Send weekly summary reports</span>
                  </label>
                </div>
              </div>

              <div data-testid="retention-settings">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Data Retention Policy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Keep health check data for</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                      <option>6 months</option>
                      <option defaultValue="selected">1 year</option>
                      <option>2 years</option>
                      <option>Forever</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Export format</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                      <option>CSV</option>
                      <option>JSON</option>
                      <option>Excel</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  Save Settings
                </button>
                <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}