/**
 * Utility functions for automatic assessment period detection
 *
 * Assessment periods are defined as:
 * - "YYYY - 1st Half": July 1 - December 31 of the previous year
 * - "YYYY - 2nd Half": January 1 - June 30 of the current year
 *
 * This means surveys submitted in:
 * - Jan 1 - Jun 30, 2025 → "2024 - 2nd Half"
 * - Jul 1 - Dec 31, 2025 → "2025 - 1st Half"
 */

/**
 * Get the assessment period for a given date
 * @param date - Date object or ISO string (defaults to current date if not provided)
 * @returns Assessment period string in format "YYYY - [1st|2nd] Half"
 */
export function getAssessmentPeriod(date?: Date | string): string {
  const submissionDate = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();

  const month = submissionDate.getMonth(); // 0-indexed: 0 = January, 11 = December
  const year = submissionDate.getFullYear();

  // January (0) to June (5) = first half of calendar year = "previous year - 2nd Half"
  // July (6) to December (11) = second half of calendar year = "current year - 1st Half"
  if (month >= 0 && month <= 5) {
    // Jan-Jun: Use previous year's 2nd Half
    return `${year - 1} - 2nd Half`;
  } else {
    // Jul-Dec: Use current year's 1st Half
    return `${year} - 1st Half`;
  }
}

/**
 * Get the current assessment period (convenience function)
 * @returns Current assessment period string
 */
export function getCurrentAssessmentPeriod(): string {
  return getAssessmentPeriod();
}

/**
 * Parse an assessment period string into year and half
 * @param period - Assessment period string (e.g., "2024 - 2nd Half")
 * @returns Object with year and half, or null if invalid format
 */
export function parseAssessmentPeriod(period: string): { year: number; half: '1st' | '2nd' } | null {
  const match = period.match(/^(\d{4}) - (1st|2nd) Half$/);
  if (!match) return null;

  return {
    year: parseInt(match[1], 10),
    half: match[2] as '1st' | '2nd'
  };
}

/**
 * Compare two assessment periods
 * @param period1 - First assessment period
 * @param period2 - Second assessment period
 * @returns Negative if period1 < period2, positive if period1 > period2, 0 if equal
 */
export function compareAssessmentPeriods(period1: string, period2: string): number {
  const parsed1 = parseAssessmentPeriod(period1);
  const parsed2 = parseAssessmentPeriod(period2);

  if (!parsed1 || !parsed2) return 0;

  if (parsed1.year !== parsed2.year) {
    return parsed1.year - parsed2.year;
  }

  // Same year, compare halves (1st < 2nd)
  return parsed1.half === '1st' ? (parsed2.half === '1st' ? 0 : -1) : (parsed2.half === '2nd' ? 0 : 1);
}
