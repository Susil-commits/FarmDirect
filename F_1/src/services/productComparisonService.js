
import { API_BASE_URL } from './api.js';
import { getAccessToken } from '../utils/tokenStore.js';

export const productComparisonService = {
  
  compareCrops: async (cropIds) => {
    try {
      const response = await fetch(`${API_BASE_URL}/crops/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cropIds }),
      });

      if (!response.ok) throw new Error('Failed to fetch comparison');
      return await response.json();
    } catch (error) {
      console.error('Compare crops error:', error);
      throw error;
    }
  },

  getComparisonFields: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/crops/comparison-fields`);

      if (!response.ok) throw new Error('Failed to fetch fields');
      return await response.json();
    } catch (error) {
      console.error('Get comparison fields error:', error);
      throw error;
    }
  },

  saveComparison: async (data) => {
    try {
      const token = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/comparisons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to save comparison');
      return await response.json();
    } catch (error) {
      console.error('Save comparison error:', error);
      throw error;
    }
  },

  getSavedComparisons: async () => {
    try {
      const token = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/comparisons`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch comparisons');
      return await response.json();
    } catch (error) {
      console.error('Get saved comparisons error:', error);
      throw error;
    }
  },

  deleteComparison: async (comparisonId) => {
    try {
      const token = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/comparisons/${comparisonId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete comparison');
      return await response.json();
    } catch (error) {
      console.error('Delete comparison error:', error);
      throw error;
    }
  },

  exportComparison: async (comparisonId) => {
    try {
      const token = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/comparisons/${comparisonId}/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to export');
      return await response.blob();
    } catch (error) {
      console.error('Export comparison error:', error);
      throw error;
    }
  },
};
