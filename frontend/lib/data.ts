import { Team, HealthDimension, HealthCheckSession, TeamHealthSummary } from './types';
import { generateMockHealthSessions } from './teams-data';

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
  },
  {
    id: 'release',
    name: 'Easy to Release',
    description: 'Releasing is simple, safe, painless and mostly automated',
    goodDescription: 'Releasing is simple, safe, painless and mostly automated',
    badDescription: 'Releasing is risky, painful, lots of manual work, and takes forever'
  },
  {
    id: 'process',
    name: 'Suitable Process',
    description: 'Our way of working fits us perfectly',
    goodDescription: 'Our way of working fits us perfectly',
    badDescription: 'Our way of working sucks'
  },
  {
    id: 'teamwork',
    name: 'Teamwork',
    description: 'We are a tight-knit team that works together really well',
    goodDescription: 'We are a tight-knit team that works together really well',
    badDescription: 'We are a bunch of individuals that neither know nor care about what the others are doing'
  }
];

// Team assignments version - increment this when manager assignments change
export const TEAM_ASSIGNMENTS_VERSION = 2;

export const TEAMS: Team[] = [
  {
    id: 'team1',
    name: 'Phoenix Squad',
    cadence: 'quarterly',
    nextCheckDate: '2024-03-31',
    members: ['lead1', 'mem1', 'mem2', 'mem3', 'mem4', 'mem5'],
    managerId: 'mgr1'
  },
  {
    id: 'team2',
    name: 'Dragon Squad',
    cadence: 'monthly',
    nextCheckDate: '2024-02-01',
    members: ['lead2', 'mem6', 'mem7', 'mem8', 'mem9', 'mem10'],
    managerId: 'mgr1'
  },
  {
    id: 'team3',
    name: 'Titan Squad',
    cadence: 'quarterly',
    nextCheckDate: '2024-03-31',
    members: ['lead3', 'mem11', 'mem12', 'mem13', 'mem14', 'mem15'],
    managerId: 'mgr1'
  },
  {
    id: 'team4',
    name: 'Falcon Squad',
    cadence: 'biweekly',
    nextCheckDate: '2024-01-15',
    members: ['lead4', 'mem16', 'mem17', 'mem18', 'mem19', 'mem20'],
    managerId: 'mgr2'
  },
  {
    id: 'team5',
    name: 'Eagle Squad',
    cadence: 'quarterly',
    nextCheckDate: '2024-03-31',
    members: ['lead5', 'mem21', 'mem22', 'mem23', 'mem24', 'mem25'],
    managerId: 'mgr2'
  },
  {
    id: 'team6',
    name: 'Hawk Squad',
    cadence: 'monthly',
    nextCheckDate: '2024-02-15',
    members: ['lead6', 'mem26', 'mem27', 'mem28', 'mem29', 'mem30'],
    managerId: 'mgr2'
  },
  {
    id: 'team7',
    name: 'Raven Squad',
    cadence: 'quarterly',
    nextCheckDate: '2024-03-20',
    members: ['lead7', 'mem31', 'mem32', 'mem33', 'mem34', 'mem35'],
    managerId: 'mgr3'
  },
  {
    id: 'team8',
    name: 'Wolf Squad',
    cadence: 'biweekly',
    nextCheckDate: '2024-01-25',
    members: ['lead8', 'mem36', 'mem37', 'mem38', 'mem39', 'mem40'],
    managerId: 'mgr3'
  },
  {
    id: 'team9',
    name: 'Panther Squad',
    cadence: 'monthly',
    nextCheckDate: '2024-02-10',
    members: ['lead9', 'mem41', 'mem42', 'mem43', 'mem44', 'mem45'],
    managerId: 'mgr3'
  }
];

// Mock data storage (in a real app, this would be a database)
// Manual detailed sessions with comments for demonstration
const MANUAL_DEMO_SESSIONS: HealthCheckSession[] = [
  {
    id: 'session1',
    teamId: 'team1',
    userId: 'mem1',
    date: '2024-01-15',
    completed: true,
    responses: [
      { dimensionId: 'mission', score: 3, trend: 'stable', comment: 'We have a clear vision and everyone is aligned on our goals.' },
      { dimensionId: 'value', score: 2, trend: 'improving', comment: 'Getting better but still some stakeholder concerns about delivery pace.' },
      { dimensionId: 'speed', score: 2, trend: 'stable' },
      { dimensionId: 'fun', score: 3, trend: 'stable', comment: 'Great team dynamic! Love working with everyone here.' },
      { dimensionId: 'health', score: 1, trend: 'declining', comment: 'Technical debt is piling up and we need to address it soon.' },
      { dimensionId: 'learning', score: 2, trend: 'improving', comment: 'More training opportunities lately which is great.' },
      { dimensionId: 'support', score: 3, trend: 'stable' },
      { dimensionId: 'pawns', score: 2, trend: 'stable', comment: 'We have some autonomy but would like more input on product direction.' },
      { dimensionId: 'release', score: 2, trend: 'improving', comment: 'Deployments are getting easier with our new CI/CD pipeline.' },
      { dimensionId: 'process', score: 3, trend: 'stable' },
      { dimensionId: 'teamwork', score: 3, trend: 'stable', comment: 'Team collaboration is excellent!' }
    ]
  },
  {
    id: 'session2',
    teamId: 'team1',
    userId: 'mem2',
    date: '2024-01-15',
    completed: true,
    responses: [
      { dimensionId: 'mission', score: 3, trend: 'improving', comment: 'Our quarterly goals are well communicated.' },
      { dimensionId: 'value', score: 3, trend: 'improving', comment: 'Customers love our recent releases!' },
      { dimensionId: 'speed', score: 2, trend: 'declining', comment: 'Too many meetings slowing us down.' },
      { dimensionId: 'fun', score: 3, trend: 'stable' },
      { dimensionId: 'health', score: 2, trend: 'stable', comment: 'Code quality is okay but could use some refactoring.' },
      { dimensionId: 'learning', score: 3, trend: 'improving', comment: 'Attended 2 great conferences this quarter!' },
      { dimensionId: 'support', score: 2, trend: 'stable', comment: 'Support is available but sometimes delayed.' },
      { dimensionId: 'pawns', score: 3, trend: 'improving' },
      { dimensionId: 'release', score: 3, trend: 'improving', comment: 'One-click deployments are a game changer!' },
      { dimensionId: 'process', score: 2, trend: 'stable' },
      { dimensionId: 'teamwork', score: 3, trend: 'stable' }
    ]
  },
  {
    id: 'session3',
    teamId: 'team1',
    userId: 'mem3',
    date: '2024-01-15',
    completed: true,
    responses: [
      { dimensionId: 'mission', score: 2, trend: 'stable' },
      { dimensionId: 'value', score: 2, trend: 'stable', comment: 'We deliver good work but sometimes miss the mark on expectations.' },
      { dimensionId: 'speed', score: 1, trend: 'declining', comment: 'Constant context switching and dependencies blocking us.' },
      { dimensionId: 'fun', score: 2, trend: 'declining', comment: 'Stress levels are higher than usual.' },
      { dimensionId: 'health', score: 1, trend: 'declining', comment: 'Our test coverage is too low and we have lots of legacy code issues.' },
      { dimensionId: 'learning', score: 2, trend: 'stable' },
      { dimensionId: 'support', score: 3, trend: 'stable', comment: 'Team lead is very supportive and helpful.' },
      { dimensionId: 'pawns', score: 2, trend: 'stable' },
      { dimensionId: 'release', score: 1, trend: 'declining', comment: 'Releases are still very manual and error-prone.' },
      { dimensionId: 'process', score: 2, trend: 'stable', comment: 'Process works but could be streamlined.' },
      { dimensionId: 'teamwork', score: 2, trend: 'declining', comment: 'Some communication gaps between team members.' }
    ]
  },
  // Team 2 (Dragon Squad) Sessions
  {
    id: 'session4',
    teamId: 'team2',
    userId: 'mem6',
    date: '2024-01-20',
    assessmentPeriod: '2024 - 1st Half',
    completed: true,
    responses: [
      { dimensionId: 'mission', score: 3, trend: 'stable', comment: 'Clear mission and objectives.' },
      { dimensionId: 'value', score: 3, trend: 'improving' },
      { dimensionId: 'speed', score: 2, trend: 'stable' },
      { dimensionId: 'fun', score: 3, trend: 'improving', comment: 'Team events have been great!' },
      { dimensionId: 'health', score: 2, trend: 'improving', comment: 'Making progress on technical debt.' },
      { dimensionId: 'learning', score: 3, trend: 'stable' },
      { dimensionId: 'support', score: 2, trend: 'stable' },
      { dimensionId: 'pawns', score: 3, trend: 'stable' },
      { dimensionId: 'release', score: 3, trend: 'improving', comment: 'New CI/CD pipeline is excellent!' },
      { dimensionId: 'process', score: 2, trend: 'stable' },
      { dimensionId: 'teamwork', score: 3, trend: 'stable', comment: 'Great collaboration across the team.' }
    ]
  },
  {
    id: 'session5',
    teamId: 'team2',
    userId: 'mem7',
    date: '2024-01-20',
    assessmentPeriod: '2024 - 1st Half',
    completed: true,
    responses: [
      { dimensionId: 'mission', score: 2, trend: 'stable' },
      { dimensionId: 'value', score: 3, trend: 'stable', comment: 'Delivering good value consistently.' },
      { dimensionId: 'speed', score: 2, trend: 'declining', comment: 'Some delays in recent sprints.' },
      { dimensionId: 'fun', score: 2, trend: 'stable' },
      { dimensionId: 'health', score: 2, trend: 'stable' },
      { dimensionId: 'learning', score: 2, trend: 'improving', comment: 'More learning opportunities now.' },
      { dimensionId: 'support', score: 3, trend: 'stable' },
      { dimensionId: 'pawns', score: 2, trend: 'stable' },
      { dimensionId: 'release', score: 2, trend: 'stable' },
      { dimensionId: 'process', score: 3, trend: 'stable', comment: 'Process works well for us.' },
      { dimensionId: 'teamwork', score: 3, trend: 'improving' }
    ]
  },
  // Team 3 (Titan Squad) Sessions
  {
    id: 'session6',
    teamId: 'team3',
    userId: 'mem10',
    date: '2024-01-18',
    assessmentPeriod: '2024 - 1st Half',
    completed: true,
    responses: [
      { dimensionId: 'mission', score: 2, trend: 'improving', comment: 'Getting clearer on our goals.' },
      { dimensionId: 'value', score: 2, trend: 'stable' },
      { dimensionId: 'speed', score: 3, trend: 'improving', comment: 'Workflow improvements paying off!' },
      { dimensionId: 'fun', score: 2, trend: 'stable' },
      { dimensionId: 'health', score: 2, trend: 'declining', comment: 'Need to address growing technical debt.' },
      { dimensionId: 'learning', score: 3, trend: 'improving' },
      { dimensionId: 'support', score: 2, trend: 'stable' },
      { dimensionId: 'pawns', score: 2, trend: 'improving' },
      { dimensionId: 'release', score: 2, trend: 'stable', comment: 'Releases are okay but could be smoother.' },
      { dimensionId: 'process', score: 2, trend: 'stable' },
      { dimensionId: 'teamwork', score: 3, trend: 'stable' }
    ]
  },
  {
    id: 'session7',
    teamId: 'team3',
    userId: 'mem11',
    date: '2024-01-18',
    assessmentPeriod: '2024 - 1st Half',
    completed: true,
    responses: [
      { dimensionId: 'mission', score: 3, trend: 'stable' },
      { dimensionId: 'value', score: 2, trend: 'improving', comment: 'Stakeholder feedback is positive.' },
      { dimensionId: 'speed', score: 2, trend: 'stable' },
      { dimensionId: 'fun', score: 3, trend: 'stable', comment: 'Love the team culture!' },
      { dimensionId: 'health', score: 1, trend: 'declining', comment: 'Code quality needs urgent attention.' },
      { dimensionId: 'learning', score: 2, trend: 'stable' },
      { dimensionId: 'support', score: 3, trend: 'stable' },
      { dimensionId: 'pawns', score: 3, trend: 'improving', comment: 'More autonomy lately.' },
      { dimensionId: 'release', score: 3, trend: 'improving' },
      { dimensionId: 'process', score: 2, trend: 'stable' },
      { dimensionId: 'teamwork', score: 2, trend: 'stable' }
    ]
  },
  // Team 4 (Falcon Squad) Sessions
  {
    id: 'session8',
    teamId: 'team4',
    userId: 'mem14',
    date: '2024-01-22',
    assessmentPeriod: '2024 - 1st Half',
    completed: true,
    responses: [
      { dimensionId: 'mission', score: 3, trend: 'stable', comment: 'Mission is crystal clear.' },
      { dimensionId: 'value', score: 3, trend: 'stable' },
      { dimensionId: 'speed', score: 3, trend: 'improving', comment: 'QA automation is speeding things up.' },
      { dimensionId: 'fun', score: 2, trend: 'stable' },
      { dimensionId: 'health', score: 3, trend: 'stable', comment: 'QA ensures good code quality.' },
      { dimensionId: 'learning', score: 2, trend: 'improving' },
      { dimensionId: 'support', score: 3, trend: 'stable' },
      { dimensionId: 'pawns', score: 2, trend: 'stable' },
      { dimensionId: 'release', score: 2, trend: 'improving', comment: 'Release process improving with automation.' },
      { dimensionId: 'process', score: 3, trend: 'stable', comment: 'QA process is well-defined.' },
      { dimensionId: 'teamwork', score: 2, trend: 'stable' }
    ]
  },
  {
    id: 'session9',
    teamId: 'team4',
    userId: 'mem15',
    date: '2024-01-22',
    assessmentPeriod: '2024 - 1st Half',
    completed: true,
    responses: [
      { dimensionId: 'mission', score: 2, trend: 'stable' },
      { dimensionId: 'value', score: 3, trend: 'improving', comment: 'Finding more bugs early.' },
      { dimensionId: 'speed', score: 2, trend: 'stable' },
      { dimensionId: 'fun', score: 3, trend: 'improving' },
      { dimensionId: 'health', score: 3, trend: 'improving', comment: 'Code quality standards are high.' },
      { dimensionId: 'learning', score: 3, trend: 'stable' },
      { dimensionId: 'support', score: 2, trend: 'stable' },
      { dimensionId: 'pawns', score: 3, trend: 'stable' },
      { dimensionId: 'release', score: 2, trend: 'stable' },
      { dimensionId: 'process', score: 3, trend: 'improving', comment: 'Process improvements are working.' },
      { dimensionId: 'teamwork', score: 3, trend: 'stable' }
    ]
  },
  // Team 5 (Eagle Squad) Sessions
  {
    id: 'session10',
    teamId: 'team5',
    userId: 'mem17',
    date: '2024-01-19',
    assessmentPeriod: '2024 - 1st Half',
    completed: true,
    responses: [
      { dimensionId: 'mission', score: 2, trend: 'improving', comment: 'Direction becoming clearer.' },
      { dimensionId: 'value', score: 2, trend: 'stable' },
      { dimensionId: 'speed', score: 3, trend: 'stable', comment: 'Good velocity lately.' },
      { dimensionId: 'fun', score: 2, trend: 'declining', comment: 'Some stress from tight deadlines.' },
      { dimensionId: 'health', score: 3, trend: 'stable' },
      { dimensionId: 'learning', score: 2, trend: 'stable' },
      { dimensionId: 'support', score: 2, trend: 'declining', comment: 'Could use more support from management.' },
      { dimensionId: 'pawns', score: 2, trend: 'stable' },
      { dimensionId: 'release', score: 2, trend: 'improving' },
      { dimensionId: 'process', score: 3, trend: 'stable', comment: 'Good QA processes in place.' },
      { dimensionId: 'teamwork', score: 2, trend: 'stable' }
    ]
  },
  {
    id: 'session11',
    teamId: 'team5',
    userId: 'mem18',
    date: '2024-01-19',
    assessmentPeriod: '2024 - 1st Half',
    completed: true,
    responses: [
      { dimensionId: 'mission', score: 3, trend: 'stable' },
      { dimensionId: 'value', score: 2, trend: 'improving', comment: 'Quality focus is appreciated.' },
      { dimensionId: 'speed', score: 2, trend: 'stable' },
      { dimensionId: 'fun', score: 3, trend: 'stable', comment: 'Team chemistry is excellent.' },
      { dimensionId: 'health', score: 2, trend: 'stable' },
      { dimensionId: 'learning', score: 3, trend: 'improving', comment: 'Learning new testing frameworks.' },
      { dimensionId: 'support', score: 3, trend: 'stable' },
      { dimensionId: 'pawns', score: 2, trend: 'stable' },
      { dimensionId: 'release', score: 1, trend: 'declining', comment: 'Release process has too many manual steps.' },
      { dimensionId: 'process', score: 2, trend: 'stable' },
      { dimensionId: 'teamwork', score: 3, trend: 'improving', comment: 'Collaboration has improved significantly.' }
    ]
  },
  // Historical data - Team 1 (Phoenix Squad) - 2023 2nd Half
  {
    id: 'session12',
    teamId: 'team1',
    userId: 'mem1',
    date: '2023-09-15',
    assessmentPeriod: '2023 - 2nd Half',
    completed: true,
    responses: [
      { dimensionId: 'mission', score: 2, trend: 'stable' },
      { dimensionId: 'value', score: 2, trend: 'stable' },
      { dimensionId: 'speed', score: 2, trend: 'declining' },
      { dimensionId: 'fun', score: 2, trend: 'stable' },
      { dimensionId: 'health', score: 1, trend: 'declining' },
      { dimensionId: 'learning', score: 2, trend: 'stable' },
      { dimensionId: 'support', score: 2, trend: 'stable' },
      { dimensionId: 'pawns', score: 2, trend: 'stable' },
      { dimensionId: 'release', score: 1, trend: 'declining' },
      { dimensionId: 'process', score: 2, trend: 'stable' },
      { dimensionId: 'teamwork', score: 2, trend: 'stable' }
    ]
  },
  {
    id: 'session13',
    teamId: 'team1',
    userId: 'mem2',
    date: '2023-09-15',
    assessmentPeriod: '2023 - 2nd Half',
    completed: true,
    responses: [
      { dimensionId: 'mission', score: 2, trend: 'stable' },
      { dimensionId: 'value', score: 2, trend: 'declining' },
      { dimensionId: 'speed', score: 1, trend: 'declining' },
      { dimensionId: 'fun', score: 2, trend: 'stable' },
      { dimensionId: 'health', score: 1, trend: 'declining' },
      { dimensionId: 'learning', score: 1, trend: 'declining' },
      { dimensionId: 'support', score: 2, trend: 'stable' },
      { dimensionId: 'pawns', score: 1, trend: 'declining' },
      { dimensionId: 'release', score: 1, trend: 'stable' },
      { dimensionId: 'process', score: 2, trend: 'stable' },
      { dimensionId: 'teamwork', score: 2, trend: 'declining' }
    ]
  },
  // Recent data - Team 1 (Phoenix Squad) - 2024 2nd Half
  {
    id: 'session14',
    teamId: 'team1',
    userId: 'mem1',
    date: '2024-09-20',
    assessmentPeriod: '2024 - 2nd Half',
    completed: true,
    responses: [
      { dimensionId: 'mission', score: 3, trend: 'improving' },
      { dimensionId: 'value', score: 3, trend: 'improving' },
      { dimensionId: 'speed', score: 2, trend: 'stable' },
      { dimensionId: 'fun', score: 3, trend: 'improving' },
      { dimensionId: 'health', score: 2, trend: 'improving', comment: 'Technical debt decreasing.' },
      { dimensionId: 'learning', score: 3, trend: 'improving' },
      { dimensionId: 'support', score: 3, trend: 'stable' },
      { dimensionId: 'pawns', score: 3, trend: 'improving' },
      { dimensionId: 'release', score: 2, trend: 'improving' },
      { dimensionId: 'process', score: 3, trend: 'improving' },
      { dimensionId: 'teamwork', score: 3, trend: 'improving' }
    ]
  },
  {
    id: 'session15',
    teamId: 'team1',
    userId: 'mem2',
    date: '2024-09-20',
    assessmentPeriod: '2024 - 2nd Half',
    completed: true,
    responses: [
      { dimensionId: 'mission', score: 3, trend: 'stable' },
      { dimensionId: 'value', score: 3, trend: 'improving' },
      { dimensionId: 'speed', score: 2, trend: 'improving' },
      { dimensionId: 'fun', score: 3, trend: 'stable' },
      { dimensionId: 'health', score: 2, trend: 'stable' },
      { dimensionId: 'learning', score: 3, trend: 'improving' },
      { dimensionId: 'support', score: 3, trend: 'stable' },
      { dimensionId: 'pawns', score: 3, trend: 'stable' },
      { dimensionId: 'release', score: 3, trend: 'improving', comment: 'Automation has greatly improved releases.' },
      { dimensionId: 'process', score: 3, trend: 'stable' },
      { dimensionId: 'teamwork', score: 3, trend: 'stable' }
    ]
  },
  // Historical data - Team 2 (Dragon Squad) - 2023 2nd Half
  {
    id: 'session16',
    teamId: 'team2',
    userId: 'mem6',
    date: '2023-10-10',
    assessmentPeriod: '2023 - 2nd Half',
    completed: true,
    responses: [
      { dimensionId: 'mission', score: 2, trend: 'stable' },
      { dimensionId: 'value', score: 2, trend: 'stable' },
      { dimensionId: 'speed', score: 2, trend: 'stable' },
      { dimensionId: 'fun', score: 2, trend: 'stable' },
      { dimensionId: 'health', score: 1, trend: 'declining' },
      { dimensionId: 'learning', score: 2, trend: 'stable' },
      { dimensionId: 'support', score: 2, trend: 'stable' },
      { dimensionId: 'pawns', score: 2, trend: 'stable' },
      { dimensionId: 'release', score: 2, trend: 'stable' },
      { dimensionId: 'process', score: 2, trend: 'stable' },
      { dimensionId: 'teamwork', score: 2, trend: 'stable' }
    ]
  },
  // Team 2 - 2024 2nd Half
  {
    id: 'session17',
    teamId: 'team2',
    userId: 'mem6',
    date: '2024-10-05',
    assessmentPeriod: '2024 - 2nd Half',
    completed: true,
    responses: [
      { dimensionId: 'mission', score: 3, trend: 'improving' },
      { dimensionId: 'value', score: 3, trend: 'improving' },
      { dimensionId: 'speed', score: 2, trend: 'improving' },
      { dimensionId: 'fun', score: 3, trend: 'improving' },
      { dimensionId: 'health', score: 2, trend: 'improving' },
      { dimensionId: 'learning', score: 3, trend: 'stable' },
      { dimensionId: 'support', score: 3, trend: 'stable' },
      { dimensionId: 'pawns', score: 3, trend: 'stable' },
      { dimensionId: 'release', score: 3, trend: 'improving' },
      { dimensionId: 'process', score: 3, trend: 'stable' },
      { dimensionId: 'teamwork', score: 3, trend: 'improving' }
    ]
  },
  // Historical data - Team 3 (Titan Squad) - 2023 2nd Half
  {
    id: 'session18',
    teamId: 'team3',
    userId: 'mem10',
    date: '2023-11-05',
    assessmentPeriod: '2023 - 2nd Half',
    completed: true,
    responses: [
      { dimensionId: 'mission', score: 1, trend: 'declining' },
      { dimensionId: 'value', score: 2, trend: 'stable' },
      { dimensionId: 'speed', score: 2, trend: 'stable' },
      { dimensionId: 'fun', score: 2, trend: 'declining' },
      { dimensionId: 'health', score: 1, trend: 'declining' },
      { dimensionId: 'learning', score: 2, trend: 'stable' },
      { dimensionId: 'support', score: 2, trend: 'stable' },
      { dimensionId: 'pawns', score: 1, trend: 'declining' },
      { dimensionId: 'release', score: 1, trend: 'declining' },
      { dimensionId: 'process', score: 2, trend: 'stable' },
      { dimensionId: 'teamwork', score: 2, trend: 'stable' }
    ]
  },
  // Team 3 - 2024 2nd Half
  {
    id: 'session19',
    teamId: 'team3',
    userId: 'mem10',
    date: '2024-09-25',
    assessmentPeriod: '2024 - 2nd Half',
    completed: true,
    responses: [
      { dimensionId: 'mission', score: 2, trend: 'improving' },
      { dimensionId: 'value', score: 3, trend: 'improving' },
      { dimensionId: 'speed', score: 3, trend: 'improving' },
      { dimensionId: 'fun', score: 2, trend: 'stable' },
      { dimensionId: 'health', score: 2, trend: 'improving' },
      { dimensionId: 'learning', score: 3, trend: 'improving' },
      { dimensionId: 'support', score: 2, trend: 'stable' },
      { dimensionId: 'pawns', score: 3, trend: 'improving' },
      { dimensionId: 'release', score: 2, trend: 'improving' },
      { dimensionId: 'process', score: 2, trend: 'stable' },
      { dimensionId: 'teamwork', score: 3, trend: 'improving' }
    ]
  }
];

// Generate comprehensive health check sessions for all teams and members
let healthCheckSessions: HealthCheckSession[] = generateMockHealthSessions().concat(MANUAL_DEMO_SESSIONS);

export const saveHealthCheckSession = (session: HealthCheckSession) => {
  healthCheckSessions.push(session);
  localStorage.setItem('healthCheckSessions', JSON.stringify(healthCheckSessions));
};

export const getHealthCheckSessions = (): HealthCheckSession[] => {
  const stored = localStorage.getItem('healthCheckSessions');
  if (stored) {
    const parsedSessions = JSON.parse(stored);

    // Validate that we have data for all teams
    const teamIds = TEAMS.map(t => t.id);
    const sessionsTeamIds = new Set(parsedSessions.map((s: HealthCheckSession) => s.teamId));
    const hasAllTeams = teamIds.every(id => sessionsTeamIds.has(id));

    // If we're missing teams, regenerate all data
    if (!hasAllTeams) {
      console.log('Missing team data detected, regenerating health check sessions...');
      healthCheckSessions = generateMockHealthSessions().concat(MANUAL_DEMO_SESSIONS);
      localStorage.setItem('healthCheckSessions', JSON.stringify(healthCheckSessions));
    } else {
      healthCheckSessions = parsedSessions;
    }
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