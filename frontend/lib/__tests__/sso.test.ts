import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSSOConfig } from '../sso';

// Save and restore process.env around each test so env mutations don't leak.
const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

// ── 1. No SSO env vars — getSSOConfig returns null ───────────────────────────

describe('getSSOConfig — no SSO environment variables', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID;
    delete process.env.NEXT_PUBLIC_OAUTH_AUTHORIZE_URL;
    delete process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI;
    delete process.env.NEXT_PUBLIC_OAUTH_SCOPES;
  });

  it('returns null when NEXT_PUBLIC_OAUTH_CLIENT_ID is not set', () => {
    expect(getSSOConfig()).toBeNull();
  });
});

// ── 2 & 3. SSO env vars present — getSSOConfig returns config ────────────────

describe('getSSOConfig — SSO environment variables are set', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID = 'test-client-id';
    process.env.NEXT_PUBLIC_OAUTH_AUTHORIZE_URL = 'https://auth.example.com/authorize';
    process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI = 'http://localhost:3000/auth/callback';
  });

  it('returns a config object with the configured values', () => {
    const config = getSSOConfig();

    expect(config).not.toBeNull();
    expect(config?.clientId).toBe('test-client-id');
    expect(config?.authorizeUrl).toBe('https://auth.example.com/authorize');
    expect(config?.redirectUri).toBe('http://localhost:3000/auth/callback');
  });

  it('uses "openid email profile" as the default scope when NEXT_PUBLIC_OAUTH_SCOPES is not set', () => {
    delete process.env.NEXT_PUBLIC_OAUTH_SCOPES;

    const config = getSSOConfig();

    expect(config?.scopes).toBe('openid email profile');
  });

  it('uses the configured scopes when NEXT_PUBLIC_OAUTH_SCOPES is set', () => {
    process.env.NEXT_PUBLIC_OAUTH_SCOPES = 'openid email';

    const config = getSSOConfig();

    expect(config?.scopes).toBe('openid email');
  });

  it('returns null when NEXT_PUBLIC_OAUTH_CLIENT_ID is removed after being set', () => {
    delete process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID;

    expect(getSSOConfig()).toBeNull();
  });
});

// ── Login page SSO button visibility ─────────────────────────────────────────
// These tests verify the contract getSSOConfig provides to the login page:
// null  → no SSO button should be shown
// non-null → SSO button should be shown

describe('getSSOConfig — login page contract', () => {
  it('returns null (hide SSO button) when client ID is absent', () => {
    delete process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID;

    expect(getSSOConfig()).toBeNull();
  });

  it('returns config (show SSO button) when client ID is present', () => {
    process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID = 'my-app';
    process.env.NEXT_PUBLIC_OAUTH_AUTHORIZE_URL = 'https://idp.example.com/auth';
    process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI = 'http://localhost:3000/auth/callback';

    expect(getSSOConfig()).not.toBeNull();
  });
});
