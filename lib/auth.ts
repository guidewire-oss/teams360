import { User } from './types';
import Cookies from 'js-cookie';

// Mock users with complete hierarchy
export const USERS: User[] = [
  // VP Level
  { 
    id: 'vp1', 
    username: 'vp', 
    password: 'demo', 
    name: 'Sarah Johnson (VP)', 
    email: 'sarah@company.com',
    hierarchyLevelId: 'level-1',
    teamIds: [],
    isAdmin: false
  },
  
  // Director Level
  { 
    id: 'dir1', 
    username: 'director1', 
    password: 'demo', 
    name: 'Mike Chen (Director)', 
    email: 'mike@company.com',
    hierarchyLevelId: 'level-2',
    reportsTo: 'vp1',
    teamIds: [],
    isAdmin: false
  },
  { 
    id: 'dir2', 
    username: 'director2', 
    password: 'demo', 
    name: 'Lisa Anderson (Director)', 
    email: 'lisa@company.com',
    hierarchyLevelId: 'level-2',
    reportsTo: 'vp1',
    teamIds: [],
    isAdmin: false
  },
  
  // Manager Level
  { 
    id: 'mgr1', 
    username: 'manager1', 
    password: 'demo', 
    name: 'John Smith (Manager)', 
    email: 'john@company.com',
    hierarchyLevelId: 'level-3',
    reportsTo: 'dir1',
    teamIds: [],
    isAdmin: false
  },
  { 
    id: 'mgr2', 
    username: 'manager2', 
    password: 'demo', 
    name: 'Emma Wilson (Manager)', 
    email: 'emma@company.com',
    hierarchyLevelId: 'level-3',
    reportsTo: 'dir1',
    teamIds: [],
    isAdmin: false
  },
  { 
    id: 'mgr3', 
    username: 'manager3', 
    password: 'demo', 
    name: 'David Brown (Manager)', 
    email: 'david@company.com',
    hierarchyLevelId: 'level-3',
    reportsTo: 'dir2',
    teamIds: [],
    isAdmin: false
  },
  
  // Team Lead Level
  { 
    id: 'lead1', 
    username: 'teamlead1', 
    password: 'demo', 
    name: 'Alex Turner (Team Lead)', 
    hierarchyLevelId: 'level-4',
    reportsTo: 'mgr1',
    teamIds: ['team1'],
    isAdmin: false
  },
  { 
    id: 'lead2', 
    username: 'teamlead2', 
    password: 'demo', 
    name: 'Maria Rodriguez (Team Lead)', 
    hierarchyLevelId: 'level-4',
    reportsTo: 'mgr1',
    teamIds: ['team2'],
    isAdmin: false
  },
  { 
    id: 'lead3', 
    username: 'teamlead3', 
    password: 'demo', 
    name: 'James Lee (Team Lead)', 
    hierarchyLevelId: 'level-4',
    reportsTo: 'mgr2',
    teamIds: ['team3'],
    isAdmin: false
  },
  { 
    id: 'lead4', 
    username: 'teamlead4', 
    password: 'demo', 
    name: 'Nina Patel (Team Lead)', 
    hierarchyLevelId: 'level-4',
    reportsTo: 'mgr3',
    teamIds: ['team4'],
    isAdmin: false
  },
  
  // Team Members
  { 
    id: 'mem1', 
    username: 'demo', 
    password: 'demo', 
    name: 'Demo User (Team Member)', 
    hierarchyLevelId: 'level-5',
    reportsTo: 'lead1',
    teamIds: ['team1'],
    isAdmin: false
  },
  { 
    id: 'mem2', 
    username: 'alice', 
    password: 'demo', 
    name: 'Alice Cooper', 
    hierarchyLevelId: 'level-5',
    reportsTo: 'lead1',
    teamIds: ['team1'],
    isAdmin: false
  },
  { 
    id: 'mem3', 
    username: 'bob', 
    password: 'demo', 
    name: 'Bob Martin', 
    hierarchyLevelId: 'level-5',
    reportsTo: 'lead1',
    teamIds: ['team1'],
    isAdmin: false
  },
  
  // Admin
  { 
    id: 'admin1', 
    username: 'admin', 
    password: 'admin', 
    name: 'System Admin', 
    hierarchyLevelId: 'admin',
    teamIds: [],
    isAdmin: true
  },
];

export const authenticate = (username: string, password: string): User | null => {
  const user = USERS.find(u => u.username === username && u.password === password);
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    Cookies.set('user', JSON.stringify(userWithoutPassword), { expires: 1 });
    return userWithoutPassword as User;
  }
  return null;
};

export const getCurrentUser = (): User | null => {
  const userCookie = Cookies.get('user');
  if (userCookie) {
    try {
      return JSON.parse(userCookie);
    } catch {
      return null;
    }
  }
  return null;
};

export const logout = () => {
  Cookies.remove('user');
};

export const isAuthenticated = (): boolean => {
  return !!getCurrentUser();
};

export const getAllUsers = (): User[] => {
  return USERS;
};