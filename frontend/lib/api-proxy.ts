/**
 * API Proxy utilities for forwarding requests to the Go backend
 * with proper trace context propagation for distributed tracing.
 */

import { NextRequest } from 'next/server';

export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

/**
 * Headers to propagate for distributed tracing (W3C Trace Context)
 */
const TRACE_HEADERS = [
  'traceparent',
  'tracestate',
  'baggage',
];

/**
 * Extract trace context headers from incoming request
 * for propagation to backend services.
 */
export function getTraceHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};

  for (const headerName of TRACE_HEADERS) {
    const value = request.headers.get(headerName);
    if (value) {
      headers[headerName] = value;
    }
  }

  return headers;
}

/**
 * Build headers for proxying request to backend,
 * including trace context for distributed tracing.
 */
export function buildProxyHeaders(
  request: NextRequest,
  additionalHeaders?: Record<string, string>
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...getTraceHeaders(request),
    ...additionalHeaders,
  };
}

/**
 * Proxy a GET request to the backend with trace context propagation.
 */
export async function proxyGet(
  request: NextRequest,
  backendPath: string
): Promise<Response> {
  const response = await fetch(`${BACKEND_URL}${backendPath}`, {
    method: 'GET',
    headers: buildProxyHeaders(request),
  });

  return response;
}

/**
 * Proxy a POST request to the backend with trace context propagation.
 */
export async function proxyPost(
  request: NextRequest,
  backendPath: string,
  body?: unknown
): Promise<Response> {
  const response = await fetch(`${BACKEND_URL}${backendPath}`, {
    method: 'POST',
    headers: buildProxyHeaders(request),
    body: body ? JSON.stringify(body) : undefined,
  });

  return response;
}

/**
 * Proxy a PUT request to the backend with trace context propagation.
 */
export async function proxyPut(
  request: NextRequest,
  backendPath: string,
  body?: unknown
): Promise<Response> {
  const response = await fetch(`${BACKEND_URL}${backendPath}`, {
    method: 'PUT',
    headers: buildProxyHeaders(request),
    body: body ? JSON.stringify(body) : undefined,
  });

  return response;
}

/**
 * Proxy a DELETE request to the backend with trace context propagation.
 */
export async function proxyDelete(
  request: NextRequest,
  backendPath: string
): Promise<Response> {
  const response = await fetch(`${BACKEND_URL}${backendPath}`, {
    method: 'DELETE',
    headers: buildProxyHeaders(request),
  });

  return response;
}
