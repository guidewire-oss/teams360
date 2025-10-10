'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticate } from '@/lib/auth';
import { getOrgConfig } from '@/lib/org-config';
import { Lock, User, AlertCircle, Users, ChevronRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const config = getOrgConfig();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = authenticate(username, password);

    if (user) {
      // Route based on permissions
      if (user.isAdmin) {
        router.push('/admin');
      } else if (user.hierarchyLevelId === 'level-5') {
        // Team members go to survey
        router.push('/survey');
      } else if (user.hierarchyLevelId === 'level-4') {
        // Team leads go to manager page with individual responses
        router.push('/manager');
      } else {
        // VPs, Directors, Managers go to hierarchical dashboard
        router.push('/dashboard');
      }
    } else {
      setError('Invalid username or password');
    }
  };

  const quickLogin = (username: string, password: string) => {
    setUsername(username);
    setPassword(password);
    const user = authenticate(username, password);
    if (user) {
      if (user.isAdmin) {
        router.push('/admin');
      } else if (user.hierarchyLevelId === 'level-5') {
        router.push('/survey');
      } else if (user.hierarchyLevelId === 'level-4') {
        // Team leads go to manager page with individual responses
        router.push('/manager');
      } else {
        router.push('/dashboard');
      }
    }
  };

  const hierarchyLogins = [
    { level: 'Vice President', username: 'vp', password: 'demo', color: '#7C3AED', description: 'Full organizational view' },
    { level: 'Directors', users: [
      { username: 'director1', password: 'demo', name: 'Mike Chen' },
      { username: 'director2', password: 'demo', name: 'Lisa Anderson' }
    ], color: '#2563EB', description: 'Department overview' },
    { level: 'Managers', users: [
      { username: 'manager1', password: 'demo', name: 'John Smith' },
      { username: 'manager2', password: 'demo', name: 'Emma Wilson' },
      { username: 'manager3', password: 'demo', name: 'David Brown' }
    ], color: '#059669', description: 'Team management' },
    { level: 'Team Leads', users: [
      { username: 'teamlead1', password: 'demo', name: 'Phoenix Squad' },
      { username: 'teamlead2', password: 'demo', name: 'Dragon Squad' },
      { username: 'teamlead3', password: 'demo', name: 'Titan Squad' },
      { username: 'teamlead4', password: 'demo', name: 'Falcon Squad' }
    ], color: '#EA580C', description: 'Team health tracking' },
    { level: 'Team Members', username: 'demo', password: 'demo', color: '#6B7280', description: 'Submit health checks' },
    { level: 'Administrator', username: 'admin', password: 'admin', color: '#DC2626', description: 'System configuration' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Login Form */}
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                  <Lock className="w-8 h-8 text-indigo-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Team Health Check</h1>
                <p className="text-gray-500 mt-2">Sign in to continue</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter username"
                      required
                    />
                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter password"
                      required
                    />
                    <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Sign In
                </button>
              </form>
            </div>

            {/* Quick Login Options */}
            <div className="bg-gray-50 p-8 border-l">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Login - Organizational Hierarchy</h3>
              <div className="space-y-3">
                {hierarchyLogins.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-semibold text-gray-700">{item.level}</span>
                      <span className="text-xs text-gray-500">- {item.description}</span>
                    </div>
                    
                    {item.username ? (
                      <button
                        onClick={() => quickLogin(item.username, item.password)}
                        className="w-full text-left px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{item.username}/{item.password}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                        </div>
                      </button>
                    ) : item.users ? (
                      <div className="grid grid-cols-1 gap-1">
                        {item.users.map((user, idx) => (
                          <button
                            key={idx}
                            onClick={() => quickLogin(user.username, user.password)}
                            className="text-left px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-sm font-medium">{user.name}</span>
                                <span className="text-xs text-gray-500 ml-2">({user.username})</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Demo Mode:</strong> All passwords are "demo" except admin (admin/admin)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}