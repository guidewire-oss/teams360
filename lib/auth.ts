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
  {
    id: 'lead5',
    username: 'teamlead5',
    password: 'demo',
    name: 'Carlos Mendez (Team Lead)',
    hierarchyLevelId: 'level-4',
    reportsTo: 'mgr3',
    teamIds: ['team5'],
    isAdmin: false
  },
  {
    id: 'lead6',
    username: 'teamlead6',
    password: 'demo',
    name: 'Sophie Zhang (Team Lead)',
    hierarchyLevelId: 'level-4',
    reportsTo: 'mgr1',
    teamIds: ['team6'],
    isAdmin: false
  },
  {
    id: 'lead7',
    username: 'teamlead7',
    password: 'demo',
    name: 'Marcus Johnson (Team Lead)',
    hierarchyLevelId: 'level-4',
    reportsTo: 'mgr2',
    teamIds: ['team7'],
    isAdmin: false
  },
  {
    id: 'lead8',
    username: 'teamlead8',
    password: 'demo',
    name: 'Elena Volkov (Team Lead)',
    hierarchyLevelId: 'level-4',
    reportsTo: 'mgr3',
    teamIds: ['team8'],
    isAdmin: false
  },
  {
    id: 'lead9',
    username: 'teamlead9',
    password: 'demo',
    name: 'Raj Sharma (Team Lead)',
    hierarchyLevelId: 'level-4',
    reportsTo: 'mgr2',
    teamIds: ['team9'],
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
  { id: 'mem4', username: 'charlie', password: 'demo', name: 'Charlie Davis', hierarchyLevelId: 'level-5', reportsTo: 'lead1', teamIds: ['team1'], isAdmin: false },
  { id: 'mem5', username: 'diana', password: 'demo', name: 'Diana Prince', hierarchyLevelId: 'level-5', reportsTo: 'lead1', teamIds: ['team1'], isAdmin: false },
  { id: 'mem6', username: 'ethan', password: 'demo', name: 'Ethan Hunt', hierarchyLevelId: 'level-5', reportsTo: 'lead2', teamIds: ['team2'], isAdmin: false },
  { id: 'mem7', username: 'fiona', password: 'demo', name: 'Fiona Green', hierarchyLevelId: 'level-5', reportsTo: 'lead2', teamIds: ['team2'], isAdmin: false },
  { id: 'mem8', username: 'george', password: 'demo', name: 'George Wilson', hierarchyLevelId: 'level-5', reportsTo: 'lead2', teamIds: ['team2'], isAdmin: false },
  { id: 'mem9', username: 'hannah', password: 'demo', name: 'Hannah Baker', hierarchyLevelId: 'level-5', reportsTo: 'lead2', teamIds: ['team2'], isAdmin: false },
  { id: 'mem10', username: 'ian', password: 'demo', name: 'Ian Malcolm', hierarchyLevelId: 'level-5', reportsTo: 'lead2', teamIds: ['team2'], isAdmin: false },
  { id: 'mem11', username: 'julia', password: 'demo', name: 'Julia Roberts', hierarchyLevelId: 'level-5', reportsTo: 'lead3', teamIds: ['team3'], isAdmin: false },
  { id: 'mem12', username: 'kevin', password: 'demo', name: 'Kevin Hart', hierarchyLevelId: 'level-5', reportsTo: 'lead3', teamIds: ['team3'], isAdmin: false },
  { id: 'mem13', username: 'laura', password: 'demo', name: 'Laura Palmer', hierarchyLevelId: 'level-5', reportsTo: 'lead3', teamIds: ['team3'], isAdmin: false },
  { id: 'mem14', username: 'michael', password: 'demo', name: 'Michael Scott', hierarchyLevelId: 'level-5', reportsTo: 'lead3', teamIds: ['team3'], isAdmin: false },
  { id: 'mem15', username: 'nancy', password: 'demo', name: 'Nancy Drew', hierarchyLevelId: 'level-5', reportsTo: 'lead3', teamIds: ['team3'], isAdmin: false },
  { id: 'mem16', username: 'oliver', password: 'demo', name: 'Oliver Queen', hierarchyLevelId: 'level-5', reportsTo: 'lead4', teamIds: ['team4'], isAdmin: false },
  { id: 'mem17', username: 'peter', password: 'demo', name: 'Peter Parker', hierarchyLevelId: 'level-5', reportsTo: 'lead4', teamIds: ['team4'], isAdmin: false },
  { id: 'mem18', username: 'quinn', password: 'demo', name: 'Quinn Fabray', hierarchyLevelId: 'level-5', reportsTo: 'lead4', teamIds: ['team4'], isAdmin: false },
  { id: 'mem19', username: 'rachel', password: 'demo', name: 'Rachel Green', hierarchyLevelId: 'level-5', reportsTo: 'lead4', teamIds: ['team4'], isAdmin: false },
  { id: 'mem20', username: 'steve', password: 'demo', name: 'Steve Rogers', hierarchyLevelId: 'level-5', reportsTo: 'lead4', teamIds: ['team4'], isAdmin: false },
  { id: 'mem21', username: 'tony', password: 'demo', name: 'Tony Stark', hierarchyLevelId: 'level-5', reportsTo: 'lead5', teamIds: ['team5'], isAdmin: false },
  { id: 'mem22', username: 'ursula', password: 'demo', name: 'Ursula Minor', hierarchyLevelId: 'level-5', reportsTo: 'lead5', teamIds: ['team5'], isAdmin: false },
  { id: 'mem23', username: 'victor', password: 'demo', name: 'Victor Stone', hierarchyLevelId: 'level-5', reportsTo: 'lead5', teamIds: ['team5'], isAdmin: false },
  { id: 'mem24', username: 'wendy', password: 'demo', name: 'Wendy Darling', hierarchyLevelId: 'level-5', reportsTo: 'lead5', teamIds: ['team5'], isAdmin: false },
  { id: 'mem25', username: 'xavier', password: 'demo', name: 'Xavier Woods', hierarchyLevelId: 'level-5', reportsTo: 'lead5', teamIds: ['team5'], isAdmin: false },
  { id: 'mem26', username: 'yara', password: 'demo', name: 'Yara Greyjoy', hierarchyLevelId: 'level-5', reportsTo: 'lead6', teamIds: ['team6'], isAdmin: false },
  { id: 'mem27', username: 'zack', password: 'demo', name: 'Zack Morris', hierarchyLevelId: 'level-5', reportsTo: 'lead6', teamIds: ['team6'], isAdmin: false },
  { id: 'mem28', username: 'amber', password: 'demo', name: 'Amber Rose', hierarchyLevelId: 'level-5', reportsTo: 'lead6', teamIds: ['team6'], isAdmin: false },
  { id: 'mem29', username: 'blake', password: 'demo', name: 'Blake Shelton', hierarchyLevelId: 'level-5', reportsTo: 'lead6', teamIds: ['team6'], isAdmin: false },
  { id: 'mem30', username: 'crystal', password: 'demo', name: 'Crystal Reed', hierarchyLevelId: 'level-5', reportsTo: 'lead6', teamIds: ['team6'], isAdmin: false },
  { id: 'mem31', username: 'derek', password: 'demo', name: 'Derek Hale', hierarchyLevelId: 'level-5', reportsTo: 'lead7', teamIds: ['team7'], isAdmin: false },
  { id: 'mem32', username: 'elena', password: 'demo', name: 'Elena Gilbert', hierarchyLevelId: 'level-5', reportsTo: 'lead7', teamIds: ['team7'], isAdmin: false },
  { id: 'mem33', username: 'finn', password: 'demo', name: 'Finn Hudson', hierarchyLevelId: 'level-5', reportsTo: 'lead7', teamIds: ['team7'], isAdmin: false },
  { id: 'mem34', username: 'gina', password: 'demo', name: 'Gina Linetti', hierarchyLevelId: 'level-5', reportsTo: 'lead7', teamIds: ['team7'], isAdmin: false },
  { id: 'mem35', username: 'henry', password: 'demo', name: 'Henry Mills', hierarchyLevelId: 'level-5', reportsTo: 'lead7', teamIds: ['team7'], isAdmin: false },
  { id: 'mem36', username: 'iris', password: 'demo', name: 'Iris West', hierarchyLevelId: 'level-5', reportsTo: 'lead8', teamIds: ['team8'], isAdmin: false },
  { id: 'mem37', username: 'jack', password: 'demo', name: 'Jack Shephard', hierarchyLevelId: 'level-5', reportsTo: 'lead8', teamIds: ['team8'], isAdmin: false },
  { id: 'mem38', username: 'kate', password: 'demo', name: 'Kate Austen', hierarchyLevelId: 'level-5', reportsTo: 'lead8', teamIds: ['team8'], isAdmin: false },
  { id: 'mem39', username: 'luke', password: 'demo', name: 'Luke Skywalker', hierarchyLevelId: 'level-5', reportsTo: 'lead8', teamIds: ['team8'], isAdmin: false },
  { id: 'mem40', username: 'mia', password: 'demo', name: 'Mia Wallace', hierarchyLevelId: 'level-5', reportsTo: 'lead8', teamIds: ['team8'], isAdmin: false },
  { id: 'mem41', username: 'noah', password: 'demo', name: 'Noah Calhoun', hierarchyLevelId: 'level-5', reportsTo: 'lead9', teamIds: ['team9'], isAdmin: false },
  { id: 'mem42', username: 'olivia', password: 'demo', name: 'Olivia Pope', hierarchyLevelId: 'level-5', reportsTo: 'lead9', teamIds: ['team9'], isAdmin: false },
  { id: 'mem43', username: 'paul', password: 'demo', name: 'Paul Atreides', hierarchyLevelId: 'level-5', reportsTo: 'lead9', teamIds: ['team9'], isAdmin: false },
  { id: 'mem44', username: 'queenie', password: 'demo', name: 'Queenie Goldstein', hierarchyLevelId: 'level-5', reportsTo: 'lead9', teamIds: ['team9'], isAdmin: false },
  { id: 'mem45', username: 'ryan', password: 'demo', name: 'Ryan Reynolds', hierarchyLevelId: 'level-5', reportsTo: 'lead9', teamIds: ['team9'], isAdmin: false },

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