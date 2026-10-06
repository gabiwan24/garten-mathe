import { describe, expect, it } from 'vitest';
import { addDays, formatDateDe, toDateString } from '../../src/lib/date';

describe('date helpers', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('formats German dates', () => {
    expect(formatDateDe('2026-10-06')).toBe('6.10.2026');
  });
});
