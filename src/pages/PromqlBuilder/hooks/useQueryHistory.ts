import { useState, useCallback, useEffect } from 'react';

interface QueryEntry {
  query: string;
  timestamp: number;
  id: string;
}

const QUERY_HISTORY_KEY = 'query-history';
const QUERY_UPDATED_EVENT = 'queryHistoryUpdated';

const createQueryUpdateEvent = () => new CustomEvent(QUERY_UPDATED_EVENT);

const useQueryHistory = () => {
  const [queries, setQueries] = useState<QueryEntry[]>();

  const loadQueries = useCallback(() => {
    const storedQueries = localStorage.getItem(QUERY_HISTORY_KEY);
    if (storedQueries && storedQueries !== 'undefined') {
      setQueries(JSON.parse(storedQueries));
    }
  }, []);

  useEffect(() => {
    loadQueries();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === QUERY_HISTORY_KEY) {
        loadQueries();
      }
    };

    const handleCustomEvent = () => {
      loadQueries();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(QUERY_UPDATED_EVENT, handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(QUERY_UPDATED_EVENT, handleCustomEvent);
    };
  }, [loadQueries]);

  const addQuery = useCallback((query: string) => {
    const storedQueries = localStorage.getItem(QUERY_HISTORY_KEY);
    const currentQueries: QueryEntry[] =
      storedQueries && storedQueries !== 'undefined' ? JSON.parse(storedQueries) : [];

    // Check for existing query
    const existingIndex = currentQueries.findIndex((existing) => existing.query === query);

    if (existingIndex !== -1) {
      // Update existing query with new timestamp
      const updatedQueries = [...currentQueries];
      updatedQueries[existingIndex] = {
        ...updatedQueries[existingIndex],
        timestamp: Date.now()
      };

      // Move the updated query to the top
      const [updatedQuery] = updatedQueries.splice(existingIndex, 1);
      updatedQueries.unshift(updatedQuery);

      localStorage.setItem(QUERY_HISTORY_KEY, JSON.stringify(updatedQueries));
      window.dispatchEvent(createQueryUpdateEvent());

      return;
    }

    // Add new query
    const newEntry: QueryEntry = {
      query,
      timestamp: Date.now(),
      id: crypto.randomUUID()
    };

    const updatedQueries = [newEntry, ...currentQueries].slice(0, 100);
    localStorage.setItem(QUERY_HISTORY_KEY, JSON.stringify(updatedQueries));
    window.dispatchEvent(createQueryUpdateEvent());
  }, []);

  const deleteQuery = useCallback((id: string) => {
    setQueries((prevQueries) => {
      if (!prevQueries) {
        return prevQueries;
      }
      const updatedQueries = prevQueries.filter((query) => query.id !== id);
      localStorage.setItem(QUERY_HISTORY_KEY, JSON.stringify(updatedQueries));
      window.dispatchEvent(createQueryUpdateEvent());

      return updatedQueries;
    });
  }, []);

  const clearQueries = useCallback(() => {
    localStorage.removeItem(QUERY_HISTORY_KEY);
    setQueries(undefined);
    window.dispatchEvent(createQueryUpdateEvent());
  }, []);

  const searchQueries = useCallback(
    (searchTerm: string) =>
      queries?.filter((entry) => entry.query.toLowerCase().includes(searchTerm.toLowerCase())) || [],
    [queries]
  );

  return {
    queries,
    addQuery,
    deleteQuery,
    clearQueries,
    searchQueries
  };
};

export default useQueryHistory;
