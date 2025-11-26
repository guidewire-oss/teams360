/**
 * Teams API Client
 *
 * Provides methods to interact with the backend API for team information.
 */

// Use relative URLs to go through Next.js proxy (configured in next.config.ts)
const API_BASE_URL = '';

// Types matching backend DTOs
export interface TeamMember {
  id: string;
  username: string;
  fullName: string;
}

export interface TeamInfo {
  id: string;
  name: string;
  cadence: string;
  members: TeamMember[];
  teamLeadId?: string;
  teamLeadName?: string;
}

export interface APIError {
  error: string;
  message: string;
}

/**
 * Custom error class for Teams API errors
 */
export class TeamsAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public apiError?: APIError
  ) {
    super(message);
    this.name = 'TeamsAPIError';
  }
}

/**
 * Handles API responses and errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: APIError | null = null;

    try {
      errorData = await response.json();
    } catch {
      // If response is not JSON, use status text
    }

    throw new TeamsAPIError(
      errorData?.message || response.statusText || 'An error occurred',
      response.status,
      errorData || undefined
    );
  }

  return response.json();
}

/**
 * Fetches team info by team ID
 *
 * @param teamId Team ID
 * @returns Team information including name, cadence, and members
 */
export async function getTeamInfo(teamId: string): Promise<TeamInfo> {
  const response = await fetch(`${API_BASE_URL}/api/v1/teams/${teamId}/info`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<TeamInfo>(response);
}

/**
 * Cache for team info to avoid repeated API calls
 */
const teamCache = new Map<string, { data: TeamInfo; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches team info with caching
 *
 * @param teamId Team ID
 * @returns Team information (cached)
 */
export async function getTeamInfoCached(teamId: string): Promise<TeamInfo> {
  const cached = teamCache.get(teamId);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }

  const data = await getTeamInfo(teamId);
  teamCache.set(teamId, { data, timestamp: now });
  return data;
}

/**
 * Clears the team cache
 */
export function clearTeamCache(): void {
  teamCache.clear();
}

/**
 * Team summary for list view
 */
export interface TeamSummary {
  id: string;
  name: string;
  cadence: string;
  memberCount: number;
  teamLeadId?: string;
  teamLeadName?: string;
}

export interface TeamsListResponse {
  teams: TeamSummary[];
  total: number;
}

/**
 * Fetches list of all teams
 *
 * @returns List of all teams
 */
export async function listTeams(): Promise<TeamsListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/teams`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<TeamsListResponse>(response);
}
