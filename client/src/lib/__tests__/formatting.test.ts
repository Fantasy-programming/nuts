import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatCurrency, formatDate, formatTime, formatDateTime } from '../formatting';
import { usePreferencesStore } from '@/features/preferences/stores/preferences.store';

// Mock the preferences store
vi.mock('@/features/preferences/stores/preferences.store', () => ({
  usePreferencesStore: {
    getState: vi.fn(),
  },
}));

const mockGetState = vi.mocked(usePreferencesStore.getState);

describe('Formatting utilities', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe('formatCurrency', () => {
    it('should format currency with default preferences', () => {
      mockGetState.mockReturnValue({
        locale: 'en-US',
        currency: 'USD',
      } as any);

      const result = formatCurrency(1234.56);
      expect(result).toBe('$1,234.56');
    });

    it('should format currency with EUR', () => {
      mockGetState.mockReturnValue({
        locale: 'en-US',
        currency: 'EUR',
      } as any);

      const result = formatCurrency(1234.56, 'EUR');
      expect(result).toBe('€1,234.56');
    });

    it('should format currency with French locale', () => {
      mockGetState.mockReturnValue({
        locale: 'fr-FR',
        currency: 'EUR',
      } as any);

      const result = formatCurrency(1234.56);
      // French formatting uses different separators
      expect(result).toContain('1');
      expect(result).toContain('234');
      expect(result).toContain('56');
      expect(result).toContain('€');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-03-15T10:30:00Z');

    it('should format date with dd/mm/yyyy format', () => {
      mockGetState.mockReturnValue({
        date_format: 'dd/mm/yyyy',
        locale: 'en-US',
      } as any);

      const result = formatDate(testDate);
      expect(result).toBe('15/03/2024');
    });

    it('should format date with mm/dd/yyyy format', () => {
      mockGetState.mockReturnValue({
        date_format: 'mm/dd/yyyy',
        locale: 'en-US',
      } as any);

      const result = formatDate(testDate);
      expect(result).toBe('03/15/2024');
    });

    it('should format date with yyyy-mm-dd format', () => {
      mockGetState.mockReturnValue({
        date_format: 'yyyy-mm-dd',
        locale: 'en-US',
      } as any);

      const result = formatDate(testDate);
      expect(result).toBe('2024-03-15');
    });
  });

  describe('formatTime', () => {
    const testDate = new Date('2024-03-15T15:30:00Z');

    it('should format time with 12h format', () => {
      mockGetState.mockReturnValue({
        time_format: '12h',
        locale: 'en-US',
      } as any);

      const result = formatTime(testDate);
      expect(result).toContain('3:30');
      expect(result).toContain('PM');
    });

    it('should format time with 24h format', () => {
      mockGetState.mockReturnValue({
        time_format: '24h',
        locale: 'en-US',
      } as any);

      const result = formatTime(testDate);
      expect(result).toContain('15:30');
      expect(result).not.toContain('PM');
    });
  });

  describe('formatDateTime', () => {
    const testDate = new Date('2024-03-15T15:30:00Z');

    it('should format date and time together', () => {
      mockGetState.mockReturnValue({
        date_format: 'dd/mm/yyyy',
        time_format: '24h',
        locale: 'en-US',
      } as any);

      const result = formatDateTime(testDate);
      expect(result).toContain('15/03/2024');
      expect(result).toContain('15:30');
    });
  });

  describe('error handling', () => {
    it('should handle invalid currency gracefully', () => {
      mockGetState.mockReturnValue({
        locale: 'invalid-locale',
        currency: 'INVALID',
      } as any);

      const result = formatCurrency(100, 'INVALID');
      // Should fallback to symbol + amount
      expect(result).toContain('100');
      expect(result).toContain('INVALID');
    });

    it('should handle invalid date format gracefully', () => {
      mockGetState.mockReturnValue({
        date_format: 'invalid-format',
        locale: 'en-US',
      } as any);

      const result = formatDate(new Date('2024-03-15'));
      // Should fallback to default locale formatting
      expect(result).toContain('2024');
    });
  });
});