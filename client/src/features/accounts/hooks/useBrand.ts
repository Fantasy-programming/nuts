import { useState, useEffect, useCallback } from 'react';

type TBrandResult = {
  name: string;
  domain: string;
  icon: string;
};

interface UseBrandImageReturn {
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useBrandImage = (brandName: string, clientId: string): UseBrandImageReturn => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrandImage = useCallback(async (searchTerm: string, cId: string) => {
    if (!searchTerm.trim() || !cId.trim()) {
      setImageUrl(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = `https://api.brandfetch.io/v2/search/${encodeURIComponent(searchTerm)}?c=${encodeURIComponent(cId)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TBrandResult[] = await response.json();

      if (data && data.length > 0 && data[0].icon) {
        setImageUrl(data[0].icon);
      } else {
        setImageUrl(null);
        setError('No brand image found');
      }
    } catch (err) {
      console.error('Brand fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch brand image');
      setImageUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrandImage(brandName, clientId);
  }, [fetchBrandImage, brandName, clientId]);

  return { imageUrl, isLoading, error };
};
