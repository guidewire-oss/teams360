/**
 * Health Check API Client
 *
 * Provides methods to interact with the backend API for health check surveys.
 * Handles authentication, error handling, and data transformation.
 */

import { API_BASE_URL, APIError, APIRequestError, handleResponse } from './client';
import type { HealthCheckResponse, HealthCheckSession, HealthDimension } from '@/lib/types';

// Re-export domain types from the canonical source for backwards compatibility
export type { HealthCheckResponse, HealthCheckSession, HealthDimension };

// API-specific request/response wrapper types
export interface SubmitHealthCheckRequest {
  id?: string;
  teamId: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  assessmentPeriod?: string;
  responses: HealthCheckResponse[];
  completed: boolean;
}

export interface HealthDimensionsResponse {
  dimensions: HealthDimension[];
}

export interface HealthCheckSessionsResponse {
  sessions: HealthCheckSession[];
  total: number;
}

// Re-export APIError and APIRequestError for backwards compatibility
export type { APIError };
export { APIRequestError as HealthCheckAPIError };

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
