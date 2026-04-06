/**
 * Product Comparison Service
 * Handles comparing crops/products side-by-side
 */
import { API_BASE_URL } from './api.js';

export const productComparisonService = {
  /**
   * Get comparison data for multiple crops
   * @param {array} cropIds - Array of crop IDs to compare
   */
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

  /**
   * Get comparison fields/attributes available
   */
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

  /**
   * Save comparison for user
   * @param {object} data - Comparison data
   */
  saveComparison: async (data) => {
    try {
      const token = localStorage.getItem('token');
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

  /**
   * Get saved comparisons for user
   */
  getSavedComparisons: async () => {
    try {
      const token = localStorage.getItem('token');
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

  /**
   * Delete saved comparison
   * @param {string} comparisonId - Comparison ID
   */
  deleteComparison: async (comparisonId) => {
    try {
      const token = localStorage.getItem('token');
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

  /**
   * Export comparison as PDF
   * @param {string} comparisonId - Comparison ID
   */
  exportComparison: async (comparisonId) => {
    try {
      const token = localStorage.getItem('token');
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
