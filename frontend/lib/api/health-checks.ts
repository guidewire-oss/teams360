/**
 * Health Check API Client
 *
 * Provides methods to interact with the backend API for health check surveys.
 * Handles authentication, error handling, and data transformation.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Types matching backend DTOs
export interface HealthCheckResponse {
  dimensionId: string;
  score: number; // 1 = red, 2 = yellow, 3 = green
  trend: 'improving' | 'stable' | 'declining';
  comment?: string;
}

export interface SubmitHealthCheckRequest {
  id?: string;
  teamId: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  assessmentPeriod?: string;
  responses: HealthCheckResponse[];
  completed: boolean;
}

export interface HealthCheckSession {
  id: string;
  teamId: string;
  userId: string;
  date: string;
  assessmentPeriod: string;
  responses: HealthCheckResponse[];
  completed: boolean;
  createdAt?: string;
}

export interface HealthDimension {
  id: string;
  name: string;
  description: string;
  goodDescription: string;
  badDescription: string;
  isActive: boolean;
  weight: number;
}

export interface HealthDimensionsResponse {
  dimensions: HealthDimension[];
}

export interface HealthCheckSessionsResponse {
  sessions: HealthCheckSession[];
  total: number;
}

export interface APIError {
  error: string;
  message: string;
  code?: string;
}

/**
 * Custom error class for API errors
 */
export class HealthCheckAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public apiError?: APIError
  ) {
    super(message);
    this.name = 'HealthCheckAPIError';
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

    throw new HealthCheckAPIError(
      errorData?.message || response.statusText || 'An error occurred',
      response.status,
      errorData || undefined
    );
  }

  return response.json();
}

/**
 * Submits a health check survey
 *
 * @param data Survey submission data
 * @returns The created health check session
 */
export async function submitHealthCheck(
  data: SubmitHealthCheckRequest
): Promise<HealthCheckSession> {
  const response = await fetch(`${API_BASE_URL}/api/v1/health-checks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<HealthCheckSession>(response);
}

/**
 * Fetches all active health dimensions
 *
 * @returns Array of health dimensions
 */
export async function getHealthDimensions(): Promise<HealthDimension[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/health-dimensions`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await handleResponse<HealthDimensionsResponse>(response);
  return data.dimensions;
}

/**
 * Fetches a specific health check session by ID
 *
 * @param id Session ID
 * @returns Health check session
 */
export async function getHealthCheckById(id: string): Promise<HealthCheckSession> {
  const response = await fetch(`${API_BASE_URL}/api/v1/health-checks/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<HealthCheckSession>(response);
}

/**
 * Fetches all health check sessions for a team
 *
 * @param teamId Team ID
 * @param assessmentPeriod Optional assessment period filter
 * @returns Array of health check sessions
 */
export async function getTeamHealthChecks(
  teamId: string,
  assessmentPeriod?: string
): Promise<HealthCheckSession[]> {
  const params = new URLSearchParams();
  if (assessmentPeriod) {
    params.append('assessmentPeriod', assessmentPeriod);
  }

  const url = `${API_BASE_URL}/api/v1/health-checks/team/${teamId}${
    params.toString() ? `?${params.toString()}` : ''
  }`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await handleResponse<HealthCheckSessionsResponse>(response);
  return data.sessions;
}

/**
 * Helper function to format date to YYYY-MM-DD
 */
export function formatDateForAPI(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Checks if the API is reachable
 *
 * @returns true if API is healthy
 */
export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}
