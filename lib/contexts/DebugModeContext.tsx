/**
 * Debug Mode Context
 * 
 * Global state management for transaction debug visualization
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TransactionDebugData, DebugModeSettings } from '@/types/debug';

interface DebugModeContextType {
  // Settings
  settings: DebugModeSettings;
  updateSettings: (settings: Partial<DebugModeSettings>) => void;
  toggleDebugMode: () => void;
  
  // Current debug data
  currentDebugData: TransactionDebugData | null;
  setCurrentDebugData: (data: TransactionDebugData | null) => void;
  
  // Modal state
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  
  // History
  debugHistory: TransactionDebugData[];
  addToHistory: (data: TransactionDebugData) => void;
  clearHistory: () => void;
}

const DebugModeContext = createContext<DebugModeContextType | undefined>(undefined);

const DEFAULT_SETTINGS: DebugModeSettings = {
  enabled: false,
  autoShow: true,
  layout: 'horizontal',
  colorScheme: 'combined',
  showBalances: true,
  showAccountCodes: true,
  showTransactionNumbers: true,
  animateFlows: true,
};

const STORAGE_KEY = 'snm_debug_mode_settings';
const HISTORY_KEY = 'snm_debug_history';
const MAX_HISTORY = 10;

export function DebugModeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<DebugModeSettings>(DEFAULT_SETTINGS);
  const [currentDebugData, setCurrentDebugData] = useState<TransactionDebugData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [debugHistory, setDebugHistory] = useState<TransactionDebugData[]>([]);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
        
        const historyStored = localStorage.getItem(HISTORY_KEY);
        if (historyStored) {
          const parsed = JSON.parse(historyStored);
          setDebugHistory(parsed);
        }
      } catch (error) {
        console.error('Error loading debug mode settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage when changed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('Error saving debug mode settings:', error);
      }
    }
  }, [settings]);

  // Save history to localStorage when changed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(debugHistory));
      } catch (error) {
        console.error('Error saving debug history:', error);
      }
    }
  }, [debugHistory]);

  // Keyboard shortcut: Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        toggleDebugMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.enabled]);

  const updateSettings = (newSettings: Partial<DebugModeSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleDebugMode = () => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const addToHistory = (data: TransactionDebugData) => {
    setDebugHistory(prev => {
      const newHistory = [data, ...prev].slice(0, MAX_HISTORY);
      return newHistory;
    });
  };

  const clearHistory = () => {
    setDebugHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(HISTORY_KEY);
    }
  };

  const value: DebugModeContextType = {
    settings,
    updateSettings,
    toggleDebugMode,
    currentDebugData,
    setCurrentDebugData,
    isModalOpen,
    openModal,
    closeModal,
    debugHistory,
    addToHistory,
    clearHistory,
  };

  return (
    <DebugModeContext.Provider value={value}>
      {children}
    </DebugModeContext.Provider>
  );
}

export function useDebugMode() {
  const context = useContext(DebugModeContext);
  if (context === undefined) {
    throw new Error('useDebugMode must be used within a DebugModeProvider');
  }
  return context;
}
