import Cookies from 'js-cookie';

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
 * User type used in frontend components
 * Maps from API response to component-compatible format
 */
export interface User {
  id: string;
  username?: string;
  name: string;
  email?: string;
  hierarchyLevelId: string;
  teamIds: string[];
  isAdmin?: boolean;
  reportsTo?: string;
}

/**
 * Gets the current user from the cookie
 * Maps API response format to frontend User format
 */
export const getCurrentUser = (): User | null => {
  const userCookie = Cookies.get('user');
  if (userCookie) {
    try {
      const apiUser = JSON.parse(userCookie);
      // Map API response format to frontend User format
      return {
        id: apiUser.id,
        username: apiUser.username,
        name: apiUser.fullName || apiUser.name,
        email: apiUser.email,
        // Handle both formats: API uses 'hierarchyLevel', frontend uses 'hierarchyLevelId'
        hierarchyLevelId: apiUser.hierarchyLevel || apiUser.hierarchyLevelId,
        teamIds: apiUser.teamIds || [],
        isAdmin: apiUser.hierarchyLevel === 'admin' || apiUser.hierarchyLevelId === 'admin',
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