/**
 * Session Timeout Utilities
 * 
 * Handles automatic session timeout and activity tracking
 */

import { authService } from '../services/AuthService';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIMEOUT = 25 * 60 * 1000; // 25 minutes (5 min warning)

let inactivityTimer: NodeJS.Timeout | null = null;
let warningTimer: NodeJS.Timeout | null = null;
let onWarningCallback: (() => void) | null = null;
let onTimeoutCallback: (() => void) | null = null;

/**
 * Reset the inactivity timer
 */
export function resetInactivityTimer() {
  clearTimers();

  if (authService.isAuthenticated()) {
    // Set warning timer
    warningTimer = setTimeout(() => {
      if (onWarningCallback) {
        onWarningCallback();
      }
    }, WARNING_TIMEOUT);

    // Set timeout timer
    inactivityTimer = setTimeout(() => {
      authService.logout();
      if (onTimeoutCallback) {
        onTimeoutCallback();
      }
    }, INACTIVITY_TIMEOUT);
  }
}

/**
 * Clear all timers
 */
function clearTimers() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  if (warningTimer) {
    clearTimeout(warningTimer);
    warningTimer = null;
  }
}

/**
 * Set up activity listeners
 */
export function setupActivityListeners() {
  if (typeof window === 'undefined') return;

  const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

  events.forEach(event => {
    window.addEventListener(event, resetInactivityTimer);
  });

  // Initial timer setup
  resetInactivityTimer();

  // Cleanup function
  return () => {
    events.forEach(event => {
      window.removeEventListener(event, resetInactivityTimer);
    });
    clearTimers();
  };
}

/**
 * Set callback for warning
 */
export function onSessionWarning(callback: () => void) {
  onWarningCallback = callback;
}

/**
 * Set callback for timeout
 */
export function onSessionTimeout(callback: () => void) {
  onTimeoutCallback = callback;
}

/**
 * Stop session timeout tracking
 */
export function stopSessionTimeout() {
  clearTimers();
  onWarningCallback = null;
  onTimeoutCallback = null;
}
