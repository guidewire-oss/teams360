import Cookies from 'js-cookie';
import type { User as DomainUser } from '@/lib/types';

/**
 * User type returned from API login
 * Note: Authentication is now handled via backend API (POST /api/v1/auth/login)
 * This module only handles cookie-based session management
 */
export interface APIUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  hierarchyLevel: string;
  teamIds: string[];
}

/**
 * AuthUser type used for authenticated user in frontend components.
 *
 * Based on the canonical User type but omits password (not sent to frontend)
 * and adds API-aligned field aliases:
 * - fullName: User's display name (matches API, alias for name)
 * - hierarchyLevel: User's level ID (matches API, alias for hierarchyLevelId)
 *
 * For backwards compatibility with components using old field names:
 * - name: Alias for fullName
 * - hierarchyLevelId: Alias for hierarchyLevel
 */
export interface AuthUser extends Omit<DomainUser, 'password'> {
  // API-aligned field names (aliases for backwards compatibility)
  fullName: string;
  hierarchyLevel: string;
}

// For backwards compatibility - components can still import "User" from auth.ts
// but it will actually be the AuthUser type (without password)
export type User = AuthUser;

/**
 * Gets the current user from the cookie.
 * Returns user with both API-aligned and legacy field names for compatibility.
 */
export const getCurrentUser = (): AuthUser | null => {
  const userCookie = Cookies.get('user');
  if (userCookie) {
    try {
      // Decode URL-encoded cookie value before parsing JSON
      const decodedCookie = decodeURIComponent(userCookie);
      const apiUser = JSON.parse(decodedCookie) as APIUser;
      const fullName = apiUser.fullName || '';
      const hierarchyLevel = apiUser.hierarchyLevel || '';

      return {
        id: apiUser.id,
        username: apiUser.username,
        email: apiUser.email,
        teamIds: apiUser.teamIds || [],
        isAdmin: hierarchyLevel === 'admin' || hierarchyLevel === 'level-admin',
        // API-aligned names
        fullName,
        hierarchyLevel,
        // Backwards-compatible aliases
        name: fullName,
        hierarchyLevelId: hierarchyLevel,
      };
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Logs out the current user by removing the cookie
 */
export const logout = () => {
  Cookies.remove('user');
};

/**
 * Checks if a user is currently authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getCurrentUser();
};
