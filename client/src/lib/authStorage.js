// src/utils/authStorage.js
const AUTH_KEY = 'password_manager_auth';

export const authStorage = {
  saveSession: (masterPassword, remember = false) => {
    const authData = {
      masterPassword,
      timestamp: new Date().getTime(),
    };

    if (remember) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
    } else {
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(authData));
    }
  },

  clear: () => {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
  },

  get: () => {
    const sessionData = sessionStorage.getItem(AUTH_KEY);
    const localData = localStorage.getItem(AUTH_KEY);
    
    if (sessionData) {
      return JSON.parse(sessionData);
    }
    
    if (localData) {
      // Also save to session storage to maintain session
      sessionStorage.setItem(AUTH_KEY, localData);
      return JSON.parse(localData);
    }
    
    return null;
  },

  isAuthenticated: () => {
    return !!authStorage.get();
  }
};

export default authStorage;