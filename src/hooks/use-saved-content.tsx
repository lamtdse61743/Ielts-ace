'use client';

import type { SavedContent } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface SavedContentContextType {
  savedItems: SavedContent[];
  addSavedItem: (item: SavedContent) => void;
  removeSavedItem: (id: string) => void;
  isSaved: (id: string) => boolean;
}

const SavedContentContext = createContext<SavedContentContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'ielts-ace-saved-content';

export function SavedContentProvider({ children }: { children: React.ReactNode }) {
  const [savedItems, setSavedItems] = useState<SavedContent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const items = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (items) {
        setSavedItems(JSON.parse(items));
      }
    } catch (error) {
      console.error('Failed to load saved content from localStorage', error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedItems));
      } catch (error) {
        console.error('Failed to save content to localStorage', error);
      }
    }
  }, [savedItems, isLoaded]);

  const addSavedItem = useCallback((item: SavedContent) => {
    setSavedItems((prevItems) => [...prevItems, item]);
  }, []);

  const removeSavedItem = useCallback((id: string) => {
    setSavedItems((prevItems) => prevItems.filter((item) => item.id !== id));
  }, []);

  const isSaved = useCallback((id: string) => {
    return savedItems.some((item) => item.id === id);
  }, [savedItems]);

  const value = { savedItems, addSavedItem, removeSavedItem, isSaved };

  return (
    <SavedContentContext.Provider value={value}>
      {children}
    </SavedContentContext.Provider>
  );
}

export function useSavedContent() {
  const context = useContext(SavedContentContext);
  if (context === undefined) {
    throw new Error('useSavedContent must be used within a SavedContentProvider');
  }
  return context;
}
