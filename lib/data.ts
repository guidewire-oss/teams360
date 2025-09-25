import { Team, HealthDimension, HealthCheckSession, TeamHealthSummary } from './types';

export const HEALTH_DIMENSIONS: HealthDimension[] = [
  {
    id: 'mission',
    name: 'Mission',
    description: 'We know exactly why we are here, and we are really excited about it',
    goodDescription: 'We know exactly why we are here, and we are really excited about it',
    badDescription: 'We have no idea why we are here. There is no high level picture or focus.'
  },
  {
    id: 'value',
    name: 'Delivering Value',
    description: 'We deliver great stuff! We are proud of it and our stakeholders are really happy',
    goodDescription: 'We deliver great stuff! We are proud of it and our stakeholders are really happy',
    badDescription: 'We deliver crap. We are ashamed to deliver it. Our stakeholders hate us.'
  },
  {
    id: 'speed',
    name: 'Speed',
    description: 'We get stuff done really quickly. No waiting, no delays',
    goodDescription: 'We get stuff done really quickly. No waiting, no delays',
    badDescription: 'We never seem to get anything done. We keep getting stuck or interrupted.'
  },
  {
    id: 'fun',
    name: 'Fun',
    description: 'We love going to work, and have great fun working together',
    goodDescription: 'We love going to work, and have great fun working together',
    badDescription: 'Boooooooring'
  },
  {
    id: 'health',
    name: 'Health of Codebase',
    description: 'Our code is clean, easy to read, and has great test coverage',
    goodDescription: 'Our code is clean, easy to read, and has great test coverage',
    badDescription: 'Our code is a pile of dung, and technical debt is raging out of control'
  },
  {
    id: 'learning',
    name: 'Learning',
    description: 'We are learning lots of interesting stuff all the time',
    goodDescription: 'We are learning lots of interesting stuff all the time',
    badDescription: 'We never have time to learn anything'
  },
  {
    id: 'support',
    name: 'Support',
    description: 'We always get great support & help when we ask for it',
    goodDescription: 'We always get great support & help when we ask for it',
    badDescription: 'We keep getting stuck because we cannot get the support & help that we ask for'
  },
  {
    id: 'pawns',
    name: 'Pawns or Players',
    description: 'We are in control of our destiny! We decide what to build and how to build it',
    goodDescription: 'We are in control of our destiny! We decide what to build and how to build it',
    badDescription: 'We are just pawns in a game of chess, with no influence over what we build or how we build it'
  }
];

export const TEAMS: Team[] = [
  {
    id: 'team1',
    name: 'Phoenix Squad',
    cadence: 'quarterly',
    nextCheckDate: '2024-03-31',
    members: ['1', '3', '4', '5'],
    managerId: '3'
  },
  {
    id: 'team2',
    name: 'Dragon Squad',
    cadence: 'monthly',
    nextCheckDate: '2024-02-01',
    members: ['6', '7', '8'],
    managerId: '3'
  },
  {
    id: 'team3',
    name: 'Titan Squad',
    cadence: 'quarterly',
    nextCheckDate: '2024-03-31',
    members: ['9', '10', '11'],
    managerId: '3'
  }
];

// Mock data storage (in a real app, this would be a database)
let healthCheckSessions: HealthCheckSession[] = [
  {
    id: 'session1',
    teamId: 'team1',
    userId: '1',
    date: '2024-01-15',
    completed: true,
    responses: [
      { dimensionId: 'mission', score: 3, trend: 'stable' },
      { dimensionId: 'value', score: 2, trend: 'improving' },
      { dimensionId: 'speed', score: 2, trend: 'stable' },
      { dimensionId: 'fun', score: 3, trend: 'stable' },
      { dimensionId: 'health', score: 1, trend: 'declining' },
      { dimensionId: 'learning', score: 2, trend: 'improving' },
      { dimensionId: 'support', score: 3, trend: 'stable' },
      { dimensionId: 'pawns', score: 2, trend: 'stable' }
    ]
  }
];

export const saveHealthCheckSession = (session: HealthCheckSession) => {
  healthCheckSessions.push(session);
  localStorage.setItem('healthCheckSessions', JSON.stringify(healthCheckSessions));
};

export const getHealthCheckSessions = (): HealthCheckSession[] => {
  const stored = localStorage.getItem('healthCheckSessions');
  if (stored) {
    healthCheckSessions = JSON.parse(stored);
  }
  return healthCheckSessions;
};

export const getTeamHealthSummary = (teamId: string): TeamHealthSummary | null => {
  const team = TEAMS.find(t => t.id === teamId);
  if (!team) return null;
  
  const sessions = getHealthCheckSessions().filter(s => s.teamId === teamId && s.completed);
  if (sessions.length === 0) return null;
  
  const latestDate = Math.max(...sessions.map(s => new Date(s.date).getTime()));
  const latestSessions = sessions.filter(s => new Date(s.date).getTime() === latestDate);
  
  const dimensions = HEALTH_DIMENSIONS.map(dim => {
    const responses = latestSessions.flatMap(s => s.responses.filter(r => r.dimensionId === dim.id));
    const scores = responses.map(r => r.score);
    
    return {
      dimensionId: dim.id,
      name: dim.name,
      averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      distribution: {
        red: scores.filter(s => s === 1).length,
        yellow: scores.filter(s => s === 2).length,
        green: scores.filter(s => s === 3).length
      },
      trend: responses[0]?.trend || 'stable' as const
    };
  });
  
  return {
    teamId,
    teamName: team.name,
    date: new Date(latestDate).toISOString().split('T')[0],
    dimensions
  };
};