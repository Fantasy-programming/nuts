import { describe, it, expect } from 'vitest';
import { getIconByName, renderIcon } from '../index.helper';
import * as LucideIcons from 'lucide-react';

describe('IconPicker Helper Functions', () => {
  describe('getIconByName', () => {
    it('should return a valid icon component for valid icon names', () => {
      const icon = getIconByName('Camera');
      expect(icon).toBeDefined();
      expect(typeof icon).toMatch(/^(function|object)$/);
    });

    it('should return undefined for invalid icon names', () => {
      const icon = getIconByName('InvalidIcon');
      expect(icon).toBeUndefined();
    });

    it('should return undefined for empty or null inputs', () => {
      expect(getIconByName('')).toBeUndefined();
      expect(getIconByName(null as unknown as string)).toBeUndefined();
      expect(getIconByName(undefined as unknown as string)).toBeUndefined();
    });

    it('should return undefined for lowercase icon names', () => {
      const icon = getIconByName('camera');
      expect(icon).toBeUndefined();
    });

    it('should work with commonly used icons', () => {
      const commonIcons = ['Home', 'User', 'Settings', 'Heart', 'Star', 'Check', 'X'];
      
      commonIcons.forEach(iconName => {
        const icon = getIconByName(iconName);
        expect(icon).toBeDefined();
        expect(typeof icon).toMatch(/^(function|object)$/);
      });
    });
  });

  describe('renderIcon', () => {
    it('should render a valid icon', () => {
      const result = renderIcon('Camera');
      expect(result).toBeTruthy();
    });

    it('should return null for invalid icon names', () => {
      const result = renderIcon('InvalidIcon');
      expect(result).toBeNull();
    });

    it('should pass props to the icon component', () => {
      const result = renderIcon('Camera', { className: 'test-class' });
      expect(result).toBeTruthy();
      // Note: Testing props would require a more complex setup with React testing utils
    });

    it('should handle icons used in categories and tags', () => {
      const categoryIcons = ['Car', 'ShoppingCart', 'Home', 'Utensils', 'Coffee'];
      const tagIcons = ['Tag', 'Star', 'Heart', 'Bookmark', 'Flag'];
      
      [...categoryIcons, ...tagIcons].forEach(iconName => {
        const result = renderIcon(iconName);
        expect(result).toBeTruthy();
      });
    });
  });

  describe('Icon availability', () => {
    it('should have access to Lucide icons', () => {
      expect(LucideIcons).toBeDefined();
      expect(typeof LucideIcons.Camera).toMatch(/^(function|object)$/);
      expect(typeof LucideIcons.Home).toMatch(/^(function|object)$/);
      expect(typeof LucideIcons.User).toMatch(/^(function|object)$/);
    });

    it('should validate that commonly needed icons exist', () => {
      const requiredIcons = [
        'Plus', 'Pencil', 'Trash', 'MoreHorizontal', 'X', 'Check',
        'Home', 'User', 'Settings', 'Car', 'ShoppingCart', 'Utensils',
        'Coffee', 'Tag', 'Star', 'Heart', 'Bookmark', 'Flag'
      ];

      requiredIcons.forEach(iconName => {
        expect(LucideIcons[iconName as keyof typeof LucideIcons]).toBeDefined();
      });
    });
  });
});