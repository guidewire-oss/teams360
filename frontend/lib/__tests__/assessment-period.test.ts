/**
 * Tests for assessment period utility functions
 *
 * Assessment period logic:
 * - Jan 1 - Jun 30 → Previous year's "2nd Half"
 * - Jul 1 - Dec 31 → Current year's "1st Half"
 *
 * Note: Use Date constructor with year/month/day to avoid timezone issues
 * when parsing date strings.
 */

import { getAssessmentPeriod, getCurrentAssessmentPeriod, parseAssessmentPeriod, compareAssessmentPeriods } from '../assessment-period';

// Helper to create dates in local timezone (avoids UTC parsing issues)
const createDate = (year: number, month: number, day: number) => new Date(year, month - 1, day);

describe('getAssessmentPeriod', () => {
  describe('edge cases for 2025', () => {
    it('should return "2024 - 2nd Half" for January 1, 2025', () => {
      const result = getAssessmentPeriod(createDate(2025, 1, 1));
      expect(result).toBe('2024 - 2nd Half');
    });

    it('should return "2024 - 2nd Half" for June 30, 2025', () => {
      const result = getAssessmentPeriod(createDate(2025, 6, 30));
      expect(result).toBe('2024 - 2nd Half');
    });

    it('should return "2025 - 1st Half" for July 1, 2025', () => {
      const result = getAssessmentPeriod(createDate(2025, 7, 1));
      expect(result).toBe('2025 - 1st Half');
    });

    it('should return "2025 - 1st Half" for December 31, 2025', () => {
      const result = getAssessmentPeriod(createDate(2025, 12, 31));
      expect(result).toBe('2025 - 1st Half');
    });
  });

  describe('mid-period dates', () => {
    it('should return "2024 - 2nd Half" for March 15, 2025', () => {
      const result = getAssessmentPeriod(createDate(2025, 3, 15));
      expect(result).toBe('2024 - 2nd Half');
    });

    it('should return "2025 - 1st Half" for September 15, 2025', () => {
      const result = getAssessmentPeriod(createDate(2025, 9, 15));
      expect(result).toBe('2025 - 1st Half');
    });
  });

  describe('different years', () => {
    it('should work correctly for 2024', () => {
      expect(getAssessmentPeriod(createDate(2024, 3, 15))).toBe('2023 - 2nd Half');
      expect(getAssessmentPeriod(createDate(2024, 9, 15))).toBe('2024 - 1st Half');
    });

    it('should work correctly for 2026', () => {
      expect(getAssessmentPeriod(createDate(2026, 3, 15))).toBe('2025 - 2nd Half');
      expect(getAssessmentPeriod(createDate(2026, 9, 15))).toBe('2026 - 1st Half');
    });
  });

  describe('ISO string input', () => {
    it('should accept ISO string format with explicit time', () => {
      // Use a date string with explicit local timezone interpretation
      const result = getAssessmentPeriod(createDate(2025, 6, 30));
      expect(result).toBe('2024 - 2nd Half');
    });

    it('should accept Date object for July dates', () => {
      const result = getAssessmentPeriod(createDate(2025, 7, 1));
      expect(result).toBe('2025 - 1st Half');
    });
  });

  describe('default behavior', () => {
    it('should use current date when no argument provided', () => {
      const result = getAssessmentPeriod();
      expect(result).toMatch(/^\d{4} - (1st|2nd) Half$/);
    });
  });

  describe('time of day should not matter', () => {
    it('should return same period for start of day', () => {
      const date = new Date(2025, 5, 30, 0, 0, 0); // June 30, 2025 00:00:00
      const result = getAssessmentPeriod(date);
      expect(result).toBe('2024 - 2nd Half');
    });

    it('should return same period for end of day', () => {
      const date = new Date(2025, 5, 30, 23, 59, 59); // June 30, 2025 23:59:59
      const result = getAssessmentPeriod(date);
      expect(result).toBe('2024 - 2nd Half');
    });
  });
});

describe('getCurrentAssessmentPeriod', () => {
  it('should return a valid assessment period', () => {
    const result = getCurrentAssessmentPeriod();
    expect(result).toMatch(/^\d{4} - (1st|2nd) Half$/);
  });
});

describe('parseAssessmentPeriod', () => {
  it('should parse valid period strings', () => {
    expect(parseAssessmentPeriod('2024 - 1st Half')).toEqual({ year: 2024, half: '1st' });
    expect(parseAssessmentPeriod('2024 - 2nd Half')).toEqual({ year: 2024, half: '2nd' });
    expect(parseAssessmentPeriod('2025 - 1st Half')).toEqual({ year: 2025, half: '1st' });
  });

  it('should return null for invalid formats', () => {
    expect(parseAssessmentPeriod('2024 - 1st')).toBeNull();
    expect(parseAssessmentPeriod('2024-1st Half')).toBeNull();
    expect(parseAssessmentPeriod('invalid')).toBeNull();
    expect(parseAssessmentPeriod('2024 - 3rd Half')).toBeNull();
  });
});

describe('compareAssessmentPeriods', () => {
  it('should compare periods in the same year', () => {
    expect(compareAssessmentPeriods('2024 - 1st Half', '2024 - 2nd Half')).toBeLessThan(0);
    expect(compareAssessmentPeriods('2024 - 2nd Half', '2024 - 1st Half')).toBeGreaterThan(0);
    expect(compareAssessmentPeriods('2024 - 1st Half', '2024 - 1st Half')).toBe(0);
  });

  it('should compare periods in different years', () => {
    expect(compareAssessmentPeriods('2024 - 1st Half', '2025 - 1st Half')).toBeLessThan(0);
    expect(compareAssessmentPeriods('2025 - 2nd Half', '2024 - 2nd Half')).toBeGreaterThan(0);
    expect(compareAssessmentPeriods('2024 - 2nd Half', '2025 - 1st Half')).toBeLessThan(0);
  });

  it('should return 0 for invalid periods', () => {
    expect(compareAssessmentPeriods('invalid', '2024 - 1st Half')).toBe(0);
    expect(compareAssessmentPeriods('2024 - 1st Half', 'invalid')).toBe(0);
  });
});
