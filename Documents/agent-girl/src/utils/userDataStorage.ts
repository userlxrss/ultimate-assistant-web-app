/**
 * User Data Storage Utility
 * Simple fallback for emergency recovery
 */

export const userDataStorage = {
  // Get data
  getData: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Failed to get data:', error);
      return null;
    }
  },

  // Set data
  setData: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Failed to set data:', error);
    }
  },

  // Remove data
  removeData: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove data:', error);
    }
  },

  // Clear all data
  clearAll: () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }
};