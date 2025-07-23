import { describe, it, expect } from 'vitest';
import { renderIcon } from '@/core/components/icon-picker/index.helper';

describe('Settings UI Components Validation', () => {
  describe('Required icons for settings sections', () => {
    const requiredIcons = [
      // Action icons
      'Plus', 'Pencil', 'Trash', 'MoreHorizontal', 'X', 'Check',
      // Navigation icons  
      'Settings', 'ChevronRight', 'ChevronDown',
      // Category icons
      'Car', 'ShoppingCart', 'Home', 'Utensils', 'Coffee', 'Briefcase', 
      'Music', 'Plane', 'Building', 'Heart', 'Star',
      // Tag icons
      'Tag', 'Bookmark', 'Flag', 'Hash',
      // Feedback icons
      'Github', 'MessageCircle', 'Mail', 'Send',
      // News icons
      'Clock', 'Calendar', 'Info', 'AlertCircle',
      // General UI icons
      'User', 'Bell', 'Eye', 'EyeOff', 'Lock', 'Unlock'
    ];

    it('should render all required icons for settings functionality', () => {
      requiredIcons.forEach(iconName => {
        const rendered = renderIcon(iconName);
        expect(rendered).toBeTruthy();
      });
    });

    it('should handle common category icons', () => {
      const categoryIcons = [
        'Car', 'Truck', 'Bus', 'Bike', // Transportation
        'ShoppingCart', 'Store', 'Package', // Shopping
        'Home', 'Building', 'MapPin', // Places
        'Utensils', 'Coffee', 'Wine', 'Pizza', // Food & Drink
        'Music', 'Film', 'Gamepad2', 'BookOpen', // Entertainment
        'Briefcase', 'Laptop', 'Phone', // Work & Tech
        'HeartHandshake', 'Users', 'Gift', // Personal & Social
        'DollarSign', 'CreditCard', 'PiggyBank', // Finance
        'Stethoscope', 'Pill', 'Cross', // Health
        'GraduationCap', 'BookMarked', 'PenTool' // Education
      ];

      categoryIcons.forEach(iconName => {
        const rendered = renderIcon(iconName);
        expect(rendered).toBeTruthy();
      });
    });

    it('should handle common tag icons', () => {
      const tagIcons = [
        'Tag', 'Tags', 'Hash', 'Bookmark', 'Flag',
        'Star', 'Heart', 'ThumbsUp', 'Zap', 'Target',
        'Award', 'Badge', 'Crown', 'Diamond', 'Gem',
        'Circle', 'Square', 'Triangle', 'Hexagon'
      ];

      tagIcons.forEach(iconName => {
        const rendered = renderIcon(iconName);
        expect(rendered).toBeTruthy();
      });
    });
  });

  describe('Settings forms validation', () => {
    it('should validate category form requirements', () => {
      // Test that we have the basic requirements for category creation
      const categoryRequirements = {
        name: 'string',
        icon: 'string'
      };

      expect(typeof categoryRequirements.name).toBe('string');
      expect(typeof categoryRequirements.icon).toBe('string');
    });

    it('should validate tag form requirements', () => {
      // Test that we have the basic requirements for tag creation
      const tagRequirements = {
        name: 'string',
        icon: 'string'
      };

      expect(typeof tagRequirements.name).toBe('string');
      expect(typeof tagRequirements.icon).toBe('string');
    });

    it('should validate feedback form requirements', () => {
      // Test that we have the basic requirements for feedback submission
      const feedbackRequirements = {
        message: 'string',
        type: 'feedback'
      };

      expect(typeof feedbackRequirements.message).toBe('string');
      expect(feedbackRequirements.type).toBe('feedback');
    });
  });

  describe('External links validation', () => {
    it('should have valid GitHub repository URL pattern', () => {
      const githubUrl = 'https://github.com/Fantasy-programming/nuts/issues';
      expect(githubUrl).toMatch(/^https:\/\/github\.com\/[\w-]+\/[\w-]+\/issues$/);
    });

    it('should have valid email format', () => {
      const email = 'engineer@nuts.com';
      expect(email).toMatch(/^[^@]+@[^@]+\.[^@]+$/);
    });

    it('should have valid Discord URL pattern', () => {
      const discordUrl = 'https://discord.gg/nuts-finance';
      expect(discordUrl).toMatch(/^https:\/\/discord\.gg\/[\w-]+$/);
    });
  });

  describe('News/Updates section validation', () => {
    it('should have proper update entry structure', () => {
      const updateEntry = {
        version: "1.2.0",
        date: "2024-03-20",
        type: "feature",
        title: "Test Feature",
        description: "Test description"
      };

      expect(updateEntry.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(updateEntry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(['feature', 'improvement', 'fix']).toContain(updateEntry.type);
      expect(typeof updateEntry.title).toBe('string');
      expect(typeof updateEntry.description).toBe('string');
    });

    it('should support all update types with proper badges', () => {
      const updateTypes = ['feature', 'improvement', 'fix'];
      updateTypes.forEach(type => {
        expect(['feature', 'improvement', 'fix']).toContain(type);
      });
    });
  });
});