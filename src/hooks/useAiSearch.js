import { useState } from 'react';

export default function useAISearch(items) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = async (query) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, products: items }),
      });
      const data = await res.json();
      return data.results || [];
    } catch (e) {
      setError(e.message || 'Search failed');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { search, loading, error };
}